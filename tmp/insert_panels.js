const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'NeutronModule.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = 'Notice how <strong className="text-amber-400">Hydrogen / Deuterium</strong> has virtually zero representation on the X-Ray scale, but stands out as a major coherent scatterer on the Neutron scale. Swapping H to D improves coherent signals immensely!';

const pos = content.indexOf(target);
if (pos === -1) {
  console.error('Target text not found in file!');
  process.exit(1);
}

// Find the next ')}' ending the contrast block
const endPos = content.indexOf(')}', pos);
if (endPos === -1) {
  console.error('Closing block not found!');
  process.exit(1);
}

const insertPos = endPos + 2; // insert directly after the closing ')}'

const newContent = `

               {activeRightTab === 'rings' && (
                  <div className="flex flex-col lg:flex-row gap-6 items-center flex-1 py-1 animate-fadeIn">
                     <div className="relative w-[280px] h-[280px] bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center p-2 shadow-inner scale-100 shrink-0 overflow-hidden group/rings transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                        <canvas 
                          ref={ringsCanvasRef} 
                          className="w-full h-full rounded-2xl cursor-crosshair"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400 border border-slate-800 pointer-events-none">
                           2D Powder Plate
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col justify-center gap-4 text-left">
                        <div className="space-y-1">
                           <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">2D Debye-Scherrer Rings</h4>
                           <h3 className="text-base font-black text-white capitalize leading-tight">Diffraction Cone Projection</h3>
                           <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                              This detector simulates a flat-plate pixel tracker intercepting the 3D Debye-Scherrer diffraction cones backscattered from a powder sample.
                           </p>
                        </div>
                        
                        <div className="space-y-2.5 bg-black/40 p-4 border border-slate-800 rounded-2xl">
                           <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="font-bold flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-sm"/> Coherent Signal</span>
                              <span className="text-white font-black">Concentric Debye Rings</span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="font-bold flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block shadow-sm"/> Background Noise</span>
                              <span className="text-amber-500 font-black">
                                 {showIncoherentNoise && averageIncoherentCrossSection > 4 ? 'High Haze (H-Incoherent)' : 'Low Haze'}
                              </span>
                           </div>
                           <div className="w-full h-px bg-slate-800/80 my-1" />
                           <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="font-bold">Total Inc. Cross Section</span>
                              <span className="text-amber-400 font-black">{totalIncoherentCrossSection.toFixed(2)} barns</span>
                           </div>
                        </div>

                        {showIncoherentNoise && averageIncoherentCrossSection > 4 && (
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[10px] text-amber-400 leading-snug">
                             <span className="font-extrabold block uppercase tracking-wider mb-0.5">⚠️ High Incoherent Haze:</span>
                             Hydrogen has a massive incoherent cross-section (80.26 barns) that creates a diffuse isotropic background "haze", obscuring coherent rings. Click the <strong className="text-white">"D₂O Swap" preset</strong> or deuterate your atoms to clean up the signal!
                          </div>
                        )}
                     </div>
                  </div>
               )}

               {activeRightTab === 'solvent' && (
                  <div className="flex flex-col gap-5 flex-1 py-1 animate-fadeIn">
                     <div className="space-y-1 text-left">
                        <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.25em]">Solvent Contrast Matching</h4>
                        <h3 className="text-base font-black text-white">Scattering Length Density (SLD) Matching Curve</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                           In SANS/neutron diffraction, mixing H₂O ($b_H = -3.74$ fm) and D₂O ($b_D = 6.67$ fm) lets you vary the solvent's SLD to match specific parts of the sample, rendering them invisible and isolating other structures.
                        </p>
                     </div>

                     <div className="h-[200px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart data={contrastPoints} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                              <XAxis 
                                 dataKey="d2o" 
                                 label={{ value: '% D₂O in H₂O / D₂O solvent mix', position: 'bottom', offset: 5, fill: '#64748b', fontSize: 9, fontWeight: 700 }} 
                                 tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                              />
                              <YAxis 
                                 label={{ value: 'SLD (10⁻⁶ Å⁻²)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                 tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                              />
                              <Tooltip 
                                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                 content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                       const d = payload[0].payload;
                                       return (
                                          <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-[10px] space-y-1 text-left">
                                             <p className="font-bold text-pink-400">{d.d2o}% D₂O Solvent Mix</p>
                                             <p className="text-slate-300">Solvent SLD: <strong>{d.solventSLD} 10⁻⁶ Å⁻²</strong></p>
                                             <p className="text-slate-300">Sample SLD: <strong>{d.sampleSLD} 10⁻⁶ Å⁻²</strong></p>
                                             <p className="text-slate-400">Relative Contrast: <strong>{d.contrastSq} 10⁻¹² Å⁻⁴</strong></p>
                                          </div>
                                       );
                                    }
                                    return null;
                                 }}
                              />
                              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }} />
                              <Line name="Solvent SLD" type="monotone" dataKey="solventSLD" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
                              <Line name="Sample SLD" type="monotone" dataKey="sampleSLD" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="bg-black/35 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex-1">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
                                 <span className="text-slate-400">Solvent D₂O Fraction</span>
                                 <span className="text-pink-400">{d2oFraction}%</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 value={d2oFraction} 
                                 onChange={(e) => setD2oFraction(parseInt(e.target.value))}
                                 className="w-full accent-pink-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border border-slate-800"
                              />
                           </div>
                           
                           <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-w-[140px] text-center flex flex-col justify-center">
                              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest">Relative Contrast</span>
                              <span className={\`text-base font-black font-mono mt-0.5 \${contrastFactor < 0.15 ? 'text-emerald-400' : 'text-pink-400 shadow-pulse'}\`}>
                                 {Math.max(0, contrastFactor * 10).toFixed(2)}
                              </span>
                              <span className="text-[7px] text-slate-400 uppercase mt-0.5">arbitrary scale</span>
                           </div>
                        </div>

                        <div className="w-full h-px bg-slate-800/80" />

                        <div className="text-[10px] font-mono leading-relaxed text-slate-400 text-left">
                           {contrastFactor < 0.15 ? (
                              <p className="text-emerald-400 font-bold animate-pulse flex items-center gap-2">
                                 ✨ MATCH POINT ACHIEVED ({d2oFraction}% D₂O): The average nuclear scattering of the solvent perfectly matches your crystal cell! The coherent scattering signal of the cell vanishes.
                              </p>
                           ) : (
                              <p>
                                 Solvent SLD is <strong className="text-pink-400 font-bold">{solventSLD.toFixed(2)} 10⁻⁶ Å⁻²</strong>. Crystal SLD is <strong className="text-blue-400 font-bold">{cellSLD.toFixed(2)} 10⁻⁶ Å⁻²</strong>. Adjust the slider to find the crossing point where contrast drops to 0!
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               )}`;

const finalContent = content.substring(0, insertPos) + newContent + content.substring(insertPos);
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully written file!');
