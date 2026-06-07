import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { parseXYData, applySavitzkyGolay } from '../utils/physics';
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  SlidersHorizontal,
  Download,
  Copy,
  Trash2,
  Zap,
  CheckCircle,
  FileText
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

export const SignalProcessingModule: React.FC = () => {
  const { t } = useTranslation();
  const [rawDataStr, setRawDataStr] = useState<string>('');
  const [windowSize, setWindowSize] = useState<number>(11);
  const [degree, setDegree] = useState<number>(2);
  const [processedData, setProcessedData] = useState<{twoTheta: number; intensity: number; smoothed: number}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = () => {
    if (!rawDataStr.trim()) return;
    setIsProcessing(true);
    playSynthTone('tick');

    setTimeout(() => {
      const raw = parseXYData(rawDataStr);
      if (raw.length === 0) {
        setIsProcessing(false);
        return;
      }
      const smoothed = applySavitzkyGolay(raw, windowSize, degree);
      
      const combined = raw.map((point, i) => ({
        twoTheta: point.twoTheta,
        intensity: point.intensity,
        smoothed: smoothed[i] ? smoothed[i].intensity : point.intensity
      }));

      setProcessedData(combined);
      setIsProcessing(false);
      playSynthTone('success');
    }, 300);
  };

  const handleCopy = () => {
    if (processedData.length === 0) return;
    const csv = processedData.map(d => `${d.twoTheta.toFixed(4)},${d.smoothed.toFixed(4)}`).join('\n');
    navigator.clipboard.writeText(csv);
    setCopied(true);
    playSynthTone('tick');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (processedData.length === 0) return;
    const csv = processedData.map(d => `${d.twoTheta.toFixed(4)},${d.smoothed.toFixed(4)}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smoothed_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSynthTone('tick');
  };

  const loadExample = () => {
    // Generate a noisy peak
    let data = '';
    for (let x = 20; x <= 60; x += 0.1) {
      const g1 = 100 * Math.exp(-Math.pow(x - 30, 2) / (2 * Math.pow(0.5, 2)));
      const g2 = 200 * Math.exp(-Math.pow(x - 45, 2) / (2 * Math.pow(0.8, 2)));
      const noise = Math.random() * 20 - 10;
      const y = Math.max(0, g1 + g2 + noise + 10);
      data += `${x.toFixed(2)},${y.toFixed(2)}\n`;
    }
    setRawDataStr(data);
    playSynthTone('tick');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-950/80 backdrop-blur-md rounded-[2rem] shadow-2xl border border-orange-500/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2" />
        
        <div className="p-6 border-b border-orange-500/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">Signal Pre-processing</h2>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Apply Savitzky-Golay filtering to reduce noise in raw diffractograms</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">Raw Data Input</label>
                <button
                  onClick={loadExample}
                  className="text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-widest px-2 py-1 bg-orange-500/10 rounded-lg border border-transparent hover:border-orange-500/30 transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Load Example
                </button>
              </div>
              <textarea
                value={rawDataStr}
                onChange={(e) => setRawDataStr(e.target.value)}
                placeholder="Paste X,Y data here...&#10;20.0, 1500&#10;20.1, 1550&#10;..."
                className="w-full h-48 bg-black/40 border border-orange-500/20 shadow-inner rounded-xl p-4 text-[11px] font-mono text-slate-300 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none resize-none custom-scrollbar"
              />
            </div>

            <div className="space-y-5 p-5 bg-black/40 shadow-inner rounded-2xl border border-orange-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                <SlidersHorizontal className="w-4 h-4 text-orange-400" />
                <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Filter Settings</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Window Size (odd)</label>
                  <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{windowSize} pts</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="49"
                  step="2"
                  value={windowSize}
                  onChange={(e) => setWindowSize(parseInt(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Polynomial Degree</label>
                  <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{degree}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={degree}
                  onChange={(e) => {
                    const nextVal = parseInt(e.target.value);
                    if (nextVal < windowSize) setDegree(nextVal);
                  }}
                  className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || !rawDataStr.trim()}
              className="w-full py-4 text-[11px] uppercase tracking-widest bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 rounded-xl font-black shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-orange-400/50 border-t-orange-400 rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isProcessing ? 'Processing Algorithm...' : 'Execute Filter'}
            </button>
          </div>

          <div className="lg:col-span-3">
            {processedData.length > 0 ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Smoothing Results
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-1.5 bg-black/40 border border-white/5 hover:bg-black/60 hover:border-orange-500/30 text-slate-300 rounded-lg text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5 transition-all"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400/70" />}
                      {copied ? 'Copied' : 'Copy CSV'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3.5 py-1.5 bg-orange-500/10 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5 transition-all shadow-inner"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="bg-black/40 rounded-2xl border border-orange-500/10 shadow-inner p-4 h-[400px] relative w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processedData} margin={{ top: 15, right: 15, bottom: 20, left: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f97316" opacity={0.15} />
                      <XAxis 
                        dataKey="twoTheta" 
                        type="number"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={(v) => v.toFixed(1)}
                        tickCount={10}
                        axisLine={{ stroke: '#f97316', strokeOpacity: 0.3 }}
                        tickLine={{ stroke: '#f97316', strokeOpacity: 0.3 }}
                      />
                      <YAxis 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={(v) => Math.round(v).toString()}
                        domain={['auto', 'auto']}
                        width={40}
                        axisLine={{ stroke: '#f97316', strokeOpacity: 0.3 }}
                        tickLine={{ stroke: '#f97316', strokeOpacity: 0.3 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(249, 115, 22, 0.3)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          backdropFilter: 'blur(8px)',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                        itemStyle={{ color: '#fed7aa', fontWeight: 'bold' }}
                        labelStyle={{ color: '#fdba74', marginBottom: '8px', borderBottom: '1px solid rgba(249,115,22,0.2)', paddingBottom: '4px' }}
                        labelFormatter={(v) => `2θ: ${Number(v).toFixed(3)}°`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="intensity" 
                        stroke="#475569" 
                        fill="#f97316" 
                        fillOpacity={0.05}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                        name="Raw Signal" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="smoothed" 
                        stroke="#f97316" 
                        dot={false}
                        strokeWidth={2.5}
                        name="Smoothed Response"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-full bg-black/20 border-2 border-dashed border-orange-500/20 rounded-2xl flex flex-col items-center justify-center text-slate-500 min-h-[450px]">
                <Activity className="w-16 h-16 mb-5 text-orange-500/20" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Awaiting Signal Data</p>
                <p className="text-[11px] mt-2 max-w-xs text-center text-slate-500/80 leading-relaxed font-sans">Provide raw XY diffraction parameters and initialize algorithm to visualize regression responses.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
