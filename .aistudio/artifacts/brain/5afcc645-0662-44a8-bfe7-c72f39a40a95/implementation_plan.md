# Advanced Peak Profile Deconvolution & Pearson VII Fitting

This plan delivers high-precision analytical mathematics for crystallographic line profile deconvolution, Pearson VII shape fitting, and rigorous covariance-based uncertainty propagation across XRD-Calc Pro.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Direction from Phase 1 Interview**:
> - **Domain Focus**: Peak profile deconvolution and Pearson VII fitting.
> - **Mathematical Methodology**: Analytical precision with exact closed-form formulations (Lanczos-gamma analytical integration, Stokes Fourier deconvolution, and covariance matrix error propagation) over heuristic approximations.

- **Confirmed Decision 1**: Use exact analytical integration for Pearson VII profiles via the Lanczos Gamma function $\Gamma(z)$, ensuring exact analytical integral breadth $\beta_{\text{IB}}$ and shape parameter $m$ extraction without numerical quadrature discretization error.
- **Confirmed Decision 2**: Upgrade Voigt and Double-Voigt peak profile deconvolution across the FWHM and line profile engines to the rigorous Olivero-Longbothum / Thompson-Cox-Hastings formulations, cleanly isolating Cauchy crystallite size broadening ($D_V$, $D_A$) from Gaussian microstrain ($\langle \varepsilon^2 \rangle^{1/2}$) and instrumental aberrations ($\beta_{\text{inst}}$).
- **Confirmed Decision 3**: Provide full covariance matrix calculations, standard error bounds ($\pm 1\sigma$), confidence intervals ($95\%$), and information criteria (AIC / BIC) for peak parameter fits.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades XRD-Calc Pro's peak profile metrology suite to university-grade analytical precision. Users fitting single peaks, overlapping multiplets, or complex instrumental lines obtain mathematically exact Pearson VII parameters (amplitude $I_0$, centroid $2\theta_0$, FWHM, decay exponent $m$), Voigt Cauchy/Gaussian deconvolution, Fourier Stokes deconvolution coefficients, and publication-ready error bands.
- **Target Audience**: Materials scientists, solid-state chemists, and diffraction metrologists characterizing nanomaterials, thin films, pharmaceutical polymorphs, and battery cathodes.
- **Key Value**: Replaces empirical peak shape approximations with closed-form mathematical equations and full variance-covariance uncertainty propagation, guaranteeing reproducible crystallite size and microstrain extraction compliant with International Tables for Crystallography standards.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Profile Fitting & Model Selection*: User inputs experimental peak data (or selects NIST SRM standard such as Si 640f, LaB6 660c, or CeO2 674b) and chooses the profile model (Pearson VII, Pseudo-Voigt, Thompson-Cox-Hastings Voigt, or Split-Pearson VII for asymmetric profiles).
  2. *Live Deconvolution & Component Inspector*: Visualizer renders the experimental profile, fitted analytical envelope, individual deconvolved Gaussian and Lorentzian/Cauchy components, and normalized residual subplots ($(\Delta I)/\sigma$).
  3. *Analytical Metrics Card*: Live display of exact peak area (via Lanczos Gamma $\Gamma(m-0.5)/\Gamma(m)$), integral breadth $\beta$, shape factor $\phi = \text{FWHM}/\beta$, volume-weighted domain size $D_V$, area-weighted column length $D_A$, and RMS microstrain $\langle \varepsilon^2 \rangle^{1/2}$ with $\pm \sigma$ uncertainties.
  4. *Multi-Peak & Doublet Resolving*: Interactive toggle to resolve $K\alpha_1 / K\alpha_2$ characteristic doublets with analytical intensity ratio constraints ($2:1$) and goniometer dispersion spacing.

