import sys
import json
import base64
import math
import time
from io import BytesIO
from typing import Dict, List, Any

# Ensure we can load scientific dependencies
try:
    import numpy as np
    import scipy
    from scipy.ndimage import maximum_filter, label, sobel
    from scipy.signal import find_peaks
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

def decode_base64_image(base64_str: str) -> Any:
    """Decodes a base64 string directly into a monochrome grayscale numpy array."""
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    
    img_bytes = base64.b64decode(base64_str)
    
    if HAS_PIL:
        img = Image.open(BytesIO(img_bytes)).convert("L")
        return np.array(img)
    elif HAS_OPENCV:
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        return img
    else:
        raise ImportError("Neither PIL (Pillow) nor OpenCV (cv2) is available to process image binary data.")

def to_base64_png(array_np: Any, colormap: str = "gray") -> str:
    """Converts a 2D numpy array (mono/RGB) into a Base64-encoded PNG string."""
    if not HAS_PIL:
        # Fallback to a header-less mockup / raw if PIL is missing, but PIL is almost certainly there
        return "data:image/png;base64,"
        
    if len(array_np.shape) == 3:
        img = Image.fromarray(array_np.astype(np.uint8))
    else:
        if colormap == "jet":
            # Direct scientific pseudo-color mapper: map monochrome array [0-255] to jet-like colors
            gray = array_np.astype(float)
            r = np.clip(1.5 - np.abs(gray - 180) * 0.02, 0, 1) * 255
            g = np.clip(1.5 - np.abs(gray - 120) * 0.02, 0, 1) * 255
            b = np.clip(1.5 - np.abs(gray - 60) * 0.02, 0, 1) * 255
            combined = np.stack([r, g, b], axis=-1).astype(np.uint8)
            img = Image.fromarray(combined)
        elif colormap == "copper":
            gray = array_np.astype(float)
            r = np.clip(gray * 1.2, 0, 255)
            g = np.clip(gray * 0.78, 0, 255)
            b = np.clip(gray * 0.45, 0, 255)
            combined = np.stack([r, g, b], axis=-1).astype(np.uint8)
            img = Image.fromarray(combined)
        else:
            img = Image.fromarray(array_np.astype(np.uint8)).convert("L")
            
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

