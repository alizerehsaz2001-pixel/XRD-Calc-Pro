import sys
import json
import io
import base64
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def pseudo_voigt(x, x0, fwhm, eta, height):
    """
    Pseudo-Voigt peak profile: linear combination of Gaussian and Lorentzian.
    eta = 0: Pure Gaussian
    eta = 1: Pure Lorentzian
    """
    sigma = fwhm / (2 * np.sqrt(2 * np.log(2)))
    gamma = fwhm / 2.0
    
    # Gaussian component
    G = np.exp(-0.5 * ((x - x0) / sigma) ** 2)
    # Lorentzian component
    L = 1.0 / (1.0 + ((x - x0) / gamma) ** 2)
    
    return height * ((1 - eta) * G + eta * L)

def pearson_vii(x, x0, fwhm, m, height):
    """
    Pearson VII peak profile function.
    m = 1: Lorentzian
    m -> infinity: Gaussian
    """
    if m <= 0.5:
        m = 0.51
    c = 2 * np.sqrt(2 ** (1.0 / m) - 1.0) / fwhm
    return height * (1.0 + (c * (x - x0)) ** 2) ** (-m)

def asymmetric_pseudo_voigt(x, x0, fwhm, eta, height, asym):
    """
    Asymmetric / Split Pseudo-Voigt profile with left/right half-width modulation.
    """
    fwhm_l = 2 * fwhm / (1.0 + asym)
    fwhm_r = 2 * fwhm * asym / (1.0 + asym)
    
    y = np.zeros_like(x)
    left_mask = x < x0
    right_mask = ~left_mask
    
    y[left_mask] = pseudo_voigt(x[left_mask], x0, fwhm_l, eta, height)
    y[right_mask] = pseudo_voigt(x[right_mask], x0, fwhm_r, eta, height)
    return y

