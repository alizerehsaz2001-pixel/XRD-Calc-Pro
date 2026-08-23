const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

// The code currently has:
// 1. `setup` tab
// 2. `matrix` tab
// 3. The `results` tab content (starts with `{activeTab === 'results' && (`)
// 4. The `mapping` tab content (starts with `{activeTab === 'mapping' && (`)
// 5. Some messed up closing tags.

// We will extract each piece exactly.

const setupStart = code.indexOf(`{activeTab === 'setup' && (`);
const matrixStart = code.indexOf(`{activeTab === 'matrix' && (`);
const resultsStart = code.indexOf(`{activeTab === 'results' && (`);
const mappingStart = code.indexOf(`{activeTab === 'mapping' && (`);
const pythonStart = code.indexOf(`{/* Python Scripting Engine`);

if (setupStart < 0 || matrixStart < 0 || resultsStart < 0 || mappingStart < 0) {
  console.log("Could not find one of the blocks");
  process.exit(1);
}

const setupBlock = code.slice(setupStart, matrixStart);
const matrixBlock = code.slice(matrixStart, resultsStart);
const resultsBlockRaw = code.slice(resultsStart, mappingStart);
const mappingBlockRaw = code.slice(mappingStart, pythonStart);
const pythonBlock = code.slice(pythonStart);

const beforeTabs = code.slice(0, setupStart);

// Clean mapping block (it has some closing tag errors)
// We want mapping block to end with:
//           </motion.div>
//         )}
let mappingBlock = mappingBlockRaw;
mappingBlock = mappingBlock.replace(/<\/div>\s*<\/div>\s*}\)\s*$/, '      </div>\n          </motion.div>\n        )}\n');

// Clean results block
// We want it to be enclosed in {appState === 'results' && (<div ...> ... </div>)}
// Remove the motion.div wrapper from results
let resultsBlock = resultsBlockRaw;
resultsBlock = resultsBlock.replace(/\{activeTab === 'results' && \(\s*<motion\.div[^>]*>/, '{appState === \'results\' && (\n        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">\n          <div className="flex justify-end pt-4 pb-2">\n            <button \n              onClick={() => setAppState(\'setup\')}\n              className="px-4 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-100 text-xs font-bold transition-all border border-cyan-800 flex items-center gap-2"\n            >\n              <RotateCcw className="w-4 h-4" />\n              Edit Transformation Parameters\n            </button>\n          </div>\n');
resultsBlock = resultsBlock.replace(/<\/div>\s*<\/motion\.div>\s*}\)\s*$/, ''); // remove end tags, we'll manually close later

// Computing block
const computingBlock = `
      </AnimatePresence>
      </>
      )}

      {appState === 'computing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            <Activity className="w-10 h-10 text-cyan-500 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 0 ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">1</span>
                Constructing Metric Tensor G...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 1 ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">2</span>
                Inverting Transformation Matrix P⁻¹...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 2 ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">3</span>
                Applying Coordinate Mapping...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 3 ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">4</span>
                Supercell Complete!
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}
`;

let cleanCode = beforeTabs + setupBlock + matrixBlock + mappingBlock + computingBlock + resultsBlock + pythonBlock;

// At the very end of pythonBlock, we need to add </div>)} for the results block.
// Let's replace the final `    </div>\n  );\n};`
cleanCode = cleanCode.replace(/ {4}<\/div>\n {2}\);\n};\n?$/, '        </div>\n      )}\n    </div>\n  );\n};\n');

fs.writeFileSync('components/SupercellTransformationModule.tsx', cleanCode);
console.log("Done");
