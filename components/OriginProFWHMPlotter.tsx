import React, { useState, useEffect } from 'react';
import { 
  Activity, Sliders, Sparkles, RefreshCw, Download, Copy, Check, Eye, Maximize2, 
  BookOpen, Code, Terminal, Layers, Palette, Info, HelpCircle, FileText, ChevronRight,
  TrendingUp, CheckCircle2, AlertCircle, ShieldAlert, Cpu
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
  // Peak parameters
  const [center, setCenter] = useState<number>(28.442);
  const [fwhm, setFwhm] = useState<number>(0.285);
  const [profileType, setProfileType] = useState<'pseudo_voigt' | 'gaussian' | 'lorentzian' | 'pearson7' | 'asymmetric'>('pseudo_voigt');
  const [eta, setEta] = useState<number>(0.50);
  const [pearsonM, setPearsonM] = useState<number>(2.0);
  const [asymmetry, setAsymmetry] = useState<number>(1.15);
  const [height, setHeight] = useState<number>(1000.0);
  
  // Background & Instrument
  const [bgConst, setBgConst] = useState<number>(60.0);
  const [bgSlope, setBgSlope] = useState<number>(0.5);
  const [instFwhm, setInstFwhm] = useState<number>(0.085);
  const [wavelength, setWavelength] = useState<number>(0.15406); // Cu Ka (nm)
  
  // Numerical & Display options
  const [noisePct, setNoisePct] = useState<number>(2.5);
  const [xSpan, setXSpan] = useState<number>(3.5);
  const [theme, setTheme] = useState<'origin_classic' | 'nature' | 'acs_nano' | 'dark_lab'>('origin_classic');
  const [showResidual, setShowResidual] = useState<boolean>(true);
  const [showFwhmBracket, setShowFwhmBracket] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(true);
  const [showDeconvPeaks, setShowDeconvPeaks] = useState<boolean>(true);
  
  // Multi-peak deconvolution mode
  const [isMultiPeakMode, setIsMultiPeakMode] = useState<boolean>(false);
  const [deconvPeaks, setDeconvPeaks] = useState<DeconvSubPeak[]>([
    { id: '1', label: 'Phase A (Primary)', center: 28.442, fwhm: 0.285, height: 1000, eta: 0.50, profileType: 'pseudo_voigt', color: '#2563EB' },
    { id: '2', label: 'Phase B (Secondary)', center: 28.950, fwhm: 0.340, height: 420, eta: 0.60, profileType: 'pseudo_voigt', color: '#16A34A' }
  ]);

  // Output State
  const [plotImage, setPlotImage] = useState<string | null>(null);
  const [pythonScript, setPythonScript] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'plot' | 'code' | 'explain'>('plot');

  // Trigger Python Rendering
  const fetchOriginPlot = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        center,
        fwhm,
        profileType,
        eta,
        pearsonM,
        asymmetry,
        height,
        bgConst,
        bgSlope,
        instFwhm,
        wavelength,
        noisePct,
        xSpan,
        theme,
        showResidual,
        showFwhmBracket,
        showTable,
        showDeconvPeaks,
        deconvolutionPeaks: isMultiPeakMode ? deconvPeaks : []
      };

      const res = await fetch('/api/python/origin-fwhm-plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setPlotImage(data.image);
        setPythonScript(data.python_code);
        setMetrics(data.metrics);
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

  // Initial load and on parameter debounce
  useEffect(() => {
    fetchOriginPlot();
  }, [
    center, fwhm, profileType, eta, pearsonM, asymmetry, height,
    bgConst, bgSlope, instFwhm, wavelength, noisePct, xSpan, theme,
    showResidual, showFwhmBracket, showTable, showDeconvPeaks, isMultiPeakMode, deconvPeaks
  ]);

  // Preset Presets Handler
  const applyPreset = (presetKey: string) => {
    if (presetKey === 'si_srm') {
      setIsMultiPeakMode(false);
      setCenter(28.442);
      setFwhm(0.125);
      setProfileType('pseudo_voigt');
      setEta(0.35);
      setHeight(1500);
      setBgConst(40);
      setInstFwhm(0.065);
      setXSpan(2.0);
    } else if (presetKey === 'tio2_nano') {
      setIsMultiPeakMode(false);
      setCenter(25.281);
      setFwhm(0.485);
      setProfileType('pseudo_voigt');
      setEta(0.70);
      setHeight(950);
      setBgConst(75);
      setInstFwhm(0.085);
      setXSpan(4.0);
    } else if (presetKey === 'cu_doublet') {
      setIsMultiPeakMode(true);
      setCenter(28.442);
      setDeconvPeaks([
        { id: '1', label: 'Cu Kα1 (λ=1.5406 Å)', center: 28.442, fwhm: 0.220, height: 1200, eta: 0.45, profileType: 'pseudo_voigt', color: '#2563EB' },
        { id: '2', label: 'Cu Kα2 (λ=1.5444 Å)', center: 28.514, fwhm: 0.225, height: 600, eta: 0.45, profileType: 'pseudo_voigt', color: '#DC2626' }
      ]);
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

  const copyScriptToClipboard = () => {
    if (!pythonScript) return;
    navigator.clipboard.writeText(pythonScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
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

  const downloadImageFile = () => {
    if (!plotImage) return;
    const a = document.createElement('a');
    a.href = plotImage;
    a.download = `originpro_xrd_fwhm_${center.toFixed(2)}deg.png`;
    a.click();
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
                  Matplotlib 3.10 + Origin Curve Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Independent Python-powered XRD peak modeling module. Generates publication-grade OriginLab/OriginPro styled diffraction curves, deconvolution sub-peaks, FWHM dimension annotations, and residual plots with instant Matplotlib figure rendering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOriginPlot}
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
            TiO₂ Nanocrystal Broadening
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
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
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
          Python Matplotlib Script Generator
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
          Explain Module: OriginPro Curve Physics & Theory
        </button>
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
                  <div className="text-[11px] text-slate-500">
                    Define overlapping sub-peaks for OriginPro Peak Deconvolution:
                  </div>

                  {deconvPeaks.map((peak, idx) => (
                    <div key={peak.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: peak.color }}></span>
                          {peak.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          2θ: {peak.center.toFixed(3)}° | FWHM: {peak.fwhm.toFixed(3)}°
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
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
                  <option value="nature">Nature / Science (Clean Minimalist, Black Spines)</option>
                  <option value="acs_nano">ACS Nano / Materials (High Contrast Orange/Navy)</option>
                  <option value="dark_lab">Origin Dark Scientific Lab (Dark Mode Presentation)</option>
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
                  <span>Deconvolution Curves</span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: High-Resolution Matplotlib Figure & Metrics (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Main Rendered Matplotlib Figure Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              
              {/* Figure Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    OriginPro Publication Figure (Python Matplotlib Engine)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreenModal(true)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-colors"
                    title="Fullscreen View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={downloadImageFile}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG (300 DPI)
                  </button>
                </div>
              </div>

              {/* Image Canvas Container */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[420px] border border-slate-800">
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
                    className="w-full h-auto object-contain select-none max-h-[560px]"
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Observed FWHM</div>
                    <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {metrics.observed_fwhm?.toFixed(4)}°
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Physical FWHM (β_phys)</div>
                    <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {metrics.physical_fwhm?.toFixed(4)}°
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Crystallite Size (D)</div>
                    <div className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
                      {metrics.crystallite_size_nm?.toFixed(1)} nm
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Goodness of Fit (R²)</div>
                    <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                      {metrics.r_squared?.toFixed(4)}
                    </div>
                  </div>
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
                Standalone Python Matplotlib & OriginPro Script
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ready to execute in Jupyter Notebook, VS Code, or OriginPro 2021+ Python LabTalk terminal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyScriptToClipboard}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? 'Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={downloadPythonScriptFile}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
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

      {/* SUBTAB 3: EXPLAIN MODULE (ORIGINPRO CURVE PHYSICS & THEORY) */}
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
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
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
