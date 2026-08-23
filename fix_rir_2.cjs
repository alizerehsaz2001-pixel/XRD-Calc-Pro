const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

const tabReplacement = `
  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {appState === 'setup' && (
      <>
      {/* Top Module Navigation Tabs */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md flex flex-wrap sm:flex-nowrap gap-1.5 shadow-xl">
        <button
          onClick={() => setMainTab('analysis')}
          className={\`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${mainTab === 'analysis' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}\`}
        >
          <FlaskConical className="w-4 h-4 text-indigo-300" />
          <span>1. Phase Analysis Engine</span>
        </button>
        <button
          onClick={() => setMainTab('calibration')}
          className={\`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${mainTab === 'calibration' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}\`}
        >
          <Calculator className="w-4 h-4 text-amber-300" />
          <span>2. RIR Calibration Engine</span>
        </button>
        <button
          onClick={() => setMainTab('spectrum')}
          className={\`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${mainTab === 'spectrum' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}\`}
        >
          <Activity className="w-4 h-4 text-rose-300" />
          <span>3. Spectrum Profile</span>
        </button>
        <button
          onClick={() => setMainTab('database')}
          className={\`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${mainTab === 'database' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}\`}
        >
          <Database className="w-4 h-4 text-cyan-300" />
          <span>4. Reference DB</span>
        </button>
        <button
          onClick={() => setMainTab('theory')}
          className={\`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${mainTab === 'theory' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}\`}
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>Theory & Math</span>
        </button>
        <button
          onClick={startComputation}
          className="flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/50"
        >
          <Activity className="w-4 h-4" />
          <span>Compute RIR</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
`;

code = code.replace(/  return \(\n    <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">\n      \n      \{\/\* Top Module Navigation Tabs \*\/\}\n      <div className="bg-slate-900\/90 border border-slate-800\/80 rounded-2xl p-1\.5 backdrop-blur-md flex flex-wrap sm:flex-nowrap gap-1\.5 shadow-xl">[\s\S]*?<\/div>\n\n      <AnimatePresence mode="wait">/, tabReplacement);

// Next we will hide the results block in setup, and put the computing/results appState overlays.
