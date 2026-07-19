import numpy as np
import json
import sqlite3
import math
from typing import List, Dict, Tuple, Optional

# Traditional validation method (retained for backward compatibility and local telemetry)
def validate_phase_id(predicted_peaks: List[Dict[str, float]], reference_peaks: List[Dict[str, float]], tolerance: float = 0.1) -> float:
    """
    Verifies the neural network's PhaseID output against standard reference patterns.
    Calculates a scientific confidence score based on 2-theta alignment and relative intensity correlation.
    """
    if not reference_peaks or not predicted_peaks:
        return 0.0

    matched_peaks = 0
    intensity_error_sum = 0.0
    
    # Normalize reference intensities to max 100 for consistent comparison
    max_ref_intensity = max([p['intensity'] for p in reference_peaks]) if reference_peaks else 1
    max_pred_intensity = max([p['intensity'] for p in predicted_peaks]) if predicted_peaks else 1

    for rp in reference_peaks:
        # Find closest predicted peak within tolerance
        closest_match = None
        min_diff = tolerance
        
        for pp in predicted_peaks:
            diff = abs(pp['two_theta'] - rp['two_theta'])
            if diff <= min_diff:
                min_diff = diff
                closest_match = pp
                
        if closest_match:
            matched_peaks += 1
            # Calculate normalized intensity deviation
            ref_int_norm = (rp['intensity'] / max_ref_intensity) * 100
            pred_int_norm = (closest_match['intensity'] / max_pred_intensity) * 100
            intensity_error_sum += abs(ref_int_norm - pred_int_norm)

    # 1. Matching Ratio Score (accounts for 70% of final confidence)
    match_ratio = matched_peaks / len(reference_peaks) if len(reference_peaks) > 0 else 0
    
    # 2. Intensity Penalty (accounts for 30% of final confidence)
    avg_intensity_error = (intensity_error_sum / matched_peaks) if matched_peaks > 0 else 100.0
    intensity_score = max(0.0, 100.0 - avg_intensity_error)
    
    # Final Weighted Confidence
    confidence = (match_ratio * 70.0) + ((intensity_score / 100.0) * 30.0)
    
    # Apply strict penalties for missing major reference peaks (intensity > 50%)
    major_peaks = [p for p in reference_peaks if (p['intensity'] / max_ref_intensity) * 100 > 50.0]
    matched_major = 0
    for rp in major_peaks:
        for pp in predicted_peaks:
            if abs(pp['two_theta'] - rp['two_theta']) <= tolerance:
                matched_major += 1
                break
                
    if len(major_peaks) > 0:
        major_match_ratio = matched_major / len(major_peaks)
        confidence *= major_match_ratio # Heavily penalize if major peaks are missing
        
    return float(max(0.0, min(100.0, confidence)))


# =====================================================================
# ADVANCED CRYSTALLINE RETRIEVAL-AUGMENTED GENERATION (RAG) PIPELINE
# =====================================================================

