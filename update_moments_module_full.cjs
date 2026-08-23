const fs = require('fs');

let code = fs.readFileSync('components/MethodOfMomentsModule.tsx', 'utf8');

// Find return statement
const returnMarker = "  return (";
const returnPos = code.indexOf(returnMarker);
if (returnPos === -1) {
  console.error("Could not find return statement");
  process.exit(1);
}

const beforeReturn = code.substring(0, returnPos);

// We need to extract the parts for Left Column (Setup inputs) and Right Column (Results)
// Let's inspect where left column ends and right column starts
const leftColMarker = '{/* Left Column: Settings & Input Data */}';
const rightColMarker = '{/* Right Column: Physical Results & Interactive Visualizations */}';

const leftStart = code.indexOf(leftColMarker);
const rightStart = code.indexOf(rightColMarker);

if (leftStart === -1 || rightStart === -1) {
  console.error("Could not find column markers");
  process.exit(1);
}

const leftContent = code.substring(leftStart + leftColMarker.length, rightStart).trim();
// Find the end of right content (before closing tags)
const endOfRightContentMarker = "      </div>\n    </div>\n  );\n};";
const rightEnd = code.lastIndexOf(endOfRightContentMarker);

let rightContent = "";
if (rightEnd !== -1) {
  rightContent = code.substring(rightStart + rightColMarker.length, rightEnd).trim();
} else {
  // alternative find
  const lastDivs = code.lastIndexOf("    </div>\n  );\n};");
  rightContent = code.substring(rightStart + rightColMarker.length, lastDivs).trim();
}

// Strip out outer container closing div if present in rightContent
if (rightContent.endsWith("</div>")) {
  rightContent = rightContent.substring(0, rightContent.lastIndexOf("</div>")).trim();
}

