# Spectral Attention Transformers & Multi-Phase Deconvolution Studio

Interactive deep learning workbench powered by 1D Vision/Spectral Transformer architectures, multi-head self-attention mechanisms, and cross-attention deconvolution layers to separate overlapping powder diffraction reflections and quantify multi-phase crystalline weight fractions in real time.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following architectural and analytical choices:
> - **Deep Learning Technique**: Transformers & Spectral Attention Networks (1D tokenized patches with self-attention and cross-phase attention).
> - **Primary Analytical Objective**: Multi-phase deconvolution and quantitative weight fraction ($\text{wt}\%$) estimation.
> - **Integration Model**: Interactive visual studio embedded directly into the machine learning environment with real-time parameter exploration, live attention heatmaps, and PyTorch script generators.

- **Confirmed Decision 1**: Implemented as a dedicated, first-class tab (`Spectral Transformer`) inside `MLTechniquesStudio.tsx` and linked with the main `DeepLearningModule.tsx` mixture engine.
- **Confirmed Decision 2**: Interactive mixture generator supporting 2 to 4 simultaneous crystalline phases with live slider controls to test deconvolution accuracy against ground truth.
- **Confirmed Decision 3**: Multi-head attention visualizer displaying token-to-token attention weights ($\mathbf{A} = \text{softmax}(\mathbf{Q}\mathbf{K}^T / \sqrt{d_k})$) across $2\theta$ Bragg angles to explain which peak clusters drive the phase fraction decisions.

---

## 1. Overview & Core Concept

### What It Does
The Spectral Attention Transformer Studio provides a research-grade visual simulation and computational engine for analyzing complex multi-phase XRD patterns. It breaks continuous $2\theta$ diffractograms ($10^\circ - 90^\circ$) into 1D spectral tokens, applies multi-head self-attention to capture long-range peak correlations (harmonic $hkl$ series and symmetry extinction rules), and uses cross-attention against crystallographic reference phase dictionaries to deconvolve overlapping profiles and predict precise phase mass fractions.

### Target Audience & Persona
- Materials scientists, crystallographers, and synchrotron/laboratory XRD operators needing fast, automated phase deconvolution without manual trial-and-error peak stripping.
- Computational materials researchers evaluating Transformer architectures versus traditional Levenberg-Marquardt Rietveld refinement.

### Key Value
Traditional Rietveld refinement requires accurate initial structural models and can get trapped in local minima with overlapping multi-phase reflections. The Spectral Transformer provides instant, global multi-phase deconvolution with attention-based explainability and calibrated uncertainty intervals.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Explore Pre-Trained Multi-Phase Mixtures**:
   - The user selects a multi-phase system (e.g. *Quartz + Rutile + Anatase TiO₂*, *Silicon + Alumina*, *Cement Clinker: Alite + Belite + Ferrite*).
   - The user adjusts interactive mixture fraction sliders (e.g., $65\%\text{ Phase A} + 35\%\text{ Phase B}$).
2. **Interactive Spectral Tokenization & Attention Exploration**:
   - The user adjusts the Transformer hyperparameters:
     - Patch Size ($\Delta 2\theta = 0.5^\circ, 1.0^\circ, 2.0^\circ$).
     - Attention Heads ($h = 4, 8$).
     - Model Dimension ($d_{\text{model}} = 64, 128, 256$).
     - Softmax Temperature ($\tau = 0.5 - 2.0$).
   - A live 2D Attention Heatmap matrix updates instantly, showing how high-angle reflection tokens attend to fundamental low-angle reflections.
3. **Deconvolved Profile Visualization & Quantitative Output**:
   - The main chart renders the total composite diffractogram, observed data points, and the Transformer-deconvolved individual phase sub-profiles.
   - A quantitative telemetry panel displays:
     - Predicted Weight Fractions ($\text{wt}\%$) vs. Ground Truth with error margins ($\Delta\text{wt}\% \le 1.2\%$).
     - Confidence metrics and cross-attention entropy scores.
     - Comparison with traditional Hill-Howard Rietveld scale-factor quantitative phase analysis (QPA).
4. **PyTorch & HuggingFace Code Export**:
   - The user clicks **Export PyTorch Architecture** to view or copy a complete, production-ready `nn.Module` implementation of `SpectralTransformer1D` with Dirichlet multi-phase loss.

### Visual Identity & Theme (Scientific Laboratory Workbench)
Following the `frontend-design` constitution and `references/8_science_space_biotech.md`:
- **Color Budget**: Monochromatic obsidian canvas (`#07090E` / `#0B0E17`) with crisp 1px hairline borders (`border-slate-800`), clinical slate surfaces (`#111827`), and single-focus laser cyan (`#06B6D4`) and emerald (`#10B981`) telemetry accents.
- **Zero-Pill Discipline**: Metadata displayed as unboxed clean text with subtle typographic separators (`·`). Interactive tabs and action triggers styled as clean segmented controls with functional click handlers.
- **Tabular Numerals**: Numeric readouts and fraction percentages formatted with `font-mono tabular-nums` to eliminate layout jitter.
- **Visual Hierarchy**: Primary composite diffractogram paired with an interactive 2D attention matrix inspector and synchronized phase attribution cards.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: 1D Patch-Based Tokenization vs. Point-by-Point Sequence Modeling
- **Chosen Approach**: 1D Spectral Patch Embedding (projecting overlapping $0.8^\circ$ windows of $2\theta$ into $d_{\text{model}}$ vectors).
- **Why**: An XRD scan contains 1,600+ points; full self-attention across 1,600 tokens has $O(N^2) \approx 2.5\times 10^6$ operations, which lags in the browser. Patch embedding reduces the sequence length to 80-100 tokens ($O(N^2) \approx 6,400$ operations), delivering buttery 60 FPS in-browser interaction.
- **Alternatives Considered**: Full point-by-point Transformer (too heavy for client-side JavaScript) or 1D CNN without attention (lacks long-range crystallographic symmetry awareness).

