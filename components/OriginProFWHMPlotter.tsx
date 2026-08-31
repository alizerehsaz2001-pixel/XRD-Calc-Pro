import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Sliders, Sparkles, RefreshCw, Download, Copy, Check, Eye, Maximize2, 
  BookOpen, Code, Terminal, Layers, Palette, Info, HelpCircle, FileText, ChevronRight,
  TrendingUp, CheckCircle2, AlertCircle, ShieldAlert, Cpu, Upload, Plus, Trash2,
  FileCode, Play, Zap, BarChart2, Table, Compass
} from 'lucide-react';

export interface DeconvSubPeak {
  id: string;
  label: string;
  center: number;
  fwhm: number;
  height: number;
  eta: number;
  profileType: 'pseudo_voigt' | 'gaussian' | 'lorentzian' | 'pearson7' | 'asymmetric';
  color: string;
}

export const OriginProFWHMPlotter: React.FC = () => {
  // Mode selection
  const [dataMode, setDataMode] = useState<'synthetic' | 'experimental'>('synthetic');

  // Peak parameters
  const [center, setCenter] = useState<number>(28.442);
  const [fwhm, setFwhm] = useState<number>(0.285);
  const [profileType, setProfileType] = useState<'pseudo_voigt' | 'gaussian' | 'lorentzian' | 'true_voigt' | 'pearson7' | 'asymmetric' | 'ka_doublet'>('pseudo_voigt');
  const [eta, setEta] = useState<number>(0.50);
  const [pearsonM, setPearsonM] = useState<number>(2.0);
  const [asymmetry, setAsymmetry] = useState<number>(1.15);
  const [height, setHeight] = useState<number>(1000.0);
  
  // Background & Instrument
  const [bgConst, setBgConst] = useState<number>(60.0);
  const [bgSlope, setBgSlope] = useState<number>(0.5);
  const [bgQuad, setBgQuad] = useState<number>(0.0);
  const [bgType, setBgType] = useState<'constant' | 'linear' | 'quadratic'>('linear');
  const [instFwhm, setInstFwhm] = useState<number>(0.085);
  const [wavelength, setWavelength] = useState<number>(0.154056); // Cu Ka1 (nm)
  const [wavelength2, setWavelength2] = useState<number>(0.154439); // Cu Ka2 (nm)
  const [kaRatio, setKaRatio] = useState<number>(0.50);
  
  // Numerical & Display options
  const [noisePct, setNoisePct] = useState<number>(2.5);
  const [xSpan, setXSpan] = useState<number>(3.5);
  const [dpi, setDpi] = useState<number>(220);
  const [theme, setTheme] = useState<'origin_classic' | 'nature' | 'acs_nano' | 'elsevier' | 'dark_lab'>('origin_classic');
  const [showResidual, setShowResidual] = useState<boolean>(true);
  const [showFwhmBracket, setShowFwhmBracket] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(true);
  const [showDeconvPeaks, setShowDeconvPeaks] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  
  // Multi-peak deconvolution mode
  const [isMultiPeakMode, setIsMultiPeakMode] = useState<boolean>(false);
  const [deconvPeaks, setDeconvPeaks] = useState<DeconvSubPeak[]>([
    { id: '1', label: 'Phase A (Primary)', center: 28.442, fwhm: 0.285, height: 1000, eta: 0.50, profileType: 'pseudo_voigt', color: '#2563EB' },
    { id: '2', label: 'Phase B (Secondary)', center: 28.950, fwhm: 0.340, height: 420, eta: 0.60, profileType: 'pseudo_voigt', color: '#16A34A' }
  ]);

  // Experimental Raw Data Upload state
  const [rawText, setRawText] = useState<string>('');
  const [parsedPointsCount, setParsedPointsCount] = useState<number>(0);
  const [rawX, setRawX] = useState<number[] | null>(null);
  const [rawY, setRawY] = useState<number[] | null>(null);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Output State
  const [plotImage, setPlotImage] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [pythonScript, setPythonScript] = useState<string>('');
  const [originProScript, setOriginProScript] = useState<string>('');
  const [jupyterNotebook, setJupyterNotebook] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedNotebook, setCopiedNotebook] = useState<boolean>(false);
  const [copiedOriginPro, setCopiedOriginPro] = useState<boolean>(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'plot' | 'code' | 'jupyter' | 'explain' | 'originpro'>('plot');

  // Trigger Python Rendering
  const fetchOriginPlot = async (forceAutoFit = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        center,
        fwhm,
        profileType,
        eta,
        pearsonM,
        asymmetry,
        height,
        bgConst,
        bgSlope,
        bgQuad,
        bgType,
        instFwhm,
        wavelength,
        wavelength2,
        kaRatio,
        noisePct,
        xSpan,
        theme,
        dpi,
        showResidual,
        showFwhmBracket,
        showTable,
        showDeconvPeaks,
        showLegend,
        deconvolutionPeaks: isMultiPeakMode ? deconvPeaks : []
      };

      if (dataMode === 'experimental' && rawX && rawY && rawX.length > 5) {
        payload.rawX = rawX;
        payload.rawY = rawY;
        payload.isAutoFit = forceAutoFit || isAutoFit;
      }

      const res = await fetch('/api/python/origin-fwhm-plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setPlotImage(data.image);
        setSvgContent(data.svg || null);
        setPythonScript(data.python_code);
        setJupyterNotebook(data.jupyter_notebook || '');
        setOriginProScript(data.originpro_script || '');
        setMetrics(data.metrics);
        
        // If auto-fitted, update the state values to match the fitted parameters
        if (data.metrics?.is_auto_fit) {
          setCenter(data.metrics.center);
          setFwhm(data.metrics.observed_fwhm);
          setEta(data.metrics.eta);
          setHeight(data.metrics.height);
        }
      } else {
        setErrorMsg(data.error || 'Failed to render OriginPro plot.');
      }
    } catch (err: any) {
      console.error('Error fetching Origin plot:', err);
      setErrorMsg(err.message || 'Network error connecting to Python Matplotlib engine.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced auto-fetch on state change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOriginPlot();
    }, 150);
    return () => clearTimeout(timer);
  }, [
    center, fwhm, profileType, eta, pearsonM, asymmetry, height,
    bgConst, bgSlope, bgQuad, bgType, instFwhm, wavelength, wavelength2, kaRatio, noisePct, xSpan, theme, dpi,
    showResidual, showFwhmBracket, showTable, showDeconvPeaks, showLegend, isMultiPeakMode, deconvPeaks,
    dataMode, isAutoFit
  ]);

  // Handle Raw Text Input Parsing
  const handleParseRawText = (text: string) => {
    setRawText(text);
    const lines = text.trim().split('\n');
    const xs: number[] = [];
    const ys: number[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('2theta')) continue;
      
      const parts = trimmed.split(/[\s,;\t]+/);
      if (parts.length >= 2) {
        const xVal = parseFloat(parts[0]);
        const yVal = parseFloat(parts[1]);
        if (!isNaN(xVal) && !isNaN(yVal)) {
          xs.push(xVal);
          ys.push(yVal);
        }
      }
    }

    if (xs.length > 5) {
      setRawX(xs);
      setRawY(ys);
      setParsedPointsCount(xs.length);
      
      // Auto-set span and center estimate
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const maxIdx = ys.indexOf(maxY);
      setCenter(xs[maxIdx]);
      setXSpan(maxX - minX);
      setHeight(maxY - Math.min(...ys));
    } else {
      setRawX(null);
      setRawY(null);
      setParsedPointsCount(0);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParseRawText(content);
    };
    reader.readAsText(file);
  };

  // Preset Handlers
  const applyPreset = (presetKey: string) => {
    setDataMode('synthetic');
    setIsAutoFit(false);
    
    if (presetKey === 'si_srm') {
      setIsMultiPeakMode(false);
      setCenter(28.442);
      setFwhm(0.115);
      setProfileType('pseudo_voigt');
      setEta(0.35);
      setHeight(1500);
      setBgConst(40);
      setBgSlope(0.2);
      setInstFwhm(0.065);
      setXSpan(2.0);
    } else if (presetKey === 'tio2_nano') {
      setIsMultiPeakMode(false);
      setCenter(25.281);
      setFwhm(0.485);
      setProfileType('pseudo_voigt');
      setEta(0.75);
      setHeight(950);
      setBgConst(75);
      setBgSlope(0.5);
      setInstFwhm(0.085);
      setXSpan(4.0);
    } else if (presetKey === 'true_voigt_size_strain') {
      setIsMultiPeakMode(false);
      setCenter(38.120);
      setFwhm(0.360);
      setProfileType('true_voigt');
      setInstFwhm(0.080);
      setHeight(1200);
      setBgConst(50);
      setXSpan(3.0);
    } else if (presetKey === 'cu_doublet') {
      setIsMultiPeakMode(false);
      setCenter(28.442);
      setFwhm(0.220);
      setProfileType('ka_doublet');
      setEta(0.45);
      setHeight(1100);
      setBgConst(50);
      setKaRatio(0.50);
      setXSpan(2.5);
    } else if (presetKey === 'two_phase_deconv') {
      setIsMultiPeakMode(true);
      setCenter(38.200);
      setDeconvPeaks([
        { id: '1', label: 'Anatase (004)', center: 37.800, fwhm: 0.380, height: 750, eta: 0.55, profileType: 'pseudo_voigt', color: '#2563EB' },
        { id: '2', label: 'Rutile (101)', center: 38.450, fwhm: 0.420, height: 520, eta: 0.65, profileType: 'pseudo_voigt', color: '#9333EA' }
      ]);
      setXSpan(3.5);
    } else if (presetKey === 'asym_strain') {
      setIsMultiPeakMode(false);
      setCenter(33.080);
      setFwhm(0.360);
      setProfileType('asymmetric');
      setEta(0.60);
      setAsymmetry(1.35);
      setHeight(880);
      setBgConst(60);
      setXSpan(3.5);
    }
  };

  const addDeconvSubPeak = () => {
    const newId = (deconvPeaks.length + 1).toString();
    const colors = ['#2563EB', '#16A34A', '#9333EA', '#D97706', '#0891B2', '#E11D48', '#4F46E5'];
    const newPeak: DeconvSubPeak = {
      id: newId,
      label: `Phase #${newId}`,
      center: center + (deconvPeaks.length * 0.4 - 0.2),
      fwhm: fwhm,
      height: height * 0.6,
      eta: 0.5,
      profileType: 'pseudo_voigt',
      color: colors[deconvPeaks.length % colors.length]
    };
    setDeconvPeaks([...deconvPeaks, newPeak]);
  };

  const removeDeconvSubPeak = (id: string) => {
    if (deconvPeaks.length <= 1) return;
    setDeconvPeaks(deconvPeaks.filter(p => p.id !== id));
  };

  const copyScriptToClipboard = () => {
    if (!pythonScript) return;
    navigator.clipboard.writeText(pythonScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copyNotebookToClipboard = () => {
    if (!jupyterNotebook) return;
    navigator.clipboard.writeText(jupyterNotebook);
    setCopiedNotebook(true);
    setTimeout(() => setCopiedNotebook(false), 2000);
  };


  const copyOriginProToClipboard = () => {
    if (!originProScript) return;
    navigator.clipboard.writeText(originProScript);
    setCopiedOriginPro(true);
    setTimeout(() => setCopiedOriginPro(false), 2000);
  };

  const downloadPythonScriptFile = () => {
    if (!pythonScript) return;
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `origin_xrd_fwhm_${center.toFixed(2)}deg.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJupyterNotebookFile = () => {
    if (!jupyterNotebook) return;
    const blob = new Blob([jupyterNotebook], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OriginPro_XRD_FWHM_Deconvolution_${center.toFixed(2)}deg.ipynb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImageFile = () => {
    if (!plotImage) return;
    const a = document.createElement('a');
    a.href = plotImage;
    a.download = `originpro_xrd_fwhm_${center.toFixed(2)}deg_${dpi}dpi.png`;
    a.click();
  };

  const downloadSvgFile = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `originpro_xrd_fwhm_${center.toFixed(2)}deg.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Python Matplotlib Origin & OriginPro XRD Peak Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Matplotlib 3.10 + OriginPro (op) Integration
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Academic-grade XRD peak fitting & deconvolution engine. Generates publication-quality OriginPro styled Matplotlib figures, true Voigt & Pseudo-Voigt profiles, Scherrer size & microstrain, and exportable Jupyter Notebooks & native OriginPro (op) LabTalk scripts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOriginPlot(false)}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-render Matplotlib
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Pills */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mr-1">
            OriginPro Benchmarks:
          </span>
          <button
            onClick={() => applyPreset('si_srm')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
          >
            Si SRM 640f Standard
          </button>
          <button
            onClick={() => applyPreset('tio2_nano')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
          >
            TiO₂ Nanocrystal Size
          </button>
          <button
            onClick={() => applyPreset('true_voigt_size_strain')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
          >
            True Voigt De Keijser
          </button>
          <button
            onClick={() => applyPreset('cu_doublet')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
          >
            Cu Kα₁/Kα₂ Doublet
          </button>
          <button
            onClick={() => applyPreset('two_phase_deconv')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
          >
            2-Phase Overlapping Deconv
          </button>
          <button
            onClick={() => applyPreset('asym_strain')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
          >
            Asymmetric Strain Profile
          </button>
        </div>
      </div>

      {/* Submodule Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('plot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'plot'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            OriginPro Figure Viewer & Studio
          </button>

          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'code'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Code className="w-4 h-4 text-emerald-400" />
            Python Matplotlib Script (.py)
          </button>

          <button
            onClick={() => setActiveSubTab('jupyter')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'jupyter'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            Jupyter Notebook (.ipynb)
          </button>

          <button
            onClick={() => setActiveSubTab('originpro')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'originpro'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-rose-400" />
            OriginPro Native Script (op)
          </button>


          <button
            onClick={() => setActiveSubTab('explain')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'explain'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            Theory & Physics Foundations
          </button>
        </div>

        {/* Mode Switcher: Synthetic vs Experimental Upload */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            onClick={() => { setDataMode('synthetic'); setIsAutoFit(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dataMode === 'synthetic'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Synthetic Simulation
          </button>
          <button
            onClick={() => setDataMode('experimental')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              dataMode === 'experimental'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-3 h-3" />
            Import Raw Data (.xy / .dat)
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: ORIGINPRO FIGURE VIEWER & STUDIO */}
      {activeSubTab === 'plot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Origin Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Experimental Data Import Box (when in experimental mode) */}
            {dataMode === 'experimental' && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/30 dark:border-indigo-500/30 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Experimental XRD Profile Data
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {parsedPointsCount > 0 ? `${parsedPointsCount} points loaded` : 'No file loaded'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xy,.dat,.csv,.txt"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      Browse XY / DAT / CSV File
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Or Paste 2-Theta vs Intensity Text:
                    </label>
                    <textarea
                      rows={4}
                      value={rawText}
                      onChange={(e) => handleParseRawText(e.target.value)}
                      placeholder="28.00  45.2&#10;28.05  48.1&#10;28.10  58.9&#10;28.44  1240.5&#10;..."
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {parsedPointsCount > 5 && (
                    <button
                      onClick={() => {
                        setIsAutoFit(true);
                        fetchOriginPlot(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      Execute Levenberg-Marquardt Fit (Scipy)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. Peak Shape & Position */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Peak Profile Parameters
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">OriginPro NLFit Model</span>
              </div>

              {/* Multi-Peak Mode Switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Multi-Peak Deconvolution Mode
                </span>
                <button
                  onClick={() => setIsMultiPeakMode(!isMultiPeakMode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isMultiPeakMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isMultiPeakMode ? 'Enabled' : 'Single Peak'}
                </button>
              </div>

              {!isMultiPeakMode ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Peak Function Family
                    </label>
                    <select
                      value={profileType}
                      onChange={(e: any) => setProfileType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="pseudo_voigt">Pseudo-Voigt (Gaussian + Lorentzian sum)</option>
                      <option value="true_voigt">True Voigt (Faddeeva w(z) Convolution & De Keijser)</option>
                      <option value="ka_doublet">Kα₁ / Kα₂ Doublet Split (Laboratory Cu Source)</option>
                      <option value="gaussian">Gaussian / Normal Distribution</option>
                      <option value="lorentzian">Lorentzian / Cauchy Profile</option>
                      <option value="pearson7">Pearson VII (Exponent m)</option>
                      <option value="asymmetric">Split Asymmetric Pseudo-Voigt</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Center 2θ₀ (deg)</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{center.toFixed(3)}°</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="0.01"
                        value={center}
                        onChange={(e) => setCenter(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>FWHM β_obs (deg)</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{fwhm.toFixed(3)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.50"
                        step="0.005"
                        value={fwhm}
                        onChange={(e) => setFwhm(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {profileType === 'pseudo_voigt' && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Lorentzian Fraction (η)</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{eta.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={eta}
                        onChange={(e) => setEta(parseFloat(e.target.value))}
                        className="w-full accent-cyan-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {profileType === 'ka_doublet' && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Kα₂ / Kα₁ Intensity Ratio</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{kaRatio.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="0.8"
                        step="0.02"
                        value={kaRatio}
                        onChange={(e) => setKaRatio(parseFloat(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {profileType === 'pearson7' && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Pearson VII Exponent (m)</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{pearsonM.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="10.0"
                        step="0.1"
                        value={pearsonM}
                        onChange={(e) => setPearsonM(parseFloat(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {profileType === 'asymmetric' && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Asymmetry Ratio (R/L)</span>
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{asymmetry.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.05"
                        value={asymmetry}
                        onChange={(e) => setAsymmetry(parseFloat(e.target.value))}
                        className="w-full accent-rose-600 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Peak Height</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{height.toFixed(0)}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="5000"
                        step="50"
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Noise Level (σ %)</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{noisePct.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="10.0"
                        step="0.5"
                        value={noisePct}
                        onChange={(e) => setNoisePct(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Multi-Peak Deconvolution Table */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Overlapping Sub-Peaks Manager:</span>
                    <button
                      onClick={addDeconvSubPeak}
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:bg-indigo-100"
                    >
                      <Plus className="w-3 h-3" />
                      Add Peak
                    </button>
                  </div>

                  {deconvPeaks.map((peak, idx) => (
                    <div key={peak.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: peak.color }}></span>
                          <input
                            type="text"
                            value={peak.label}
                            onChange={(e) => {
                              const updated = [...deconvPeaks];
                              updated[idx].label = e.target.value;
                              setDeconvPeaks(updated);
                            }}
                            className="text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-400 focus:border-indigo-500 outline-hidden"
                          />
                        </div>
                        {deconvPeaks.length > 1 && (
                          <button
                            onClick={() => removeDeconvSubPeak(peak.id)}
                            className="text-rose-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-500">Center (2θ)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={peak.center}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 28;
                              const updated = [...deconvPeaks];
                              updated[idx].center = val;
                              setDeconvPeaks(updated);
                            }}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500">FWHM (deg)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={peak.fwhm}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0.2;
                              const updated = [...deconvPeaks];
                              updated[idx].fwhm = val;
                              setDeconvPeaks(updated);
                            }}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500">Height</label>
                          <input
                            type="number"
                            step="50"
                            value={peak.height}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 500;
                              const updated = [...deconvPeaks];
                              updated[idx].height = val;
                              setDeconvPeaks(updated);
                            }}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Instrument & Background Settings */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Layers className="w-4 h-4 text-emerald-500" />
                Instrument Resolution & Baseline
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Inst FWHM β_inst</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{instFwhm.toFixed(3)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.25"
                    step="0.005"
                    value={instFwhm}
                    onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>2θ Window Span</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">±{(xSpan/2).toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="8.0"
                    step="0.5"
                    value={xSpan}
                    onChange={(e) => setXSpan(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Baseline Model</label>
                  <select
                    value={bgType}
                    onChange={(e: any) => setBgType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="constant">Constant Offset (y₀)</option>
                    <option value="linear">Linear Slope (y₀ + s·x)</option>
                    <option value="quadratic">Quadratic Polynomial</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Target DPI Export</label>
                  <select
                    value={dpi}
                    onChange={(e: any) => setDpi(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="150">150 DPI (Fast Screen)</option>
                    <option value="220">220 DPI (Standard)</option>
                    <option value="300">300 DPI (Journal Print)</option>
                    <option value="600">600 DPI (Archival Vector)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. OriginPro Publication Styling Options */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Palette className="w-4 h-4 text-amber-500" />
                OriginPro Styling & Annotation
              </h4>

              <div>
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Journal / Origin Theme Style
                </label>
                <select
                  value={theme}
                  onChange={(e: any) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="origin_classic">OriginPro Classic (Inward Ticks, Framed Spines, Red Fit)</option>
                  <option value="nature">Nature Materials (Clean Minimalist, Burgundy Trace)</option>
                  <option value="acs_nano">ACS Nano / JACS (High Contrast Orange/Navy)</option>
                  <option value="elsevier">Elsevier / Acta Materialia (Dual Axis Box, Deep Blue)</option>
                  <option value="dark_lab">Darkroom Scientific Lab (Dark Presentation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={showResidual}
                    onChange={(e) => setShowResidual(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span>Residual Subplot</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={showFwhmBracket}
                    onChange={(e) => setShowFwhmBracket(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span>FWHM Bracket Arrows</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={showTable}
                    onChange={(e) => setShowTable(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span>Origin Inset Table</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={showDeconvPeaks}
                    onChange={(e) => setShowDeconvPeaks(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span>Deconv Sub-Peaks</span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: High-Resolution Matplotlib Figure & Metrics (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Main Rendered Matplotlib Figure Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              
              {/* Figure Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    OriginPro Publication Figure ({dpi} DPI)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreenModal(true)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Fullscreen View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {svgContent && (
                    <button
                      onClick={downloadSvgFile}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
                      title="Download Scalable Vector Graphics"
                    >
                      <Download className="w-3 h-3 text-indigo-500" />
                      Vector SVG
                    </button>
                  )}

                  <button
                    onClick={downloadImageFile}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PNG Image
                  </button>
                </div>
              </div>

              {/* Image Canvas Container */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[440px] border border-slate-800">
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-xs font-bold text-white">Rendering in Python Matplotlib...</span>
                  </div>
                )}

                {plotImage ? (
                  <img
                    src={plotImage}
                    alt="OriginPro Matplotlib XRD FWHM Plot"
                    className="w-full h-auto object-contain select-none max-h-[580px]"
                  />
                ) : (
                  <div className="text-slate-500 text-xs flex flex-col items-center gap-2 p-8 text-center">
                    <Activity className="w-8 h-8 text-slate-600" />
                    <span>Click Re-render to generate OriginPro Matplotlib figure.</span>
                  </div>
                )}
              </div>

              {/* Scientific Output Metrics Ribbon */}
              {metrics && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Observed FWHM</div>
                      <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {metrics.observed_fwhm?.toFixed(4)}°
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{(metrics.observed_fwhm * 60)?.toFixed(1)} arcmin</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Physical FWHM (β_phys)</div>
                      <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {metrics.physical_fwhm?.toFixed(4)}°
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Inst Subtracted</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Crystallite Size (D)</div>
                      <div className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
                        {metrics.crystallite_size_nm?.toFixed(1)} nm
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Scherrer Domain</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Microstrain (ε)</div>
                      <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                        {metrics.microstrain_pct?.toFixed(3)} %
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Gaussian Core</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500 block">Fit Quality (R²):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.r_squared?.toFixed(5)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500 block">Weighted R_wp:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.r_wp?.toFixed(2)} %</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500 block">Goodness of Fit:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.gof?.toFixed(2)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500 block">Total Peak Area:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.total_area?.toFixed(0)} counts·°</span>
                    </div>
                  </div>

                  {/* Multi-Peak Phase Fractions Summary */}
                  {metrics.sub_areas && metrics.sub_areas.length > 1 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                        Deconvoluted Phase Area Fractions
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {metrics.sub_areas.map((sa: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{sa.label}</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {sa.area_fraction?.toFixed(1)}% <span className="text-[10px] text-slate-500">({sa.area?.toFixed(0)})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 2: PYTHON MATPLOTLIB SCRIPT GENERATOR */}
      {activeSubTab === 'code' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                Standalone Python Matplotlib & OriginPro Script (.py)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ready to execute in Jupyter Notebook, VS Code, or OriginPro 2021+ Python LabTalk terminal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyScriptToClipboard}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? 'Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={downloadPythonScriptFile}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .py Script
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-[500px]">
              {pythonScript || '# Generating Python script...'}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 3: JUPYTER NOTEBOOK EXPORT */}
      {activeSubTab === 'jupyter' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Jupyter Notebook (.ipynb) Export
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download a fully structured notebook with markdown documentation, model equations, and interactive matplotlib cells.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyNotebookToClipboard}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedNotebook ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedNotebook ? 'Copied JSON!' : 'Copy IPYNB'}
              </button>

              <button
                onClick={downloadJupyterNotebookFile}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .ipynb
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 text-cyan-300 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-[500px]">
              {jupyterNotebook || '{\n  "cells": [],\n  "metadata": {}\n}'}
            </pre>
          </div>
        </div>
      )}

      
      {/* SUBTAB 5: ORIGINPRO NATIVE SCRIPT */}
      {activeSubTab === 'originpro' && (
        <div className="bg-[#1e1e1e] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-black/40">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-400" />
              <div>
                <h4 className="text-white text-xs font-bold font-mono tracking-wider">OriginPro Native Script (op module)</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Executes natively inside OriginPro 2021+ Python Console, writes to Worksheet, plots to Graph</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyOriginProToClipboard}
                className="px-3 py-1.5 rounded bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
              >
                {copiedOriginPro ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                {copiedOriginPro ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-[#d4d4d4] select-text">
            {originProScript ? (
              <pre className="whitespace-pre">{originProScript}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic">
                {isLoading ? 'Generating OriginPro script...' : 'Click "Re-render Matplotlib" to generate OriginPro script'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: EXPLAIN MODULE (ORIGINPRO CURVE PHYSICS & THEORY) */}
      {activeSubTab === 'explain' && (
        <div className="space-y-6">
          
          {/* Main Explain Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  OriginPro XRD Peak Deconvolution & FWHM Fitting Principles
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive mathematical foundations of peak profile functions, instrumental deconvolution, and publication styling in Origin and Matplotlib.
                </p>
              </div>
            </div>

            {/* Grid of Explain Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Peak Profile Models */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  1. Peak Profile Functions in OriginPro
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  In X-ray diffraction, diffraction line shapes arise from crystallite size broadening (Lorentzian tailing) and instrumental slit/microstrain distributions (Gaussian central core). OriginPro implements the <strong>Pseudo-Voigt</strong> function as a computationally efficient linear approximation to the true Voigt convolution:
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  PV(2θ) = I₀ · [ (1 - η) · exp(-4 ln 2 · ((2θ - 2θ₀)/FWHM)²) + η · (1 + 4 · ((2θ - 2θ₀)/FWHM)²)⁻¹ ]
                </div>
                <p className="text-[11px] text-slate-500">
                  where <strong className="text-slate-700 dark:text-slate-300">η = 0</strong> corresponds to pure Gaussian (strain dominant) and <strong className="text-slate-700 dark:text-slate-300">η = 1</strong> corresponds to pure Lorentzian (size dominant).
                </p>
              </div>

              {/* 2. Instrumental Broadening Deconvolution */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  2. Instrumental Broadening Deconvolution (β_phys)
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The observed diffraction peak breadth <span className="font-mono font-bold">β_obs</span> is a convolution of the instrumental resolution function (<span className="font-mono">β_inst</span> from NIST SRM 660c LaB₆ / SRM 640f Si) and the sample physical broadening (<span className="font-mono">β_phys</span>):
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                    Gaussian: β_phys² = β_obs² - β_inst²
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400">
                    Lorentzian: β_phys = β_obs - β_inst
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400">
                    Pseudo-Voigt: β_phys = (1 - η)√(β_obs² - β_inst²) + η(β_obs - β_inst)
                  </div>
                </div>
              </div>

              {/* 3. Scherrer Crystallite Domain Size */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  3. Scherrer Crystallite Domain Calculation
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Once the net physical FWHM <span className="font-mono font-bold">β_phys</span> is extracted in radians, the volume-weighted crystallite domain size <span className="font-mono font-bold">D</span> is determined via Scherrer's equation:
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-amber-600 dark:text-amber-400">
                  D = (K · λ) / (β_phys_rad · cos(θ))
                </div>
                <p className="text-[11px] text-slate-500">
                  where <strong className="text-slate-700 dark:text-slate-300">K = 0.94</strong> for spherical domains, and <strong className="text-slate-700 dark:text-slate-300">λ = 0.15406 nm</strong> for Cu Kα radiation.
                </p>
              </div>

              {/* 4. OriginLab & Python Workflow */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h5 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  4. Running in OriginPro 2021+
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  To use this script directly in OriginPro:
                </p>
                <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
                  <li>Open OriginPro → Press <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Alt + 5</span> to open the Python Console.</li>
                  <li>Click <strong>Copy Code</strong> from the script tab and paste it into the OriginLab script editor.</li>
                  <li>Execute to generate high-resolution Origin publication graphs and export directly to TIFF, EPS, or SVG.</li>
                </ol>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {isFullscreenModal && plotImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                OriginPro XRD Peak Deconvolution & FWHM Figure (Fullscreen)
              </h3>
              <button
                onClick={() => setIsFullscreenModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={plotImage}
                alt="OriginPro Matplotlib XRD FWHM Fullscreen"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
