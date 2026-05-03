
import React, { useState, useEffect, useRef } from 'react';
import { CrystalMindResponse, CrystalMindSearchResult } from '../types';
import { searchCrystalDatabase } from '../services/geminiService';
import { Database, Search, Atom, Copy, ExternalLink, Activity, Network, Zap, CheckCircle2, ChevronRight, Layers, Box, Maximize, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CrystalMindModule: React.FC = () => {
  const [command, setCommand] = useState<string>("Search for stable phases containing Titanium and Oxygen");
  const [elementsInput, setElementsInput] = useState<string>("Ti, O");
  const [databaseTarget, setDatabaseTarget] = useState<"MaterialsProject" | "COD" | "AMCSD" | "All">("MaterialsProject");
  const [peaksInput, setPeaksInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrystalMindResponse | null>(null);
  const [history, setHistory] = useState<CrystalMindResponse[]>([]);
  const bounceTimer = useRef<NodeJS.Timeout | null>(null);

  const executeSearch = async (cmd: string, elems: string, target: string, peaks: string) => {
    setLoading(true);
    setResponse(null);

    try {
      const elements = elems.split(/[\s,]+/).filter(s => s);
      const numericalPeaks = peaks 
        ? peaks.split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
        : undefined;

      const data = await searchCrystalDatabase(cmd, elements, target as any, numericalPeaks);
      setResponse(data);
      if (data.status === 'success') {
        setHistory(prev => {
           const isDuplicate = prev.some(h => h.control_message === data.control_message);
           if (isDuplicate) return prev;
           return [data, ...prev].slice(0, 5);
        }); 
      } else if (data.status === 'error') {
        // Specifically handle quota
        if (data.control_message?.includes('429') || data.control_message?.includes('quota')) {
           data.control_message = "CRITICAL: Neural link quota exhausted (429). Please wait for buffer reset before additional queries.";
        }
      }
    } catch (e: any) {
      console.error(e);
      // Fallback
      setResponse({
        status: 'error',
        control_message: e?.message?.includes('429') ? "CRITICAL: Quota exhausted." : "Protocol failed: Connectivity failure.",
        search_results: [],
        query_parameters: { elements_included: elems.split(/[\s,]+/), elements_excluded: [], strict_match: false, database_target: target as any }
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateControl = async () => {
    executeSearch(command, elementsInput, databaseTarget, peaksInput);
  };

  /* 
  useEffect(() => {
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    bounceTimer.current = setTimeout(() => {
      if (command.trim().length > 3) {
        executeSearch(command, elementsInput, databaseTarget, peaksInput);
      }
    }, 800);
    return () => {
      if (bounceTimer.current) clearTimeout(bounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);
  */

  const loadFromHistory = (item: CrystalMindResponse) => {
    setResponse(item);
    setCommand(item.control_message || ""); 
    setElementsInput(item.query_parameters.elements_included.join(", "));
    setDatabaseTarget(item.query_parameters.database_target);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* MISSION CONTROL PANEL */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group/panel">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[80px] group-hover/panel:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[80px] group-hover/panel:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8 relative z-10">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative">
              <Database className="h-6 w-6 text-cyan-400 relative z-10" />
              {loading && <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl animate-ping" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight uppercase">CrystalMind Nexus</h2>
              <p className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.3em] mt-1">Autonomous Database Orchestrator</p>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="bg-black/20 p-5 rounded-2xl border border-slate-800/50 group/input focus-within:border-cyan-500/30 transition-all shadow-inner">
              <div className="flex justify-between items-center mb-3">
                 <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <Search className="w-3.5 h-3.5 text-emerald-400" />
                   Primary Protocol
                 </label>
                 <span className="text-[9px] font-black text-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-500/20">Semantic Core</span>
              </div>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Describe structural criteria, band gap requirements, or phase constraints..."
                className="w-full h-24 bg-slate-900/50 p-4 rounded-xl text-emerald-400/90 border border-slate-800/80 outline-none font-mono text-xs leading-relaxed resize-none transition-all placeholder:text-slate-700 placeholder:font-bold custom-scrollbar focus:border-emerald-500/50 hover:bg-slate-900 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-black/20 p-5 rounded-2xl border border-slate-800/50 focus-within:border-cyan-500/30 transition-all shadow-inner">
                <div className="flex justify-between items-center mb-4">
                   <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     <Atom className="w-3.5 h-3.5 text-indigo-400" />
                     Composition Matrix
                   </label>
                   <div className="flex items-center gap-1">
                      {elementsInput.split(/[\s,]+/).filter(e => e).slice(0,3).map((el, i) => (
                        <span key={`${el}-${i}`} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold rounded shadow-sm border border-indigo-500/30">
                          {el}
                        </span>
                      ))}
                      {elementsInput.split(/[\s,]+/).filter(e => e).length > 3 && (
                        <span className="text-[10px] text-slate-500 font-black tracking-widest ml-1">...</span>
                      )}
                   </div>
                </div>
                <input
                  type="text"
                  value={elementsInput}
                  onChange={(e) => setElementsInput(e.target.value)}
                  placeholder="Insert stoichiometric elements (e.g. Ti, O, Fe)..."
                  className="w-full bg-slate-900/50 px-4 py-3 rounded-xl text-white border border-slate-800/80 outline-none text-sm font-black font-mono focus:border-indigo-500/50 transition-colors placeholder:text-slate-700 hover:bg-slate-900 shadow-inner"
                />
              </div>

              <div className="bg-black/20 p-5 rounded-2xl border border-slate-800/50 transition-all shadow-inner">
                 <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                    <Network className="w-3.5 h-3.5 text-cyan-400" />
                    Target Vector Core
                 </label>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      { id: 'MaterialsProject', label: 'Materials Proj.', tag: 'MP' },
                      { id: 'COD', label: 'Open Database', tag: 'COD' },
                      { id: 'AMCSD', label: 'Min. Structs', tag: 'AMCSD' },
                      { id: 'All', label: 'Global Search', tag: 'ALL' }
                    ].map(v => (
                       <button
                         key={v.id}
                         onClick={(e) => {
                           e.preventDefault();
                           setDatabaseTarget(v.id as any);
                         }}
                         className={`p-3 rounded-xl border flex flex-col items-start gap-1.5 text-left transition-all relative overflow-hidden group/vector ${
                           databaseTarget === v.id 
                             ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                             : 'bg-black/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 shadow-inner'
                         }`}
                       >
                          {databaseTarget === v.id && (
                             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-widest ${databaseTarget === v.id ? 'text-cyan-400' : 'text-slate-500 group-hover/vector:text-slate-400'}`}>
                             {v.tag}
                          </span>
                          <span className={`text-[10px] font-bold tracking-tight ${databaseTarget === v.id ? 'text-white' : 'text-slate-400 group-hover/vector:text-slate-300'}`}>
                             {v.label}
                          </span>
                       </button>
                    ))}
                 </div>
              </div>
            </div>

            <div className="bg-black/20 p-5 rounded-2xl border border-slate-800/50 focus-within:border-cyan-500/30 transition-all shadow-inner">
              <div className="flex items-center justify-between mb-3">
                 <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <Activity className="w-3.5 h-3.5 text-rose-400" />
                   Diffraction Fingerprint
                 </label>
                 <span className="text-[9px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded uppercase tracking-widest border border-slate-700 shadow-inset">Optional [2θ]</span>
              </div>
              <textarea
                value={peaksInput}
                onChange={(e) => setPeaksInput(e.target.value)}
                placeholder="Match against specific peak positions: 25.3, 37.8, 48.0..."
                className="w-full h-16 bg-slate-900/50 p-4 rounded-xl text-rose-400/90 border border-slate-800/80 outline-none font-mono text-[11px] leading-relaxed resize-none transition-all placeholder:text-slate-700 placeholder:font-bold custom-scrollbar focus:border-rose-500/50 hover:bg-slate-900 shadow-inner"
              />
            </div>

            <button
              onClick={handleInitiateControl}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 relative overflow-hidden group/btn shadow-2xl active:scale-[0.97]
                ${loading 
                  ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-wait' 
                  : 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white hover:shadow-[0_15px_30px_rgba(6,182,212,0.3)]'}
              `}
            >
              {loading ? (
                <>
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="h-full w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>
                  <Activity className="w-5 h-5 animate-spin text-slate-500" />
                  <span className="uppercase tracking-[0.2em] text-sm text-slate-400">Querying Grid...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <Zap className="w-5 h-5 group-hover/btn:scale-110 transition-transform relative z-10" />
                  <span className="uppercase tracking-[0.2em] text-sm relative z-10">Execute Mission</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LOG PANEL */}
        <div className="bg-[#050b14] p-6 rounded-3xl border border-slate-800 shadow-inner relative overflow-hidden group/log">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover/log:bg-emerald-500/10 transition-colors" />
           <div className="flex justify-between items-center mb-4 relative z-10">
             <span className="flex items-center gap-2 text-[10px] text-cyan-500 font-black uppercase tracking-widest">
               <Cpu className="w-3.5 h-3.5" />
               System Telemetry
             </span>
             <span className="flex gap-1.5 opacity-80">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)] animate-pulse" />
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_theme(colors.cyan.500)]" />
             </span>
           </div>
           <div className="font-mono text-[10px] leading-relaxed text-slate-500 space-y-1.5 h-32 overflow-y-auto custom-scrollbar relative z-10 pr-2">
              <p><span className="text-slate-600">[SYS]</span> Protocol initialized.</p>
              <p><span className="text-slate-600">[CFG]</span> Target Vector: <span className="text-cyan-400/80">{databaseTarget}</span></p>
              <p><span className="text-slate-600">[CFG]</span> Elements: <span className="text-cyan-400/80">{elementsInput || 'ANY'}</span></p>
              {loading && (
                 <motion.p 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                   className="text-amber-400 pulse"
                 >
                   [NET] Establishing uplink to data grid...
                 </motion.p>
              )}
              {response && (
                 <motion.p 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="text-emerald-400 font-bold"
                 >
                   [OK] Telemetry received: {response.search_results.length} candidates verified.
                 </motion.p>
              )}
           </div>
        </div>

        {/* HISTORY PANEL */}
        {history.length > 0 && (
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
             <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                <Layers className="w-3.5 h-3.5" />
                Mission Archive
             </h3>
             <div className="space-y-2">
               {history.map((item, idx) => (
                 <button 
                   key={`${item.control_message?.substring(0, 10)}-${idx}`}
                   onClick={() => loadFromHistory(item)}
                   className="w-full flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-slate-800/50 hover:border-cyan-500/30 transition-all group/hist"
                 >
                   <span className="text-[10px] font-bold text-slate-400 group-hover/hist:text-cyan-400 transition-colors uppercase tracking-widest truncate">
                     {item.query_parameters.elements_included.join(', ') || 'Global'} // {item.query_parameters.database_target.substring(0,4)}
                   </span>
                   <span className="bg-slate-800 text-slate-400 text-[9px] font-black px-2 py-1 rounded-md">
                     {item.search_results.length} RES
                   </span>
                 </button>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* RESULTS GRID */}
      <div className="lg:col-span-7 space-y-6">
        <AnimatePresence mode="popLayout">
          {response?.control_message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`p-5 rounded-2xl border-l-4 shadow-lg backdrop-blur-md flex items-start gap-4 
                ${response.status === 'success' ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-rose-950/40 border-rose-500/50'}`}
            >
               <div className={`p-2 rounded-lg ${response.status === 'success' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'}`}>
                 <Activity className="h-4 w-4" />
               </div>
               <div>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${response.status === 'success' ? 'text-cyan-500' : 'text-rose-500'}`}>
                    AI Interpretation
                  </h4>
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">{response.control_message}</p>
               </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {!response && !loading && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                 className="col-span-full h-[500px] flex flex-col items-center justify-center text-slate-600 border border-slate-800/50 rounded-[2.5rem] bg-gradient-to-b from-slate-900/40 to-black/20 shadow-inner relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0,transparent_70%)] pointer-events-none" />
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50" />
                 
                 <div className="relative mb-8 group">
                   <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full group-hover:bg-cyan-500/30 transition-all duration-700" />
                   <div className="w-24 h-24 rounded-3xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                     <Database className="w-10 h-10 text-cyan-500 opacity-80" strokeWidth={1.5} />
                   </div>
                 </div>
                 <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em] mb-3">Nexus Standby Array</h3>
                 <p className="text-xs max-w-[300px] text-center font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                   Enter composition matrix and structural criteria to commence dataset retrieval.
                 </p>
               </motion.div>
            )}

            {response?.search_results.map((res, idx) => (
               <motion.div
                 key={`${res.database_id}-${idx}`}
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
               >
                 <ControlResultCard result={res} source={response.query_parameters.database_target} />
               </motion.div>
            ))}
          </div>

          {response?.sources && response.sources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl"
            >
               <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Citations
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {response.sources.map((source, sIdx) => (
                    <a key={`${source.uri}-${sIdx}`} href={source.uri} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-slate-800/50 hover:bg-cyan-950/20 hover:border-cyan-500/30 transition-all group/cite">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover/cite:bg-cyan-500/10 group-hover/cite:border-cyan-500/30 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover/cite:text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs font-bold text-slate-300 truncate group-hover/cite:text-white transition-colors">{source.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate mt-1">{source.uri}</p>
                      </div>
                    </a>
                  ))}
               </div>
            </motion.div>
          )}

          {response && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="bg-[#050b14] rounded-3xl shadow-xl border border-slate-800 overflow-hidden relative group/json"
             >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 opacity-50" />
               <div className="p-5 border-b border-slate-800/80 bg-black/40 flex justify-between items-center backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                   <Box className="w-4 h-4 text-indigo-400" />
                   <div>
                     <h3 className="font-mono text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] leading-none mb-0.5">Raw Telemetry</h3>
                     <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Protocol JSON Output</p>
                   </div>
                 </div>
                 <button 
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(response, null, 2))}
                    className="p-2 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30 active:scale-95"
                    title="Copy JSON"
                 >
                   <Copy className="w-3.5 h-3.5" />
                 </button>
               </div>
               <div className="p-6 overflow-x-auto custom-scrollbar h-64 relative">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                 <pre className="text-[10px] font-mono text-indigo-300/80 leading-relaxed tabular-nums">
                   {JSON.stringify(response, null, 2)}
                 </pre>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ControlResultCard: React.FC<{ result: CrystalMindSearchResult, source: string }> = ({ result, source }) => {
  const handleCopySimulationData = () => {
    const simData = {
      lattice: result.lattice_params,
      atoms: result.atomic_positions?.map((pos, idx) => ({
        id: idx.toString(),
        element: pos.element,
        label: `${pos.element}${idx+1}`,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        b: 5.0, 
        B_iso: 0.5
      })) || []
    };
    navigator.clipboard.writeText(JSON.stringify(simData, null, 2));
    alert("Simulation data copied to clipboard! Ready for import.");
  };

  return (
    <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden hover:border-cyan-500/30 hover:shadow-[0_15px_50px_rgba(6,182,212,0.15)] hover:-translate-y-1 transition-all duration-500 group/card relative">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-indigo-500 group-hover/card:w-2 transition-all duration-300" />
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
           <div>
             <div className="flex items-center gap-3 mb-2">
               <h3 className="text-2xl font-black text-white leading-none tracking-tight">{result.phase_name}</h3>
               <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] shadow-sm ${result.is_stable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                 {result.is_stable ? 'Stable Phase' : 'Metastable'}
               </span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-sm font-mono text-slate-400 font-bold bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">{result.formula}</span>
               <span className="text-xs font-mono text-cyan-500 font-bold opacity-80">ID:{result.database_id}</span>
             </div>
           </div>
           <div className="text-right bg-black/40 px-4 py-2 rounded-xl border border-slate-800/80 shadow-inner">
             <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Match FOM</div>
             <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
               {(result.figure_of_merit * 100).toFixed(1)}<span className="text-sm text-cyan-500/50 border-cyan-200 ml-0.5">%</span>
             </div>
           </div>
        </div>
        
        <div className="mb-6 flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-sm">
            <Database className="w-3 h-3 text-cyan-400" />
            SRC: {source}
          </span>
          {result.band_gap !== undefined && (
            <span className="text-[10px] font-black text-slate-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400" />
              {result.band_gap.toFixed(2)} eV
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
           <div className="p-5 bg-black/20 rounded-2xl border border-slate-800/50 space-y-3 relative overflow-hidden group/sys hover:border-cyan-500/30 transition-colors">
              <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover/sys:bg-cyan-500/10" />
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Crystal System</span>
                <span className="text-sm font-black text-slate-200 capitalize">{result.crystal_system}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Space Group</span>
                <span className="text-sm font-black text-cyan-100 font-mono tracking-tighter">{result.space_group} <span className="text-xs text-slate-500">({result.point_group})</span></span>
              </div>
              <div className="pt-2 border-t border-slate-800/50">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Lattice Dimensions [Å]</span>
                <div className="flex gap-3 font-mono text-[11px] text-cyan-400">
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">a: {result.lattice_params.a.toFixed(2)}</span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">b: {result.lattice_params.b.toFixed(2)}</span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">c: {result.lattice_params.c.toFixed(2)}</span>
                </div>
              </div>
           </div>
           
           <div className="p-5 bg-black/20 rounded-2xl border border-slate-800/50 space-y-3 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">E-Hull</span>
                  <span className="text-xs font-black text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded">{result.energy_above_hull?.toFixed(3) || '0.000'} <span className="text-[9px] text-slate-600">eV/atom</span></span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Density</span>
                  <span className="text-xs font-black text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded">{result.density?.toFixed(2) || '0.00'} <span className="text-[9px] text-slate-600">g/cm³</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cell Vol</span>
                  <span className="text-xs font-black text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded">{result.volume?.toFixed(1) || '0.0'} <span className="text-[9px] text-slate-600">Å³</span></span>
                </div>
              </div>
           </div>
        </div>

        {/* ATOMIC POSITIONS PREVIEW */}
        {result.atomic_positions && result.atomic_positions.length > 0 && (
          <div className="mb-6 p-5 bg-slate-900/50 rounded-2xl border border-slate-800/80">
             <div className="flex items-center gap-2 mb-3">
               <Maximize className="w-3 h-3 text-slate-500" />
               <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Wyckoff Positions (Sample)</span>
             </div>
             <div className="bg-black/60 rounded-xl border border-slate-800 overflow-hidden">
               <div className="grid grid-cols-4 gap-2 text-[10px] font-mono font-black text-slate-500 bg-slate-900 px-4 py-2 border-b border-slate-800">
                 <span>Ion</span><span>x</span><span>y</span><span>z</span>
               </div>
               <div className="divide-y divide-slate-800/50">
                 {result.atomic_positions.slice(0, 4).map((pos, i) => (
                   <div key={`${pos.element}-${i}`} className="grid grid-cols-4 gap-2 text-[11px] font-mono text-slate-400 px-4 py-2 hover:bg-slate-800/30 transition-colors">
                     <span className="font-black text-cyan-400">{pos.element}</span>
                     <span>{pos.x.toFixed(4)}</span>
                     <span>{pos.y.toFixed(4)}</span>
                     <span>{pos.z.toFixed(4)}</span>
                   </div>
                 ))}
               </div>
               {result.atomic_positions.length > 4 && (
                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center py-2 bg-slate-900/40">
                   + {result.atomic_positions.length - 4} Internal Coordinates Offset
                 </div>
               )}
             </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
           <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Angles</span>
             {['α', 'β', 'γ'].map((angle, i) => {
               const key = i === 0 ? 'alpha' : i === 1 ? 'beta' : 'gamma';
               return (
                 <span key={angle} className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1">
                   <span className="text-slate-600">{angle}</span>{(result.lattice_params as any)[key]}°
                 </span>
               );
             })}
           </div>
           
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleCopySimulationData}
                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Database className="w-3.5 h-3.5" />
                Extract Logic
              </button>
              <a 
                href={result.cif_url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 sm:flex-none px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 group/link"
              >
                <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                Source CIF
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