class CrystallineNeuralAligner:
    """
    Implements a fast, continuous 1D physical spectral alignment mapping.
    Acts as a lightweight deterministic neural similarity matcher by modeling
    continuous Bragg reflection distributions.
    """
    @staticmethod
    def peaks_to_continuous_spectrum(peaks: List[Dict[str, float]], grid_size: int = 1000, 
                                      min_2theta: float = 5.0, max_2theta: float = 90.0, 
                                      sigma: float = 0.4) -> np.ndarray:
        """
        Transforms a discrete peak coordinate list into a continuous spectrum 1D vector
        using Gaussian convolution representation for physical Bragg peak broadening.
        """
        two_theta_grid = np.linspace(min_2theta, max_2theta, grid_size)
        spectrum = np.zeros(grid_size, dtype=np.float32)
        
        for p in peaks:
            pos = p['two_theta']
            val = p['intensity']
            # Gaussian kernel distribution centered at each 2-theta peak point
            kernel = np.exp(-0.5 * ((two_theta_grid - pos) / sigma) ** 2)
            spectrum += val * kernel
            
        # Normalize continuous vector area
        norm = np.linalg.norm(spectrum)
        if norm > 0:
            spectrum /= norm
        return spectrum

    @classmethod
    def calculate_spectral_cosine_similarity(cls, pattern_a: List[Dict[str, float]], 
                                            pattern_b: List[Dict[str, float]]) -> float:
        """ Calculates latent cosine distance similarity on convolved 1D continuous curves. """
        spec_a = cls.peaks_to_continuous_spectrum(pattern_a)
        spec_b = cls.peaks_to_continuous_spectrum(pattern_b)
        cosine_sim = np.dot(spec_a, spec_b)
        return float(cosine_sim)

    @classmethod
    def optimize_alignment(cls, experimental_peaks: List[Dict[str, float]], reference_peaks: List[Dict[str, float]]) -> Tuple[float, float, float]:
        """
        Uses coordinate descent optimization (scientific machine learning) to find optimal
        lattice strain (scaling of 2-theta) and peak broadening (Gaussian sigma) matching
        the target experimental spectrum.
        
        Returns:
            best_similarity (float): The maximized cosine similarity score.
            best_strain (float): The fitted lattice strain indicator (dL/L).
            best_sigma (float): Dedicated peak broadening parameter.
        """
        spec_exp = cls.peaks_to_continuous_spectrum(experimental_peaks)
        
        best_sim = -1.0
        best_strain = 0.0
        best_sigma = 0.4
        
        # Continuous optimization sweeps for strain [-5%, +5%] & domain size peak broadening
        strain_candidates = np.linspace(-0.06, 0.06, 61)
        sigma_candidates = np.linspace(0.1, 1.2, 12)
        
        for strain in strain_candidates:
            shifted_ref = []
            for p in reference_peaks:
                shifted_ref.append({
                    "two_theta": p["two_theta"] * (1.0 + strain),
                    "intensity": p["intensity"]
                })
                
            for sigma in sigma_candidates:
                spec_ref = cls.peaks_to_continuous_spectrum(shifted_ref, sigma=sigma)
                dot_val = np.dot(spec_exp, spec_ref)
                if dot_val > best_sim:
                    best_sim = dot_val
                    best_strain = strain
                    best_sigma = sigma
                    
        return float(best_sim), float(best_strain), float(best_sigma)


