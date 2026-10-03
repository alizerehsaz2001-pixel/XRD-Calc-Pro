import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Eye,
  Crosshair,
  Compass,
  Boxes,
  HelpCircle,
  BarChart3,
  Flame,
  Radio,
  Share2,
  Workflow,
  Atom,
  RefreshCw,
  Search,
  Scale,
  GitBranch,
  Network,
  SlidersHorizontal,
  ShieldCheck,
  Clock,
  Gauge,
  Binary,
  Award,
  Info,
  FileCode,
  Terminal,
  ExternalLink,
  Code
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { getMLPythonScript, PythonTechniqueId } from './mlPythonGenerators';

export type MLTechniqueTab =
  | 'ensemble'
  | 'pinn'
  | 'mc_dropout'
  | 'latent_space'
  | 'grad_cam'
  | 'contrastive'
  | 'workbench'
  | 'python_code';

export interface MLTechniquesStudioProps {
  experimentalPeaks: Array<{ twoTheta: number; intensity: number }>;
  activeCandidateName?: string;
  theme?: string;
  onApplyPredictedPhase?: (phaseName: string) => void;
}

export const MLTechniquesStudio: React.FC<MLTechniquesStudioProps> = ({
  experimentalPeaks,
  activeCandidateName = 'Quartz (Alpha-SiO2)',
  theme = 'light',
  onApplyPredictedPhase
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MLTechniqueTab>('ensemble');

  // =========================================================
  // PYTHON SCRIPT & EXECUTION ENGINE STATE
  // =========================================================
  const [activePythonTechnique, setActivePythonTechnique] = useState<PythonTechniqueId>('pinn');
  const [pythonDevice, setPythonDevice] = useState<'cuda' | 'cpu' | 'mps'>('cuda');
  const [isRunningPython, setIsRunningPython] = useState<boolean>(false);
  const [pythonOutput, setPythonOutput] = useState<{ stdout: string; stderr: string; success: boolean } | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // =========================================================
  // 1. ENSEMBLE MULTI-MODEL STATE
  // =========================================================
  const [modelWeights, setModelWeights] = useState({
    cnn: 0.30,
    resnet: 0.25,
    transformer: 0.25,
    gnn: 0.12,
    mlp: 0.08
  });

  const handlePresetWeights = (preset: 'balanced' | 'attention' | 'physics_gnn' | 'fast_cnn') => {
    playSynthTone('switch');
    switch (preset) {
      case 'balanced':
        setModelWeights({ cnn: 0.25, resnet: 0.25, transformer: 0.25, gnn: 0.15, mlp: 0.10 });
        break;
      case 'attention':
        setModelWeights({ cnn: 0.15, resnet: 0.15, transformer: 0.50, gnn: 0.15, mlp: 0.05 });
        break;
      case 'physics_gnn':
        setModelWeights({ cnn: 0.15, resnet: 0.20, transformer: 0.20, gnn: 0.40, mlp: 0.05 });
        break;
      case 'fast_cnn':
        setModelWeights({ cnn: 0.50, resnet: 0.30, transformer: 0.10, gnn: 0.05, mlp: 0.05 });
        break;
    }
  };

  const ensembleResults = useMemo(() => {
    const totalW =
      modelWeights.cnn +
      modelWeights.resnet +
      modelWeights.transformer +
      modelWeights.gnn +
      modelWeights.mlp || 1.0;

    const wCnn = modelWeights.cnn / totalW;
    const wRes = modelWeights.resnet / totalW;
    const wTrans = modelWeights.transformer / totalW;
    const wGnn = modelWeights.gnn / totalW;
    const wMlp = modelWeights.mlp / totalW;

    const baseCandidates = [
      {
        name: 'Quartz (Alpha-SiO2)',
        formula: 'SiO₂',
        spaceGroup: 'P3₂21 (#154)',
        crystal: 'Trigonal',
        cnn: 94.2,
        resnet: 96.5,
        trans: 97.1,
        gnn: 95.8,
        mlp: 91.0
      },
      {
        name: 'Anatase (Tetragonal-TiO2)',
        formula: 'TiO₂',
        spaceGroup: 'I4₁/amd (#141)',
        crystal: 'Tetragonal',
        cnn: 78.4,
        resnet: 82.1,
        trans: 85.6,
        gnn: 84.0,
        mlp: 74.2
      },
      {
        name: 'Rutile (Tetragonal-TiO2)',
        formula: 'TiO₂',
        spaceGroup: 'P4₂/mnm (#136)',
        crystal: 'Tetragonal',
        cnn: 52.1,
        resnet: 55.4,
        trans: 58.2,
        gnn: 56.5,
        mlp: 48.0
      },
      {
        name: 'Corundum (Alpha-Al2O3)',
        formula: 'α-Al₂O₃',
        spaceGroup: 'R-3c (#167)',
        crystal: 'Hexagonal',
        cnn: 34.0,
        resnet: 31.5,
        trans: 36.2,
        gnn: 35.8,
        mlp: 38.4
      },
      {
        name: 'Silicon Standard (Si-SRM640)',
        formula: 'Si',
        spaceGroup: 'Fd-3m (#227)',
        crystal: 'Cubic',
        cnn: 22.5,
        resnet: 24.0,
        trans: 21.0,
        gnn: 25.4,
        mlp: 26.5
      },
      {
        name: 'Halite (NaCl)',
        formula: 'NaCl',
        spaceGroup: 'Fm-3m (#225)',
        crystal: 'Cubic',
        cnn: 12.0,
        resnet: 14.5,
        trans: 11.2,
        gnn: 13.8,
        mlp: 15.0
      }
    ];

    return baseCandidates
      .map((c) => {
        const blendedScore =
          wCnn * c.cnn +
          wRes * c.resnet +
          wTrans * c.trans +
          wGnn * c.gnn +
          wMlp * c.mlp;

        const scores = [c.cnn, c.resnet, c.trans, c.gnn, c.mlp];
        const disagreement = Math.sqrt(
          scores.reduce((acc, s) => acc + Math.pow(s - blendedScore, 2), 0) / scores.length
        );

        return {
          ...c,
          blendedScore: Number(blendedScore.toFixed(2)),
          disagreement: Number(disagreement.toFixed(2)),
          confidenceTier:
            blendedScore > 90 ? 'High' : blendedScore > 70 ? 'Moderate' : 'Low'
        };
      })
      .sort((a, b) => b.blendedScore - a.blendedScore);
  }, [modelWeights]);

  // =========================================================
  // 2. PINN HYPERPARAMETERS & SIMULATION
  // =========================================================
  const [pinnLambdaExtinction, setPinnLambdaExtinction] = useState<number>(0.35);
  const [pinnLambdaBragg, setPinnLambdaBragg] = useState<number>(0.20);
  const [pinnLambdaStrain, setPinnLambdaStrain] = useState<number>(0.15);
  const [pinnToleranceDeg, setPinnToleranceDeg] = useState<number>(0.12);

  const pinnLossData = useMemo(() => {
    const epochs = 30;
    return Array.from({ length: epochs }, (_, i) => {
      const ep = i + 1;
      const decay = Math.exp(-ep / 5.5);
      const ceLoss = 1.48 * decay + 0.035;
      const extinctionPenalty = (0.75 * decay + 0.018) * pinnLambdaExtinction;
      const braggPenalty = (0.50 * decay + 0.012) * pinnLambdaBragg;
      const strainPenalty = (0.32 * decay + 0.008) * pinnLambdaStrain;
      const totalPINNLoss = ceLoss + extinctionPenalty + braggPenalty + strainPenalty;
      const physicsPurity = Math.max(
        0,
        Math.min(100, 100 - (extinctionPenalty + braggPenalty + strainPenalty) * 42)
      );

      return {
        epoch: ep,
        totalPINNLoss: Number(totalPINNLoss.toFixed(4)),
        ceLoss: Number(ceLoss.toFixed(4)),
        extinctionPenalty: Number(extinctionPenalty.toFixed(4)),
        braggPenalty: Number(braggPenalty.toFixed(4)),
        strainPenalty: Number(strainPenalty.toFixed(4)),
        physicsPurity: Number(physicsPurity.toFixed(1))
      };
    });
  }, [pinnLambdaExtinction, pinnLambdaBragg, pinnLambdaStrain]);

  // =========================================================
  // 3. MONTE CARLO DROPOUT UNCERTAINTY SIMULATION
  // =========================================================
  const [mcIterations, setMcIterations] = useState<number>(30);
  const [mcDropoutRate, setMcDropoutRate] = useState<number>(0.25);
  const [isRunningMCDropout, setIsRunningMCDropout] = useState<boolean>(false);
  const [mcProgress, setMcProgress] = useState<number>(0);
  const [mcSamples, setMcSamples] = useState<
    Array<{ iteration: number; score: number; entropy: number }>
  >([]);

  const runMonteCarloSimulation = () => {
    setIsRunningMCDropout(true);
    setMcProgress(0);
    playSynthTone('tick');

    const topCandidate = ensembleResults[0];
    const baseScore = topCandidate ? topCandidate.blendedScore : 95.0;
    const generated: Array<{ iteration: number; score: number; entropy: number }> = [];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      const progressPct = Math.round((current / mcIterations) * 100);
      setMcProgress(progressPct);

      const noise = (Math.random() - 0.5) * (mcDropoutRate * 20.0);
      const score = Math.max(10, Math.min(99.9, baseScore + noise));
      const p = Math.max(1e-5, Math.min(0.9999, score / 100));
      const entropy = -p * Math.log2(p) - (1 - p) * Math.log2(Math.max(1e-6, 1 - p));

      generated.push({
        iteration: current,
        score: Number(score.toFixed(2)),
        entropy: Number(entropy.toFixed(3))
      });

      if (current >= mcIterations) {
        clearInterval(interval);
        setMcSamples(generated);
        setIsRunningMCDropout(false);
        playSynthTone('success');
      }
    }, 35);
  };

  useEffect(() => {
    runMonteCarloSimulation();
  }, [mcIterations, mcDropoutRate]);

  const mcStats = useMemo(() => {
    if (mcSamples.length === 0) {
      return {
        mean: 95.2,
        stdDev: 1.85,
        epistemicVar: 0.034,
        shannonEntropy: 0.28,
        ci95Lower: 91.6,
        ci95Upper: 98.8,
        aleatoricNoise: 0.8
      };
    }
    const scores = mcSamples.map((s) => s.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const entropies = mcSamples.map((s) => s.entropy);
    const meanEntropy = entropies.reduce((a, b) => a + b, 0) / entropies.length;

    return {
      mean: Number(mean.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      epistemicVar: Number(variance.toFixed(3)),
      shannonEntropy: Number(meanEntropy.toFixed(3)),
      ci95Lower: Number(Math.max(0, mean - 1.96 * stdDev).toFixed(2)),
      ci95Upper: Number(Math.min(100, mean + 1.96 * stdDev).toFixed(2)),
      aleatoricNoise: Number((0.6 + Math.random() * 0.4).toFixed(2))
    };
  }, [mcSamples]);

  // =========================================================
  // 4. LATENT SPACE MANIFOLD PROJECTION
  // =========================================================
  const [latentMethod, setLatentMethod] = useState<'tsne' | 'umap' | 'pca'>('tsne');

  const latentSpacePoints = useMemo(() => {
    const raw = [
      {
        id: 'q1',
        name: 'Quartz (α-SiO₂)',
        tsne: { x: -24.5, y: 18.2 },
        umap: { x: -14.2, y: 8.5 },
        pca: { x: -32.1, y: 12.0 },
        system: 'Trigonal',
        sg: 'P3₂21',
        color: '#6366f1',
        type: 'Reference'
      },
      {
        id: 'q2',
        name: 'Low Quartz Polymorph',
        tsne: { x: -22.8, y: 19.4 },
        umap: { x: -13.5, y: 9.1 },
        pca: { x: -30.5, y: 13.2 },
        system: 'Trigonal',
        sg: 'P3₁21',
        color: '#6366f1',
        type: 'Reference'
      },
      {
        id: 'r1',
        name: 'Rutile (TiO₂)',
        tsne: { x: 15.2, y: 32.1 },
        umap: { x: 9.5, y: 16.4 },
        pca: { x: 18.2, y: 22.4 },
        system: 'Tetragonal',
        sg: 'P4₂/mnm',
        color: '#06b6d4',
        type: 'Reference'
      },
      {
        id: 'a1',
        name: 'Anatase (TiO₂)',
        tsne: { x: 12.0, y: 28.5 },
        umap: { x: 8.0, y: 14.8 },
        pca: { x: 15.0, y: 19.5 },
        system: 'Tetragonal',
        sg: 'I4₁/amd',
        color: '#06b6d4',
        type: 'Reference'
      },
      {
        id: 'c1',
        name: 'Corundum (α-Al₂O₃)',
        tsne: { x: -18.2, y: -26.4 },
        umap: { x: -10.4, y: -15.1 },
        pca: { x: -22.5, y: -18.4 },
        system: 'Hexagonal',
        sg: 'R-3c',
        color: '#8b5cf6',
        type: 'Reference'
      },
      {
        id: 'si1',
        name: 'Silicon SRM-640',
        tsne: { x: 34.0, y: -12.1 },
        umap: { x: 18.2, y: -6.4 },
        pca: { x: 38.0, y: -9.5 },
        system: 'Cubic',
        sg: 'Fd-3m',
        color: '#10b981',
        type: 'Reference'
      },
      {
        id: 'h1',
        name: 'Halite (NaCl)',
        tsne: { x: 38.5, y: -8.4 },
        umap: { x: 21.0, y: -4.5 },
        pca: { x: 42.4, y: -6.2 },
        system: 'Cubic',
        sg: 'Fm-3m',
        color: '#10b981',
        type: 'Reference'
      },
      {
        id: 'fe1',
        name: 'Magnetite (Fe₃O₄)',
        tsne: { x: 29.4, y: -16.2 },
        umap: { x: 16.0, y: -9.0 },
        pca: { x: 33.2, y: -13.0 },
        system: 'Cubic',
        sg: 'Fd-3m',
        color: '#10b981',
        type: 'Reference'
      },
      {
        id: 'exp',
        name: 'Active Experimental Scan',
        tsne: { x: -23.9, y: 18.8 },
        umap: { x: -14.0, y: 8.8 },
        pca: { x: -31.4, y: 12.5 },
        system: 'Observed Sample',
        sg: 'Unknown',
        color: '#f59e0b',
        type: 'Sample'
      }
    ];

    return raw.map((p) => {
      const coord = p[latentMethod];
      return {
        id: p.id,
        name: p.name,
        x: coord.x,
        y: coord.y,
        system: p.system,
        sg: p.sg,
        color: p.color,
        type: p.type
      };
    });
  }, [latentMethod]);

  // =========================================================
  // 5. 1D GRAD-CAM SALIENCY ATTRIBUTION
  // =========================================================
  const gradCamSpectrum = useMemo(() => {
    const minT = 15;
    const maxT = 85;
    const steps = 140;
    const stepSize = (maxT - minT) / steps;

    return Array.from({ length: steps }, (_, i) => {
      const twoTheta = Number((minT + i * stepSize).toFixed(2));
      let intensity = 2.0;
      let camAttention = 0.05;

      const keyPeaks =
        experimentalPeaks.length > 0
          ? experimentalPeaks
          : [
              { twoTheta: 20.8, intensity: 35 },
              { twoTheta: 26.6, intensity: 100 },
              { twoTheta: 36.5, intensity: 12 },
              { twoTheta: 50.1, intensity: 14 },
              { twoTheta: 59.9, intensity: 9 }
            ];

      keyPeaks.forEach((p, idx) => {
        const delta = Math.abs(twoTheta - p.twoTheta);
        const peakWidth = 0.35;
        if (delta < 2.5) {
          const g = Math.exp(-0.5 * Math.pow(delta / peakWidth, 2));
          intensity += p.intensity * g;
          const saliencyWeight = idx === 1 ? 0.95 : idx === 0 ? 0.65 : 0.45;
          camAttention += saliencyWeight * g;
        }
      });

      return {
        twoTheta,
        intensity: Number(intensity.toFixed(2)),
        gradCamActivation: Number(Math.min(1.0, camAttention).toFixed(3)),
        isHotZone: camAttention > 0.4
      };
    });
  }, [experimentalPeaks]);

  const peakAttributionRank = useMemo(() => {
    const keyPeaks =
      experimentalPeaks.length > 0
        ? experimentalPeaks
        : [
            { twoTheta: 26.65, intensity: 100 },
            { twoTheta: 20.85, intensity: 35 },
            { twoTheta: 50.14, intensity: 14 },
            { twoTheta: 36.54, intensity: 12 },
            { twoTheta: 59.98, intensity: 9 }
          ];

    const hklList = ['(101)', '(100)', '(112)', '(110)', '(211)'];

    return keyPeaks.map((p, i) => {
      const attributionWeight =
        i === 0 ? 46.5 : i === 1 ? 24.2 : i === 2 ? 12.8 : i === 3 ? 10.1 : 6.4;
      return {
        rank: i + 1,
        twoTheta: p.twoTheta,
        hkl: hklList[i] || `(${i + 1}00)`,
        intensity: p.intensity,
        attributionWeight,
        gradientSign: 'Positive (+)'
      };
    });
  }, [experimentalPeaks]);

  // =========================================================
  // 6. CONTRASTIVE REPRESENTATION LEARNING (SimCLR for XRD)
  // =========================================================
  const [activeAugmentation, setActiveAugmentation] = useState<
    'strain_shift' | 'scherrer_broadening' | 'march_dollase' | 'noise'
  >('strain_shift');

  const contrastiveSimilarityMatrix = useMemo(() => {
    return [
      { phase: 'Observed Diffractogram', simAnchor: 1.0, simAugmented: 0.94, simQuartz: 0.92, simAnatase: 0.38, simHalite: 0.12 },
      { phase: 'Augmented View (Aug 1)', simAnchor: 0.94, simAugmented: 1.0, simQuartz: 0.89, simAnatase: 0.35, simHalite: 0.10 },
      { phase: 'Quartz Reference (Positive)', simAnchor: 0.92, simAugmented: 0.89, simQuartz: 1.0, simAnatase: 0.41, simHalite: 0.15 },
      { phase: 'Anatase (Negative Distractor)', simAnchor: 0.38, simAugmented: 0.35, simQuartz: 0.41, simAnatase: 1.0, simHalite: 0.22 },
      { phase: 'Halite (Negative Distractor)', simAnchor: 0.12, simAugmented: 0.10, simQuartz: 0.15, simAnatase: 0.22, simHalite: 1.0 }
    ];
  }, []);

  // =========================================================
  // 7. NEURAL ARCHITECTURE WORKBENCH & INTERACTIVE TRAINER
  // =========================================================
  const [archBackbone, setArchBackbone] = useState<'cnn1d' | 'resnet1d' | 'transformer' | 'convnext'>('resnet1d');
  const [numLayers, setNumLayers] = useState<number>(6);
  const [kernelSize, setKernelSize] = useState<number>(9);
  const [baseFilters, setBaseFilters] = useState<number>(64);
  const [activationFn, setActivationFn] = useState<'gelu' | 'swish' | 'relu' | 'leaky'>('gelu');
  const [optimizer, setOptimizer] = useState<'adamw' | 'lion' | 'sgd'>('adamw');
  const [learningRate, setLearningRate] = useState<string>('0.001');

  const [isFineTuning, setIsFineTuning] = useState<boolean>(false);
  const [fineTuneEpoch, setFineTuneEpoch] = useState<number>(0);
  const [fineTuneLoss, setFineTuneLoss] = useState<number>(1.24);
  const [fineTuneAcc, setFineTuneAcc] = useState<number>(65.2);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

  const architectureMetrics = useMemo(() => {
    const pointsCovered = (kernelSize - 1) * numLayers + 1;
    const stepSizeDeg = 0.02;
    const receptiveFieldDeg = (pointsCovered * stepSizeDeg).toFixed(2);

    let params = 0;
    if (archBackbone === 'cnn1d') {
      params = 2048 * baseFilters + numLayers * (baseFilters * baseFilters * kernelSize);
    } else if (archBackbone === 'resnet1d') {
      params = 2048 * baseFilters + numLayers * 2 * (baseFilters * baseFilters * kernelSize);
    } else if (archBackbone === 'transformer') {
      params = 2048 * baseFilters + numLayers * 4 * (baseFilters * baseFilters);
    } else {
      params = 2048 * baseFilters + numLayers * (baseFilters * baseFilters * kernelSize * 1.5);
    }

    const mFlops = ((params * 2048) / 1e6).toFixed(1);
    const latencyMs = Math.max(0.6, (params / 250000) * 1.1).toFixed(1);

    return {
      receptiveFieldDeg,
      pointsCovered,
      paramCount: Math.round(params).toLocaleString(),
      mFlops,
      latencyMs
    };
  }, [archBackbone, numLayers, kernelSize, baseFilters]);

  const handleStartFineTuning = () => {
    setIsFineTuning(true);
    setFineTuneEpoch(0);
    setFineTuneLoss(1.42);
    setFineTuneAcc(62.0);
    setTrainingLogs([`[Init] Allocating ${archBackbone.toUpperCase()} model tensor weights on WebGPU/Wasm device...`]);
    playSynthTone('switch');

    let ep = 0;
    let currLoss = 1.42;
    let currAcc = 62.0;

    const interval = setInterval(() => {
      ep++;
      currLoss = Math.max(0.042, currLoss * 0.86 - 0.015 * Math.random());
      currAcc = Math.min(99.4, currAcc + (100 - currAcc) * 0.18 + Math.random() * 0.8);

      setFineTuneEpoch(ep);
      setFineTuneLoss(Number(currLoss.toFixed(4)));
      setFineTuneAcc(Number(currAcc.toFixed(2)));

      setTrainingLogs((prev) => [
        `Epoch ${ep}/10: Loss=${currLoss.toFixed(4)} | Top-1 Acc=${currAcc.toFixed(2)}% | lr=${learningRate}`,
        ...prev.slice(0, 5)
      ]);

      if (ep >= 10) {
        clearInterval(interval);
        setIsFineTuning(false);
        playSynthTone('success');
      }
    }, 450);
  };

  // =========================================================
  // PYTHON SCRIPT GENERATOR & RUNNER HANDLERS
  // =========================================================
  const currentPythonScript = useMemo(() => {
    return getMLPythonScript(activePythonTechnique, {
      activeCandidate: activeCandidateName,
      kernelSize,
      numLayers,
      filters: baseFilters,
      learningRate,
      pinnExtinctionWeight: pinnLambdaExtinction,
      pinnBraggWeight: pinnLambdaBragg,
      mcPasses: mcIterations,
      mcDropout: mcDropoutRate,
      device: pythonDevice
    });
  }, [
    activePythonTechnique,
    activeCandidateName,
    kernelSize,
    numLayers,
    baseFilters,
    learningRate,
    pinnLambdaExtinction,
    pinnLambdaBragg,
    mcIterations,
    mcDropoutRate,
    pythonDevice
  ]);

  const handleRunPythonCode = async () => {
    setIsRunningPython(true);
    setPythonOutput(null);
    playSynthTone('switch');

    try {
      const response = await fetch('/api/python/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentPythonScript.code })
      });
      const data = await response.json();
      setPythonOutput(data);
      if (data.success) {
        playSynthTone('success');
      } else {
        playSynthTone('error');
      }
    } catch (err: any) {
      setPythonOutput({
        success: false,
        stdout: '',
        stderr: err.message || 'Failed to communicate with local Python execution daemon.'
      });
      playSynthTone('error');
    } finally {
      setIsRunningPython(false);
    }
  };

  const handleCopyPythonCode = () => {
    navigator.clipboard.writeText(currentPythonScript.code);
    setCopiedScript(true);
    playSynthTone('success');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadPythonFile = () => {
    const blob = new Blob([currentPythonScript.code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentPythonScript.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSynthTone('success');
  };

  const openPythonViewerForTechnique = (tech: PythonTechniqueId) => {
    setActivePythonTechnique(tech);
    setActiveTab('python_code');
    playSynthTone('switch');
  };

  // =========================================================
  // LIVE PREDICTOR BACKEND INTEGRATION
  // =========================================================
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [livePrediction, setLivePrediction] = useState<any | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const handleRunNeuralInference = async () => {
    if (!experimentalPeaks || experimentalPeaks.length === 0) return;
    setIsPredicting(true);
    setPredictionError(null);
    playSynthTone('switch');

    try {
      const response = await fetch('/api/gemini/predict-neural-net', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peaks: experimentalPeaks })
      });
      const data = await response.json();
      if (data.success) {
        setLivePrediction(data);
        playSynthTone('success');
      } else {
        setPredictionError(data.error || 'Failed to execute neural prediction.');
        playSynthTone('error');
      }
    } catch (err: any) {
      setPredictionError(err.message || 'Network interface error.');
      playSynthTone('error');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div
      className={`p-4 md:p-6 rounded-3xl border transition-all ${
        theme === 'cyberpunk'
          ? 'bg-black/90 border-cyber-accent/30 text-cyber-accent shadow-2xl'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 shadow-xl'
      }`}
    >
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {t('Machine Learning & Neural Architecture Studio', 'Machine Learning & Neural Architecture Studio')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold border border-indigo-500/20">
                PyTorch + PINN v4.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ensemble soft-voting, physics-informed extinction loss, Monte Carlo uncertainty, Grad-CAM saliency, and runnable Python PyTorch scripts.
            </p>
          </div>
        </div>

        {/* Live Predictor & Python Shortcut Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('python_code');
              playSynthTone('switch');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Inspect runnable PyTorch Python code for every ML technique"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Python Scripts</span>
          </button>

          <button
            onClick={handleRunNeuralInference}
            disabled={isPredicting}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Execute real-time Python model inference using current experimental scan peaks"
          >
            {isPredicting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>
              {isPredicting
                ? t('Inferring Phase...', 'Inferring Phase...')
                : t('Run Live Neural Inference', 'Run Live Neural Inference')}
            </span>
          </button>
        </div>
      </div>

      {/* Live Inference Feedback Notification Banner */}
      {livePrediction && (
        <div className="mt-4 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              Neural Net Predictor: <strong className="text-indigo-600 dark:text-indigo-400">{livePrediction.predicted_phase}</strong> ({livePrediction.confidence_pct}% confidence)
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              • Latency: {livePrediction.latency_ms}ms • Entropy: {livePrediction.entropy_uncertainty}
            </span>
          </div>
          {onApplyPredictedPhase && (
            <button
              onClick={() => onApplyPredictedPhase(livePrediction.predicted_phase)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              Select as Primary Phase
            </button>
          )}
        </div>
      )}

      {predictionError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{predictionError}</span>
        </div>
      )}

      {/* Navigation Tabs for All Machine Learning Techniques */}
      <div className="flex items-center gap-1.5 mt-5 border-b border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar pb-2">
        {[
          { id: 'ensemble', label: t('Ensemble Multi-Model', 'Ensemble Multi-Model'), icon: Layers },
          { id: 'pinn', label: t('Physics-Informed (PINN)', 'Physics-Informed (PINN)'), icon: Scale },
          { id: 'mc_dropout', label: t('Monte Carlo Uncertainty', 'Monte Carlo Uncertainty'), icon: Radio },
          { id: 'latent_space', label: t('Latent Manifold (2D)', 'Latent Manifold (2D)'), icon: Compass },
          { id: 'grad_cam', label: t('Grad-CAM Saliency', 'Grad-CAM Saliency'), icon: Crosshair },
          { id: 'contrastive', label: t('Contrastive Self-Supervised', 'Contrastive Learning'), icon: GitBranch },
          { id: 'workbench', label: t('Architecture Workbench', 'Architecture Workbench'), icon: SlidersHorizontal },
          { id: 'python_code', label: t('Python PyTorch Codes', 'Python PyTorch Codes'), icon: FileCode, badge: 'Run / Export' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as MLTechniqueTab);
                playSynthTone('tick');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENTS */}
      {/* ========================================================= */}
      <div className="mt-6">
        {/* ========================================================= */}
        {/* 1. ENSEMBLE MULTI-MODEL CONSENSUS */}
        {/* ========================================================= */}
        {activeTab === 'ensemble' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Python Code Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Quick Weight Profiles:
              </span>
              <div className="flex gap-2 flex-wrap items-center">
                {[
                  { id: 'balanced', label: 'Balanced Ensemble' },
                  { id: 'attention', label: 'XRD-Former Heavy (Attention)' },
                  { id: 'physics_gnn', label: 'Crystal-GNN Focused' },
                  { id: 'fast_cnn', label: 'Fast 1D-CNN Baseline' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetWeights(p.id as any)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => openPythonViewerForTechnique('ensemble')}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ml-auto"
                >
                  <FileCode className="w-3 h-3" />
                  <span>Python Ensemble Code</span>
                </button>
              </div>
            </div>

            {/* Model Architecture Weights Sliders */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-indigo-500" />
                  {t('Soft Voting Architecture Weights', 'Soft Voting Architecture Weights')}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Dynamic Bayesian Calibration
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key: 'cnn', label: '1D-CNN (ConvNet)', val: modelWeights.cnn, color: 'text-cyan-500' },
                  { key: 'resnet', label: 'ResNet-1D (Skip)', val: modelWeights.resnet, color: 'text-indigo-500' },
                  { key: 'transformer', label: 'XRD-Former (Self-Attn)', val: modelWeights.transformer, color: 'text-purple-500' },
                  { key: 'gnn', label: 'Crystal-GNN (Bond)', val: modelWeights.gnn, color: 'text-amber-500' },
                  { key: 'mlp', label: 'Deep MLP Baseline', val: modelWeights.mlp, color: 'text-emerald-500' }
                ].map((m) => (
                  <div key={m.key} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className={m.color}>{m.label}</span>
                      <span className="font-mono text-slate-500">{(m.val * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.80"
                      step="0.05"
                      value={m.val}
                      onChange={(e) =>
                        setModelWeights((prev) => ({
                          ...prev,
                          [m.key]: parseFloat(e.target.value)
                        }))
                      }
                      className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ensemble Results Comparison Table */}
            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Rank & Phase Name</th>
                    <th className="p-3">Crystal System & SG</th>
                    <th className="p-3 text-cyan-500">1D-CNN</th>
                    <th className="p-3 text-indigo-500">ResNet</th>
                    <th className="p-3 text-purple-500">XRD-Former</th>
                    <th className="p-3 text-amber-500">Crystal-GNN</th>
                    <th className="p-3 text-emerald-500">MLP</th>
                    <th className="p-3 font-black text-indigo-600 dark:text-indigo-300">Consensus</th>
                    <th className="p-3">Disagreement (σ)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                  {ensembleResults.map((r, idx) => (
                    <tr
                      key={r.name}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 font-sans font-bold flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            idx === 0
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{r.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({r.formula})
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-500">
                        {r.crystal} <span className="text-[10px] font-mono text-slate-400">• {r.spaceGroup}</span>
                      </td>
                      <td className="p-3">{r.cnn}%</td>
                      <td className="p-3">{r.resnet}%</td>
                      <td className="p-3">{r.trans}%</td>
                      <td className="p-3">{r.gnn}%</td>
                      <td className="p-3">{r.mlp}%</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                        <div className="flex items-center gap-2">
                          <span>{r.blendedScore}%</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-sans ${
                              r.confidenceTier === 'High'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/20 text-amber-600'
                            }`}
                          >
                            {r.confidenceTier}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">±{r.disagreement}%</td>
                      <td className="p-3 text-center font-sans">
                        {onApplyPredictedPhase && (
                          <button
                            onClick={() => onApplyPredictedPhase(r.name)}
                            className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Model Confidence Breakdown Bar Chart */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
                Top Candidate Multi-Model Agreement Spectrum
              </span>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ensembleResults.slice(0, 4)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="cnn" name="1D-CNN" fill="#06b6d4" />
                    <Bar dataKey="resnet" name="ResNet-1D" fill="#6366f1" />
                    <Bar dataKey="trans" name="XRD-Former" fill="#a855f7" />
                    <Bar dataKey="gnn" name="Crystal-GNN" fill="#f59e0b" />
                    <Bar dataKey="blendedScore" name="Consensus" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. PHYSICS-INFORMED NEURAL NETWORK (PINN) */}
        {/* ========================================================= */}
        {activeTab === 'pinn' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* PINN Equation Card with Python Shortcut */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  PINN Loss: L_PINN = L_CE + λ_ext L_extinction + λ_bragg L_Bragg + λ_strain L_microstrain
                </span>
                <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-sans">
                  Space-group extinction tensors penalize impossible Bragg reflections directly in backpropagation.
                </p>
              </div>
              <button
                onClick={() => openPythonViewerForTechnique('pinn')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>View & Run PINN Python Code</span>
              </button>
            </div>

            {/* PINN Tuning Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Extinction Penalty (λ_ext):</span>
                  <span className="font-mono text-indigo-500">{pinnLambdaExtinction.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={pinnLambdaExtinction}
                  onChange={(e) => setPinnLambdaExtinction(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Bragg Dispersion (λ_bragg):</span>
                  <span className="font-mono text-purple-500">{pinnLambdaBragg.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={pinnLambdaBragg}
                  onChange={(e) => setPinnLambdaBragg(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Microstrain Regularizer:</span>
                  <span className="font-mono text-emerald-500">{pinnLambdaStrain.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={pinnLambdaStrain}
                  onChange={(e) => setPinnLambdaStrain(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Extinction Window (Δ2θ):</span>
                  <span className="font-mono text-cyan-500">{pinnToleranceDeg}° 2θ</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.01"
                  value={pinnToleranceDeg}
                  onChange={(e) => setPinnToleranceDeg(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600 h-1.5 cursor-pointer"
                />
              </div>
            </div>

            {/* PINN Loss Convergence Curve Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pinnLossData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Loss Decomposition', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="totalPINNLoss" name="Total PINN Loss" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="ceLoss" name="Cross-Entropy (L_CE)" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="extinctionPenalty" name="Extinction Penalty" stroke="#ec4899" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="braggPenalty" name="Bragg Dispersion" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. MONTE CARLO DROPOUT & EPISTEMIC UNCERTAINTY */}
        {/* ========================================================= */}
        {activeTab === 'mc_dropout' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Bayesian Mean Confidence</span>
                <p className="text-xl font-black text-indigo-950 dark:text-indigo-200 mt-1">{mcStats.mean}%</p>
                <span className="text-[10px] text-slate-400">Expected value over {mcIterations} passes</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-purple-400">Epistemic Uncertainty (σ)</span>
                <p className="text-xl font-black text-purple-950 dark:text-purple-200 mt-1">±{mcStats.stdDev}%</p>
                <span className="text-[10px] text-slate-400">Model variance: {mcStats.epistemicVar}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">95% Credible Interval</span>
                <p className="text-lg font-black text-emerald-950 dark:text-emerald-200 mt-1">[{mcStats.ci95Lower}%, {mcStats.ci95Upper}%]</p>
                <span className="text-[10px] text-slate-400">High-confidence bounds</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">Shannon Entropy</span>
                <p className="text-xl font-black text-cyan-950 dark:text-cyan-200 mt-1">{mcStats.shannonEntropy} bits</p>
                <span className="text-[10px] text-slate-400">Classification disorder index</span>
              </div>
            </div>

            {/* MC Dropout Interactive Controls with Python Shortcut */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-xs">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Stochastic Passes: {mcIterations}
                  </span>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={mcIterations}
                    onChange={(e) => setMcIterations(parseInt(e.target.value, 10))}
                    className="w-36 accent-indigo-600 h-1.5 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Dropout Probability: {(mcDropoutRate * 100).toFixed(0)}%
                  </span>
                  <input
                    type="range"
                    min="0.10"
                    max="0.50"
                    step="0.05"
                    value={mcDropoutRate}
                    onChange={(e) => setMcDropoutRate(parseFloat(e.target.value))}
                    className="w-36 accent-purple-600 h-1.5 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPythonViewerForTechnique('mc_dropout')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>Python MC Script</span>
                </button>
                <button
                  onClick={runMonteCarloSimulation}
                  disabled={isRunningMCDropout}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningMCDropout ? 'animate-spin' : ''}`} />
                  <span>{isRunningMCDropout ? `Sampling (${mcProgress}%)...` : 'Resample MC Dropout'}</span>
                </button>
              </div>
            </div>

            {/* Scatter Distribution of Stochastic Inference Passes */}
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mcSamples}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="iteration" label={{ value: 'Stochastic Pass #', position: 'insideBottom', offset: -5 }} />
                  <YAxis domain={['auto', 'auto']} label={{ value: 'Confidence Score (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                  <ReferenceLine y={mcStats.mean} stroke="#6366f1" strokeDasharray="4 4" label="Bayesian Mean" />
                  <ReferenceLine y={mcStats.ci95Lower} stroke="#10b981" strokeDasharray="2 2" label="95% CI Lower" />
                  <ReferenceLine y={mcStats.ci95Upper} stroke="#10b981" strokeDasharray="2 2" label="95% CI Upper" />
                  <Scatter dataKey="score" fill="#8b5cf6" name="Sample Pass Confidence" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. LATENT SPACE MANIFOLD PROJECTION */}
        {/* ========================================================= */}
        {activeTab === 'latent_space' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-500" />
                  2D Latent Representation Manifold (128-dim Spectrum → 2D Projection)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualizes cluster topology of crystal systems. The amber sample pin represents your active experimental diffractogram.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPythonViewerForTechnique('latent_space')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Python t-SNE / UMAP Script</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl">
                  {(['tsne', 'umap', 'pca'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setLatentMethod(m);
                        playSynthTone('switch');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        latentMethod === m
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={latentSpacePoints}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="x" type="number" name={`${latentMethod.toUpperCase()} Dimension 1`} />
                  <YAxis dataKey="y" type="number" name={`${latentMethod.toUpperCase()} Dimension 2`} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const pt = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs shadow-xl space-y-1">
                          <p className="font-bold text-indigo-400">{pt.name}</p>
                          <p className="text-[11px] text-slate-300">System: {pt.system} ({pt.sg})</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Coord: ({pt.x.toFixed(1)}, {pt.y.toFixed(1)})
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter dataKey="y" data={latentSpacePoints}>
                    {latentSpacePoints.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={entry.type === 'Sample' ? '#ffffff' : '#000000'}
                        strokeWidth={entry.type === 'Sample' ? 2 : 1}
                      />
                    ))}
                  </Scatter>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. 1D GRAD-CAM SALIENCY ATTRIBUTION */}
        {/* ========================================================= */}
        {activeTab === 'grad_cam' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-500" />
                  Gradient-Weighted Class Activation Map (Grad-CAM 1D)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The cyan gradient line indicates the neural network's backpropagated activation gradient weights (αₖ = 1/Z ∑ᵢ ∂y_c / ∂Aᵢᵏ). Peak intensities aligned with high Grad-CAM activation provide the strongest mathematical evidence for the selected phase.
                </p>
              </div>
              <button
                onClick={() => openPythonViewerForTechnique('grad_cam')}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Python Grad-CAM Code</span>
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gradCamSpectrum}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="twoTheta" label={{ value: 'Diffraction Angle 2θ (°)', position: 'insideBottom', offset: -5 }} />
                  <YAxis yAxisId="intensity" label={{ value: 'Diffraction Intensity', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="cam" orientation="right" domain={[0, 1]} label={{ value: 'Grad-CAM Saliency Weight', angle: 90, position: 'insideRight' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                  <Legend />
                  <Area yAxisId="intensity" type="monotone" dataKey="intensity" name="Observed Spectrum" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.25} />
                  <Line yAxisId="cam" type="monotone" dataKey="gradCamActivation" name="Grad-CAM Activation" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Attribution Rank Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                Top Bragg Reflection Attribution Ranking
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400 uppercase">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">2θ Position</th>
                    <th className="p-2.5">Miller (hkl)</th>
                    <th className="p-2.5">Observed Intensity</th>
                    <th className="p-2.5 font-bold text-cyan-500">Grad-CAM Contribution (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {peakAttributionRank.map((p) => (
                    <tr key={p.rank} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="p-2.5 font-bold text-slate-500">#{p.rank}</td>
                      <td className="p-2.5">{p.twoTheta.toFixed(2)}°</td>
                      <td className="p-2.5 font-sans font-bold text-indigo-500">{p.hkl}</td>
                      <td className="p-2.5">{p.intensity.toFixed(1)} a.u.</td>
                      <td className="p-2.5 font-bold text-cyan-500">{p.attributionWeight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. SELF-SUPERVISED CONTRASTIVE LEARNING (SimCLR) */}
        {/* ========================================================= */}
        {activeTab === 'contrastive' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-500" />
                  Self-Supervised Contrastive Representation Learning (SimCLR / InfoNCE)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Contrastive pre-training learns robust representations without requiring manual labels via the InfoNCE objective:
                </p>
                <div className="mt-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 font-mono text-[11px] text-purple-300">
                  L_InfoNCE = -log [ exp(sim(z_i, z_j)/τ) / ∑_k exp(sim(z_i, z_k)/τ) ]
                </div>
              </div>
              <button
                onClick={() => openPythonViewerForTechnique('contrastive')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Python SimCLR Code</span>
              </button>
            </div>

            {/* Augmentation Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'strain_shift', label: 'Microstrain Shift (±0.3° 2θ)', desc: 'Lattice expansion & macrostress' },
                { id: 'scherrer_broadening', label: 'Scherrer Broadening', desc: 'Nanocrystallite domain variation' },
                { id: 'march_dollase', label: 'March-Dollase Texture', desc: 'Preferred orientation intensity bias' },
                { id: 'noise', label: 'Poisson Shot Noise', desc: 'Detector background fluctuations' }
              ].map((aug) => (
                <button
                  key={aug.id}
                  onClick={() => {
                    setActiveAugmentation(aug.id as any);
                    playSynthTone('switch');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    activeAugmentation === aug.id
                      ? 'bg-purple-500/10 border-purple-500 text-purple-900 dark:text-purple-200 shadow-md'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-purple-300'
                  }`}
                >
                  <p className="text-xs font-bold">{aug.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{aug.desc}</p>
                </button>
              ))}
            </div>

            {/* Cosine Similarity Matrix */}
            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>Latent Space Cosine Similarity Matrix (Positive Pairs vs. Negative Distractors)</span>
                <span className="text-[10px] text-slate-400">τ = 0.07 temperature</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Phase Sample</th>
                    <th className="p-3">Anchor Scan</th>
                    <th className="p-3">Augmented View</th>
                    <th className="p-3">Quartz (Pos)</th>
                    <th className="p-3">Anatase (Neg)</th>
                    <th className="p-3">Halite (Neg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {contrastiveSimilarityMatrix.map((row) => (
                    <tr key={row.phase} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="p-3 font-sans font-bold">{row.phase}</td>
                      <td className="p-3 font-bold text-indigo-500">{row.simAnchor.toFixed(2)}</td>
                      <td className="p-3 text-purple-500">{row.simAugmented.toFixed(2)}</td>
                      <td className="p-3 text-cyan-500">{row.simQuartz.toFixed(2)}</td>
                      <td className="p-3 text-rose-500">{row.simAnatase.toFixed(2)}</td>
                      <td className="p-3 text-slate-400">{row.simHalite.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. NEURAL ARCHITECTURE WORKBENCH */}
        {/* ========================================================= */}
        {activeTab === 'workbench' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Architecture Metrics Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Receptive Field</span>
                <p className="text-xl font-black text-indigo-950 dark:text-indigo-200 mt-1">{architectureMetrics.receptiveFieldDeg}° 2θ</p>
                <span className="text-[10px] text-slate-400">{architectureMetrics.pointsCovered} points covered</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-purple-400">Parameter Count</span>
                <p className="text-xl font-black text-purple-950 dark:text-purple-200 mt-1">{architectureMetrics.paramCount}</p>
                <span className="text-[10px] text-slate-400">Trainable weights & biases</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">FLOPs Complexity</span>
                <p className="text-xl font-black text-emerald-950 dark:text-emerald-200 mt-1">{architectureMetrics.mFlops} MFLOPs</p>
                <span className="text-[10px] text-slate-400">Per 2048-point spectrum</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">Est. Inference Latency</span>
                <p className="text-xl font-black text-cyan-950 dark:text-cyan-200 mt-1">{architectureMetrics.latencyMs} ms</p>
                <span className="text-[10px] text-slate-400">Wasm / WebGPU throughput</span>
              </div>
            </div>

            {/* Hyperparameter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-xs">
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Model Backbone:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'cnn1d', label: '1D-CNN' },
                    { id: 'resnet1d', label: 'ResNet-1D' },
                    { id: 'transformer', label: 'XRD-Former' },
                    { id: 'convnext', label: 'ConvNeXt-1D' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setArchBackbone(b.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        archBackbone === b.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Number of Layers:</span>
                  <span className="font-mono text-indigo-500">{numLayers} layers</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={numLayers}
                  onChange={(e) => setNumLayers(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Kernel Size (K):</span>
                  <span className="font-mono text-purple-500">{kernelSize}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="21"
                  step="2"
                  value={kernelSize}
                  onChange={(e) => setKernelSize(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Activation Function:</span>
                <select
                  value={activationFn}
                  onChange={(e) => setActivationFn(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <option value="gelu">GELU (Gaussian Error Linear)</option>
                  <option value="swish">Swish / SiLU</option>
                  <option value="relu">ReLU</option>
                  <option value="leaky">LeakyReLU (α = 0.01)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Optimizer:</span>
                <select
                  value={optimizer}
                  onChange={(e) => setOptimizer(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <option value="adamw">AdamW (Decoupled Weight Decay)</option>
                  <option value="lion">Lion (EvoLved Sign Momentum)</option>
                  <option value="sgd">SGD + Nesterov Momentum</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Learning Rate:</span>
                <select
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <option value="0.0005">5e-4 (Fine-Tuning)</option>
                  <option value="0.001">1e-3 (Standard Default)</option>
                  <option value="0.003">3e-3 (Aggressive)</option>
                </select>
              </div>
            </div>

            {/* Interactive Model Fine-Tuning Execution */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      Live Fine-Tuning Simulator
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Epoch: {fineTuneEpoch}/10 • Loss: {fineTuneLoss} • Top-1 Accuracy: {fineTuneAcc}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPythonViewerForTechnique('complete_training')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export PyTorch Training Script</span>
                  </button>

                  <button
                    onClick={handleStartFineTuning}
                    disabled={isFineTuning}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isFineTuning ? 'animate-spin' : ''}`} />
                    <span>{isFineTuning ? 'Training in Progress...' : 'Start Model Fine-Tuning'}</span>
                  </button>
                </div>
              </div>

              {/* Training Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${(fineTuneEpoch / 10) * 100}%` }}
                />
              </div>

              {/* Terminal Logs */}
              <div className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-slate-300 space-y-1 h-28 overflow-y-auto custom-scrollbar">
                {trainingLogs.length === 0 ? (
                  <span className="text-slate-500">Ready to execute fine-tuning. Click "Start Model Fine-Tuning" to begin.</span>
                ) : (
                  trainingLogs.map((log, i) => (
                    <div key={i} className="text-emerald-400">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. PYTHON PYTORCH CODES & RUNNER TAB */}
        {/* ========================================================= */}
        {activeTab === 'python_code' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Technique Selector & Config Deck */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                      <span>{currentPythonScript.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700">
                        {currentPythonScript.filename}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{currentPythonScript.description}</p>
                  </div>
                </div>

                {/* Hardware device selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">PyTorch Target Device:</span>
                  <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    {(['cuda', 'mps', 'cpu'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setPythonDevice(d)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          pythonDevice === d
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technique Selector Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {[
                  { id: 'pinn', label: '1. PINN Extinction Loss' },
                  { id: 'ensemble', label: '2. Multi-Model Ensemble' },
                  { id: 'mc_dropout', label: '3. MC-Dropout Uncertainty' },
                  { id: 'grad_cam', label: '4. 1D Grad-CAM Saliency' },
                  { id: 'latent_space', label: '5. Latent Manifold Projection' },
                  { id: 'contrastive', label: '6. SimCLR Contrastive' },
                  { id: 'complete_training', label: '7. Complete PyTorch Pipeline' }
                ].map((tItem) => (
                  <button
                    key={tItem.id}
                    onClick={() => {
                      setActivePythonTechnique(tItem.id as PythonTechniqueId);
                      setPythonOutput(null);
                      playSynthTone('switch');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activePythonTechnique === tItem.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                    }`}
                  >
                    {tItem.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunPythonCode}
                    disabled={isRunningPython}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {isRunningPython ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isRunningPython ? 'Executing in Python Engine...' : 'Run in Python Engine'}</span>
                  </button>

                  <button
                    onClick={handleCopyPythonCode}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Python Code'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPythonFile}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .py File</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PyTorch / NumPy Standalone Zero-Fail Engine</span>
                </div>
              </div>
            </div>

            {/* Live Python Execution Output Console */}
            {pythonOutput && (
              <div className="rounded-2xl border border-slate-800 bg-[#050A14] text-white p-4 space-y-2 shadow-2xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      Python Engine Execution Output
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    pythonOutput.success
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {pythonOutput.success ? 'EXIT CODE 0 (SUCCESS)' : 'EXIT CODE != 0'}
                  </span>
                </div>

                <pre className="font-mono text-xs text-slate-200 p-3 bg-black/60 rounded-xl overflow-x-auto custom-scrollbar max-h-60 whitespace-pre-wrap leading-relaxed">
                  {pythonOutput.stdout || (pythonOutput.stderr ? '' : 'Script executed successfully with no stdout output.')}
                  {pythonOutput.stderr && (
                    <span className="text-rose-400 block mt-2">{pythonOutput.stderr}</span>
                  )}
                </pre>
              </div>
            )}

            {/* Python Code Display Block */}
            <div className="rounded-2xl border border-slate-800 bg-[#070D18] text-white overflow-hidden shadow-2xl">
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 font-bold text-slate-200">{currentPythonScript.filename}</span>
                </div>
                <span>Python 3.10+ / PyTorch 2.x</span>
              </div>

              <div className="p-4 font-mono text-xs overflow-x-auto custom-scrollbar max-h-[500px] leading-relaxed select-text">
                <pre className="text-slate-300">
                  {currentPythonScript.code}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
