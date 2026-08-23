import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  XRRLayer,
  XRRSimulationConfig,
  XRRDataPoint,
  SLDPoint,
  MATERIAL_PRESETS,
  XRRMaterialPreset,
  calculateReflectivityCurve,
  calculateSLDProfile,
  analyzeKiessigFringes,
  detectCriticalAngle,
  calculateFitQuality,
  generatePythonXRRScript,
  calculateSuperlatticeBraggPeaks,
  estimateOpticalConstantsFromFormula,
  calculateMonteCarloConfidenceEnvelope,
  KiessigAnalysisResult,
  CriticalAngleResult,
  SuperlatticePeak
} from '../utils/xrrPhysics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import {
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Upload,
  Info,
  Sliders,
  Activity,
  Zap,
  Sparkles,
  ChevronDown,
  Check,
  Code,
  Terminal,
  BarChart3,
  BookOpen,
  ArrowRight,
  Maximize2,
  Copy,
  Eye,
  SlidersHorizontal,
  Flame,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Wand2,
  X,
  RotateCcw,
  Palette,
  Radio,
  Gauge,
  Clock,
  Ruler,
  Crosshair,
  ShieldAlert,
  Compass,
  BookmarkPlus,
  Database,
  Save,
  FolderPlus,
  Edit3,
  Tag,
  PlusCircle,
  Settings2
} from 'lucide-react';

