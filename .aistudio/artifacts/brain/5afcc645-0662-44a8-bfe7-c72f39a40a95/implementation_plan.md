# Implementation Plan - Advanced Line Profile Analytics & Peak Deconvolution

## User Request & Clarifying Selections
- **Capability**: Advanced peak deconvolution and shape functions.
- **Workflow**: Interactive residual plots and live component deconstruction.
- **Models**: Thompson-Cox-Hastings pseudo-Voigt (TCH-pV) and Pearson VII.

---

## Proposed Changes & Enhancements in `FWHMModule.tsx` & Physics Utilities

### 1. Mathematical Profile Functions & Peak Deconvolution
- Implement high-precision **Thompson-Cox-Hastings Pseudo-Voigt (TCH-pV)** profile function with Gaussian ($\eta_G$) and Lorentzian ($\eta_L$) breadth parameterization matching instrumental Caglioti and crystallite size/strain equations.
- Implement **Pearson VII** profile function: $I(x) = I_0 \left[1 + \frac{4(2^{1/m}-1)(x-x_0)^2}{FWHM^2}\right]^{-m}$, supporting variable shape exponent $m$ ($1 \le m \le 10$).
- Enhance live multi-component deconstruction where each individual peak contribution ($I_i(x)$), background ($B(x)$), and total model fit ($Y_{calc}(x)$) are independently calculated and plotted.

### 2. Interactive Residual Plots & Live Component Deconstruction UI
- Add a dedicated **Residual Error Sub-plot** ($\Delta I = I_{obs} - I_{calc}$) beneath the primary diffractogram peak view.
- Add live metrics panel displaying Goodness-of-Fit ($R_{wp}$, $R_p$, $\chi^2$, Durbin-Watson autocorrelation statistic).
- Provide interactive sliders for real-time shape parameter adjustment (Gaussian fraction $\eta$, Pearson VII exponent $m$, asymmetry parameter, and background polynomial coefficients).

---

## Verification Plan
1. Compile the applet (`compile_applet`) and run TypeScript lint check (`lint_applet`).
2. Verify interactive peak fitting, residual updates, and profile model switching in the Line Profile Analytics (`fwhm`) module.
