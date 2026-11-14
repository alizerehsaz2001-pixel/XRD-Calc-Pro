import numpy as np
import json
import sqlite3
import math
import os
import re
import sys
from typing import List, Dict, Tuple, Optional, Any

DEFAULT_WAVELENGTH = 1.540598  # Cu Kα1 (Å)


def validate_phase_id(
    predicted_peaks: List[Dict[str, float]],
    reference_peaks: List[Dict[str, float]],
    tolerance: float = 0.25
) -> float:
    if not reference_peaks or not predicted_peaks:
        return 0.0

    matched_peaks = 0
    intensity_error_sum = 0.0

    max_ref_intensity = max([float(p.get("intensity", 100.0)) for p in reference_peaks]) or 100.0
    max_pred_intensity = max([float(p.get("intensity", 100.0)) for p in predicted_peaks]) or 100.0

    for rp in reference_peaks:
        ref_tt = float(rp.get("two_theta", 0.0))
        closest_match = None
        min_diff = tolerance

        for pp in predicted_peaks:
            pred_tt = float(pp.get("two_theta", 0.0))
            diff = abs(pred_tt - ref_tt)
            if diff <= min_diff:
                min_diff = diff
                closest_match = pp

        if closest_match:
            matched_peaks += 1
            ref_int_norm = (float(rp.get("intensity", 100.0)) / max_ref_intensity) * 100.0
            pred_int_norm = (float(closest_match.get("intensity", 100.0)) / max_pred_intensity) * 100.0
            intensity_error_sum += abs(ref_int_norm - pred_int_norm)

    match_ratio = matched_peaks / len(reference_peaks) if len(reference_peaks) > 0 else 0.0
    avg_intensity_error = (intensity_error_sum / matched_peaks) if matched_peaks > 0 else 100.0
    intensity_score = max(0.0, 100.0 - avg_intensity_error)

    confidence = (match_ratio * 72.0) + ((intensity_score / 100.0) * 28.0)

    major_peaks = [p for p in reference_peaks if (float(p.get("intensity", 0.0)) / max_ref_intensity) * 100.0 > 45.0]
    matched_major = 0
    for rp in major_peaks:
        ref_tt = float(rp.get("two_theta", 0.0))
        for pp in predicted_peaks:
            if abs(float(pp.get("two_theta", 0.0)) - ref_tt) <= tolerance * 1.25:
                matched_major += 1
                break

    if len(major_peaks) > 0:
        major_match_ratio = matched_major / len(major_peaks)
        confidence *= (0.35 + 0.65 * major_match_ratio)

    return float(max(0.0, min(100.0, round(confidence, 2))))


def compute_smith_snyder_fom(
    experimental_peaks: List[Dict[str, float]],
    reference_peaks: List[Dict[str, float]],
    tolerance_deg: float = 0.35
) -> float:
    if not experimental_peaks or not reference_peaks:
        return 0.0

    delta_errors = []
    for rp in reference_peaks:
        ref_tt = float(rp.get("two_theta", 0.0))
        best_diff = min(abs(float(ep.get("two_theta", 0.0)) - ref_tt) for ep in experimental_peaks)
        if best_diff <= tolerance_deg:
            delta_errors.append(max(0.008, best_diff))

    if not delta_errors:
        return 0.0

    mean_abs_err = sum(delta_errors) / len(delta_errors)
    completeness = len(delta_errors) / max(1, len(reference_peaks))
    fn_value = (1.0 / mean_abs_err) * completeness
    return round(float(min(150.0, fn_value)), 2)


class CrystallineNeuralAligner:
    @staticmethod
    def peaks_to_continuous_spectrum(
        peaks: List[Dict[str, float]],
        grid_size: int = 900,
        min_2theta: float = 5.0,
        max_2theta: float = 90.0,
        sigma: float = 0.35,
        eta: float = 0.35,
        strain: float = 0.0
    ) -> np.ndarray:
        two_theta_grid = np.linspace(min_2theta, max_2theta, grid_size, dtype=np.float32)
        spectrum = np.zeros(grid_size, dtype=np.float32)

        gamma = max(0.04, sigma * 1.17741)
        inv_two_sigma_sq = 1.0 / (2.0 * max(0.04, sigma) ** 2)

        for p in peaks:
            pos0 = float(p.get("two_theta", 0.0))
            val = float(p.get("intensity", 100.0))
            if pos0 <= 1.0 or pos0 >= 178.0 or val <= 0:
                continue

            if abs(strain) > 1e-7:
                theta0_rad = math.radians(pos0 * 0.5)
                sin_shifted = math.sin(theta0_rad) / max(0.25, 1.0 + strain)
                if abs(sin_shifted) >= 0.9999:
                    continue
                pos = math.degrees(2.0 * math.asin(sin_shifted))
            else:
                pos = pos0

            if min_2theta <= pos <= max_2theta:
                dx = two_theta_grid - pos
                gauss = np.exp(-(dx * dx) * inv_two_sigma_sq)
                lorentz = 1.0 / (1.0 + (dx / gamma) ** 2)
                spectrum += val * ((1.0 - eta) * gauss + eta * lorentz)

        norm = float(np.linalg.norm(spectrum))
        if norm > 1e-9:
            spectrum /= norm
        return spectrum

    @classmethod
    def calculate_spectral_cosine_similarity(
        cls,
        pattern_a: List[Dict[str, float]],
        pattern_b: List[Dict[str, float]]
    ) -> float:
        spec_a = cls.peaks_to_continuous_spectrum(pattern_a)
        spec_b = cls.peaks_to_continuous_spectrum(pattern_b)
        return float(np.dot(spec_a, spec_b))

    @classmethod
    def optimize_alignment(
        cls,
        experimental_peaks: List[Dict[str, float]],
        reference_peaks: List[Dict[str, float]]
    ) -> Tuple[float, float, float]:
        spec_exp = cls.peaks_to_continuous_spectrum(experimental_peaks, sigma=0.35)
        best_sim = -1.0
        best_strain = 0.0
        best_sigma = 0.35

        for st in np.linspace(-0.045, 0.045, 37):
            spec_ref = cls.peaks_to_continuous_spectrum(reference_peaks, sigma=0.35, strain=float(st))
            sim = float(np.dot(spec_exp, spec_ref))
            if sim > best_sim:
                best_sim = sim
                best_strain = float(st)

        for st in np.linspace(best_strain - 0.004, best_strain + 0.004, 17):
            spec_ref = cls.peaks_to_continuous_spectrum(reference_peaks, sigma=0.35, strain=float(st))
            sim = float(np.dot(spec_exp, spec_ref))
            if sim > best_sim:
                best_sim = sim
                best_strain = float(st)

        for sig in np.linspace(0.12, 1.10, 15):
            spec_ref = cls.peaks_to_continuous_spectrum(reference_peaks, sigma=float(sig), strain=best_strain)
            sim = float(np.dot(spec_exp, spec_ref))
            if sim > best_sim:
                best_sim = sim
                best_sigma = float(sig)

        return float(best_sim), float(best_strain), float(best_sigma)
