import sys
import json
import sqlite3
import os
import re
import math
import hashlib
import tempfile
from typing import List, Dict, Tuple, Optional, Any
import numpy as np

# Optional GenAI SDK import
try:
    from google import genai
    from google.genai import types
    has_genai = True
except ImportError:
    has_genai = False


class ScientificCrystallographyRAG:
    """
    Enterprise Hybrid Crystallography & Materials Physics RAG Engine (v2.5).
    Combines:
      1. Persistent Disk-Cached SQLite FTS5 BM25 lexical, formula & symmetry indexing over 1,250+ materials.
      2. Vectorized Pseudo-Voigt continuous Bragg spectrum embeddings (850-D) with fast matrix cosine similarity.
      3. Exact Bragg-Law strain kinematics: 2θ(ε) = 2 * arcsin(sin(θ_0) / (1 + ε)) instead of linear approximation.
      4. Hanawalt Top-3 d-spacing Search-Match & Smith-Snyder Figure-of-Merit (F_N) scoring.
      5. Reciprocal Rank Fusion (RRF) combining BM25 lexical rank, Pseudo-Voigt spectral rank, and Hanawalt d-spacing rank.
      6. Automatic natural-language 2θ / d-spacing peak extraction from user text queries.
    """

    GRID_MIN_2THETA = 5.0
    GRID_MAX_2THETA = 90.0
    GRID_POINTS = 850
    DEFAULT_WAVELENGTH = 1.540598  # Cu Kα1 (Å)

    def __init__(self, materials_json_path: Optional[str] = None):
        self.grid_2theta = np.linspace(self.GRID_MIN_2THETA, self.GRID_MAX_2THETA, self.GRID_POINTS, dtype=np.float32)
        self.materials_list: List[Dict[str, Any]] = []
        self.spectral_meta: List[Dict[str, Any]] = []
        self.spectral_matrix: Optional[np.ndarray] = None  # Shape: (N, 850)

        self.source_files = self._resolve_source_files(materials_json_path)
        self.cache_key = self._compute_cache_fingerprint(self.source_files)
        self.db_path = os.path.join(tempfile.gettempdir(), f"xrd_rag_fts5_{self.cache_key}.sqlite")
        self.npz_path = os.path.join(tempfile.gettempdir(), f"xrd_rag_spec_{self.cache_key}.npz")

        self.conn: Optional[sqlite3.Connection] = None
        self._init_or_load_cached_index()

    def _resolve_source_files(self, custom_path: Optional[str] = None) -> List[str]:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(base_dir))
        candidates = [
            custom_path,
            os.path.join(base_dir, "..", "materials_extracted.json"),
            os.path.join(root_dir, "utils", "materials_extracted.json"),
            os.path.join(os.getcwd(), "utils", "materials_extracted.json")
        ]
        found = []
        for c in candidates:
            if c and os.path.exists(c):
                found.append(os.path.abspath(c))
                break

        learned_candidates = [
            os.path.join(root_dir, "learned_materials.json"),
            os.path.join(os.getcwd(), "learned_materials.json")
        ]
        for lc in learned_candidates:
            if os.path.exists(lc):
                found.append(os.path.abspath(lc))
                break
        return found

    def _compute_cache_fingerprint(self, files: List[str]) -> str:
        h = hashlib.sha256()
        h.update(b"xrd_rag_v2.5")
        for fpath in files:
            try:
                st = os.stat(fpath)
                h.update(f"{fpath}:{st.st_mtime_ns}:{st.st_size}".encode("utf-8"))
            except OSError:
                pass
        return h.hexdigest()[:16]

    def _init_or_load_cached_index(self):
        if os.path.exists(self.db_path) and os.path.exists(self.npz_path):
            try:
                self.conn = sqlite3.connect(self.db_path)
                cursor = self.conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM materials")
                count = cursor.fetchone()[0]
                if count > 0:
                    npz_data = np.load(self.npz_path, allow_pickle=False)
                    self.spectral_matrix = npz_data["spectral_matrix"]
                    cursor.execute(
                        "SELECT id, name, formula, category, crystal_system, space_group, density, description, peaks_json FROM materials ORDER BY id ASC"
                    )
                    self.spectral_meta = []
                    for r in cursor.fetchall():
                        peaks = json.loads(r[8]) if r[8] else []
                        self.spectral_meta.append({
                            "id": r[0],
                            "name": r[1],
                            "formula": r[2],
                            "category": r[3],
                            "crystal_system": r[4],
                            "space_group": r[5],
                            "density": r[6],
                            "description": r[7],
                            "peaks": peaks
                        })
                    self.materials_list = self.spectral_meta
                    return
            except Exception:
                try:
                    if self.conn:
                        self.conn.close()
                except Exception:
                    pass

        try:
            if os.path.exists(self.db_path):
                os.remove(self.db_path)
            self.conn = sqlite3.connect(self.db_path)
        except Exception:
            self.conn = sqlite3.connect(":memory:")

        self._create_tables()
        self._load_and_index_materials()

    def _create_tables(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                formula TEXT,
                category TEXT,
                crystal_system TEXT,
                space_group TEXT,
                density REAL,
                description TEXT,
                pattern_raw TEXT,
                peaks_json TEXT
            )
        """)
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS materials_fts USING fts5(
                name,
                formula,
                category,
                crystal_system,
                space_group,
                description,
                content='materials',
                content_rowid='id',
                tokenize='unicode61 remove_diacritics 2'
            )
        """)
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS scientific_literature USING fts5(
                topic,
                category,
                keywords,
                content,
                tokenize='unicode61 remove_diacritics 2'
            )
        """)
        self.conn.commit()

    @classmethod
    def compute_pseudo_voigt_spectrum(
        cls,
        peaks: List[Dict[str, Any]],
        grid: np.ndarray,
        sigma: float = 0.32,
        eta: float = 0.35,
        strain: float = 0.0
    ) -> np.ndarray:
        spectrum = np.zeros(len(grid), dtype=np.float32)
        if not peaks:
            return spectrum

        gamma = max(0.05, sigma * 1.17741)
        inv_two_sigma_sq = 1.0 / (2.0 * max(0.05, sigma) ** 2)

        for p in peaks:
            pos0 = float(p.get("two_theta", p.get("twoTheta", p.get("2theta", 0.0))))
            inten = float(p.get("intensity", 100.0))
            if pos0 <= 0.5 or pos0 >= 179.0 or inten <= 0:
                continue

            if abs(strain) > 1e-7:
                theta0_rad = math.radians(pos0 * 0.5)
                sin_shifted = math.sin(theta0_rad) / max(0.2, 1.0 + strain)
                if abs(sin_shifted) >= 0.9999:
                    continue
                pos = math.degrees(2.0 * math.asin(sin_shifted))
            else:
                pos = pos0

            if cls.GRID_MIN_2THETA <= pos <= cls.GRID_MAX_2THETA:
                dx = grid - pos
                gauss = np.exp(-(dx * dx) * inv_two_sigma_sq)
                lorentz = 1.0 / (1.0 + (dx / gamma) ** 2)
                spectrum += inten * ((1.0 - eta) * gauss + eta * lorentz)

        norm = float(np.linalg.norm(spectrum))
        if norm > 1e-9:
            spectrum /= norm
        return spectrum

    def _load_and_index_materials(self):
        loaded_materials: List[Dict[str, Any]] = []
        seen_names = set()

        for fpath in self.source_files:
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get("name"):
                                key = item["name"].strip().lower()
                                if key not in seen_names:
                                    seen_names.add(key)
                                    loaded_materials.append(item)
            except Exception as e:
                print(f"Warning: Failed reading {fpath}: {e}", file=sys.stderr)

        if not loaded_materials:
            loaded_materials = self._get_curated_seed_materials()

        cursor = self.conn.cursor()
        rows_to_insert = []
        self.spectral_meta = []
        vectors_list = []

        for idx, m in enumerate(loaded_materials):
            name = str(m.get("name", f"Material-{idx+1}"))
            formula = str(m.get("formula", ""))
            category = str(m.get("category", m.get("type", "Crystalline Phase")))
            crystal_system = str(m.get("crystal_system", m.get("crystalSystem", "Unknown")))
            space_group = str(m.get("space_group", m.get("spaceGroup", "Unknown")))
            density_raw = m.get("density", None)
            try:
                density = float(density_raw) if density_raw is not None else None
            except (ValueError, TypeError):
                density = None
            description = str(m.get("description", ""))
            pattern_raw = str(m.get("pattern", ""))

            peaks = self._parse_pattern_to_peaks(pattern_raw, m.get("peaks"))
            if not peaks:
                continue

            peaks_json = json.dumps(peaks)
            rows_to_insert.append((
                name, formula, category, crystal_system, space_group,
                density, description, pattern_raw, peaks_json
            ))

            vec = self.compute_pseudo_voigt_spectrum(peaks, self.grid_2theta)
            vectors_list.append(vec)
            self.spectral_meta.append({
                "id": len(self.spectral_meta) + 1,
                "name": name,
                "formula": formula,
                "category": category,
                "crystal_system": crystal_system,
                "space_group": space_group,
                "density": density,
                "description": description,
                "peaks": peaks
            })

        cursor.executemany("""
            INSERT INTO materials (name, formula, category, crystal_system, space_group, density, description, pattern_raw, peaks_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows_to_insert)

        cursor.execute("""
            INSERT INTO materials_fts (rowid, name, formula, category, crystal_system, space_group, description)
            SELECT id, name, formula, category, crystal_system, space_group, description FROM materials
        """)
        self.conn.commit()
        self._seed_scientific_literature()

        if vectors_list:
            self.spectral_matrix = np.vstack(vectors_list).astype(np.float32)
        else:
            self.spectral_matrix = np.zeros((0, self.GRID_POINTS), dtype=np.float32)

        self.materials_list = self.spectral_meta
        try:
            np.savez_compressed(self.npz_path, spectral_matrix=self.spectral_matrix)
        except Exception:
            pass

    def _parse_pattern_to_peaks(self, pattern_str: str, structured_peaks: Any = None) -> List[Dict[str, Any]]:
        peaks: List[Dict[str, Any]] = []
        if isinstance(structured_peaks, list) and len(structured_peaks) > 0:
            for sp in structured_peaks:
                if isinstance(sp, dict):
                    try:
                        tt = float(sp.get("twoTheta", sp.get("two_theta", 0.0)))
                        inten = float(sp.get("intensity", 100.0))
                        if 2.0 <= tt <= 175.0:
                            theta_rad = math.radians(tt * 0.5)
                            d_val = self.DEFAULT_WAVELENGTH / (2.0 * math.sin(theta_rad)) if theta_rad > 0 else 0.0
                            pk: Dict[str, Any] = {
                                "two_theta": round(tt, 4),
                                "intensity": round(inten, 2),
                                "d_spacing": round(d_val, 4)
                            }
                            if "h" in sp and "k" in sp and "l" in sp:
                                pk["hkl"] = [int(sp["h"]), int(sp["k"]), int(sp["l"])]
                            peaks.append(pk)
                    except Exception:
                        continue
            if peaks:
                return peaks

        if not pattern_str:
            return peaks

        normalized_str = pattern_str.replace("\\r\\n", "\n").replace("\\n", "\n")
        for line in re.split(r"[\r\n;]+", normalized_str.strip()):
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split(",")]
            try:
                m_2th = re.search(r"(\d+(?:\.\d+)?)", parts[0])
                if not m_2th:
                    continue
                two_theta = float(m_2th.group(1))
                if two_theta <= 1.0 or two_theta >= 178.0:
                    continue
                intensity = 100.0
                if len(parts) > 1:
                    m_int = re.search(r"(\d+(?:\.\d+)?)", parts[1])
                    if m_int:
                        intensity = min(100.0, max(0.1, float(m_int.group(1))))
                theta_rad = math.radians(two_theta * 0.5)
                d_spacing = self.DEFAULT_WAVELENGTH / (2.0 * math.sin(theta_rad)) if theta_rad > 0 else 0.0
                peak_dict: Dict[str, Any] = {
                    "two_theta": round(two_theta, 4),
                    "intensity": round(intensity, 2),
                    "d_spacing": round(d_spacing, 4)
                }
                if len(parts) >= 5:
                    try:
                        peak_dict["hkl"] = [int(parts[2]), int(parts[3]), int(parts[4])]
                    except Exception:
                        pass
                peaks.append(peak_dict)
            except Exception:
                continue
        return peaks

    def _seed_scientific_literature(self):
        docs = [
            (
                "Scherrer Crystallite Size Broadening and Shape Factor K",
                "Line Profile Analysis",
                "scherrer crystallite size fwhm shape factor peak broadening k volume weighted",
                "The Scherrer equation D = (K * λ) / (β * cos(θ)) calculates the volume-weighted mean crystallite column length."
            ),
            (
                "Williamson-Hall Anisotropic Size-Strain Decomposition (UDM, USDM, UDEDM, SSP)",
                "Microstrain Analysis",
                "williamson hall udm usdm udedm ssp halder wagner microstrain lattice distortion dislocation density youngs modulus",
                "The Williamson-Hall method deconvolves crystallite size and microstrain broadening: β_hkl * cos(θ) = (K * λ / D) + 4 * ε * sin(θ)."
            ),
            (
                "Hanawalt Search-Match & Smith-Snyder Figure of Merit (F_N)",
                "Phase Identification",
                "hanawalt search match figure of merit de wolff m20 smith snyder fn indexing",
                "The Hanawalt qualitative phase identification protocol categorizes reference patterns by their three strongest reflections (d1, d2, d3)."
            )
        ]
        cursor = self.conn.cursor()
        cursor.executemany("""
            INSERT INTO scientific_literature (topic, category, keywords, content)
            VALUES (?, ?, ?, ?)
        """, docs)
        self.conn.commit()

    def _get_curated_seed_materials(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "Quartz (Alpha-SiO2)",
                "formula": "SiO2",
                "category": "Minerals, Ores & Geology",
                "crystal_system": "Hexagonal / Trigonal",
                "space_group": "P3121",
                "density": 2.65,
                "description": "Alpha-quartz silica structure with trigonal symmetry.",
                "pattern": "20.85, 35, 1, 0, 0\n26.64, 100, 1, 0, 1\n36.54, 12, 1, 1, 0\n50.14, 14, 1, 1, 2\n59.96, 9, 2, 1, 1"
            }
        ]

    @staticmethod
    def extract_peaks_from_natural_query(query: str) -> List[Dict[str, float]]:
        if not query:
            return []
        matches = re.findall(r"(?<!\w)(\d{1,3}(?:\.\d{1,4})?)\s*(?:deg|°|2theta|2θ|,|;|\s+and\s+)", query, flags=re.IGNORECASE)
        if len(matches) < 2:
            csv_nums = re.findall(r"\b(\d{2}\.\d{1,3})\b", query)
            if len(csv_nums) >= 2:
                matches = csv_nums
        extracted: List[Dict[str, float]] = []
        seen = set()
        for idx, m in enumerate(matches):
            try:
                val = float(m)
                if 5.0 <= val <= 140.0:
                    rounded = round(val, 2)
                    if rounded not in seen:
                        seen.add(rounded)
                        default_int = 100.0 if idx == 0 else max(25.0, 90.0 - idx * 15.0)
                        extracted.append({"two_theta": val, "intensity": default_int})
            except ValueError:
                continue
        return extracted if len(extracted) >= 2 else []

    def _expand_query_synonyms(self, query: str) -> List[str]:
        SYNONYMS = {
            "quartz": ["SiO2", "silica", "alpha-quartz"],
            "titania": ["TiO2", "titanium dioxide", "anatase", "rutile"],
            "anatase": ["TiO2", "tetragonal", "I41/amd"],
            "rutile": ["TiO2", "P42/mnm"],
            "alumina": ["Al2O3", "corundum", "R-3c"],
            "silicon": ["Si", "SRM 640"]
        }
        q_lower = query.lower()
        expanded_terms = []
        for key, syns in SYNONYMS.items():
            if key in q_lower:
                expanded_terms.extend(syns)
        return list(dict.fromkeys(expanded_terms))

    def retrieve_text_fts(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        if not self.conn:
            return []
        cursor = self.conn.cursor()
        STOP_WORDS = {"the", "a", "an", "and", "or", "of", "in", "to", "for", "with", "is", "are", "show", "me", "find", "search", "material", "materials", "phase", "peaks"}
        words = [w for w in re.split(r"[^\w\d.-]+", query) if w and len(w) > 1]
        keywords = [w for w in words if w.lower() not in STOP_WORDS and not re.match(r"^\d+(\.\d+)?$", w)]
        if not keywords:
            return []
        synonyms = self._expand_query_synonyms(query)
        all_terms = list(dict.fromkeys(keywords + synonyms[:5]))
        fts_clauses = []
        for term in all_terms:
            clean_t = re.sub(r"[^\w\d]", "", term)
            if clean_t:
                fts_clauses.append(f'"{clean_t}"*')
                fts_clauses.append(f'"{clean_t}"')
        if not fts_clauses:
            return []
        fts_query = " OR ".join(fts_clauses)
        results = []
        try:
            cursor.execute("""
                SELECT m.id, m.name, m.formula, m.category, m.crystal_system, m.space_group,
                       m.density, m.description, m.peaks_json,
                       bm25(materials_fts, 10.0, 12.0, 2.0, 3.0, 4.0, 1.5) as rank
                FROM materials_fts fts
                JOIN materials m ON m.id = fts.rowid
                WHERE materials_fts MATCH ?
                ORDER BY rank ASC
                LIMIT ?
            """, (fts_query, limit))
            for r in cursor.fetchall():
                peaks = json.loads(r[8]) if r[8] else []
                results.append({
                    "id": r[0], "name": r[1], "formula": r[2], "category": r[3],
                    "crystal_system": r[4], "space_group": r[5], "density": r[6],
                    "description": r[7], "peaks": peaks, "retrieval_method": "bm25_fts",
                    "bm25_score": round(float(-r[9]) if r[9] is not None else 1.0, 4),
                    "score": round(float(-r[9]) if r[9] is not None else 1.0, 4)
                })
        except Exception:
            pass
        return results

    @classmethod
    def compute_hanawalt_fom(cls, exp_peaks: List[Dict[str, Any]], ref_peaks: List[Dict[str, Any]]) -> Tuple[float, int]:
        if not exp_peaks or not ref_peaks:
            return 0.0, 0
        exp_d_list = []
        for p in exp_peaks:
            tt = float(p.get("two_theta", p.get("twoTheta", p.get("2theta", 0.0))))
            inten = float(p.get("intensity", 100.0))
            if 2.0 <= tt <= 175.0:
                d_val = cls.DEFAULT_WAVELENGTH / (2.0 * math.sin(math.radians(tt * 0.5)))
                exp_d_list.append((d_val, inten, tt))
        if not exp_d_list:
            return 0.0, 0
        sorted_ref = sorted(ref_peaks, key=lambda x: float(x.get("intensity", 0.0)), reverse=True)
        top_ref = sorted_ref[:min(6, len(sorted_ref))]
        matched_count = 0
        weighted_score = 0.0
        total_weight = 0.0
        for idx, rp in enumerate(top_ref):
            ref_tt = float(rp.get("two_theta", 0.0))
            if ref_tt <= 1.0:
                continue
            ref_d = float(rp.get("d_spacing") or (cls.DEFAULT_WAVELENGTH / (2.0 * math.sin(math.radians(ref_tt * 0.5)))))
            line_weight = 3.0 if idx == 0 else (2.2 if idx == 1 else (1.8 if idx == 2 else 1.0))
            total_weight += line_weight
            best_rel_err = min(abs(exp_d - ref_d) / max(0.5, ref_d) for exp_d, _, _ in exp_d_list)
            if best_rel_err <= 0.022:
                matched_count += 1
                weighted_score += line_weight * max(0.0, 1.0 - (best_rel_err / 0.022))
        fom = (weighted_score / total_weight) * 100.0 if total_weight > 0 else 0.0
        return round(float(fom), 2), matched_count

    def retrieve_by_peaks(self, experimental_peaks: List[Dict[str, float]], top_k: int = 5) -> List[Dict[str, Any]]:
        if not experimental_peaks or self.spectral_matrix is None or len(self.spectral_meta) == 0:
            return []
        exp_vec = self.compute_pseudo_voigt_spectrum(experimental_peaks, self.grid_2theta)
        if float(np.linalg.norm(exp_vec)) < 1e-8:
            return []
        raw_sims = self.spectral_matrix @ exp_vec
        top_indices = np.argsort(raw_sims)[::-1][:30]
        strain_grid = np.linspace(-0.025, 0.025, 21)
        scored = []
        for idx in top_indices:
            item = self.spectral_meta[int(idx)]
            best_sim = float(raw_sims[int(idx)])
            best_strain = 0.0
            for strain in strain_grid:
                if abs(strain) < 1e-6:
                    continue
                shifted_vec = self.compute_pseudo_voigt_spectrum(item["peaks"], self.grid_2theta, strain=float(strain))
                sim = float(np.dot(exp_vec, shifted_vec))
                if sim > best_sim:
                    best_sim = sim
                    best_strain = float(strain)
            hanawalt_fom, matched_lines = self.compute_hanawalt_fom(experimental_peaks, item["peaks"])
            combined_spec_score = 0.68 * best_sim + 0.32 * (hanawalt_fom / 100.0)
            scored.append({
                "id": item["id"], "name": item["name"], "formula": item["formula"],
                "category": item.get("category", "Crystalline Phase"),
                "crystal_system": item["crystal_system"], "space_group": item["space_group"],
                "density": item["density"], "description": item.get("description", ""),
                "peaks": item["peaks"], "cosine_similarity": round(float(best_sim), 4),
                "hanawalt_fom": hanawalt_fom, "matched_lines": matched_lines,
                "combined_spectral_score": round(float(combined_spec_score), 4),
                "fitted_strain_pct": round(float(best_strain * 100.0), 3),
                "retrieval_method": "bragg_pseudo_voigt_hanawalt"
            })
        scored.sort(key=lambda x: x["combined_spectral_score"], reverse=True)
        return scored[:top_k]

    def retrieve_literature(self, query: str, limit: int = 3) -> List[Dict[str, str]]:
        if not self.conn:
            return []
        cursor = self.conn.cursor()
        words = [w for w in re.split(r"[^\w\d]+", query) if len(w) > 2 and not re.match(r"^\d+$", w)]
        if not words:
            return []
        fts_query = " OR ".join([f'"{w}"*' for w in words[:8]])
        try:
            cursor.execute("""
                SELECT topic, category, content, bm25(scientific_literature) as rank
                FROM scientific_literature WHERE scientific_literature MATCH ? ORDER BY rank ASC LIMIT ?
            """, (fts_query, limit))
            return [{"topic": r[0], "category": r[1], "content": r[2]} for r in cursor.fetchall()]
        except Exception:
            return []

    def hybrid_search(self, query: str, experimental_peaks: Optional[List[Dict[str, float]]] = None, limit: int = 5) -> Dict[str, Any]:
        effective_peaks = experimental_peaks or self.extract_peaks_from_natural_query(query)
        text_matches = self.retrieve_text_fts(query, limit=limit * 2)
        peak_matches = self.retrieve_by_peaks(effective_peaks, top_k=limit * 2) if effective_peaks else []
        lit_query = query + (" " + " ".join([f"{m['name']} {m['formula']}" for m in peak_matches[:2]]) if peak_matches else "")
        literature_matches = self.retrieve_literature(lit_query, limit=3)

        RRF_K = 60.0
        merged_by_id: Dict[int, Dict[str, Any]] = {}
        for rank_idx, pm in enumerate(peak_matches):
            mid = pm["id"]
            entry = dict(pm)
            entry["rrf_score"] = 1.35 / (RRF_K + rank_idx + 1)
            merged_by_id[mid] = entry
        for rank_idx, tm in enumerate(text_matches):
            mid = tm["id"]
            rrf = 1.0 / (RRF_K + rank_idx + 1)
            if mid in merged_by_id:
                merged_by_id[mid]["rrf_score"] += rrf
                merged_by_id[mid]["retrieval_method"] = "hybrid_rrf_spectral_bm25"
            else:
                entry = dict(tm)
                entry["rrf_score"] = rrf
                merged_by_id[mid] = entry

        combined_materials = sorted(merged_by_id.values(), key=lambda x: x.get("rrf_score", 0.0), reverse=True)
        return {
            "query": query,
            "extracted_peaks_used": effective_peaks or [],
            "materials": combined_materials[:limit],
            "literature": literature_matches,
            "total_indexed_materials": len(self.materials_list)
        }

    def answer_query(self, query: str, api_key: Optional[str] = None, experimental_peaks: Optional[List[Dict[str, float]]] = None, model_name: str = "gemini-3.8-flash") -> str:
        rag_data = self.hybrid_search(query, experimental_peaks=experimental_peaks, limit=5)
        materials = rag_data["materials"]
        literature = rag_data["literature"]
        return json.dumps({
            "success": True,
            "answer": f"Retrieved {len(materials)} crystallographic matches.",
            "retrieved_materials": materials,
            "retrieved_literature": literature,
            "total_indexed": len(self.materials_list),
            "ai_grounded": False
        })


MaterialDatabaseRAG = ScientificCrystallographyRAG
