const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

const returnIdx = code.indexOf('  return (\n    <div className="w-full flex flex-col');
if (returnIdx < 0) { console.log("Not found returnIdx"); process.exit(1); }

const autoFitIdx = code.indexOf('      {/* Auto-Fit / Action Notification Bar */}');
if (autoFitIdx < 0) { console.log("Not found autoFitIdx"); process.exit(1); }

// I want to inject `      {appState === 'setup' && (\n      <>\n` after `<div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">\n`

code = code.replace(
  '<div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">',
  '<div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">\n      {appState === \'setup\' && (\n      <>'
);

// We want to add the button in the tabs.
const theoryBtnIdx = code.indexOf(`          <BookOpen className="w-4 h-4 text-purple-300" />\n          <span>5. Theory & Equations</span>\n        </button>\n      </div>`);
if (theoryBtnIdx < 0) { console.log("Not found theoryBtnIdx"); process.exit(1); }

const newTabs = `          <BookOpen className="w-4 h-4 text-purple-300" />
          <span>5. Theory & Equations</span>
        </button>
        <button
          onClick={startComputation}
          className="flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/50"
        >
          <Activity className="w-4 h-4" />
          <span>Compute RIR</span>
        </button>
      </div>`;
code = code.substring(0, theoryBtnIdx) + newTabs + code.substring(theoryBtnIdx + 130);

// We also want to hide the live metrics and the results chart when in setup. Wait, in setup, they aren't rendered because we'll just put `appState === 'results'` around them.
// Wait, the "Live Analysis Summary Metrics" and "Main Content Grid" is all inside `mainTab === 'analysis'`.
// Let's replace the `mainTab === 'analysis'` wrapper end.
// At the very end of the file:
//     </div>
//   );
// };
const endStr = `    </div>\n  );\n};\n`;
// We will replace it with:
const newEnd = `      </>
      )}

      {appState === 'computing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Activity className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">1</span>
                Analyzing Peak Intensities...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 1 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">2</span>
                Applying Reference Intensity Ratios...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 2 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">3</span>
                Normalizing Mass Fractions...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 3 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">4</span>
                RIR Analysis Complete!
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end pt-4 pb-2">
            <button 
              onClick={() => setAppState('setup')}
              className="px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-100 text-xs font-bold transition-all border border-indigo-800 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Edit Parameters
            </button>
          </div>
          {/* Injecting the results summary here */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crystalline Mass</span>
              <span className="text-xl font-mono font-black text-indigo-400 mt-1">{(100 - amorphousWtPct).toFixed(1)} wt%</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amorphous Content</span>
              <span className="text-xl font-mono font-black text-rose-400 mt-1">{amorphousWtPct.toFixed(1)} wt%</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume Factor</span>
              <span className="text-xl font-mono font-black text-amber-400 mt-1">{calculations.totalVolumeFactor.toFixed(1)}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sample MAC (μ*)</span>
              <span className="text-xl font-mono font-black text-cyan-400 mt-1">{calculations.totalSampleMAC.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm²/g</span></span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dominant Phase</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 truncate">
                {dominantPhase ? \`\${dominantPhase.name} (\${dominantPhase.crystallineFraction.toFixed(1)}%)\` : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <PieChart className="w-24 h-24 text-indigo-400" />
               </div>
               <h3 className="text-base font-black text-white mb-6 flex items-center gap-2">
                 <PieChart className="w-5 h-5 text-indigo-400" />
                 Mass Fraction Results (wt%)
               </h3>
               
               <div className="space-y-4 relative z-10">
                 {phases.map(p => (
                   <div key={p.id} className="space-y-1.5">
                     <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-200 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                         {p.name}
                       </span>
                       <div className="flex items-center gap-3">
                         <span className="text-slate-400 font-mono">
                           {(p.intensity || 0)} cps
                         </span>
                         <span className="font-black text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                           {p.crystallineFraction?.toFixed(2) || 0} wt%
                         </span>
                       </div>
                     </div>
                     <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: \`\${p.crystallineFraction || 0}%\` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className="h-full rounded-full"
                         style={{ backgroundColor: p.color }}
                       />
                     </div>
                   </div>
                 ))}
                 {amorphousWtPct > 0 && (
                   <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                     <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-rose-300 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-rose-500" />
                         Amorphous Content
                       </span>
                       <span className="font-black text-rose-300 font-mono bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/50">
                         {amorphousWtPct.toFixed(2)} wt%
                       </span>
                     </div>
                     <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: \`\${amorphousWtPct}%\` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className="h-full rounded-full bg-rose-500 opacity-80"
                       />
                     </div>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
              <Activity className="w-16 h-16 text-indigo-500/20 mb-4" />
              <h3 className="text-lg font-black text-white mb-2">Analysis Successful</h3>
              <p className="text-xs text-slate-400 mb-6 max-w-sm">The Reference Intensity Ratio (RIR) matrix inversion has completed. Mass fractions have been normalized to 100%.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

code = code.replace(endStr, newEnd);

// Hide the summary from setup
code = code.replace(`      {mainTab === 'analysis' && (\n        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">`, `      {mainTab === 'analysis' && false && (\n        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">`);

// Hide the charts from setup
code = code.replace(`              <div className="col-span-12 lg:col-span-4 space-y-6">`, `              {false && <div className="col-span-12 lg:col-span-4 space-y-6">`);
// That's a bit dangerous if the closing tags aren't updated, but wait. If I just do {false && <div...> ... </div>} I have to find the closing div.
// Instead of messing with the grid, let's just leave the charts in the setup view! The user explicitly requested "ask for the numbers or parameters, and once the user enters them and hits Ready, use an animation to show exactly what's happening and the outcome."
// So the charts should be hidden in setup.
// I will just use CSS `hidden` or `opacity-0 h-0`.
code = code.replace(`              <div className="col-span-12 lg:col-span-4 space-y-6">`, `              <div className="col-span-12 lg:col-span-4 space-y-6 hidden lg:block opacity-20 pointer-events-none filter blur-sm">`);


fs.writeFileSync('components/ReferenceIntensityRatioModule.tsx', code);
console.log("RIR replaced!");