- **Visual Identity & Theme**:
  - *Aesthetic*: High-contrast, publication-grade scientific workbench aesthetic adhering to the DeepMind Science design system.
  - *Color Palette*: Crisp `#F8FAFC` slate canvas with `#FFFFFF` cards, `#1A73E8` (Google Science Blue) for fitted analytical envelopes, `#0D9488` (Teal) for Gaussian components, `#E8710A` (Orange) for Cauchy/Lorentzian tails, and `#9334E6` (Purple) for Pearson VII envelope contours.
  - *Typography*: Clean sans-serif UI typography (`Inter`) paired with tabular monospace (`JetBrains Mono` / `Roboto Mono`) for numeric values, $R_{wp}$ percentages, and parameter covariance matrices.

- **Interactive Feedback & Diagnostics**:
  - Live Durbin-Watson autocorrelation gauge to warn if profile tails suffer from systematic background mismatch.
  - Real-time parameter confidence badges ($[m > 10 \implies \text{Gaussian limit}]$, $[m \to 1 \implies \text{Lorentzian limit}]$).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Analytical Lanczos-Gamma vs. Numerical Trapezoid/Simpson Integration**
  - *Chosen Approach*: Closed-form analytical integration of Pearson VII using Lanczos 9-term approximation of $\Gamma(m)$ and $\Gamma(m - 0.5)$.
  - *Why*: Eliminates step-size truncation errors and grid artifacts, providing instant $O(1)$ computation for arbitrary $m \ge 1.0001$.
  - *Alternatives Considered*: Numerical Simpson quadrature (rejected due to $O(N)$ overhead and edge tail clipping).

- **Decision 2: Voigt Deconvolution via Thompson-Cox-Hastings vs. Numerical Convolution**
  - *Chosen Approach*: Olivero-Longbothum and Thompson-Cox-Hastings analytical approximations linking Voigt FWHM to Cauchy FWHM ($H_L$) and Gaussian FWHM ($H_G$).
  - *Why*: Delivers $< 0.02\%$ error compared to exact Faddeeva/Voigt integrals while computing in sub-millisecond execution times in the browser.
  - *Alternatives Considered*: 1024-point discrete FFT convolution (slower, prone to wrap-around edge effects).

- **Decision 3: Covariance Matrix & Standard Error Propagation**
  - *Chosen Approach*: Invert the Jacobian normal equations matrix $J^T W J$ weighted by Poisson count statistics $w_i = 1 / \max(1, I_{\text{obs}, i})$ to yield the parameter covariance matrix $C = \sigma^2 (J^T W J)^{-1}$.
  - *Why*: Gives researchers true physical error bars ($\pm \sigma_{2\theta}, \pm \sigma_{\text{FWHM}}, \pm \sigma_m, \pm \sigma_{\text{Area}}$) rather than arbitrary fit percentages.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           XRD-Calc Pro Mathematical Engine                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│       Analytical Profile Models      │   │       Instrumental Deconvolution     │
│  (simulatePeak, Pearson VII, Voigt)  │   │   (Langford, Stokes, de Keijser)     │
├──────────────────────────────────────┤   ├──────────────────────────────────────┤
│ • Lanczos Gamma Function Γ(z)        │   │ • Cauchy / Gaussian Splitting        │
│ • Exact Pearson VII Analytical Area  │   │ • Instrumental Broadening (Caglioti) │
│ • Asymmetric Axial Divergence Skew   │   │ • Volume Size Dv & Area Size Da      │
│ • Thompson-Cox-Hastings PV Synthesis │   │ • RMS Lattice Microstrain <ε²>½      │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Least-Squares Optimization & Covariance                     │
│  • Poisson-Weighted Normal Equations: (Jᵀ W J) Δp = Jᵀ W Δy                     │
│  • Full Variance-Covariance Matrix: Cov(p) = s² (Jᵀ W J)⁻¹                      │
│  • Goodness-of-Fit (GoF), Reduced χ², R_wp, R_p, Durbin-Watson, AIC, BIC        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Interactive Scientific Visualization & UI                    │
│  • Live Diffractogram Envelope & Component Deconstruction (Recharts)            │
│  • Residual Subplot with ±3σ Poisson Statistical Confidence Envelope            │
│  • Publication Export (OriginPro ASCII, LaTeX Parameters, JSON Analysis)        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Mathematical State Mapping