const newReturnBlock = `  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020813] via-[#0B1230] to-[#060A20] p-6 md:p-10 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.15)] group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/30 transition-colors duration-700" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Statistical Profile Analysis • Second & Fourth Statistical Moments</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-400 tracking-tight flex flex-wrap items-center gap-3">
              Method of Moments
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-inner">
                Variance-Range Analysis
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Separates crystallite size and microstrain by analyzing profile variance <span className="font-mono text-indigo-300">W</span> and kurtosis <span className="font-mono text-indigo-300">μ₄</span> across integration ranges <span className="font-mono text-indigo-300">σ</span>. The linear slope yields reciprocal domain size <span className="font-mono text-indigo-300">(1/D_V)</span>, while quadratic curvature gives mean-square strain <span className="font-mono text-indigo-300">⟨ε²⟩</span>.
            </p>
          </div>

          {/* Action buttons in header */}
          <div className="flex flex-wrap items-center gap-2 relative z-20">
            {appState === 'results' && (
              <button
                onClick={() => setAppState('setup')}
                className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg active:scale-95 animate-in fade-in"
              >
                <RotateCcw className="w-4 h-4 text-indigo-300" />
                Edit Parameters
              </button>
            )}
            <button
              onClick={handleCopyLaTeX}
              disabled={!result}
              className="px-3.5 py-2.5 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Copy LaTeX formula"
            >
              {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              {copiedNotification ? 'Copied!' : 'LaTeX'}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={!result}
              className="px-3.5 py-2.5 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#050C17]/90 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-20 hover:border-indigo-500/30 transition-colors duration-500">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          <span>Curated Experimental Datasets</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {MOMENT_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 hover:bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex-1 md:flex-none text-center shadow-inner flex items-center justify-center gap-1.5 group/btn"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:text-indigo-300 group-hover/btn:animate-pulse" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. SETUP STATE VIEW */}
      {appState === 'setup' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Settings & Input Data */}
            <div className="lg:col-span-12 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-6">
                  ${leftContent.replace('<div className="lg:col-span-5 space-y-6">', '').replace(/<div className="bg-\[#050C17\]\/90 p-5 rounded-3xl border border-indigo-500\/20 shadow-\[0_8px_30px_rgba\(99,102,241,0.05\)\][\s\S]*$/, '')}
                </div>
                
                <div className="lg:col-span-6 space-y-6">
                  {/* Variance-Range Table Input Data */}
                  <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Range Cutoffs & Variance Data</h3>
                      </div>
                      <button
                        onClick={() => setInputData('')}
                        className="text-[10px] text-slate-400 hover:text-rose-400 font-mono transition-colors"
                      >
                        Clear Table
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Format: <code>Range_σ [deg], Variance_W [deg²], μ₄ [deg⁴] (opt)</code></span>
                      </div>
                      <textarea
                        rows={8}
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        placeholder="0.20, 0.0021, 0.000015\n0.35, 0.0039, 0.000042\n0.50, 0.0058, 0.000088\n0.65, 0.0079, 0.000152\n0.80, 0.0101, 0.000238"
                        spellCheck={false}
                        className="w-full p-4 bg-black/60 text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner relative z-10"
                      />
                    </div>

                    {/* Input Counter */}
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                      <span className="text-slate-400">Parsed range points: <strong className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{result?.points?.length || 0}</strong></span>
                      {result && result.points.length >= 3 ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Ready for Moment Regression
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> Minimum 3 range points required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Theoretical & Formula Guide Card */}
                  <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/20 shadow-[0_8px_30px_rgba(99,102,241,0.05)] space-y-4 hover:border-indigo-500/40 transition-colors duration-500 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
                      <Info className="w-4 h-4" />
                      Methodology & Formula Guide
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                      Evaluating profile variance <span className="font-mono text-indigo-300">W</span> against integration limits <span className="font-mono text-indigo-300">σ</span> yields a linear-quadratic regression:
                    </p>
                    <div 
                      className="text-white text-xs sm:text-sm py-3 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner relative z-10"
                      dangerouslySetInnerHTML={{
                        __html: katex.renderToString(
                          'W(\\\\sigma) = W_0 + K_1 \\\\cdot \\\\sigma + K_2 \\\\cdot \\\\sigma^2',
                          { throwOnError: false, displayMode: true }
                        )
                      }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] font-mono relative z-10">
                      <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 space-y-1.5 hover:bg-indigo-500/10 transition-colors">
                        <span className="text-indigo-400 font-bold block flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> 1. Volume Size (D_V)</span>
                        <div 
                          className="text-slate-200 bg-black/40 py-1.5 px-2 rounded-lg text-center"
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(
                              'D_V = \\\\frac{\\\\lambda}{\\\\pi^2 K_1 \\\\cos\\\\theta_0}',
                              { throwOnError: false, displayMode: false }
                            )
                          }}
                        />
                      </div>
                      <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/20 space-y-1.5 hover:bg-purple-500/10 transition-colors">
                        <span className="text-purple-400 font-bold block flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> 2. Microstrain (⟨ε²⟩¹/²)</span>
                        <div 
                          className="text-slate-200 bg-black/40 py-1.5 px-2 rounded-lg text-center"
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(
                              '\\\\langle\\\\epsilon^2\\\\rangle^{1/2} = \\\\frac{\\\\sqrt{K_2}}{2 \\\\tan\\\\theta_0}',
                              { throwOnError: false, displayMode: false }
                            )
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready & Compute Action Banner */}
              <div className="p-6 bg-[#050C17]/95 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Ready for Variance-Range Method of Moments
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {result?.points?.length || 0} Range Points Configured | Peak Centroid 2θ₀ = {twoTheta0}°
                    </p>
                  </div>
                </div>

                <button
                  onClick={startComputation}
                  disabled={!result || result.points.length < 3}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Compute Method of Moments (Variance-Range W)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPUTING STATE VIEW */}
      {appState === 'computing' && (
        <div className="bg-[#050C17]/95 rounded-3xl p-12 border border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-950 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 0 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">1</span>
                Subtracting instrumental resolution & Caglioti broadening...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 1 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">2</span>
                Performing Wilson Variance-Range regression W(σ) = W₀ + K₁σ + K₂σ²...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 2 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">3</span>
                Deconvolving volume-weighted size ⟨D⟩_v & RMS microstrain ⟨ε²⟩¹/²...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 3 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">4</span>
                Evaluating 4th statistical moment μ₄ & profile shape kurtosis...
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {/* 3. RESULTS STATE VIEW */}
      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          ${rightContent}
        </div>
      )}
    </div>
  );
};
`;

const finalCode = beforeReturn + newReturnBlock;
fs.writeFileSync('components/MethodOfMomentsModule.tsx', finalCode);
console.log('Successfully updated MethodOfMomentsModule.tsx with 3-state architecture');
