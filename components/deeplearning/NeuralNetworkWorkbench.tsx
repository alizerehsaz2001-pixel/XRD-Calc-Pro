import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Cpu,
  Layers,
  Activity,
  Zap,
  Network,
  Play,
  RotateCcw,
  Sparkles,
  Compass,
  Scale,
  Database,
  ArrowUpRight,
  GitBranch,
  Copy,
  Check,
  Download,
  TrendingUp,
  Target,
} from 'lucide-react';
import { DLPhaseCandidate } from '../../types';
import { playSynthTone } from '../../utils/sound';
import {
  PDF2CardRecord,
  CURATED_PDF2_SUBFILE_PACKS,
  buildFullPDF2Database,
  matchScanAgainstPDF2Database,
  syncPDF2DatabaseWithNeuralNet,
  getLastPDF2NeuralSyncMetadata,
  installPDF2SubfilePackToLocalDB,
} from '../../utils/pdf2DatabaseEngine';
import { NeuralNetCadSchematic } from './NeuralNetCadSchematic';

export type NeuralArchId =
  | 'resnet1d'
  | 'xrd_former'
  | 'pinn_bragg'
  | 'crystal_gnn'
  | 'vae_manifold';

export interface NeuralNetworkWorkbenchProps {
  parsedPoints: Array<{
    twoTheta: number;
    intensity: number;
    dSpacing?: number;
    h?: number;
    k?: number;
    l?: number;
    hkl?: string;
    fwhm?: number;
  }>;
  selectedCandidate: DLPhaseCandidate | null;
  candidates: DLPhaseCandidate[];
  engineConfig: {
    kernelSize: number;
    kernelProfile: string;
    filters: number;
    activation: string;
    optimization: string;
    multiScale: boolean;
    dropout: number;
    pooling: string;
    depth: number;
    learningRate: number;
    batchNorm: boolean;
    confidenceThreshold: number;
    cagliotiCorrection?: boolean;
    asymmetryCorrection?: boolean;
    backgroundSubtraction?: boolean;
    shapeExponent?: number;
  };
  onUpdateEngineConfig: (newConfig: any) => void;
  onTriggerPhaseID: () => void;
  onLoadPatternData: (patternText: string, materialLabel?: string) => void;
  onOpenMLStudioTab?: () => void;
  onOpenPDF2Database?: () => void;
  isSimulating?: boolean;
}

interface ArchSpec {
  id: NeuralArchId;
  name: string;
  shortTag: string;
  family: string;
  params: string;
  flops: string;
  latencyMs: number;
  receptiveField: string;
  inductiveBias: string;
  equation: string;
  description: string;
  accentColor: string;
  layers: Array<{
    id: string;
    index: number;
    shortName: string;
    fullName: string;
    type: string;
    tensorShape: string;
    paramsCount: string;
    mathFormula: string;
    role: string;
  }>;
}

const NEURAL_BENCHMARK_PRESETS: Array<{
  id: string;
  label: string;
  subtitle: string;
  crystalSystem: string;
  pattern: string;
}> = [
  {
    id: 'quartz_rutile',
    label: 'α-SiO₂ + TiO₂ Binary',
    subtitle: 'Trigonal (P3₂21) + Tetragonal (P4₂/mnm)',
    crystalSystem: 'Trigonal',
    pattern: [
      '20.860, 34.0, 1, 0, 0',
      '26.640, 100.0, 1, 0, 1',
      '27.446, 62.0, 1, 1, 0',
      '36.085, 28.0, 1, 0, 1',
      '36.544, 14.0, 1, 1, 0',
      '39.465, 12.0, 1, 0, 2',
      '41.225, 19.0, 1, 1, 1',
      '50.139, 22.0, 1, 1, 2',
      '54.322, 38.0, 2, 1, 1',
      '59.960, 15.0, 2, 1, 1',
    ].join('\n'),
  },
  {
    id: 'licoo2_cathode',
    label: 'LiCoO₂ + Li₂CO₃ Cathode',
    subtitle: 'Rhombohedral (R-3m) Layered Oxide',
    crystalSystem: 'Trigonal',
    pattern: [
      '18.920, 100.0, 0, 0, 3',
      '21.310, 14.0, 1, 1, 0',
      '31.770, 18.0, 0, 0, 2',
      '37.410, 32.0, 1, 0, 1',
      '39.110, 12.0, 0, 0, 6',
      '45.240, 58.0, 1, 0, 4',
      '49.460, 15.0, 0, 1, 5',
      '59.620, 24.0, 1, 0, 7',
      '65.480, 29.0, 0, 1, 8',
      '66.390, 31.0, 1, 1, 0',
    ].join('\n'),
  },
  {
    id: 'fe_bcc_spinel',
    label: 'α-Fe BCC + Fe₃O₄ Spinel',
    subtitle: 'Cubic Im-3m + Fd-3m Magnetic Composite',
    crystalSystem: 'Cubic',
    pattern: [
      '30.095, 24.0, 2, 2, 0',
      '35.422, 78.0, 3, 1, 1',
      '43.052, 19.0, 4, 0, 0',
      '44.673, 100.0, 1, 1, 0',
      '53.391, 11.0, 4, 2, 2',
      '56.942, 26.0, 5, 1, 1',
      '62.515, 34.0, 4, 4, 0',
      '65.021, 22.0, 2, 0, 0',
      '82.333, 38.0, 2, 1, 1',
    ].join('\n'),
  },
  {
    id: 'batio3_split',
    label: 'BaTiO₃ Ferroelectric Split',
    subtitle: 'Tetragonal P4mm (002)/(200) Doublet',
    crystalSystem: 'Tetragonal',
    pattern: [
      '22.180, 26.0, 1, 0, 0',
      '31.560, 100.0, 1, 1, 0',
      '38.890, 29.0, 1, 1, 1',
      '44.910, 19.0, 0, 0, 2',
      '45.420, 38.0, 2, 0, 0',
      '50.980, 14.0, 2, 1, 0',
      '56.240, 36.0, 2, 1, 1',
      '65.840, 25.0, 2, 2, 0',
      '74.920, 18.0, 3, 1, 0',
    ].join('\n'),
  },
  {
    id: 'si_srm640f',
    label: 'NIST Si SRM 640f',
    subtitle: 'Diamond Cubic Fd-3m (a = 5.4312 Å)',
    crystalSystem: 'Cubic',
    pattern: [
      '28.443, 100.0, 1, 1, 1',
      '47.303, 55.0, 2, 2, 0',
      '56.123, 30.0, 3, 1, 1',
      '69.131, 6.0, 4, 0, 0',
      '76.377, 11.0, 3, 3, 1',
      '88.032, 12.0, 4, 2, 2',
    ].join('\n'),
  },
];

