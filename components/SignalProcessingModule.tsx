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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Signal Pre-processing</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Apply Savitzky-Golay filtering to reduce noise in raw diffractograms</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Raw Data Input</label>
                <button
                  onClick={loadExample}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
                >
                  Load Example
                </button>
              </div>
              <textarea
                value={rawDataStr}
                onChange={(e) => setRawDataStr(e.target.value)}
                placeholder="Paste X,Y data here...&#10;20.0, 1500&#10;20.1, 1550&#10;..."
                className="w-full h-48 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter Settings</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Window Size (odd)</label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{windowSize} pts</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="49"
                  step="2"
                  value={windowSize}
                  onChange={(e) => setWindowSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Polynomial Degree</label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{degree}</span>
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
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || !rawDataStr.trim()}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing...' : 'Apply Filter'}
            </button>
          </div>

          <div className="lg:col-span-3">
            {processedData.length > 0 ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Smoothing Results
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy CSV'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0B1121] rounded-xl border border-slate-200 dark:border-white/10 p-4 h-[400px] relative w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processedData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis 
                        dataKey="twoTheta" 
                        type="number"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v) => v.toFixed(1)}
                        tickCount={10}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v) => Math.round(v).toString()}
                        domain={['auto', 'auto']}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        labelFormatter={(v) => `2θ: ${Number(v).toFixed(3)}°`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="intensity" 
                        stroke="#94a3b8" 
                        fill="#94a3b8" 
                        fillOpacity={0.1}
                        strokeWidth={1}
                        strokeOpacity={0.5}
                        name="Raw Data" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="smoothed" 
                        stroke="#f97316" 
                        dot={false}
                        strokeWidth={2}
                        name="Smoothed Data" 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 min-h-[450px]">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-slate-600 dark:text-slate-300">No Data Processed</p>
                <p className="text-sm mt-1 max-w-sm text-center">Paste raw XY diffraction data on the left and apply the Savitzky-Golay filter to visualize the smoothed results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
