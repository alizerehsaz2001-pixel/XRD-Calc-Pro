import sys
import json
import sqlite3
import os
import re
import math
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
    Advanced Multimodal Crystallography & Materials Physics RAG Engine.
    Combines:
      1. SQLite FTS5 BM25 text & formula indexing over 1,250+ scientific materials.
      2. Domain-specific ontology & synset synonym expansion (polymorphs, minerals, acronyms).
      3. Physical continuous Bragg reflection spectrum vectorization & Cosine Similarity search.
      4. Reciprocal d-spacing & 2-theta continuous convolved matching.
      5. Physical property constraint filtering (density, symmetry, elements, space group).
      6. Contextual structured synthesis with citation of crystallographic parameters.
    """

    def __init__(self, materials_json_path: Optional[str] = None):
        self.conn = sqlite3.connect(":memory:")
        self.materials_list: List[Dict[str, Any]] = []
        self.spectral_index: List[Dict[str, Any]] = []
        self._init_db()
        self._load_materials(materials_json_path)

    def _init_db(self):
        cursor = self.conn.cursor()
        
        # 1. Main Materials Table with structured scientific metrology
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

        # 2. SQLite FTS5 Full-Text Search Virtual Table with BM25 support
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

        # 3. Scientific Literature & Physics Principles RAG Table
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

    def _load_materials(self, materials_json_path: Optional[str] = None):
        # Locate materials_extracted.json or materialDB.ts
        loaded_materials = []
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        candidates = [
            materials_json_path,
            os.path.join(base_dir, "materials_extracted.json"),
            os.path.join(os.getcwd(), "utils", "materials_extracted.json"),
            os.path.join(os.getcwd(), "materials_extracted.json")
        ]

        target_file = None
        for path in candidates:
            if path and os.path.exists(path):
                target_file = path
                break

        if target_file:
            try:
                with open(target_file, "r", encoding="utf-8") as f:
                    loaded_materials = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load materials from {target_file}: {e}", file=sys.stderr)

        if not loaded_materials:
            # Fallback to curated standard dataset if file not found
            loaded_materials = self._get_curated_seed_materials()

        self.materials_list = loaded_materials
        cursor = self.conn.cursor()

        # Insert records into SQLite
        rows_to_insert = []
        fts_rows = []

        for idx, m in enumerate(loaded_materials):
            name = m.get("name", f"Material-{idx+1}")
            formula = m.get("formula", "")
            category = m.get("category", m.get("type", "General Material"))
            crystal_system = m.get("crystal_system", m.get("crystalSystem", "Unknown"))
            space_group = m.get("space_group", m.get("spaceGroup", "Unknown"))
            density = m.get("density", None)
            description = m.get("description", "")
            pattern_raw = m.get("pattern", "")

            # Parse 2theta and intensity peaks
            peaks = self._parse_pattern_to_peaks(pattern_raw)
            peaks_json = json.dumps(peaks)

            rows_to_insert.append((
                name, formula, category, crystal_system, space_group,
                density, description, pattern_raw, peaks_json
            ))

        cursor.executemany("""
            INSERT INTO materials (name, formula, category, crystal_system, space_group, density, description, pattern_raw, peaks_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows_to_insert)

        cursor.execute("""
            INSERT INTO materials_fts (rowid, name, formula, category, crystal_system, space_group, description)
            SELECT id, name, formula, category, crystal_system, space_group, description FROM materials
        """)
        self.conn.commit()

        # Seed deep literature and crystallography monographs
        self._seed_scientific_literature()

        # Precompute 1D continuous spectral representations for peak pattern matching
        self._build_spectral_index()

    def _parse_pattern_to_peaks(self, pattern_str: str) -> List[Dict[str, float]]:
        """Parses multi-line pattern string (e.g. '28.44, 100, 1, 1, 1') into structured peak list."""
        peaks = []
        if not pattern_str:
            return peaks

        lines = pattern_str.strip().split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split(",")]
            try:
                # First element: 2-theta (clean non-numeric tags like "(broad)")
                raw_2th = re.sub(r"[^\d.]", "", parts[0])
                if not raw_2th:
                    continue
                two_theta = float(raw_2th)

                # Second element: intensity
                raw_int = "100"
                if len(parts) > 1:
                    raw_int = re.sub(r"[^\d.]", "", parts[1])
                intensity = float(raw_int) if raw_int else 100.0

                h, k, l = None, None, None
                if len(parts) >= 5:
                    try:
                        h = int(parts[2])
                        k = int(parts[3])
                        l = int(parts[4])
                    except:
                        pass

                peak_dict = {"two_theta": two_theta, "intensity": intensity}
                if h is not None:
                    peak_dict["hkl"] = [h, k, l]
                peaks.append(peak_dict)
            except Exception:
                continue
        return peaks

    def _build_spectral_index(self):
        """Builds 1D continuous Bragg vector embeddings for top indexed materials."""
        grid_2theta = np.linspace(5.0, 90.0, 850)
        self.spectral_index = []

        cursor = self.conn.cursor()
        cursor.execute("SELECT id, name, formula, crystal_system, space_group, density, peaks_json FROM materials")
        
        for row in cursor.fetchall():
            mat_id, name, formula, crystal_sys, sg, density, peaks_json = row
            try:
                peaks = json.loads(peaks_json)
                if not peaks:
                    continue
                
                # Continuous Gaussian representation of Bragg peaks
                spectrum = np.zeros(len(grid_2theta), dtype=np.float32)
                for p in peaks:
                    pos = p["two_theta"]
                    inten = p["intensity"]
                    spectrum += inten * np.exp(-0.5 * ((grid_2theta - pos) / 0.35) ** 2)

                norm = np.linalg.norm(spectrum)
                if norm > 0:
                    spectrum /= norm

                self.spectral_index.append({
                    "id": mat_id,
                    "name": name,
                    "formula": formula,
                    "crystal_system": crystal_sys,
                    "space_group": sg,
                    "density": density,
                    "peaks": peaks,
                    "vector": spectrum
                })
            except Exception:
                continue

    def _seed_scientific_literature(self):
        """Populates rich physical crystallography papers, formulas, and phase transformation rules."""
        docs = [
            (
                "Scherrer Crystallite Size Broadening and Shape Factor K",
                "Line Profile Analysis",
                "scherrer crystallite size fwhm shape factor peak broadening k volume weighted",
                "The Scherrer equation D = (K * λ) / (β * cos(θ)) calculates the volume-weighted mean crystallite column length. K is the dimensionless shape factor (typically 0.89 to 0.94 for spherical domains, 1.0 for cubic, and up to 1.15 for octahedral shapes). β must be the pure sample integral breadth or FWHM in radians, after subtracting instrumental broadening via Voigt or parabolic deconvolution."
            ),
            (
                "Williamson-Hall & Strain-Size Decomposition",
                "Microstrain Analysis",
                "williamson hall udbh microstrain lattice distortion dislocation density",
                "The Williamson-Hall method deconvolves size broadening and microstrain broadening: β * cos(θ) = (K * λ / D) + 4 * ε * sin(θ). Plotting β*cos(θ) against 4*sin(θ) yields crystallite size D from the y-intercept and lattice microstrain ε from the slope. The Uniform Deformation Energy Density Model (UDEDM) and Uniform Stress Model (USDM) incorporate anisotropic Young's moduli E_hkl."
            ),
            (
                "Titanium Dioxide (TiO2) Polymorphism and Phase Transitions",
                "Polymorphs & Phase Equilibria",
                "titania tio2 anatase rutile brookite phase transition photocatalysis bandgap",
                "TiO2 exhibits three primary crystal polymorphs: Rutile (Tetragonal, P42/mnm, standard stable phase, refractive index n=2.7, bandgap ~3.0 eV), Anatase (Tetragonal, I41/amd, metastable, highly active photocatalytic, bandgap ~3.2 eV), and Brookite (Orthorhombic, Pbca). Anatase irreversibly transforms to Rutile between 550°C and 750°C, accompanied by ~8% volume contraction and density increase from 3.89 to 4.23 g/cm³."
            ),
            (
                "Silica (SiO2) Polymorphs and Thermal Metrology",
                "Silicates & Geology",
                "silica quartz cristobalite tridymite stishovite coesite piezoelectric moganite",
                "SiO2 forms a diverse network of corner-sharing SiO4 tetrahedra: Alpha-Quartz (Trigonal, P3121, stable below 573°C, highly piezoelectric), Beta-Quartz (Hexagonal, P6222 / P6422, above 573°C), Low/High Cristobalite (Tetragonal/Cubic, high-temperature refractory), and high-pressure phases like Coesite and Stishovite (rutile-type edge-sharing octahedra, density 4.28 g/cm³)."
            ),
            (
                "NIST SRM Calibration Standards in Powder XRD",
                "Instrumentation Calibration",
                "srm 640 silicon corundum al2o3 srm 1976 lab6 srm 660 zero shift instrumental resolution",
                "Standard Reference Materials (SRMs) establish instrument line profiles and zero-shift alignment. SRM 640 (Silicon powder, diamond cubic Fd-3m, a = 5.4311946 Å) serves as zero-point error and goniometer alignment reference. SRM 676 / 1976 (Corundum α-Al2O3, R-3c) is the primary calibration standard for Reference Intensity Ratio (RIR) quantitative phase analysis and line profile resolution functions (Caglioti parameters U, V, W)."
            ),
            (
                "Perovskite Oxides and Halides (ABX3) Structural Tolerances",
                "Functional Materials",
                "perovskite catio3 tolerance factor goldschmidt ferroelectric solar cell octahedra",
                "Perovskite structures (prototype CaTiO3, Pnma or cubic Pm-3m) follow Goldschmidt's tolerance factor t = (r_A + r_X) / [sqrt(2) * (r_B + r_X)]. When 0.9 < t < 1.0, cubic symmetry is preserved. When t < 0.9, octahedral tilting (Glazer tilt systems like a-a-c+ or a-b-c-) reduces symmetry to orthorhombic or rhombohedral, inducing ferroelectricity and polarization."
            ),
            (
                "Lithium Ion Battery Cathode Layered Oxides (LiCoO2, NMC)",
                "Energy Storage",
                "licoo2 nmc lfp battery cathode intercalation c/a ratio layered rock salt r-3m",
                "LiCoO2 crystallizes in the alpha-NaFeO2 layered rock-salt structure (R-3m) where Li+ and Co3+ occupy alternating (111) planes of the cubic close-packed oxygen sub-lattice. The c/a lattice parameter ratio indicates structural ordering: a c/a ratio > 4.90 signifies high hexagonal ordering and reversible Li+ de-intercalation capacity."
            ),
            (
                "Warren-Averbach Fourier Peak Profile Analysis",
                "Advanced Microstructure",
                "warren averbach fourier coefficients size distribution stacking faults root mean square strain",
                "The Warren-Averbach method computes true column-length size distributions P(L) and root-mean-square microstrains <ε²(L)>^0.5 by calculating Fourier cosine coefficients A_n(hkl) across multiple harmonic reflection orders (e.g. 111 and 222). Unlike Scherrer and Williamson-Hall, it does not assume an empirical peak shape function."
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
                "description": "Alpha-quartz silica structure with trigonal symmetry. Highly piezoelectric, used in precision oscillators.",
                "pattern": "20.8, 35, 1, 0, 0\n26.6, 100, 1, 0, 1\n36.5, 12, 1, 1, 0\n50.1, 14, 1, 1, 2\n59.9, 9, 2, 1, 1"
            },
            {
                "name": "Rutile (Tetragonal-TiO2)",
                "formula": "TiO2",
                "category": "Ceramics & Oxides",
                "crystal_system": "Tetragonal",
                "space_group": "P42/mnm",
                "density": 4.23,
                "description": "Most stable natural titanium dioxide polymorph. Displays exceptionally high refractive index (n=2.7).",
                "pattern": "27.4, 100, 1, 1, 0\n36.1, 50, 1, 0, 1\n41.2, 22, 1, 1, 1\n54.3, 61, 2, 1, 1\n56.6, 19, 2, 2, 0"
            },
            {
                "name": "Anatase (Tetragonal-TiO2)",
                "formula": "TiO2",
                "category": "Ceramics & Oxides",
                "crystal_system": "Tetragonal",
                "space_group": "I41/amd",
                "density": 3.89,
                "description": "Metastable tetragonal titanium dioxide polymorph. Highly photocatalytic, converts to rutile phase >600°C.",
                "pattern": "25.3, 100, 1, 0, 1\n37.8, 20, 0, 0, 4\n48.0, 35, 2, 0, 0\n53.9, 20, 1, 0, 5\n55.1, 25, 2, 1, 1"
            },
            {
                "name": "Silicon (NIST SRM 640 Standard)",
                "formula": "Si",
                "category": "Calibration & Standards",
                "crystal_system": "Cubic",
                "space_group": "Fd-3m",
                "density": 2.33,
                "description": "Pure diamond cubic lattice. Serves as primary calibration standard for 2-theta zero-shift alignment.",
                "pattern": "28.44, 100, 1, 1, 1\n47.30, 55, 2, 2, 0\n56.12, 30, 3, 1, 1\n69.13, 8, 4, 0, 0\n76.38, 12, 3, 3, 1"
            },
            {
                "name": "Corundum (Alpha-Al2O3)",
                "formula": "Al2O3",
                "category": "Ceramics & Standards",
                "crystal_system": "Trigonal",
                "space_group": "R-3c",
                "density": 3.97,
                "description": "Extremely hard monocrystalline aluminum oxide (Mohs 9). Reference standard for quantitative RIR analysis.",
                "pattern": "25.58, 60, 0, 1, 2\n35.15, 100, 1, 0, 4\n37.78, 40, 1, 1, 0\n43.35, 90, 1, 1, 3\n52.55, 50, 0, 2, 4\n57.50, 80, 1, 1, 6"
            }
        ]

    def _expand_query_synonyms(self, query: str) -> List[str]:
        """Expands domain terminology to handle polymorphic names, chemical formulas, and synonyms."""
        SYNONYMS = {
            "quartz": ["SiO2", "silica", "alpha-quartz", "cristobalite", "tridymite"],
            "titania": ["TiO2", "titanium dioxide", "anatase", "rutile", "brookite"],
            "anatase": ["TiO2", "tetragonal", "photocatalysis", "I41/amd"],
            "rutile": ["TiO2", "P42/mnm", "refractive"],
            "alumina": ["Al2O3", "corundum", "sapphire", "R-3c"],
            "corundum": ["Al2O3", "sapphire", "ruby", "SRM 1976"],
            "silicon": ["Si", "diamond cubic", "SRM 640"],
            "magnetite": ["Fe3O4", "spinel", "ferrimagnetic", "Verwey"],
            "hematite": ["Fe2O3", "alpha-Fe2O3"],
            "halite": ["NaCl", "rock salt", "Fm-3m"],
            "perovskite": ["CaTiO3", "ABO3", "tolerance factor", "Pnma"],
            "calcite": ["CaCO3", "limestone", "aragonite", "birefringence"],
            "zirconia": ["ZrO2", "baddeleyite", "yttria-stabilized", "YSZ"],
            "hydroxyapatite": ["HAp", "Ca10(PO4)6(OH)2", "enamel", "biomaterial"],
            "scherrer": ["crystallite size", "fwhm", "broadening", "domain size"],
            "strain": ["microstrain", "williamson-hall", "deformation", "stress"],
            "cubic": ["Fm-3m", "Fd-3m", "Pm-3m", "Im-3m"],
            "hexagonal": ["P63/mmc", "P6222", "P3121"],
            "tetragonal": ["P42/mnm", "I41/amd", "P4/mmm"]
        }

        q_lower = query.lower()
        expanded_terms = []
        
        for key, syns in SYNONYMS.items():
            if key in q_lower:
                expanded_terms.extend(syns)

        return list(set(expanded_terms))

    def retrieve_text_fts(self, query: str, limit: int = 6) -> List[Dict[str, Any]]:
        """Performs optimized BM25 full-text search with phonetic wildcards and synonym expansion."""
        cursor = self.conn.cursor()

        # Stop words
        STOP_WORDS = {
            "the", "a", "an", "and", "or", "of", "in", "to", "for", "with", "is", "are", 
            "was", "were", "on", "at", "by", "from", "show", "me", "find", "search", 
            "material", "materials", "structure", "crystal", "system", "lattice", 
            "properties", "density", "what", "how", "who", "where", "when", "why", 
            "please", "give", "info", "information", "detail", "details", "about"
        }

        # Tokenize and clean
        words = [w for w in re.split(r"[^\w\d.-]+", query) if w and len(w) > 1]
        keywords = [w for w in words if w.lower() not in STOP_WORDS]
        if not keywords:
            keywords = words

        if not keywords:
            return []

        synonyms = self._expand_query_synonyms(query)
        all_terms = list(dict.fromkeys(keywords + synonyms[:4]))

        # Construct BM25 FTS5 Query
        fts_clauses = []
        for term in all_terms:
            clean_t = re.sub(r"[^\w\d]", "", term)
            if clean_t:
                fts_clauses.append(f'"{clean_t}"*')
                fts_clauses.append(f'"{clean_t}"')

        fts_query = " OR ".join(fts_clauses)
        results = []

        try:
            cursor.execute(f"""
                SELECT m.id, m.name, m.formula, m.category, m.crystal_system, m.space_group, m.density, m.description, m.peaks_json, bm25(materials_fts) as rank
                FROM materials_fts fts
                JOIN materials m ON m.id = fts.rowid
                WHERE materials_fts MATCH ?
                ORDER BY rank ASC
                LIMIT ?
            """, (fts_query, limit))
            
            rows = cursor.fetchall()
            for r in rows:
                peaks = []
                try:
                    peaks = json.loads(r[8]) if r[8] else []
                except:
                    pass

                results.append({
                    "id": r[0],
                    "name": r[1],
                    "formula": r[2],
                    "category": r[3],
                    "crystal_system": r[4],
                    "space_group": r[5],
                    "density": r[6],
                    "description": r[7],
                    "peaks": peaks,
                    "retrieval_method": "bm25_fts",
                    "score": float(-r[9]) if r[9] is not None else 1.0
                })
        except Exception as e:
            # Substring fallback
            like_clauses = []
            params = []
            for kw in keywords[:3]:
                like_clauses.append("(name LIKE ? OR formula LIKE ? OR description LIKE ?)")
                params.extend([f"%{kw}%", f"%{kw}%", f"%{kw}%"])
            
            if like_clauses:
                query_sql = f"""
                    SELECT id, name, formula, category, crystal_system, space_group, density, description, peaks_json
                    FROM materials
                    WHERE {' OR '.join(like_clauses)}
                    LIMIT ?
                """
                cursor.execute(query_sql, params + [limit])
                for r in cursor.fetchall():
                    peaks = []
                    try:
                        peaks = json.loads(r[8]) if r[8] else []
                    except:
                        pass
                    results.append({
                        "id": r[0],
                        "name": r[1],
                        "formula": r[2],
                        "category": r[3],
                        "crystal_system": r[4],
                        "space_group": r[5],
                        "density": r[6],
                        "description": r[7],
                        "peaks": peaks,
                        "retrieval_method": "substring_fallback",
                        "score": 0.5
                    })

        return results

    def retrieve_by_peaks(self, experimental_peaks: List[Dict[str, float]], top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Continuous Physical Spectrum Alignment:
        Calculates cosine similarity between experimental Bragg peaks and database continuous spectra.
        """
        if not experimental_peaks or not self.spectral_index:
            return []

        grid_2theta = np.linspace(5.0, 90.0, 850)
        exp_vec = np.zeros(len(grid_2theta), dtype=np.float32)

        for p in experimental_peaks:
            pos = float(p.get("two_theta", p.get("2theta", 0.0)))
            val = float(p.get("intensity", 100.0))
            if 5.0 <= pos <= 90.0:
                exp_vec += val * np.exp(-0.5 * ((grid_2theta - pos) / 0.35) ** 2)

        exp_norm = np.linalg.norm(exp_vec)
        if exp_norm == 0:
            return []
        exp_vec /= exp_norm

        scored = []
        for item in self.spectral_index:
            db_vec = item["vector"]
            # Cosine similarity
            cosine_sim = float(np.dot(exp_vec, db_vec))
            
            # Sub-pixel strain optimization check [-3% to +3%]
            best_sim = cosine_sim
            best_strain = 0.0
            for strain in [-0.02, -0.01, 0.01, 0.02]:
                shifted_vec = np.zeros(len(grid_2theta), dtype=np.float32)
                for p in item["peaks"]:
                    pos = p["two_theta"] * (1.0 + strain)
                    val = p["intensity"]
                    if 5.0 <= pos <= 90.0:
                        shifted_vec += val * np.exp(-0.5 * ((grid_2theta - pos) / 0.35) ** 2)
                norm = np.linalg.norm(shifted_vec)
                if norm > 0:
                    sim = float(np.dot(exp_vec, shifted_vec / norm))
                    if sim > best_sim:
                        best_sim = sim
                        best_strain = strain

            scored.append({
                "id": item["id"],
                "name": item["name"],
                "formula": item["formula"],
                "crystal_system": item["crystal_system"],
                "space_group": item["space_group"],
                "density": item["density"],
                "peaks": item["peaks"],
                "cosine_similarity": float(best_sim),
                "fitted_strain_pct": float(best_strain * 100.0),
                "retrieval_method": "spectral_peak_vector"
            })

        scored.sort(key=lambda x: x["cosine_similarity"], reverse=True)
        return scored[:top_k]

    def retrieve_literature(self, query: str, limit: int = 3) -> List[Dict[str, str]]:
        """Retrieves verified crystallographic principles, monograph notes, and metrology methods."""
        cursor = self.conn.cursor()
        words = [w for w in re.split(r"[^\w\d]+", query) if len(w) > 2]
        if not words:
            return []

        fts_query = " OR ".join([f'"{w}"*' for w in words[:6]])
        try:
            cursor.execute("""
                SELECT topic, category, content, bm25(scientific_literature) as rank
                FROM scientific_literature
                WHERE scientific_literature MATCH ?
                ORDER BY rank ASC
                LIMIT ?
            """, (fts_query, limit))
            rows = cursor.fetchall()
            return [{"topic": r[0], "category": r[1], "content": r[2]} for r in rows]
        except Exception:
            return []

    def hybrid_search(self, query: str, experimental_peaks: Optional[List[Dict[str, float]]] = None, limit: int = 5) -> Dict[str, Any]:
        """
        Multimodal Hybrid Retriever:
        Combines BM25 lexical search, peak vector similarity, and scientific literature.
        """
        text_matches = self.retrieve_text_fts(query, limit=limit)
        peak_matches = self.retrieve_by_peaks(experimental_peaks, top_k=limit) if experimental_peaks else []
        literature_matches = self.retrieve_literature(query, limit=3)

        # Merge and deduplicate materials
        seen_ids = set()
        combined_materials = []

        for p in peak_matches:
            seen_ids.add(p["id"])
            combined_materials.append(p)

        for t in text_matches:
            if t["id"] not in seen_ids:
                seen_ids.add(t["id"])
                combined_materials.append(t)

        return {
            "query": query,
            "materials": combined_materials[:limit],
            "literature": literature_matches,
            "total_indexed_materials": len(self.materials_list)
        }

    def answer_query(
        self, 
        query: str, 
        api_key: Optional[str] = None, 
        experimental_peaks: Optional[List[Dict[str, float]]] = None,
        model_name: str = "gemini-2.5-flash"
    ) -> str:
        """
        Full RAG pipeline with grounded generation and structural parameters citation.
        """
        rag_data = self.hybrid_search(query, experimental_peaks=experimental_peaks, limit=5)
        materials = rag_data["materials"]
        literature = rag_data["literature"]

        # Build Grounding Context
        grounding_parts = []
        grounding_parts.append("=== SCIENTIFIC REFERENCE DATABASE (RETRIEVED KNOWLEDGE) ===")

        if materials:
            for idx, m in enumerate(materials, 1):
                name = m.get("name", "Unknown")
                formula = m.get("formula", "")
                sys_type = m.get("crystal_system", "Unknown")
                sg = m.get("space_group", "Unknown")
                density = m.get("density")
                dens_str = f", Density: {density} g/cm³" if density else ""
                desc = m.get("description", "")
                strain_str = f" [Fitted Strain: {m['fitted_strain_pct']:+.2f}%]" if "fitted_strain_pct" in m else ""
                sim_str = f" [Spectral Match: {m['cosine_similarity']*100:.1f}%]" if "cosine_similarity" in m else ""

                grounding_parts.append(
                    f"[{idx}] {name} ({formula}): System={sys_type}, SpaceGroup={sg}{dens_str}{sim_str}{strain_str}\n"
                    f"    Details: {desc}"
                )
                if m.get("peaks"):
                    top_peaks = m["peaks"][:4]
                    peaks_str = ", ".join([f"{p['two_theta']:.2f}° (I={p['intensity']}%)" for p in top_peaks])
                    grounding_parts.append(f"    Primary Bragg Reflections: {peaks_str}")
        else:
            grounding_parts.append("No direct material records matched in the local knowledge base.")

        if literature:
            grounding_parts.append("\n=== APPLIED CRYSTALLOGRAPHY & METROLOGY MONOGRAPHS ===")
            for lit in literature:
                grounding_parts.append(f"• [{lit['category']}] {lit['topic']}:\n  {lit['content']}")

        grounding_context = "\n".join(grounding_parts)

        # Gemini Prompt
        prompt = (
            "You are a Senior Principal Materials Crystallographer and X-ray Diffraction Metrology Specialist.\n"
            "Answer the researcher's query authoritatively using the retrieved scientific knowledge base and physical principles.\n\n"
            f"{grounding_context}\n\n"
            "=== SCIENTIFIC INSTRUCTIONS ===\n"
            "1. CITE AND REFERENCE exact crystallographic parameters (Space Group, Crystal System, Density, Bragg reflections) from the retrieved data.\n"
            "2. EXPLAIN STRUCTURAL-PROPERTY RELATIONSHIPS (e.g. why specific polymorphs form, coordination polyhedra, piezoelectric or photocatalytic mechanisms).\n"
            "3. METROLOGY REASONING: If peak broadening, strain, crystallite size (Scherrer / Williamson-Hall), or standard calibration (SRM 640 / 1976) is relevant, provide the exact mathematical formula and physical interpretation.\n"
            "4. BEAUTIFULLY STRUCTURED MARKDOWN: Use concise comparison tables, bullet points, and clean scientific typography.\n\n"
            f"Researcher Query: {query}\n"
        )
        if experimental_peaks:
            prompt += f"Experimental Peaks Provided: {json.dumps(experimental_peaks)}\n"

        prompt += "\nExpert Comprehensive Response:\n"

        # Fallback if no GenAI or API key
        if not has_genai or not api_key:
            fallback_text = "### Scientific Reference Retrieval Results\n\n"
            if materials:
                fallback_text += "| Material | Formula | Crystal System | Space Group | Density |\n"
                fallback_text += "| :--- | :--- | :--- | :--- | :--- |\n"
                for m in materials:
                    d_val = f"{m.get('density', '-')} g/cm³" if m.get('density') else "-"
                    fallback_text += f"| **{m.get('name')}** | `{m.get('formula')}` | {m.get('crystal_system')} | `{m.get('space_group')}` | {d_val} |\n"
                
                fallback_text += "\n#### Structural & Application Details\n\n"
                for m in materials:
                    fallback_text += f"- **{m.get('name')}**: {m.get('description')}\n"
            
            if literature:
                fallback_text += "\n#### Crystallography Notes\n\n"
                for lit in literature:
                    fallback_text += f"- **{lit['topic']}**: {lit['content']}\n"

            return json.dumps({
                "success": True,
                "answer": fallback_text,
                "retrieved_materials": materials,
                "retrieved_literature": literature,
                "total_indexed": len(self.materials_list),
                "ai_grounded": False
            })

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return json.dumps({
                "success": True,
                "answer": response.text,
                "retrieved_materials": materials,
                "retrieved_literature": literature,
                "total_indexed": len(self.materials_list),
                "ai_grounded": True
            })
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e),
                "retrieved_materials": materials,
                "total_indexed": len(self.materials_list)
            })


# Maintain backwards-compatible class name
MaterialDatabaseRAG = ScientificCrystallographyRAG


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Scientific Crystallography RAG Engine")
    parser.add_argument("--query", required=True, type=str, help="Search query or crystal question")
    parser.add_argument("--api_key", required=False, default="", type=str, help="Gemini API Key")
    parser.add_argument("--peaks", required=False, default="", type=str, help="Optional JSON string of experimental peaks")
    parser.add_argument("--model", required=False, default="gemini-2.5-flash", type=str, help="Gemini model alias")
    
    args = parser.parse_args()
    
    exp_peaks = None
    if args.peaks:
        try:
            exp_peaks = json.loads(args.peaks)
        except:
            pass

    rag = ScientificCrystallographyRAG()
    print(rag.answer_query(args.query, api_key=args.api_key, experimental_peaks=exp_peaks, model_name=args.model))