const NEURAL_ARCHITECTURES: Record<NeuralArchId, ArchSpec> = {
  resnet1d: {
    id: 'resnet1d',
    name: 'ResNet-1D-50 Dilated ConvNet',
    shortTag: 'ResNet-1D',
    family: 'Multi-Scale Dilated Residual CNN',
    params: '2.48M',
    flops: '18.4 MFLOPs',
    latencyMs: 1.2,
    receptiveField: '4.8° 2θ (Dilated d=1,2,4)',
    inductiveBias: 'Translation & Shift Invariance under Lattice Macrostrain',
    equation: 'y_l = σ(BN(W_2 * σ(BN(W_1 *_{d} x_l)))) + x_l',
    description:
      'Extracts hierarchical peak shapes across multiple dilation scales while preserving raw Bragg centroid coordinates via identity skip connections.',
    accentColor: '#6366f1',
    layers: [
      {
        id: 'l1_input',
        index: 1,
        shortName: 'LP-Norm Input',
        fullName: 'Lorentz-Polarization & Background Preprocessor',
        type: 'Signal Normalization',
        tensorShape: '[1, 1, 2048]',
        paramsCount: '0 (Analytical)',
        mathFormula: 'I_corr(2θ) = [I_obs(2θ) - B(2θ)] · (sin²θ cosθ) / (1 + cos²2θ)',
        role: 'Corrects geometric Lorentz-polarization decay and strips amorphous background humps.',
      },
      {
        id: 'l2_stem',
        index: 2,
        shortName: 'Conv1D Stem',
        fullName: 'Caglioti-Matched 1D Convolutional Filter Bank',
        type: 'Conv1D (K=7, F=64)',
        tensorShape: '[1, 64, 1024]',
        paramsCount: '4,544',
        mathFormula: 'A_k(2θ) = GELU(BN(∑_τ W_k(τ) · I_corr(2θ - τ) + b_k))',
        role: 'Convolves Pseudo-Voigt matched filters across 2θ to isolate peak centroids, Kα₁/Kα₂ doublets, and asymmetric tails.',
      },
      {
        id: 'l3_resblock',
        index: 3,
        shortName: 'Dilated ResNet',
        fullName: 'Multi-Scale Dilated Residual Bottleneck (d=1,2,4)',
        type: 'ResBlock × 16',
        tensorShape: '[1, 128, 512]',
        paramsCount: '1,420,800',
        mathFormula: 'h_{l+1} = h_l + ∑_{d∈{1,2,4}} Conv1D_{K=5, d}(h_l)',
        role: 'Couples local peak FWHM broadening with medium-range inter-peak d-spacing intervals without vanishing gradients.',
      },
      {
        id: 'l4_pinn_gate',
        index: 4,
        shortName: 'Extinction Gate',
        fullName: 'Systematic Absence & Symmetry Gating Layer',
        type: 'Physics Gate',
        tensorShape: '[1, 256, 128]',
        paramsCount: '524,288',
        mathFormula: 'G(hkl) = σ(W_sym · h_L) ⊙ exp(-λ_ext · |F_{hkl}^{forbidden}|²)',
        role: 'Suppresses activation channels that violate Bravais centering (I, F, C, R) and screw/glide extinction rules.',
      },
      {
        id: 'l5_latent',
        index: 5,
        shortName: 'Latent z ∈ ℝ¹²⁸',
        fullName: 'Global Pooling & Metric Manifold Embedding',
        type: 'Embedding Bottleneck',
        tensorShape: '[1, 128]',
        paramsCount: '32,896',
        mathFormula: 'z = L2Norm(W_proj · GAP(G) + b_proj),  ||z||_2 = 1',
        role: 'Projects the diffractogram onto a unit hypersphere for cosine similarity retrieval against ICDD/COD reference cards.',
      },
      {
        id: 'l6_heads',
        index: 6,
        shortName: 'Multi-Task Heads',
        fullName: 'Hierarchical Crystal System, Space Group & Phase Heads',
        type: 'Dense Softmax + Reg',
        tensorShape: '[7 Sys, 230 SG, QPA]',
        paramsCount: '498,120',
        mathFormula: 'P(SG_i | z) = P(Sys_k | z) · Softmax(W_{SG} z / T)_i',
        role: 'Simultaneously outputs 7 Crystal System probabilities, 230 Space Group logits, and Rietveld lattice parameters.',
      },
    ],
  },
  xrd_former: {
    id: 'xrd_former',
    name: 'XRD-Former Spectral Transformer',
    shortTag: 'XRD-Former',
    family: 'Multi-Head Self-Attention Vision Transformer (1D)',
    params: '4.12M',
    flops: '34.2 MFLOPs',
    latencyMs: 2.1,
    receptiveField: 'Global 5°–120° 2θ (Full Scan)',
    inductiveBias: 'Long-Range Harmonic Reflection Coupling (100 ↔ 200 ↔ 300)',
    equation: 'Attn(Q,K,V) = Softmax((Q K^T) / √d_k + B_{Bragg}) V',
    description:
      'Tokenizes the diffractogram into spectral patches and computes all-pairs self-attention to link fundamental reflections with higher-order (nh, nk, nl) harmonics across the entire 2θ range.',
    accentColor: '#06b6d4',
    layers: [
      {
        id: 'l1_patch',
        index: 1,
        shortName: 'Patch Tokenizer',
        fullName: '1D Spectral Patch Embedding + Reciprocal q Positional Encoding',
        type: 'PatchProj (P=16)',
        tensorShape: '[1, 128, 128]',
        paramsCount: '16,512',
        mathFormula: 'E_i = W_p x_i + PE(q_i),  q_i = (4π/λ) sin θ_i',
        role: 'Splits the 2θ scan into 128 non-overlapping spectral tokens and injects exact reciprocal wavevector q_i positional encodings.',
      },
      {
        id: 'l2_mhsa_low',
        index: 2,
        shortName: 'Local MHSA (H=8)',
        fullName: 'Multi-Head Self-Attention — Multiplet Deconvolution',
        type: '8-Head Attention',
        tensorShape: '[1, 128, 128]',
        paramsCount: '528,384',
        mathFormula: 'α_{ij}^{(h)} = Softmax_j((q_i W_Q^{(h)})(k_j W_K^{(h)})^T / √16)',
        role: 'Resolves severely overlapping multiphase reflection clusters (e.g., Quartz 26.64° vs Rutile 27.45°).',
      },
      {
        id: 'l3_mhsa_high',
        index: 3,
        shortName: 'Harmonic MHSA',
        fullName: 'Long-Range Bragg Harmonic Cross-Correlation Block',
        type: '8-Head Attention',
        tensorShape: '[1, 128, 128]',
        paramsCount: '1,585,152',
        mathFormula: 'B_{ij} = -γ · min_n |q_i / q_j - √(h_1²+k_1²+l_1²)/√(h_2²+k_2²+l_2²)|',
        role: 'Attends across distant 2θ angles to verify whether low-angle and high-angle peaks share a consistent unit cell.',
      },
      {
        id: 'l4_cross_attn',
        index: 4,
        shortName: 'Dict Cross-Attn',
        fullName: 'Crystallographic Reference Dictionary Cross-Attention',
        type: 'Cross-Attention',
        tensorShape: '[1, 64, 128]',
        paramsCount: '1,052,672',
        mathFormula: 'H_cross = Softmax(Q_{exp} K_{ICDD}^T / √d_k) V_{ICDD}',
        role: 'Queries experimental spectral tokens against learned ICDD/COD phase prototype vectors for multi-phase unmixing.',
      },
      {
        id: 'l5_cls_token',
        index: 5,
        shortName: '[CLS] Pooling',
        fullName: 'LayerNorm & Class Token Aggregation',
        type: 'Token Aggregator',
        tensorShape: '[1, 128]',
        paramsCount: '66,048',
        mathFormula: 'z_{CLS} = LN(h_{CLS}^{(L)} + ∑_i α_i h_i^{(L)})',
        role: 'Consolidates global diffraction symmetry invariants into a single 128-D representation vector.',
      },
      {
        id: 'l6_dirichlet',
        index: 6,
        shortName: 'Simplex QPA Head',
        fullName: 'Dirichlet Simplex Quantitative Phase Analysis & SG Head',
        type: 'Dirichlet + Softmax',
        tensorShape: '[7 Sys, 230 SG, wt%]',
        paramsCount: '871,232',
        mathFormula: 'w_p = α_p / ∑_k α_k,  ∑_p w_p = 100.0 wt%',
        role: 'Predicts strictly normalized multi-phase weight fractions (wt%) alongside space-group probabilities.',
      },
    ],
  },
  pinn_bragg: {
    id: 'pinn_bragg',
    name: 'PINN-BraggNet Physics-Informed Net',
    shortTag: 'PINN-Bragg',
    family: 'Physics-Informed Neural Network with Crystallographic Constraints',
    params: '1.86M',
    flops: '14.1 MFLOPs',
    latencyMs: 0.9,
    receptiveField: 'Physical q-Space Global',
    inductiveBias: 'Hard Bragg Law, Caglioti Dispersion & Space-Group Extinctions',
    equation: 'L_total = L_CE + λ_Bragg ||2d sinθ - λ||² + λ_ext ||F_{forbidden}||² + λ_Cag ||FWHM - β(θ)||²',
    description:
      'Enforces exact physical laws of X-ray diffraction inside neural activation layers so predictions never violate Bragg geometry, systematic absences, or Caglioti peak broadening.',
    accentColor: '#10b981',
    layers: [
      {
        id: 'l1_qmap',
        index: 1,
        shortName: 'q-Space Transform',
        fullName: 'Diffractogram Coordinate Transformation (2θ → q = 4π sinθ / λ)',
        type: 'Coordinate Layer',
        tensorShape: '[1, 2, 2048]',
        paramsCount: '0 (Exact Physics)',
        mathFormula: 'q = (4π / 1.5406) sin(2θ / 2),  s = sinθ / λ = 1 / (2d)',
        role: 'Maps non-linear 2θ angles into linear reciprocal lattice spacing 1/d so periodic reflections become equally spaced.',
      },
      {
        id: 'l2_caglioti',
        index: 2,
        shortName: 'Caglioti Conv1D',
        fullName: 'Angle-Adaptive Caglioti FWHM Convolutional Layer',
        type: 'Physics Conv1D',
        tensorShape: '[1, 64, 1024]',
        paramsCount: '12,480',
        mathFormula: 'FWHM²(θ) = U tan²θ + V tanθ + W + (Kλ / D cosθ)² + (4ε tanθ)²',
        role: 'Dynamically scales kernel width with tanθ and 1/cosθ to separate instrumental resolution from specimen size/strain.',
      },
      {
        id: 'l3_metric_tensor',
        index: 3,
        shortName: 'Metric Tensor G*',
        fullName: 'Reciprocal Metric Tensor Regression Block (G* = [g*_{ij}])',
        type: 'Symmetric Tensor Layer',
        tensorShape: '[1, 6, 256]',
        paramsCount: '412,600',
        mathFormula: '1/d_{hkl}² = h²a*² + k²b*² + l²c*² + 2hka*b*cosγ* + 2hla*c*cosβ* + 2klb*c*cosα*',
        role: 'Estimates the 6 independent components of the reciprocal metric tensor G* directly from peak positions.',
      },
      {
        id: 'l4_extinction',
        index: 4,
        shortName: '230 SG Extinction',
        fullName: 'Structure Factor Systematic Absence Penalty Tensor',
        type: 'PINN Constraint',
        tensorShape: '[1, 230, 64]',
        paramsCount: '684,000',
        mathFormula: 'F_{hkl} = ∑_j f_j(q) exp(2πi(hx_j + ky_j + lz_j)) = 0  for forbidden (hkl)',
        role: 'Computes differentiable penalty masks against all 230 space-group reflection conditions.',
      },
      {
        id: 'l5_wh_decomp',
        index: 5,
        shortName: 'Size-Strain Head',
        fullName: 'Neural Olivero-Longbothum Voigt Deconvolution Bottleneck',
        type: 'Physics Bottleneck',
        tensorShape: '[1, 128]',
        paramsCount: '295,000',
        mathFormula: 'β_G² = β_L · β_total,  D_V = Kλ / (β_L cosθ),  ε = β_G / (4 tanθ)',
        role: 'Disentangles Cauchy nanocrystallite size broadening from Gaussian microstrain lattice disorder.',
      },
      {
        id: 'l6_pinn_out',
        index: 6,
        shortName: 'Constrained Output',
        fullName: 'Thermodynamically & Crystallographically Verified Output Head',
        type: 'PINN Classifier',
        tensorShape: '[7 Sys, 14 Bravais, 230 SG]',
        paramsCount: '455,920',
        mathFormula: 'y_hat = argmin_y [ L_data(y) + λ_phys · R_crystallography(y) ]',
        role: 'Produces physically consistent phase identification, space group, and unit-cell constants (a, b, c, α, β, γ).',
      },
    ],
  },
  crystal_gnn: {
    id: 'crystal_gnn',
    name: 'Crystal-GNN Reciprocal Graph Net',
    shortTag: 'Crystal-GNN',
    family: 'Message-Passing Graph Neural Network on Resolved Reflections',
    params: '1.14M',
    flops: '6.8 MFLOPs',
    latencyMs: 0.6,
    receptiveField: 'All-Pairs Peak Graph G=(V,E)',
    inductiveBias: 'Permutation Invariance & Exact sin²θ_i / sin²θ_j Ratio Indexing',
    equation: 'h_i^{(l+1)} = φ(h_i^{(l)}, ∑_{j∈N(i)} ψ(h_i^{(l)}, h_j^{(l)}, e_{ij}))',
    description:
      'Represents each resolved Bragg peak as a graph node and connects peaks via edge features encoding d-spacing ratios (d_i/d_j) and intensity ratios for direct Bravais indexing.',
    accentColor: '#f59e0b',
    layers: [
      {
        id: 'l1_graph_build',
        index: 1,
        shortName: 'Peak Graph G(V,E)',
        fullName: 'Reciprocal Lattice Peak Node & Ratio Edge Constructor',
        type: 'Graph Builder',
        tensorShape: 'V=[N, 8], E=[N², 6]',
        paramsCount: '2,048',
        mathFormula: 'v_i = [q_i, d_i, I_i, FWHM_i],  e_{ij} = [q_i/q_j, (d_j/d_i)², |Δ2θ_{ij}|]',
        role: 'Constructs a fully connected reflection graph where edges explicitly store sin²θ_i / sin²θ_j indexing ratios.',
      },
      {
        id: 'l2_edge_conv',
        index: 2,
        shortName: 'EdgeConv Layer',
        fullName: 'Dynamic Edge Convolution on Quadratic Bragg Ratios',
        type: 'Message Passing 1',
        tensorShape: 'V=[N, 64], E=[N², 64]',
        paramsCount: '148,480',
        mathFormula: 'm_{ij}^{(1)} = MLP([h_i || h_j - h_i || (q_i/q_j)²])',
        role: 'Identifies integer quadratic sequences (e.g., 1:2:3:4:5:6 for Primitive Cubic vs 2:4:6:8 for BCC vs 3:4:8:11 for FCC).',
      },
      {
        id: 'l3_gat_layer',
        index: 3,
        shortName: 'Graph Attention',
        fullName: 'Multi-Head Graph Attention (GATv2) Phase Subgraph Clustering',
        type: 'GATv2 (4 Heads)',
        tensorShape: 'V=[N, 128]',
        paramsCount: '394,240',
        mathFormula: 'α_{ij} = Softmax_j(a^T LeakyReLU(W [h_i || h_j || e_{ij}]))',
        role: 'Partitions mixed-phase reflection nodes into coherent single-phase subgraphs by down-weighting cross-phase edges.',
      },
      {
        id: 'l4_triplet',
        index: 4,
        shortName: 'Zone-Axis Triplet',
        fullName: '3-Body Reciprocal Vector Triplet Interaction Block',
        type: 'Triplet GNN',
        tensorShape: 'V=[N, 128]',
        paramsCount: '328,700',
        mathFormula: 't_{ijk} = ψ(q_i, q_j, q_k)  checking  q_k ≈ |n_1 q_i ± n_2 q_j|',
        role: 'Verifies 3-reflection zone-axis closure relations in reciprocal space for low-symmetry orthorhombic/monoclinic cells.',
      },
      {
        id: 'l5_readout',
        index: 5,
        shortName: 'Set2Set Readout',
        fullName: 'Intensity-Weighted Permutation-Invariant Graph Readout',
        type: 'Global Readout',
        tensorShape: '[1, 128]',
        paramsCount: '98,304',
        mathFormula: 'z_G = ∑_{i∈V} (I_i / ∑_k I_k) · σ(W_read h_i^{(L)})',
        role: 'Aggregates node embeddings into a global crystal graph descriptor invariant to peak ordering.',
      },
      {
        id: 'l6_gnn_heads',
        index: 6,
        shortName: 'Bravais & (hkl) Head',
        fullName: 'Node-Level (hkl) Miller Indexer & Graph-Level Phase Classifier',
        type: 'Node + Graph Head',
        tensorShape: 'V→(hkl), G→Phase',
        paramsCount: '168,228',
        mathFormula: 'P(hkl_i | h_i),  P(Bravais | z_G),  P(Phase | z_G)',
        role: 'Assigns (hkl) Miller indices to each individual peak node while classifying the overall crystal system.',
      },
    ],
  },
  vae_manifold: {
    id: 'vae_manifold',
    name: 'β-VAE Latent Manifold Autoencoder',
    shortTag: 'β-VAE Manifold',
    family: 'Disentangled Variational Autoencoder & Generative Decoder',
    params: '2.95M',
    flops: '21.6 MFLOPs',
    latencyMs: 1.5,
    receptiveField: 'Continuous Latent z ∈ ℝ³²',
    inductiveBias: 'Disentangled Solid-Solution (Vegard Law) & Defect Manifold',
    equation: 'L_βVAE = E_{q(z|x)}[log p(x|z)] - β · D_KL(q_φ(z|x) || N(0, I))',
    description:
      'Encodes diffractograms into a probabilistic Gaussian latent space (μ, σ) where orthogonal latent axes correspond to unit-cell volume, crystallite size, and doping fraction.',
    accentColor: '#a855f7',
    layers: [
      {
        id: 'l1_enc_conv',
        index: 1,
        shortName: 'Strided Encoder',
        fullName: '1D Strided Convolutional Spectral Encoder',
        type: 'Conv1D Downsample',
        tensorShape: '[1, 64, 512]',
        paramsCount: '184,320',
        mathFormula: 'h_enc = SiLU(GroupNorm(Conv1D_{stride=4}(I_obs)))',
        role: 'Compresses the 2048-channel diffractogram into compact spectral feature maps.',
      },
      {
        id: 'l2_posterior',
        index: 2,
        shortName: 'Gaussian q(z|x)',
        fullName: 'Variational Posterior Mean (μ) & Log-Variance (log σ²) Head',
        type: 'Probabilistic Bottleneck',
        tensorShape: 'μ∈ℝ³², σ∈ℝ³²',
        paramsCount: '524,288',
        mathFormula: 'μ_z = W_μ h_enc,  log σ_z² = W_σ h_enc',
        role: 'Parameterizes the epistemic uncertainty ellipsoid of the crystal structure in latent space.',
      },
      {
        id: 'l3_reparam',
        index: 3,
        shortName: 'z = μ + σ⊙ε',
        fullName: 'Stochastic Reparameterization & Disentangled Axis Projection',
        type: 'Reparameterization',
        tensorShape: '[1, 32]',
        paramsCount: '0 (Stochastic)',
        mathFormula: 'z = μ_z + exp(0.5 · log σ_z²) ⊙ ε,  ε ~ N(0, I)',
        role: 'Enables backpropagation through random sampling; aligns z_1 with lattice parameter a and z_2 with c/a ratio.',
      },
      {
        id: 'l4_vegard',
        index: 4,
        shortName: 'Vegard Geodesic',
        fullName: 'Solid-Solution Linear Geodesic Interpolator',
        type: 'Manifold Operator',
        tensorShape: '[1, 128]',
        paramsCount: '131,072',
        mathFormula: 'z_{alloy}(x) = (1 - x) z_{PhaseA} + x z_{PhaseB},  a(x) = (1-x)a_A + x a_B',
        role: 'Models continuous peak shifts in doped solid solutions (e.g., Ti_{1-x}Zr_xO_2 or LiNi_xMn_yCo_zO_2).',
      },
      {
        id: 'l5_dec_deconv',
        index: 5,
        shortName: 'Spectral Decoder',
        fullName: 'Transposed Conv1D Diffractogram Reconstruction Decoder',
        type: 'ConvTranspose1D',
        tensorShape: '[1, 1, 2048]',
        paramsCount: '1,640,000',
        mathFormula: 'I_recon(2θ) = Softplus(Deconv1D(z))',
        role: 'Reconstructs a noise-free theoretical diffractogram from the latent vector z to measure anomaly reconstruction error.',
      },
      {
        id: 'l6_ood_head',
        index: 6,
        shortName: 'Phase + OOD Head',
        fullName: 'Phase Classifier & Out-of-Distribution (ELBO) Impurity Detector',
        type: 'ELBO + Softmax',
        tensorShape: '[Phase, ELBO, R_wp]',
        paramsCount: '470,320',
        mathFormula: 'AnomalyScore = ||I_obs - I_recon||_2² + β ∑_j (1 + log σ_j² - μ_j² - σ_j²)',
        role: 'Flags unindexed impurity peaks or amorphous secondary phases via high reconstruction residual.',
      },
    ],
  },
};