### Decision 2: Multi-Head Cross-Attention for Phase Deconvolution
- **Chosen Approach**: Query vectors $\mathbf{Q}$ derived from the composite scan; Key/Value vectors $\mathbf{K}, \mathbf{V}$ derived from crystallographic reference phase dictionaries (Bragg angles, structure factors $F_{hkl}$, and space group extinctions).
- **Why**: Allows direct physical explainability—cross-attention weights represent the exact probability that an observed peak belongs to a specific phase.
- **Alternatives Considered**: Black-box MLP output layer (fails to provide verifiable peak-level attribution).

### Decision 3: Quantitative Phase Estimation Loss Function in Python Generator
- **Chosen Approach**: Dirichlet-distributed concentration loss + Wasserstein distance against synthetic Rietveld mixtures.
- **Why**: Guarantees $\sum w_i = 100\%$ and preserves physical non-negativity without ad-hoc post-normalization.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DeepLearningModule.tsx                                │
│                     (Main Phase ID & Mixture Workspace)                         │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MLTechniquesStudio.tsx                               │
│  ┌───────────────────────┬─────────────────────────┬─────────────────────────┐  │
│  │  Tabs Navigation      │  Active Mixture Preset  │  Global Action Toolbar  │  │
│  └───────────────────────┴─────────────────────────┴─────────────────────────┘  │
│                                        │                                        │
│  ┌─────────────────────────────────────┴─────────────────────────────────────┐  │
│  │               NEW: 'transformer' (Spectral Attention Studio)              │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────┐  ┌────────────────────────────────────────┐  │  │
│  │  │ Interactive Mixture     │  │ ComposedChart Multi-Phase              │  │  │
│  │  │ Fractions (Sliders)     │  │ Deconvolution Canvas                  │  │  │
│  │  │ - Phase A / B / C wt%   │  │ - Composite Pattern vs Deconvolved     │  │  │
│  │  │ - Peak Width / Noise    │  │ - Reference Bragg Line Indicators     │  │  │
│  │  └────────────┬────────────┘  └───────────────────┬────────────────────┘  │  │
│  │               │                                   │                       │  │
│  │               ▼                                   ▼                       │  │
│  │  ┌─────────────────────────┐  ┌────────────────────────────────────────┐  │  │
│  │  │ Transformer Hyperparams │  │ 2D Multi-Head Self-Attention Heatmap   │  │  │
│  │  │ - Patch Size (Δ2θ)      │  │ - Token-to-Token Cross-Attention       │  │  │
│  │  │ - Heads (4/8), Temp τ   │  │ - Bragg Reflection Saliency Attribution│  │  │
│  │  └─────────────────────────┘  └────────────────────────────────────────┘  │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Quantitative Phase Analysis (QPA) Telemetry                         │  │  │
│  │  │ - Transformer Predicted wt% vs Ground Truth vs Hill-Howard Rietveld │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                   mlPythonGenerators.ts (Export Engine)                   │  │
│  │  - PyTorch SpectralTransformer1D model with MultiheadAttention            │  │
│  │  - Synthetic multi-phase dataset loader & Dirichlet loss training script  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

1. **`MLTechniquesStudio.tsx`**:
   - Expand `MLTechniqueTab` union to include `'transformer'`.
   - Add default active mixture state: 3 benchmark multi-phase systems (e.g. *Quartz + Rutile*, *Corundum + Silicon + Magnetite*, *Anatase + Rutile*).
   - Render the interactive Spectral Attention Studio containing:
     - Mixture composition scrubber with linked normalized percentages ($\sum \text{wt}\% = 100\%$).
     - Transformer hyperparameter tuning rail (heads, token patch size, layer depth, attention temperature).
     - Synchronized Recharts dual-panel display: composite diffractogram + deconvolved phase traces.
     - Interactive SVG/Canvas 2D attention matrix heatmap with hovered token reflection crosshair.
     - Quantitative results scorecard comparing predicted fractions with certified ground truth.
2. **`mlPythonGenerators.ts`**:
   - Add `'transformer'` to `PythonTechniqueId`.
   - Implement `generateTransformerPythonCode()`: Complete PyTorch 2.x script featuring:
     - `SpectralPatchEmbedding`: 1D convolution layer with sinusoidal positional encodings.
     - `TransformerEncoderBlock`: Multi-head self-attention with pre-layer normalization and GELU activations.
     - `QuantitativeDeconvolutionHead`: Softmax attention pooling with Dirichlet loss for quantitative phase abundance.
     - Training and evaluation loop with synthetic pattern generation.
3. **Integration & Navigation**:
   - Add "Spectral Transformer" as the prominent primary tab in `MLTechniquesStudio.tsx`.
   - Add a quick-launch action button in `DeepLearningModule.tsx` that links directly to the Transformer deconvolution studio with the currently active mixture.
