import React, { useState, useEffect } from 'react';
import { DLPhaseResult, DLPhaseCandidate } from '../types';
import { identifyPhasesDL, parseXYData } from '../utils/physics';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine
} from 'recharts';
import { Brain, Activity, CheckCircle, Search, Database, Layers, Zap } from 'lucide-react';

export const DeepLearningModule: React.FC = () => {
  const [inputData, setInputData] = useState<string>("");
  const [result, setResult] = useState<DLPhaseResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Preproc, 2: CNN, 3: DB, 4: Done
  const [selectedCandidate, setSelectedCandidate] = useState<DLPhaseCandidate | null>(null);

  const steps = [
    { label: 'Idle', icon: Brain },
    { label: 'Preprocessing Pattern', icon: Activity },
    { label: 'CNN Feature Extraction', icon: Layers },
    { label: 'Database Matching', icon: Database },
    { label: 'Final Scoring', icon: CheckCircle },
  ];

  const handleRunAI = () => {
    if (!inputData.trim()) return;
    
    setIsSimulating(true);
    setResult(null);
    setSelectedCandidate(null);
    setProgressStep(1);

    // Simulation Sequence
    setTimeout(() => setProgressStep(2), 800);
    setTimeout(() => setProgressStep(3), 2000);
    setTimeout(() => {
      const points = parseXYData(inputData);
      const computed = identifyPhasesDL(points);
      setResult(computed);
      if (computed.candidates.length > 0) {
        setSelectedCandidate(computed.candidates[0]);
      }
      setProgressStep(4);
      setIsSimulating(false);
    }, 3000);
  };

  const loadExample = (type: 'Silicon' | 'Mixture' | 'HAP' | 'ZnO') => {
    if (type === 'Silicon') {
      setInputData(`28.44, 100\n47.30, 55\n56.12, 30\n69.13, 6\n76.38, 11\n88.03, 12`);
    } else if (type === 'Mixture') {
      setInputData(`20.86, 40\n26.64, 100\n38.18, 50\n44.39, 25\n50.14, 15\n64.57, 20`);
    } else if (type === 'HAP') {
      setInputData(`25.87, 40\n31.77, 100\n32.19, 95\n32.90, 60\n34.04, 45\n39.81, 25\n46.71, 35\n49.46, 30`);
    } else if (type === 'ZnO') {
      setInputData(`31.77, 57\n34.42, 44\n36.25, 100\n47.54, 23\n56.60, 32\n62.86, 29`);
    }
  };

  const parsedPoints = parseXYData(inputData);
  
  // Prepare Chart Data
  // We merge input points and selected candidate reference peaks for visualization
  const chartData = parsedPoints.map(p => ({
    twoTheta: p.twoTheta,
    intensity: p.intensity,
    refIntensity: null // Placeholder
  }));

  // If a candidate is selected, we want to show its reference peaks
  // We can add them as a separate Scatter series
  const refData = selectedCandidate?.matched_peaks?.map(mp => ({
    twoTheta: mp.refT,
    refIntensity: mp.refI,
    intensity: null
  })) || [];

  // Combined data for the chart is tricky because X-values differ. 
  // For ComposedChart, it's often easier to just overlay Scatter on the same XAxis domain.

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-xs border border-slate-700">
          <p className="font-bold mb-1">2θ: {label}°</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-600" />
              PhaseID Neural Net
            </h2>
            {isSimulating && (
              <span className="text-xs font-bold text-violet-600 animate-pulse bg-violet-50 px-2 py-1 rounded-full">
                Running...
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Diffraction Pattern Input
              </label>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs text-slate-500 mb-2 font-mono flex items-center gap-2">
                <Search className="w-3 h-3" />
                Format: 2θ, Intensity
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 100&#10;47.30, 55"
                className="w-full h-48 px-4 py-3 bg-slate-900 text-violet-300 border border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-bold text-slate-500 mr-1 self-center">Load:</span>
                <button onClick={() => loadExample('Silicon')} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 font-medium transition-colors">Silicon</button>
                <button onClick={() => loadExample('Mixture')} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 font-medium transition-colors">Mix (SiO2+Au)</button>
                <button onClick={() => loadExample('HAP')} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 font-medium transition-colors">Hydroxyapatite</button>
                <button onClick={() => loadExample('ZnO')} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 font-medium transition-colors">ZnO</button>
              </div>
            </div>

            <button
              onClick={handleRunAI}
              disabled={isSimulating || !inputData.trim()}
              className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2
                ${isSimulating || !inputData.trim() ? 'bg-slate-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 hover:shadow-lg active:scale-[0.98]'}
              `}
            >
              {isSimulating ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Identify Phases
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress / Status Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
             <Layers className="w-5 h-5 text-violet-400" />
             Analysis Engine
           </h3>
           <div className="space-y-4">
             {steps.slice(1).map((step, idx) => {
               const stepIdx = idx + 1;
               const isActive = progressStep === stepIdx;
               const isCompleted = progressStep > stepIdx;
               const Icon = step.icon;
               
               return (
                 <div key={idx} className={`flex items-center gap-3 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                     ${isActive ? 'border-violet-500 bg-violet-500/20 text-violet-400 animate-pulse' : 
                       isCompleted ? 'border-green-500 bg-green-500 text-slate-900' : 'border-slate-600 text-slate-600'}
                   `}>
                     {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                   </div>
                   <span className={`text-sm font-medium ${isActive ? 'text-violet-300' : isCompleted ? 'text-green-400' : 'text-slate-500'}`}>
                     {step.label}
                   </span>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col relative">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-sm font-bold text-slate-700">Pattern Match Visualization</h3>
            {selectedCandidate && (
              <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-1 rounded">
                Overlay: {selectedCandidate.phase_name}
              </span>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[0, 'dataMax + 5']} 
                  unit="°" 
                  allowDataOverflow 
                  name="2θ"
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" height={36} />
                
                {/* Input Data */}
                <Bar dataKey="intensity" barSize={4} fill="#94a3b8" name="Input Pattern" />
                
                {/* Reference Data (if selected) */}
                {selectedCandidate && (
                  <Scatter 
                    data={refData} 
                    dataKey="refIntensity" 
                    name={`${selectedCandidate.phase_name} (Ref)`} 
                    fill="#8b5cf6" 
                    shape="diamond"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {!inputData.trim() && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl z-10">
              <p className="text-slate-400 font-medium">Enter data to visualize</p>
            </div>
          )}
        </div>

        {/* Material Intelligence Card */}
        {selectedCandidate && (
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-4">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Brain className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Material Intelligence</h3>
                <p className="text-sm text-slate-400">AI-Synthesized Properties & Context</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedCandidate.description || "No description available for this phase."}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Crystal System</span>
                    <span className="text-sm font-medium text-white">{selectedCandidate.crystalSystem || "Unknown"}</span>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Space Group</span>
                    <span className="text-sm font-medium text-white font-mono">{selectedCandidate.spaceGroup || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Common Applications</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.applications?.map((app, i) => (
                        <span key={i} className="text-xs bg-slate-800 text-violet-200 px-2 py-1 rounded-full border border-slate-700">
                          {app}
                        </span>
                      )) || <span className="text-xs text-slate-500 italic">No application data available.</span>}
                    </div>
                 </div>

                 <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Density</span>
                      <span className="text-sm font-medium text-white">{selectedCandidate.density ? `${selectedCandidate.density} g/cm³` : "N/A"}</span>
                    </div>
                    <Database className="w-5 h-5 text-slate-600" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictions List */}
        <div className="grid grid-cols-1 gap-4">
           {result?.candidates.map((candidate, idx) => (
             <div 
               key={idx} 
               onClick={() => setSelectedCandidate(candidate)}
               className={`bg-white p-5 rounded-xl shadow-sm border-2 cursor-pointer transition-all
                 ${selectedCandidate?.phase_name === candidate.phase_name ? 'border-violet-500 ring-2 ring-violet-100' : 'border-transparent hover:border-slate-200'}
               `}
             >
               <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                     ${idx === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}
                   `}>
                     {idx + 1}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-slate-800">{candidate.phase_name}</h4>
                     <div className="flex gap-2 text-xs">
                       <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{candidate.formula}</span>
                       <span className="text-slate-400">{candidate.card_id}</span>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className="text-2xl font-black text-violet-600">{candidate.confidence_score}%</span>
                   <p className="text-xs text-slate-400 font-medium">Confidence</p>
                 </div>
               </div>
               
               <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-1000 ease-out ${candidate.confidence_score > 80 ? 'bg-green-500' : candidate.confidence_score > 50 ? 'bg-violet-500' : 'bg-amber-500'}`}
                   style={{ width: `${candidate.confidence_score}%` }}
                 ></div>
               </div>

               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-2">Matched Peaks Details</p>
                   <div className="grid grid-cols-3 gap-2 text-xs">
                     {candidate.matched_peaks?.map((mp, i) => (
                       <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                         <span className="text-slate-500">Ref: {mp.refT.toFixed(2)}°</span>
                         <span className="font-bold text-green-600">✓</span>
                       </div>
                     ))}
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 italic">
                     * Click on other candidates to compare their reference patterns on the chart.
                   </p>
                 </div>
               )}
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="h-32 flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
               <Database className="w-8 h-8 mb-2 opacity-20" />
               <p className="font-medium">Ready to Identify</p>
               <p className="text-xs">Load example data or paste your pattern to begin.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
