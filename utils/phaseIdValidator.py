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
            )
        ]
        
        cursor.executemany("""
            INSERT INTO material_standards (name, formula, crystal_system, space_group, density, peaks_json, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, materials)
        self.conn.commit()

    def query_nearest_materials(self, experimental_peaks: List[Dict[str, float]], top_k: int = 2) -> List[Dict]:
        """ Queries SQLite, computes cosine alignment neural similarities, and filters top matches with ML parameter fitting. """
        cursor = self.conn.cursor()
        cursor.execute("SELECT name, formula, crystal_system, space_group, density, peaks_json, description FROM material_standards")
        rows = cursor.fetchall()
        
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
            
            results.append({
                "name": name,
                "formula": formula,
                "crystal_system": crystal_system,
                "space_group": space_group,
                "density": density,
                "reference_peaks": ref_peaks,
                "alignment_similarity": similarity,
                "optimized_similarity": opt_similarity,
                "fitted_strain_pct": opt_strain * 100.0,
                "fitted_domain_size_broadening": opt_sigma,
                "validation_score": val_score,
                "description": description
            })
            
        results.sort(key=lambda x: x["optimized_similarity"], reverse=True)
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
        for idx, cand in enumerate(candidates):
            grounding_context += f"[Phase {idx+1}] Matched: {cand['name']} ({cand['formula']})\n"
            grounding_context += f"• Raw Lattice Similarity: {cand['alignment_similarity']*100:.1f}%\n"
            grounding_context += f"• Optimized Lattice Alignment Score: {cand['optimized_similarity']*100:.1f}%\n"
            grounding_context += f"• Machine Learning Fitted Lattice Strain (dL/L): {cand['fitted_strain_pct']:.3f}%\n"
            grounding_context += f"• Broadening Scale (domain size): {cand['fitted_domain_size_broadening']:.2f}°\n"
            grounding_context += f"• Space Group: {cand['space_group']} ({cand['crystal_system']} lattice)\n"
            grounding_context += f"• Density: {cand['density']} g/cm³\n"
            grounding_context += f"• Description: {cand['description']}\n"
            grounding_context += f"• Reference Peaks: {cand['reference_peaks']}\n\n"
            
        payload = {
            "retrieved_candidates": candidates,
            "grounding_context_text": grounding_context,
            "ready_for_gemini": True
        }
        
        # 3. Apply Gemini synthesis if API key is present
        if api_key:
            try:
                # Lazy loading standard modern Google GenAI library
                from google import genai
                client = genai.Client(apiKey=api_key)
                
                prompt = (
                    "You are a Senior Crystallographer AI. Analyze the experimental XRD spectrum peak data.\n\n"
                    f"{grounding_context}\n"
                    f"User Experimental Peaks: {experimental_peaks}\n\n"
                    "Identify the dominant mineral phase. Support your answer with continuous peak alignment arguments."
                )
                
                response = client.models.generate_content(
                    model='gemini-3.5-flash',
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