const CRYSTAL_SYSTEMS_LIST = [
  { id: 'Cubic', short: 'Cub', symmetry: 'a = b = c, α = β = γ = 90°', sgRange: '195–230', color: '#10b981' },
  { id: 'Tetragonal', short: 'Tet', symmetry: 'a = b ≠ c, α = β = γ = 90°', sgRange: '75–142', color: '#6366f1' },
  { id: 'Hexagonal', short: 'Hex', symmetry: 'a = b ≠ c, α = β = 90°, γ = 120°', sgRange: '168–194', color: '#06b6d4' },
  { id: 'Trigonal', short: 'Trig', symmetry: 'a = b ≠ c (Hex) / a=b=c, α≠90° (R)', sgRange: '143–167', color: '#8b5cf6' },
  { id: 'Orthorhombic', short: 'Orth', symmetry: 'a ≠ b ≠ c, α = β = γ = 90°', sgRange: '16–74', color: '#f59e0b' },
  { id: 'Monoclinic', short: 'Mono', symmetry: 'a ≠ b ≠ c, α = γ = 90° ≠ β', sgRange: '3–15', color: '#ec4899' },
  { id: 'Triclinic', short: 'Tric', symmetry: 'a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90°', sgRange: '1–2', color: '#f43f5e' },
];

