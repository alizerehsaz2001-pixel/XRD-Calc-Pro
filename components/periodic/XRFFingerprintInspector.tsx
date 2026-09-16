import React, { useState, useMemo } from 'react';
import {
  Fingerprint,
  Zap,
  Copy,
  Check,
  Search,
  Sliders,
  Download,
  Layers,
  Activity,
  Info,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Scale,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileSpreadsheet,
  Settings2,
  Maximize2,
  Radio,
  Filter,
  X
} from 'lucide-react';
import {
  getXRFFingerprint,
  getAllXRFFingerprints,
  matchXRFFingerprint,
  simulateXRFSpectrum,
  simulateMultiElementXRFSpectrum,
  TUBE_TARGETS,
  calculateWindowTransmission,
  PRESET_XRF_SAMPLES,
  XRFFingerprint,
  XRFEmissionLine,
  XRFMatchResult,
  XRFSpectrumPoint
} from './xrfFingerprintData';
import { CrystalElement } from './types';

interface XRFFingerprintInspectorProps {
  element: CrystalElement;
  onSelectElement?: (atomicNumber: number) => void;
  isFa?: boolean;
}

export const XRFFingerprintInspector: React.FC<XRFFingerprintInspectorProps> = ({
  element,
  onSelectElement,
  isFa = false
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [detectorFWHM, setDetectorFWHM] = useState<number>(135); // eV (standard SDD)
  const [tubeTarget, setTubeTarget] = useState<'Rh' | 'Mo' | 'W' | 'Cr' | 'Cu' | 'Ag'>('Rh');
  const [tubeVoltageKV, setTubeVoltageKV] = useState<number>(40); // kV excitation
  const [detectorWindow, setDetectorWindow] = useState<'ultrathin_polymer' | 'beryllium_8um' | 'windowless'>('ultrathin_polymer');
  const [isLogScale, setIsLogScale] = useState<boolean>(false);
  const [showBackground, setShowBackground] = useState<boolean>(true);
  const [showTubeScatter, setShowTubeScatter] = useState<boolean>(true);
  const [showEscapePeaks, setShowEscapePeaks] = useState<boolean>(true);
  const [showSumPeaks, setShowSumPeaks] = useState<boolean>(false);
  const [showEdges, setShowEdges] = useState<boolean>(true);
  const [showLineMarkers, setShowLineMarkers] = useState<boolean>(true);
  const [showNetCurve, setShowNetCurve] = useState<boolean>(false);

  // Energy range & zoom presets
  const [energyZoomPreset, setEnergyZoomPreset] = useState<'all' | 'eds_light' | 'transition_metals' | 'heavy_elements' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<{ minE: number; maxE: number } | null>(null);

  // Standard alloy/matrix overlay
  const [selectedAlloySample, setSelectedAlloySample] = useState<string | null>(null);

  // Comparator state
  const [comparatorZ, setComparatorZ] = useState<number | null>(null);

  // Selected peak for detailed popup
  const [selectedPeakLine, setSelectedPeakLine] = useState<XRFEmissionLine | null>(null);

  // Reverse Matcher State
  const [measuredInput, setMeasuredInput] = useState<string>('');
  const [matchTolerance, setMatchTolerance] = useState<number>(0.08); // keV

  // Active element fingerprint
  const fingerprint: XRFFingerprint = useMemo(() => {
    return getXRFFingerprint(element.number);
  }, [element.number]);

  // Comparator element fingerprint
  const comparatorFingerprint: XRFFingerprint | null = useMemo(() => {
    return comparatorZ ? getXRFFingerprint(comparatorZ) : null;
  }, [comparatorZ]);

  // Selected preset alloy sample
  const selectedSampleObj = useMemo(() => {
    if (!selectedAlloySample) return null;
    return PRESET_XRF_SAMPLES.find(s => s.name === selectedAlloySample) || null;
  }, [selectedAlloySample]);

  // Dynamic automatic energy bounds
  const autoMaxE = useMemo(() => {
    const maxLineEnergy = fingerprint.lines.length > 0
      ? Math.max(...fingerprint.lines.map(l => l.energyKeV))
      : 10;
    return Math.min(Math.max(tubeVoltageKV * 0.85, 12), Math.max(12, Math.ceil(maxLineEnergy * 1.35)));
  }, [fingerprint.lines, tubeVoltageKV]);

  const { minE, maxE } = useMemo(() => {
    if (energyZoomPreset === 'eds_light') {
      return { minE: 0.1, maxE: 3.5 };
    }
    if (energyZoomPreset === 'transition_metals') {
      return { minE: 2.5, maxE: 12.0 };
    }
    if (energyZoomPreset === 'heavy_elements') {
      return { minE: 10.0, maxE: 32.0 };
    }
    if (energyZoomPreset === 'custom' && customRange) {
      return customRange;
    }
    return { minE: 0.1, maxE: autoMaxE };
  }, [energyZoomPreset, customRange, autoMaxE]);

  // Zoom button handlers
  const handleZoomIn = () => {
    const center = (minE + maxE) / 2;
    const span = Math.max(0.8, (maxE - minE) * 0.65);
    const newMin = Math.max(0.1, Number((center - span / 2).toFixed(2)));
    const newMax = Number((center + span / 2).toFixed(2));
    setCustomRange({ minE: newMin, maxE: newMax });
    setEnergyZoomPreset('custom');
  };

  const handleZoomOut = () => {
    const center = (minE + maxE) / 2;
    const span = Math.min(50, (maxE - minE) * 1.45);
    const newMin = Math.max(0.1, Number((center - span / 2).toFixed(2)));
    const newMax = Math.min(50, Number((center + span / 2).toFixed(2)));
    setCustomRange({ minE: newMin, maxE: newMax });
    setEnergyZoomPreset('custom');
  };

  const handleResetZoom = () => {
    setEnergyZoomPreset('all');
    setCustomRange(null);
  };

  // Primary Simulated Spectrum
  const spectrumPoints = useMemo(() => {
    return simulateXRFSpectrum(fingerprint, {
      fwhm_eV: detectorFWHM,
      tubeTarget,
      tubeVoltageKV,
      detectorWindow,
      includeBackground: showBackground,
      includeTubeScatter: showTubeScatter,
      includeEscapePeaks: showEscapePeaks,
      includeSumPeaks: showSumPeaks,
      minKeV: minE,
      maxKeV: maxE,
      numPoints: 600
    });
  }, [fingerprint, detectorFWHM, tubeTarget, tubeVoltageKV, detectorWindow, showBackground, showTubeScatter, showEscapePeaks, showSumPeaks, minE, maxE]);

  // Comparator Spectrum
  const comparatorSpectrumPoints = useMemo(() => {
    if (!comparatorFingerprint) return null;
    return simulateXRFSpectrum(comparatorFingerprint, {
      fwhm_eV: detectorFWHM,
      tubeTarget,
      tubeVoltageKV,
      detectorWindow,
      includeBackground: false,
      includeTubeScatter: false,
      includeEscapePeaks: showEscapePeaks,
      includeSumPeaks: showSumPeaks,
      minKeV: minE,
      maxKeV: maxE,
      numPoints: 600
    });
  }, [comparatorFingerprint, detectorFWHM, tubeTarget, tubeVoltageKV, detectorWindow, showEscapePeaks, showSumPeaks, minE, maxE]);

  // Multi-element Alloy Sample Spectrum
  const alloySpectrumPoints = useMemo(() => {
    if (!selectedSampleObj) return null;
    return simulateMultiElementXRFSpectrum(selectedSampleObj.elements, {
      fwhm_eV: detectorFWHM,
      tubeTarget,
      tubeVoltageKV,
      detectorWindow,
      includeBackground: showBackground,
      includeTubeScatter: showTubeScatter,
      minKeV: minE,
      maxKeV: maxE,
      numPoints: 600
    });
  }, [selectedSampleObj, detectorFWHM, tubeTarget, tubeVoltageKV, detectorWindow, showBackground, showTubeScatter, minE, maxE]);

  // Overlapping lines with comparator
  const spectralInterferences = useMemo(() => {
    if (!comparatorFingerprint) return [];
    const interferences: { line1: XRFEmissionLine; line2: XRFEmissionLine; deltaKeV: number }[] = [];
    fingerprint.lines.forEach(l1 => {
      comparatorFingerprint.lines.forEach(l2 => {
        const delta = Math.abs(l1.energyKeV - l2.energyKeV);
        if (delta <= 0.15) {
          interferences.push({ line1: l1, line2: l2, deltaKeV: delta });
        }
      });
    });
    return interferences;
  }, [fingerprint, comparatorFingerprint]);

  // Reverse matching results
  const matchResults: XRFMatchResult[] = useMemo(() => {
    if (!measuredInput.trim()) return [];
    const peaks = measuredInput
      .split(/[,;\s]+/)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
    if (peaks.length === 0) return [];
    return matchXRFFingerprint(peaks, matchTolerance);
  }, [measuredInput, matchTolerance]);

  // Copy fingerprint hash to clipboard
  const handleCopyHash = () => {
    navigator.clipboard.writeText(fingerprint.fingerprintHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fingerprint, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `XRF-Fingerprint-${element.symbol}-Z${element.number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV of Emission Lines
  const handleExportCSV = () => {
    const headers = 'Siegbahn,IUPAC,Energy_keV,Wavelength_Angstrom,RelativeIntensity_Percent,Shell,Transition\n';
    const rows = fingerprint.lines
      .map(l => `${l.siegbahn},${l.iupac},${l.energyKeV},${l.wavelengthAngstrom},${l.relativeIntensity},${l.shell},${l.transition}`)
      .join('\n');
    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `XRF-Lines-${element.symbol}-Z${element.number}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Continuous Spectrum Curve CSV
  const handleExportSpectrumCSV = () => {
    const headers = 'Energy_keV,Total_Counts_per_sec,Net_Fluorescence_Counts,Bremsstrahlung_Background_Counts,Peak_Label,Peak_Type\n';
    const rows = spectrumPoints
      .map(p => `${p.energy},${p.intensity},${p.netIntensity ?? 0},${p.backgroundIntensity ?? 0},"${p.peakLabel ?? ''}","${p.peakSeries ?? (p.isEscape ? 'Escape' : p.isSum ? 'Sum' : p.isTubeScatter ? 'Tube' : '')}"`)
      .join('\n');
    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `XRF-Spectrum-${element.symbol}-${tubeTarget}Tube-${tubeVoltageKV}kV.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Spectrum SVG
  const handleExportSpectrumSVG = () => {
    const svgElem = document.getElementById('xrf-spectrum-svg');
    if (!svgElem) return;
    const svgXml = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `XRF-Spectrum-${element.symbol}-${tubeTarget}Tube-${tubeVoltageKV}kV.svg`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // Interactive spectrum SVG render calculations
  const svgWidth = 840;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 42, left: 58 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const rawMaxIntensity = Math.max(
    ...spectrumPoints.map(p => p.intensity),
    comparatorSpectrumPoints ? Math.max(...comparatorSpectrumPoints.map(p => p.intensity)) : 0,
    alloySpectrumPoints ? Math.max(...alloySpectrumPoints.map(p => p.intensity)) : 0,
    10
  );

  const maxIntensity = isLogScale ? Math.log10(rawMaxIntensity + 1) : rawMaxIntensity;

  const scaleX = (energy: number) => {
    return padding.left + ((energy - minE) / Math.max(0.01, maxE - minE)) * graphWidth;
  };

  const scaleY = (intensity: number) => {
    const val = isLogScale ? Math.log10(Math.max(0, intensity) + 1) : Math.max(0, intensity);
    return padding.top + graphHeight - (val / Math.max(0.001, maxIntensity)) * graphHeight;
  };

  // Primary spectrum path
  const primaryPathD = useMemo(() => {
    if (spectrumPoints.length === 0) return '';
    return spectrumPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.energy);
      const y = scaleY(pt.intensity);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [spectrumPoints, isLogScale, minE, maxE, maxIntensity]);

  // Primary area fill path
  const primaryAreaD = useMemo(() => {
    if (spectrumPoints.length === 0) return '';
    const baseY = padding.top + graphHeight;
    const startX = scaleX(spectrumPoints[0].energy);
    const endX = scaleX(spectrumPoints[spectrumPoints.length - 1].energy);
    return `${primaryPathD} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  }, [primaryPathD, spectrumPoints, minE, maxE]);

  // Decomposed Net Fluorescence path
  const netPathD = useMemo(() => {
    if (!showNetCurve || spectrumPoints.length === 0) return '';
    return spectrumPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.energy);
      const y = scaleY(pt.netIntensity ?? 0);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [showNetCurve, spectrumPoints, isLogScale, minE, maxE, maxIntensity]);

  // Decomposed Bremsstrahlung Continuum path
  const bgPathD = useMemo(() => {
    if (!showNetCurve || spectrumPoints.length === 0) return '';
    return spectrumPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.energy);
      const y = scaleY(pt.backgroundIntensity ?? 0);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [showNetCurve, spectrumPoints, isLogScale, minE, maxE, maxIntensity]);

  // Alloy sample path
  const alloyPathD = useMemo(() => {
    if (!alloySpectrumPoints || alloySpectrumPoints.length === 0) return '';
    return alloySpectrumPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.energy);
      const y = scaleY(pt.intensity);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [alloySpectrumPoints, isLogScale, minE, maxE, maxIntensity]);

  // Comparator path
  const comparatorPathD = useMemo(() => {
    if (!comparatorSpectrumPoints || comparatorSpectrumPoints.length === 0) return '';
    return comparatorSpectrumPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.energy);
      const y = scaleY(pt.intensity);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [comparatorSpectrumPoints, isLogScale, minE, maxE, maxIntensity]);

  const [hoveredEnergy, setHoveredEnergy] = useState<number | null>(null);

  // Closest spectrum point to cursor
  const hoveredPoint = useMemo(() => {
    if (hoveredEnergy === null || spectrumPoints.length === 0) return null;
    let closest = spectrumPoints[0];
    let minDiff = Math.abs(spectrumPoints[0].energy - hoveredEnergy);
    for (let i = 1; i < spectrumPoints.length; i++) {
      const diff = Math.abs(spectrumPoints[i].energy - hoveredEnergy);
      if (diff < minDiff) {
        minDiff = diff;
        closest = spectrumPoints[i];
      }
    }
    return closest;
  }, [hoveredEnergy, spectrumPoints]);

  // Nearest sample characteristic emission line to cursor
  const nearestLine = useMemo(() => {
    if (hoveredEnergy === null) return null;
    let closest: XRFEmissionLine | null = null;
    let minDiff = 0.28; // within 280 eV
    fingerprint.lines.forEach(l => {
      const diff = Math.abs(l.energyKeV - hoveredEnergy);
      if (diff < minDiff) {
        minDiff = diff;
        closest = l;
      }
    });
    return closest;
  }, [hoveredEnergy, fingerprint.lines]);

  const allElements = useMemo(() => getAllXRFFingerprints(), []);

  return (
    <div className="space-y-6" id="xrf-fingerprint-inspector">
      {/* 1. UNIQUE XRF FINGERPRINT HEADER & METRIC SUMMARY */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/30 p-5 shadow-xl shadow-cyan-950/20 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          {/* Element & Fingerprint ID */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <span className="text-[10px] font-mono text-cyan-300 font-semibold">{element.number}</span>
              <span className="text-2xl font-black text-white tracking-tight">{element.symbol}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {element.name} <span className="text-cyan-400 font-mono font-medium">({element.symbol})</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Unique XRF Fingerprint
                </span>
              </div>

              {/* Unique Hash Code Display */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-700/80 font-mono text-xs text-cyan-300 shadow-inner">
                  <span className="text-slate-400 select-none">HASH:</span>
                  <span className="font-bold tracking-wider">{fingerprint.fingerprintHash}</span>
                </div>

                <button
                  onClick={handleCopyHash}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Copy Unique XRF Fingerprint Hash"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Full XRF JSON Data"
            >
              <Download className="w-3.5 h-3.5" />
              JSON Data
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Peak Lines Table CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV Lines
            </button>
          </div>
        </div>

        {/* 24-Channel Spectral Barcode Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              24-Channel Quantum Spectral Barcode (0 – 24 keV Energy Domain)
            </span>
            <span className="font-mono text-[11px] text-cyan-400/80">Every element produces an unforgeable spectral identity</span>
          </div>

          <div className="grid grid-cols-24 gap-1 h-9 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            {fingerprint.spectralBarcode.map((intensity, idx) => {
              const hasIntensity = intensity > 0;
              const heightPct = hasIntensity ? Math.max(15, intensity) : 6;
              const colorClass = intensity > 70
                ? 'bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : intensity > 30
                ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                : hasIntensity
                ? 'bg-gradient-to-t from-slate-700 to-blue-500'
                : 'bg-slate-800/40';

              return (
                <div
                  key={idx}
                  className="h-full flex flex-col justify-end group relative cursor-pointer"
                  title={`Channel ${idx}-${idx + 1} keV: Normalized Intensity ${intensity}%`}
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-sm transition-all duration-300 ${colorClass}`}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
                    {idx} keV: {intensity}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-1">
            <span>0 keV</span>
            <span>6 keV</span>
            <span>12 keV</span>
            <span>18 keV</span>
            <span>24 keV</span>
          </div>
        </div>

        {/* Metrology Metrics 4-Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Primary Line ({fingerprint.primaryLine?.siegbahn ?? 'N/A'})</div>
            <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">
              {fingerprint.primaryLineKeV > 0 ? `${fingerprint.primaryLineKeV.toFixed(3)} keV` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {fingerprint.primaryLine ? `λ = ${fingerprint.primaryLine.wavelengthAngstrom.toFixed(3)} Å` : 'Sub-keV emission'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">K-Edge Threshold</div>
            <div className="text-base font-mono font-bold text-amber-300 mt-0.5">
              {fingerprint.edges[0]?.energyKeV ? `${fingerprint.edges[0].energyKeV.toFixed(3)} keV` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Jump: {fingerprint.edges[0]?.jumpRatio ? `${fingerprint.edges[0].jumpRatio}×` : '1.0×'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">K-Fluorescence Yield (ω_K)</div>
            <div className="text-base font-mono font-bold text-emerald-300 mt-0.5">
              {(fingerprint.fluorescenceYieldK * 100).toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              ω_L: {(fingerprint.fluorescenceYieldL * 100).toFixed(2)}%
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Moseley Prediction</div>
            <div className="text-base font-mono font-bold text-purple-300 mt-0.5">
              {fingerprint.moseleyPredictedKeV > 0 ? `${fingerprint.moseleyPredictedKeV.toFixed(3)} keV` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Δ: {fingerprint.moseleyDeltaKeV > 0 ? `+${fingerprint.moseleyDeltaKeV}` : fingerprint.moseleyDeltaKeV} keV ({fingerprint.moseleyDeltaPercent}%)
            </div>
          </div>
        </div>
      </div>

      {/* 2. ADVANCED INTERACTIVE XRF / EDS CONTINUOUS SPECTRAL RESPONSE */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        {/* Header & Export Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-white">Continuous XRF / EDS Spectral Response</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Physics Simulation Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kramers continuum, Duane-Hunt cutoff ({tubeVoltageKV} kV), Fano resolution broadening, window transmission, and tube Rayleigh/Compton scatter
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportSpectrumCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Full Spectrum Channel Counts (.CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Spectrum CSV
            </button>
            <button
              onClick={handleExportSpectrumSVG}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Vector Graphic (.SVG)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Vector SVG
            </button>
          </div>
        </div>

        {/* Instrumental Optics & Detector Controls Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 shadow-inner text-xs">
          {/* 1. Scale Toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Scale:</span>
            <div className="flex items-center bg-slate-950 p-0.5 rounded-md border border-slate-800 font-mono">
              <button
                onClick={() => setIsLogScale(false)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  !isLogScale ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LIN
              </button>
              <button
                onClick={() => setIsLogScale(true)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  isLogScale ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LOG
              </button>
            </div>
          </div>

          {/* 2. Detector Resolution FWHM */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 font-medium">FWHM:</span>
            <select
              value={detectorFWHM}
              onChange={e => setDetectorFWHM(Number(e.target.value))}
              aria-label="Detector energy resolution FWHM in eV"
              className="bg-transparent text-cyan-300 font-mono font-bold focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value={20} className="bg-slate-900 text-white">20 eV (WDXRF)</option>
              <option value={125} className="bg-slate-900 text-white">125 eV (High-Res SDD)</option>
              <option value={135} className="bg-slate-900 text-white">135 eV (Standard SDD)</option>
              <option value={150} className="bg-slate-900 text-white">150 eV (Si(Li) Cryo)</option>
              <option value={800} className="bg-slate-900 text-white">800 eV (Gas Prop)</option>
            </select>
          </div>

          {/* 3. Excitation Anode Tube Target */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-slate-400 font-medium">Tube:</span>
            <select
              value={tubeTarget}
              onChange={e => setTubeTarget(e.target.value as any)}
              aria-label="Excitation X-ray tube anode target"
              className="bg-transparent text-amber-300 font-mono font-bold focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value="Rh" className="bg-slate-900 text-white">Rh (20.2 keV - Universal)</option>
              <option value="Mo" className="bg-slate-900 text-white">Mo (17.5 keV - High Z)</option>
              <option value="W" className="bg-slate-900 text-white">W (59.3 keV - High Power)</option>
              <option value="Cr" className="bg-slate-900 text-white">Cr (5.4 keV - Light Z)</option>
              <option value="Cu" className="bg-slate-900 text-white">Cu (8.0 keV - XRD/XRF)</option>
              <option value="Ag" className="bg-slate-900 text-white">Ag (22.2 keV - Heavy)</option>
            </select>
          </div>

          {/* 4. Excitation Voltage (Duane-Hunt Cutoff) */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <span className="text-slate-400 font-medium">Voltage:</span>
            <select
              value={tubeVoltageKV}
              onChange={e => setTubeVoltageKV(Number(e.target.value))}
              aria-label="Excitation Tube Voltage in kV"
              className="bg-transparent text-yellow-300 font-mono font-bold focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value={15} className="bg-slate-900 text-white">15 kV (Light Elements)</option>
              <option value={30} className="bg-slate-900 text-white">30 kV (Medium Z)</option>
              <option value={40} className="bg-slate-900 text-white">40 kV (Standard XRF)</option>
              <option value={50} className="bg-slate-900 text-white">50 kV (Heavy Elements)</option>
            </select>
          </div>

          {/* 5. Detector Entrance Window */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-slate-400 font-medium">Window:</span>
            <select
              value={detectorWindow}
              onChange={e => setDetectorWindow(e.target.value as any)}
              aria-label="Detector entrance window type"
              className="bg-transparent text-purple-300 font-mono font-bold focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value="ultrathin_polymer" className="bg-slate-900 text-white">Polymer (UTW - All Elements)</option>
              <option value="beryllium_8um" className="bg-slate-900 text-white">8 µm Beryllium (Standard)</option>
              <option value="windowless" className="bg-slate-900 text-white">Windowless (SEM / In-situ)</option>
            </select>
          </div>
        </div>

        {/* Energy ROI & Zoom Bar + Alloy Benchmark Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          {/* Energy Zoom Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              Energy ROI:
            </span>
            {[
              { id: 'all', label: 'All (0.1–Auto)' },
              { id: 'eds_light', label: 'EDS Light (0.1–3.5 keV)' },
              { id: 'transition_metals', label: 'Transition Metals (2.5–12 keV)' },
              { id: 'heavy_elements', label: 'Heavy Elements (10–32 keV)' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setEnergyZoomPreset(preset.id as any);
                  setCustomRange(null);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium transition-all ${
                  energyZoomPreset === preset.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {/* Quick Zoom In/Out Buttons */}
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-800">
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                title="Zoom In (narrows energy window)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                title="Zoom Out (widens energy window)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                title="Reset Zoom to Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/50">
              [{minE.toFixed(2)} – {maxE.toFixed(2)} keV]
            </span>
          </div>

          {/* Standard Alloy / Matrix Overlay Selector */}
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-400 font-medium">Matrix Benchmark:</span>
            <select
              value={selectedAlloySample ?? ''}
              onChange={e => setSelectedAlloySample(e.target.value ? e.target.value : null)}
              aria-label="Standard reference sample alloy overlay"
              className="bg-slate-900 text-emerald-300 border border-slate-700 px-2.5 py-1 rounded-lg font-mono text-xs font-medium focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="" className="bg-slate-900 text-slate-400">None (Pure {element.symbol})</option>
              {PRESET_XRF_SAMPLES.map(sample => (
                <option key={sample.name} value={sample.name} className="bg-slate-900 text-white">
                  {sample.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feature Toggles Strip */}
        <div className="flex items-center gap-2 text-xs pb-1 border-b border-slate-800/80 flex-wrap">
          {[
            { label: 'Continuum (Bremsstrahlung)', state: showBackground, setter: setShowBackground, activeBg: 'bg-indigo-500' },
            { label: 'Tube Scatter (Rayleigh & Compton)', state: showTubeScatter, setter: setShowTubeScatter, activeBg: 'bg-blue-500' },
            { label: 'Si Escape Peaks (E - 1.74)', state: showEscapePeaks, setter: setShowEscapePeaks, activeBg: 'bg-emerald-500' },
            { label: 'Pileup Sum Peaks (2×E)', state: showSumPeaks, setter: setShowSumPeaks, activeBg: 'bg-purple-500' },
            { label: 'Absorption Edges', state: showEdges, setter: setShowEdges, activeBg: 'bg-pink-500' },
            { label: 'Line Markers', state: showLineMarkers, setter: setShowLineMarkers, activeBg: 'bg-cyan-500' },
            { label: 'Decompose Net / Bg', state: showNetCurve, setter: setShowNetCurve, activeBg: 'bg-amber-500' }
          ].map((toggle, idx) => (
            <button
              key={idx}
              onClick={() => toggle.setter(!toggle.state)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition-all ${
                toggle.state 
                  ? 'bg-slate-800/80 border-slate-600 text-white shadow-sm' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className={`relative w-5 h-3 rounded-full transition-colors duration-300 ${toggle.state ? toggle.activeBg : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform duration-300 ${toggle.state ? 'translate-x-2' : 'translate-x-0'}`} />
              </div>
              <span className="font-medium tracking-tight">{toggle.label}</span>
            </button>
          ))}
        </div>

        {/* SVG Spectrum Canvas Container */}
        <div className="relative w-full overflow-x-auto bg-slate-950/90 rounded-xl border border-slate-800 p-2 shadow-inner">
          <svg
            id="xrf-spectrum-svg"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const svgMouseX = (mouseX / rect.width) * svgWidth;
              if (svgMouseX >= padding.left && svgMouseX <= svgWidth - padding.right) {
                const eVal = minE + ((svgMouseX - padding.left) / graphWidth) * (maxE - minE);
                setHoveredEnergy(eVal);
              }
            }}
            onMouseLeave={() => setHoveredEnergy(null)}
          >
            <defs>
              <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.45" />
                <stop offset="60%" stopColor="rgb(6, 182, 212)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="comparatorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(245, 158, 11)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(245, 158, 11)" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="alloyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const y = padding.top + graphHeight * (1 - frac);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="rgba(51, 65, 85, 0.4)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {isLogScale ? `10^${(frac * maxIntensity).toFixed(1)}` : `${Math.round(frac * rawMaxIntensity)}`}
                  </text>
                </g>
              );
            })}

            {/* Grid vertical energy lines */}
            {Array.from({ length: 9 }).map((_, idx) => {
              const energyStep = (maxE - minE) / 8;
              const eVal = minE + idx * energyStep;
              const x = scaleX(eVal);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke="rgba(51, 65, 85, 0.4)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={x}
                    y={padding.top + graphHeight + 16}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {eVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Duane-Hunt Cutoff Limit Line (E = tubeVoltageKV) */}
            {tubeVoltageKV >= minE && tubeVoltageKV <= maxE && (
              <g>
                <line
                  x1={scaleX(tubeVoltageKV)}
                  y1={padding.top}
                  x2={scaleX(tubeVoltageKV)}
                  y2={padding.top + graphHeight}
                  stroke="#eab308"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <text
                  x={scaleX(tubeVoltageKV) - 4}
                  y={padding.top + 14}
                  fill="#facc15"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                  fontWeight="bold"
                >
                  Duane-Hunt Cutoff ({tubeVoltageKV} kV)
                </text>
              </g>
            )}

            {/* Primary Element Spectrum Area & Line */}
            {primaryAreaD && <path d={primaryAreaD} fill="url(#spectrumGradient)" />}
            {primaryPathD && (
              <path
                d={primaryPathD}
                className="drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Decomposed Net Fluorescence Curve (if enabled) */}
            {showNetCurve && netPathD && (
              <path
                d={netPathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
            )}

            {/* Decomposed Bremsstrahlung Continuum Curve (if enabled) */}
            {showNetCurve && bgPathD && (
              <path
                d={bgPathD}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.8"
                strokeDasharray="2 2"
                strokeLinecap="round"
              />
            )}

            {/* Benchmark Alloy Sample Curve (if selected) */}
            {alloyPathD && (
              <path
                d={alloyPathD}
                className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="5 3"
                strokeLinecap="round"
              />
            )}

            {/* Comparator Spectrum Line if present */}
            {comparatorPathD && (
              <path
                d={comparatorPathD}
                className="drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            )}

            {/* Absorption Edge Step Markers */}
            {showEdges &&
              fingerprint.edges.map((edge, idx) => {
                if (edge.energyKeV < minE || edge.energyKeV > maxE) return null;
                const x = scaleX(edge.energyKeV);
                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + graphHeight}
                      stroke="#ec4899"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={x + 3}
                      y={padding.top + 12 + idx * 14}
                      fill="#f472b6"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {edge.name} ({edge.energyKeV.toFixed(2)})
                    </text>
                  </g>
                );
              })}

            {/* Peak Annotations & Line Markers */}
            {showLineMarkers &&
              fingerprint.lines.map((line, idx) => {
                if (line.energyKeV < minE || line.energyKeV > maxE) return null;
                const x = scaleX(line.energyKeV);
                // Approximate peak height on the curve
                const matchPoint = spectrumPoints.find(p => Math.abs(p.energy - line.energyKeV) < 0.08);
                const ptIntensity = matchPoint ? matchPoint.intensity : line.relativeIntensity * 8.0;
                const y = scaleY(ptIntensity);
                const isMajor = line.relativeIntensity >= 40;
                const isK = line.siegbahn.startsWith('K');
                const isL = line.siegbahn.startsWith('L');
                const markerColor = isK ? '#22d3ee' : isL ? '#34d399' : '#f59e0b';

                return (
                  <g
                    key={`peak-${idx}`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPeakLine(line)}
                  >
                    {/* Vertical line indicator */}
                    <line
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={padding.top + graphHeight}
                      stroke={markerColor}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isMajor ? 4 : 2.5}
                      fill={markerColor}
                      stroke="#083344"
                      strokeWidth="1.5"
                      className="transition-transform group-hover:scale-125"
                    />
                    <text
                      x={x}
                      y={Math.max(padding.top + 12, y - 8)}
                      fill={isMajor ? '#e0f2fe' : '#94a3b8'}
                      fontSize={isMajor ? '10' : '8'}
                      fontFamily="monospace"
                      fontWeight={isMajor ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {line.siegbahn}
                    </text>
                  </g>
                );
              })}

            {/* Interactive Hover Crosshair */}
            {hoveredEnergy !== null && (
              <g pointerEvents="none">
                <line
                  x1={scaleX(hoveredEnergy)}
                  y1={padding.top}
                  x2={scaleX(hoveredEnergy)}
                  y2={padding.top + graphHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {hoveredPoint && (
                  <circle
                    cx={scaleX(hoveredPoint.energy)}
                    cy={scaleY(hoveredPoint.intensity)}
                    r="4.5"
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )}

            {/* X-axis title */}
            <text
              x={svgWidth / 2}
              y={svgHeight - 6}
              fill="#94a3b8"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="500"
              textAnchor="middle"
            >
              Photon Energy E (keV)
            </text>

            {/* Y-axis title */}
            <text
              x={-svgHeight / 2}
              y={14}
              fill="#94a3b8"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="500"
              textAnchor="middle"
              transform="rotate(-90)"
            >
              Fluorescence Intensity (Counts / sec)
            </text>
          </svg>

          {/* Advanced Real-Time Holographic Spectral Readout Card */}
          {hoveredEnergy !== null && (
            <div className="absolute top-4 right-4 bg-slate-950/95 border border-cyan-500/50 p-3.5 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.2)] backdrop-blur-xl pointer-events-none min-w-[260px] max-w-[320px] text-xs">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <Activity className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                    Spectral Channel
                  </span>
                </div>
                {hoveredPoint?.peakSeries && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                    hoveredPoint.isEscape
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : hoveredPoint.isSum
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : hoveredPoint.isTubeScatter
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {hoveredPoint.peakSeries} Peak
                  </span>
                )}
              </div>

              {/* Energy Values */}
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="text-xl font-mono font-bold text-white">
                  {hoveredEnergy.toFixed(3)} <span className="text-cyan-400 text-xs font-semibold">keV</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  λ = {(12.3984 / Math.max(0.01, hoveredEnergy)).toFixed(3)} Å
                </div>
              </div>

              {/* Intensity Counts Breakdown */}
              <div className="space-y-1 py-1.5 px-2 bg-slate-900/80 rounded-lg border border-slate-800/80 font-mono text-[11px] mb-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total Counts:</span>
                  <span className="font-bold text-cyan-300">
                    {hoveredPoint?.intensity ? hoveredPoint.intensity.toFixed(1) : '0.0'} cps
                  </span>
                </div>
                {showNetCurve && hoveredPoint && (
                  <>
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Net Peak Counts:</span>
                      <span className="text-sky-300">{hoveredPoint.netIntensity?.toFixed(1) ?? '0.0'} cps</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Continuum Bg:</span>
                      <span className="text-slate-400">{hoveredPoint.backgroundIntensity?.toFixed(1) ?? '0.0'} cps</span>
                    </div>
                  </>
                )}
              </div>

              {/* Nearest Emission Line Identification */}
              {nearestLine ? (
                <div className="bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/50">
                  <div className="text-[10px] text-cyan-400 font-semibold uppercase flex items-center justify-between">
                    <span>Nearest Characteristic Line</span>
                    <span className="font-mono text-white">{element.symbol} {nearestLine.siegbahn}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-200 mt-0.5">
                    {nearestLine.iupac} ({nearestLine.transition})
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>Line: {nearestLine.energyKeV.toFixed(3)} keV</span>
                    <span>ΔE: {(Math.abs(hoveredEnergy - nearestLine.energyKeV) * 1000).toFixed(0)} eV</span>
                  </div>
                </div>
              ) : hoveredPoint?.peakLabel ? (
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300">
                  {hoveredPoint.peakLabel}
                </div>
              ) : null}

              {/* Benchmark Sample / Comparator readout if active */}
              {selectedSampleObj && (
                <div className="mt-1.5 text-[10px] font-mono text-emerald-400 flex justify-between">
                  <span>Matrix: {selectedSampleObj.name}</span>
                </div>
              )}
              {comparatorFingerprint && (
                <div className="mt-1 text-[10px] font-mono text-amber-400 flex justify-between">
                  <span>Comparator: {comparatorFingerprint.symbol} ({comparatorFingerprint.name})</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend & Spectrum Diagnostics Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              {element.symbol} ({element.name}) Spectrum
            </span>

            {showNetCurve && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-400 border-t border-dashed border-sky-400 inline-block" />
                  Net Fluorescence
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-500 border-t border-dotted border-slate-500 inline-block" />
                  Continuum Background
                </span>
              </>
            )}

            {selectedSampleObj && (
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-3 h-0.5 bg-emerald-400 border-t border-dashed border-emerald-400 inline-block" />
                {selectedSampleObj.name} Overlay
              </span>
            )}

            {comparatorFingerprint && (
              <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                <span className="w-3 h-0.5 bg-amber-400 border-t border-dashed border-amber-400 inline-block" />
                {comparatorFingerprint.symbol} Comparator
              </span>
            )}

            {showEdges && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-pink-500 inline-block" />
                Absorption Edge
              </span>
            )}
          </div>

          <span className="font-mono text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            Detector: {detectorFWHM} eV SDD | Tube: {tubeTarget} ({tubeVoltageKV} kV) | Window: {detectorWindow === 'ultrathin_polymer' ? 'UTW Polymer' : detectorWindow === 'beryllium_8um' ? 'Be 8µm' : 'Windowless'}
          </span>
        </div>
      </div>

      {/* 3. DUAL-COLUMN LAYOUT: CHARACTERISTIC LINES MATRIX & REVERSE FINGERPRINT IDENTIFIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Characteristic Lines Table */}
        <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-bold text-white">Characteristic Emission Lines & Transitions</h4>
            </div>
            <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              {fingerprint.lines.length} Line Transitions
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Siegbahn</th>
                  <th className="py-2.5 px-3">IUPAC</th>
                  <th className="py-2.5 px-3">Energy (keV)</th>
                  <th className="py-2.5 px-3">Wavelength λ</th>
                  <th className="py-2.5 px-3">Rel. Intensity</th>
                  <th className="py-2.5 px-3">Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {fingerprint.lines.map((line, idx) => {
                  const isPrimary = fingerprint.primaryLine?.siegbahn === line.siegbahn;
                  const isSelected = selectedPeakLine?.siegbahn === line.siegbahn;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedPeakLine(line)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-900/40 text-white font-bold ring-1 ring-inset ring-cyan-400/50'
                          : isPrimary
                          ? 'bg-cyan-950/20 font-semibold text-cyan-200 hover:bg-cyan-950/40'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                      title={`Click to inspect transition details for ${line.siegbahn}`}
                    >
                      <td className="py-2.5 px-3 flex items-center gap-1.5">
                        <span className={isPrimary ? 'text-cyan-400 font-bold' : 'text-slate-200'}>
                          {line.siegbahn}
                        </span>
                        {isPrimary && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Primary
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{line.iupac}</td>
                      <td className="py-2.5 px-3 text-cyan-300 font-bold">{line.energyKeV.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{line.wavelengthAngstrom.toFixed(3)} Å</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${line.relativeIntensity}%` }}
                              className="h-full bg-cyan-400 rounded-full"
                            />
                          </div>
                          <span className="text-[11px] text-slate-300">{line.relativeIntensity}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{line.transition}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Escape and Sum Peaks Explanation */}
          {(fingerprint.escapePeaks.length > 0 || fingerprint.sumPeaks.length > 0) && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Detector Artifacts & Physical Satellite Peaks:
              </div>
              <div className="text-slate-400 leading-relaxed">
                {fingerprint.escapePeaks.map((esc, i) => (
                  <span key={i} className="inline-block mr-3">
                    • <span className="text-cyan-300">{esc.detector} Escape Peak</span>: {esc.parentLine} at{' '}
                    <span className="font-mono text-white font-bold">{esc.escapeEnergyKeV.toFixed(3)} keV</span> (E − {esc.detector === 'Si' ? '1.740' : '9.886'} keV)
                  </span>
                ))}
                {fingerprint.sumPeaks.map((sum, i) => (
                  <span key={i} className="inline-block">
                    • <span className="text-purple-300">Sum Pileup Peak</span>: {sum.parentLine} at{' '}
                    <span className="font-mono text-white font-bold">{sum.sumEnergyKeV.toFixed(3)} keV</span> (2×E)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Reverse XRF Peak Identifier & Matcher */}
        <div className="lg:col-span-5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-base font-bold text-white">Reverse XRF Peak Identifier</h4>
              <p className="text-xs text-slate-400">Match measured sample peak energies to periodic table</p>
            </div>
          </div>

          {/* Peak Input Field */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>Experimental Peaks (keV):</span>
              <span className="text-[10px] text-slate-500 font-mono">Comma or space separated</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={measuredInput}
                onChange={e => setMeasuredInput(e.target.value)}
                placeholder="e.g. 8.048, 8.905 or 6.40, 7.06"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              {measuredInput && (
                <button
                  onClick={() => setMeasuredInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tolerance & Presets */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>ΔE Tolerance:</span>
              <select
                value={matchTolerance}
                onChange={e => setMatchTolerance(Number(e.target.value))}
                aria-label="Energy matching tolerance in keV"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-emerald-300 font-mono focus:outline-none"
              >
                <option value={0.04}>±0.04 keV (WDXRF)</option>
                <option value={0.08}>±0.08 keV (SDD)</option>
                <option value={0.15}>±0.15 keV (Wide)</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (fingerprint.lines.length > 0) {
                  const pks = fingerprint.lines.slice(0, 3).map(l => l.energyKeV.toFixed(3)).join(', ');
                  setMeasuredInput(pks);
                }
              }}
              className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium underline"
            >
              Test {element.symbol} Lines
            </button>
          </div>

          {/* Quick Preset Samples */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-400">Quick Test Standard Alloys:</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_XRF_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setMeasuredInput(sample.peaks.join(', '))}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors"
                  title={`${sample.description} - Peaks: ${sample.peaks.join(', ')} keV`}
                >
                  {sample.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Match Results List */}
          <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Matching Element Candidates:</span>
              <span className="text-[11px] font-mono text-slate-500">{matchResults.length} Found</span>
            </div>

            {matchResults.length === 0 ? (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
                {measuredInput.trim()
                  ? 'No matching element found within tolerance. Try increasing ΔE tolerance.'
                  : 'Enter peak energies or select an alloy preset above to identify elements.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {matchResults.slice(0, 5).map((result, idx) => {
                  const confColor =
                    result.confidence === 'Definite'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : result.confidence === 'High'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                            {result.symbol}
                          </span>
                          <div>
                            <span className="font-bold text-white text-xs">{result.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-1">Z={result.atomicNumber}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${confColor}`}>
                            {result.confidence} ({result.score}%)
                          </span>
                        </div>

                        {/* Matched lines tags */}
                        <div className="text-[10px] font-mono text-slate-400 flex flex-wrap gap-1 mt-1">
                          {result.matchedPeaks.map((mp, mi) => (
                            <span key={mi} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {mp.matchedLine.siegbahn}: {mp.matchedLine.energyKeV.toFixed(3)} keV (Δ{mp.deltaKeV.toFixed(3)})
                            </span>
                          ))}
                        </div>
                      </div>

                      {onSelectElement && (
                        <button
                          onClick={() => onSelectElement(result.atomicNumber)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1 flex-shrink-0 transition-all"
                          title={`Inspect ${result.name} XRF Fingerprint`}
                        >
                          Inspect
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MULTI-ELEMENT COMPARATOR & SPECTRAL INTERFERENCE ANALYZER */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <div>
              <h4 className="text-base font-bold text-white">Dual Element Fingerprint Comparator & Overlap Analyzer</h4>
              <p className="text-xs text-slate-400">
                Overlay second element spectrum to analyze peak separation and spectral line interferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Compare with:</span>
            <select
              value={comparatorZ ?? ''}
              onChange={e => setComparatorZ(e.target.value ? Number(e.target.value) : null)}
              aria-label="Select secondary element for spectral comparison"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="">-- None (Select Element) --</option>
              {allElements.map(el => (
                <option key={el.atomicNumber} value={el.atomicNumber} className="bg-slate-900 text-white">
                  Z={el.atomicNumber} {el.symbol} - {el.name} ({el.primaryLineKeV.toFixed(2)} keV)
                </option>
              ))}
            </select>
          </div>
        </div>

        {comparatorFingerprint ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30">
                <div className="text-xs text-cyan-300 font-bold mb-1">
                  Base Element: {element.name} ({element.symbol})
                </div>
                <div className="text-xs text-slate-300 font-mono space-y-0.5">
                  <div>Primary: {fingerprint.primaryLine?.siegbahn} = {fingerprint.primaryLineKeV.toFixed(3)} keV</div>
                  <div>Hash: {fingerprint.fingerprintHash}</div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30">
                <div className="text-xs text-amber-300 font-bold mb-1">
                  Comparator: {comparatorFingerprint.name} ({comparatorFingerprint.symbol})
                </div>
                <div className="text-xs text-slate-300 font-mono space-y-0.5">
                  <div>Primary: {comparatorFingerprint.primaryLine?.siegbahn} = {comparatorFingerprint.primaryLineKeV.toFixed(3)} keV</div>
                  <div>Hash: {comparatorFingerprint.fingerprintHash}</div>
                </div>
              </div>
            </div>

            {/* Interferences List */}
            {spectralInterferences.length > 0 ? (
              <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Potential Spectral Interferences Detected (ΔE ≤ 0.15 keV):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  {spectralInterferences.map((inter, i) => (
                    <div key={i} className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                      <span className="text-cyan-300">{element.symbol} {inter.line1.siegbahn}</span> ({inter.line1.energyKeV.toFixed(3)} keV) vs{' '}
                      <span className="text-amber-300">{comparatorFingerprint.symbol} {inter.line2.siegbahn}</span> ({inter.line2.energyKeV.toFixed(3)} keV) →{' '}
                      <span className="text-rose-400 font-bold">Δ = {inter.deltaKeV.toFixed(3)} keV</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                No critical peak overlaps detected between {element.symbol} and {comparatorFingerprint.symbol}. Spectral lines are well-resolved.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
            Select a second element from the dropdown above to overlay and compare their XRF fingerprints side-by-side.
          </div>
        )}
      </div>

      {/* 5. SELECTED CHARACTERISTIC PEAK DETAIL INSPECTION MODAL */}
      {selectedPeakLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] max-w-lg w-full p-5 space-y-4 text-xs font-sans">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-mono font-bold text-sm">
                  {element.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white font-mono">
                      {element.symbol} {selectedPeakLine.siegbahn}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {selectedPeakLine.iupac}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {element.name} (Z={element.number}) Characteristic Fluorescent Transition
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPeakLine(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Physical Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Photon Energy</span>
                <span className="text-sm font-bold text-cyan-300">{selectedPeakLine.energyKeV.toFixed(3)} keV</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{(selectedPeakLine.energyKeV * 1000).toFixed(1)} eV</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Wavelength λ</span>
                <span className="text-sm font-bold text-slate-200">{selectedPeakLine.wavelengthAngstrom.toFixed(3)} Å</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{(selectedPeakLine.wavelengthAngstrom * 100).toFixed(1)} pm</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Relative Intensity</span>
                <span className="text-sm font-bold text-amber-300">{selectedPeakLine.relativeIntensity}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {selectedPeakLine.relativeIntensity >= 80 ? 'Primary Line' : 'Secondary Line'}
                </span>
              </div>
            </div>

            {/* Atomic Orbital Subshell Shell Transition */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Electron Orbital Transition:</span>
                <span className="font-mono text-cyan-300 font-bold">{selectedPeakLine.transition}</span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                An inner-shell core vacancy is filled by an electron relaxing from an outer subshell, releasing a characteristic photon with exact quantum energy difference $E = E_i - E_f$.
              </div>
            </div>

            {/* Spectrometer & Instrument Diagnostic Properties */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Si Escape Peak (SDD):</span>
                {selectedPeakLine.energyKeV > 1.74 ? (
                  <span className="text-emerald-300 font-bold">
                    {(selectedPeakLine.energyKeV - 1.74).toFixed(3)} keV (E − 1.740 keV)
                  </span>
                ) : (
                  <span className="text-slate-500">None (below Si-Kα threshold)</span>
                )}
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Pulse Pileup Sum Peak:</span>
                <span className="text-purple-300 font-bold">
                  {(selectedPeakLine.energyKeV * 2).toFixed(3)} keV (2×E)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Excitation Overvoltage (at {tubeVoltageKV} kV):</span>
                <span className={tubeVoltageKV >= selectedPeakLine.energyKeV * 1.5 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {(tubeVoltageKV / Math.max(0.1, selectedPeakLine.energyKeV)).toFixed(2)}× {tubeVoltageKV >= selectedPeakLine.energyKeV * 1.5 ? '(Optimal)' : '(Marginal)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const span = Math.max(1.5, selectedPeakLine.energyKeV * 0.6);
                  setCustomRange({
                    minE: Math.max(0.1, Number((selectedPeakLine.energyKeV - span).toFixed(2))),
                    maxE: Number((selectedPeakLine.energyKeV + span).toFixed(2))
                  });
                  setEnergyZoomPreset('custom');
                  setSelectedPeakLine(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                Zoom Spectrum on Peak
              </button>
              <button
                onClick={() => setSelectedPeakLine(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
