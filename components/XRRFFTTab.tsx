import React, { useState } from 'react';
import { FFTThicknessResult } from '../utils/xrrPhysics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers, Activity, Sparkles, Sliders, Info, Zap } from 'lucide-react';

interface XRRFFTTabProps {
  fftResult: FFTThicknessResult | null;
  onApplyThicknessToLayer?: (thicknessA: number) => void;
}

export const XRRFFTTab: React.FC<XRRFFTTabProps> = ({ fftResult, onApplyThicknessToLayer }) => {
  if (!fftResult) {
    return (
      <div id="xrr-fft-empty" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No Spatial Frequency Data</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          FFT thickness extraction computes the real-space spatial frequency spectrum from the Kiessig fringes (qz &gt; 0.04 Å⁻¹).
        </p>
      </div>
    );
  }

  const { spatialFrequencies, detectedPeaks } = fftResult;

  return (
    <div id="xrr-fft-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Spatial Frequency Fourier Power Spectrum |F(z)|
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-extracts thin film sub-layer and total stack thickness without requiring initial trial fitting parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-xs text-amber-300 font-mono">
            {detectedPeaks.length} Peak(s) Found
          </span>
        </div>
      </div>

      {/* Fourier Transform Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spatialFrequencies} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="thicknessA"
                stroke="#94a3b8"
                label={{ value: 'Real-Space Depth / Thickness z (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                label={{ value: 'Fourier Power (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val}%`, 'Fourier Amplitude']}
                labelFormatter={(label) => `Thickness z = ${label} Å (${(Number(label) / 10).toFixed(2)} nm)`}
              />
              {detectedPeaks.map((peak, idx) => (
                <ReferenceLine
                  key={idx}
                  x={peak.thicknessA}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{ value: `${peak.thicknessA} Å`, fill: '#38bdf8', fontSize: 11, position: 'top' }}
                />
              ))}
              <Area type="monotone" dataKey="normalizedAmp" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#fftGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detected Thickness Peaks List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {detectedPeaks.map((peak, idx) => (
          <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">{peak.label}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                  {peak.amplitude}% Max
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {peak.thicknessA} <span className="text-sm font-normal text-slate-400">Å</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {peak.thicknessNm} nm • SNR: {peak.snr}
              </div>
            </div>

            {onApplyThicknessToLayer && (
              <button
                id={`apply-fft-peak-${idx}`}
                onClick={() => onApplyThicknessToLayer(peak.thicknessA)}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply to Active Film
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
