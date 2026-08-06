const fs = require('fs');

let content = fs.readFileSync('components/DiffractionCompareModule.tsx', 'utf8');

const startMarker = `      {/* ----------------------------------------------------
          Visual Spectral Diff/Compare Charts
          ---------------------------------------------------- */}`;

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Could not find start marker");
  process.exit(1);
}

const newJSX = `      {/* ----------------------------------------------------
          Visual Spectral Diff/Compare Charts
          ---------------------------------------------------- */}
      <div className="bg-[#050A14] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden group space-y-6">
        
        {/* Custom Background Graphic */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
          <img src={spectralDiffBg} alt="Spectral Overlay Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/40" />
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />

        {/* Header Title & Badges */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="relative group/icon cursor-default">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover/icon:bg-indigo-400/30 transition-all duration-700 pointer-events-none" />
              <div className="w-14 h-14 bg-[#080d1a] rounded-2xl border border-indigo-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/icon:border-indigo-400 transition-colors duration-500 overflow-hidden">
                <Layers className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] group-hover/icon:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>{t('Spectral Diff Overlay')}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                  v2.0 HUD
                </span>
              </h3>
              <p className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-[pulse_2s_ease-in-out_infinite]" />
                {t('Experimental (Sample A) vs Reference (Sample B) & Intensity Residuals')}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Residual R_p</span>
              <span className="text-sm font-mono font-black text-rose-400">{spectralMetrics.rP}%</span>
            </div>
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Weighted R_wp</span>
              <span className="text-sm font-mono font-black text-amber-400">{spectralMetrics.rWP}%</span>
            </div>
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cross-Corr (r)</span>
              <span className="text-sm font-mono font-black text-emerald-400">{spectralMetrics.pearsonR}%</span>
            </div>
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">RMS Error</span>
              <span className="text-sm font-mono font-black text-cyan-400">{spectralMetrics.rmsd} cnt</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 bg-[#080E1C]/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
          
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('stacked')}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all \${
                viewMode === 'stacked' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }\`}
            >
              <Layers3 className="w-3.5 h-3.5" />
              <span>3-Pane Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all \${
                viewMode === 'unified' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }\`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Unified Overlay</span>
            </button>
            <button
              onClick={() => setViewMode('mirrored')}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all \${
                viewMode === 'mirrored' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }\`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Butterfly Mirror</span>
            </button>
          </div>

          {/* Theme & Display Options */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Color Palette Selector */}
            <div className="flex items-center gap-1 bg-[#030712] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDiffTheme('neon')}
                className={\`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all \${
                  diffTheme === 'neon' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
                }\`}
              >
                Neon
              </button>
              <button
                onClick={() => setDiffTheme('emerald')}
                className={\`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all \${
                  diffTheme === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }\`}
              >
                Emerald
              </button>
              <button
                onClick={() => setDiffTheme('amber')}
                className={\`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all \${
                  diffTheme === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }\`}
              >
                Amber
              </button>
            </div>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={\`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors \${
                showGrid ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
              }\`}
              title="Toggle Gridlines"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Diff Fill Toggle */}
            <button
              onClick={() => setShowDiffArea(!showDiffArea)}
              className={\`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors \${
                showDiffArea ? 'bg-slate-800 text-amber-400 border-amber-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
              }\`}
              title="Toggle Diff Area Fill"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => {
                if (!points || points.length === 0) return;
                const headers = "2Theta_deg,Intensity_A_Exp,Intensity_B_Ref,Delta_Residual\\n";
                const rows = points.map(p => \`\${p.twoTheta},\${p.intensityA},\${p.intensityB},\${p.difference}\`).join('\\n');
                const blob = new Blob([headers + rows], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`spectral_diff_\${materialA.name.replace(/\\s+/g, '_')}_vs_\${materialB.name.replace(/\\s+/g, '_')}.csv\`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border border-indigo-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Zoom Controls */}
            {isZoomedIn && (
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                <button onClick={panLeft} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Pan Left')}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={panRight} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Pan Right')}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomInStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Zoom In')}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOutStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Zoom Out')}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOut} className="flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border border-indigo-500/30" title={t('Reset')}>
                  <RotateCcw className="w-3 h-3" />
                  {t('Reset')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Display Stage */}
        <div className="w-full relative z-10 select-none bg-[#030712] p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col gap-4 min-h-[640px]">
          
          {/* Active Palette Config */}
          {(() => {
            const paletteMap = {
              neon: { colorA: '#f43f5e', colorB: '#06b6d4', colorDiff: '#f59e0b' },
              emerald: { colorA: '#10b981', colorB: '#a855f7', colorDiff: '#3b82f6' },
              amber: { colorA: '#fbbf24', colorB: '#6366f1', colorDiff: '#f43f5e' }
            };
            const pal = paletteMap[diffTheme];

            // Custom Tooltip component inside render scope
            const RenderTooltip = ({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const twoTheta = label;
                const lambda = 1.5406;
                const thetaRad = (twoTheta / 2) * (Math.PI / 180);
                const dSpacing = thetaRad > 0 ? (lambda / (2 * Math.sin(thetaRad))).toFixed(4) : 'N/A';

                const valA = payload.find((p: any) => p.dataKey === 'intensityA')?.value;
                const valB = payload.find((p: any) => p.dataKey === 'intensityB')?.value;
                const valDiff = payload.find((p: any) => p.dataKey === 'difference')?.value;
                const valMirroredB = payload.find((p: any) => p.dataKey === 'mirroredB')?.value;

                return (
                  <div className="bg-[#050A14]/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1.5 z-50 min-w-[210px]">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">2θ Angle</span>
                      <span className="text-cyan-400 font-black text-sm">{twoTheta}°</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">d-spacing:</span>
                      <span className="text-slate-200 font-bold">{dSpacing} Å</span>
                    </div>
                    {valA !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          Sample A (Exp):
                        </span>
                        <span className="font-bold text-white">{valA} %</span>
                      </div>
                    )}
                    {valB !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          Sample B (Ref):
                        </span>
                        <span className="font-bold text-white">{valB} %</span>
                      </div>
                    )}
                    {valMirroredB !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          Sample B (Ref):
                        </span>
                        <span className="font-bold text-white">{Math.abs(valMirroredB)} %</span>
                      </div>
                    )}
                    {valDiff !== undefined && (
                      <div className="flex justify-between items-center text-[11px] border-t border-slate-800/80 pt-1 mt-1">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorDiff }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorDiff }} />
                          Δ Residual:
                        </span>
                        <span className={\`font-black \${valDiff > 0 ? 'text-rose-400' : valDiff < 0 ? 'text-cyan-400' : 'text-slate-300'}\`}>
                          {valDiff > 0 ? \`+\${valDiff}\` : valDiff} %
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            };

            if (viewMode === 'unified') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* Single Unified Chart */}
                  <div className="w-full h-[400px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          {t('Sample A')}: {materialA.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          {t('Sample B')}: {materialB?.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">Unified Overlay Mode</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          domain={[0, 110]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Counts [%]'), angle: -90, position: 'insideTopLeft', fill: '#94a3b8', fontSize: 10, dy: 20, dx: 10 }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        {showDiffArea && (
                          <Area type="monotone" dataKey="intensityA" fill={pal.colorA} fillOpacity={0.08} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[200px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                      </span>
                      <span className="text-[9px] font-mono text-amber-500/80 font-bold uppercase tracking-wider">Delta Curve</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <YAxis 
                          domain={[-100, 100]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            if (viewMode === 'mirrored') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* Butterfly Mirrored Chart */}
                  <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          {t('Sample A (Exp - Upward)')}: {materialA.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          {t('Sample B (Ref - Downward)')}: {materialB?.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-400/80 font-bold uppercase tracking-widest">Butterfly Mirrored Mode</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          domain={[-110, 110]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                        {showDiffArea && (
                          <>
                            <Area type="monotone" dataKey="intensityA" fill={pal.colorA} fillOpacity={0.15} stroke="none" />
                            <Area type="monotone" dataKey="mirroredB" fill={pal.colorB} fillOpacity={0.15} stroke="none" />
                          </>
                        )}
                        <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="mirroredB" stroke={pal.colorB} strokeWidth={2} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[180px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            // Default Stacked 3-Pane View
            return (
              <div className="w-full flex flex-col gap-3">
                {/* Pane 1: Sample A */}
                <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                      <FlaskConical className="w-3.5 h-3.5" />
                      {t('Sample A (Experimental)')}: {materialA.name} {materialA.formula && `[${materialA.formula}]`}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 1</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                      onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      {showDiffArea && <Area type="monotone" dataKey="intensityA" fill={pal.colorA} fillOpacity={0.12} stroke="none" />}
                      <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pane 2: Sample B */}
                <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                      <Database className="w-3.5 h-3.5" />
                      {t('Sample B (Reference)')}: {materialB?.name} {materialB?.formula && `[${materialB?.formula}]`}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 2</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                      onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      {showDiffArea && <Area type="monotone" dataKey="intensityB" fill={pal.colorB} fillOpacity={0.12} stroke="none" />}
                      <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pane 3: Residual Curve */}
                <div className="w-full h-[200px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 3</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 25, left: 10 }}
                      onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis 
                        dataKey="twoTheta" 
                        type="number"
                        domain={[left, right]}
                        allowDataOverflow={true}
                        tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                        label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                      />
                      <YAxis domain={[-100, 100]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                      {showDiffArea && (
                        <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                      )}
                      <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
`;

content = content.substring(0, startIndex) + newJSX;
fs.writeFileSync('components/DiffractionCompareModule.tsx', content);
console.log("Spectral Diff JSX Replaced Successfully!");
