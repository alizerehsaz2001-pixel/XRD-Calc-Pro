
import React, { useState } from 'react';
import { CrystalMindResponse, CrystalMindSearchResult } from '../types';
import { searchCrystalDatabase } from '../services/geminiService';

export const CrystalMindModule: React.FC = () => {
  const [command, setCommand] = useState<string>("Search for stable phases containing Titanium and Oxygen");
  const [elementsInput, setElementsInput] = useState<string>("Ti, O");
  const [databaseTarget, setDatabaseTarget] = useState<"MaterialsProject" | "COD" | "AMCSD" | "All">("MaterialsProject");
  const [peaksInput, setPeaksInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrystalMindResponse | null>(null);

  const handleInitiateControl = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const elements = elementsInput.split(/[\s,]+/).filter(s => s);
      const peaks = peaksInput 
        ? peaksInput.split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
        : undefined;

      const data = await searchCrystalDatabase(command, elements, databaseTarget, peaks);
      setResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      
      {/* MISSION CONTROL PANEL */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-cyan-500/20 ring-1 ring-cyan-500/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-white/10 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">CrystalMind-Control</h2>
              <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-[0.2em]">Mission Orchestrator</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Directive (Command)</label>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Describe your search goal..."
                className="w-full h-20 px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Elements</label>
                <input
                  type="text"
                  value={elementsInput}
                  onChange={(e) => setElementsInput(e.target.value)}
                  placeholder="Ti, O"
                  className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-bold font-mono"
                />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Database</label>
                 <select 
                    value={databaseTarget}
                    onChange={(e) => setDatabaseTarget(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-xs font-bold"
                 >
                    <option value="MaterialsProject">Materials Project</option>
                    <option value="COD">COD (Open Database)</option>
                    <option value="AMCSD">AMCSD (RRUFF)</option>
                    <option value="All">Global Search</option>
                 </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Fingerprint Data (Peaks)</label>
              <textarea
                value={peaksInput}
                onChange={(e) => setPeaksInput(e.target.value)}
                placeholder="25.3, 37.8, 48.0..."
                className="w-full h-24 px-4 py-2 bg-slate-950 text-cyan-400 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-xs"
              />
            </div>

            <button
              onClick={handleInitiateControl}
              disabled={loading}
              className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 group
                ${loading ? 'bg-cyan-800 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-cyan-500/20 active:scale-[0.98]'}
              `}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Orchestrating Search...
                </>
              ) : (
                <>
                  <span className="tracking-widest uppercase text-xs">Execute Mission</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LOG PANEL */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-[10px] leading-relaxed">
           <div className="flex justify-between items-center mb-3">
             <span className="text-cyan-500 font-bold uppercase tracking-widest">Control Bus Log</span>
             <span className="flex gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
             </span>
           </div>
           <div className="text-slate-500 space-y-1 h-32 overflow-y-auto custom-scrollbar">
              <p>[INFO] CrystalMind-Control protocol initiated.</p>
              <p>[INFO] Target Database: {databaseTarget}.</p>
              <p>[INFO] Elements set to: {elementsInput || 'None'}</p>
              {loading && <p className="text-cyan-400 animate-pulse">[BUS] Grounding search strictly on {databaseTarget}...</p>}
              {response && <p className="text-green-400">[OK] Search retrieved {response.search_results.length} candidates.</p>}
           </div>
        </div>
      </div>

      {/* RESULTS GRID */}
      <div className="lg:col-span-8 space-y-6">
        {response?.control_message && (
          <div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 ${response.status === 'success' ? 'bg-cyan-50 border-cyan-500 text-cyan-900' : 'bg-red-50 border-red-500 text-red-900'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-sm font-medium leading-relaxed">{response.control_message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {response?.search_results.map((res, idx) => (
             <ControlResultCard key={idx} result={res} source={response.query_parameters.database_target} />
          ))}
          
          {!response && !loading && (
             <div className="col-span-full h-80 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
               </div>
               <h3 className="text-lg font-bold text-slate-400">Database Search Offline</h3>
               <p className="text-sm mt-1 max-w-xs text-center">Select target and execute mission to retrieve structural data.</p>
             </div>
          )}
        </div>

        {/* GROUNDING SOURCES */}
        {response?.sources && response.sources.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Verified Research Citations</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.sources.map((source, i) => (
                  <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-cyan-50 hover:border-cyan-200 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-cyan-600 border border-slate-200 group-hover:border-cyan-300 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{source.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{source.uri}</p>
                    </div>
                  </a>
                ))}
             </div>
          </div>
        )}

        {/* ADVANCED DATA VIEW */}
        {response && (
           <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
             <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500" />
                 <h3 className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">Strict Protocol JSON</h3>
               </div>
               <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(response, null, 2))}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
               >
                 COPY_BUFFER
               </button>
             </div>
             <div className="p-5 bg-slate-950 overflow-x-auto custom-scrollbar h-64 border-t border-slate-800">
               <pre className="text-xs font-mono text-cyan-300/80 leading-relaxed">
                 {JSON.stringify(response, null, 2)}
               </pre>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

const ControlResultCard: React.FC<{ result: CrystalMindSearchResult, source: string }> = ({ result, source }) => (
  <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-all group border-l-4 border-l-cyan-600">
    <div className="p-5">
      <div className="flex justify-between items-start mb-4">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <h3 className="text-lg font-extrabold text-slate-900 leading-none">{result.phase_name}</h3>
             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-tighter ${result.is_stable ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
               {result.is_stable ? 'Stable' : 'Unstable'}
             </span>
           </div>
           <div className="flex gap-2">
             <span className="text-xs font-mono text-slate-500 font-bold">{result.formula}</span>
             <span className="text-xs font-mono text-cyan-600 font-bold">#{result.database_id}</span>
           </div>
         </div>
         <div className="text-right">
           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">FOM Match</div>
           <div className="text-xl font-black text-cyan-600">{(result.figure_of_merit * 100).toFixed(1)}%</div>
         </div>
      </div>
      
      <div className="mb-4">
        <span className="text-[9px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Source: {source}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-5">
         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Crystal System</span>
              <span className="text-xs font-bold text-slate-700">{result.crystal_system}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Space Group</span>
              <span className="text-xs font-bold text-slate-700 font-mono tracking-tighter">{result.space_group} ({result.point_group})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Lattice (Å)</span>
              <div className="flex gap-2 font-mono text-[10px] text-slate-600">
                <span>a: {result.lattice_params.a.toFixed(2)}</span>
                <span>b: {result.lattice_params.b.toFixed(2)}</span>
                <span>c: {result.lattice_params.c.toFixed(2)}</span>
              </div>
            </div>
         </div>
         
         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Band Gap</span>
              <span className="text-xs font-bold text-indigo-600">{result.band_gap?.toFixed(2) || '0.00'} eV</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">E above Hull</span>
              <span className="text-xs font-bold text-slate-700">{result.energy_above_hull?.toFixed(3) || '0.000'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Density</span>
              <span className="text-xs font-bold text-slate-700">{result.density?.toFixed(2) || '0.00'} g/cm³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Volume</span>
              <span className="text-xs font-bold text-slate-700">{result.volume?.toFixed(1) || '0.0'} Å³</span>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
         <div className="flex gap-1">
           {['α', 'β', 'γ'].map((angle, i) => {
             const key = i === 0 ? 'alpha' : i === 1 ? 'beta' : 'gamma';
             return (
               <span key={angle} className="text-[10px] text-slate-400">
                 {angle}: <span className="font-bold text-slate-600">{(result.lattice_params as any)[key]}°</span>
               </span>
             );
           })}
         </div>
         <a 
           href={result.cif_url} 
           target="_blank" 
           rel="noreferrer" 
           className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1 group/link"
         >
           Retrieve CIF
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover/link:translate-y-[-1px] group-hover/link:translate-x-[1px] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
           </svg>
         </a>
      </div>
    </div>
  </div>
);
