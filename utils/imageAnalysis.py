import sys
import json
import base64
import math
import time
from io import BytesIO
from typing import Dict, List, Any, Tuple

# Scientific dependencies loading
try:
    import numpy as np
    import scipy
    from scipy.ndimage import maximum_filter, label, sobel, gaussian_filter
    from scipy.signal import find_peaks, peak_widths
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False


def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decodes a base64 string directly into a monochrome grayscale numpy array."""
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    
    img_bytes = base64.b64decode(base64_str)
    
    if HAS_OPENCV:
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        if img is not None:
            return img

    if HAS_PIL:
        img = Image.open(BytesIO(img_bytes)).convert("L")
        return np.array(img)
    
    raise ImportError("Neither OpenCV (cv2) nor PIL (Pillow) is available to process image binary data.")


def to_base64_png(array_np: np.ndarray, colormap: str = "gray") -> str:
    """Converts a 2D/3D numpy array into a Base64-encoded PNG data URI string."""
    if not HAS_PIL and not HAS_OPENCV:
        return "data:image/png;base64,"

    # Clip and sanitize
    arr = np.nan_to_num(array_np, nan=0.0, posinf=255.0, neginf=0.0)
    arr = np.clip(arr, 0, 255).astype(np.uint8)

    if len(arr.shape) == 3:
        # RGB / BGR image
        if HAS_OPENCV:
            # OpenCV encode
            _, buffer = cv2.imencode('.png', cv2.cvtColor(arr, cv2.COLOR_RGB2BGR) if colormap != "bgr" else arr)
            return "data:image/png;base64," + base64.b64encode(buffer).decode("utf-8")
        elif HAS_PIL:
            img = Image.fromarray(arr)
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
    else:
        # 2D Grayscale array
        if colormap == "jet" and HAS_OPENCV:
            colored = cv2.applyColorMap(arr, cv2.COLORMAP_JET)
            _, buffer = cv2.imencode('.png', colored)
            return "data:image/png;base64," + base64.b64encode(buffer).decode("utf-8")
        elif colormap == "inferno" and HAS_OPENCV:
            colored = cv2.applyColorMap(arr, cv2.COLORMAP_INFERNO)
            _, buffer = cv2.imencode('.png', colored)
            return "data:image/png;base64," + base64.b64encode(buffer).decode("utf-8")
        elif colormap == "copper" and HAS_OPENCV:
            # Generate copper colormap
            gray_f = arr.astype(float)
            r = np.clip(gray_f * 1.25, 0, 255)
            g = np.clip(gray_f * 0.78, 0, 255)
            b = np.clip(gray_f * 0.45, 0, 255)
            rgb = np.stack([r, g, b], axis=-1).astype(np.uint8)
            return to_base64_png(rgb, colormap="rgb")
        elif HAS_OPENCV:
            _, buffer = cv2.imencode('.png', arr)
            return "data:image/png;base64," + base64.b64encode(buffer).decode("utf-8")
        elif HAS_PIL:
            img = Image.fromarray(arr).convert("L")
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

    return "data:image/png;base64,"


def compute_subpixel_beam_center(img_np: np.ndarray, method: str = "intensity_com", manual_cx: float = None, manual_cy: float = None, threshold_p: float = 90.0) -> Tuple[float, float]:
    """Calculates or refines the direct beam center (reciprocal space origin)."""
    h, w = img_np.shape
    if manual_cx is not None and manual_cy is not None and manual_cx > 0 and manual_cy > 0:
        return float(manual_cx), float(manual_cy)

    if method == "hough_circles" and HAS_OPENCV:
        # Try Hough circle detection for concentric pattern
        blurred = cv2.GaussianBlur(img_np, (9, 9), 2)
        circles = cv2.HoughCircles(
            blurred, 
            cv2.HOUGH_GRADIENT, 
            dp=1.2, 
            minDist=20, 
            param1=50, 
            param2=30, 
            minRadius=int(min(h, w) * 0.05), 
            maxRadius=int(min(h, w) * 0.45)
        )
        if circles is not None and len(circles[0]) > 0:
            # Average centers of detected concentric circles
            c_x = float(np.median(circles[0][:, 0]))
            c_y = float(np.median(circles[0][:, 1]))
            return c_x, c_y

    # Default robust Intensity Center of Mass (COM) on top percentile
    p_thresh = np.percentile(img_np, threshold_p)
    bright_mask = img_np >= p_thresh
    y_indices, x_indices = np.where(bright_mask)
    
    if len(x_indices) > 0:
        weights = img_np[bright_mask].astype(float)
        total_weight = np.sum(weights)
        if total_weight > 0:
            cx = float(np.sum(x_indices * weights) / total_weight)
            cy = float(np.sum(y_indices * weights) / total_weight)
            return cx, cy
        else:
            return float(np.mean(x_indices)), float(np.mean(y_indices))

    return w / 2.0, h / 2.0


def analyze_crystallogram(base64_image_str: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Advanced Scientific Computer Vision Crystallography Engine using OpenCV and SciPy.
    Performs beam center calibration, background subtraction, azimuthal cake integration,
    Debye-Scherrer ring fitting, single-crystal spot indexing, polar unwrapping, and 
    comprehensive crystallography metrics calculation.
    """
    start_time = time.time()
    
    # 1. Decode raw input image
    try:
        img_raw = decode_base64_image(base64_image_str)
    except Exception as e:
        return {"success": False, "error": f"Failed to decode image stream: {str(e)}"}
        
    h, w = img_raw.shape
    
    # Extract operational parameters
    wavelength_angstrom = float(params.get("wavelength", 1.5406))  # Cu K-alpha default
    detector_dist_mm = float(params.get("detector_distance", 150.0)) # Sample to detector distance in mm
    pixel_size_um = float(params.get("pixel_size", 75.0)) # Detector pixel pitch in microns
    
    threshold_lvl = float(params.get("threshold", 85.0))
    denoise_method = params.get("denoise_method", "bilateral") # bilateral, gaussian, none
    tophat_radius = int(params.get("tophat_radius", 25))
    apply_clahe = bool(params.get("apply_clahe", True))
    clahe_clip = float(params.get("clahe_clip", 3.0))
    
    manual_cx = params.get("manual_cx")
    manual_cy = params.get("manual_cy")
    center_method = params.get("center_method", "intensity_com")
    
    azimuth_start_deg = float(params.get("azimuth_start", 0.0))
    azimuth_end_deg = float(params.get("azimuth_end", 360.0))
    num_radial_bins = int(params.get("num_bins", 250))
    
    prominence_factor = float(params.get("prominence", 0.05))
    min_peak_dist_bins = int(params.get("min_ring_distance", 5))
    
    spot_threshold_p = float(params.get("spot_threshold_p", 93.0))
    spot_neighborhood = int(params.get("spot_neighborhood", 15))
    canny_low = int(params.get("canny_low", 40))
    canny_high = int(params.get("canny_high", 120))

    # 2. Image Preprocessing & Filter Pipeline with OpenCV
    img_processed = img_raw.copy()
    
    # 2.1 Denoising
    if HAS_OPENCV:
        if denoise_method == "bilateral":
            img_processed = cv2.bilateralFilter(img_processed, d=7, sigmaColor=50, sigmaSpace=50)
        elif denoise_method == "gaussian":
            img_processed = cv2.GaussianBlur(img_processed, (5, 5), 1.2)
    elif HAS_SCIPY and denoise_method != "none":
        img_processed = gaussian_filter(img_processed, sigma=1.0)

    # 2.2 Top-Hat Background Subtraction (removes slow-varying detector background)
    img_tophat = img_processed.copy()
    if HAS_OPENCV and tophat_radius > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (tophat_radius * 2 + 1, tophat_radius * 2 + 1))
        img_tophat = cv2.morphologyEx(img_processed, cv2.MORPH_TOPHAT, kernel)
        
    # 2.3 CLAHE Contrast Enhancement
    img_clahe = img_processed.copy()
    if HAS_OPENCV and apply_clahe:
        clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8))
        img_clahe = clahe.apply(img_processed)

    # 3. Sub-pixel Center Calibration
    cx, cy = compute_subpixel_beam_center(
        img_processed, 
        method=center_method, 
        manual_cx=manual_cx, 
        manual_cy=manual_cy, 
        threshold_p=threshold_lvl
    )
    
    # 4. Geometry and 2D Radial & Azimuthal Coordinates Grid
    y_grid, x_grid = np.indices((h, w), dtype=float)
    dx_grid = x_grid - cx
    dy_grid = y_grid - cy
    r_grid = np.sqrt(dx_grid**2 + dy_grid**2)
    
    # Angles in degrees [0, 360)
    theta_rad_grid = np.arctan2(dy_grid, dx_grid)
    theta_deg_grid = (np.degrees(theta_rad_grid) + 360.0) % 360.0

    min_dist_edge = min(cx, cy, w - cx, h - cy)
    max_radius_px = int(math.sqrt((max(cx, w - cx))**2 + (max(cy, h - cy))**2))
    effective_max_r = min(max_radius_px, int(max(w, h) * 0.7))

    # 5. Calibrated 1D Radial Integration & Azimuthal Sector Masking
    # Sector mask selection (e.g. 0-360 for full cake, or specific quadrant)
    if azimuth_start_deg <= azimuth_end_deg:
        sector_mask = (theta_deg_grid >= azimuth_start_deg) & (theta_deg_grid <= azimuth_end_deg)
    else:
        # Wrapping across 0/360 boundary
        sector_mask = (theta_deg_grid >= azimuth_start_deg) | (theta_deg_grid <= azimuth_end_deg)

    bins = np.linspace(1.0, effective_max_r, num_radial_bins)
    bin_centers = 0.5 * (bins[:-1] + bins[1:])
    bin_indices = np.digitize(r_grid, bins)

    radial_profile = []
    intensities_raw = []
    
    # Pixel size in mm
    pixel_size_mm = pixel_size_um * 1e-3
    
    for i in range(1, len(bins)):
        bin_mask = (bin_indices == i) & sector_mask
        pixels = img_tophat[bin_mask]
        
        if len(pixels) > 0:
            mean_val = float(np.mean(pixels))
            std_val = float(np.std(pixels))
        else:
            mean_val = 0.0
            std_val = 0.0
            
        r_px = float(bin_centers[i - 1])
        # Physical radius at detector in mm
        r_mm = r_px * pixel_size_mm
        
        # 2-Theta calculation in degrees: tan(2theta) = r_mm / D
        two_theta_rad = math.atan2(r_mm, detector_dist_mm)
        two_theta_deg = math.degrees(two_theta_rad)
        
        # Reciprocal scattering vector q = 4*pi*sin(theta) / lambda
        theta_bragg_rad = two_theta_rad / 2.0
        sin_theta = math.sin(theta_bragg_rad)
        q_inv_angstrom = (4.0 * math.pi * sin_theta) / wavelength_angstrom if wavelength_angstrom > 0 else 0.0
        
        # Interplanar d-spacing: d = lambda / (2 * sin(theta))
        d_spacing_angstrom = (wavelength_angstrom / (2.0 * sin_theta)) if sin_theta > 1e-6 else 999.9

        radial_profile.append({
            "radius_px": round(r_px, 2),
            "radius_mm": round(r_mm, 3),
            "two_theta_deg": round(two_theta_deg, 4),
            "q_inv_a": round(q_inv_angstrom, 4),
            "d_spacing_a": round(d_spacing_angstrom, 4) if d_spacing_angstrom < 100 else 0.0,
            "intensity": round(mean_val, 2),
            "intensity_std": round(std_val, 2)
        })
        intensities_raw.append(mean_val)

    # 6. Advanced 1D Peak Finding & Profile Fitting (Debye-Scherrer Rings)
    detected_rings = []
    intensities_arr = np.array(intensities_raw)
    
    if HAS_SCIPY and len(intensities_arr) > 10:
        # Smooth with small Savitzky-Golay or Gaussian kernel for peak detection
        smoothed = gaussian_filter(intensities_arr, sigma=1.5)
        
        max_sig = np.max(smoothed) if np.max(smoothed) > 0 else 1.0
        min_prominence = max_sig * prominence_factor
        
        peak_idx, peak_props = find_peaks(
            smoothed, 
            prominence=min_prominence, 
            distance=min_peak_dist_bins
        )
        
        # Calculate FWHM for each detected peak
        if len(peak_idx) > 0:
            widths_res = peak_widths(smoothed, peak_idx, rel_height=0.5)
            fwhm_bins = widths_res[0]
            
            bin_step_px = (bins[-1] - bins[0]) / (num_radial_bins - 1)
            
            for p_num, idx in enumerate(peak_idx):
                rad_info = radial_profile[idx]
                fwhm_px = float(fwhm_bins[p_num] * bin_step_px)
                
                # FWHM in 2theta degrees
                r_peak_mm = rad_info["radius_px"] * pixel_size_mm
                r_half_left_mm = max(0.0, (rad_info["radius_px"] - fwhm_px / 2.0) * pixel_size_mm)
                r_half_right_mm = (rad_info["radius_px"] + fwhm_px / 2.0) * pixel_size_mm
                
                tt_left = math.degrees(math.atan2(r_half_left_mm, detector_dist_mm))
                tt_right = math.degrees(math.atan2(r_half_right_mm, detector_dist_mm))
                fwhm_2theta_deg = max(0.001, tt_right - tt_left)
                
                # Scherrer Crystallite Size D = (0.9 * lambda) / (beta * cos(theta))
                beta_rad = math.radians(fwhm_2theta_deg)
                theta_rad = math.radians(rad_info["two_theta_deg"] / 2.0)
                cos_theta = math.cos(theta_rad)
                
                scherrer_d_nm = ((0.94 * (wavelength_angstrom * 0.1)) / (beta_rad * cos_theta)) if beta_rad * cos_theta > 1e-6 else 0.0
                
                detected_rings.append({
                    "ring_index": p_num + 1,
                    "radius_px": rad_info["radius_px"],
                    "two_theta_deg": rad_info["two_theta_deg"],
                    "q_inv_a": rad_info["q_inv_a"],
                    "d_spacing_a": rad_info["d_spacing_a"],
                    "intensity": rad_info["intensity"],
                    "fwhm_px": round(fwhm_px, 2),
                    "fwhm_2theta_deg": round(fwhm_2theta_deg, 4),
                    "crystallite_size_nm": round(scherrer_d_nm, 2)
                })

    # 7. Ellipticity and Detector Tilt Estimation via Sub-pixel Contours
    ring_ellipses = []
    if HAS_OPENCV and len(detected_rings) > 0:
        for r_item in detected_rings[:6]: # Analyze up to first 6 rings
            r_target = r_item["radius_px"]
            # Create a localized annular band around the target radius
            annulus_mask = (r_grid >= (r_target - 6)) & (r_grid <= (r_target + 6))
            band_img = np.zeros_like(img_tophat)
            band_img[annulus_mask] = img_tophat[annulus_mask]
            
            # Threshold within the band
            b_thresh = np.percentile(band_img[annulus_mask], 75) if np.any(annulus_mask) else 50
            _, bin_band = cv2.threshold(band_img, b_thresh, 255, cv2.THRESH_BINARY)
            
            contours, _ = cv2.findContours(bin_band, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            all_pts = []
            for c in contours:
                if len(c) >= 5:
                    all_pts.extend(c)
                    
            if len(all_pts) >= 15:
                pts_arr = np.array(all_pts)
                ellipse = cv2.fitEllipse(pts_arr)
                (e_cx, e_cy), (e_d1, e_d2), e_angle = ellipse
                semi_major = max(e_d1, e_d2) / 2.0
                semi_minor = min(e_d1, e_d2) / 2.0
                ellipticity = 1.0 - (semi_minor / semi_major) if semi_major > 0 else 0.0
                
                # Estimated detector tilt angle alpha = arccos(semi_minor / semi_major)
                tilt_alpha_deg = math.degrees(math.acos(min(1.0, semi_minor / max(1e-5, semi_major))))
                
                ring_ellipses.append({
                    "ring_index": r_item["ring_index"],
                    "center": (round(float(e_cx), 1), round(float(e_cy), 1)),
                    "semi_major_px": round(float(semi_major), 2),
                    "semi_minor_px": round(float(semi_minor), 2),
                    "ellipticity": round(float(ellipticity), 4),
                    "tilt_angle_deg": round(float(e_angle), 2),
                    "detector_tilt_deg": round(float(tilt_alpha_deg), 2)
                })

    # 8. 2D Diffraction Spot Peak Analyzer (Single Crystal / SAED Reflections)
    detected_spots = []
    spot_vectors = []
    
    if HAS_OPENCV or HAS_SCIPY:
        # Spot segmentation with Connected Components
        spot_thresh_val = np.percentile(img_tophat, spot_threshold_p)
        spot_bin = (img_tophat > spot_thresh_val).astype(np.uint8) * 255
        
        if HAS_OPENCV:
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(spot_bin, connectivity=8)
            
            for lbl in range(1, num_labels):
                area = stats[lbl, cv2.CC_STAT_AREA]
                if 2 <= area <= 600: # Filter out single-pixel noise and huge background lumps
                    sx, sy = float(centroids[lbl][0]), float(centroids[lbl][1])
                    s_r = math.sqrt((sx - cx)**2 + (sy - cy)**2)
                    
                    # Ignore direct beam stop region
                    if s_r > 15:
                        s_mask = labels == lbl
                        s_intensity = int(np.max(img_raw[s_mask])) if np.any(s_mask) else 0
                        int_counts = int(np.sum(img_raw[s_mask])) if np.any(s_mask) else 0
                        
                        s_two_theta = math.degrees(math.atan2(s_r * pixel_size_mm, detector_dist_mm))
                        
                        detected_spots.append({
                            "spot_id": len(detected_spots) + 1,
                            "x": round(sx, 1),
                            "y": round(sy, 1),
                            "radius_px": round(s_r, 1),
                            "two_theta_deg": round(s_two_theta, 3),
                            "area_px": int(area),
                            "peak_intensity": s_intensity,
                            "integrated_intensity": int_counts
                        })
        elif HAS_SCIPY:
            local_max = (img_tophat == maximum_filter(img_tophat, spot_neighborhood)) & (img_tophat > spot_thresh_val)
            s_y_arr, s_x_arr = np.where(local_max)
            for idx, (sy, sx) in enumerate(zip(s_y_arr, s_x_arr)):
                s_r = math.sqrt((sx - cx)**2 + (sy - cy)**2)
                if s_r > 15:
                    s_two_theta = math.degrees(math.atan2(s_r * pixel_size_mm, detector_dist_mm))
                    detected_spots.append({
                        "spot_id": idx + 1,
                        "x": round(float(sx), 1),
                        "y": round(float(sy), 1),
                        "radius_px": round(s_r, 1),
                        "two_theta_deg": round(s_two_theta, 3),
                        "area_px": 9,
                        "peak_intensity": int(img_raw[sy, sx]),
                        "integrated_intensity": int(img_raw[sy, sx])
                    })

        # Reciprocal Lattice Vector discovery on brightest spots
        if len(detected_spots) >= 4:
            sorted_spots = sorted(detected_spots, key=lambda s: s["peak_intensity"], reverse=True)[:30]
            # Find primitive basis pairs
            vecs = []
            for sp in sorted_spots:
                vx = sp["x"] - cx
                vy = sp["y"] - cy
                v_len = math.sqrt(vx**2 + vy**2)
                vecs.append((vx, vy, v_len, sp))
                
            # Sort by vector length from center
            vecs = sorted(vecs, key=lambda v: v[2])
            if len(vecs) >= 2:
                v1 = vecs[0]
                # Find v2 that is not collinear with v1
                for v_cand in vecs[1:]:
                    cross_prod = abs(v1[0] * v_cand[1] - v1[1] * v_cand[0])
                    if cross_prod > (v1[2] * v_cand[2] * 0.25): # At least ~15 deg apart
                        dot_prod = v1[0] * v_cand[0] + v1[1] * v_cand[1]
                        cos_angle = dot_prod / (v1[2] * v_cand[2])
                        cos_angle = max(-1.0, min(1.0, cos_angle))
                        angle_deg = math.degrees(math.acos(cos_angle))
                        
                        spot_vectors.append({
                            "vector_1_len_px": round(v1[2], 2),
                            "vector_2_len_px": round(v_cand[2], 2),
                            "inter_vector_angle_deg": round(angle_deg, 2),
                            "v1_d_spacing_a": round(v1[3]["two_theta_deg"], 3),
                            "v2_d_spacing_a": round(v_cand[3]["two_theta_deg"], 3)
                        })
                        break

    # 9. Azimuthal Orientation & Herman's Orientation Factor f
    # Extract azimuthal intensity profile I(chi) at the most prominent ring radius
    azimuthal_profile = []
    hermans_f = 0.0
    anisotropy_index = 0.0
    
    if len(detected_rings) > 0:
        primary_r = detected_rings[0]["radius_px"]
        annulus_w = 4.0
        ring_annulus_mask = (r_grid >= (primary_r - annulus_w)) & (r_grid <= (primary_r + annulus_w))
        
        num_chi_steps = 72 # 5 deg increments
        chi_bins = np.linspace(0, 360, num_chi_steps + 1)
        
        chi_intensities = []
        for c_idx in range(len(chi_bins) - 1):
            c_min, c_max = chi_bins[c_idx], chi_bins[c_idx + 1]
            c_mask = ring_annulus_mask & (theta_deg_grid >= c_min) & (theta_deg_grid < c_max)
            if np.any(c_mask):
                val = float(np.mean(img_tophat[c_mask]))
            else:
                val = 0.0
            azimuthal_profile.append({
                "chi_deg": round(float((c_min + c_max) / 2.0), 1),
                "intensity": round(val, 2)
            })
            chi_intensities.append(val)
            
        chi_arr = np.array(chi_intensities)
        if len(chi_arr) > 0 and np.mean(chi_arr) > 0:
            anisotropy_index = float(np.std(chi_arr) / np.mean(chi_arr))
            
            # Herman's orientation factor: f = (3 <cos^2 chi> - 1) / 2
            chi_rad = np.radians(np.array([item["chi_deg"] for item in azimuthal_profile]))
            cos2_chi = np.cos(chi_rad)**2
            total_int = np.sum(chi_arr)
            if total_int > 0:
                mean_cos2 = np.sum(cos2_chi * chi_arr) / total_int
                hermans_f = float((3.0 * mean_cos2 - 1.0) / 2.0)

    # 10. 2D Polar Unwrapping (r - chi unwrap)
    polar_unwrapped_b64 = ""
    if HAS_OPENCV:
        try:
            # Warp polar: converts concentric rings into horizontal parallel strips
            polar_img = cv2.warpPolar(
                img_tophat, 
                dsize=(int(effective_max_r), 360), 
                center=(cx, cy), 
                maxRadius=effective_max_r, 
                flags=cv2.WARP_POLAR_LINEAR + cv2.INTER_LINEAR
            )
            # Transpose to place radius along X-axis and Chi along Y-axis
            polar_unwrapped_b64 = to_base64_png(polar_img, colormap="inferno")
        except Exception:
            polar_unwrapped_b64 = ""

    # 11. Quality Diagnostics
    bg_level = float(np.percentile(img_raw, 15))
    max_level = float(np.max(img_raw))
    noise_sigma = max(1.0, float(np.std(img_raw[img_raw <= bg_level])))
    snr_db = 20.0 * math.log10(max(1.0, (max_level - bg_level) / noise_sigma))
    contrast_ratio = max_level / max(1.0, bg_level)

    # 12. Generate Diagnostic Overlay Images
    processed_images = {}
    
    # 12.1 Original with Crosshairs & Scale Overlay
    annotated_orig = cv2.cvtColor(img_raw, cv2.COLOR_GRAY2BGR) if HAS_OPENCV else np.stack([img_raw, img_raw, img_raw], axis=-1)
    if HAS_OPENCV:
        # Beam Center marker
        icx, icy = int(round(cx)), int(round(cy))
        cv2.drawMarker(annotated_orig, (icx, icy), (0, 255, 255), cv2.MARKER_CROSS, 20, 2)
        cv2.circle(annotated_orig, (icx, icy), 12, (0, 255, 255), 1)
        
        # Calibration Scale Bar in bottom-left
        bar_len_px = int(50.0 / pixel_size_mm) # 50mm scale bar
        if bar_len_px > 10 and bar_len_px < w - 40:
            cv2.line(annotated_orig, (30, h - 30), (30 + bar_len_px, h - 30), (0, 255, 100), 3)
            cv2.putText(annotated_orig, "50 mm", (30, h - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 100), 1, cv2.LINE_AA)
            
        processed_images["original_annotated"] = to_base64_png(annotated_orig, colormap="bgr")
    else:
        processed_images["original_annotated"] = to_base64_png(img_raw)

    # 12.2 Canny Edge Contours
    if HAS_OPENCV:
        canny_edges = cv2.Canny(img_processed, canny_low, canny_high)
        processed_images["canny_edges"] = to_base64_png(canny_edges)
    elif HAS_SCIPY:
        dx = sobel(img_processed, 0)
        dy = sobel(img_processed, 1)
        edges_np = np.clip(np.hypot(dx, dy) / max(1.0, np.max(np.hypot(dx, dy))) * 255, 0, 255).astype(np.uint8)
        processed_images["canny_edges"] = to_base64_png(edges_np)

    # 12.3 CLAHE & Top-Hat Images
    processed_images["clahe_enhanced"] = to_base64_png(img_clahe)
    processed_images["tophat_bg"] = to_base64_png(img_tophat)
    
    # 12.4 Polar Unwrapped
    if polar_unwrapped_b64:
        processed_images["polar_unwrapped"] = polar_unwrapped_b64

    # 12.5 Single Crystal Spot Detections Overlay
    spot_overlay = cv2.cvtColor(img_raw, cv2.COLOR_GRAY2BGR) if HAS_OPENCV else np.stack([img_raw, img_raw, img_raw], axis=-1)
    if HAS_OPENCV:
        for sp in detected_spots[:250]:
            sx, sy = int(round(sp["x"])), int(round(sp["y"]))
            cv2.drawMarker(spot_overlay, (sx, sy), (0, 255, 120), cv2.MARKER_CROSS, 8, 1)
            cv2.circle(spot_overlay, (sx, sy), 4, (255, 120, 0), 1)
        processed_images["spot_contours"] = to_base64_png(spot_overlay, colormap="bgr")
    else:
        processed_images["spot_contours"] = to_base64_png(img_raw)

    # 12.6 Concentric Debye-Scherrer Ring Fits Overlay
    ring_overlay = cv2.cvtColor(img_raw, cv2.COLOR_GRAY2BGR) if HAS_OPENCV else np.stack([img_raw, img_raw, img_raw], axis=-1)
    if HAS_OPENCV:
        # Beam center
        cv2.circle(ring_overlay, (int(round(cx)), int(round(cy))), 4, (0, 200, 255), -1)
        for r_info in detected_rings:
            r_px_val = int(round(r_info["radius_px"]))
            cv2.circle(ring_overlay, (int(round(cx)), int(round(cy))), r_px_val, (255, 100, 50), 2)
            # Label
            label_text = f"#{r_info['ring_index']} (2th={r_info['two_theta_deg']:.1f}deg)"
            lx = int(cx + r_px_val * 0.707)
            ly = int(cy - r_px_val * 0.707)
            if 10 <= lx < w - 10 and 10 <= ly < h - 10:
                cv2.putText(ring_overlay, label_text, (lx, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1, cv2.LINE_AA)
        processed_images["ring_fits"] = to_base64_png(ring_overlay, colormap="bgr")
    else:
        processed_images["ring_fits"] = to_base64_png(img_raw)

    # 12.7 False-Color Thermal Heatmap
    processed_images["radial_heatmap"] = to_base64_png(img_raw, colormap="jet")

    # 13. Build Comprehensive Markdown Report
    report_md = f"""### 🔬 Python + OpenCV Advanced Crystallographic Vision Diagnostic Report

#### 📊 Beam Geometry & Reciprocal Calibration
- **Direct Beam Center (Reciprocal Origin)**: `(cx = {cx:.2f} px, cy = {cy:.2f} px)`
- **Radiation Wavelength ($\lambda$)**: `{wavelength_angstrom:.4f} Å` ({'Cu Kα' if abs(wavelength_angstrom - 1.5406) < 0.01 else 'Calibrated Source'})
- **Sample-to-Detector Distance ($D$)**: `{detector_dist_mm:.1f} mm` | **Pixel Pitch**: `{pixel_size_um:.1f} µm`
- **Detector Frame Dimensions**: `{w} × {h} pixels` (`{w * pixel_size_mm:.1f} × {h * pixel_size_mm:.1f} mm`)

---

#### 📈 Extracted Concentric Bragg Rings (Debye-Scherrer Shells)
| Ring # | Pixel Radius (r) | 2θ (deg) | q (1/Å) | d-spacing (Å) | Intensity (a.u.) | FWHM (2θ) | Scherrer Size (D) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
"""
    if len(detected_rings) == 0:
        report_md += "| No discrete rings identified | N/A | N/A | N/A | N/A | N/A | N/A | N/A |\n"
    else:
        for r_item in detected_rings:
            report_md += f"| **#{r_item['ring_index']}** | `{r_item['radius_px']:.1f} px` | `{r_item['two_theta_deg']:.3f}°` | `{r_item['q_inv_a']:.3f}` | `{r_item['d_spacing_a']:.3f}` | `{r_item['intensity']:.1f}` | `{r_item['fwhm_2theta_deg']:.3f}°` | `{r_item['crystallite_size_nm']:.1f} nm` |\n"

    report_md += f"""
---

#### 🔭 Detector Quality & Crystal Texture Assessment
- **Estimated Background Noise**: `{bg_level:.1f} ADC counts`
- **Signal-to-Noise Ratio (SNR)**: `{snr_db:.2f} dB` (Standard Deviation: `{noise_sigma:.2f}`)
- **Dynamic Contrast Ratio**: `{contrast_ratio:.2f} : 1`
- **Single-Crystal Discrete Spots Count**: `{len(detected_spots)}` reflections
- **Azimuthal Anisotropy Index**: `{anisotropy_index:.4f}`
- **Herman's Orientation Factor ($f$)**: `{hermans_f:.4f}` ({'Isotropic Powder' if abs(hermans_f) < 0.15 else 'Preferred Fiber/Crystallite Texture' if hermans_f > 0.15 else 'Perpendicular Radial Alignment'})
"""

    if len(ring_ellipses) > 0:
        primary_ellipse = ring_ellipses[0]
        report_md += f"""
#### 📐 Geometric Ring Distortion & Detector Tilt
- **Primary Ring Ellipticity ($1 - b/a$)**: `{primary_ellipse['ellipticity']:.4f}`
- **Estimated Camera Out-of-Plane Tilt ($\alpha$)**: `{primary_ellipse['detector_tilt_deg']:.2f}°`
- **Tilt Major Axis Angle ($\phi$)**: `{primary_ellipse['tilt_angle_deg']:.1f}°`
"""

    if len(spot_vectors) > 0:
        sv = spot_vectors[0]
        report_md += f"""
#### 🧊 2D Reciprocal Lattice Spot Vectors (SAED / Laue)
- **Primitive Vector $|a^*|$**: `{sv['vector_1_len_px']:.1f} px`
- **Primitive Vector $|b^*|$**: `{sv['vector_2_len_px']:.1f} px`
- **Inter-vector Angle ($\gamma^*$)**: `{sv['inter_vector_angle_deg']:.2f}°`
"""

    # Build d-spacing list string for markdown
    first_d_spacings = ", ".join([f"{r['d_spacing_a']:.3f} Å" for r in detected_rings[:3]]) if detected_rings else "N/A"
    mean_scherrer = np.mean([r['crystallite_size_nm'] for r in detected_rings if r['crystallite_size_nm'] > 0]) if detected_rings else 0.0

    report_md += f"""
---

#### 💡 Actionable Insights for XRD Refinement
1. **1D Profile Ready**: 1D azimuthal radial integration successfully partitioned across `{len(radial_profile)}` radial bins.
2. **Phase Identification**: The first 3 prominent reflections at $d = {first_d_spacings}$ provide immediate finger-printing anchors for ICDD/PDF search.
3. **Crystallite Sizing**: Mean volume-weighted Scherrer crystallite diameter estimated at `{mean_scherrer:.1f} nm` if Scherrer conditions hold.
"""

    execution_duration = time.time() - start_time

    return {
        "success": True,
        "execution_duration": f"{execution_duration * 1000.0:.1f}ms",
        "cx": round(cx, 2),
        "cy": round(cy, 2),
        "detector_geometry": {
            "wavelength": wavelength_angstrom,
            "detector_distance_mm": detector_dist_mm,
            "pixel_size_um": pixel_size_um,
            "width_px": w,
            "height_px": h
        },
        "radial_profile": radial_profile,
        "azimuthal_profile": azimuthal_profile,
        "detected_rings": detected_rings,
        "ring_ellipses": ring_ellipses,
        "detected_spots_count": len(detected_spots),
        "detected_spots": detected_spots[:100], # Pass top 100 spots
        "spot_vectors": spot_vectors,
        "background_noise": bg_level,
        "snr": snr_db,
        "contrast_ratio": contrast_ratio,
        "anisotropy_index": anisotropy_index,
        "hermans_orientation_factor": hermans_f,
        "processed_images": processed_images,
        "report_md": report_md,
        "opencv_enabled": HAS_OPENCV,
        "scipy_enabled": HAS_SCIPY
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", type=str, required=False, help="Input parameters in nested JSON encoding")
    
    args = parser.parse_args()
    
    try:
        if args.json:
            payload = json.loads(args.json)
        else:
            stdin_data = sys.stdin.read()
            payload = json.loads(stdin_data)
            
        if isinstance(payload, str):
            payload = json.loads(payload)
            
        base64_img = payload.get("image", "")
        params = payload.get("params", {})
        
        results = analyze_crystallogram(base64_img, params)
        print(json.dumps(results))
    except Exception as outer_err:
        outer_error = {
            "success": False,
            "error": f"Internal execution fault in Python OpenCV helper: {str(outer_err)}"
        }
        print(json.dumps(outer_error))