export const NeuralNetworkWorkbench: React.FC<NeuralNetworkWorkbenchProps> = ({
  parsedPoints,
  selectedCandidate,
  candidates,
  engineConfig,
  onUpdateEngineConfig,
  onTriggerPhaseID,
  onLoadPatternData,
  onOpenMLStudioTab,
  onOpenPDF2Database,
  isSimulating = false,
}) => {
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<
    'pdf2_sync' | 'layer_probe' | 'symmetry_heads' | 'gradcam_ensemble' | 'backprop_latent'
  >('pdf2_sync');
  const [selectedArchId, setSelectedArchId] = useState<NeuralArchId>('pinn_bragg');
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(2);
  const [selectedFilterChannel, setSelectedFilterChannel] = useState<number>(1);
  const [isForwardAnimating, setIsForwardAnimating] = useState<boolean>(false);
  const [forwardStepLayer, setForwardStepLayer] = useState<number | null>(null);
  const [selectedGradCamPeakIdx, setSelectedGradCamPeakIdx] = useState<number>(0);
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string>('quartz_rutile');

  // Interactive Ablation & Adversarial Stress Sandbox State
  const [ablationSkipLinks, setAblationSkipLinks] = useState<boolean>(true);
  const [ablationSelfAttn, setAblationSelfAttn] = useState<boolean>(true);
  const [ablationPinnLoss, setAblationPinnLoss] = useState<boolean>(true);
  const [ablationLorentzPol, setAblationLorentzPol] = useState<boolean>(true);
  const [stressStrainShiftDeg, setStressStrainShiftDeg] = useState<number>(0.0);
  const [stressNoisePct, setStressNoisePct] = useState<number>(4);
  const [textureMarchDollase, setTextureMarchDollase] = useState<number>(1.0); // 0.55 to 1.45
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0); // -0.15° to +0.15°
  const [vegardFraction, setVegardFraction] = useState<number>(0.35);

  // Tab 5: Live Backprop & Latent Manifold State
  const [bpOptimizer, setBpOptimizer] = useState<'AdamW' | 'Lion' | 'SGD_Mom' | 'SAM'>('AdamW');
  const [bpPinnLambda, setBpPinnLambda] = useState<number>(0.35);
  const [bpEpoch, setBpEpoch] = useState<number>(30);
  const [isRunningBackprop, setIsRunningBackprop] = useState<boolean>(false);
  const [copiedPytorch, setCopiedPytorch] = useState<boolean>(false);

  // Bragg Diffractometer Sync State
  const [braggSyncSummary, setBraggSyncSummary] = useState<{
    available: boolean;
    materialName: string;
    crystalSystem: string;
    peakCount: number;
    patternStr: string;
  }>({
    available: false,
    materialName: '',
    crystalSystem: '',
    peakCount: 0,
    patternStr: '',
  });
  const [syncFlash, setSyncFlash] = useState<boolean>(false);

  const checkBraggLocalStorage = () => {
    try {
      const raw = localStorage.getItem('xrd_bragg_current');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.results) && parsed.results.length > 0) {
        const lines = parsed.results
          .filter((r: any) => typeof r.twoTheta === 'number' && !isNaN(r.twoTheta))
          .map((r: any) => {
            const intVal = typeof r.intensity === 'number' ? r.intensity : 80;
            const hklStr = r.hkl ? ` (${r.hkl})` : '';
            return `${Number(r.twoTheta).toFixed(3)}, ${Number(intVal).toFixed(1)}${hklStr}`;
          });
        if (lines.length > 0) {
          setBraggSyncSummary({
            available: true,
            materialName: parsed.materialName || parsed.sampleId || 'Bragg Diffractometer Scan',
            crystalSystem: parsed.crystalSystem || 'Cubic',
            peakCount: lines.length,
            patternStr: lines.join('\n'),
          });
        }
      }
    } catch (e) {
      // ignore storage errors
    }
  };

  // Live ICDD PDF-2 <-> Neural Network Dictionary Sync & Fine-Tuning State
  const [pdf2DbVersion, setPdf2DbVersion] = useState<number>(0);
  const [pdf2SyncMeta, setPdf2SyncMeta] = useState(() => getLastPDF2NeuralSyncMetadata(215));
  const [pdf2SubfileScope, setPdf2SubfileScope] = useState<string>('ALL');
  const [isFineTuningPDF2, setIsFineTuningPDF2] = useState<boolean>(false);
  const [fineTuneEpoch, setFineTuneEpoch] = useState<number>(25);
  const [fineTuneAccuracy, setFineTuneAccuracy] = useState<number>(98.4);
  const [fineTuneLoss, setFineTuneLoss] = useState<number>(0.024);

  useEffect(() => {
    checkBraggLocalStorage();
    const handleFocus = () => checkBraggLocalStorage();
    const handlePdf2Updated = () => {
      setPdf2DbVersion((v) => v + 1);
      setPdf2SyncMeta(getLastPDF2NeuralSyncMetadata());
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('xrd-pdf2-db-updated', handlePdf2Updated);
    window.addEventListener('material-learned', handlePdf2Updated);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('xrd-pdf2-db-updated', handlePdf2Updated);
      window.removeEventListener('material-learned', handlePdf2Updated);
    };
  }, []);

  const activePDF2Dictionary = useMemo(() => {
    const built = buildFullPDF2Database();
    if (pdf2SubfileScope === 'ALL') return built;
    return built.filter(
      (c) =>
        c.subfileCodes.some((s) => s.toLowerCase().includes(pdf2SubfileScope.toLowerCase())) ||
        c.category.toLowerCase().includes(pdf2SubfileScope.toLowerCase())
    );
  }, [pdf2DbVersion, pdf2SubfileScope]);

  const topPDF2NeuralMatches = useMemo(() => {
    const defaultScan =
      parsedPoints.length > 0
        ? parsedPoints
        : [
            { twoTheta: 20.86, intensity: 22 },
            { twoTheta: 26.64, intensity: 100 },
            { twoTheta: 36.54, intensity: 7 },
            { twoTheta: 39.46, intensity: 7 },
            { twoTheta: 50.14, intensity: 14 },
            { twoTheta: 59.96, intensity: 9 },
          ];
    const totalShift = stressStrainShiftDeg + zeroShiftDeg;
    const shiftedScan = defaultScan.map((p, idx) => ({
      twoTheta: p.twoTheta + totalShift,
      intensity: Math.max(
        2,
        p.intensity * (idx === 1 ? Math.pow(textureMarchDollase, -0.65) : 1.0)
      ),
    }));
    return matchScanAgainstPDF2Database(
      shiftedScan,
      activePDF2Dictionary.length > 0 ? activePDF2Dictionary : undefined,
      4
    );
  }, [parsedPoints, activePDF2Dictionary, stressStrainShiftDeg, zeroShiftDeg, textureMarchDollase]);

  const handleFineTuneNeuralNetOnPDF2 = () => {
    if (isFineTuningPDF2) return;
    setIsFineTuningPDF2(true);
    setFineTuneEpoch(1);
    playSynthTone('switch');

    let ep = 1;
    const timer = setInterval(() => {
      ep += 4;
      if (ep <= 25) {
        setFineTuneEpoch(ep);
        const progress = ep / 25;
        setFineTuneAccuracy(Number((91.2 + progress * 7.6).toFixed(2)));
        setFineTuneLoss(Number((0.185 * Math.exp(-progress * 2.1)).toFixed(4)));
      } else {
        clearInterval(timer);
        setFineTuneEpoch(25);
        setFineTuneAccuracy(98.9);
        setFineTuneLoss(0.019);
        setIsFineTuningPDF2(false);
        const meta = syncPDF2DatabaseWithNeuralNet({
          subfileFilter: pdf2SubfileScope,
          cards: activePDF2Dictionary,
        });
        setPdf2SyncMeta(meta);
        onTriggerPhaseID();
        playSynthTone('success');
      }
    }, 110);
  };

  const handleInstallAllPDF2PacksFromNeural = () => {
    installPDF2SubfilePackToLocalDB(CURATED_PDF2_SUBFILE_PACKS.map((p) => p.id));
    setPdf2DbVersion((v) => v + 1);
    const allBuilt = buildFullPDF2Database();
    const meta = syncPDF2DatabaseWithNeuralNet({
      subfileFilter: 'All 4 ICDD Subfiles',
      cards: allBuilt,
    });
    setPdf2SyncMeta(meta);
    playSynthTone('success');
  };

  const handleLoadPDF2CardIntoNeuralScan = (card: PDF2CardRecord) => {
    const lines = card.reflections.map(
      (r) => `${r.twoTheta.toFixed(3)}, ${r.intensity.toFixed(1)}, ${r.h}, ${r.k}, ${r.l}`
    );
    onLoadPatternData(lines.join('\n'), `[PDF ${card.pdfCardNumber}] ${card.name} (${card.formula})`);
    playSynthTone('success');
  };

  const handleSyncFromBragg = () => {
    if (!braggSyncSummary.available || !braggSyncSummary.patternStr) return;
    onLoadPatternData(braggSyncSummary.patternStr, braggSyncSummary.materialName);
    setSyncFlash(true);
    playSynthTone('success');
    setTimeout(() => setSyncFlash(false), 2000);
  };

  const activeArch = NEURAL_ARCHITECTURES[selectedArchId];
  const activeLayer =
    activeArch.layers.find((l) => l.index === selectedLayerIndex) || activeArch.layers[0];

  const runForwardPropagationTrace = () => {
    if (isForwardAnimating) return;
    setActiveWorkbenchTab('layer_probe');
    setIsForwardAnimating(true);
    setForwardStepLayer(1);
    setSelectedLayerIndex(1);
    playSynthTone('switch');

    let step = 1;
    const timer = setInterval(() => {
      step++;
      if (step <= 6) {
        setForwardStepLayer(step);
        setSelectedLayerIndex(step);
        playSynthTone('tick');
      } else {
        clearInterval(timer);
        setForwardStepLayer(null);
        setIsForwardAnimating(false);
        playSynthTone('success');
      }
    }, 480);
  };

  const runLiveBackpropSimulation = () => {
    if (isRunningBackprop) return;
    setIsRunningBackprop(true);
    setBpEpoch(1);
    playSynthTone('switch');

    let ep = 1;
    const timer = setInterval(() => {
      ep += 2;
      if (ep <= 30) {
        setBpEpoch(ep);
      } else {
        clearInterval(timer);
        setBpEpoch(30);
        setIsRunningBackprop(false);
        playSynthTone('success');
      }
    }, 85);
  };

  // Compute live Layer Activation Waveform & Filter Response from parsedPoints
  const layerActivationTelemetry = useMemo(() => {
    const peaks =
      parsedPoints.length > 0
        ? [...parsedPoints].sort((a, b) => a.twoTheta - b.twoTheta)
        : [
            { twoTheta: 20.85, intensity: 35, hkl: '100' },
            { twoTheta: 26.64, intensity: 100, hkl: '101' },
            { twoTheta: 36.54, intensity: 18, hkl: '110' },
            { twoTheta: 39.46, intensity: 15, hkl: '102' },
            { twoTheta: 50.14, intensity: 28, hkl: '112' },
            { twoTheta: 59.96, intensity: 20, hkl: '211' },
            { twoTheta: 68.14, intensity: 14, hkl: '203' },
          ];

    const numBins = 96;
    const minT = 15;
    const maxT = 85;
    const stepT = (maxT - minT) / (numBins - 1);

    const rawSignal: number[] = [];
    const layerSignal: number[] = [];
    const attentionEnvelope: number[] = [];
    const totalShift = stressStrainShiftDeg + zeroShiftDeg;

    for (let i = 0; i < numBins; i++) {
      const t = minT + i * stepT;
      const shiftedT = t - totalShift;
      let val = 0;

      for (let pIdx = 0; pIdx < peaks.length; pIdx++) {
        const pk = peaks[pIdx];
        const diff = shiftedT - pk.twoTheta;
        const sigma = 0.45 + (engineConfig.kernelSize - 3) * 0.06;
        const g = Math.exp(-(diff * diff) / (2 * sigma * sigma));
        const l = 1 / (1 + (diff * diff) / (sigma * sigma));
        const texMod = pIdx === 1 ? Math.pow(textureMarchDollase, -0.6) : 1.0;
        val += ((pk.intensity * texMod) / 100) * (0.5 * g + 0.5 * l);
      }

      const noise =
        (Math.sin(i * 19.3 + selectedFilterChannel * 7.1) * 0.5 + 0.5) *
        (stressNoisePct / 100) *
        0.25;
      const rawVal = Math.min(1.0, Math.max(0.02, val + noise));
      rawSignal.push(rawVal);

      const thetaRad = ((t / 2) * Math.PI) / 180;
      const lpFactor = ablationLorentzPol
        ? (1 + Math.pow(Math.cos(2 * thetaRad), 2)) /
          Math.max(0.15, Math.pow(Math.sin(thetaRad), 2) * Math.cos(thetaRad))
        : 1.0;
      const normLp = Math.min(1.35, Math.max(0.5, lpFactor * 0.22));

      let act = rawVal;
      if (selectedLayerIndex === 1) {
        act = Math.min(1.0, rawVal * normLp);
      } else if (selectedLayerIndex === 2) {
        if (selectedFilterChannel === 1) {
          act = Math.pow(rawVal, 1.35);
        } else if (selectedFilterChannel === 2) {
          act = Math.min(1.0, Math.abs(rawVal - 0.35 * Math.sin(i * 0.4)) * 1.15);
        } else if (selectedFilterChannel === 3) {
          act = Math.min(1.0, rawVal * (0.65 + 0.35 * Math.cos(i * 1.2)));
        } else {
          act = Math.min(
            1.0,
            rawVal * (0.75 + 0.25 * Math.sin(i * 0.3 + selectedFilterChannel))
          );
        }
      } else if (selectedLayerIndex === 3) {
        const harmonicBoost = ablationSelfAttn ? 0.18 * Math.pow(rawVal, 0.7) : 0;
        const skipBoost = ablationSkipLinks ? 0.15 * rawVal : -0.08;
        act = Math.min(1.0, Math.max(0.02, Math.pow(rawVal, 0.85) + harmonicBoost + skipBoost));
      } else if (selectedLayerIndex === 4) {
        const extinctionGate = ablationPinnLoss
          ? rawVal > 0.18
            ? Math.min(1.0, rawVal * 1.18)
            : rawVal * 0.15
          : rawVal * 0.85;
        act = extinctionGate;
      } else if (selectedLayerIndex === 5) {
        const latentCoord =
          0.5 +
          0.45 *
            Math.sin(i * 0.28 + selectedFilterChannel * 0.9) *
            Math.cos(i * 0.11 - rawVal * 3.14);
        act = Math.min(1.0, Math.max(0.05, latentCoord));
      } else {
        act = rawVal > 0.25 ? Math.min(1.0, Math.pow(rawVal, 0.65) * 1.1) : rawVal * 0.2;
      }

      layerSignal.push(Number(act.toFixed(3)));
      attentionEnvelope.push(
        Number(Math.min(1.0, Math.pow(rawVal, 0.75) * (ablationSelfAttn ? 1.05 : 0.7)).toFixed(3))
      );
    }

    const l2Norm = Math.sqrt(layerSignal.reduce((s, v) => s + v * v, 0)).toFixed(2);
    const activeFraction = (
      (layerSignal.filter((v) => v > 0.2).length / layerSignal.length) *
      100
    ).toFixed(1);
    const maxActivation = Math.max(...layerSignal).toFixed(3);

    return {
      numBins,
      minT,
      maxT,
      stepT,
      rawSignal,
      layerSignal,
      attentionEnvelope,
      l2Norm,
      activeFraction,
      maxActivation,
    };
  }, [
    parsedPoints,
    selectedLayerIndex,
    selectedFilterChannel,
    engineConfig.kernelSize,
    stressStrainShiftDeg,
    zeroShiftDeg,
    textureMarchDollase,
    stressNoisePct,
    ablationSkipLinks,
    ablationSelfAttn,
    ablationPinnLoss,
    ablationLorentzPol,
  ]);

  // Hierarchical Crystallographic Predictions (7 Crystal Systems + Bravais Extinction + Neural Rietveld + Dirichlet QPA)
  const crystallographicInference = useMemo(() => {
    const peaks =
      parsedPoints.length > 0
        ? [...parsedPoints].sort((a, b) => a.twoTheta - b.twoTheta)
        : [
            { twoTheta: 20.85, intensity: 35, fwhm: 0.22 },
            { twoTheta: 26.64, intensity: 100, fwhm: 0.22 },
            { twoTheta: 36.54, intensity: 18, fwhm: 0.24 },
            { twoTheta: 39.46, intensity: 15, fwhm: 0.25 },
            { twoTheta: 50.14, intensity: 28, fwhm: 0.26 },
            { twoTheta: 59.96, intensity: 20, fwhm: 0.28 },
          ];

    const totalShift = stressStrainShiftDeg + zeroShiftDeg;
    const sinSqValues = peaks.slice(0, 8).map((p) => {
      const rad = (((p.twoTheta + totalShift) / 2) * Math.PI) / 180;
      return Math.pow(Math.sin(rad), 2);
    });
    const baseSinSq = sinSqValues[0] || 0.03;
    const qSqRatios = sinSqValues.map((s) => Number((s / baseSinSq).toFixed(3)));

    const presetMatch = NEURAL_BENCHMARK_PRESETS.find((b) => b.id === activeBenchmarkId);
    const candSys = selectedCandidate?.crystalSystem || presetMatch?.crystalSystem || 'Trigonal';
    const texturePenalty = Math.abs(textureMarchDollase - 1.0) * 8.5;

    const ablationBonus =
      (ablationSkipLinks ? 3.2 : -4.5) +
      (ablationSelfAttn ? 3.8 : -5.0) +
      (ablationPinnLoss ? 4.4 : -6.2) +
      (ablationLorentzPol ? 2.1 : -2.8) -
      Math.abs(totalShift) * 14.0 -
      stressNoisePct * 0.35 -
      texturePenalty;

    const rawSystemScores = CRYSTAL_SYSTEMS_LIST.map((sys) => {
      const isPrimary = candSys.toLowerCase().includes(sys.id.toLowerCase());
      const isSecondary =
        (candSys.toLowerCase().includes('trigonal') && sys.id === 'Hexagonal') ||
        (candSys.toLowerCase().includes('hexagonal') && sys.id === 'Trigonal') ||
        (candSys.toLowerCase().includes('cubic') && sys.id === 'Tetragonal') ||
        (candSys.toLowerCase().includes('tetragonal') && sys.id === 'Orthorhombic');

      let score = isPrimary ? 86.5 + ablationBonus : isSecondary ? 8.4 : 1.2;
      if (selectedArchId === 'pinn_bragg' && isPrimary) score += 2.4;
      if (selectedArchId === 'xrd_former' && isPrimary) score += 1.9;
      return Math.max(0.4, score);
    });

    const sumScores = rawSystemScores.reduce((a, b) => a + b, 0) || 1;
    const systemProbabilities = CRYSTAL_SYSTEMS_LIST.map((sys, idx) => {
      const prob = Number(((rawSystemScores[idx] / sumScores) * 100).toFixed(1));
      const uncertainty = Number(
        Math.max(0.4, (100 - prob) * 0.035 + stressNoisePct * 0.08).toFixed(2)
      );
      return {
        ...sys,
        probability: prob,
        uncertainty,
      };
    }).sort((a, b) => b.probability - a.probability);

    const shannonEntropy = Number(
      systemProbabilities
        .reduce((acc, s) => {
          const p = Math.max(1e-5, s.probability / 100);
          return acc - p * Math.log2(p);
        }, 0)
        .toFixed(3)
    );

    const sgString = selectedCandidate?.spaceGroup || 'P 32 2 1 (#154)';
    const firstChar = sgString.trim().charAt(0).toUpperCase();
    const activeCentering = ['P', 'I', 'F', 'C', 'R'].includes(firstChar) ? firstChar : 'P';

    const bravaisConditions = [
      {
        symbol: 'P',
        name: 'Primitive',
        rule: 'No integral restriction (all h,k,l allowed)',
        ratioPattern: '1 : 2 : 3 : 4 : 5 : 6',
        status: activeCentering === 'P' ? 'MATCHED' : 'COMPATIBLE',
        score: activeCentering === 'P' ? 98.4 : 42.0,
      },
      {
        symbol: 'I',
        name: 'Body-Centered',
        rule: 'h + k + l = 2n (odd sum systematically absent)',
        ratioPattern: '2 : 4 : 6 : 8 : 10 : 12',
        status: activeCentering === 'I' ? 'MATCHED' : 'EXTINCT',
        score: activeCentering === 'I' ? 97.8 : 11.5,
      },
      {
        symbol: 'F',
        name: 'Face-Centered',
        rule: 'h, k, l all even or all odd (mixed parity forbidden)',
        ratioPattern: '3 : 4 : 8 : 11 : 12 : 16',
        status: activeCentering === 'F' ? 'MATCHED' : 'EXTINCT',
        score: activeCentering === 'F' ? 99.1 : 8.2,
      },
      {
        symbol: 'R',
        name: 'Rhombohedral (Obverse)',
        rule: '-h + k + l = 3n',
        ratioPattern: 'Hexagonal / Trigonal sub-lattice',
        status: activeCentering === 'R' ? 'MATCHED' : 'EXTINCT',
        score: activeCentering === 'R' ? 96.5 : 14.0,
      },
      {
        symbol: 'C',
        name: 'Base-Centered',
        rule: 'h + k = 2n',
        ratioPattern: 'Ortho / Monoclinic c-face',
        status: activeCentering === 'C' ? 'MATCHED' : 'EXTINCT',
        score: activeCentering === 'C' ? 95.2 : 16.4,
      },
    ];

    const firstPeakT = (peaks[0]?.twoTheta || 26.64) + totalShift;
    const thetaRad = ((firstPeakT / 2) * Math.PI) / 180;
    const d1 = 1.5406 / (2 * Math.max(0.05, Math.sin(thetaRad)));
    const estLatticeA = selectedCandidate?.latticeParams?.a
      ? Number((selectedCandidate.latticeParams.a * (1 - totalShift * 0.012)).toFixed(4))
      : Number((d1 * Math.sqrt(3)).toFixed(4));

    const avgFwhm =
      peaks.reduce((s, p) => s + (p.fwhm || 0.22), 0) / Math.max(1, peaks.length);
    const betaRad = (Math.max(0.08, avgFwhm - 0.05) * Math.PI) / 180;
    const neuralDomainSizeNm = Number(
      Math.min(180, Math.max(4.5, (0.94 * 0.15406) / (betaRad * Math.cos(thetaRad)))).toFixed(1)
    );
    const neuralMicrostrainPct = Number(
      (
        Math.abs(stressStrainShiftDeg) * 0.35 +
        (avgFwhm * 0.18) / Math.max(0.2, 4 * Math.tan(thetaRad))
      ).toFixed(3)
    );
    const neuralRwp = Number(
      Math.max(
        1.15,
        2.1 +
          stressNoisePct * 0.18 +
          Math.abs(totalShift) * 6.5 +
          Math.abs(textureMarchDollase - 1.0) * 4.2 -
          (ablationPinnLoss ? 0.65 : 0) -
          (ablationSelfAttn ? 0.45 : 0)
      ).toFixed(2)
    );

    // Dirichlet Simplex 3-Component QPA Unmixing
    const rawW1 = Math.max(45, 76.4 - Math.abs(textureMarchDollase - 1.0) * 18 - stressNoisePct * 0.4);
    const rawWAmorph = Math.min(28, 3.2 + stressNoisePct * 0.55);
    const rawW2 = Math.max(2, 100 - rawW1 - rawWAmorph);

    return {
      qSqRatios,
      systemProbabilities,
      shannonEntropy,
      activeCentering,
      sgString,
      bravaisConditions,
      estLatticeA,
      neuralDomainSizeNm,
      neuralMicrostrainPct,
      neuralRwp,
      dirichletQpa: {
        primaryWt: Number(rawW1.toFixed(1)),
        secondaryWt: Number(rawW2.toFixed(1)),
        amorphousWt: Number(rawWAmorph.toFixed(1)),
      },
    };
  }, [
    parsedPoints,
    selectedCandidate,
    activeBenchmarkId,
    selectedArchId,
    ablationSkipLinks,
    ablationSelfAttn,
    ablationPinnLoss,
    ablationLorentzPol,
    stressStrainShiftDeg,
    zeroShiftDeg,
    textureMarchDollase,
    stressNoisePct,
  ]);

  // Tab 5: Live Backprop Trajectory & UMAP Latent Coordinates
  const backpropTelemetry = useMemo(() => {
    const optSpeed =
      bpOptimizer === 'Lion'
        ? 0.145
        : bpOptimizer === 'SAM'
          ? 0.125
          : bpOptimizer === 'AdamW'
            ? 0.132
            : 0.095;
    const epochs: Array<{
      ep: number;
      ceLoss: number;
      pinnLoss: number;
      totalLoss: number;
      valAcc: number;
      theta1: number;
      theta2: number;
    }> = [];

    for (let e = 1; e <= bpEpoch; e++) {
      const ce = 1.65 * Math.exp(-optSpeed * e) + 0.028;
      const pinn = (0.85 * Math.exp(-optSpeed * 1.15 * e) + 0.012) * bpPinnLambda;
      const total = ce + pinn;
      const acc = Math.min(
        99.4,
        54.0 + 44.8 * (1 - Math.exp(-optSpeed * 1.08 * e)) + (bpPinnLambda > 0.1 ? 0.6 : -1.2)
      );
      const progress = e / 30;
      const theta1 = 18 + progress * 142 + Math.sin(e * 0.7) * (1 - progress) * 18;
      const theta2 = 148 - progress * 108 - Math.cos(e * 0.6) * (1 - progress) * 16;
      epochs.push({
        ep: e,
        ceLoss: Number(ce.toFixed(4)),
        pinnLoss: Number(pinn.toFixed(4)),
        totalLoss: Number(total.toFixed(4)),
        valAcc: Number(acc.toFixed(2)),
        theta1,
        theta2,
      });
    }
    return epochs;
  }, [bpEpoch, bpOptimizer, bpPinnLambda]);

  const navigateToModule = (moduleId: string) => {
    playSynthTone('switch');
    window.dispatchEvent(new CustomEvent('xrd-change-module', { detail: moduleId }));
  };

  const generatePyTorchSnippet = () => {
    return `import torch
import torch.nn as nn
import torch.nn.functional as F

class ${activeArch.shortTag.replace(/[^a-zA-Z0-9]/g, '')}CrystallographyNet(nn.Module):
    """
    Architecture: ${activeArch.name} (${activeArch.params} params, ${activeArch.flops})
    Inductive Bias: ${activeArch.inductiveBias}
    Governing Law: ${activeArch.equation}
    """
    def __init__(self, in_bins: int = 2048, latent_dim: int = 128, num_sg: int = 230):
        super().__init__()
        self.stem = nn.Conv1d(1, ${engineConfig.filters}, kernel_size=${engineConfig.kernelSize}, padding=${Math.floor(engineConfig.kernelSize / 2)})
        self.bn1 = nn.BatchNorm1d(${engineConfig.filters})
        self.dilated_block = nn.ModuleList([
            nn.Conv1d(${engineConfig.filters}, ${engineConfig.filters}, kernel_size=5, dilation=d, padding=2*d)
            for d in (1, 2, 4)
        ])
        self.proj = nn.Linear(${engineConfig.filters}, latent_dim)
        self.sys_head = nn.Linear(latent_dim, 7)      # 7 Crystal Systems
        self.sg_head = nn.Linear(latent_dim, num_sg)  # 230 Space Groups
        self.qpa_head = nn.Linear(latent_dim, 3)      # Dirichlet Simplex (wt%)

    def forward(self, x: torch.Tensor):
        h = F.gelu(self.bn1(self.stem(x)))
        res = sum(conv(h) for conv in self.dilated_block) / 3.0
        h = h + res if ${ablationSkipLinks ? 'True' : 'False'} else res
        z = F.normalize(self.proj(h.mean(dim=-1)), p=2, dim=-1)
        alpha_qpa = F.softplus(self.qpa_head(z)) + 1.0
        wt_simplex = alpha_qpa / alpha_qpa.sum(dim=-1, keepdim=True)
        return {
            "latent_z": z,
            "crystal_system_logits": self.sys_head(z),
            "space_group_logits": self.sg_head(z),
            "dirichlet_wt_fraction": wt_simplex,
        }
`;
  };

  const handleCopyPyTorch = () => {
    navigator.clipboard.writeText(generatePyTorchSnippet());
    setCopiedPytorch(true);
    playSynthTone('success');
    setTimeout(() => setCopiedPytorch(false), 2000);
  };

  const isPerturbed =
    Math.abs(stressStrainShiftDeg) > 0.05 ||
    Math.abs(zeroShiftDeg) > 0.02 ||
    stressNoisePct > 10 ||
    Math.abs(textureMarchDollase - 1.0) > 0.1;

  return (
    <div className="space-y-4">
      {/* INTERACTIVE 3-MODE NEURAL CRYSTALLOGRAPHY CAD SCHEMATIC */}
      <NeuralNetCadSchematic
        selectedArchId={selectedArchId}
        onSelectArch={(id) => {
          setSelectedArchId(id);
          playSynthTone('switch');
        }}
        kernelSize={engineConfig.kernelSize}
        onUpdateKernelSize={(k) => onUpdateEngineConfig({ ...engineConfig, kernelSize: k })}
        ablationSkipLinks={ablationSkipLinks}
        onToggleSkipLinks={() => setAblationSkipLinks(!ablationSkipLinks)}
        ablationPinnLoss={ablationPinnLoss}
        onTogglePinnLoss={() => setAblationPinnLoss(!ablationPinnLoss)}
        stressStrainShiftDeg={stressStrainShiftDeg}
        onUpdateStrainShift={(v) => setStressStrainShiftDeg(v)}
        vegardFraction={vegardFraction}
        onUpdateVegardFraction={(v) => setVegardFraction(v)}
      />

      {/* MAIN NEURAL NETWORK WORKSTATION FRAME */}
      <div className="bg-[#070A12] border border-slate-800 rounded-sm overflow-hidden text-slate-100">
        {/* 1. TOP TELEMETRY & BENCHMARK PRESET RIBBON (Zero-Pill Discipline) */}
        <div className="px-4 py-3 bg-[#0B0F19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                [NN-CORE // PHYSICS-INFORMED NEURAL CRYSTALLOGRAPHY WORKBENCH]
              </span>
              <span
                className={`text-xs font-mono font-bold uppercase ${
                  isPerturbed ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {isPerturbed
                  ? `▲ PERTURBED (Δ2θ=${(stressStrainShiftDeg + zeroShiftDeg).toFixed(2)}° · Noise=${stressNoisePct}%)`
                  : `● NOMINAL (${activeArch.shortTag} · ${activeArch.params})`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-architecture spectral inference, layer-by-layer receptive field oscilloscope, Bravais extinction gating, and live backpropagation
            </p>
          </div>

          {/* Right Action Controls: Bragg Sync, Forward Pass Trace, Run Inference */}
          <div className="flex flex-wrap items-center gap-2">
            {braggSyncSummary.available && (
              <button
                onClick={handleSyncFromBragg}
                className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  syncFlash
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                }`}
                title={`Import ${braggSyncSummary.peakCount} reflections from Bragg Diffractometer (${braggSyncSummary.materialName})`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {syncFlash
                    ? 'Synced Bragg Peaks!'
                    : `Sync Bragg (${braggSyncSummary.peakCount} pks)`}
                </span>
              </button>
            )}

            <button
              onClick={runForwardPropagationTrace}
              disabled={isForwardAnimating}
              className="px-3 py-1.5 rounded-sm bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Animate signal propagation step-by-step from Layer 1 to Layer 6"
            >
              <Play className={`w-3.5 h-3.5 ${isForwardAnimating ? 'animate-spin' : ''}`} />
              <span>
                {isForwardAnimating
                  ? `Tracing Layer L${forwardStepLayer}/6...`
                  : 'Trace Forward Pass'}
              </span>
            </button>

            <button
              onClick={onTriggerPhaseID}
              disabled={isSimulating}
              className="px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSimulating ? 'Running Neural Core...' : 'Execute Neural Phase ID'}</span>
            </button>
          </div>
        </div>

        {/* 1B. ONE-CLICK BENCHMARK MIXTURE & DIFFRACTOGRAM PRESET BAR */}
        <div className="px-4 py-2 bg-[#080C16] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-1">
              Benchmark Scans:
            </span>
            {NEURAL_BENCHMARK_PRESETS.map((preset) => {
              const isAct = activeBenchmarkId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setActiveBenchmarkId(preset.id);
                    onLoadPatternData(preset.pattern, preset.label);
                    playSynthTone('switch');
                  }}
                  className={`px-2.5 py-1 rounded-sm border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    isAct
                      ? 'bg-indigo-600/25 border-indigo-500 text-white'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title={preset.subtitle}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
            <span>
              System:{' '}
              <strong className="text-emerald-400">
                {crystallographicInference.systemProbabilities[0]?.id} (
                {crystallographicInference.systemProbabilities[0]?.probability.toFixed(0)}%)
              </strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              a₀ ≈ <strong className="text-white">{crystallographicInference.estLatticeA} Å</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              R_wp = <strong className="text-cyan-400">{crystallographicInference.neuralRwp}%</strong>
            </span>
          </div>
        </div>

        {/* 5-TAB SCIENTIFIC NAVIGATION BAR */}
        <div className="px-4 py-2 bg-[#0B0F19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {[
              {
                id: 'pdf2_sync',
                label: '01. Backbone & PDF-2 Dictionary',
                icon: Database,
                activeClass: 'bg-indigo-600 text-white',
              },
              {
                id: 'layer_probe',
                label: '02. Layer Signal Probe (L1–L6)',
                icon: Layers,
                activeClass: 'bg-cyan-600 text-white',
              },
              {
                id: 'symmetry_heads',
                label: '03. Symmetry, QPA & Stress Lab',
                icon: Scale,
                activeClass: 'bg-emerald-600 text-white',
              },
              {
                id: 'gradcam_ensemble',
                label: '04. 1D Grad-CAM & 5-Model Ensemble',
                icon: Sparkles,
                activeClass: 'bg-fuchsia-600 text-white',
              },
              {
                id: 'backprop_latent',
                label: '05. Live Backprop & 2D Latent Manifold',
                icon: TrendingUp,
                activeClass: 'bg-amber-600 text-white',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isAct = activeWorkbenchTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWorkbenchTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAct ? tab.activeClass : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: 5-ARCHITECTURE SELECTOR + LIVE ICDD PDF-2 DATABASE SYNC */}
        {activeWorkbenchTab === 'pdf2_sync' && (
          <>
            <div className="p-4 border-b border-slate-800 bg-[#070A12]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Select Neural Backbone Topology & Physical Inductive Bias
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Operator:{' '}
                  <code className="text-indigo-300 font-bold bg-[#0B0F19] px-2 py-0.5 border border-slate-800">
                    {activeArch.equation}
                  </code>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {(Object.values(NEURAL_ARCHITECTURES) as ArchSpec[]).map((arch) => {
                  const isSelected = selectedArchId === arch.id;
                  return (
                    <button
                      key={arch.id}
                      onClick={() => {
                        setSelectedArchId(arch.id);
                        playSynthTone('switch');
                      }}
                      className={`p-3 rounded-sm border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/35 border-indigo-500'
                          : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-mono font-bold text-white truncate">
                            {arch.shortTag}
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold tabular-nums"
                            style={{ color: arch.accentColor }}
                          >
                            {arch.params}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                          {arch.family}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
                        <span>RF: {arch.receptiveField.split(' ')[0]}</span>
                        <span className="text-emerald-400 font-bold">{arch.latencyMs} ms</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LIVE ICDD PDF-2 DATABASE <-> NEURAL NETWORK DICTIONARY SYNC & LATENT RETRIEVAL (z ∈ ℝ^128) */}
            <div className="p-4 bg-[#080C16]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      ICDD PDF-2 Reference Database ↔ Neural Latent Dictionary (z ∈ ℝ¹²⁸)
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-emerald-400 font-bold">
                      ● {activePDF2Dictionary.length} Cards Indexed
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-indigo-300">
                      Epoch {fineTuneEpoch}/25 · Acc {fineTuneAccuracy.toFixed(1)}% · Loss{' '}
                      {fineTuneLoss.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unit-hypersphere cosine similarity retrieval (<code className="font-mono">cos(z_scan, z_PDF2)</code>) coupled with Hanawalt <code className="font-mono">(d₁, d₂, d₃)</code> search-match and Chung RIR (<code className="font-mono">I/Ic</code>) quantitative weight estimation.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={pdf2SubfileScope}
                    onChange={(e) => setPdf2SubfileScope(e.target.value)}
                    className="px-2.5 py-1.5 rounded-sm bg-[#0B0F19] border border-slate-800 text-xs font-mono text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="ALL">Subfile: All PDF-2 Cards</option>
                    <option value="NBS/NIST Standard">Subfile: NIST SRM Standards</option>
                    <option value="Mineral">Subfile: Minerals & Geology</option>
                    <option value="Metals & Alloys">Subfile: Metals & Steels</option>
                    <option value="Battery">Subfile: Battery & Energy</option>
                    <option value="Ceramic">Subfile: Ceramics & Oxides</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleFineTuneNeuralNetOnPDF2}
                    disabled={isFineTuningPDF2}
                    className="px-3 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {isFineTuningPDF2
                        ? `Fine-Tuning Ep ${fineTuneEpoch}/25...`
                        : 'Fine-Tune on PDF-2 DB'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInstallAllPDF2PacksFromNeural}
                    className="px-2.5 py-1.5 rounded-sm bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+Install PDF-2 Subfiles</span>
                  </button>

                  {onOpenPDF2Database && (
                    <button
                      type="button"
                      onClick={onOpenPDF2Database}
                      className="px-2.5 py-1.5 rounded-sm bg-[#0B0F19] hover:bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open PDF-2 Studio</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {topPDF2NeuralMatches.map((match, idx) => {
                  const [h1, h2, h3] = match.card.hanawaltLines;
                  return (
                    <div
                      key={`${match.card.pdfCardNumber}_${idx}`}
                      className="p-3 rounded-sm bg-[#0B0F19] border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] tabular-nums">
                          <span className="text-amber-300 font-bold">
                            #{idx + 1} PDF {match.card.pdfCardNumber} [{match.card.qualityMark}]
                          </span>
                          <span className="text-emerald-400 font-bold">
                            ● {match.compositeNeuralScore.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-bold text-white truncate"
                            title={match.card.name}
                          >
                            {match.card.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-300 shrink-0">
                            {match.card.formula}
                          </span>
                        </div>

                        <div className="text-[10px] font-mono tabular-nums text-slate-400 flex items-center justify-between">
                          <span>
                            d₁={h1.dSpacing.toFixed(2)}Å · d₂={h2.dSpacing.toFixed(2)}Å · d₃=
                            {h3.dSpacing.toFixed(2)}Å
                          </span>
                          <span>I/Ic={match.card.rirValue.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 16-Bin Latent Vector z ∈ ℝ^128 Barcode Sparkline */}
                      <div className="flex items-end gap-0.5 h-5 px-1 py-0.5 bg-[#070A12] border border-slate-800">
                        {match.latentEmbedding16.map((val, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex-1 bg-cyan-400/80"
                            style={{ height: `${Math.min(100, Math.max(14, val * 280))}%` }}
                            title={`Latent dim bin ${bIdx + 1}: ${val.toFixed(3)}`}
                          />
                        ))}
                      </div>

                      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono tabular-nums">
                        <span className="text-slate-400">
                          cos(θ)=<strong className="text-cyan-400">{match.cosineSimilarity.toFixed(0)}%</strong> · Wt≈
                          <strong className="text-emerald-400">{match.estimatedWeightPercent.toFixed(1)}%</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLoadPDF2CardIntoNeuralScan(match.card)}
                          className="px-2 py-0.5 rounded-sm bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-bold cursor-pointer"
                        >
                          Load Card
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: ASYMMETRIC SPLIT CONSOLE: INTERACTIVE TOPOLOGY SVG + LIVE LAYER ACTIVATION OSCILLOSCOPE */}
        {activeWorkbenchTab === 'layer_probe' && (
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left 7 Columns: Interactive 6-Layer Neural Topology & Tensor Flow Diagram */}
            <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between bg-[#080C16]">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      6-Stage Neural Computational Graph (Click Any Layer Node L1–L6)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {activeArch.flops} · Latency {activeArch.latencyMs} ms
                  </span>
                </div>

                <div className="bg-[#050811] border border-slate-800 rounded-sm p-3 overflow-x-auto">
                  <svg
                    viewBox="0 0 760 185"
                    className="w-full min-w-[620px] h-auto select-none"
                    role="img"
                    aria-label="Interactive Neural Network Architecture Diagram"
                  >
                    <defs>
                      <linearGradient id="nnEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.55" />
                      </linearGradient>
                    </defs>

                    {ablationSkipLinks && (
                      <g>
                        <path
                          d="M 195 45 C 260 6, 385 6, 445 45"
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          opacity="0.75"
                        />
                        <rect
                          x="272"
                          y="6"
                          width="96"
                          height="15"
                          rx="2"
                          fill="#0f172a"
                          stroke="#6366f1"
                          strokeWidth="0.8"
                        />
                        <text
                          x="320"
                          y="16.5"
                          textAnchor="middle"
                          fill="#a5b4fc"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Identity Skip +x
                        </text>
                      </g>
                    )}

                    {ablationPinnLoss && (
                      <g>
                        <path
                          d="M 695 142 C 630 176, 510 176, 445 142"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.8"
                        />
                        <rect
                          x="505"
                          y="161"
                          width="132"
                          height="15"
                          rx="2"
                          fill="#064e3b"
                          stroke="#10b981"
                          strokeWidth="0.8"
                        />
                        <text
                          x="571"
                          y="171.5"
                          textAnchor="middle"
                          fill="#6ee7b7"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          PINN Extinction ∇L_ext
                        </text>
                      </g>
                    )}

                    {activeArch.layers.map((layer, idx) => {
                      const x = 16 + idx * 124;
                      const y = 46;
                      const width = 104;
                      const height = 94;
                      const isSelected = selectedLayerIndex === layer.index;
                      const isForwardActive = forwardStepLayer === layer.index;

                      return (
                        <g key={layer.id}>
                          {idx < activeArch.layers.length - 1 && (
                            <g>
                              {[66, 93, 120].map((cy, lineIdx) => (
                                <line
                                  key={lineIdx}
                                  x1={x + width}
                                  y1={cy}
                                  x2={x + 124}
                                  y2={cy}
                                  stroke="url(#nnEdgeGrad)"
                                  strokeWidth={isSelected || isForwardActive ? '2.2' : '1.2'}
                                  opacity={isSelected || isForwardActive ? '1' : '0.45'}
                                />
                              ))}
                            </g>
                          )}

                          <g
                            onClick={() => {
                              setSelectedLayerIndex(layer.index);
                              playSynthTone('tick');
                            }}
                            className="cursor-pointer"
                          >
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              rx="3"
                              fill={
                                isForwardActive
                                  ? '#1e1b4b'
                                  : isSelected
                                    ? '#172554'
                                    : '#0b1120'
                              }
                              stroke={
                                isForwardActive
                                  ? '#34d399'
                                  : isSelected
                                    ? '#38bdf8'
                                    : '#334155'
                              }
                              strokeWidth={isSelected || isForwardActive ? '2' : '1'}
                            />

                            <rect
                              x={x + 6}
                              y={y + 6}
                              width="24"
                              height="14"
                              rx="2"
                              fill={isSelected ? '#0284c7' : '#1e293b'}
                            />
                            <text
                              x={x + 18}
                              y={y + 16}
                              textAnchor="middle"
                              fill="#f8fafc"
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              L{layer.index}
                            </text>

                            <text
                              x={x + width - 6}
                              y={y + 15.5}
                              textAnchor="end"
                              fill="#94a3b8"
                              fontSize="7.5"
                              fontFamily="monospace"
                            >
                              {layer.type.slice(0, 11)}
                            </text>

                            <text
                              x={x + width / 2}
                              y={y + 36}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {layer.shortName}
                            </text>

                            <g transform={`translate(${x + 12}, ${y + 44})`}>
                              {Array.from({ length: 8 }).map((_, bIdx) => {
                                const barH =
                                  6 +
                                  Math.round(
                                    14 *
                                      Math.abs(
                                        Math.sin(
                                          bIdx * 0.9 +
                                            layer.index * 1.4 +
                                            selectedFilterChannel * 0.6
                                        )
                                      )
                                  );
                                return (
                                  <rect
                                    key={bIdx}
                                    x={bIdx * 10}
                                    y={20 - barH}
                                    width="7"
                                    height={barH}
                                    rx="1"
                                    fill={
                                      isForwardActive
                                        ? '#34d399'
                                        : isSelected
                                          ? '#38bdf8'
                                          : '#6366f1'
                                    }
                                    opacity={isSelected || isForwardActive ? '0.95' : '0.55'}
                                  />
                                );
                              })}
                            </g>

                            <text
                              x={x + width / 2}
                              y={y + 82}
                              textAnchor="middle"
                              fill="#38bdf8"
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {layer.tensorShape}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="mt-3 p-3.5 rounded-sm bg-[#0B0F19] border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sky-400 text-xs font-mono font-bold">
                    Layer L{activeLayer.index}: {activeLayer.fullName}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                    <span className="text-slate-400">
                      Shape: <strong className="text-white">{activeLayer.tensorShape}</strong>
                    </span>
                    <span className="text-slate-400">
                      Params: <strong className="text-indigo-400">{activeLayer.paramsCount}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-sm bg-[#050811] text-cyan-300 font-mono text-xs overflow-x-auto border border-slate-800">
                  {activeLayer.mathFormula}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{activeLayer.role}</p>
              </div>
            </div>

            {/* Right 5 Columns: Live Layer Activation & Filter Response Oscilloscope */}
            <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-[#070A12]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Layer L{activeLayer.index} Activation Oscilloscope
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-400 mr-1">Filter:</span>
                    {[1, 2, 3, 4, 5, 6].map((ch) => (
                      <button
                        key={ch}
                        onClick={() => {
                          setSelectedFilterChannel(ch);
                          playSynthTone('tick');
                        }}
                        className={`w-6 h-6 rounded-sm text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          selectedFilterChannel === ch
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-cyan-500/40'
                        }`}
                        title={`Inspect Convolutional Filter / Attention Channel #${ch}`}
                      >
                        F{ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#050811] border border-slate-800 rounded-sm p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      {selectedFilterChannel === 1
                        ? 'F1: Bragg Centroid Localization Filter'
                        : selectedFilterChannel === 2
                          ? 'F2: Lorentzian Wing & Scherrer Tail Filter'
                          : selectedFilterChannel === 3
                            ? 'F3: Cu-Kα₁ / Kα₂ Doublet Differential Filter'
                            : selectedFilterChannel === 4
                              ? 'F4: Amorphous Halo Suppression Filter'
                              : selectedFilterChannel === 5
                                ? 'F5: Reciprocal Harmonic d-Ratio Correlator'
                                : 'F6: Space-Group Extinction Absence Gate'}
                    </span>
                    <span className="text-cyan-400 font-bold">2θ: 15° → 85°</span>
                  </div>

                  <svg viewBox="0 0 420 135" className="w-full h-32 select-none">
                    {[25, 55, 85, 115].map((gy) => (
                      <line
                        key={gy}
                        x1="0"
                        y1={gy}
                        x2="420"
                        y2={gy}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    ))}

                    <polyline
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      points={layerActivationTelemetry.rawSignal
                        .map((v, i) => {
                          const px = (i / (layerActivationTelemetry.numBins - 1)) * 412 + 4;
                          const py = 120 - v * 95;
                          return `${px.toFixed(1)},${py.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    <polygon
                      fill="rgba(6, 182, 212, 0.16)"
                      points={`4,120 ${layerActivationTelemetry.layerSignal
                        .map((v, i) => {
                          const px = (i / (layerActivationTelemetry.numBins - 1)) * 412 + 4;
                          const py = 120 - v * 98;
                          return `${px.toFixed(1)},${py.toFixed(1)}`;
                        })
                        .join(' ')} 416,120`}
                    />

                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      points={layerActivationTelemetry.layerSignal
                        .map((v, i) => {
                          const px = (i / (layerActivationTelemetry.numBins - 1)) * 412 + 4;
                          const py = 120 - v * 98;
                          return `${px.toFixed(1)},${py.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    {ablationSelfAttn && (
                      <polyline
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.3"
                        opacity="0.85"
                        points={layerActivationTelemetry.attentionEnvelope
                          .map((v, i) => {
                            const px = (i / (layerActivationTelemetry.numBins - 1)) * 412 + 4;
                            const py = 120 - v * 92;
                            return `${px.toFixed(1)},${py.toFixed(1)}`;
                          })
                          .join(' ')}
                      />
                    )}
                  </svg>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> a_l(2θ)
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="w-2 h-0.5 bg-rose-400 inline-block" /> Attn α(2θ)
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-0.5 bg-slate-500 inline-block" /> Raw I_obs
                      </span>
                    </div>
                    <span>{parsedPoints.length} Active Peaks</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    L2 Tensor Norm
                  </span>
                  <span className="text-base font-bold font-mono tabular-nums text-white">
                    {layerActivationTelemetry.l2Norm}
                  </span>
                </div>
                <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Active Neurons
                  </span>
                  <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
                    {layerActivationTelemetry.activeFraction}%
                  </span>
                </div>
                <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Peak Response
                  </span>
                  <span className="text-base font-bold font-mono tabular-nums text-cyan-400">
                    {layerActivationTelemetry.maxActivation}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HIERARCHICAL MULTI-TASK PREDICTION HEADS, DIRICHLET QPA & ADVERSARIAL STRESS LAB */}
        {activeWorkbenchTab === 'symmetry_heads' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-800">
              {/* Head A: 7 Crystal Systems Softmax Probability Distribution */}
              <div className="lg:col-span-4 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-3 bg-[#080C16]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Head A: 7 Crystal Systems
                    </span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    H(p) = {crystallographicInference.shannonEntropy} bits
                  </span>
                </div>

                <div className="space-y-2">
                  {crystallographicInference.systemProbabilities.map((sys, idx) => (
                    <div key={sys.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: sys.color }}
                          />
                          <span
                            className={
                              idx === 0 ? 'font-bold text-white' : 'text-slate-400'
                            }
                          >
                            {sys.id}
                          </span>
                          <span className="text-[10px] text-slate-500">SG {sys.sgRange}</span>
                        </div>
                        <div className="tabular-nums text-xs">
                          <span
                            className="font-bold"
                            style={{ color: idx === 0 ? sys.color : undefined }}
                          >
                            {sys.probability.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ±{sys.uncertainty}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${Math.max(2, sys.probability)}%`,
                            backgroundColor: sys.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Head B: Bravais Centering & Space-Group Extinction Classifier */}
              <div className="lg:col-span-4 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-3 bg-[#070A12]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Head B: Bravais Extinction Gate
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo-300">
                    SG: {crystallographicInference.sgString}
                  </span>
                </div>

                <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Observed Peak sin²θ_i / sin²θ_1 Sequence
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs tabular-nums">
                    {crystallographicInference.qSqRatios.slice(0, 6).map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#070A12] border border-slate-800 font-bold text-cyan-400"
                      >
                        {r.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {crystallographicInference.bravaisConditions.map((bc) => {
                    const isMatched = bc.status === 'MATCHED';
                    return (
                      <div
                        key={bc.symbol}
                        className={`p-2 rounded-sm border flex items-center justify-between text-xs font-mono ${
                          isMatched
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                            : 'bg-[#0B0F19] border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-indigo-400">[{bc.symbol}]</span>
                            <span className="font-bold truncate">{bc.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{bc.rule}</div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <span
                            className={`text-[10px] font-bold ${
                              isMatched ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {isMatched ? `● ${bc.score}%` : `■ ${bc.score}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Head C: Neural Rietveld, Dirichlet Simplex QPA & 1-Click Module Bridges */}
              <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-[#080C16]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                        Head C: Neural Rietveld & QPA
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      ● Direct Regression
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">
                          Refined Lattice a₀
                        </span>
                        <div className="mt-0.5 flex items-baseline font-mono tabular-nums">
                          <span className="text-lg font-bold text-white">
                            {crystallographicInference.estLatticeA}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">Å</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateToModule('rietveld')}
                        className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] font-mono font-bold text-indigo-400 hover:underline flex items-center justify-between cursor-pointer"
                      >
                        <span>Rietveld Refinement</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">
                          Domain Size D_V
                        </span>
                        <div className="mt-0.5 flex items-baseline font-mono tabular-nums">
                          <span className="text-lg font-bold text-cyan-400">
                            {crystallographicInference.neuralDomainSizeNm}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">nm</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateToModule('scherrer')}
                        className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] font-mono font-bold text-cyan-400 hover:underline flex items-center justify-between cursor-pointer"
                      >
                        <span>Scherrer Studio</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">
                          RMS Microstrain ε
                        </span>
                        <div className="mt-0.5 flex items-baseline font-mono tabular-nums">
                          <span className="text-lg font-bold text-amber-400">
                            {crystallographicInference.neuralMicrostrainPct}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateToModule('williamson')}
                        className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] font-mono font-bold text-amber-400 hover:underline flex items-center justify-between cursor-pointer"
                      >
                        <span>Williamson–Hall</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">
                          Neural Profile R_wp
                        </span>
                        <div className="mt-0.5 flex items-baseline font-mono tabular-nums">
                          <span className="text-lg font-bold text-emerald-400">
                            {crystallographicInference.neuralRwp}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateToModule('pdf_analysis')}
                        className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] font-mono font-bold text-emerald-400 hover:underline flex items-center justify-between cursor-pointer"
                      >
                        <span>Total Scattering PDF</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Dirichlet Simplex Multi-Phase Weight Unmixing Strip */}
                  <div className="p-2.5 rounded-sm bg-[#0B0F19] border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                      <span>Dirichlet Simplex QPA (∑ w_p = 100 wt%)</span>
                      <span className="text-cyan-400">Chung RIR</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${crystallographicInference.dirichletQpa.primaryWt}%` }}
                      />
                      <div
                        className="bg-indigo-500 h-full"
                        style={{ width: `${crystallographicInference.dirichletQpa.secondaryWt}%` }}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${crystallographicInference.dirichletQpa.amorphousWt}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] tabular-nums">
                      <span className="text-emerald-400">
                        ● Primary: {crystallographicInference.dirichletQpa.primaryWt}%
                      </span>
                      <span className="text-indigo-300">
                        ● Secondary: {crystallographicInference.dirichletQpa.secondaryWt}%
                      </span>
                      <span className="text-amber-400">
                        ● Amorph: {crystallographicInference.dirichletQpa.amorphousWt}%
                      </span>
                    </div>
                  </div>
                </div>

                {onOpenMLStudioTab && (
                  <button
                    onClick={onOpenMLStudioTab}
                    className="w-full py-2 px-3 rounded-sm bg-[#0B0F19] hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-mono font-bold border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open Full Transformer Deconvolution & PyTorch Studio</span>
                  </button>
                )}
              </div>
            </div>

            {/* BOTTOM ABLATION & ADVERSARIAL STRESS SANDBOX RIBBON */}
            <div className="px-4 py-3 bg-[#0B0F19] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Ablation Gates:
                </span>
                {[
                  {
                    label: 'Residual Skip (+x)',
                    active: ablationSkipLinks,
                    toggle: () => setAblationSkipLinks(!ablationSkipLinks),
                  },
                  {
                    label: 'Self-Attention',
                    active: ablationSelfAttn,
                    toggle: () => setAblationSelfAttn(!ablationSelfAttn),
                  },
                  {
                    label: 'PINN Extinction',
                    active: ablationPinnLoss,
                    toggle: () => setAblationPinnLoss(!ablationPinnLoss),
                  },
                  {
                    label: 'Lorentz-Pol',
                    active: ablationLorentzPol,
                    toggle: () => setAblationLorentzPol(!ablationLorentzPol),
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.toggle();
                      playSynthTone('tick');
                    }}
                    className={`px-2 py-1 rounded-sm text-[11px] font-bold border transition-all cursor-pointer ${
                      item.active
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                        : 'bg-[#070A12] border-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    {item.active ? '● ' : '○ '}
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Strain Δ2θ:</span>
                  <input
                    type="range"
                    min="-0.35"
                    max="0.35"
                    step="0.05"
                    value={stressStrainShiftDeg}
                    onChange={(e) => setStressStrainShiftDeg(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-500 h-1 cursor-pointer"
                  />
                  <span className="font-bold text-indigo-400 tabular-nums w-12 text-right">
                    {stressStrainShiftDeg >= 0
                      ? `+${stressStrainShiftDeg.toFixed(2)}°`
                      : `${stressStrainShiftDeg.toFixed(2)}°`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Texture r_MD:</span>
                  <input
                    type="range"
                    min="0.60"
                    max="1.40"
                    step="0.05"
                    value={textureMarchDollase}
                    onChange={(e) => setTextureMarchDollase(parseFloat(e.target.value))}
                    className="w-20 accent-emerald-500 h-1 cursor-pointer"
                  />
                  <span className="font-bold text-emerald-400 tabular-nums w-9 text-right">
                    {textureMarchDollase.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Shot Noise:</span>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={stressNoisePct}
                    onChange={(e) => setStressNoisePct(parseInt(e.target.value, 10))}
                    className="w-16 accent-cyan-500 h-1 cursor-pointer"
                  />
                  <span className="font-bold text-cyan-400 tabular-nums w-8 text-right">
                    {stressNoisePct}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    setAblationSkipLinks(true);
                    setAblationSelfAttn(true);
                    setAblationPinnLoss(true);
                    setAblationLorentzPol(true);
                    setStressStrainShiftDeg(0.0);
                    setZeroShiftDeg(0.0);
                    setTextureMarchDollase(1.0);
                    setStressNoisePct(4);
                    playSynthTone('tick');
                  }}
                  className="px-2 py-1 rounded-sm bg-[#070A12] hover:bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 4: 1D GRAD-CAM SALIENCY ATTRIBUTION & 5-ARCHITECTURE DEEP ENSEMBLE VOTER */}
        {activeWorkbenchTab === 'gradcam_ensemble' &&
          (() => {
            const rawPeaks =
              parsedPoints && parsedPoints.length > 0
                ? [...parsedPoints]
                    .sort((a, b) => b.intensity - a.intensity)
                    .slice(0, 8)
                    .sort((a, b) => a.twoTheta - b.twoTheta)
                : [
                    { twoTheta: 20.86, intensity: 22, hkl: '100', fwhm: 0.16 },
                    { twoTheta: 26.64, intensity: 100, hkl: '101', fwhm: 0.18 },
                    { twoTheta: 36.54, intensity: 12, hkl: '110', fwhm: 0.19 },
                    { twoTheta: 39.46, intensity: 11, hkl: '102', fwhm: 0.2 },
                    { twoTheta: 50.14, intensity: 18, hkl: '112', fwhm: 0.22 },
                    { twoTheta: 59.96, intensity: 14, hkl: '211', fwhm: 0.24 },
                  ];

            const rawScores = rawPeaks.map((pk, idx) => {
              const thetaRad = ((pk.twoTheta / 2) * Math.PI) / 180;
              const dSpacing = 1.5406 / (2 * Math.max(0.05, Math.sin(thetaRad)));
              const matchedRef = selectedCandidate?.matched_peaks?.find(
                (mp: any) => Math.abs((mp.obsT ?? mp.refT) - pk.twoTheta) <= 0.35
              );
              const matchBonus = matchedRef ? 1.45 : 0.65;
              const lowAngleDiagnosticWeight = pk.twoTheta < 45 ? 1.2 : 0.95;
              const rawGradCam =
                Math.pow(Math.max(5, pk.intensity), 0.78) *
                matchBonus *
                lowAngleDiagnosticWeight;
              return {
                ...pk,
                idx,
                dSpacing,
                matchedRef,
                hklLabel:
                  matchedRef && matchedRef.h !== undefined
                    ? `(${matchedRef.h}${matchedRef.k}${matchedRef.l})`
                    : pk.hkl
                      ? `(${pk.hkl})`
                      : `(hkl #${idx + 1})`,
                rawGradCam,
              };
            });
            const totalGradCam = rawScores.reduce((acc, p) => acc + p.rawGradCam, 0) || 1;
            const gradCamPeaks = rawScores.map((p) => ({
              ...p,
              saliencyPct: Number(((p.rawGradCam / totalGradCam) * 100).toFixed(1)),
            }));
            const activePeak =
              gradCamPeaks[Math.min(selectedGradCamPeakIdx, gradCamPeaks.length - 1)] ||
              gradCamPeaks[0];

            const baseConf = selectedCandidate?.confidence_score || 94.2;
            const ensembleModels = (Object.values(NEURAL_ARCHITECTURES) as ArchSpec[]).map(
              (arch, mIdx) => {
                const archShiftDelta =
                  arch.id === 'pinn_bragg'
                    ? 2.1 - Math.abs(stressStrainShiftDeg) * 4.0
                    : arch.id === 'xrd_former'
                      ? 1.6 - stressNoisePct * 0.08
                      : arch.id === 'crystal_gnn'
                        ? 1.1 - Math.abs(stressStrainShiftDeg) * 2.5
                        : arch.id === 'resnet1d'
                          ? 0.4 - Math.abs(stressStrainShiftDeg) * 8.0
                          : -0.8 - stressNoisePct * 0.12;
                const modelConf = Math.min(99.8, Math.max(42.0, baseConf + archShiftDelta));
                const epistemicSigma = Number(
                  Math.max(
                    0.35,
                    (100 - modelConf) * 0.14 + stressNoisePct * 0.05 + mIdx * 0.12
                  ).toFixed(2)
                );
                return {
                  arch,
                  modelConf: Number(modelConf.toFixed(1)),
                  epistemicSigma,
                  predictedPhase: selectedCandidate?.phase_name || 'α-SiO₂ (Quartz)',
                  predictedSG: selectedCandidate?.spaceGroup || crystallographicInference.sgString,
                  agreesWithConsensus: modelConf >= 65,
                };
              }
            );

            const meanEnsembleConf = Number(
              (
                ensembleModels.reduce((s, m) => s + m.modelConf, 0) / ensembleModels.length
              ).toFixed(1)
            );
            const ensembleStd = Number(
              Math.sqrt(
                ensembleModels.reduce(
                  (s, m) => s + Math.pow(m.modelConf - meanEnsembleConf, 2),
                  0
                ) / ensembleModels.length
              ).toFixed(2)
            );

            return (
              <div className="p-4 sm:p-5 bg-[#070A12] space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-7 bg-[#0B0F19] border border-slate-800 rounded-sm p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-fuchsia-400" />
                          <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white">
                            1D Grad-CAM Peak Attribution Saliency Map
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Gradient-weighted class activation{' '}
                          <code className="font-mono text-fuchsia-300">
                            L_Grad-CAM(2θ) = ReLU(∑_k α_k^c · A_k(2θ))
                          </code>{' '}
                          showing which Bragg reflections drive the phase decision
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-fuchsia-300">
                        Target: {selectedCandidate?.phase_name || 'α-SiO₂ (Quartz)'}
                      </span>
                    </div>

                    <div className="bg-[#050811] rounded-sm border border-slate-800 p-3">
                      <svg viewBox="0 0 680 210" className="w-full h-48 overflow-visible">
                        <defs>
                          <linearGradient id="gradcamHeat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.55" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {[40, 85, 130, 175].map((yPos, idx) => (
                          <line
                            key={idx}
                            x1={40}
                            y1={yPos}
                            x2={655}
                            y2={yPos}
                            stroke="#1e293b"
                            strokeDasharray="3 3"
                          />
                        ))}

                        {gradCamPeaks.map((pk, idx) => {
                          const x =
                            45 + ((Math.min(88, Math.max(10, pk.twoTheta)) - 10) / 78) * 600;
                          const heightPx = Math.max(14, (pk.intensity / 100) * 135);
                          const yTop = 175 - heightPx;
                          const saliencyRadius = Math.max(12, (pk.saliencyPct / 38) * 34);
                          const isSel = activePeak?.idx === pk.idx;

                          return (
                            <g
                              key={idx}
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedGradCamPeakIdx(idx);
                                playSynthTone('tick');
                              }}
                            >
                              <rect
                                x={x - saliencyRadius / 2}
                                y={25}
                                width={saliencyRadius}
                                height={150}
                                rx={3}
                                fill="url(#gradcamHeat)"
                                opacity={Math.min(0.95, 0.25 + pk.saliencyPct / 45)}
                              />
                              <line
                                x1={x}
                                y1={175}
                                x2={x}
                                y2={yTop}
                                stroke={
                                  isSel ? '#f472b6' : pk.matchedRef ? '#38bdf8' : '#94a3b8'
                                }
                                strokeWidth={isSel ? 3.2 : 2.2}
                              />
                              <circle
                                cx={x}
                                cy={yTop}
                                r={isSel ? 5 : 3.5}
                                fill={isSel ? '#f472b6' : pk.matchedRef ? '#38bdf8' : '#94a3b8'}
                              />
                              <text
                                x={x}
                                y={Math.max(16, yTop - 8)}
                                textAnchor="middle"
                                fill={isSel ? '#f9a8d4' : '#cbd5e1'}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {pk.saliencyPct}%
                              </text>
                            </g>
                          );
                        })}

                        <line
                          x1={40}
                          y1={175}
                          x2={655}
                          y2={175}
                          stroke="#475569"
                          strokeWidth={1.2}
                        />
                        {[10, 25, 40, 55, 70, 85].map((deg) => {
                          const x = 45 + ((deg - 10) / 78) * 600;
                          return (
                            <text
                              key={deg}
                              x={x}
                              y={194}
                              textAnchor="middle"
                              fill="#64748b"
                              fontSize="9.5"
                              fontFamily="monospace"
                            >
                              {deg}° 2θ
                            </text>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {gradCamPeaks.slice(0, 6).map((pk, idx) => {
                        const isSel = activePeak?.idx === pk.idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedGradCamPeakIdx(idx);
                              playSynthTone('tick');
                            }}
                            className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer font-mono ${
                              isSel
                                ? 'bg-fuchsia-500/15 border-fuchsia-500'
                                : 'bg-[#070A12] border-slate-800 hover:border-fuchsia-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] tabular-nums">
                              <span className="font-bold text-white">
                                {pk.twoTheta.toFixed(2)}° {pk.hklLabel}
                              </span>
                              <span className="text-fuchsia-400 font-bold">
                                {pk.saliencyPct}%
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                              <span>d = {pk.dSpacing.toFixed(3)} Å</span>
                              <span
                                className={
                                  pk.matchedRef ? 'text-emerald-400 font-bold' : 'text-amber-400'
                                }
                              >
                                {pk.matchedRef ? '● Indexed' : '▲ Unindexed'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#0B0F19] border border-slate-800 rounded-sm p-4 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white">
                            5-Model Deep Ensemble Voter
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Bayesian multi-architecture consensus & epistemic uncertainty σ_epistemic
                        </p>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-sm font-bold text-emerald-400">
                          {meanEnsembleConf}% ± {ensembleStd}%
                        </div>
                        <div className="text-[10px] text-slate-400">Ensemble Mean ± σ</div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {ensembleModels.map(({ arch, modelConf, epistemicSigma }) => {
                        const isActiveArch = selectedArchId === arch.id;
                        return (
                          <div
                            key={arch.id}
                            onClick={() => {
                              setSelectedArchId(arch.id);
                              playSynthTone('switch');
                            }}
                            className={`p-3 rounded-sm border transition-all cursor-pointer font-mono ${
                              isActiveArch
                                ? 'bg-indigo-500/15 border-indigo-500'
                                : 'bg-[#070A12] border-slate-800 hover:border-indigo-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-sm"
                                  style={{ backgroundColor: arch.accentColor }}
                                />
                                <span className="text-xs font-bold text-white">
                                  {arch.shortTag}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({arch.latencyMs} ms)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs tabular-nums">
                                <span className="font-bold text-white">
                                  {modelConf.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ±{epistemicSigma}%
                                </span>
                              </div>
                            </div>

                            <div className="w-full h-1.5 bg-slate-900 overflow-hidden">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, modelConf)}%`,
                                  backgroundColor: arch.accentColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activePeak && (
                      <div className="p-3 rounded-sm bg-[#050811] border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-fuchsia-300 font-bold tabular-nums">
                          <span>
                            Reflection Probe: 2θ = {activePeak.twoTheta.toFixed(2)}°{' '}
                            {activePeak.hklLabel}
                          </span>
                          <span>Saliency: {activePeak.saliencyPct}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          d = <strong className="text-white">{activePeak.dSpacing.toFixed(4)} Å</strong> · I_rel ={' '}
                          <strong className="text-white">{activePeak.intensity.toFixed(1)}%</strong> ·{' '}
                          <strong
                            className={
                              activePeak.matchedRef ? 'text-emerald-400' : 'text-amber-400'
                            }
                          >
                            {activePeak.matchedRef
                              ? '● Matched to ICDD Reference'
                              : '▲ Unindexed / Secondary Phase'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* TAB 5: LIVE BACKPROP TRAINER, LOSS LANDSCAPE & 2D UMAP LATENT MANIFOLD EXPLORER */}
        {activeWorkbenchTab === 'backprop_latent' && (
          <div className="p-4 sm:p-5 bg-[#070A12] space-y-4">
            {/* Top Controls Bar for Backpropagation & PyTorch Export */}
            <div className="p-3 bg-[#0B0F19] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  [BACKPROP SOLVER & PINN REGULARIZATION]
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Optimizer:</span>
                  {(['AdamW', 'Lion', 'SGD_Mom', 'SAM'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBpOptimizer(opt)}
                      className={`px-2 py-0.5 border text-[11px] font-bold cursor-pointer rounded-sm ${
                        bpOptimizer === opt
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">PINN Weight λ_phys:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bpPinnLambda}
                    onChange={(e) => setBpPinnLambda(parseFloat(e.target.value))}
                    className="w-20 accent-emerald-500 h-1 cursor-pointer"
                  />
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {bpPinnLambda.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runLiveBackpropSimulation}
                  disabled={isRunningBackprop}
                  className="px-3 py-1.5 rounded-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningBackprop ? 'animate-spin' : ''}`} />
                  <span>
                    {isRunningBackprop
                      ? `Backprop Epoch ${bpEpoch}/30...`
                      : 'Run 30-Epoch Backprop'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPyTorch}
                  className="px-3 py-1.5 rounded-sm bg-[#070A12] hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPytorch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied PyTorch Model</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy PyTorch PINN Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 6 Columns: Live Loss + Accuracy Convergence & 2D Loss Landscape Contour */}
              <div className="lg:col-span-6 bg-[#0B0F19] border border-slate-800 p-4 rounded-sm space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-white uppercase">
                    A. Backpropagation Convergence & 2D Loss Basin (θ₁, θ₂)
                  </span>
                  <span className="text-emerald-400 tabular-nums font-bold">
                    Ep {bpEpoch}/30 · Acc{' '}
                    {backpropTelemetry[backpropTelemetry.length - 1]?.valAcc.toFixed(1)}% · L_tot{' '}
                    {backpropTelemetry[backpropTelemetry.length - 1]?.totalLoss.toFixed(3)}
                  </span>
                </div>

                <div className="bg-[#050811] border border-slate-800 p-3">
                  <svg viewBox="0 0 520 190" className="w-full h-auto select-none">
                    {/* Left Half: Loss & Accuracy Curves */}
                    <rect
                      x="10"
                      y="10"
                      width="275"
                      height="168"
                      fill="#070B14"
                      stroke="#1e293b"
                    />
                    <text x="18" y="25" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                      L_CE + λ·L_PINN vs Validation Accuracy
                    </text>

                    {[45, 80, 115, 150].map((gy) => (
                      <line
                        key={gy}
                        x1="20"
                        y1={gy}
                        x2="275"
                        y2={gy}
                        stroke="#1e293b"
                        strokeDasharray="2 2"
                      />
                    ))}

                    {/* Total Loss Polyline */}
                    <polyline
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      points={backpropTelemetry
                        .map((pt, i) => {
                          const px = 22 + (i / 29) * 248;
                          const py = 152 - Math.min(1, pt.totalLoss / 2.0) * 112;
                          return `${px.toFixed(1)},${py.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    {/* PINN Physics Penalty Polyline */}
                    <polyline
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      points={backpropTelemetry
                        .map((pt, i) => {
                          const px = 22 + (i / 29) * 248;
                          const py = 152 - Math.min(1, pt.pinnLoss / 1.0) * 105;
                          return `${px.toFixed(1)},${py.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    {/* Validation Accuracy Polyline */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      points={backpropTelemetry
                        .map((pt, i) => {
                          const px = 22 + (i / 29) * 248;
                          const py = 152 - ((pt.valAcc - 50) / 50) * 112;
                          return `${px.toFixed(1)},${py.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    <text x="22" y="168" fill="#f43f5e" fontSize="8" fontFamily="monospace">
                      ── Total Loss
                    </text>
                    <text x="102" y="168" fill="#22d3ee" fontSize="8" fontFamily="monospace">
                      -- PINN Loss
                    </text>
                    <text x="182" y="168" fill="#10b981" fontSize="8" fontFamily="monospace">
                      ── Val Acc (%)
                    </text>

                    {/* Right Half: 2D Parameter Space Loss Landscape (theta_1, theta_2) */}
                    <rect
                      x="295"
                      y="10"
                      width="215"
                      height="168"
                      fill="#070B14"
                      stroke="#1e293b"
                    />
                    <text x="305" y="25" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                      2D Loss Basin L(θ₁, θ₂)
                    </text>

                    {/* Loss Iso-Contours centered at (460, 48) */}
                    {[78, 56, 38, 22, 10].map((rad, rIdx) => (
                      <ellipse
                        key={rIdx}
                        cx="452"
                        cy="48"
                        rx={rad * 1.35}
                        ry={rad * 0.95}
                        fill="none"
                        stroke={rIdx === 4 ? '#10b981' : '#334155'}
                        strokeWidth={rIdx === 4 ? '1.4' : '1'}
                        strokeDasharray={rIdx < 3 ? '3 2' : 'none'}
                      />
                    ))}

                    {/* Gradient Descent Trajectory */}
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      points={backpropTelemetry
                        .map((pt) => `${(295 + pt.theta1).toFixed(1)},${(10 + pt.theta2).toFixed(1)}`)
                        .join(' ')}
                    />

                    {/* Current Parameter Vector Head */}
                    {(() => {
                      const last = backpropTelemetry[backpropTelemetry.length - 1];
                      if (!last) return null;
                      return (
                        <circle
                          cx={295 + last.theta1}
                          cy={10 + last.theta2}
                          r="4.5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                      );
                    })()}

                    <text x="305" y="168" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                      ── {bpOptimizer} Trajectory (θ_t)
                    </text>
                  </svg>
                </div>
              </div>

              {/* Right 6 Columns: 2D UMAP / t-SNE Latent Manifold Explorer (z_1 vs z_2) */}
              <div className="lg:col-span-6 bg-[#0B0F19] border border-slate-800 p-4 rounded-sm space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-white uppercase">
                    B. 2D UMAP Latent Manifold Projection (z₁ vs z₂ ∈ ℝ¹²⁸)
                  </span>
                  <span className="text-cyan-400 tabular-nums">
                    Silhouette S = 0.89 · Vegard x = {vegardFraction.toFixed(2)}
                  </span>
                </div>

                <div className="bg-[#050811] border border-slate-800 p-3">
                  <svg viewBox="0 0 520 190" className="w-full h-auto select-none">
                    <rect
                      x="10"
                      y="10"
                      width="500"
                      height="170"
                      fill="#070B14"
                      stroke="#1e293b"
                    />

                    {/* Axes */}
                    <line x1="260" y1="10" x2="260" y2="180" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="10" y1="95" x2="510" y2="95" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* 7 Crystal System Clusters */}
                    {[
                      { name: 'Cubic (Fm-3m / Im-3m)', cx: 105, cy: 52, color: '#10b981' },
                      { name: 'Tetragonal (P4₂/mnm)', cx: 215, cy: 48, color: '#6366f1' },
                      { name: 'Trigonal (P3₂21 / R-3m)', cx: 365, cy: 56, color: '#8b5cf6' },
                      { name: 'Hexagonal (P6₃/mmc)', cx: 438, cy: 88, color: '#06b6d4' },
                      { name: 'Orthorhombic (Pnma)', cx: 145, cy: 138, color: '#f59e0b' },
                      { name: 'Monoclinic (P2₁/c)', cx: 310, cy: 142, color: '#ec4899' },
                    ].map((cl, idx) => (
                      <g key={idx}>
                        <ellipse
                          cx={cl.cx}
                          cy={cl.cy}
                          rx="42"
                          ry="22"
                          fill={`${cl.color}18`}
                          stroke={cl.color}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        {[-16, -6, 5, 14, 22].map((dx, pIdx) => (
                          <circle
                            key={pIdx}
                            cx={cl.cx + dx}
                            cy={cl.cy + ((pIdx % 3) - 1) * 7}
                            r="2.5"
                            fill={cl.color}
                            opacity="0.85"
                          />
                        ))}
                        <text
                          x={cl.cx}
                          y={cl.cy - 25}
                          textAnchor="middle"
                          fill={cl.color}
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {cl.name}
                        </text>
                      </g>
                    ))}

                    {/* Vegard Solid-Solution Trajectory Line between Tetragonal and Orthorhombic */}
                    <line
                      x1="215"
                      y1="48"
                      x2="365"
                      y2="56"
                      stroke="#f472b6"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <circle
                      cx={215 + vegardFraction * 150}
                      cy={48 + vegardFraction * 8}
                      r="4.5"
                      fill="#f472b6"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />

                    {/* Live Experimental Scan Embedding Vector z_scan (Moves with Strain & Noise) */}
                    {(() => {
                      const topSys = crystallographicInference.systemProbabilities[0]?.id || 'Trigonal';
                      const base =
                        topSys === 'Cubic'
                          ? { x: 105, y: 52 }
                          : topSys === 'Tetragonal'
                            ? { x: 215, y: 48 }
                            : topSys === 'Hexagonal'
                              ? { x: 438, y: 88 }
                              : topSys === 'Orthorhombic'
                                ? { x: 145, y: 138 }
                                : { x: 365, y: 56 };
                      const scanX = base.x + stressStrainShiftDeg * 55 + (stressNoisePct - 4) * 1.1;
                      const scanY = base.y + (textureMarchDollase - 1.0) * 42;
                      return (
                        <g>
                          <circle
                            cx={scanX}
                            cy={scanY}
                            r="11"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="1.2"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={scanX}
                            cy={scanY}
                            r="5.5"
                            fill="#22d3ee"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          <text
                            x={scanX}
                            y={scanY + 18}
                            textAnchor="middle"
                            fill="#22d3ee"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ★ z_scan (Active)
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
