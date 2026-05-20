const fs = require('fs');

let code = fs.readFileSync('components/SelectionRulesModule.tsx', 'utf8');

const emptyStateOld = `<div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
                <Filter className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-slate-400">No indices provided</p>
                <p className="text-xs mt-1">Enter HKL values or use the generator to start</p>
              </div>`;

const emptyStateNew = `<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 p-12 text-center border-t border-[#1e293b]/50">
                <div className="relative group/empty mb-6">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl group-hover/empty:bg-emerald-500/20 transition-all duration-700" />
                  <div className="w-20 h-20 rounded-2xl bg-[#0B1221] border border-[#1e293b] flex items-center justify-center relative z-10 shadow-inner group-hover/empty:border-emerald-500/30 transition-colors">
                    <Hexagon className="w-10 h-10 text-slate-600 group-hover/empty:text-emerald-500/50 transition-colors" />
                  </div>
                </div>
                <h4 className="text-lg font-black text-white mb-2 tracking-wide">Awaiting Lattice Vectors</h4>
                <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
                  Enter custom HKL indices in the configuration panel or use the Index Synthesis engine to generate a theoretical reflection dataset.
                </p>
                <div className="mt-8 flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest">Engine Ready</span>
                </div>
              </div>`;

code = code.replace(emptyStateOld, emptyStateNew);

fs.writeFileSync('components/SelectionRulesModule.tsx', code);
console.log("Empty state updated.");
