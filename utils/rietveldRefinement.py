import sys
import json
import numpy as np
import math

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    from scipy.optimize import minimize
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

# Fallback definition for peak simulation if SciPy is not available or crashes
# Uses pseudo-Voigt profile: eta * Lorentzian + (1 - eta) * Gaussian
def pseudo_voigt(x, xo, fwhm, eta):
    # Gaussian component
    sigma = fwhm / (2.0 * math.sqrt(2.0 * math.log(2.0)))
    if sigma > 0:
        g = (1.0 / (sigma * math.sqrt(2.0 * math.pi))) * np.exp(-0.5 * ((x - xo) / sigma) ** 2)
    else:
        g = np.zeros_like(x)
        
    # Lorentzian component
    gamma = fwhm / 2.0
    if gamma > 0:
        l = (1.0 / math.pi) * (gamma / ((x - xo) ** 2 + gamma ** 2))
    else:
        l = np.zeros_like(x)
        
    return eta * l + (1.0 - eta) * g

# Chebyshev polynomial evaluator
def chebyshev_poly(x, coefficients):
    # Map x to range [-1, 1] for Chebyshev stability
    x_min, x_max = np.min(x), np.max(x)
    if x_max - x_min > 0:
        x_scaled = 2.0 * (x - x_min) / (x_max - x_min) - 1.0
    else:
        x_scaled = np.zeros_like(x)
        
    result = np.zeros_like(x)
    for i, coeff in enumerate(coefficients):
        if i == 0:
            result += coeff * np.ones_like(x)
        elif i == 1:
            result += coeff * x_scaled
        else:
            # Recurrence relation: T_n(x) = 2x * T_{n-1}(x) - T_{n-2}(x)
            t_prev2 = np.ones_like(x)
            t_prev1 = x_scaled.copy()
            for _ in range(2, i + 1):
                t_curr = 2.0 * x_scaled * t_prev1 - t_prev2
                t_prev2 = t_prev1
                t_prev1 = t_curr
            result += coeff * t_prev1
    return result

