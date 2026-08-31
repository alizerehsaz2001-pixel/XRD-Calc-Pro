with open("components/OriginProFWHMPlotter.tsx", "r") as f:
    content = f.read()

origin_tab_code = """
      {/* SUBTAB 5: ORIGINPRO NATIVE SCRIPT */}
      {activeSubTab === 'originpro' && (
        <div className="bg-[#1e1e1e] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-black/40">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-400" />
              <div>
                <h4 className="text-white text-xs font-bold font-mono tracking-wider">OriginPro Native Script (op module)</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Executes natively inside OriginPro 2021+ Python Console, writes to Worksheet, plots to Graph</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyOriginProToClipboard}
                className="px-3 py-1.5 rounded bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
              >
                {copiedOriginPro ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                {copiedOriginPro ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-[#d4d4d4] select-text">
            {originProScript ? (
              <pre className="whitespace-pre">{originProScript}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic">
                {isLoading ? 'Generating OriginPro script...' : 'Click "Re-render Matplotlib" to generate OriginPro script'}
              </div>
            )}
          </div>
        </div>
      )}
"""

content = content.replace("{/* SUBTAB 4: EXPLAIN MODULE (ORIGINPRO CURVE PHYSICS & THEORY) */}", origin_tab_code + "\n      {/* SUBTAB 4: EXPLAIN MODULE (ORIGINPRO CURVE PHYSICS & THEORY) */}")

with open("components/OriginProFWHMPlotter.tsx", "w") as f:
    f.write(content)