def generate_origin_fwhm_plot(params: dict) -> dict:
    """
    Generates a publication-grade OriginPro XRD Peak Fitting & FWHM Deconvolution plot.
    """
    # 1. Parse Primary Parameters
    center = float(params.get('center', 28.442))
    fwhm = float(params.get('fwhm', 0.285))
    profile_type = params.get('profileType', 'pseudo_voigt') # 'pseudo_voigt', 'gaussian', 'lorentzian', 'pearson7', 'asymmetric'
    eta = float(params.get('eta', 0.50))
    pearson_m = float(params.get('pearsonM', 2.0))
    asymmetry = float(params.get('asymmetry', 1.15))
    height = float(params.get('height', 1000.0))
    
    # Background params
    bg_const = float(params.get('bgConst', 60.0))
    bg_slope = float(params.get('bgSlope', 0.5))
    bg_quad = float(params.get('bgQuad', 0.0))
    
    # Instrumental broadening
    inst_fwhm = float(params.get('instFwhm', 0.085))
    wavelength = float(params.get('wavelength', 0.15406)) # nm (Cu Ka)
    
    # Noise and domain span
    noise_pct = float(params.get('noisePct', 2.5))
    x_span = float(params.get('xSpan', 3.5)) # total 2-theta span in degrees
    n_points = int(params.get('numPoints', 300))
    
    # Deconvolution sub-peaks
    peaks_data = params.get('deconvolutionPeaks', [])
    theme = params.get('theme', 'origin_classic') # 'origin_classic', 'nature', 'acs_nano', 'dark_lab'
    show_residual = bool(params.get('showResidual', True))
    show_fwhm_bracket = bool(params.get('showFwhmBracket', True))
    show_table = bool(params.get('showTable', True))
    show_deconv_peaks = bool(params.get('showDeconvPeaks', True))
    
    # 2. Construct X-axis 2-theta grid
    x_min = center - x_span / 2.0
    x_max = center + x_span / 2.0
    x = np.linspace(x_min, x_max, n_points)
    
    # Compute Background
    bg = bg_const + bg_slope * (x - center) + bg_quad * (x - center) ** 2
    
    # 3. Calculate Primary / Multi-Peak Model
    sub_curves = []
    y_total_calc = np.copy(bg)
    
    if not peaks_data:
        # Default single peak
        if profile_type == 'gaussian':
            y_peak = pseudo_voigt(x, center, fwhm, 0.0, height)
        elif profile_type == 'lorentzian':
            y_peak = pseudo_voigt(x, center, fwhm, 1.0, height)
        elif profile_type == 'pearson7':
            y_peak = pearson_vii(x, center, fwhm, pearson_m, height)
        elif profile_type == 'asymmetric':
            y_peak = asymmetric_pseudo_voigt(x, center, fwhm, eta, height, asymmetry)
        else:
            # Pseudo-Voigt
            y_peak = pseudo_voigt(x, center, fwhm, eta, height)
            
        y_total_calc += y_peak
        sub_curves.append({
            'label': f'Peak 1 ({profile_type.replace("_", " ").title()})',
            'center': center,
            'fwhm': fwhm,
            'height': height,
            'y': y_peak + bg,
            'y_pure': y_peak,
            'color': '#2563EB'
        })
    else:
        # Multi-peak deconvolution mode
        colors = ['#2563EB', '#16A34A', '#9333EA', '#D97706', '#0891B2', '#E11D48']
        for i, pk in enumerate(peaks_data):
            p_center = float(pk.get('center', center))
            p_fwhm = float(pk.get('fwhm', fwhm))
            p_height = float(pk.get('height', height))
            p_eta = float(pk.get('eta', eta))
            p_type = pk.get('profileType', profile_type)
            p_label = pk.get('label', f'Phase #{i+1}')
            
            if p_type == 'gaussian':
                y_p = pseudo_voigt(x, p_center, p_fwhm, 0.0, p_height)
            elif p_type == 'lorentzian':
                y_p = pseudo_voigt(x, p_center, p_fwhm, 1.0, p_height)
            elif p_type == 'pearson7':
                y_p = pearson_vii(x, p_center, p_fwhm, pearson_m, p_height)
            elif p_type == 'asymmetric':
                y_p = asymmetric_pseudo_voigt(x, p_center, p_fwhm, p_eta, p_height, asymmetry)
            else:
                y_p = pseudo_voigt(x, p_center, p_fwhm, p_eta, p_height)
                
            y_total_calc += y_p
            sub_curves.append({
                'label': p_label,
                'center': p_center,
                'fwhm': p_fwhm,
                'height': p_height,
                'y': y_p + bg,
                'y_pure': y_p,
                'color': colors[i % len(colors)]
            })
            
    # 4. Generate Synthetic / Experimental Observed Data with Gaussian Noise
    np.random.seed(42)
    noise_sigma = (height * (noise_pct / 100.0))
    noise = np.random.normal(0, noise_sigma, len(x))
    y_observed = y_total_calc + noise
    
    # Calculate Residual
    residual = y_observed - y_total_calc
    
    # Statistical Metrology (R^2, Chi-sq, Reduced Chi-sq)
    ss_res = np.sum(residual ** 2)
    ss_tot = np.sum((y_observed - np.mean(y_observed)) ** 2)
    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.999
    dof = max(1, len(x) - (len(sub_curves) * 3 + 2))
    reduced_chi_sq = (ss_res / (noise_sigma ** 2)) / dof if noise_sigma > 0 else 1.0
    
    # Physical Deconvolved FWHM (Voigt / Halder-Wagner deconvolution)
    # beta_phys = sqrt(beta_obs^2 - beta_inst^2) for Gaussian, or beta_obs - beta_inst for Lorentzian
    if fwhm > inst_fwhm:
        beta_phys_gauss = np.sqrt(fwhm ** 2 - inst_fwhm ** 2)
        beta_phys_lorentz = fwhm - inst_fwhm
        # Pseudo-Voigt composite deconvolution
        beta_phys = (1.0 - eta) * beta_phys_gauss + eta * beta_phys_lorentz
    else:
        beta_phys = fwhm * 0.1 # Near instrumental limit
        
    # Scherrer Crystallite Size D = (K * lambda) / (beta_phys_rad * cos(theta))
    theta_rad = np.radians(center / 2.0)
    beta_rad = np.radians(beta_phys)
    crystallite_size_nm = (0.94 * wavelength) / (beta_rad * np.cos(theta_rad)) if beta_rad > 0 else 0.0

    # 5. Theme Configuration for Matplotlib
    theme_cfg = {
        'origin_classic': {
            'bg_fig': '#FFFFFF',
            'bg_ax': '#FFFFFF',
            'text_color': '#000000',
            'spine_color': '#000000',
            'spine_width': 1.4,
            'obs_marker': 'o',
            'obs_color': '#1E293B',
            'obs_face': 'none',
            'fit_color': '#DC2626',
            'bg_color': '#64748B',
            'res_color': '#0284C7',
            'grid': True,
            'grid_color': '#E2E8F0',
            'grid_ls': ':',
            'font_family': 'sans-serif'
        },
        'nature': {
            'bg_fig': '#FFFFFF',
            'bg_ax': '#FFFFFF',
            'text_color': '#111827',
            'spine_color': '#374151',
            'spine_width': 1.1,
            'obs_marker': 's',
            'obs_color': '#1F2937',
            'obs_face': '#F3F4F6',
            'fit_color': '#B91C1C',
            'bg_color': '#9CA3AF',
            'res_color': '#4B5563',
            'grid': False,
            'grid_color': '#F3F4F6',
            'grid_ls': '-',
            'font_family': 'sans-serif'
        },
        'acs_nano': {
            'bg_fig': '#FAFAFA',
            'bg_ax': '#FAFAFA',
            'text_color': '#0F172A',
            'spine_color': '#0F172A',
            'spine_width': 1.5,
            'obs_marker': 'o',
            'obs_color': '#0F172A',
            'obs_face': '#E2E8F0',
            'fit_color': '#EA580C',
            'bg_color': '#64748B',
            'res_color': '#0284C7',
            'grid': True,
            'grid_color': '#E2E8F0',
            'grid_ls': '--',
            'font_family': 'sans-serif'
        },
        'dark_lab': {
            'bg_fig': '#0F172A',
            'bg_ax': '#0B1120',
            'text_color': '#F8FAFC',
            'spine_color': '#475569',
            'spine_width': 1.3,
            'obs_marker': 'o',
            'obs_color': '#94A3B8',
            'obs_face': 'none',
            'fit_color': '#38BDF8',
            'bg_color': '#64748B',
            'res_color': '#A855F7',
            'grid': True,
            'grid_color': '#1E293B',
            'grid_ls': ':',
            'font_family': 'sans-serif'
        }
    }
    
    cfg = theme_cfg.get(theme, theme_cfg['origin_classic'])

    # 6. Initialize Matplotlib Figure Layout
    plt.rcParams['font.family'] = cfg['font_family']
    plt.rcParams['mathtext.fontset'] = 'cm'
    
    if show_residual:
        fig, (ax1, ax2) = plt.subplots(
            2, 1, 
            figsize=(9.0, 7.0), 
            dpi=200, 
            gridspec_kw={'height_ratios': [3.5, 1.0], 'hspace': 0.04}, 
            sharex=True
        )
    else:
        fig, ax1 = plt.subplots(figsize=(9.0, 5.5), dpi=200)
        ax2 = None

    fig.patch.set_facecolor(cfg['bg_fig'])
    ax1.set_facecolor(cfg['bg_ax'])
    if ax2:
        ax2.set_facecolor(cfg['bg_ax'])

    # 7. Style Axis Frames in OriginPro Inward Ticks Convention
    for ax in ([ax1, ax2] if ax2 else [ax1]):
        ax.tick_params(
            direction='in', 
            which='both', 
            top=True, 
            right=True, 
            colors=cfg['text_color'],
            length=6, 
            width=cfg['spine_width']
        )
        ax.tick_params(which='minor', length=3, width=cfg['spine_width'] * 0.8)
        ax.minorticks_on()
        for spine in ax.spines.values():
            spine.set_edgecolor(cfg['spine_color'])
            spine.set_linewidth(cfg['spine_width'])
        if cfg['grid']:
            ax.grid(True, which='major', color=cfg['grid_color'], linestyle=cfg['grid_ls'], alpha=0.7)

    # 8. Plot Observed Experimental Scatter Data (Origin Point Style)
    step = max(1, len(x) // 120)
    ax1.scatter(
        x[::step], 
        y_observed[::step], 
        s=24, 
        marker=cfg['obs_marker'],
        facecolors=cfg['obs_face'], 
        edgecolors=cfg['obs_color'], 
        linewidths=1.2, 
        label=r'Observed ($I_{\mathrm{obs}}$)',
        zorder=3
    )

    # 9. Plot Deconvoluted Sub-Peaks (if multi-peak or individual components requested)
    if show_deconv_peaks and len(sub_curves) > 1:
        for idx, sub in enumerate(sub_curves):
            ax1.plot(
                x, 
                sub['y'], 
                linestyle='--', 
                linewidth=1.6, 
                color=sub['color'],
                label=f"{sub['label']} (FWHM={sub['fwhm']:.3f}°)",
                zorder=4
            )
            # Subtle fill under peak
            ax1.fill_between(x, bg, sub['y'], color=sub['color'], alpha=0.10, zorder=2)

    # 10. Plot Background Baseline
    ax1.plot(
        x, 
        bg, 
        linestyle=':', 
        linewidth=1.4, 
        color=cfg['bg_color'], 
        label='Fitted Baseline ($y_0$)',
        zorder=2
    )

    # 11. Plot Total OriginPro Fitted Curve
    ax1.plot(
        x, 
        y_total_calc, 
        color=cfg['fit_color'], 
        linewidth=2.2, 
        label=r'OriginPro Fit ($I_{\mathrm{calc}}$)',
        zorder=5
    )

    # 12. OriginPro FWHM Dimension Indicator & Arrows Annotation
    if show_fwhm_bracket and len(sub_curves) == 1:
        # Peak half maximum position
        half_max_y = bg_const + height / 2.0
        x_left = center - fwhm / 2.0
        x_right = center + fwhm / 2.0
        
        # Dimension line with double arrows
        arrow_color = '#DC2626' if theme != 'dark_lab' else '#38BDF8'
        ax1.annotate(
            '', 
            xy=(x_left, half_max_y), 
            xytext=(x_right, half_max_y),
            arrowprops=dict(arrowstyle='<->', color=arrow_color, lw=1.5, mutation_scale=14),
            zorder=6
        )
        
        # Center drop-line
        ax1.vlines(
            x=center, 
            ymin=bg_const, 
            ymax=bg_const + height, 
            colors=arrow_color, 
            linestyles='-.', 
            linewidth=1.2,
            zorder=6,
            label=rf'$2\theta_0 = {center:.3f}^\circ$'
        )

        # FWHM Text label badge
        label_y = half_max_y + height * 0.08
        ax1.text(
            center, 
            label_y, 
            rf'$\mathbf{{FWHM}} = {fwhm:.3f}^\circ$ ({fwhm * 60:.1f} arcmin)' + '\n' +
            rf'$\beta_{{\mathrm{{phys}}}} = {beta_phys:.3f}^\circ$',
            fontsize=9.5, 
            ha='center', 
            va='bottom',
            color=cfg['text_color'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor=cfg['bg_fig'], edgecolor=arrow_color, alpha=0.9, lw=1.0),
            zorder=7
        )

    # 13. OriginPro Peak Fitting Statistics Inset Table
    if show_table:
        table_text = (
            "OriginPro Peak Analytics\n" +
            "------------------------\n" +
            f"Model: {profile_type.replace('_', ' ').title()}\n" +
            rf"$2\theta_0 = {center:.4f}^\circ$" + "\n" +
            rf"$\mathrm{{FWHM}}\ (\beta_{{\mathrm{{obs}}}}) = {fwhm:.4f}^\circ$" + "\n" +
            rf"$\beta_{{\mathrm{{inst}}}} = {inst_fwhm:.4f}^\circ$" + "\n" +
            rf"$\beta_{{\mathrm{{phys}}}} = {beta_phys:.4f}^\circ$" + "\n" +
            rf"$\eta\ (\mathrm{{Lorentz\ Frac}}) = {eta:.2f}$" + "\n" +
            rf"$D_{{\mathrm{{Scherrer}}}} = {crystallite_size_nm:.1f}\ \mathrm{{nm}}$" + "\n" +
            rf"$R^2 = {r_squared:.5f}$" + "\n" +
            rf"$\chi^2_{{\mathrm{{red}}}} = {reduced_chi_sq:.3f}$"
        )
        
        ax1.text(
            0.03, 0.95, 
            table_text, 
            transform=ax1.transAxes, 
            fontsize=8.5, 
            va='top', 
            ha='left',
            color=cfg['text_color'],
            bbox=dict(
                boxstyle='square,pad=0.5', 
                facecolor=cfg['bg_ax'], 
                edgecolor=cfg['spine_color'], 
                alpha=0.88, 
                lw=1.1
            ),
            zorder=7
        )

    # Labels and Legend for Ax1
    ax1.set_ylabel(r'Diffraction Intensity $I$ (counts)', fontsize=11, fontweight='bold', color=cfg['text_color'])
    ax1.legend(loc='upper right', frameon=True, framealpha=0.85, facecolor=cfg['bg_ax'], edgecolor=cfg['spine_color'], fontsize=8.5)
    
    # Auto Y-Limits with headroom
    y_top = (bg_const + height) * 1.25
    ax1.set_ylim(bottom=max(0, bg_const - height * 0.15), top=y_top)

    # 14. Bottom Residual Subplot (Observed - Calculated)
    if ax2:
        ax2.scatter(
            x[::step], 
            residual[::step], 
            s=16, 
            color=cfg['res_color'], 
            alpha=0.8,
            zorder=3
        )
        ax2.axhline(0, color=cfg['spine_color'], linestyle='-', linewidth=1.0, zorder=2)
        ax2.axhline(2 * noise_sigma, color='gray', linestyle=':', linewidth=0.8, alpha=0.7)
        ax2.axhline(-2 * noise_sigma, color='gray', linestyle=':', linewidth=0.8, alpha=0.7)
        
        # Fill +/- 2 sigma band
        ax2.axhspan(-2 * noise_sigma, 2 * noise_sigma, color='gray', alpha=0.08)
        
        ax2.set_xlabel(r'Diffraction Angle $2\theta$ (degrees)', fontsize=11, fontweight='bold', color=cfg['text_color'])
        ax2.set_ylabel(r'$\Delta I\ (\mathrm{Res})$', fontsize=9.5, fontweight='bold', color=cfg['text_color'])
        
        # Set symmetric residual limits
        max_res = max(abs(np.min(residual)), abs(np.max(residual))) * 1.35
        ax2.set_ylim(-max_res, max_res)
    else:
        ax1.set_xlabel(r'Diffraction Angle $2\theta$ (degrees)', fontsize=11, fontweight='bold', color=cfg['text_color'])

    # 15. Export Base64 PNG
    buf = io.BytesIO()
    plt.savefig(
        buf, 
        format='png', 
        dpi=200, 
        bbox_inches='tight', 
        facecolor=fig.get_facecolor(), 
        edgecolor='none'
    )
    buf.seek(0)
    base64_image = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)

    # 16. Generate Clean Standalone Python Code for Origin / Jupyter Notebook
    python_code = f"""# ==============================================================================
# OriginPro / Python Publication XRD Peak Fitting & FWHM Deconvolution
# Generated by XRD Scientific Intelligence Suite
# Compatible with OriginLab Python, Jupyter Notebook, and Matplotlib
# ==============================================================================
import numpy as np
import matplotlib.pyplot as plt

def pseudo_voigt(x, x0, fwhm, eta, height):
    sigma = fwhm / (2 * np.sqrt(2 * np.log(2)))
    gamma = fwhm / 2.0
    G = np.exp(-0.5 * ((x - x0) / sigma) ** 2)
    L = 1.0 / (1.0 + ((x - x0) / gamma) ** 2)
    return height * ((1 - eta) * G + eta * L)

# --- Peak & Instrument Parameters ---
center = {center:.4f}        # 2-theta peak center (deg)
fwhm = {fwhm:.4f}          # Observed FWHM (deg)
inst_fwhm = {inst_fwhm:.4f}     # Instrumental broadening (deg)
eta = {eta:.2f}             # Lorentzian fraction (0=Gauss, 1=Lorentz)
height = {height:.1f}       # Net peak height
bg_const = {bg_const:.1f}      # Baseline offset
wavelength = {wavelength}    # Cu K-alpha (nm)

# --- Grid Definition ---
x = np.linspace({x_min:.3f}, {x_max:.3f}, {n_points})
bg = bg_const + {bg_slope} * (x - center)
y_calc = bg + pseudo_voigt(x, center, fwhm, eta, height)

# --- Deconvolution & Crystallite Size ---
beta_phys = np.sqrt(max(1e-6, fwhm**2 - inst_fwhm**2)) * (1 - eta) + max(1e-6, fwhm - inst_fwhm) * eta
d_scherrer = (0.94 * wavelength) / (np.radians(beta_phys) * np.cos(np.radians(center / 2.0)))

# --- OriginPro Figure Setup ---
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8.5, 6.5), dpi=300, 
                               gridspec_kw={{'height_ratios': [3.5, 1.0], 'hspace': 0.05}}, sharex=True)

# Origin inward ticks style
for ax in [ax1, ax2]:
    ax.tick_params(direction='in', which='both', top=True, right=True, length=6, width=1.3)
    ax.tick_params(which='minor', length=3, width=0.9)
    ax.minorticks_on()

ax1.plot(x, y_calc, color='red', lw=2.0, label='OriginPro Pseudo-Voigt Fit')
ax1.plot(x, bg, color='gray', ls='--', label='Baseline')
ax1.set_ylabel(r'Intensity $I$ (counts)', fontsize=11, fontweight='bold')
ax1.legend(loc='upper right', frameon=True)

# FWHM Annotation
ax1.annotate('', xy=(center - fwhm/2, bg_const + height/2), xytext=(center + fwhm/2, bg_const + height/2),
             arrowprops=dict(arrowstyle='<->', color='red', lw=1.5))
ax1.text(center, bg_const + height/2 + height*0.1, f'FWHM = {{fwhm:.3f}}°\\nSize = {{d_scherrer:.1f}} nm', 
         ha='center', fontsize=9, bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='red'))

ax2.axhline(0, color='black', lw=1)
ax2.set_xlabel(r'Diffraction Angle $2\\theta$ (degrees)', fontsize=11, fontweight='bold')
ax2.set_ylabel('Residual', fontsize=10)

plt.tight_layout()
plt.show()
"""

    return {
        'success': True,
        'image': f"data:image/png;base64,{base64_image}",
        'python_code': python_code,
        'metrics': {
            'center': center,
            'observed_fwhm': fwhm,
            'instrumental_fwhm': inst_fwhm,
            'physical_fwhm': beta_phys,
            'crystallite_size_nm': crystallite_size_nm,
            'eta': eta,
            'r_squared': r_squared,
            'reduced_chi_sq': reduced_chi_sq,
            'height': height,
            'area': height * fwhm * (1.065 * (1 - eta) + 1.571 * eta)
        }
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            input_json = sys.argv[1]
            params = json.loads(input_json)
        except Exception as e:
            params = {}
    else:
        # Read from stdin
        try:
            stdin_data = sys.stdin.read()
            params = json.loads(stdin_data) if stdin_data else {}
        except Exception:
            params = {}

    result = generate_origin_fwhm_plot(params)
    print(json.dumps(result))