def run_rietveld_refinement(payload: dict) -> dict:
    # 1. Parse payload variables with robust fallbacks
    phases_input = payload.get("phases", [])
    bg_model = payload.get("background_model", "Chebyshev")
    bg_terms = int(payload.get("bg_terms", 6))
    wavelength = float(payload.get("wavelength", 1.5406))
    two_theta_min = float(payload.get("two_theta_min", 10.0))
    two_theta_max = float(payload.get("two_theta_max", 90.0))
    step_size = float(payload.get("step_size", 0.05))
    zero_shift_target = float(payload.get("zero_shift", 0.0))
    sample_displacement_target = float(payload.get("sample_displacement", 0.0))
    
    # Flags to control refinement steps
    refine_scale = bool(payload.get("refine_scale", True))
    refine_lattice = bool(payload.get("refine_lattice", True))
    refine_fwhm = bool(payload.get("refine_fwhm", True))
    refine_eta = bool(payload.get("refine_eta", False))
    refine_zero_shift = bool(payload.get("refine_zero_shift", False))

    # 2. Build 2-Theta Grid
    grid_points = int((two_theta_max - two_theta_min) / step_size) + 1
    two_theta_grid = np.linspace(two_theta_min, two_theta_max, grid_points)

    # 3. Create Pandas DataFrame for structural alignment & vector tracking (Goal: clean Pandas workflows)
    if HAS_PANDAS:
        df = pd.DataFrame({"two_theta": two_theta_grid})
        df["y_obs"] = 0.0
    else:
        # Fallback to standard dict / arrays
        df = None
        y_obs_arr = np.zeros_like(two_theta_grid)

    # Convert custom preset target peak indicators into structured list of d-spacing Bragg peaks
    parsed_phases = []
    for p_idx, p in enumerate(phases_input):
        phase_type = p.get("phaseType", "Simple Cubic")
        name = p.get("name", f"Phase {p_idx+1}")
        
        # Current starting values vs. ideal target values (that simulated experimental dataset has under the hood)
        a_curr = float(p.get("a", 4.0))
        scale_curr = float(p.get("scale", 500.0))
        fwhm_curr = float(p.get("fwhm", 0.2))
        eta_curr = float(p.get("eta", 0.5))
        
        a_target = float(p.get("targetA", a_curr))
        scale_target = float(p.get("targetScale", scale_curr))
        fwhm_target = float(p.get("targetFwhm", fwhm_curr))
        eta_target = float(p.get("targetEta", eta_curr))

        # Peak index identifiers
        peaks_list = p.get("peaks", [])
        bragg_peaks = []
        for pk in peaks_list:
            if pk.get("enabled", True):
                intensity = float(pk.get("intensity", 1000.0))
                h, k, l = int(pk.get("h", 0)), int(pk.get("k", 0)), int(pk.get("l", 0))
                # Compute relative Bragg d-spacing on standard lattice
                sum_sq = h*h + k*k + l*l
                if sum_sq > 0:
                    d_spacing = a_target / math.sqrt(sum_sq)
                else:
                    d_spacing = 1.0 # default dummy
                    
                bragg_peaks.append({
                    "h": h, "k": k, "l": l,
                    "intensity": intensity,
                    "target_d": d_spacing,
                    "sum_sq": sum_sq
                })
        
        parsed_phases.append({
            "name": name,
            "phaseType": phase_type,
            "a": a_curr,
            "target_a": a_target,
            "scale": scale_curr,
            "target_scale": scale_target,
            "fwhm": fwhm_curr,
            "target_fwhm": fwhm_target,
            "eta": eta_curr,
            "target_eta": eta_target,
            "bragg_peaks": bragg_peaks
        })

    # 4. Generate high-fidelity Simulated Observed (Experimental) Profile with known target values
    # Let's add background model and counts noise
    background_target_coeffs = np.array([45.0, -12.0, 5.0, -2.0, 1.0, -0.5])[:bg_terms]
    y_obs_bg = chebyshev_poly(two_theta_grid, background_target_coeffs)
    
    y_obs_peaks = np.zeros_like(two_theta_grid)
    for ph in parsed_phases:
        for pk in ph["bragg_peaks"]:
            # Recalculate 2-Theta position from lambda and lattice target
            # d_spacing = target_a / sqrt(sum_sq)
            if pk["sum_sq"] > 0:
                d = ph["target_a"] / math.sqrt(pk["sum_sq"])
            else:
                d = pk["target_d"]
            
            # Apply zero shift displacement to target
            sin_theta = wavelength / (2.0 * d)
            if sin_theta <= 1.0:
                theta_rad = math.asin(sin_theta)
                pos = 2.0 * theta_rad * (180.0 / math.pi)
                # Shift by zero shift
                pos += zero_shift_target
                y_obs_peaks += ph["target_scale"] * 0.1 * pseudo_voigt(
                    two_theta_grid, pos, ph["target_fwhm"], ph["target_eta"]
                )

    # Merge signal and background
    y_observed_clean = y_obs_bg + y_obs_peaks
    np.random.seed(24) # stable random counting noise
    y_observed_noisy = y_observed_clean + np.random.normal(0, np.sqrt(np.clip(y_observed_clean, 1, None)) * 0.3)
    y_observed_noisy = np.clip(y_observed_noisy, 1.0, None) # positive bounds

    if HAS_PANDAS:
        df["y_obs"] = y_observed_noisy
    else:
        y_obs_arr = y_observed_noisy

    # Initialize current starting parameter states for optimization
    # Background coefficients estimate (initialized near average level of lowest segments)
    bkg_coeffs_est = np.zeros(bg_terms)
    bkg_coeffs_est[0] = np.percentile(y_observed_noisy, 15)

    # 5. Build parameterized objective function for SciPy Solver
    # Parameter packing vector x_params:
    # Scale items -> Lattice items -> Fwhm items -> Eta items -> Zero Shift -> Bkg Coeffs
    param_meta = []
    initial_guess = []
    bounds = []

    # Pack phase variables dynamically
    for ph_idx, ph in enumerate(parsed_phases):
        if refine_scale:
            param_meta.append({"type": "scale", "phase_idx": ph_idx})
            initial_guess.append(ph["scale"])
            bounds.append((10.0, 10000.0))
        if refine_lattice:
            param_meta.append({"type": "a", "phase_idx": ph_idx})
            initial_guess.append(ph["a"])
            bounds.append((2.0, 12.0))
        if refine_fwhm:
            param_meta.append({"type": "fwhm", "phase_idx": ph_idx})
            initial_guess.append(ph["fwhm"])
            bounds.append((0.05, 1.5))
        if refine_eta:
            param_meta.append({"type": "eta", "phase_idx": ph_idx})
            initial_guess.append(ph["eta"])
            bounds.append((0.0, 1.0))

    if refine_zero_shift:
        param_meta.append({"type": "zero_shift", "phase_idx": -1})
        initial_guess.append(0.0) # initial zero shift guess
        bounds.append((-0.5, 0.5))

    # Background terms are always refined in this sequential system
    for bg_i in range(bg_terms):
        param_meta.append({"type": "bkg_coeff", "index": bg_i})
        initial_guess.append(bkg_coeffs_est[bg_i])
        bounds.append((-1000.0, 10000.0))

    initial_guess = np.array(initial_guess)

    # Local calculator function mapping optimization params on vector layouts
    def calculate_pattern(params_vec):
        current_zero_shift = 0.0
        current_bkg = np.zeros_like(two_theta_grid)
        bkg_clamped_coeffs = []

        # Temp arrays
        p_scales = [ph["scale"] for ph in parsed_phases]
        p_as = [ph["a"] for ph in parsed_phases]
        p_fwhms = [ph["fwhm"] for ph in parsed_phases]
        p_etas = [ph["eta"] for ph in parsed_phases]

        curr_bg_idx = 0
        for md, val in zip(param_meta, params_vec):
            t = md["type"]
            idx = md.get("phase_idx", -1)
            if t == "scale":
                p_scales[idx] = val
            elif t == "a":
                p_as[idx] = val
            elif t == "fwhm":
                p_fwhms[idx] = val
            elif t == "eta":
                p_etas[idx] = val
            elif t == "zero_shift":
                current_zero_shift = val
            elif t == "bkg_coeff":
                bkg_clamped_coeffs.append(val)

        # Draw Chebyshev profile
        if len(bkg_clamped_coeffs) > 0:
            current_bkg = chebyshev_poly(two_theta_grid, bkg_clamped_coeffs)

        # Unify active peak calculations
        current_peaks = np.zeros_like(two_theta_grid)
        for ph_idx, ph in enumerate(parsed_phases):
            scale_val = p_scales[ph_idx]
            a_val = p_as[ph_idx]
            fwhm_val = p_fwhms[ph_idx]
            eta_val = p_etas[ph_idx]

            for pk in ph["bragg_peaks"]:
                if pk["sum_sq"] > 0:
                    d = a_val / math.sqrt(pk["sum_sq"])
                else:
                    d = pk["target_d"]

                sin_theta = wavelength / (2.0 * d)
                if sin_theta <= 1.0:
                    theta_rad = math.asin(sin_theta)
                    pos = 2.0 * theta_rad * (180.0 / math.pi)
                    pos += current_zero_shift  # Apply zero-shift calibration
                    current_peaks += scale_val * 0.1 * pseudo_voigt(
                        two_theta_grid, pos, fwhm_val, eta_val
                    )

        y_calc = current_bkg + current_peaks
        return np.clip(y_calc, 0.01, None)

    # Cost objective: minimize Rwp (Weighted Profile Residual)
    def objective_rwp(params_vec):
        y_calc = calculate_pattern(params_vec)
        # Weighting factor w_i = 1 / y_obs
        weights = 1.0 / np.clip(y_observed_noisy, 0.1, None)
        num = np.sum(weights * ((y_observed_noisy - y_calc) ** 2))
        den = np.sum(weights * (y_observed_noisy ** 2))
        if den > 0:
            return math.sqrt(num / den) * 100.0
        return 999.0

    # 6. Execute Nonlinear Multi-Cycle Optimization
    opt_success = False
    opt_msg = "SciPy stack unavailable"
    final_params = initial_guess

    if HAS_SCIPY:
        try:
            # We run Powell optimizer as it handles correlated crystallographic matrices safely
            res_opt = minimize(
                objective_rwp, 
                initial_guess, 
                method="Powell", 
                bounds=bounds, 
                options={"maxiter": 1500, "xtol": 1e-4, "ftol": 1e-4}
            )
            final_params = res_opt.x
            opt_success = res_opt.success
            opt_msg = res_opt.message
        except Exception as err:
            opt_msg = f"Optimization crashed: {err}"
            opt_success = False
    else:
        # Fallback coordinate descent solver to guarantee 100% stable execution if SciPy is missing
        opt_msg = "NumPy Fallback Coordinate Descent Solver"
        for _ in range(3): # epochs
            for i in range(len(initial_guess)):
                p_curr = initial_guess[i]
                b_min, b_max = bounds[i]
                best_val = p_curr
                best_cost = objective_rwp(initial_guess)
                
                # Sample local coordinate updates
                step = (b_max - b_min) * 0.05
                for step_mult in [-2.0, -1.0, 1.0, 2.0]:
                    try_val = np.clip(p_curr + step * step_mult, b_min, b_max)
                    initial_guess[i] = try_val
                    cost_try = objective_rwp(initial_guess)
                    if cost_try < best_cost:
                        best_cost = cost_try
                        best_val = try_val
                        
                initial_guess[i] = best_val
        final_params = initial_guess
        opt_success = True

    # 7. Post-refinement Analysis & Statistics (Calculated vs Observed residuals)
    y_final_calc = calculate_pattern(final_params)
    
    # Calculate R-factors using standard formulations
    weights = 1.0 / np.clip(y_observed_noisy, 0.1, None)
    weights_norm = weights / np.sum(weights)

    r_wp_final = objective_rwp(final_params)
    
    # R-expected calculation
    n_datapoints = len(two_theta_grid)
    n_parameters = len(final_params)
    degrees_of_freedom = max(1, n_datapoints - n_parameters)
    
    # R_exp = sqrt( (N - P) / SUM(w_i * Y_obs_i^2) ) * 100%
    sum_w_y2 = np.sum(weights * (y_observed_noisy ** 2))
    if sum_w_y2 > 0:
        r_exp_final = math.sqrt(degrees_of_freedom / sum_w_y2) * 100.0
    else:
        r_exp_final = 2.5
        
    gof_final = (r_wp_final / r_exp_final) if r_exp_final > 0 else 1.1
    chi_squared_final = gof_final ** 2

    # Map optimized params back to phases output list
    output_phases = []
    
    parsed_scales = [ph["scale"] for ph in parsed_phases]
    parsed_as = [ph["a"] for ph in parsed_phases]
    parsed_fwhms = [ph["fwhm"] for ph in parsed_phases]
    parsed_etas = [ph["eta"] for ph in parsed_phases]
    zero_shift_opt = 0.0
    bkg_opt_coeffs = []

    for md, val in zip(param_meta, final_params):
        t = md["type"]
        idx = md.get("phase_idx", -1)
        if t == "scale":
            parsed_scales[idx] = val
        elif t == "a":
            parsed_as[idx] = val
        elif t == "fwhm":
            parsed_fwhms[idx] = val
        elif t == "eta":
            parsed_etas[idx] = val
        elif t == "zero_shift":
            zero_shift_opt = val
        elif t == "bkg_coeff":
            bkg_opt_coeffs.append(val)

    # 8. Render a clean Pandas-driven comparison report
    if HAS_PANDAS and df is not None:
        df["y_calc"] = y_final_calc
        df["y_bkg"] = chebyshev_poly(two_theta_grid, bkg_opt_coeffs) if len(bkg_opt_coeffs) > 0 else 0.0
        df["y_diff"] = df["y_obs"] - df["y_calc"]
        
        # Pull tabular statistics showing Pandas aggregate capabilities
        summary_statistics = {
            "mean_residual": float(df["y_diff"].mean()),
            "std_residual": float(df["y_diff"].std()),
            "max_error": float(df["y_diff"].abs().max()),
            "correlation_coefficient": float(df["y_obs"].corr(df["y_calc"]))
        }
        
        # Sub-sample chart array for faster JSON network delivery (e.g. 200 grid samples)
        chart_stride = max(1, len(df) // 250)
        df_subsampled = df.iloc[::chart_stride]
        comparison_points = []
        for _, row in df_subsampled.iterrows():
            comparison_points.append({
                "twoTheta": round(float(row["two_theta"]), 3),
                "obs": round(float(row["y_obs"]), 2),
                "calc": round(float(row["y_calc"]), 2),
                "bkg": round(float(row["y_bkg"]), 2),
                "diff": round(float(row["y_diff"]), 2)
            })
    else:
        y_diff_arr = y_observed_noisy - y_final_calc
        summary_statistics = {
            "mean_residual": float(np.mean(y_diff_arr)),
            "std_residual": float(np.std(y_diff_arr)),
            "max_error": float(np.max(np.abs(y_diff_arr))),
            "correlation_coefficient": float(np.corrcoef(y_observed_noisy, y_final_calc)[0, 1])
        }
        
        # Subsample for delivery
        stride = max(1, len(two_theta_grid) // 250)
        comparison_points = []
        for idx in range(0, len(two_theta_grid), stride):
            comparison_points.append({
                "twoTheta": round(float(two_theta_grid[idx]), 3),
                "obs": round(float(y_observed_noisy[idx]), 2),
                "calc": round(float(y_final_calc[idx]), 2),
                "bkg": round(float(chebyshev_poly(two_theta_grid[idx:idx+1], bkg_opt_coeffs)[0]), 2) if len(bkg_opt_coeffs) > 0 else 0.0,
                "diff": round(float(y_diff_arr[idx]), 2)
            })

    # Prepare report phases
    for idx, ph in enumerate(parsed_phases):
        vol_calc = parsed_as[idx] ** 3
        output_phases.append({
            "name": ph["name"],
            "phaseType": ph["phaseType"],
            "initial_a": round(ph["a"], 4),
            "refined_a": round(parsed_as[idx], 5),
            "initial_scale": round(ph["scale"], 1),
            "refined_scale": round(parsed_scales[idx], 2),
            "initial_fwhm": round(ph["fwhm"], 3),
            "refined_fwhm": round(parsed_fwhms[idx], 4),
            "initial_eta": round(ph["eta"], 2),
            "refined_eta": round(parsed_etas[idx], 3),
            "volume": round(vol_calc, 3)
        })

    return {
        "success": True,
        "optimizer_status": opt_msg,
        "r_factors": {
            "r_wp_initial": round(objective_rwp(initial_guess), 3),
            "r_wp_final": round(r_wp_final, 3),
            "r_exp": round(r_exp_final, 3),
            "gof": round(gof_final, 3),
            "chi_squared": round(chi_squared_final, 3)
        },
        "statistics": summary_statistics,
        "refinement_steps_count": n_parameters,
        "zero_shift": round(zero_shift_opt, 5),
        "phases": output_phases,
        "points": comparison_points,
        "pandas_dataframe_enabled": HAS_PANDAS
    }

if __name__ == "__main__":
    # Standard shell reader interface
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", type=str, required=True, help="Input parameters in nested JSON encoding")
    args = parser.parse_args()

    try:
        data_payload = json.loads(args.json)
        # Handle stringified nested JSON if passed
        if isinstance(data_payload, str):
            data_payload = json.loads(data_payload)
            
        result_dict = run_rietveld_refinement(data_payload)
        print(json.dumps(result_dict))
    except Exception as run_err:
        outer_error = {
            "success": False,
            "error": f"Refinement Pipeline failed: {str(run_err)}"
        }
        print(json.dumps(outer_error))
        sys.exit(0)
