const fs = require('fs');
let content = fs.readFileSync('components/ImageAnalysisModule.tsx', 'utf-8');

const startTag = '<AnimatePresence mode="wait">';
const endTag = '{/* Calibration Grid Overlay */}';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

const newBlock = `
              <AnimatePresence mode="wait">
                {image ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full h-full flex flex-col items-center justify-center p-4 min-h-[300px]"
                  >
                    <div className="relative inline-block group/img">
                      <img 
                        src={(analysisMode === 'python_cv' && cvResults && activeFilterTab !== 'original') 
                          ? cvResults.processed_images[activeFilterTab] 
                          : image} 
                        alt="Target" 
                        ref={previewRef}
                        onMouseMove={(e) => {
                          if (!previewRef.current) return;
                          const rect = previewRef.current.getBoundingClientRect();
                          setMagnifier({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        }}
                        onMouseLeave={() => setMagnifier(null)}
                        className="max-w-full max-h-[220px] object-contain rounded-xl shadow-2xl z-10 transition-all duration-300" 
                        style={analysisMode === 'python_cv' ? {} : getImgStyle()}
                      />
                      
                      {magnifier && !scanActive && (
                        <div 
                          className="absolute pointer-events-none rounded-full border-2 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-50 overflow-hidden bg-black flex items-center justify-center backdrop-blur-sm"
                          style={{
                             width: '120px',
                             height: '120px',
                             left: magnifier.x - 60,
                             top: magnifier.y - 60,
                             backgroundImage: \`url(\${analysisMode === 'python_cv' && cvResults && activeFilterTab !== 'original' ? cvResults.processed_images[activeFilterTab] : image})\`,
                             backgroundPosition: \`\${(magnifier.x / previewRef.current!.offsetWidth) * 100}% \${(magnifier.y / previewRef.current!.offsetHeight) * 100}%\`,
                             backgroundSize: \`\${previewRef.current!.offsetWidth * 2.5}px \${previewRef.current!.offsetHeight * 2.5}px\`,
                             backgroundRepeat: 'no-repeat',
                             ...(analysisMode === 'python_cv' ? {} : getImgStyle())
                          }}
                        >
                           <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] absolute" />
                           <div className="w-full h-[1px] bg-sky-400/40 absolute" />
                           <div className="h-full w-[1px] bg-sky-400/40 absolute" />
                        </div>
                      )}
                    </div>
                    
                    {/* Processed Filter Tabs overlay under the image */}
                    {analysisMode === 'python_cv' && cvResults && (
                      <div className="z-20 mt-4 flex flex-wrap gap-1 bg-black/60 p-1.5 rounded-xl border border-slate-800/80 w-full max-w-sm">
                        {[
                          { id: 'original', label: 'Original' },
                          { id: 'canny_edges', label: 'Edges' },
                          { id: 'spot_contours', label: 'Spots' },
                          { id: 'ring_fits', label: 'Rings Fit' },
                          { id: 'radial_heatmap', label: 'Heatmap' },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={(e) => { e.stopPropagation(); setActiveFilterTab(tab.id as any); }}
                            className={\`flex-1 py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border \${
                              activeFilterTab === tab.id
                                ? 'bg-sky-500/20 border-sky-500/30 text-sky-300'
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                            }\`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
`;

content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);

fs.writeFileSync('components/ImageAnalysisModule.tsx', content);
