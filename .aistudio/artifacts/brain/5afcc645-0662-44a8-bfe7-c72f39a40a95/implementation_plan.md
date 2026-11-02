# Diffraction Compare Lab — Crystallographic Physics, Multi-Phase Quantification & Diagnostic Overhaul

This upgrade transforms the Diffraction Compare Lab into a rigorous, laboratory-grade powder X-ray diffraction (PXRD) comparative workbench. It replaces heuristic approximations with analytical crystallographic physics—incorporating Caglioti angle-dependent instrumental resolution, $\text{Cu } K\alpha_1/K\alpha_2$ doublet synthesis and Rachinger stripping, analytical Non-Negative Least Squares (NNLS) phase quantification with Reference Intensity Ratio ($I/I_c$ RIR) corundum weights, and linear-regression separation of instrumental zero-shift, specimen displacement, and true lattice macrostrain ($\Delta d/d$).

## User Review & Critical Decisions

> [!IMPORTANT]
> All core scope and mathematical depth decisions were confirmed during Phase 1 clarification. Review the architectural blueprint below and click **Proceed** to execute the upgrade across the Diffraction Compare Lab.

- **Confirmed Decision 1 — Full 4-Pillar Lab Overhaul**: All four priority domains will be upgraded together:
  1. Full mathematical and statistical profile comparison overhaul
  2. Interactive chart, precision peak caliper, and multi-phase stick/ribbon visualization upgrades
  3. Automated phase search-match (including residual unexplained-peak identification) and analytical NNLS quantification refinement
  4. Peak-by-peak multi-phase indexing, lattice strain ($\Delta d/d$), and instrumental zero-shift separation analysis
- **Confirmed Decision 2 — Rigorous Crystallographic Physics**: Profile synthesis and phase quantification will implement Caglioti angle-dependent FWHM dispersion ($\text{FWHM}^2(\theta) = U\tan^2\theta + V\tan\theta + W$), optional $\text{Cu } K\alpha_1/\alpha_2$ doublet splitting ($\lambda_1 = 1.540598\text{ \AA}, \lambda_2 = 1.544426\text{ \AA}, I_2/I_1 = 0.5$), working area/maximum/raw normalization modes, and Reference Intensity Ratio ($I/I_c$ RIR) semi-quantitative weight percent conversion.

---

## 1. Overview & Core Concept