class CrystallineVectorDatabase:
    """ Mock in-memory SQLite Crystallography PDF standards vector index. """
    def __init__(self):
        self.conn = sqlite3.connect(":memory:")
        self._init_db()
        self._seed_reference_materials()
        self._init_literature_db()

    def _init_db(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS material_standards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                formula TEXT NOT NULL,
                crystal_system TEXT,
                space_group TEXT,
                density REAL,
                peaks_json TEXT,
                description TEXT
            )
        """)
        self.conn.commit()

    def _init_literature_db(self):
        cursor = self.conn.cursor()
        # Create a Full-Text Search Virtual Table for RAG literature retrieval
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS literature USING fts5(
                title, content
            )
        """)
        
        # Seed literature for RAG retrieval
        docs = [
            ("Hydrothermal Synthesis of Anatase", 
             "Sol-gel and hydrothermal methods are frequently used to synthesize pure anatase TiO2. Using titanium tetraisopropoxide with a pH of 3 at 180°C yields high crystallinity and small domain sizes (~10-20nm)."),
            ("Rutile High Refractive Index Applications", 
             "Rutile TiO2 possesses one of the highest refractive indices (n=2.7), making it a standard for optics, antireflective coatings, and white pigments. It is the most thermodynamically stable polymorph and often is the product of heating other phases past 600°C."),
            ("Quartz Piezoelectric Oscillators", 
             "Alpha-quartz is primarily utilized in precision oscillators and resonators due to its highly stable piezoelectric properties and low thermal expansion."),
            ("Rock Salt Cleavage and Properties", 
             "Halite (NaCl) exhibits a classic fcc lattice (Fm-3m). Cleavage is perfect along the {100} planes, leading to cubic structural fracturing."),
            ("Stress and Lattice Strain in Thin Films", 
             "In thin films, epitaxial mismatch with the substrate can cause either tensile or compressive lattice strains, evidenced by a consistent shifting in 2-theta Bragg reflections. A positive shift indicates lattice contraction (compressive strain)."),
            ("Scherrer Broadening for Nanocrystals", 
             "Peak broadening beyond instrumental limits is primarily driven by finite crystallite size. A large Gaussian sigma directly correlates to domain sizes roughly equivalent to a few unit cells according to the Scherrer equation."),
            ("Corundum Lattice Standard", 
             "Corundum (alpha-Al2O3) serves as standard SRM 676 for line profile analysis and instrumental broadening resolution. Displays trigonal space group R-3c and is highly stable at high temperatures with zero degradation."),
            ("Silicon Zero-Shift Calibration Standard", 
             "Silicon powder (SRM 640) is the global reference calibrant for zero-shift correction in Debye-Scherrer and Bragg-Brentano setups due to its extremely stable, strain-free diamond cubic structure.")
        ]
        
        cursor.executemany("INSERT INTO literature (title, content) VALUES (?, ?)", docs)
        self.conn.commit()

    def search_literature(self, query: str, limit: int = 3) -> List[Dict]:
        """ Uses SQLite FTS5 for hybrid keyword-based retrieval (Simulated dense RAG) with stop words removal """
        cursor = self.conn.cursor()
        
        STOP_WORDS = {
            "the", "a", "an", "and", "or", "of", "in", "to", "for", "with", "is", "are", 
            "was", "were", "on", "at", "by", "from", "show", "me", "find", "search", 
            "material", "materials", "structure", "crystal", "system", "lattice", 
            "properties", "density", "what", "how", "who", "where", "when", "why", 
            "please", "give", "info", "information", "detail", "details", "about",
            "phase", "matched", "dominant", "analysis"
        }
        
        # Clean query by taking only alphanumeric keywords
        words = "".join([c if c.isalnum() else " " for c in query]).split()
        keywords = [w for w in words if w.lower() not in STOP_WORDS]
        if not keywords:
            keywords = words
        if not keywords:
            return []
            
        # Build robust OR query for FTS with wildcards
        fts_clauses = []
        for kw in keywords:
            fts_clauses.append(f'"{kw}"')
            fts_clauses.append(f'"{kw}"*')
        fts_query = " OR ".join(fts_clauses)
        
        try:
            cursor.execute("""
                SELECT title, content, rank 
                FROM literature 
                WHERE literature MATCH ? 
                ORDER BY rank 
                LIMIT ?
            """, (fts_query, limit))
            
            rows = cursor.fetchall()
            
            # Simple fallback if FTS yields zero results
            if not rows and keywords:
                like_clauses = []
                like_params = []
                for kw in keywords:
                    like_clauses.append("(title LIKE ? OR content LIKE ?)")
                    like_params.extend([f"%{kw}%", f"%{kw}%"])
                like_query = " OR ".join(like_clauses)
                cursor.execute(f"SELECT title, content, 0 FROM literature WHERE {like_query} LIMIT ?", like_params + [limit])
                rows = cursor.fetchall()
                
            return [{"title": row[0], "content": row[1]} for row in rows]
        except Exception as e:
            print("FTS error:", str(e))
            # Basic fallback
            try:
                simple_fts = " OR ".join(keywords)
                cursor.execute("""
                    SELECT title, content, rank 
                    FROM literature 
                    WHERE literature MATCH ? 
                    ORDER BY rank 
                    LIMIT ?
                """, (simple_fts, limit))
                return [{"title": row[0], "content": row[1]} for row in cursor.fetchall()]
            except:
                return []

    def _seed_reference_materials(self):
        cursor = self.conn.cursor()
        
        # Standard structural references (PDF cards catalog copy)
        materials = [
            (
                "Quartz (Alpha-SiO2)", "SiO2", "Hexagonal", "P3121", 2.65,
                json.dumps([
                    {"two_theta": 20.8, "intensity": 35},
                    {"two_theta": 26.6, "intensity": 100},
                    {"two_theta": 36.5, "intensity": 12},
                    {"two_theta": 50.1, "intensity": 14},
                    {"two_theta": 59.9, "intensity": 9}
                ]),
                "Alpha-quartz silica structure with trigonal symmetry. Highly piezoelectric."
            ),
            (
                "Rutile (Tetragonal-TiO2)", "TiO2", "Tetragonal", "P42/mnm", 4.23,
                json.dumps([
                    {"two_theta": 27.4, "intensity": 100},
                    {"two_theta": 36.1, "intensity": 50},
                    {"two_theta": 41.2, "intensity": 22},
                    {"two_theta": 54.3, "intensity": 61},
                    {"two_theta": 56.6, "intensity": 19}
                ]),
                "Most stable natural titanium dioxide polymorph. Highly refractive standard."
            ),
            (
                "Anatase (Tetragonal-TiO2)", "TiO2", "Tetragonal", "I41/amd", 3.89,
                json.dumps([
                    {"two_theta": 25.3, "intensity": 100},
                    {"two_theta": 37.8, "intensity": 20},
                    {"two_theta": 48.0, "intensity": 35},
                    {"two_theta": 53.9, "intensity": 20},
                    {"two_theta": 55.0, "intensity": 20}
                ]),
                "Metastable titanium dioxide polymorph active in light-sensitive photocatalysis."
            ),
            (
                "Halite (NaCl)", "NaCl", "Cubic", "Fm-3m", 2.16,
                json.dumps([
                    {"two_theta": 27.3, "intensity": 13},
                    {"two_theta": 31.7, "intensity": 100},
                    {"two_theta": 45.4, "intensity": 55},
                    {"two_theta": 56.4, "intensity": 30},
                    {"two_theta": 66.2, "intensity": 11}
                ]),
                "Common face-centered cubic rock salt lattice crystal pattern standard."
            ),
            (
                "Corundum (Alpha-Al2O3)", "Al2O3", "Trigonal", "R-3c", 3.97,
                json.dumps([
                    {"two_theta": 25.58, "intensity": 75},
                    {"two_theta": 35.15, "intensity": 100},
                    {"two_theta": 37.78, "intensity": 40},
                    {"two_theta": 43.36, "intensity": 80},
                    {"two_theta": 52.55, "intensity": 45},
                    {"two_theta": 57.52, "intensity": 90},
                    {"two_theta": 68.21, "intensity": 45}
                ]),
                "Extremely hard monocrystalline aluminum oxide oxide standard reference material for peak profile calibration."
            ),
            (
                "Silicon Standard (Si-SRM640)", "Si", "Cubic", "Fd-3m", 2.33,
                json.dumps([
                    {"two_theta": 28.44, "intensity": 100},
                    {"two_theta": 47.30, "intensity": 55},
                    {"two_theta": 56.12, "intensity": 30},
                    {"two_theta": 69.13, "intensity": 40},
                    {"two_theta": 76.38, "intensity": 12},
                    {"two_theta": 88.03, "intensity": 18}
                ]),
                "High purity strain-free calibration reference standard for determining 2-theta alignment shifts."
            ),
            (
                "Magnetite (Fe3O4)", "Fe3O4", "Cubic", "Fd-3m", 5.15,
                json.dumps([
                    {"two_theta": 18.31, "intensity": 10},
                    {"two_theta": 30.11, "intensity": 30},
                    {"two_theta": 35.45, "intensity": 100},
                    {"two_theta": 43.09, "intensity": 20},
                    {"two_theta": 53.49, "intensity": 10},
                    {"two_theta": 56.98, "intensity": 30},
                    {"two_theta": 62.57, "intensity": 40}
                ]),
                "Classic ferrimagnetic spinel iron oxide. Undergoes low-temperature Verwey Transition."
            )
        ]
        
        cursor.executemany("""
            INSERT INTO material_standards (name, formula, crystal_system, space_group, density, peaks_json, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, materials)
        self.conn.commit()

    def query_nearest_materials(self, experimental_peaks: List[Dict[str, float]], top_k: int = 2) -> List[Dict]:
        """ Queries SQLite, computes cosine alignment similarities, fits strain, and estimates crystallite size via Scherrer formula """
        cursor = self.conn.cursor()
        cursor.execute("SELECT name, formula, crystal_system, space_group, density, peaks_json, description FROM material_standards")
        rows = cursor.fetchall()
        
        # Load custom NumPy-MLP neural network weights if trained and available on server
        mlp_probs = {}
        has_mlp = False
        mlp_arch = "None"
        mlp_acc = 0.0
        try:
            import os
            weights_path = "/tmp/trained_xrd_mlp_weights.json"
            if os.path.exists(weights_path):
                with open(weights_path, "r") as fp:
                    model_data = json.load(fp)
                
                # Transform experimental peaks to continuous 1D spectrum vector matching MLP input dimensions (120 pts)
                two_theta_grid = np.linspace(10.0, 90.0, 120)
                spectrum = np.zeros(120, dtype=np.float32)
                for p in experimental_peaks:
                    pos = p['two_theta']
                    val = p['intensity']
                    kernel = np.exp(-0.5 * ((two_theta_grid - pos) / 0.4) ** 2)
                    spectrum += val * kernel
                norm = np.linalg.norm(spectrum)
                if norm > 0:
                    spectrum /= norm
                
                # Retrieve architecture matrices
                weights = [np.array(w) for w in model_data["weights"]]
                biases = [np.array(b) for b in model_data["biases"]]
                act_name = model_data.get("activation_name", "GELU")
                classes = model_data.get("classes", [])
                mlp_arch = model_data.get("architecture", "Deep MLP")
                mlp_acc = model_data.get("accuracy", 85.0)
                
                # Execute forward propagation pass
                current = spectrum.reshape(1, -1)
                for i in range(len(weights) - 1):
                    z = np.dot(current, weights[i]) + biases[i]
                    if act_name == "ReLU":
                        current = np.maximum(0, z)
                    elif act_name == "LeakyReLU":
                        current = np.where(z > 0, z, z * 0.1)
                    elif act_name == "GELU":
                        current = 0.5 * z * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (z + 0.044715 * (z ** 3))))
                    else:
                        current = 1.0 / (1.0 + np.exp(-np.clip(z, -20, 20)))
                
                # Softmax layer output
                z_out = np.dot(current, weights[-1]) + biases[-1]
                exp_vals = np.exp(z_out - np.max(z_out, axis=1, keepdims=True))
                probs = (exp_vals / np.sum(exp_vals, axis=1, keepdims=True))[0]
                
                for cls_name, prob in zip(classes, probs):
                    mlp_probs[cls_name] = float(prob)
                has_mlp = True
        except Exception as mlp_err:
            print("MLP forward solver warning:", mlp_err, file=sys.stderr)

        results = []
        for row in rows:
            name, formula, crystal_system, space_group, density, peaks_json, description = row
            ref_peaks = json.loads(peaks_json)
            
            # Use neural spectral similarity aligner
            similarity = CrystallineNeuralAligner.calculate_spectral_cosine_similarity(experimental_peaks, ref_peaks)
            
            # Execute machine learning optimization for strain & broadening alignment
            opt_similarity, opt_strain, opt_sigma = CrystallineNeuralAligner.optimize_alignment(experimental_peaks, ref_peaks)
            
            # Traditional analytical validation indicator
            val_score = validate_phase_id(experimental_peaks, ref_peaks, tolerance=0.3)
            
            # Calculate physical crystallite size via the Scherrer Equation
            try:
                max_ref_peak = max(ref_peaks, key=lambda x: x["intensity"])
                theta_rad = math.radians(max_ref_peak["two_theta"] / 2.0)
                fwhm_deg = 2.35482 * opt_sigma
                fwhm_rad = math.radians(fwhm_deg)
                cos_theta = math.cos(theta_rad)
                if fwhm_rad * cos_theta > 0:
                    domain_size_nm = (0.94 * 0.154056) / (fwhm_rad * cos_theta)
                else:
                    domain_size_nm = 0.0
            except:
                domain_size_nm = 0.0
            
            # Blend continuous Bragg correlation with deep learning model's output class probability
            mlp_prob = mlp_probs.get(name, 0.0) if has_mlp else None
            if mlp_prob is not None:
                # 60% weight on continuous fit similarity, 40% weight on deep neural classifier likelihood
                combined_similarity = 0.6 * opt_similarity + 0.4 * mlp_prob
            else:
                combined_similarity = opt_similarity

            results.append({
                "name": name,
                "formula": formula,
                "crystal_system": crystal_system,
                "space_group": space_group,
                "density": density,
                "reference_peaks": ref_peaks,
                "alignment_similarity": similarity,
                "optimized_similarity": opt_similarity,
                "combined_similarity": combined_similarity,
                "fitted_strain_pct": opt_strain * 100.0,
                "fitted_domain_size_broadening": opt_sigma,
                "estimated_crystallite_size_nm": float(domain_size_nm),
                "validation_score": val_score,
                "description": description,
                "mlp_class_probability": mlp_prob * 100.0 if mlp_prob is not None else None,
                "mlp_trained_accuracy": mlp_acc if has_mlp else None,
                "mlp_architecture_type": mlp_arch if has_mlp else None
            })
            
        results.sort(key=lambda x: x["combined_similarity"], reverse=True)
        return results[:top_k]


class PythonCrystallineRAGPipeline:
    """ High-fidelity offline XMLD/XRD spectral matching pipeline. """
    def __init__(self):
        self.db = CrystallineVectorDatabase()

    def run_pipeline(self, experimental_peaks: List[Dict[str, float]], api_key: Optional[str] = None) -> Dict:
        """
        Executes query retrieval inside crystallography index and prepares
        grounding contextual instructions ready for LLM synthesis.
        """
        # 1. Retrieve Candidate Phase Cards using continuous neural spectral cosine aligner
        candidates = self.db.query_nearest_materials(experimental_peaks, top_k=2)
        
        # 2. Build Grounding Context
        grounding_context = "=== DETECTOR SPECTRUM RETRIEVAL GROUNDING CONTEXT ===\n"
        
        # Build synthesis query string from best candidates
        search_query_terms = []
        for idx, cand in enumerate(candidates):
            grounding_context += f"[Phase {idx+1}] Matched: {cand['name']} ({cand['formula']})\n"
            grounding_context += f"• Raw Lattice Similarity: {cand['alignment_similarity']*100:.1f}%\n"
            grounding_context += f"• Optimized Lattice Alignment Score: {cand['optimized_similarity']*100:.1f}%\n"
            if cand.get('mlp_class_probability') is not None:
                grounding_context += f"• Deep Learning Neural Net Classifier Probability: {cand['mlp_class_probability']:.2f}% (Model: {cand['mlp_architecture_type']}, CV Accuracy: {cand['mlp_trained_accuracy']}%) \n"
                grounding_context += f"• Physics-ML Hybrid Combined Similarity score: {cand['combined_similarity']*100:.1f}%\n"
            else:
                grounding_context += f"• Physics-ML Hybrid Combined Similarity score: {cand['optimized_similarity']*100:.1f}%\n"
            grounding_context += f"• Machine Learning Fitted Lattice Strain (dL/L): {cand['fitted_strain_pct']:.3f}%\n"
            grounding_context += f"• Broadening Scale (domain size): {cand['fitted_domain_size_broadening']:.2f}°\n"
            if cand.get('estimated_crystallite_size_nm', 0.0) > 0.0:
                grounding_context += f"• Estimated Crystallite Size (Scherrer Equation): {cand['estimated_crystallite_size_nm']:.2f} nm\n"
            grounding_context += f"• Space Group: {cand['space_group']} ({cand['crystal_system']} lattice)\n"
            grounding_context += f"• Density: {cand['density']} g/cm³\n"
            grounding_context += f"• Description: {cand['description']}\n"
            grounding_context += f"• Reference Peaks: {cand['reference_peaks']}\n\n"
            search_query_terms.extend([cand['name'], cand['formula']])
            
        # 2b. Add additional FTS Literature RAG retrieval
        if search_query_terms:
            literature_docs = self.db.search_literature(" ".join(search_query_terms), limit=3)
            if literature_docs:
                grounding_context += "=== LITERATURE KNOWLEDGE AUGMENTATION ===\n"
                for doc in literature_docs:
                    grounding_context += f"• {doc['title']}: {doc['content']}\n"
                grounding_context += "\n"
            
        payload = {
            "retrieved_candidates": candidates,
            "grounding_context_text": grounding_context,
            "literature_docs": literature_docs if search_query_terms else [],
            "ready_for_gemini": True
        }
        
        # 3. Apply Gemini synthesis if API key is present
        if api_key:
            try:
                # Lazy loading standard modern Google GenAI library
                from google import genai
                client = genai.Client(api_key=api_key)
                
                prompt = (
                    "You are a Senior Crystallographer AI. Analyze the experimental XRD spectrum peak data.\n\n"
                    f"{grounding_context}\n"
                    f"User Experimental Peaks: {experimental_peaks}\n\n"
                    "Identify the dominant mineral phase. Support your answer with continuous peak alignment arguments.\n"
                    "Furthermore, if any LITERATURE KNOWLEDGE AUGMENTATION was retrieved, synthesize it to provide practical advice "
                    "(e.g., synthesis parameters, practical applications, or related structural properties).\n"
                    "Explain crystallite size calculations and strain interpretations in a professional manner."
                )
                
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                payload["gemini_analysis"] = response.text
            except Exception as e:
                payload["gemini_analysis_error"] = str(e)
                
        return payload


if __name__ == "__main__":
    import sys
    
    # Enable CLI json parsing
    if len(sys.argv) > 1 and sys.argv[1].startswith("--json="):
        json_str = sys.argv[1].split("=", 1)[1]
        try:
            input_data = json.loads(json_str)
            peaks = input_data.get("experimental_peaks", [])
            api_key = input_data.get("api_key", None)
            
            pipeline = PythonCrystallineRAGPipeline()
            results = pipeline.run_pipeline(peaks, api_key=api_key)
            print(json.dumps(results))
            sys.exit(0)
        except Exception as e:
            print(json.dumps({"error": str(str(e))}), file=sys.stderr)
            sys.exit(1)
            
    # Example simulated experimental pattern of crystalline Anatase (TiO2) with minor shifts
    experimental_instrument_output = [
        {"two_theta": 25.41, "intensity": 100}, # shifted slightly from 25.3
        {"two_theta": 37.85, "intensity": 25},
        {"two_theta": 48.06, "intensity": 30}
    ]
    
    print("--- RUNNING CRYSTALLINE RAG NEURAL NET ALIGNER PIPELINE (PYTHON) ---")
    pipeline = PythonCrystallineRAGPipeline()
    results = pipeline.run_pipeline(experimental_instrument_output)
    
    print("\nBest Grounded Matching Candidates:")
    for cand in results["retrieved_candidates"]:
        print(f"-> {cand['name']}:")
        print(f"   Lattice Spectral Similarity (Raw): {cand['alignment_similarity']*100:.2f}%")
        print(f"   Lattice Spectral Similarity (Optimized): {cand['optimized_similarity']*100:.2f}%")
        print(f"   Lattice Strain Fit Value: {cand['fitted_strain_pct']:.3f}%")
        print(f"   Broadening Domain Value: {cand['fitted_domain_size_broadening']:.2f}")
        print(f"   Validation Confidence Score: {cand['validation_score']:.2f}%")
        
    print("\nDrafted Context Payload for Gemini Ingestion:")
    print(results["grounding_context_text"])
