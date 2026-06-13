import numpy as np
from typing import List, Dict, Tuple

def validate_phase_id(predicted_peaks: List[Dict[str, float]], reference_peaks: List[Dict[str, float]], tolerance: float = 0.1) -> float:
    """
    Verifies the neural network's PhaseID output against standard reference patterns.
    Calculates a scientific confidence score based on 2-theta alignment and relative intensity correlation.
    
    Args:
        predicted_peaks: List of dicts with 'two_theta' and 'intensity' from the sample.
        reference_peaks: List of dicts with 'two_theta' and 'intensity' from database reference.
        tolerance: 2-theta window (in degrees) for matching.
        
    Returns:
        Confidence score out of 100%.
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
    match_ratio = matched_peaks / len(reference_peaks)
    
    # 2. Intensity Penalty (accounts for 30% of final confidence)
    # Average intensity error per matched peak (0 to 100 scale)
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

if __name__ == "__main__":
    # Example scientific validation test
    predicted_xrd = [
        {'two_theta': 25.42, 'intensity': 100},
        {'two_theta': 35.10, 'intensity': 45},
        {'two_theta': 43.25, 'intensity': 30}
    ]
    
    reference_database_pattern = [
        {'two_theta': 25.35, 'intensity': 100},
        {'two_theta': 35.15, 'intensity': 50},
        {'two_theta': 43.10, 'intensity': 25},
        {'two_theta': 57.50, 'intensity': 15}
    ]
    
    score = validate_phase_id(predicted_xrd, reference_database_pattern, tolerance=0.15)
    print(f"Validation Complete.")
    print(f"PhaseID Neural Net Confidence Score: {score:.2f}%")