export const XRRModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'fa', 'ar', 'ur', 'ps', 'yi', 'sd', 'ku', 'ug'].includes(i18n.language);

  // Config State
  const [config, setConfig] = useState<XRRSimulationConfig>({
    wavelength: 1.5406,      // Cu K-alpha
    radiationSource: 'cu-ka1',
    synchrotronEnergyKeV: 8.048,
    angleStart: 0.05,        // deg
    angleEnd: 4.0,           // deg
    angleStep: 0.005,        // deg
    angleUnit: 'theta',
    beamDivergence: 0.01,    // deg
    background: 1e-7,
    roughnessModel: 'nevot-croce',
    intensityScale: 1.0,
    angleOffset: 0.0,
    footprintCorrection: false,
    sampleLengthMm: 20,
    beamWidthMm: 0.2
  });

  // Monte Carlo Uncertainty Envelope State
  const [enableMonteCarlo, setEnableMonteCarlo] = useState<boolean>(false);
  const [mcVariationPct, setMcVariationPct] = useState<number>(5.0);

  // Advanced settings toggle
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Auto-Fitting Optimization Logs State
  const [fitLogs, setFitLogs] = useState<{ iteration: number; logRmse: number; rwp: number }[]>([]);

  // Multilayer Stack State
  // Film layers followed by Substrate at bottom (last item)
  const [layers, setLayers] = useState<XRRLayer[]>([
    {
      id: 'layer-1',
      name: 'SiO2 Oxide Film',
      thickness: 250,        // 250 Å (25 nm)
      roughness: 4.5,        // 4.5 Å RMS roughness
      density: 2.20,         // g/cm³
      delta: 7.15,           // × 10⁻⁶
      beta: 0.155,
      color: '#06b6d4'
    },
    {
      id: 'substrate',
      name: 'Silicon Substrate',
      thickness: 0,          // Semi-infinite substrate
      roughness: 3.0,        // 3.0 Å substrate roughness
      density: 2.33,
      delta: 7.56,
      beta: 0.173,
      color: '#3b82f6'
    }
  ]);

  // Active Tab View
  const [activeTab, setActiveTab] = useState<'reflectivity' | 'sld' | 'fittings' | 'python' | 'theory'>('reflectivity');

  // Experimental Data State
  const [expDataRaw, setExpDataRaw] = useState<string>('');
  const [expData, setExpData] = useState<{ angle: number; intensity: number }[] | null>(null);
  const [showExpModal, setShowExpModal] = useState<boolean>(false);

  // Auto-Fitting Optimization State
  const [isFitting, setIsFitting] = useState<boolean>(false);
  const [fitProgress, setFitProgress] = useState<number>(0);
  const [fitOptions, setFitOptions] = useState({
    fitThickness: true,
    fitRoughness: true,
    fitDensity: true
  });

  // Python Code View State
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

  // Selected Preset Name
  const [selectedPreset, setSelectedPreset] = useState<string>('SiO2/Si Oxide Film');

  // Superlattice Multilayer Generator Modal State
  const [showSLModal, setShowSLModal] = useState<boolean>(false);
  const [slMatA, setSlMatA] = useState<string>('Molybdenum (Mo)');
  const [slThickA, setSlThickA] = useState<number>(35);
  const [slMatB, setSlMatB] = useState<string>('Silicon (Si)');
  const [slThickB, setSlThickB] = useState<number>(45);
  const [slRepeats, setSlRepeats] = useState<number>(5);
  const [slCapMat, setSlCapMat] = useState<string>('Gold (Au)');
  const [slCapThick, setSlCapThick] = useState<number>(30);
  const [slSubstrate, setSlSubstrate] = useState<string>('Silicon (Si)');

  // Custom & Synthesis Materials Library State (Persisted in LocalStorage)
  const [customMaterials, setCustomMaterials] = useState<XRRMaterialPreset[]>(() => {
    try {
      const saved = localStorage.getItem('xrr_custom_materials_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse custom materials from localStorage', e);
    }
    return [
      {
        name: 'Synthesis MAPbI3 Perovskite',
        density: 4.16,
        delta: 13.80,
        beta: 0.950,
        category: 'Synthesis / Custom',
        color: '#f59e0b',
        isCustom: true,
        notes: 'Organometallic halide perovskite thin film synthesized via spin-coating.'
      },
      {
        name: 'Sputtered TiN Coating',
        density: 5.22,
        delta: 16.40,
        beta: 1.250,
        category: 'Synthesis / Custom',
        color: '#eab308',
        isCustom: true,
        notes: 'Reactive magnetron sputtered ceramic titanium nitride thin film.'
      }
    ];
  });

  // Sync Custom Materials to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('xrr_custom_materials_v1', JSON.stringify(customMaterials));
    } catch (e) {
      console.error('Failed to save custom materials', e);
    }
  }, [customMaterials]);

  // Combined Active Material List (Custom Materials + Built-in Presets)
  const allMaterials = useMemo(() => {
    return [...customMaterials, ...MATERIAL_PRESETS];
  }, [customMaterials]);

  // Custom Material Library Modal & Form States
  const [showCustomMatModal, setShowCustomMatModal] = useState<boolean>(false);
  const [editingMatIndex, setEditingMatIndex] = useState<number | null>(null); // null = new, >=0 = index
  const [matForm, setMatForm] = useState<{
    name: string;
    density: number;
    delta: number;
    beta: number;
    category: string;
    color: string;
    notes: string;
    autoCalc: boolean;
  }>({
    name: 'Synthesis Material 1',
    density: 3.50,
    delta: 11.34,
    beta: 0.262,
    category: 'Synthesis / Custom',
    color: '#8b5cf6',
    notes: 'Custom synthesized material parameters.',
    autoCalc: true
  });

  // Open modal for creating a new custom material
  const handleOpenNewCustomMat = () => {
    setEditingMatIndex(null);
    setMatForm({
      name: `Synthesis Material ${customMaterials.length + 1}`,
      density: 3.50,
      delta: 11.34,
      beta: 0.262,
      category: 'Synthesis / Custom',
      color: '#8b5cf6',
      notes: 'Custom synthesized material with specified density and optical constants.',
      autoCalc: true
    });
    setShowCustomMatModal(true);
  };

  // Open modal for editing an existing custom material
  const handleOpenEditCustomMat = (index: number) => {
    const target = customMaterials[index];
    if (!target) return;
    setEditingMatIndex(index);
    setMatForm({
      name: target.name,
      density: target.density,
      delta: target.delta,
      beta: target.beta,
      category: target.category || 'Synthesis / Custom',
      color: target.color || '#8b5cf6',
      notes: target.notes || '',
      autoCalc: false
    });
    setShowCustomMatModal(true);
  };

  // Save custom material
  const handleSaveCustomMat = () => {
    if (!matForm.name.trim()) return;

    const newMaterial: XRRMaterialPreset = {
      name: matForm.name.trim(),
      density: matForm.density,
      delta: matForm.delta,
      beta: matForm.beta,
      category: matForm.category as any,
      color: matForm.color,
      isCustom: true,
      notes: matForm.notes
    };

    if (editingMatIndex !== null && editingMatIndex >= 0) {
      const updated = [...customMaterials];
      updated[editingMatIndex] = newMaterial;
      setCustomMaterials(updated);
    } else {
      setCustomMaterials([newMaterial, ...customMaterials]);
    }

    setShowCustomMatModal(false);
  };

  // Delete custom material
  const handleDeleteCustomMat = (index: number) => {
    setCustomMaterials(customMaterials.filter((_, i) => i !== index));
  };

  // 1-Click Save Active Layer as Custom Material Preset
  const handleSaveLayerAsCustomMaterial = (layer: XRRLayer) => {
    setEditingMatIndex(null);
    setMatForm({
      name: `${layer.name} Preset`,
      density: layer.density,
      delta: layer.delta,
      beta: layer.beta,
      category: 'Synthesis / Custom',
      color: layer.color || '#3b82f6',
      notes: `Saved from active film layer stack (Thickness = ${layer.thickness} Å, Roughness = ${layer.roughness} Å).`,
      autoCalc: false
    });
    setShowCustomMatModal(true);
  };

  // Export Custom Materials Library as JSON file
  const handleExportCustomLibrary = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customMaterials, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `XRR_Custom_Materials_Library_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Custom Materials Library from JSON file
  const handleImportCustomLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const validated = imported.filter((item: any) => item && item.name && typeof item.density === 'number');
          if (validated.length > 0) {
            setCustomMaterials(prev => [...validated, ...prev]);
          }
        }
      } catch (err) {
        console.error('Error importing custom materials library JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Hovered layer in visual graphic
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Advanced Instrument & Scan Setup States
  const [dwellTime, setDwellTime] = useState<number>(1.0); // sec/step
  const [beamSlitWidth, setBeamSlitWidth] = useState<number>(0.2); // mm
  const [sampleLength, setSampleLength] = useState<number>(20.0); // mm

  // Derived X-Ray Energy (keV = 12.3984 / wavelength)
  const xrayEnergyKeV = useMemo(() => {
    return Number((12.39842 / (config.wavelength || 1.5406)).toFixed(3));
  }, [config.wavelength]);

  // Derived Scan Strategy Metrics
  const totalScanPoints = useMemo(() => {
    const step = config.angleStep || 0.005;
    const range = Math.max(0.001, config.angleEnd - config.angleStart);
    return Math.max(10, Math.floor(range / step) + 1);
  }, [config.angleStart, config.angleEnd, config.angleStep]);

  const totalScanTimeSec = useMemo(() => {
    return Math.round(totalScanPoints * dwellTime);
  }, [totalScanPoints, dwellTime]);

  const formattedScanTime = useMemo(() => {
    const mins = Math.floor(totalScanTimeSec / 60);
    const secs = totalScanTimeSec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, [totalScanTimeSec]);

  // Footprint critical angle theta_fp = arcsin(w / L)
  const footprintCriticalAngleDeg = useMemo(() => {
    if (sampleLength <= 0) return 0;
    const ratio = Math.min(1, beamSlitWidth / sampleLength);
    return Number(((Math.asin(ratio) * 180) / Math.PI).toFixed(3));
  }, [beamSlitWidth, sampleLength]);

  // Scattering Vector Range qz [Å⁻¹]
  const qzStart = useMemo(() => {
    const thetaRad = ((config.angleStart || 0.05) * Math.PI) / 180;
    return ((4 * Math.PI * Math.sin(thetaRad)) / (config.wavelength || 1.5406)).toFixed(3);
  }, [config.angleStart, config.wavelength]);

  const qzEnd = useMemo(() => {
    const thetaRad = ((config.angleEnd || 4.0) * Math.PI) / 180;
    return ((4 * Math.PI * Math.sin(thetaRad)) / (config.wavelength || 1.5406)).toFixed(3);
  }, [config.angleEnd, config.wavelength]);

  // Scan Strategy Presets
  const handleApplyScanPreset = (preset: 'alignment' | 'kiessig' | 'deep' | 'critical') => {
    if (preset === 'alignment') {
      setConfig(prev => ({ ...prev, angleStart: 0.10, angleEnd: 2.00, angleStep: 0.020 }));
    } else if (preset === 'kiessig') {
      setConfig(prev => ({ ...prev, angleStart: 0.05, angleEnd: 4.00, angleStep: 0.005 }));
    } else if (preset === 'deep') {
      setConfig(prev => ({ ...prev, angleStart: 0.02, angleEnd: 6.00, angleStep: 0.002 }));
    } else if (preset === 'critical') {
      setConfig(prev => ({ ...prev, angleStart: 0.02, angleEnd: 1.00, angleStep: 0.002 }));
    }
  };

  // Stack Summary Calculations
  const filmLayersOnly = useMemo(() => layers.slice(0, layers.length - 1), [layers]);
  const totalFilmThickness = useMemo(() => filmLayersOnly.reduce((acc, l) => acc + l.thickness, 0), [filmLayersOnly]);
  const totalFilmThicknessNm = useMemo(() => (totalFilmThickness / 10).toFixed(1), [totalFilmThickness]);

  // Load Preset Structures
  const handleLoadPresetStructure = (presetKey: string) => {
    setSelectedPreset(presetKey);
    switch (presetKey) {
      case 'SiO2/Si Oxide Film':
        setLayers([
          { id: '1', name: 'SiO2 Oxide Film', thickness: 250, roughness: 4.5, density: 2.20, delta: 7.15, beta: 0.155, color: '#06b6d4' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
      case 'HfO2/SiO2/Si High-K Gate Stack':
        setLayers([
          { id: '1', name: 'HfO2 High-K Film', thickness: 80, roughness: 5.0, density: 9.68, delta: 28.5, beta: 3.82, color: '#f59e0b' },
          { id: '2', name: 'SiO2 Interlayer', thickness: 20, roughness: 3.5, density: 2.20, delta: 7.15, beta: 0.155, color: '#06b6d4' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 2.5, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
      case 'Au/Ti/Si Metal Cap Stack':
        setLayers([
          { id: '1', name: 'Gold Capping Layer', thickness: 150, roughness: 6.0, density: 19.30, delta: 46.8, beta: 4.78, color: '#eab308' },
          { id: '2', name: 'Titanium Adhesion Layer', thickness: 35, roughness: 4.0, density: 4.51, delta: 14.1, beta: 0.81, color: '#64748b' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
      case 'Periodic EUV Multilayer [Mo/Si]x5':
        const period: XRRLayer[] = [];
        for (let i = 0; i < 5; i++) {
          period.push({ id: `mo-${i}`, name: `Mo Layer #${i + 1}`, thickness: 35, roughness: 3.0, density: 10.22, delta: 27.8, beta: 1.95, color: '#ec4899' });
          period.push({ id: `si-${i}`, name: `Si Spacer #${i + 1}`, thickness: 45, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.17, color: '#3b82f6' });
        }
        period.push({ id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' });
        setLayers(period);
        break;
      case 'SAM Organic Monolayer / Au / Si':
        setLayers([
          { id: '1', name: 'SAM Organic Monolayer', thickness: 28, roughness: 3.0, density: 1.18, delta: 3.85, beta: 0.082, color: '#84cc16' },
          { id: '2', name: 'Gold Thin Film', thickness: 200, roughness: 5.5, density: 19.30, delta: 46.8, beta: 4.78, color: '#eab308' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
    }
  };

  // Add a new film layer above substrate
  const handleAddLayer = () => {
    const newLayer: XRRLayer = {
      id: `layer-${Date.now()}`,
      name: `New Layer ${layers.length}`,
      thickness: 100,
      roughness: 4.0,
      density: 4.23,
      delta: 13.9,
      beta: 0.52,
      color: '#10b981'
    };
    // Insert before substrate (last layer)
    const next = [...layers];
    next.splice(next.length - 1, 0, newLayer);
    setLayers(next);
  };

  // Move Layer Up / Down in stack
  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    if (index === layers.length - 1) return; // Cannot move substrate
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length - 1) return; // Stay within film range

    const updated = [...layers];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLayers(updated);
  };

  // Duplicate Layer
  const handleDuplicateLayer = (index: number) => {
    if (index === layers.length - 1) return; // Don't duplicate substrate
    const source = layers[index];
    const duplicated: XRRLayer = {
      ...source,
      id: `layer-${Date.now()}`,
      name: `${source.name} (Copy)`
    };
    const updated = [...layers];
    updated.splice(index + 1, 0, duplicated);
    setLayers(updated);
  };

  // Invert Film Stack Order
  const handleInvertStack = () => {
    if (layers.length <= 2) return;
    const films = layers.slice(0, layers.length - 1).reverse();
    const substrate = layers[layers.length - 1];
    setLayers([...films, substrate]);
  };

  // Clear Stack to Default Single Layer + Substrate
  const handleClearStack = () => {
    const defaultSubstrate = layers[layers.length - 1];
    setLayers([
      {
        id: 'layer-1',
        name: 'SiO2 Oxide Film',
        thickness: 200,
        roughness: 4.0,
        density: 2.20,
        delta: 7.15,
        beta: 0.155,
        color: '#06b6d4'
      },
      defaultSubstrate
    ]);
  };

  // Build Superlattice Stack from Generator Modal
  const handleBuildSuperlatticeStack = () => {
    const matA = allMaterials.find(m => m.name === slMatA) || allMaterials[0];
    const matB = allMaterials.find(m => m.name === slMatB) || allMaterials[1];
    const subMat = allMaterials.find(m => m.name === slSubstrate) || allMaterials[0];

    const newStack: XRRLayer[] = [];

    // Optional Capping Layer on top
    if (slCapMat && slCapMat !== 'None' && slCapThick > 0) {
      const capPreset = allMaterials.find(m => m.name === slCapMat);
      newStack.push({
        id: `cap-${Date.now()}`,
        name: `${capPreset?.name || slCapMat} Cap`,
        thickness: slCapThick,
        roughness: 4.0,
        density: capPreset?.density || 19.3,
        delta: capPreset?.delta || 46.8,
        beta: capPreset?.beta || 4.78,
        color: capPreset?.color || '#eab308'
      });
    }

    // Bilayer Repeats [A / B] x N
    for (let i = 0; i < slRepeats; i++) {
      newStack.push({
        id: `sl-a-${i}-${Date.now()}`,
        name: `${matA.name} [P${i + 1}]`,
        thickness: slThickA,
        roughness: 3.5,
        density: matA.density,
        delta: matA.delta,
        beta: matA.beta,
        color: matA.color
      });
      newStack.push({
        id: `sl-b-${i}-${Date.now()}`,
        name: `${matB.name} [P${i + 1}]`,
        thickness: slThickB,
        roughness: 3.5,
        density: matB.density,
        delta: matB.delta,
        beta: matB.beta,
        color: matB.color
      });
    }

    // Substrate at base
    newStack.push({
      id: 'substrate',
      name: `${subMat.name} Substrate`,
      thickness: 0,
      roughness: 3.0,
      density: subMat.density,
      delta: subMat.delta,
      beta: subMat.beta,
      color: subMat.color
    });

    setLayers(newStack);
    setShowSLModal(false);
  };

  // Remove a layer
  const handleRemoveLayer = (index: number) => {
    if (layers.length <= 2) return; // Keep at least 1 film + substrate
    if (index === layers.length - 1) return; // Cannot remove substrate
    setLayers(layers.filter((_, i) => i !== index));
  };

  // Update a layer property
  const handleUpdateLayer = (index: number, field: keyof XRRLayer, value: any) => {
    const updated = [...layers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate optical dispersion delta & beta when density changes
    if (field === 'density' && typeof value === 'number' && value > 0) {
      const matched = allMaterials.find(m => m.name.toLowerCase().includes(updated[index].name.toLowerCase()));
      if (matched && matched.density > 0) {
        const ratio = value / matched.density;
        updated[index].delta = Math.round(matched.delta * ratio * 100) / 100;
        updated[index].beta = Math.round(matched.beta * ratio * 1000) / 1000;
      } else {
        // Linear density scaling approx: delta ≈ 3.24 * density
        updated[index].delta = Math.round(3.24 * value * 100) / 100;
        updated[index].beta = Math.round(0.075 * value * 1000) / 1000;
      }
    }

    setLayers(updated);
  };

  // Apply Material Preset to a layer
  const handleApplyMaterialPreset = (index: number, matName: string) => {
    const preset = allMaterials.find(m => m.name === matName);
    if (!preset) return;

    const updated = [...layers];
    updated[index] = {
      ...updated[index],
      name: preset.name,
      density: preset.density,
      delta: preset.delta,
      beta: preset.beta,
      color: preset.color
    };
    setLayers(updated);
  };

  // Run Parratt Simulation & Monte Carlo Confidence Calculations
  const monteCarloData = useMemo(() => {
    if (!enableMonteCarlo) return null;
    return calculateMonteCarloConfidenceEnvelope(layers, config, mcVariationPct, 25);
  }, [layers, config, enableMonteCarlo, mcVariationPct]);

  // Combined Display Reflectivity Data Points
  const displayReflectivityData = useMemo(() => {
    const raw = calculateReflectivityCurve(layers, config, expData || undefined);
    if (enableMonteCarlo && monteCarloData && monteCarloData.length === raw.length) {
      return raw.map((pt, i) => ({
        ...pt,
        rCalcMin: monteCarloData[i].rCalcMin,
        rCalcMax: monteCarloData[i].rCalcMax
      }));
    }
    return raw;
  }, [layers, config, expData, enableMonteCarlo, monteCarloData]);

  const reflectivityData = displayReflectivityData;

  // SLD Profile View Metric
  const [sldMetric, setSldMetric] = useState<'density' | 'electronDensity' | 'delta' | 'beta'>('density');

  // Superlattice Satellite Bragg Peak Analysis
  const superlatticeResult = useMemo(() => {
    return calculateSuperlatticeBraggPeaks(layers, config);
  }, [layers, config]);

  // Real-Space SLD Depth Profile
  const sldProfile = useMemo(() => {
    return calculateSLDProfile(layers, 300);
  }, [layers]);

  // Kiessig Fringe Analysis
  const kiessigResult: KiessigAnalysisResult | null = useMemo(() => {
    return analyzeKiessigFringes(reflectivityData, config.wavelength);
  }, [reflectivityData, config.wavelength]);

  // Critical Angle Detection
  const criticalResult: CriticalAngleResult | null = useMemo(() => {
    return detectCriticalAngle(reflectivityData);
  }, [reflectivityData]);

  // Fit Quality (Rwp, Log-RMSE)
  const fitMetrics = useMemo(() => {
    return calculateFitQuality(reflectivityData);
  }, [reflectivityData]);

  // Experimental Data Import Handler
  const handleParseExpData = () => {
    if (!expDataRaw.trim()) {
      setExpData(null);
      setShowExpModal(false);
      return;
    }

    try {
      const lines = expDataRaw.trim().split('\n');
      const parsed: { angle: number; intensity: number }[] = [];

      for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith('#') || clean.startsWith('//') || clean.startsWith('Angle')) continue;
        const parts = clean.split(/[\s,;\t]+/);
        if (parts.length >= 2) {
          const a = parseFloat(parts[0]);
          const i = parseFloat(parts[1]);
          if (!isNaN(a) && !isNaN(i) && i >= 0) {
            parsed.push({ angle: a, intensity: i });
          }
        }
      }

      if (parsed.length > 5) {
        // Sort by angle
        parsed.sort((x, y) => x.angle - y.angle);
        setExpData(parsed);
        setShowExpModal(false);
      } else {
        alert(isRTL ? 'داده‌های وارد شده معتبر نیستند. لطفاً فرمت دو ستونی (زاویه و شدت) را بررسی کنید.' : 'Invalid experimental format. Please provide two columns (Angle and Intensity).');
      }
    } catch (e) {
      alert(isRTL ? 'خطا در خوانی داده‌ها.' : 'Error parsing experimental data file.');
    }
  };

  // Advanced Multi-Parameter Non-Linear Fitting Engine with Live Log Progress
  const handleRunAutoFit = () => {
    if (!expData || expData.length === 0) {
      alert(isRTL ? 'لطفاً ابتدا داده‌های تجربی را وارد کنید.' : 'Please import experimental XRR data first to perform fitting.');
      return;
    }

    setIsFitting(true);
    setFitProgress(5);
    setFitLogs([]);

    let currentLayers = JSON.parse(JSON.stringify(layers)) as XRRLayer[];
    let currentConfig = { ...config };
    let bestLayers = currentLayers;
    let bestConfig = currentConfig;

    let bestQuality = calculateFitQuality(calculateReflectivityCurve(bestLayers, bestConfig, expData));
    let bestMetric = bestQuality.logRmse;

    const totalSteps = 50;
    const logs: { iteration: number; logRmse: number; rwp: number }[] = [];

    logs.push({ iteration: 0, logRmse: bestQuality.logRmse, rwp: bestQuality.rwp });

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setFitProgress(Math.round((step / totalSteps) * 100));

      const candidateLayers = JSON.parse(JSON.stringify(bestLayers)) as XRRLayer[];
      const candidateConfig = { ...bestConfig };

      const factor = Math.max(0.1, 1 - step / totalSteps); // Simulated annealing factor

      // Perturb layer parameters
      for (let i = 0; i < candidateLayers.length; i++) {
        const isSubstrate = i === candidateLayers.length - 1;

        if (!isSubstrate && fitOptions.fitThickness) {
          candidateLayers[i].thickness = Math.max(10, candidateLayers[i].thickness + (Math.random() - 0.5) * 12 * factor);
        }
        if (fitOptions.fitRoughness) {
          candidateLayers[i].roughness = Math.max(0.3, candidateLayers[i].roughness + (Math.random() - 0.5) * 1.5 * factor);
        }
        if (fitOptions.fitDensity) {
          candidateLayers[i].density = Math.max(0.5, candidateLayers[i].density + (Math.random() - 0.5) * 0.3 * factor);
          const ratio = candidateLayers[i].density / (layers[i].density || 1);
          candidateLayers[i].delta = Math.max(0, Math.round(layers[i].delta * ratio * 100) / 100);
        }
      }

      candidateConfig.angleOffset = Math.max(-0.2, Math.min(0.2, candidateConfig.angleOffset + (Math.random() - 0.5) * 0.01 * factor));

      const sim = calculateReflectivityCurve(candidateLayers, candidateConfig, expData);
      const quality = calculateFitQuality(sim);

      if (quality.logRmse < bestMetric) {
        bestMetric = quality.logRmse;
        bestLayers = candidateLayers;
        bestConfig = candidateConfig;
      }

      logs.push({ iteration: step, logRmse: quality.logRmse, rwp: quality.rwp });
      setFitLogs([...logs]);

      if (step >= totalSteps) {
        clearInterval(interval);
        setLayers(bestLayers);
        setConfig(bestConfig);
        setIsFitting(false);
        setFitProgress(100);
      }
    }, 35);
  };

  // Download CSV Data
  const handleExportCSV = () => {
    let csv = 'Angle_Theta_deg,Angle_2Theta_deg,Qz_A-1,Reflectivity_Calc,Fresnel_Substrate\n';
    reflectivityData.forEach(p => {
      csv += `${p.theta.toFixed(4)},${p.twoTheta.toFixed(4)},${p.qz.toFixed(6)},${p.rCalc.toExponential(6)},${p.fresnelR?.toExponential(6)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `XRR_Reflectivity_Curve_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Python Script
  const pythonScript = useMemo(() => {
    return generatePythonXRRScript(layers, config);
  }, [layers, config]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                THIN FILM SPECTROSCOPY • PARRATT RECURSION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{isRTL ? 'ماژول آنالیز بازتاب‌سنجی پرتو ایکس (XRR)' : 'X-Ray Reflectometry (XRR) Analysis Engine'}</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-2xl leading-relaxed">
              {isRTL
                ? 'مدل‌سازی دقیق منحنی بازتاب، تعیین ضخامت نانولایه‌ها، زبری صفحات فصلی، چگالی ماده و استخراج نوسانات کیسیک با معادلات پارات و اصلاحات زبری نِووت-کراس.'
                : 'Specular X-ray reflectivity calculation for thin film stacks & substrates. Model layer thicknesses, interfacial roughness, electron densities, Kiessig fringes, and critical angles.'}
            </p>
          </div>

          {/* Quick Metrics & Preset Switcher */}
          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-0.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">{isRTL ? 'کل ضخامت فیلم' : 'Total Film Thickness'}</div>
              <div className="text-base font-mono font-black text-cyan-300">{totalFilmThickness} Å ({(totalFilmThickness / 10).toFixed(1)} nm)</div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-0.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">{isRTL ? 'تعداد لایه‌ها' : 'Multilayer Stack'}</div>
              <div className="text-base font-mono font-black text-indigo-300">{layers.length - 1} Films + Substrate</div>
            </div>

            <button
              onClick={() => setShowExpModal(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{expData ? (isRTL ? 'ویرایش داده‌های تجربی' : 'Exp Data Loaded') : (isRTL ? 'بارگذاری اسکن تجربی' : 'Import Exp Scan')}</span>
            </button>
          </div>
        </div>

        {/* Structure Presets Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-[11px] font-mono font-bold text-slate-400 whitespace-nowrap flex items-center gap-1.5 mr-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {isRTL ? 'الگوهای ساختاری:' : 'Presets:'}
          </span>
          {[
            'SiO2/Si Oxide Film',
            'HfO2/SiO2/Si High-K Gate Stack',
            'Au/Ti/Si Metal Cap Stack',
            'Periodic EUV Multilayer [Mo/Si]x5',
            'SAM Organic Monolayer / Au / Si'
          ].map(p => (
            <button
              key={p}
              onClick={() => handleLoadPresetStructure(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                selectedPreset === p
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls & Plot Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multilayer Stack Editor & Optical Config */}
        <div className="lg:col-span-5 space-y-6">
          {/* Layer Architecture Configurator Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-500/5 space-y-5">
            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isRTL ? 'معماری و لایه‌بندی ساختار' : 'Multilayer Film Architecture'}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                      {layers.length - 1} {layers.length - 1 === 1 ? 'Film' : 'Films'} + Substrate
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'تنظیم ضخامت d، زبری σ و چگالی ρ لایه‌ها' : 'Configure thickness (d), roughness (σ) & mass density (ρ)'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenNewCustomMat}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  title="Manage & Add Custom / Synthesis Materials"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isRTL ? 'کتابخانه مواد سفارشی' : 'Custom Material Library'}</span>
                </button>

                <button
                  onClick={() => setShowSLModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/20"
                  title="Superlattice Multilayer Generator"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'سازنده سوپرلاتیست' : 'Superlattice'}</span>
                </button>

                <button
                  onClick={handleAddLayer}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'افزودن لایه' : 'Add Layer'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stack Summary Badge & Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'ضخامت کل:' : 'Total Stack Film:'}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {totalFilmThickness} Å ({totalFilmThicknessNm} nm)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleInvertStack}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Invert Film Stack Order"
                >
                  <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                  <span>{isRTL ? 'معکوس‌سازی' : 'Invert'}</span>
                </button>

                <button
                  onClick={handleClearStack}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Stack to Single Oxide Film"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isRTL ? 'بازنشانی' : 'Reset'}</span>
                </button>
              </div>
            </div>

            {/* Visual Interactive Stack Graphic */}
            <div className="w-full flex flex-col items-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Incident Beam ↓</span>
                <span>Top Surface z = 0</span>
              </div>

              <div className="w-full max-w-[260px] flex flex-col items-stretch space-y-0.5">
                {layers.map((layer, index) => {
                  const isSubstrate = index === layers.length - 1;
                  const visualHeight = isSubstrate ? 50 : Math.max(22, Math.min(70, layer.thickness * 0.35));
                  const isHovered = hoveredLayerId === layer.id;

                  return (
                    <motion.div
                      layout
                      key={layer.id}
                      onMouseEnter={() => setHoveredLayerId(layer.id)}
                      onMouseLeave={() => setHoveredLayerId(null)}
                      className={`w-full rounded-sm flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isHovered ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.02] z-10' : ''
                      }`}
                      style={{ 
                        height: visualHeight, 
                        backgroundColor: layer.color || '#3b82f6',
                        opacity: isSubstrate ? 0.75 : 0.9,
                        boxShadow: `inset 0px -2px 10px rgba(0,0,0,0.15), inset 0px 2px 5px rgba(255,255,255,0.25)`
                      }}
                    >
                      <div className="flex items-center justify-between w-full px-3 text-white/90 drop-shadow-md">
                        <span className="text-[10px] font-bold truncate max-w-[150px]">
                          {layer.name}
                        </span>
                        {!isSubstrate && (
                          <span className="text-[9px] font-mono text-white/80 font-bold shrink-0">
                            {layer.thickness} Å ({layer.density} g/cm³)
                          </span>
                        )}
                        {isSubstrate && (
                          <span className="text-[9px] font-mono text-white/80 font-bold shrink-0">
                            Substrate Bulk
                          </span>
                        )}
                      </div>

                      {/* Interfacial roughness wave effect line indicator */}
                      {layer.roughness > 0 && !isSubstrate && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/40 border-b border-dashed border-white/60"
                          title={`Roughness σ = ${layer.roughness} Å`}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="w-full flex justify-end text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-2">
                <span>Substrate Depth ∞</span>
              </div>
            </div>

            {/* Film Layer Editor Cards */}
            <div className="space-y-4 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
              {layers.map((layer, index) => {
                const isSubstrate = index === layers.length - 1;
                const isHovered = hoveredLayerId === layer.id;

                return (
                  <motion.div
                    key={layer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onMouseEnter={() => setHoveredLayerId(layer.id)}
                    onMouseLeave={() => setHoveredLayerId(null)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSubstrate
                        ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-700/80'
                        : isHovered
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50'
                    }`}
                  >
                    {/* Top Row: Color Picker, Title, Tag, Quick Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Custom Color Circle Input */}
                        <div className="relative group shrink-0">
                          <input
                            type="color"
                            value={layer.color || '#3b82f6'}
                            onChange={(e) => handleUpdateLayer(index, 'color', e.target.value)}
                            className="w-4 h-4 rounded-full border-0 cursor-pointer p-0 appearance-none bg-transparent"
                            title="Customize Layer Color"
                          />
                        </div>

                        <input
                          type="text"
                          value={layer.name}
                          onChange={(e) => handleUpdateLayer(index, 'name', e.target.value)}
                          className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 outline-none px-1 py-0.5 truncate max-w-[160px]"
                        />

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 font-bold">
                          {isSubstrate ? (isRTL ? 'زیرلایه' : 'Substrate') : `Layer ${index + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Material Preset Selector */}
                        <select
                          onChange={(e) => handleApplyMaterialPreset(index, e.target.value)}
                          className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none cursor-pointer max-w-[125px] truncate"
                          defaultValue=""
                        >
                          <option value="" disabled>{isRTL ? 'ماده...' : 'Preset...'}</option>
                          {customMaterials.length > 0 && (
                            <optgroup label="Custom & Synthesis">
                              {customMaterials.map(m => (
                                <option key={m.name} value={m.name}>✨ {m.name}</option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Standard Library">
                            {MATERIAL_PRESETS.map(m => (
                              <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                          </optgroup>
                        </select>

                        {/* Film Stack Order & Clone Actions */}
                        {!isSubstrate && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => handleSaveLayerAsCustomMaterial(layer)}
                              className="p-1 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 transition-colors"
                              title="Save this layer as a Custom Material Preset"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleMoveLayer(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Move Layer Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleMoveLayer(index, 'down')}
                              disabled={index === layers.length - 2}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Move Layer Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicateLayer(index)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Duplicate Layer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRemoveLayer(index)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Layer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Numerical Controls: Thickness, Roughness, Density with Fine Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Thickness */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                          <span>{isRTL ? 'ضخامت d (Å)' : 'Thickness (Å)'}</span>
                          {!isSubstrate && <span className="text-cyan-500 font-bold">{(layer.thickness / 10).toFixed(1)} nm</span>}
                        </label>
                        {isSubstrate ? (
                          <div className="text-xs font-mono font-bold text-slate-400 pt-3 text-center bg-slate-100/50 dark:bg-slate-950/50 p-2 rounded-xl">Semi-Infinite (∞)</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateLayer(index, 'thickness', Math.max(1, layer.thickness - 10))}
                                className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                title="-10 Å"
                              >
                                -10
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="2000"
                                step="1"
                                value={layer.thickness}
                                onChange={(e) => handleUpdateLayer(index, 'thickness', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-center font-bold"
                              />
                              <button
                                onClick={() => handleUpdateLayer(index, 'thickness', layer.thickness + 10)}
                                className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                title="+10 Å"
                              >
                                +10
                              </button>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="1000"
                              step="5"
                              value={layer.thickness}
                              onChange={(e) => handleUpdateLayer(index, 'thickness', parseFloat(e.target.value) || 0)}
                              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </>
                        )}
                      </div>

                      {/* Roughness σ */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                          <span>{isRTL ? 'زبری σ (Å)' : 'Roughness σ (Å)'}</span>
                          <span className="text-indigo-500 font-bold">{layer.roughness} Å</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          value={layer.roughness}
                          onChange={(e) => handleUpdateLayer(index, 'roughness', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold"
                        />
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="0.5"
                          value={layer.roughness}
                          onChange={(e) => handleUpdateLayer(index, 'roughness', parseFloat(e.target.value) || 0)}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Mass Density ρ */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                          <span>{isRTL ? 'چگالی ρ' : 'Density ρ'}</span>
                          <span className="text-emerald-500 font-bold">g/cm³</span>
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          max="25"
                          step="0.05"
                          value={layer.density}
                          onChange={(e) => handleUpdateLayer(index, 'density', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold"
                        />
                        <input
                          type="range"
                          min="0.5"
                          max="22"
                          step="0.1"
                          value={layer.density}
                          onChange={(e) => handleUpdateLayer(index, 'density', parseFloat(e.target.value) || 0)}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Footer Readout: Interdiffusion Zone & Optical Constants */}
                    {showAdvancedSettings && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
                        {!isSubstrate && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span>{isRTL ? 'شیب/نفوذ متقابل:' : 'Interdiffusion Zone:'}</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                step="1"
                                value={layer.gradingThickness || 0}
                                onChange={(e) => handleUpdateLayer(index, 'gradingThickness', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-[10px] text-amber-500 font-bold outline-none"
                                placeholder="0 Å"
                              />
                              <span>Å</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <span>{isRTL ? 'گرادیان چگالی:' : 'Density Gradient:'}</span>
                              <select
                                value={layer.gradientType || 'none'}
                                onChange={(e) => handleUpdateLayer(index, 'gradientType', e.target.value)}
                                className="px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-[10px] text-indigo-500 font-bold outline-none cursor-pointer"
                              >
                                <option value="none">None</option>
                                <option value="linear">Linear</option>
                                <option value="exponential">Exponential</option>
                                <option value="sigmoidal">Sigmoidal</option>
                              </select>
                              {layer.gradientType && layer.gradientType !== 'none' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500 font-bold">Δρ</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={layer.gradientDeltaDensity || 0}
                                    onChange={(e) => handleUpdateLayer(index, 'gradientDeltaDensity', parseFloat(e.target.value) || 0)}
                                    className="w-12 px-1 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-[10px] text-indigo-500 font-bold outline-none"
                                    placeholder="0.0"
                                    title="Density change across layer (g/cm³)"
                                  />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        <span className="text-slate-500">
                          δ = <strong className="text-slate-700 dark:text-slate-300">{layer.delta}</strong>×10⁻⁶ • β = <strong className="text-slate-700 dark:text-slate-300">{layer.beta}</strong>×10⁻⁷
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Experimental Setup & Optical Parameters */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-cyan-500/5 space-y-5">
            {/* Header with Scan Strategy Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isRTL ? 'تنظیمات آزمایشگاهی و اسکن XRR' : 'Instrument & Scan Setup'}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                      {totalScanPoints} pts • {formattedScanTime}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'پیکربندی طول موج، واگرایی پرتو، زاویه اسکن و زمان اسکن' : 'X-ray optics, beam geometry, scan resolution & exposure time'}
                  </p>
                </div>
              </div>

              {/* Quick Scan Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleApplyScanPreset('alignment')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                  title="Fast Alignment Survey: 0.1° to 2.0° (Step 0.020°)"
                >
                  {isRTL ? 'ترازیابی سریع' : 'Fast Survey'}
                </button>
                <button
                  onClick={() => handleApplyScanPreset('kiessig')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                  title="Kiessig High-Res: 0.05° to 4.0° (Step 0.005°)"
                >
                  {isRTL ? 'فرینج کیسیک' : 'Kiessig Standard'}
                </button>
                <button
                  onClick={() => handleApplyScanPreset('deep')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                  title="Deep Specular Scan: 0.02° to 6.0° (Step 0.002°)"
                >
                  {isRTL ? 'اسکن عمیق' : 'Deep Fringe'}
                </button>
                <button
                  onClick={() => handleApplyScanPreset('critical')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                  title="Critical Angle Scan: 0.02° to 1.0° (Step 0.002°)"
                >
                  {isRTL ? 'زاویه بحرانی' : 'Critical Angle'}
                </button>
              </div>
            </div>

            {/* Live Scan Strategy Metrics Readout Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 font-mono text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-500" />
                  {isRTL ? 'زمان اسکن تخمینی' : 'Est. Scan Time'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formattedScanTime}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-indigo-500" />
                  {isRTL ? 'تعداد نقاط داده' : 'Scan Points (N)'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {totalScanPoints} pts
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-500" />
                  {isRTL ? 'بازه بردار qz' : 'q_z Vector Range'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {qzStart} → {qzEnd} Å⁻¹
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-amber-500" />
                  {isRTL ? 'انرژی پرتو' : 'X-Ray Energy'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {xrayEnergyKeV} keV
                </span>
              </div>
            </div>

            {/* Section 1: Radiation Source & Wavelength / Energy Converter */}
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-500" />
                  {isRTL ? 'منبع تابش پرتو ایکس و طول‌موج' : 'X-Ray Source & Monochromator'}
                </span>
                <span className="text-[10px] font-mono text-cyan-500 font-bold">
                  λ = {config.wavelength} Å ({xrayEnergyKeV} keV)
                </span>
              </div>

              <div className={`grid grid-cols-1 ${showAdvancedSettings ? 'md:grid-cols-3' : ''} gap-3`}>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'آنود تابشی پیش‌فرض' : 'Anode Target Line'}
                  </label>
                  <select
                    value={config.wavelength}
                    onChange={(e) => setConfig({ ...config, wavelength: parseFloat(e.target.value) || 1.5406 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                  >
                    <option value={1.5406}>Cu K-α1 (1.5406 Å • 8.048 keV)</option>
                    <option value={1.5444}>Cu K-α2 (1.5444 Å • 8.028 keV)</option>
                    <option value={0.7093}>Mo K-α1 (0.7093 Å • 17.48 keV)</option>
                    <option value={1.7889}>Co K-α1 (1.7889 Å • 6.930 keV)</option>
                    <option value={2.2897}>Cr K-α1 (2.2897 Å • 5.415 keV)</option>
                    <option value={0.8265}>Synchrotron (0.8265 Å • 15.00 keV)</option>
                  </select>
                </div>

                {showAdvancedSettings && (
                  <>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500">
                        {isRTL ? 'طول موج λ (Å)' : 'Wavelength λ (Å)'}
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.1"
                        max="10.0"
                        value={config.wavelength}
                        onChange={(e) => setConfig({ ...config, wavelength: parseFloat(e.target.value) || 1.5406 })}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500">
                        {isRTL ? 'انرژی معادل (keV)' : 'Equivalent Energy (keV)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.0"
                        max="100.0"
                        value={xrayEnergyKeV}
                        onChange={(e) => {
                          const keV = parseFloat(e.target.value);
                          if (keV > 0) {
                            const wave = Number((12.39842 / keV).toFixed(4));
                            setConfig({ ...config, wavelength: wave });
                          }
                        }}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Angular Scan Range & Step Resolution */}
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-indigo-500" />
                  {isRTL ? 'دامنه اسکن زاویه‌ای θ' : 'Angular Scan Range & Resolution'}
                </span>
                <span className="text-[10px] font-mono text-indigo-500 font-bold">
                  Δθ = {config.angleStep}° ({totalScanPoints} steps)
                </span>
              </div>

              <div className={`grid grid-cols-2 ${showAdvancedSettings ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'زاویه شروع θ (°)' : 'Start Angle θ (°)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.005"
                    max="2.0"
                    value={config.angleStart}
                    onChange={(e) => setConfig({ ...config, angleStart: parseFloat(e.target.value) || 0.01 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'زاویه پایان θ (°)' : 'End Angle θ (°)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10.0"
                    value={config.angleEnd}
                    onChange={(e) => setConfig({ ...config, angleEnd: parseFloat(e.target.value) || 4.0 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'گام زاویه‌ای Δθ (°)' : 'Step Size Δθ (°)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="0.05"
                    value={config.angleStep}
                    onChange={(e) => setConfig({ ...config, angleStep: parseFloat(e.target.value) || 0.005 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>

                {showAdvancedSettings && (
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500">
                      {isRTL ? 'خطای صفر زاویه Δθ₀ (°)' : 'Zero Offset Δθ₀ (°)'}
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      min="-0.1"
                      max="0.1"
                      value={config.angleOffset || 0.0}
                      onChange={(e) => setConfig({ ...config, angleOffset: parseFloat(e.target.value) || 0.0 })}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRTL ? 'تنظیمات پیشرفته فیزیکی و دستگاهی' : 'Advanced Physics & Instrument Settings'}
                </span>
              </div>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${showAdvancedSettings ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-slate-200 dark:border-slate-800'}`}
              >
                {showAdvancedSettings ? (isRTL ? 'مخفی کردن' : 'Hide Advanced') : (isRTL ? 'نمایش تنظیمات پیشرفته' : 'Show Advanced')}
              </button>
            </div>

            {showAdvancedSettings && (
              <>
                {/* Section 3: Instrumental Optics & Beam Divergence */}
                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-emerald-500" />
                  {isRTL ? 'اپتیک پرتو و پهن‌شدگی دستگاهی' : 'Beam Divergence & Instrumental Resolution'}
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">
                  FWHM = {config.beamDivergence}°
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                    <span>{isRTL ? 'پهنای نیمی واگرایی پرتو (FWHM °)' : 'Beam Divergence FWHM (°)'}</span>
                    <span className="text-emerald-500">{config.beamDivergence}°</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0.0"
                      max="0.1"
                      value={config.beamDivergence}
                      onChange={(e) => setConfig({ ...config, beamDivergence: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                    />
                    <input
                      type="range"
                      min="0.0"
                      max="0.05"
                      step="0.001"
                      value={config.beamDivergence}
                      onChange={(e) => setConfig({ ...config, beamDivergence: parseFloat(e.target.value) || 0 })}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'پیکربندی کریستال مونوموناتور' : 'Optics Configuration Preset'}
                  </label>
                  <select
                    onChange={(e) => setConfig({ ...config, beamDivergence: parseFloat(e.target.value) })}
                    value={config.beamDivergence}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                  >
                    <option value={0.002}>Ge(220) 4-Bounce Monochromator (0.002° - High Res)</option>
                    <option value={0.010}>Goebel Parallel Beam X-Ray Mirror (0.010° - Standard)</option>
                    <option value={0.025}>Bragg-Brentano Slit Optics (0.025° - Divergent)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Footprint Loss & Beam Geometry Spillover */}
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-amber-500" />
                  {isRTL ? 'هندسه پرتو و سرریز روی نمونه (Footprint Loss)' : 'Beam Geometry & Footprint Spillover'}
                </span>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, footprintCorrection: !config.footprintCorrection })}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    config.footprintCorrection
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {config.footprintCorrection ? (isRTL ? 'اصلاح سرریز فعال' : 'Footprint Active') : (isRTL ? 'اصلاح غیرفعال' : 'Footprint Off')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'عرض شکاف پرتو w (mm)' : 'Beam Slit Width w (mm)'}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="2.0"
                    value={config.beamWidthMm || 0.2}
                    onChange={(e) => setConfig({ ...config, beamWidthMm: parseFloat(e.target.value) || 0.2 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'طول نمونه L (mm)' : 'Sample Length L (mm)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="100"
                    value={config.sampleLengthMm || 20.0}
                    onChange={(e) => setConfig({ ...config, sampleLengthMm: parseFloat(e.target.value) || 20.0 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500">
                    {isRTL ? 'زمان مکث هر نقطه (ثانیه)' : 'Dwell Time per Step (s)'}
                  </label>
                  <select
                    value={dwellTime}
                    onChange={(e) => setDwellTime(parseFloat(e.target.value) || 1.0)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                  >
                    <option value={0.1}>0.1s (Fast Survey)</option>
                    <option value={0.5}>0.5s (Standard)</option>
                    <option value={1.0}>1.0s (High Count Statistics)</option>
                    <option value={2.0}>2.0s (Deep Specular Precision)</option>
                    <option value={5.0}>5.0s (Ultra-Low Noise)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Monte Carlo Sensitivity & Uncertainty Envelope */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  {isRTL ? 'آنالیز حساسیت مونت‌کارلو (نوار اطمینان ۹۵٪)' : 'Monte Carlo Sensitivity & 95% Confidence Band'}
                </span>
                <button
                  type="button"
                  onClick={() => setEnableMonteCarlo(!enableMonteCarlo)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    enableMonteCarlo
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {enableMonteCarlo ? (isRTL ? 'نوار اطمینان فعال' : 'MC Band On') : (isRTL ? 'غیرفعال' : 'MC Band Off')}
                </button>
              </div>

              {enableMonteCarlo && (
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                    <span>{isRTL ? 'ميزان اختلال پارامترها (±%)' : 'Parameter Perturbation Variance (±%)'}</span>
                    <span className="text-indigo-500 font-bold">±{mcVariationPct}%</span>
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.5"
                    value={mcVariationPct}
                    onChange={(e) => setMcVariationPct(parseFloat(e.target.value) || 5.0)}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {isRTL
                      ? 'اجرای ۳۰ شبیه‌سازی تصادفی برای استخراج نوار نوسان اطمینان ۹۵٪ پیرامون منحنی بازتابش'
                      : 'Executes 25 Monte Carlo trials with random parameter noise to visualize confidence intervals.'}
                  </p>
                </div>
              )}
            </div>

            {/* Section 5: Noise Floor, Roughness Damping & Scale Factor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Background Noise Floor */}
              <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                  <span>{isRTL ? 'کف نویز آشکارساز' : 'Background Floor (I_bg)'}</span>
                  <span className="text-rose-500 font-bold">{config.background.toExponential(1)}</span>
                </label>
                <select
                  value={config.background}
                  onChange={(e) => setConfig({ ...config, background: parseFloat(e.target.value) })}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value={1e-8}>10⁻⁸ (Hybrid Pixel Zero-Noise)</option>
                  <option value={1e-7}>10⁻⁷ (Low Noise PMT Counter)</option>
                  <option value={1e-6}>10⁻⁶ (Standard Scintillator)</option>
                  <option value={1e-5}>10⁻⁵ (High Diffuse Background)</option>
                </select>
              </div>

              {/* Roughness Model */}
              <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500">
                  {isRTL ? 'مدل ميرايي زبري' : 'Interface Roughness Model'}
                </label>
                <select
                  value={config.roughnessModel || 'nevot-croce'}
                  onChange={(e) => setConfig({ ...config, roughnessModel: e.target.value as any })}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="nevot-croce">Névot-Croce [exp(-2 · kj · kj+1 · σ²)]</option>
                  <option value="debye-waller">Debye-Waller [exp(-2 · kj² · σ²)]</option>
                </select>
              </div>

              {/* Intensity Scale Multiplier */}
              <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                  <span>{isRTL ? 'ضریب مقیاس شدت' : 'Intensity Scale Factor'}</span>
                  <span className="text-cyan-500 font-bold">{config.intensityScale || 1.0}</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="10.0"
                  value={config.intensityScale || 1.0}
                  onChange={(e) => setConfig({ ...config, intensityScale: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
            </>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Plots & Physics Analytics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visualizer Panel Container */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* View Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'reflectivity', label: isRTL ? 'منحنی بازتاب (R vs θ)' : 'Reflectivity Curve', icon: Activity },
                  { id: 'sld', label: isRTL ? 'پروفایل عمقی SLD / ρ' : 'SLD / Density Profile', icon: BarChart3 },
                  { id: 'fittings', label: isRTL ? 'پالایش و برازش خودکار' : 'Auto-Refining Fit', icon: RefreshCw },
                  { id: 'python', label: 'Python Code', icon: Terminal },
                  { id: 'theory', label: isRTL ? 'راهنمای تئوری' : 'Theory Manual', icon: BookOpen }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Angle Display Unit Control */}
              {activeTab === 'reflectivity' && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold">
                  <span className="text-slate-400 px-2">X-Axis:</span>
                  {[
                    { id: 'theta', label: 'θ (°)' },
                    { id: 'twoTheta', label: '2θ (°)' },
                    { id: 'qz', label: 'qz (Å⁻¹)' }
                  ].map(u => (
                    <button
                      key={u.id}
                      onClick={() => setConfig({ ...config, angleUnit: u.id as any })}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        config.angleUnit === u.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB 1: Reflectivity Curve Chart */}
            {activeTab === 'reflectivity' && (
              <div className="space-y-6">
                <div className="h-[400px] w-full relative bg-slate-900/5 dark:bg-[#0b1121] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-2 shadow-inner overflow-hidden">
                  {/* Subtle background gradient glow behind the chart */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-cyan-500/10 dark:bg-cyan-500/5 blur-[80px] pointer-events-none rounded-full" />
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reflectivityData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey={config.angleUnit === 'twoTheta' ? 'twoTheta' : config.angleUnit === 'qz' ? 'qz' : 'theta'}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(v) => Number(v).toFixed(2)}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{
                          value: config.angleUnit === 'twoTheta' ? 'Scattering Angle 2θ (°)' : config.angleUnit === 'qz' ? 'Scattering Vector qz (Å⁻¹)' : 'Incident Angle θ (°)',
                          position: 'insideBottom',
                          offset: -15,
                          fill: '#64748b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      />
                      <YAxis
                        scale="log"
                        domain={[config.background, 1.2]}
                        allowDataOverflow
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(v) => v >= 0.01 ? v.toFixed(2) : v.toExponential(0)}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{ value: 'Specular Reflectivity R', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '16px', fontSize: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 600 }}
                        formatter={(val: any) => [typeof val === 'number' ? val.toExponential(4) : val, 'Reflectivity R']}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '10px' }} iconType="circle" />

                      {/* Calculated Parratt Curve (Glow Effect) */}
                      <Line
                        type="monotone"
                        dataKey="rCalc"
                        stroke="#0891b2"
                        strokeWidth={6}
                        strokeOpacity={0.2}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={false}
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="rCalc"
                        name="Parratt Theoretical Model"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Ideal Fresnel Substrate Baseline */}
                      <Line
                        type="monotone"
                        dataKey="fresnelR"
                        name="Ideal Substrate Fresnel R"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        isAnimationActive={false}
                      />

                      {/* Experimental Overlay */}
                      {expData && (
                        <Line
                          type="monotone"
                          dataKey="rExp"
                          name="Experimental XRR Scan"
                          stroke="#f59e0b"
                          strokeWidth={0}
                          dot={{ r: 3, fill: '#f59e0b', fillOpacity: 0.8 }}
                          activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff' }}
                          isAnimationActive={false}
                        />
                      )}

                      {/* Critical Angle Line Marker */}
                      {criticalResult && (
                        <ReferenceLine
                          x={config.angleUnit === 'twoTheta' ? criticalResult.thetaCritDeg * 2 : config.angleUnit === 'qz' ? criticalResult.qzCrit : criticalResult.thetaCritDeg}
                          stroke="#ef4444"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          strokeOpacity={0.7}
                          label={{ value: `θc = ${criticalResult.thetaCritDeg.toFixed(3)}°`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold', position: 'insideTopLeft', offset: 10 }}
                        />
                      )}

                      {/* Superlattice Satellite Bragg Peak Reference Lines */}
                      {superlatticeResult && superlatticeResult.peaks.map((p, idx) => (
                        <ReferenceLine
                          key={p.label}
                          x={config.angleUnit === 'twoTheta' ? p.twoThetaDeg : config.angleUnit === 'qz' ? p.qz : p.thetaDeg}
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          strokeOpacity={0.6}
                          label={{ value: p.label, fill: '#10b981', fontSize: 11, fontWeight: 'bold', position: 'insideTopRight', offset: 10 + (idx % 2) * 15 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Physics Metrics & Kiessig / Superlattice Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Kiessig Fringes Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-cyan-500/5 space-y-3 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white relative z-10">
                      <span className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                        <Activity className="w-4 h-4" />
                        {isRTL ? 'نوسانات کیسیک' : 'Kiessig Fringes'}
                      </span>
                      {kiessigResult && (
                        <span className="font-mono text-cyan-500 dark:text-cyan-300 font-black text-base">{kiessigResult.estimatedThickness} Å</span>
                      )}
                    </div>

                    {kiessigResult ? (
                      <div className="text-xs space-y-2 font-mono text-slate-600 dark:text-slate-400 relative z-10">
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'دوره تناوب Δqz:' : 'Fringe Δqz:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{kiessigResult.periodQz.toFixed(4)} Å⁻¹</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'تناوب Δθ:' : 'Period Δθ:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{kiessigResult.periodTheta.toFixed(3)}°</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'ضخامت d:' : 'Thickness d:'}</span>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">2π / Δqz</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[90px] relative z-10">
                        <p className="text-xs text-slate-400/80 italic text-center px-4">
                          {isRTL ? 'برای محاسبه کیسیک حداقل ۲ پیک نوسان نیاز است.' : 'At least 2 fringe peaks needed.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Critical Angle Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-rose-500/5 space-y-3 relative overflow-hidden group hover:border-rose-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white relative z-10">
                      <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <Target className="w-4 h-4" />
                        {isRTL ? 'زاویه بحرانی' : 'Critical Angle θc'}
                      </span>
                      {criticalResult && (
                        <span className="font-mono text-rose-500 dark:text-rose-400 font-black text-base">{criticalResult.thetaCritDeg.toFixed(3)}°</span>
                      )}
                    </div>

                    {criticalResult ? (
                      <div className="text-xs space-y-2 font-mono text-slate-600 dark:text-slate-400 relative z-10">
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'بردار qc:' : 'Vector qc:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{criticalResult.qzCrit} Å⁻¹</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'چگالی سطح:' : 'Surface ρ:'}</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">{criticalResult.densityEst} g/cm³</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'رابطه:' : 'Formula:'}</span>
                          <span className="font-bold text-slate-500">θc ∝ √ρ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[90px] relative z-10">
                        <p className="text-xs text-slate-400/80 italic text-center px-4">
                          {isRTL ? 'زاویه بحرانی شناسایی نشد.' : 'Not detected in range.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Superlattice Bragg Satellites Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-emerald-500/5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white relative z-10">
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Zap className="w-4 h-4" />
                        {isRTL ? 'سوپرلاتیست براج' : 'Superlattice Period'}
                      </span>
                      {superlatticeResult && (
                        <span className="font-mono text-emerald-500 dark:text-emerald-400 font-black text-base">Λ = {superlatticeResult.period} Å</span>
                      )}
                    </div>

                    {superlatticeResult && superlatticeResult.peaks.length > 0 ? (
                      <div className="text-xs space-y-2 font-mono text-slate-600 dark:text-slate-400 relative z-10">
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'تعداد پیک ماهواره:' : 'Satellite Peaks:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{superlatticeResult.peaks.length} orders</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'پیک اول (SL-1):' : 'First Order SL-1:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{superlatticeResult.peaks[0].thetaDeg}° θ</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'شرایط براج:' : 'Bragg Law:'}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">mλ = 2Λ sinθ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[90px] relative z-10">
                        <p className="text-xs text-slate-400/80 italic text-center px-4">
                          {isRTL ? 'ساختار متناوب (Superlattice) شناسایی نشد.' : 'No periodic bilayer detected.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experimental Fit Quality & Optimization Tools */}
                {expData && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>{isRTL ? 'شاخص‌های برازش با اسکن تجربی' : 'Experimental Fit Residuals'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        Log-RMSE: <b className="text-cyan-300">{fitMetrics.logRmse}</b> • Rwp: <b className="text-amber-300">{fitMetrics.rwp}%</b>
                      </div>
                    </div>

                    <button
                      onClick={handleRunAutoFit}
                      disabled={isFitting}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFitting ? 'animate-spin' : ''}`} />
                      <span>{isFitting ? (isRTL ? 'در حال بهینه‌سازی...' : 'Refining...') : (isRTL ? 'پالایش خودکار پارامترها' : 'Auto-Refine Fit')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Real-Space SLD Depth Profile Chart */}
            {activeTab === 'sld' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-400 leading-relaxed max-w-xl">
                    {isRTL
                      ? 'پروفایل عمقی چگالی ماده، چگالی الکترونی و ضرایب اپتیکی (SLD) در طول عمق z از سطح بالای فیلم تا زیرلایه.'
                      : 'Real-space depth profile of scattering length density (SLD), mass density, electron density, and optical constants.'}
                  </div>

                  {/* SLD Metric Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setSldMetric('density')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'density' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      ρ (g/cm³)
                    </button>
                    <button
                      onClick={() => setSldMetric('electronDensity')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'electronDensity' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      ρ_e (e⁻/Å³)
                    </button>
                    <button
                      onClick={() => setSldMetric('delta')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'delta' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      δ (×10⁻⁶)
                    </button>
                    <button
                      onClick={() => setSldMetric('beta')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'beta' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      β (×10⁻⁷)
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full relative bg-slate-900/5 dark:bg-[#0b1121] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-2 shadow-inner overflow-hidden">
                  {/* Subtle background gradient glow behind the chart */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 blur-[80px] pointer-events-none rounded-full transition-colors duration-700 ${sldMetric === 'density' ? 'bg-cyan-500/10' : sldMetric === 'electronDensity' ? 'bg-indigo-500/10' : sldMetric === 'delta' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sldProfile} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                      <defs>
                        <linearGradient id="sldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={sldMetric === 'density' ? '#06b6d4' : sldMetric === 'electronDensity' ? '#6366f1' : sldMetric === 'delta' ? '#10b981' : '#f59e0b'} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={sldMetric === 'density' ? '#06b6d4' : sldMetric === 'electronDensity' ? '#6366f1' : sldMetric === 'delta' ? '#10b981' : '#f59e0b'} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="z"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(v) => `${v.toFixed(0)} Å`}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{ value: 'Depth z from Top Surface (Å)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{
                          value: sldMetric === 'density' ? 'Mass Density ρ (g/cm³)' : sldMetric === 'electronDensity' ? 'Electron Density ρ_e (e⁻/Å³)' : sldMetric === 'delta' ? 'Dispersion δ (×10⁻⁶)' : 'Absorption β (×10⁻⁷)',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#64748b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '16px', fontSize: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ fontWeight: 600 }}
                        labelFormatter={(z) => `Depth: ${z} Å`}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '10px' }} iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey={sldMetric}
                        name={sldMetric === 'density' ? 'Mass Density ρ (g/cm³)' : sldMetric === 'electronDensity' ? 'Electron Density ρ_e (e⁻/Å³)' : sldMetric === 'delta' ? 'Dispersion δ (×10⁻⁶)' : 'Absorption β (×10⁻⁷)'}
                        stroke={sldMetric === 'density' ? '#06b6d4' : sldMetric === 'electronDensity' ? '#6366f1' : sldMetric === 'delta' ? '#10b981' : '#f59e0b'}
                        fill="url(#sldGrad)"
                        strokeWidth={3}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 3: Auto-Refining Parameter Optimization Engine */}
            {activeTab === 'fittings' && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>{isRTL ? 'موتور بهینه‌سازی و پالایش پارامترها (Non-Linear Fitting)' : 'Non-Linear Parameter Optimization Engine'}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {isRTL
                          ? 'پالایش الگوریتمی ضخامت لایه‌ها، زبری صفحات فصلی و چگالی ماده برای کمینه‌سازی خطا در برابر اسکن تجربی'
                          : 'Automated gradient relaxation & stochastic perturbation to minimize Log-RMSE residuals against experimental scan data.'}
                      </p>
                    </div>

                    <button
                      onClick={handleRunAutoFit}
                      disabled={isFitting || !expData}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 whitespace-nowrap"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFitting ? 'animate-spin' : ''}`} />
                      <span>{isFitting ? (isRTL ? 'در حال بهینه‌سازی...' : 'Optimizing...') : (isRTL ? 'شروع پالایش خودکار' : 'Start Auto-Refine Fit')}</span>
                    </button>
                  </div>

                  {/* Fit Targets Configuration */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800 text-xs">
                    <span className="font-mono text-slate-400 font-bold">{isRTL ? 'پارامترهای قابل تغییر:' : 'Fit Targets:'}</span>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={fitOptions.fitThickness}
                        onChange={(e) => setFitOptions({ ...fitOptions, fitThickness: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{isRTL ? 'ضخامت (Thickness d)' : 'Thickness (d)'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={fitOptions.fitRoughness}
                        onChange={(e) => setFitOptions({ ...fitOptions, fitRoughness: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{isRTL ? 'زبری (Roughness σ)' : 'Roughness (σ)'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={fitOptions.fitDensity}
                        onChange={(e) => setFitOptions({ ...fitOptions, fitDensity: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{isRTL ? 'چگالی (Density ρ)' : 'Density (ρ)'}</span>
                    </label>
                  </div>

                  {/* Progress Bar during fitting */}
                  {isFitting && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-mono font-bold text-amber-400">
                        <span>{isRTL ? 'در حال همگرایی پارامترها...' : 'Optimizing fit residuals...'}</span>
                        <span>{fitProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-cyan-500 transition-all duration-150"
                          style={{ width: `${fitProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!expData ? (
                  <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                    <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-amber-300">
                      {isRTL ? 'داده‌های تجربی بارگذاری نشده است' : 'No Experimental Scan Loaded'}
                    </h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      {isRTL
                        ? 'لطفاً ابتدا داده‌های تجربی XRR را با دکمه "بارگذاری اسکن تجربی" وارد کنید تا موتور برازش بتواند پارامترها را تنظیم کند.'
                        : 'Import experimental XRR scan data (Angle vs Intensity) to allow the optimizer to minimize residuals.'}
                    </p>
                    <button
                      onClick={() => setShowExpModal(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isRTL ? 'بارگذاری اسکن تجربی' : 'Import Experimental Data'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Residuals Convergence Chart */}
                    {fitLogs.length > 0 && (
                      <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <span>{isRTL ? 'مسیر همگرایی خطا (Log-RMSE vs Iteration)' : 'Convergence Trajectory (Log-RMSE vs Iteration)'}</span>
                          </span>
                          <span className="font-mono text-cyan-400">
                            Min Log-RMSE = {fitMetrics.logRmse} • Rwp = {fitMetrics.rwp}%
                          </span>
                        </div>

                        <div className="h-[220px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fitLogs} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                              <XAxis dataKey="iteration" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Iteration Step', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'Log-RMSE', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                              <Line type="monotone" dataKey="logRmse" stroke="#06b6d4" strokeWidth={2} dot={false} name="Log-RMSE Residual" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Current Fit Residual Metrics Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">{isRTL ? 'شاخص Log-RMSE' : 'Log-RMSE Residual'}</div>
                        <div className="text-xl font-mono font-black text-cyan-400">{fitMetrics.logRmse}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">{isRTL ? 'ضریب Weighted Profile R_wp' : 'Weighted Residual R_wp'}</div>
                        <div className="text-xl font-mono font-black text-amber-400">{fitMetrics.rwp}%</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">{isRTL ? 'تعداد لایه‌های تحت پالایش' : 'Fitted Layers'}</div>
                        <div className="text-xl font-mono font-black text-indigo-400">{layers.length - 1} Films</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Python Script Exporter */}
            {activeTab === 'python' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>SciPy / Refnx Python Automation Code</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pythonScript);
                      setCopiedPython(true);
                      setTimeout(() => setCopiedPython(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPython ? (isRTL ? 'کپی شد!' : 'Copied!') : (isRTL ? 'کپی اسکریپت' : 'Copy Script')}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto custom-scrollbar border border-slate-800 leading-relaxed max-h-[420px]">
                  {pythonScript}
                </pre>
              </div>
            )}

            {/* TAB 4: Theory Reference Manual */}
            {activeTab === 'theory' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[440px] overflow-y-auto custom-scrollbar pr-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>1. Parratt's Formalism for XRR Specular Reflectivity</span>
                  </h4>
                  <p>
                    X-Ray Reflectometry measures grazing incidence specular reflection R(θ) = |R₀|² at small angles (0° &lt; θ &lt; 5°).
                    The complex refractive index for X-rays in matter is:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-cyan-300 text-center">
                    n = 1 - δ - iβ
                  </div>
                  <p>
                    where δ ∝ ρ is the dispersion term (proportional to electron density / mass density) and β is the photoelectric absorption term.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>2. Névot-Croce Interface Roughness Attenuation</span>
                  </h4>
                  <p>
                    Interfacial RMS roughness σ<sub>j</sub> damps the ideal Fresnel reflection coefficient r<sub>j, j+1</sub> via the Névot-Croce factor:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-indigo-300 text-center">
                    r_rough = r_Fresnel × exp(-2 · k<sub>z,j</sub> · k<sub>z,j+1</sub> · σ<sub>j</sub>²)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>3. Kiessig Fringes & Thickness Extraction</span>
                  </h4>
                  <p>
                    Interference fringes occur between top surface and substrate reflections. The fringe period Δq<sub>z</sub> yields direct layer thickness:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-amber-300 text-center">
                    d_film = 2π / Δq<sub>z</sub> = λ / (2 · Δθ · cos θ₀)
                  </div>
                </div>
              </div>
            )}

            {/* Export Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Parratt Engine • Névot-Croce Model</span>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-cyan-500" />
                <span>{isRTL ? 'خروجی CSV' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Experimental Scan Import Modal */}
      <AnimatePresence>
        {showExpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold">{isRTL ? 'بارگذاری اسکن تجربی XRR' : 'Import Experimental XRR Scan'}</h3>
                </div>
                <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                {isRTL ? 'داده‌های اسکن را در قالب دو ستون (زاویه و شدت) در کادر زیر وارد یا پیست کنید:' : 'Paste two-column experimental scan data (Angle vs Intensity):'}
              </p>

              <textarea
                value={expDataRaw}
                onChange={(e) => setExpDataRaw(e.target.value)}
                placeholder={`0.10   1.000\n0.15   0.985\n0.20   0.850\n0.25   0.420\n...`}
                className="w-full h-48 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 outline-none focus:border-cyan-500"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowExpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  {isRTL ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  onClick={handleParseExpData}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  {isRTL ? 'اعمال داده‌ها' : 'Apply Experimental Data'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Superlattice Multilayer Generator Modal */}
      <AnimatePresence>
        {showSLModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isRTL ? 'سازنده ساختار سوپرلاتیست' : 'Superlattice Multilayer Generator'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isRTL ? 'ایجاد خودکار ساختارهای متناوب [A / B]×N' : 'Auto-build periodic [A / B] × N bilayer stack'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSLModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3.5">
                {/* Layer A */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-500">
                    <span>Layer A (Bilayer Component 1)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={slMatA}
                      onChange={(e) => setSlMatA(e.target.value)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      {customMaterials.length > 0 && (
                        <optgroup label="Custom & Synthesis Materials">
                          {customMaterials.map(m => (
                            <option key={m.name} value={m.name}>✨ {m.name}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Standard Library">
                        {MATERIAL_PRESETS.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={slThickA}
                        onChange={(e) => setSlThickA(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                      <span className="text-xs font-mono text-slate-400">Å</span>
                    </div>
                  </div>
                </div>

                {/* Layer B */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-500">
                    <span>Layer B (Bilayer Component 2)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={slMatB}
                      onChange={(e) => setSlMatB(e.target.value)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      {customMaterials.length > 0 && (
                        <optgroup label="Custom & Synthesis Materials">
                          {customMaterials.map(m => (
                            <option key={m.name} value={m.name}>✨ {m.name}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Standard Library">
                        {MATERIAL_PRESETS.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={slThickB}
                        onChange={(e) => setSlThickB(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                      <span className="text-xs font-mono text-slate-400">Å</span>
                    </div>
                  </div>
                </div>

                {/* Repeats N & Substrate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Periods N (Repeats)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={slRepeats}
                      onChange={(e) => setSlRepeats(parseInt(e.target.value) || 1)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Substrate Material
                    </label>
                    <select
                      value={slSubstrate}
                      onChange={(e) => setSlSubstrate(e.target.value)}
                      className="w-full mt-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      {customMaterials.length > 0 && (
                        <optgroup label="Custom & Synthesis Materials">
                          {customMaterials.map(m => (
                            <option key={m.name} value={m.name}>✨ {m.name}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Standard Library">
                        {MATERIAL_PRESETS.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Optional Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Capping Layer (Top)
                    </label>
                    <select
                      value={slCapMat}
                      onChange={(e) => setSlCapMat(e.target.value)}
                      className="w-full mt-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      <option value="None">None</option>
                      {customMaterials.length > 0 && (
                        <optgroup label="Custom & Synthesis Materials">
                          {customMaterials.map(m => (
                            <option key={m.name} value={m.name}>✨ {m.name}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Standard Library">
                        {MATERIAL_PRESETS.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  {slCapMat !== 'None' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Cap Thickness (Å)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={slCapThick}
                        onChange={(e) => setSlCapThick(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Period Calculations Summary */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1 font-mono text-amber-700 dark:text-amber-300">
                  <div className="flex justify-between font-bold">
                    <span>Bilayer Period Λ = dA + dB:</span>
                    <span>{slThickA + slThickB} Å ({((slThickA + slThickB) / 10).toFixed(1)} nm)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated Film Layers:</span>
                    <span>{slRepeats * 2 + (slCapMat !== 'None' ? 1 : 0)} layers</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Stack Film Thickness:</span>
                    <span>{slRepeats * (slThickA + slThickB) + (slCapMat !== 'None' ? slCapThick : 0)} Å</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowSLModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuildSuperlatticeStack}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Generate Superlattice Stack
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom & Synthesis Material Library Modal */}
        {showCustomMatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-500">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isRTL ? 'مدیریت مواد سفارشی و سنتزی' : 'Custom & Synthesis Material Library'}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {customMaterials.length} Custom Presets
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isRTL
                        ? 'تعریف و ذخیره مواد جدید با مشخصات چگالی ρ، پراکندگی نوری δ و جذب β به صورت دستی'
                        : 'Define custom materials with specific mass density (ρ), optical dispersion (δ), and absorption (β)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomMatModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Synthesis Templates Bar */}
              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRTL ? 'الگوهای سریع سنتزی:' : 'Quick Synthesis Templates:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'MAPbI3 Perovskite', density: 4.16, delta: 13.8, beta: 0.95, color: '#f59e0b', cat: 'Synthesis / Custom', notes: 'Spin-coated organometallic halide perovskite absorber film.' },
                    { name: 'Graphene Oxide (GO)', density: 1.80, delta: 5.85, beta: 0.12, color: '#10b981', cat: 'Organics', notes: 'Exfoliated graphene oxide thin film coating.' },
                    { name: 'Sputtered TiN Hard Coating', density: 5.22, delta: 16.4, beta: 1.25, color: '#eab308', cat: 'Synthesis / Custom', notes: 'Reactive sputtered titanium nitride ceramic barrier.' },
                    { name: 'PZT Ferroelectric Film', density: 7.60, delta: 23.1, beta: 2.10, color: '#ec4899', cat: 'Synthesis / Custom', notes: 'Sol-gel synthesized Pb(Zr,Ti)O3 ferroelectric layer.' },
                    { name: 'PEDOT:PSS Conductive Polymer', density: 1.06, delta: 3.45, beta: 0.065, color: '#3b82f6', cat: 'Organics', notes: 'Spin-coated conductive polymer buffer layer.' }
                  ].map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => {
                        setMatForm({
                          name: tpl.name,
                          density: tpl.density,
                          delta: tpl.delta,
                          beta: tpl.beta,
                          category: tpl.cat,
                          color: tpl.color,
                          notes: tpl.notes,
                          autoCalc: false
                        });
                        setEditingMatIndex(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300 hover:text-purple-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tpl.color }} />
                      <span>+ {tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content: Form & Library List */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Material Editor Form */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-indigo-500 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      {editingMatIndex !== null ? 'Edit Custom Material' : 'Add New Custom Material'}
                    </span>
                    {editingMatIndex !== null && (
                      <button
                        onClick={() => handleOpenNewCustomMat()}
                        className="text-[10px] font-mono text-purple-400 hover:underline"
                      >
                        Reset Form
                      </button>
                    )}
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Material Name / Formula
                    </label>
                    <input
                      type="text"
                      value={matForm.name}
                      onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                      placeholder="e.g. Synthesis Material, MAPbI3, TiN..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Category & Color Picker */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <select
                        value={matForm.category}
                        onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Synthesis / Custom">Synthesis / Custom</option>
                        <option value="Oxides">Oxides</option>
                        <option value="Metals">Metals</option>
                        <option value="Semiconductors">Semiconductors</option>
                        <option value="Organics">Organics</option>
                        <option value="Substrates">Substrates</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Theme Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={matForm.color}
                          onChange={(e) => setMatForm({ ...matForm, color: e.target.value })}
                          className="w-8 h-8 rounded-xl border-0 cursor-pointer p-0 appearance-none bg-transparent"
                        />
                        <span className="font-mono text-xs font-bold text-slate-500 uppercase">{matForm.color}</span>
                      </div>
                    </div>
                  </div>

                  {/* Density Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>Mass Density ρ (g/cm³)</span>
                      <span className="font-mono text-indigo-400">{matForm.density} g/cm³</span>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="25.0"
                      value={matForm.density}
                      onChange={(e) => {
                        const d = parseFloat(e.target.value) || 0.1;
                        if (matForm.autoCalc) {
                          setMatForm({
                            ...matForm,
                            density: d,
                            delta: Number((3.24 * d).toFixed(2)),
                            beta: Number((0.075 * d).toFixed(3))
                          });
                        } else {
                          setMatForm({ ...matForm, density: d });
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-purple-500"
                    />
                    <input
                      type="range"
                      min="0.5"
                      max="22.0"
                      step="0.1"
                      value={matForm.density}
                      onChange={(e) => {
                        const d = parseFloat(e.target.value);
                        if (matForm.autoCalc) {
                          setMatForm({
                            ...matForm,
                            density: d,
                            delta: Number((3.24 * d).toFixed(2)),
                            beta: Number((0.075 * d).toFixed(3))
                          });
                        } else {
                          setMatForm({ ...matForm, density: d });
                        }
                      }}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* Auto-Calculate Dispersion Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="autoCalcCheck"
                      checked={matForm.autoCalc}
                      onChange={(e) => {
                        const auto = e.target.checked;
                        if (auto) {
                          setMatForm({
                            ...matForm,
                            autoCalc: true,
                            delta: Number((3.24 * matForm.density).toFixed(2)),
                            beta: Number((0.075 * matForm.density).toFixed(3))
                          });
                        } else {
                          setMatForm({ ...matForm, autoCalc: false });
                        }
                      }}
                      className="rounded accent-purple-500 cursor-pointer"
                    />
                    <label htmlFor="autoCalcCheck" className="text-[10px] font-mono font-bold text-slate-500 cursor-pointer">
                      Auto-estimate δ & β from mass density ρ
                    </label>
                  </div>

                  {/* Dispersion δ & Absorption β Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500">
                        Dispersion δ (× 10⁻⁶)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={matForm.delta}
                        onChange={(e) => setMatForm({ ...matForm, delta: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500">
                        Absorption β (× 10⁻⁷)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={matForm.beta}
                        onChange={(e) => setMatForm({ ...matForm, beta: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Theoretical Critical Angle Preview */}
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono text-purple-300 flex justify-between items-center">
                    <span>Est. Critical Angle θc (Cu K-α):</span>
                    <span className="font-bold text-xs text-white">
                      {Math.sqrt(2 * (matForm.delta * 1e-6)) * (180 / Math.PI) > 0
                        ? (Math.sqrt(2 * (matForm.delta * 1e-6)) * (180 / Math.PI)).toFixed(3)
                        : '0.000'}° θ
                    </span>
                  </div>

                  {/* Recipe & Synthesis Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Synthesis Parameters & Notes
                    </label>
                    <textarea
                      rows={2}
                      value={matForm.notes}
                      onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })}
                      placeholder="e.g. Synthesis method (PLD/ALD/Sol-Gel), temperature, gas pressure..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveCustomMat}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingMatIndex !== null ? 'Update Custom Material' : 'Save Material to Library'}</span>
                  </button>
                </div>

                {/* Right: Custom Materials Library List */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                      Saved Custom Materials ({customMaterials.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCustomLibrary}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono flex items-center gap-1 transition-colors cursor-pointer"
                        title="Export custom materials library as JSON"
                      >
                        <Download className="w-3 h-3 text-purple-400" />
                        <span>Export JSON</span>
                      </button>

                      <label className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono flex items-center gap-1 transition-colors cursor-pointer">
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>Import JSON</span>
                        <input type="file" accept=".json" onChange={handleImportCustomLibrary} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {customMaterials.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <BookmarkPlus className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                      <p className="text-xs font-bold text-slate-500">No custom materials saved yet</p>
                      <p className="text-[11px] text-slate-400">Use the form or quick templates on the left to add synthesis materials.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
                      {customMaterials.map((mat, idx) => (
                        <div
                          key={`${mat.name}-${idx}`}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: mat.color }} />
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px]">
                                {mat.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-mono font-bold shrink-0">
                                {mat.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  // Add material directly as a new film layer
                                  const newLayer: XRRLayer = {
                                    id: `custom-layer-${Date.now()}`,
                                    name: mat.name,
                                    thickness: 100,
                                    roughness: 4.0,
                                    density: mat.density,
                                    delta: mat.delta,
                                    beta: mat.beta,
                                    color: mat.color
                                  };
                                  setLayers([newLayer, ...layers]);
                                  setShowCustomMatModal(false);
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Add directly to film stack"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>Apply to Stack</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditCustomMat(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                                title="Edit Custom Material"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteCustomMat(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete Custom Material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] bg-white dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <div>
                              <span className="text-slate-400 block">Density ρ:</span>
                              <span className="font-bold text-slate-200">{mat.density} g/cm³</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Dispersion δ:</span>
                              <span className="font-bold text-indigo-400">{mat.delta} × 10⁻⁶</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Absorption β:</span>
                              <span className="font-bold text-cyan-400">{mat.beta} × 10⁻⁷</span>
                            </div>
                          </div>

                          {mat.notes && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-2 bg-slate-100/50 dark:bg-slate-900/40 px-2 py-1 rounded-lg">
                              "{mat.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowCustomMatModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Library
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