- **Pearson VII Formulation**:
  $$I(x) = I_{\text{bg}} + I_0 \left[ 1 + 4\left(2^{1/m} - 1\right) \frac{(x - x_0)^2}{\text{FWHM}^2} \right]^{-m}$$
  $$\text{Area} = I_0 \cdot \text{FWHM} \cdot \frac{\sqrt{\pi} \cdot \Gamma(m - 0.5)}{2\sqrt{2^{1/m} - 1} \cdot \Gamma(m)}$$
  $$\beta_{\text{IB}} = \frac{\text{Area}}{I_0} = \text{FWHM} \cdot \frac{\sqrt{\pi} \cdot \Gamma(m - 0.5)}{2\sqrt{2^{1/m} - 1} \cdot \Gamma(m)}$$
  $$\text{Shape Factor } \phi = \frac{\text{FWHM}}{\beta_{\text{IB}}} = \frac{2\sqrt{2^{1/m} - 1} \cdot \Gamma(m)}{\sqrt{\pi} \cdot \Gamma(m - 0.5)}$$

- **Voigt Deconvolution Formulations (Olivero-Longbothum / TCH)**:
  $$f_V \approx 0.5346 \beta_L + \sqrt{0.2166 \beta_L^2 + \beta_G^2}$$
  $$\beta_L^S = \beta_L^{\text{obs}} - \beta_L^{\text{inst}}$$
  $$\beta_G^S = \sqrt{\max\left(0, (\beta_G^{\text{obs}})^2 - (\beta_G^{\text{inst}})^2\right)}$$
  $$D_V = \frac{K \lambda}{\beta_L^S \cos\theta}, \quad D_A = \frac{D_V}{2}, \quad \langle \varepsilon^2 \rangle^{1/2} = \frac{\beta_G^S}{2\sqrt{2\pi} \tan\theta}$$

- **Statistical Metrics State**:
  $$R_p = \frac{\sum |y_{\text{obs}} - y_{\text{calc}}|}{\sum y_{\text{obs}}} \times 100\%$$
  $$R_{wp} = \sqrt{\frac{\sum w_i (y_{\text{obs}} - y_{\text{calc}})^2}{\sum w_i y_{\text{obs}}^2}} \times 100\%, \quad w_i = \frac{1}{\max(1, y_{\text{obs}, i})}$$
  $$\chi^2_{\text{red}} = \frac{\sum w_i (y_{\text{obs}} - y_{\text{calc}})^2}{N - P}, \quad \text{GoF} = \sqrt{\chi^2_{\text{red}}}$$
  $$d_{\text{DW}} = \frac{\sum_{i=2}^N (\Delta y_i - \Delta y_{i-1})^2}{\sum_{i=1}^N (\Delta y_i)^2}$$

---

## 5. Verification & Testing Strategy

1. **Analytical Benchmark Testing**:
   - Verify Pearson VII integration matches Gaussian limit ($\text{Area} = I_0 \cdot \text{FWHM} \cdot \sqrt{\pi / (4\ln 2)} \approx 1.06447 \cdot I_0 \cdot \text{FWHM}$) as $m \to \infty$.
   - Verify Pearson VII integration matches Lorentzian limit ($\text{Area} = I_0 \cdot \text{FWHM} \cdot \pi / 2 \approx 1.5708 \cdot I_0 \cdot \text{FWHM}$) at $m = 1.0$.
2. **Standard Reference Materials**:
   - Validate deconvolution against NIST SRM 640f ($Si$) and SRM 660c ($LaB_6$) peak profiles.
3. **Compilation & Integrity**:
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet` (`npm run build`).
