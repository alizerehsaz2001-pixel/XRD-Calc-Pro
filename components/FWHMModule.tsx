import React, { useState, useEffect, useRef } from 'react';
import { simulatePeak } from '../utils/physics';
import { FWHMResult } from '../types';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label
} from 'recharts';

export const FWHMModule: React.FC = () => {
  const [type, setType] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt'>('Pseudo-Voigt');
  const [center, setCenter] = useState<number>(30);
  const [fwhm, setFwhm] = useState<number>(0.5);
  const [eta, setEta] = useState<number>(0.5);
  const [amplitude, setAmplitude] = useState<number>(100);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<FWHMResult | null>(null);
  
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const range: [number, number] = [center - fwhm * 4, center + fwhm * 4];
    const { points, stats } = simulatePeak(type, center, fwhm, eta, amplitude, range);
    setChartData(points);
    setStats(stats);
  }, [type, center, fwhm, eta, amplitude]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const analyzeProfile = () => {
    if (!stats) return null;
    const messages: { type: 'info' | 'warning' | 'error', text: string }[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    // Shape Factor Analysis
    if (type === 'Gaussian' && Math.abs(stats.shapeFactor - 0.939) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Gaussian (0.939).` });
       status = 'warning';
    }
    if (type === 'Lorentzian' && Math.abs(stats.shapeFactor - 0.637) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Lorentzian (0.637).` });
       status = 'warning';
    }

    // FWHM Analysis
    if (fwhm < 0.02) {
      messages.push({ type: 'warning', text: "FWHM < 0.02° is typically below instrumental resolution for standard lab XRD." });
      status = 'warning';
    } else if (fwhm > 3) {
      messages.push({ type: 'info', text: "Broad peak (>3°). Indicates amorphous phase or crystallites < 2nm." });
    }

    // Mixing Factor Analysis
    if (type === 'Pseudo-Voigt') {
        if (eta < 0.2) messages.push({ type: 'info', text: "Dominantly Gaussian character (Strain/Instrument dominated)." });
        else if (eta > 0.8) messages.push({ type: 'info', text: "Dominantly Lorentzian character (Size dominated)." });
    }

    return { status, messages };
  };

  const analysis = analyzeProfile();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Line Profile Simulator
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Profile Type</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      if (t === 'Gaussian') setEta(0);
                      else if (t === 'Lorentzian') setEta(1);
                      else setEta(0.5);
                    }}
                    className={`flex-1 py-2.5 px-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-200 ${
                      type === t 
                        ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {t === 'Pseudo-Voigt' ? 'P-Voigt' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">Peak Center (2θ)</label>
                <span className="text-xs font-mono text-orange-600 font-bold">{center.toFixed(2)}°</span>
              </div>
              <input
                type="range" min="10" max="150" step="0.1"
                value={center} onChange={(e) => setCenter(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">FWHM (Δ2θ)</label>
                <span className="text-xs font-mono text-orange-600 font-bold">{fwhm.toFixed(3)}°</span>
              </div>
              <input
                type="range" min="0.01" max="5" step="0.01"
                value={fwhm} onChange={(e) => setFwhm(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">Mixing Factor (η)</label>
                <span className="text-xs font-mono text-orange-600 font-bold">{(eta * 100).toFixed(0)}% L</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={eta} 
                onChange={(e) => setEta(parseFloat(e.target.value))}
                disabled={type !== 'Pseudo-Voigt'}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  type === 'Pseudo-Voigt' ? 'bg-slate-200 accent-orange-600' : 'bg-slate-100 accent-slate-400 cursor-not-allowed'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold">
                <span>Gaussian</span>
                <span>Lorentzian</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Strict JSON Results</h3>
               <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                 <pre className="text-[10px] font-mono text-orange-400">
                   {JSON.stringify({
                     module: "FWHM-Basics",
                     profile_type: type,
                     results: stats
                   }, null, 2)}
                 </pre>
               </div>
            </div>

            {/* Profile Analysis Section */}
            {analysis && (
              <div className={`p-4 rounded-lg border ${
                analysis.status === 'ok' ? 'bg-emerald-50 border-emerald-200' : 
                analysis.status === 'warning' ? 'bg-amber-50 border-amber-200' : 
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {analysis.status === 'ok' ? (
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <h3 className={`text-sm font-bold ${
                    analysis.status === 'ok' ? 'text-emerald-800' : 
                    analysis.status === 'warning' ? 'text-amber-800' : 
                    'text-red-800'
                  }`}>
                    Profile Analysis
                  </h3>
                </div>
                
                {analysis.messages.length > 0 ? (
                  <ul className="space-y-1">
                    {analysis.messages.map((msg, idx) => (
                      <li key={idx} className={`text-xs flex gap-2 ${
                        msg.type === 'warning' ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        <span>•</span>
                        <span>{msg.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-700">Parameters appear physically consistent for standard XRD analysis.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualizer and Stats */}
      <div className="lg:col-span-8 space-y-6">
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col relative overflow-hidden cursor-none"
          ref={chartContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePos(null)}
        >
           <h3 className="text-lg font-bold text-slate-800 mb-6">Peak Profile Visualizer</h3>
           <div className="flex-1 w-full min-h-0 min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart 
                 data={chartData} 
                 margin={{ top: 20, right: 60, left: 20, bottom: 30 }}
               >
                 <defs>
                   <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                   <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                     <rect width="2" height="4" transform="translate(0,0)" fill="#94a3b8" opacity="0.3"></rect>
                   </pattern>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="x" 
                   type="number" 
                   domain={['auto', 'auto']} 
                   tick={{fontSize: 10}}
                   label={{ value: 'Angle 2θ', position: 'bottom', offset: 15, fontSize: 12, fontWeight: 'bold' }}
                 />
                 <YAxis hide domain={[0, amplitude * 1.2]} />
                 <Tooltip 
                   content={({ active, payload, label }) => {
                     if (active && payload && payload.length) {
                       const dataPoint = payload[0].payload;
                       // Calculate Scherrer size for this specific point if it were the peak center
                       // Just for dynamic feedback
                       const thetaRad = (dataPoint.x / 2) * Math.PI / 180;
                       const localSize = 0.15406 * 0.9 / ((fwhm * Math.PI / 180) * Math.cos(thetaRad));
                       
                       return (
                         <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-700 min-w-[150px]">
                           <p className="font-bold mb-2 border-b border-slate-600 pb-1">2θ: {dataPoint.x.toFixed(3)}°</p>
                           <div className="space-y-1">
                             <div className="flex justify-between gap-4">
                               <span className="text-slate-400">Intensity:</span>
                               <span className="font-mono font-bold text-blue-300">{dataPoint.y.toFixed(1)}</span>
                             </div>
                             <div className="flex justify-between gap-4">
                               <span className="text-slate-400">Current FWHM:</span>
                               <span className="font-mono text-orange-300">{fwhm.toFixed(3)}°</span>
                             </div>
                             <div className="flex justify-between gap-4">
                               <span className="text-slate-400">Est. Size:</span>
                               <span className="font-mono text-emerald-300">{localSize.toFixed(1)} nm</span>
                             </div>
                           </div>
                         </div>
                       );
                     }
                     return null;
                   }}
                   cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                 />
                 
                 {/* Background Area */}
                 {chartData.length > 0 && (
                   <ReferenceArea 
                     x1={chartData[0].x} 
                     x2={chartData[chartData.length - 1].x} 
                     y1={0} 
                     y2={amplitude * 0.05} 
                     fill="url(#hatch)" 
                     stroke="none"
                   >
                      <Label value="Background" position="insideBottomRight" offset={10} fill="#64748b" fontSize={11} fontWeight="bold" />
                   </ReferenceArea>
                 )}

                 {/* Integral Breadth Rectangle */}
                 {stats && (
                   <ReferenceArea 
                     x1={center - stats.integralBreadth / 2} 
                     x2={center + stats.integralBreadth / 2} 
                     y1={0} 
                     y2={amplitude} 
                     fill="rgba(200, 200, 200, 0.15)"
                     stroke="#64748b"
                     strokeDasharray="3 3"
                   >
                     <Label value="Integral breadth" position="insideBottom" offset={10} fill="#64748b" fontSize={11} fontWeight="bold" />
                   </ReferenceArea>
                 )}

                 {/* Peak Position Line */}
                 <ReferenceLine x={center} stroke="#1e293b" strokeDasharray="3 3">
                    <Label value="Peak position 2θ" position="top" fill="#1e293b" fontSize={11} fontWeight="bold" offset={10} />
                 </ReferenceLine>

                 {/* Imax Line */}
                 <ReferenceLine y={amplitude} stroke="#94a3b8" strokeDasharray="3 3">
                    <Label value="Imax" position="insideLeft" fill="#1e293b" fontSize={11} fontWeight="bold" offset={10} />
                 </ReferenceLine>

                 {/* Half Max Line */}
                 <ReferenceLine y={amplitude / 2} stroke="#94a3b8" strokeDasharray="3 3">
                    <Label value="Imax / 2" position="insideLeft" fill="#1e293b" fontSize={11} fontWeight="bold" offset={10} />
                 </ReferenceLine>

                 {/* FWHM Arrow Segment */}
                 <ReferenceLine 
                   segment={[
                     { x: center - fwhm / 2, y: amplitude / 2 }, 
                     { x: center + fwhm / 2, y: amplitude / 2 }
                   ]} 
                   stroke="#1e293b" 
                   strokeWidth={2}
                 >
                   <Label value="FWHM" position="top" fill="#1e293b" fontSize={11} fontWeight="bold" offset={5} />
                 </ReferenceLine>

                 {/* Main Peak Area */}
                 <Area 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorY)" 
                    isAnimationActive={false}
                    activeDot={false}
                 />
               </ComposedChart>
             </ResponsiveContainer>
             
             {/* Custom Annotations Overlay (for things hard to do in Recharts) */}
             <div className="absolute bottom-36 right-12 text-xs font-bold text-slate-500 flex items-center gap-1 pointer-events-none">
                <span>Peak area I</span>
                <span className="text-[9px] align-sub">int</span>
                <svg className="w-4 h-4 rotate-180 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
             </div>

             {/* Crosshair Cursor Overlay */}
             {mousePos && (
               <svg 
                 className="absolute inset-0 pointer-events-none z-50" 
                 width="100%" 
                 height="100%"
               >
                 {/* Horizontal Line */}
                 <line 
                   x1="0" 
                   y1={mousePos.y} 
                   x2="100%" 
                   y2={mousePos.y} 
                   stroke="#3b82f6" 
                   strokeWidth="1" 
                   strokeDasharray="4 4"
                   opacity="0.5"
                 />
                 {/* Vertical Line */}
                 <line 
                   x1={mousePos.x} 
                   y1="0" 
                   x2={mousePos.x} 
                   y2="100%" 
                   stroke="#3b82f6" 
                   strokeWidth="1" 
                   strokeDasharray="4 4"
                   opacity="0.5"
                 />
                 {/* Central Dot */}
                 <circle 
                   cx={mousePos.x} 
                   cy={mousePos.y} 
                   r="4" 
                   fill="#3b82f6" 
                   stroke="white"
                   strokeWidth="2"
                 />
                 {/* Crosshair Lines (Short solid ones near the dot for precision) */}
                 <line x1={mousePos.x - 15} y1={mousePos.y} x2={mousePos.x + 15} y2={mousePos.y} stroke="#3b82f6" strokeWidth="1.5" />
                 <line x1={mousePos.x} y1={mousePos.y - 15} x2={mousePos.x} y2={mousePos.y + 15} stroke="#3b82f6" strokeWidth="1.5" />
               </svg>
             )}
           </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block mb-2">Integral Breadth (β)</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{stats?.integralBreadth.toFixed(4)}°</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Line width of a rectangle with same area and height as the peak.</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Shape Factor (φ)</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{stats?.shapeFactor.toFixed(3)}</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">FWHM / β ratio. Pure Gaussian ≈ 0.94, Pure Lorentzian ≈ 0.64.</p>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Integrated Area</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{stats?.area.toFixed(1)}</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Sum of intensity. Used for structure factor calculations.</p>
           </div>
        </div>

        {/* Contrast Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-100">
            <h3 className="font-bold text-slate-800">Characteristic Comparison</h3>
          </div>
          <table className="w-full text-sm text-left text-slate-800">
            <thead className="text-xs text-slate-900 uppercase bg-slate-200">
              <tr>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Property</th>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Gaussian</th>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Lorentzian</th>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Current Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-3 font-bold text-slate-700">Tail Decay</td>
                <td className="px-6 py-3 text-slate-600">Exponential (Fast)</td>
                <td className="px-6 py-3 text-slate-600">Polynomial (Slow)</td>
                <td className="px-6 py-3 text-orange-700 font-bold">{type}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-bold text-slate-700">Shape Factor (φ)</td>
                <td className="px-6 py-3 font-mono">0.939</td>
                <td className="px-6 py-3 font-mono">0.637</td>
                <td className="px-6 py-3 font-mono font-bold">{stats?.shapeFactor.toFixed(3)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-bold text-slate-700">Physical Origin</td>
                <td className="px-6 py-3 text-slate-500 italic">Instrument/Strain</td>
                <td className="px-6 py-3 text-slate-500 italic">Crystallite Size</td>
                <td className="px-6 py-3 text-slate-700">Hybrid</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mathematical Models & Applications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-100">
            <h3 className="font-bold text-slate-800">Mathematical Models & Applications</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Gaussian */}
            <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">Gaussian</span>
                <h4 className="font-bold text-slate-800">Normal Distribution</h4>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                I(2θ) = Imax · exp(-ln(2) · ((2θ - 2θ₀) / HWHM)²)
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Why use it?</strong> Best for modeling <span className="italic">instrumental broadening</span> and <span className="italic">microstrain</span> effects. The tails decay very rapidly (exponentially), making it suitable for sharp, well-resolved peaks with minimal background interaction.
              </p>
            </div>

            {/* Lorentzian */}
            <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded uppercase">Lorentzian</span>
                <h4 className="font-bold text-slate-800">Cauchy Distribution</h4>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                I(2θ) = Imax · (1 / (1 + ((2θ - 2θ₀) / HWHM)²))
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Why use it?</strong> Describes <span className="italic">crystallite size broadening</span> (Scherrer equation) and <span className="italic">spectral line shapes</span>. It has much heavier tails (polynomial decay) than Gaussian, meaning significant intensity persists far from the peak center.
              </p>
            </div>

            {/* Pseudo-Voigt */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded uppercase">Pseudo-Voigt</span>
                <h4 className="font-bold text-slate-800">Linear Combination</h4>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                I(2θ) = η · L(2θ) + (1 - η) · G(2θ)
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Why use it?</strong> The standard for <span className="italic">Rietveld refinement</span> and general XRD analysis. Real diffraction peaks are a convolution of instrumental (Gaussian) and sample (Lorentzian) effects. The mixing factor <strong>η</strong> allows you to model this hybrid behavior precisely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