- **What It Does**: Provides crystallographers, materials scientists, and solid-state chemists with a side-by-side and overlaid diffraction pattern comparator capable of synthesizing physically accurate multi-phase profiles, indexing reflections across up to three reference phases simultaneously (Primary B, Secondary C, Tertiary D), decomposing peak shifts into instrumental alignment errors versus physical lattice strain, and identifying unknown impurity phases directly from residual peaks.
- **Target Audience / Persona**: Diffractionists, battery & ceramic researchers, and mineralogy analysts comparing experimental scans or active Bragg calculations against standard reference phases and multi-phase mixtures.
- **Key Value**: Eliminates false strain readings caused by sample height displacement or goniometer zero-shift, provides true weight-percent phase quantification via $I/I_c$ RIR scaling rather than raw intensity ratios, and enables multi-stage "Residual Search-Match" to identify minor impurity peaks automatically.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Configure & Synthesize Physics**: Users select or upload Sample A and Reference B (plus optional Phases C and D), toggle Caglioti $(U, V, W)$ angle-dependent broadening, $\text{Cu } K\alpha_1/\alpha_2$ doublet modeling, Sonneveld-Visser baseline stripping, and normalization mode (`Max 100%`, `Unit Integrated Area`, or `Raw Counts`).
  2. **Multi-Phase & Dual-Space Inspection**: Users inspect patterns across 6 view modes (`Overlay`, `Dual-Split`, `3-Pane Stack`, `Butterfly Mirrored`, `1st Derivative`, `Multi-Phase`) with stacked Bragg $(hkl)$ reflection tick tracks for each active phase, intensity scale switching (`Linear`, `Sqrt`, `Log10`), and interactive peak-snapping calipers.
  3. **Zero-Shift vs. Strain Separation**: In the `Strain (Δd/d)` diagnostic tab, users inspect an interactive $\Delta 2\theta$ vs. $2\theta$ / $\tan\theta$ regression analysis that separates constant goniometer zero-shift ($\Delta 2\theta_0$), specimen displacement ($-\frac{2s}{R}\cos\theta$), and true isotropic lattice macrostrain ($\varepsilon = -\frac{\Delta d}{d}$).
  4. **Residual Search-Match & NNLS + RIR Quantification**: Users open the Search-Match engine in either **Full Pattern** mode or **Residual (Unmatched Peaks Only)** mode to identify impurity phases from unexplained reflections, then inspect RIR-corrected weight fractions ($\text{wt\%}$) in the `Phase Solver (NNLS)` tab.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-precision laboratory instrumentation console following the 60-30-10 scientific palette discipline.
  - *Color Palette & Mood*: Deep obsidian canvas (`#030712` / `#080d1a`) with crisp 1px structural slate borders (`#1e293b`), paired with a publication-ready High-Contrast Light mode (`#ffffff` canvas, `#e2e8f0` grid) and calibrated phosphor trace accents (Cyan `#06b6d4`, Indigo `#6366f1`, Emerald `#10b981`, Rose `#f43f5e`, Amber `#f59e0b`).
  - *Typography & Hierarchy*: Clean neo-grotesque UI labels paired with strict tabular monospace (`font-mono tabular-nums`) for all $2\theta$, $d$-spacing ($\text{\AA}$), scattering vector $Q$ ($\text{\AA}^{-1}$ and $\text{nm}^{-1}$), $R_{wp}$, $\chi^2$, and strain readouts.
  - *Component Styling & Layout*: Asymmetric split configuration cards, single-elevation containers with hairline borders, unboxed inline scientific metadata with typographic separators, and zero decorative pulsing dots.
- **Interactive Feedback & Motion**:
  - Instantaneous ($\le 150\text{ms}$) curve updates via deferred React state and Largest-Triangle-Three-Buckets (LTTB) downsampling, interactive peak-snap calipers with keyboard fine-stepping, and one-click zoom-to-reflection focusing from the indexing table.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Caglioti $(U, V, W)$ Instrumental Resolution + $\text{Cu } K\alpha_1/\alpha_2$ Doublet Synthesis**
  - *Chosen Approach*: Compute angle-dependent FWHM at every reflection using $\text{FWHM}(\theta) = \sqrt{\max(0.0004, U\tan^2\theta + V\tan\theta + W)} + \text{FWHM}_{\text{size/strain}}(\theta)$, and optionally synthesize the $\text{Cu } K\alpha_2$ companion peak at $2\arcsin\left(\frac{\lambda_2}{\lambda_1}\sin\theta_1\right)$ with $0.5\times$ intensity.
  - *Why*: Real powder diffractometers exhibit broadening that grows non-linearly at high $2\theta$ due to wavelength dispersion ($\tan\theta$) and axial divergence, plus $K\alpha_1/K\alpha_2$ splitting at high angles. Constant-FWHM synthesis produces unrealistic high-angle profiles and inflates $R_{wp}$ residuals.
  - *Alternatives Considered*: Keeping a single scalar FWHM slider. We retain the scalar FWHM as the baseline $W = \text{FWHM}_0^2$ while adding Caglioti $U, V$ dispersion and $K\alpha_2$ doublet controls so both simple and advanced workflows remain effortless.
- **Decision 2: Analytical Active-Set NNLS with Reference Intensity Ratio ($I/I_c$ RIR) Weight Conversion**
  - *Chosen Approach*: Replace the coarse 2% grid loop with an exact analytical 3-phase Non-Negative Least Squares (NNLS) solver followed by fine coordinate refinement, and convert spectral scale factors $S_k$ into true weight percentages via $\text{wt\%}_k = \frac{S_k / \text{RIR}_k}{\sum_j (S_j / \text{RIR}_j)} \times 100$ with editable per-phase $\text{RIR}$ ($I/I_{\text{corundum}}$) values.
  - *Why*: Equal integrated intensities do not imply equal weight fractions because high-symmetry or heavy-atom phases scatter X-rays far more strongly (higher $I/I_c$). Incorporating RIR ($I/I_c$) yields physically meaningful semi-quantitative weight percentages alongside spectral area fractions.
  - *Alternatives Considered*: Full Rietveld structure-factor calculation from atomic fractional coordinates, which is unavailable when users input custom $2\theta(I)$ peak lists. RIR bridges custom peak lists and database phases seamlessly.