def analyze_crystallogram(base64_image_str: str, params: Dict[str, Any]) -> Dict[str, Any]:
    start_time = time.time()
    
    # 1. Decode image
    try:
        img_np = decode_base64_image(base64_image_str)
    except Exception as e:
        return {"success": False, "error": f"Failed to decode image stream: {str(e)}"}
        
    h, w = img_np.shape
    
    # 2. Compute Beam Center / Center of Gravity (Centroid)
    # Background and peaks can skew simple centroids. We threshold first.
    threshold_lvl = float(params.get("threshold", 85.0))
    p_thresh = np.percentile(img_np, threshold_lvl)
    bright_mask = img_np >= p_thresh
    
    y_indices, x_indices = np.where(bright_mask)
    if len(x_indices) > 0:
        cx = float(np.mean(x_indices))
        cy = float(np.mean(y_indices))
    else:
        cx, cy = w / 2.0, h / 2.0
        
    # 3. 1D Radial Integration Profile
    y_grid, x_grid = np.indices((h, w))
    r_grid = np.sqrt((x_grid - cx)**2 + (y_grid - cy)**2)
    
    min_dist_edge = np.min([cx, cy, w - cx, h - cy])
    max_radius = int(min_dist_edge if min_dist_edge > 20 else math.sqrt(h**2 + w**2) / 2.0)
    
    # Generate 150 bins from r=0 to max_radius
    num_bins = 150
    bins = np.linspace(0, max_radius, num_bins)
    digitized = np.digitize(r_grid, bins)
    
    radial_profile = []
    intensities = []
    
    for i in range(1, len(bins)):
        bin_mask = digitized == i
        pixels = img_np[bin_mask]
        mean_val = float(np.mean(pixels)) if len(pixels) > 0 else 0.0
        radial_profile.append({
            "radius": round(float(bins[i-1]), 1),
            "intensity": round(mean_val, 2)
        })
        intensities.append(mean_val)
        
    # 4. Find Peaks in 1D Radial Profile (Concentric Bragg Rings)
    detected_rings = []
    if HAS_SCIPY:
        prominence_factor = float(params.get("prominence", 0.05))
        min_peak_distance = int(params.get("min_ring_distance", 6))
        
        # Smooth intensities slightly for robust peak finding
        intensities_arr = np.array(intensities)
        if len(intensities_arr) > 5:
            smoothed = np.convolve(intensities_arr, np.ones(3)/3, mode='same')
        else:
            smoothed = intensities_arr
            
        peak_idx, _ = find_peaks(smoothed, prominence=np.max(smoothed) * prominence_factor, distance=min_peak_distance)
        for idx in peak_idx:
            radius_val = radial_profile[idx]["radius"]
            intensity_val = radial_profile[idx]["intensity"]
            detected_rings.append({
                "radius": float(radius_val),
                "intensity": float(intensity_val)
            })
            
    # 5. 2D Diffraction Spot Peak Counting (Single Crystal Reflections)
    neighborhood_size = int(params.get("spot_neighborhood", 15))
    peak_threshold_p = float(params.get("spot_threshold_p", 93.0))
    spot_threshold = np.percentile(img_np, peak_threshold_p)
    
    if HAS_SCIPY:
        local_max = (img_np == maximum_filter(img_np, neighborhood_size)) & (img_np > spot_threshold)
        labeled, num_spots = label(local_max)
        
        # Extract individual spot coordinates
        spot_y, spot_x = np.where(local_max)
        detected_spots = [{"x": int(x), "y": int(y), "intensity": int(img_np[y, x])} for x, y in zip(spot_x, spot_y)]
    else:
        num_spots = 0
        detected_spots = []
        
    # 6. Quality Metrics calculation
    bg_level = float(np.percentile(img_np, 15))
    max_level = float(np.max(img_np))
    snr = (max_level - bg_level) / max(1.0, np.std(img_np[img_np <= bg_level]))
    contrast_ratio = max_level / max(1.0, bg_level)
    
    # Calculate angular anisotropy index (checking if spots are isotropic or texture-oriented)
    angles = np.arctan2(y_grid - cy, x_grid - cx)
    # Divide into 8 sectors and calculate variance of sector intensities
    sector_sums = []
    for sector in range(8):
        sector_mask = (angles >= -math.pi + sector * math.pi/4) & (angles < -math.pi + (sector+1) * math.pi/4) & (r_grid > 20) & (r_grid < max_radius)
        if np.any(sector_mask):
            sector_sums.append(np.mean(img_np[sector_mask]))
    anisotropy_index = float(np.std(sector_sums) / max(0.1, np.mean(sector_sums))) if len(sector_sums) > 0 else 0.0

    # 7. Generate Processed Filter Images
    processed_images = {}
    
    # 7.1 Canny / Sobel Edges
    if HAS_OPENCV:
        canny_edges = cv2.Canny(img_np, int(params.get("canny_low", 40)), int(params.get("canny_high", 120)))
        processed_images["canny_edges"] = to_base64_png(canny_edges)
    elif HAS_SCIPY:
        dx = sobel(img_np, 0)
        dy = sobel(img_np, 1)
        edges_np = np.hypot(dx, dy)
        edges_np = np.clip(edges_np / max(1.0, np.max(edges_np)) * 255, 0, 255).astype(np.uint8)
        processed_images["canny_edges"] = to_base64_png(edges_np)
    else:
        processed_images["canny_edges"] = base64_image_str # dummy fallback

    # 7.2 Spot Detection Contours Overlay
    spot_overlay = np.stack([img_np, img_np, img_np], axis=-1).astype(np.uint8)
    if HAS_OPENCV:
        # Draw green crosses on spots
        for spot in detected_spots[:200]: # limit to first 200 loudest spots
            sx, sy = spot["x"], spot["y"]
            cv2.drawMarker(spot_overlay, (sx, sy), (0, 255, 100), cv2.MARKER_CROSS, 8, 1)
        processed_images["spot_contours"] = to_base64_png(spot_overlay)
    else:
        # NumPy/PIL direct overlay: paint red pixels around spotted centers
        for spot in detected_spots[:200]:
            sx, sy = spot["x"], spot["y"]
            for dy_idx in range(-3, 4):
                if 0 <= sy + dy_idx < h:
                    spot_overlay[sy + dy_idx, sx] = [0, 255, 120]
            for dx_idx in range(-3, 4):
                if 0 <= sx + dx_idx < w:
                    spot_overlay[sy, sx + dx_idx] = [0, 255, 120]
        processed_images["spot_contours"] = to_base64_png(spot_overlay)

    # 7.3 Circular Bragg fits overlay
    ring_overlay = np.stack([img_np, img_np, img_np], axis=-1).astype(np.uint8)
    if HAS_OPENCV:
        # Center marker
        cv2.circle(ring_overlay, (int(cx), int(cy)), 4, (0, 165, 255), -1)
        # Ring outlines
        for r_info in detected_rings:
            radius_int = int(r_info["radius"])
            cv2.circle(ring_overlay, (int(cx), int(cy)), radius_int, (255, 90, 50), 2)
    else:
        # Pure python pixel sweep
        for r_info in detected_rings:
            target_r = r_info["radius"]
            # draw simple ring borders on overlay
            for angle in np.linspace(0, 2 * math.pi, 200):
                rx = int(cx + target_r * math.cos(angle))
                ry = int(cy + target_r * math.sin(angle))
                if 0 <= rx < w and 0 <= ry < h:
                    ring_overlay[ry, rx] = [255, 120, 50]
        # Draw center
        cx_i, cy_i = int(cx), int(cy)
        for dy_idx in range(-2, 3):
            for dx_idx in range(-2, 3):
                if 0 <= cx_i + dx_idx < w and 0 <= cy_i + dy_idx < h:
                    ring_overlay[cy_i + dy_idx, cx_i + dx_idx] = [0, 165, 255]
    processed_images["ring_fits"] = to_base64_png(ring_overlay)

    # 7.4 Heatmap (copper or jet styled)
    processed_images["radial_heatmap"] = to_base64_png(img_np, colormap="jet")
    
    # 8. Markdown report builder
    report_md = f"""### 🔬 Python + OpenCV Core Image Diagnostic Report

#### 📈 Primary Computer Vision Summary
- **Calculated Beam Stop Centroid (reciprocal origin)**: `x = {cx:.2f}px`, `y = {cy:.2f}px`
- **Total Bragg Concentric Rings Resolved**: `{len(detected_rings)}` rings
- **Bragg Spot Reflections Detected**: `{num_spots}` distinct single-crystal spots
- **Anisotropy Index**: `{anisotropy_index:.4f}` (higher indicates oriented single crystals or preferred texture)

#### 🎚️ Detector Diagnostic Parameters
- **Sensor Estimated Background Noise level**: `{bg_level:.1f} ADC counts`
- **Estimated Signal-to-Noise Ratio (SNR)**: `{snr:.2f} dB`
- **Global Image Intensity Contrast Ratio**: `{contrast_ratio:.2f}`
- **System Dimensions Resolved**: `{w} x {h} pixels`
- **Interactive Radial Graph**: 1D radial projection loaded successfully into UI plotter.

---

#### 📋 Extracted Concentric Bragg Rings Peak List
| Peak Index | Pixel Radius (px) | Reflected Intensity (a.u.) | Relative Intensity (%) |
| :--- | :---: | :---: | :---: |
"""
    if len(detected_rings) == 0:
        report_md += "| No peaks detected | N/A | N/A | N/A |\n"
    else:
        max_ring_int = max([r["intensity"] for r in detected_rings]) if detected_rings else 1.0
        for idx, ring in enumerate(detected_rings):
            rel_int = (ring["intensity"] / max_ring_int) * 100.0
            report_md += f"| Peak #{idx + 1} | `{ring['radius']:.1f}` | `{ring['intensity']:.1f}` | `{rel_int:.1f}%` |\n"

    report_md += f"""
---

#### 💡 Scientific Engineering Crystallography Assessment
1. **Texture and Orientation**: An anisotropy check score of `{anisotropy_index:.4f}` dictates that the sample represents {"a highly oriented or textured thin film / single crystal mosaic" if anisotropy_index > 0.12 else "a randomized powder material with concentric Debye-Scherrer rings"}.
2. **Exposure Evaluation**: An SNR of `{snr:.2f} dB` suggests {"excellent exposure balance, well suited for deep Rietveld refinement" if snr > 20 else "moderately noisy exposure. Suggest longer integration times or contrast boosting on the hardware detector"}.
3. **Primary Calibration Radius**: The first detected ring resides at a pixel radius of `{detected_rings[0]["radius"]:.1f}px` if rings are present. Use this coordinate vector to calibrate raw wavelength parameters.
"""

    execution_duration = time.time() - start_time
    
    return {
        "success": True,
        "execution_duration": f"{execution_duration * 1000.0:.1f}ms",
        "cx": cx,
        "cy": cy,
        "radial_profile": radial_profile,
        "detected_rings": detected_rings,
        "detected_spots_count": num_spots,
        "background_noise": bg_level,
        "snr": snr,
        "contrast_ratio": contrast_ratio,
        "anisotropy_index": anisotropy_index,
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
        # Load nested JSON parameters from arg or stdin
        if args.json:
            payload = json.loads(args.json)
        else:
            # Read from standard input
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
            "error": f"Internal execution fault in python helper: {str(outer_err)}"
        }
        print(json.dumps(outer_error))
