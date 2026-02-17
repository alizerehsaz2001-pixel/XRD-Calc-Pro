import React, { useState } from 'react';
import { DLPhaseResult } from '../types';
import { identifyPhasesDL, parseXYData } from '../utils/physics';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const DeepLearningModule: React.FC = () => {
  const [inputData, setInputData] = useState<string>("");
  const [result, setResult] = useState<DLPhaseResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunAI = () => {
    if (!inputData.trim()) return;
    
    setIsSimulating(true);
    // Simulate network latency for realism
    setTimeout(() => {
      const points = parseXYData(inputData);
      const computed = identifyPhasesDL(points);
      setResult(computed);
      setIsSimulating(false);
    }, 800);
  };

  const loadExample = (type: 'Silicon' | 'Mixture') => {
    if (type === 'Silicon') {
      // Silicon Peaks
      setInputData(`28.44, 100\n47.30, 55\n56.12, 30\n69.13, 6\n76.38, 11\n88.03, 12`);
    } else if (type === 'Mixture') {
      // Quartz + Gold Mix
      setInputData(`20.86, 40\n26.64, 100\n38.18, 50\n44.39, 25\n50.14, 15\n64.57, 20`);
    }
  };

  const parsedPoints = parseXYData(inputData);
  const chartData = parsedPoints.map(p => ({ twoTheta: p.twoTheta, intensity: p.intensity }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              PhaseID Neural Net
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Raw Pattern Data
              </label>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs text-slate-500 mb-2 font-mono">
                Format: 2θ, Intensity
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 100&#10;47.30, 55"
                className="w-full h-48 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => loadExample('Silicon')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600">Load Silicon</button>
                <button onClick={() => loadExample('Mixture')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600">Load Mix (SiO2 + Au)</button>
              </div>
            </div>

            <button
              onClick={handleRunAI}
              disabled={isSimulating}
              className={`w-full py-3 text-white font-medium rounded-lg shadow-md transition-all flex justify-center items-center gap-2
                ${isSimulating ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 hover:shadow-lg active:scale-[0.98]'}
              `}
            >
              {isSimulating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Pattern...
                </>
              ) : 'Identify Phases'}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 rounded-xl text-white shadow-md">
           <h3 className="font-bold text-lg mb-2">Deep Learning Engine</h3>
           <p className="text-sm text-violet-100 leading-relaxed">
             This module uses a simulated Convolutional Neural Network (CNN) logic to match your peaks against a database of common crystallographic phases.
           </p>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">Input Pattern Visualization</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="twoTheta" type="number" domain={[0, 'dataMax + 5']} unit="°" />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="intensity" barSize={4} fill="#8b5cf6" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {result?.candidates.map((candidate, idx) => (
             <div key={idx} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-violet-500 hover:shadow-lg transition-shadow">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="font-bold text-lg text-slate-800">{candidate.phase_name}</h4>
                   <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{candidate.formula}</span>
                 </div>
                 <span className="text-xs text-slate-400">{candidate.card_id}</span>
               </div>
               
               <div className="mt-4">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="font-medium text-slate-600">Confidence</span>
                   <span className="font-bold text-violet-600">{candidate.confidence_score}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2">
                   <div 
                     className="bg-violet-600 h-2 rounded-full transition-all duration-1000 ease-out"
                     style={{ width: `${candidate.confidence_score}%` }}
                   ></div>
                 </div>
               </div>
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="col-span-1 md:col-span-3 h-32 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
               Run identification to see candidate phases
             </div>
           )}
        </div>

        {result && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-mono text-xs text-slate-500">JSON Output</h3>
               <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                  className="text-xs text-violet-600 hover:text-violet-800"
               >
                 Copy
               </button>
             </div>
             <div className="p-4 bg-slate-900 overflow-x-auto">
               <pre className="text-xs font-mono text-green-400">
                 {JSON.stringify(result, null, 2)}
               </pre>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