- **Decision 3: Multi-Parameter Peak Shift Decomposition (Zero-Shift vs. Specimen Displacement vs. Lattice Strain)**
  - *Chosen Approach*: Perform weighted linear regression across all indexed peak pairs to decompose observed shift $\Delta 2\theta(\theta) = \Delta 2\theta_0 - \frac{2s}{R}\cos\theta - 2\varepsilon\tan\theta\cdot\frac{180}{\pi}$, reporting decoupled estimates for goniometer zero-error ($\Delta 2\theta_0$), sample displacement error, and true lattice strain ($\varepsilon = \Delta d/d$).
  - *Why*: A constant goniometer zero-offset or sample height error shifts all peaks in the same direction and is frequently misdiagnosed as tensile or compressive lattice strain if evaluated at a single average angle.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         DiffractionCompareModule (State Host)                     │
│  • Active/Custom/Uploaded Sample A, Reference B, Secondary C, Tertiary D          │
│  • CompareEngineSettings (Caglioti U/V/W, Ka2 Doublet, RIR_B/C/D, Norm, Scale)    │
└───────────────┬───────────────────────────────────┬───────────────────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│     Crystallographic Math Engine      │ │     Interactive UI & Visual Stage       │
│  • Caglioti FWHM(θ) + Ka1/Ka2 synth   │ │  • SampleConfigurationPanel             │
│  • Normalization (Max100, Area, Raw)  │ │    (Caglioti, Ka2, RIR, Norm controls)  │
│  • Full-Profile Cross-Corr Auto-Align │ │  • CompareChartViewer                   │
│  • Multi-Phase Peak Indexing (B/C/D)  │ │    (6 modes, Log/Sqrt Y, Stacked hkl    │
│  • Zero-Shift / Displacement / Strain │ │     ticks, Peak-Snap Caliper, Export)   │
│    Regression Solver                  │ │  • DiagnosticsAndMetricsPanel           │
│  • Analytical NNLS + RIR Wt% Solver   │ │    (Rp, Rwp, Rexp, χ², Cosine, Strain   │
│  • Hanawalt + Residual Search-Match   │ │     Regression Plot, NNLS+RIR Table)    │
│                                       │ │  • AutoSearchMatchModal                 │
│                                       │ │    (Full Pattern vs Residual Impurity)  │
└───────────────────────────────────────┘ └─────────────────────────────────────────┘
```

### Data Model & State Enhancements

- **Extended `CompareEngineSettings`**:
  - `cagliotiU`, `cagliotiV`, `cagliotiW`: Instrumental resolution dispersion parameters (defaults tuned so $W = \text{fwhm}^2$, with toggleable Caglioti dispersion).
  - `enableKa2Doublet`: Boolean toggle to synthesize $\text{Cu } K\alpha_1 + K\alpha_2$ doublets ($\Delta\lambda/\lambda \approx 0.00248$).
  - `stripKa2`: Boolean toggle for Rachinger $K\alpha_2$ stripping on experimental continuous data.
  - `rirB`, `rirC`, `rirD`: Reference Intensity Ratio ($I/I_c$) corundum scale factors for Reference B, Phase C, and Phase D (automatically initialized from material formula/atomic weight or user-adjustable in the quantification solver).
- **Extended `SpectralMetrics`**:
  - Adds `cosineSimilarity` (dot-product spectral angle similarity), `spearmanRho` (rank-order correlation), `braggR` ($R_B$ integrated peak intensity residual), and `weightedDurbinWatson` ($d_{DW}$ serial correlation statistic for residual autocorrelation).
- **ExtendedIndexing & Strain Decomposition Model**:
  - Multi-phase indexing matches experimental Sample A peaks against Reference B, Phase C, and Phase D, tagging each reflection with `phaseOrigin: 'Phase B' | 'Phase C' | 'Phase D' | 'Unknown'` and computing per-peak interplanar $\Delta d/d$ (%) and local Scherrer crystallite size $D_{hkl}$ (nm).
  - Strain regression output provides:
    - `zeroShiftDeg`: Estimated constant instrumental zero-point offset ($\Delta 2\theta_0$).
    - `specimenDisplacementCos`: Estimated $\cos\theta$ specimen displacement coefficient.
    - `trueMacrostrainPercent`: Slope-derived lattice strain $\varepsilon = -\frac{\Delta d}{d}$ (%) after removing instrumental zero-shift.
    - `regressionR2`: Goodness-of-fit of the strain-shift separation model.

### Interactive Component & State Mapping

1. **Sample & Physics Configuration (`SampleConfigurationPanel`)**:
   - Exposes `Normalization Mode` (`Max 100%`, `Unit Area`, `Raw Intensity`), `Intensity Y-Scale` (`Linear`, `Square Root √I`, `Log10`), `Caglioti Broadening (U, V, W)`, and `Cu Kα₁/Kα₂ Doublet` toggles inside the Diffraction Physics drawer.
   - Exposes `RIR (I/Ic)` corundum factor inputs for Phases B, C, and D inside the Multi-Phase Mixture drawer.
2. **Chart Stage & Precision Caliper (`CompareChartViewer`)**:
   - Applies selected Y-axis scaling (`linear`, `sqrt`, `log10`) to chart data and axis formatters so weak trace impurity peaks (<2% relative intensity) are clearly visible.
   - Renders multi-tier Bragg $(hkl)$ reflection markers for Sample A, Reference B, Phase C, and Phase D without label collisions.
   - Upgrades the Caliper tool with Peak Selector dropdowns (allowing instant selection of any detected peak in A, B, C, or D as Marker C1 or C2) plus full-profile cross-correlation auto-alignment (`optimizeAlignmentAndScale` refined with fine $0.01^\circ$ profile residual minimization).
3. **Diagnostics, Multi-Phase NNLS+RIR & Strain Separation (`DiagnosticsAndMetricsPanel`)**:
   - **Overview Cards**: Displays $R_p$, $R_{wp}$, $R_{exp}$, $\chi^2$ ($S^2$), Bragg $R_B$, Cosine Similarity, Pearson $r$, and Durbin-Watson statistic.
   - **(hkl) Indexing Table**: Shows multi-phase origin badges (`Phase B`, `Phase C`, `Phase D`, `Unindexed`), per-peak $\Delta d/d$ strain, and a direct `"Identify Unmatched Peaks"` button that launches `AutoSearchMatchModal` in Residual mode.
   - **Phase Solver (NNLS + RIR)**: Displays both Spectral Area Fractions and RIR-Corrected Weight Fractions ($\text{wt\%}$) with interactive RIR ($I/I_c$) sliders/inputs and phase density/corundum calibration notes.
   - **Strain ($\Delta d/d$) & Zero-Shift Separation**: Renders an interactive $\Delta 2\theta$ vs. $2\theta$ / Williamson-Hall diagnostic chart and regression breakdown card distinguishing instrumental zero-offset ($\Delta 2\theta_0$) from physical lattice expansion/contraction ($\Delta d/d$), with a `"Apply Zero-Shift Correction"` button that feeds $-\Delta 2\theta_0$ directly into the chart alignment shift.
4. **Automated Search-Match (`AutoSearchMatchModal`)**:
   - Adds a mode switch between **Full Pattern Search** (all Sample A peaks) and **Residual Impurity Search** (searching only the unmatched `extraInA` reflections to identify secondary Phase C or tertiary Phase D), plus a `"+ Phase D"` action button alongside `"Set Ref B"` and `"+ Phase C"`.
