const fs = require('fs');
let code = fs.readFileSync('components/RietveldModule.tsx', 'utf8');

const targetHeader = '<th className="p-2 text-[8px] uppercase text-slate-500 font-black text-center">Pos 2θ(°)</th>';
const newHeader = '<th className="p-2 text-[8px] uppercase text-slate-500 font-black text-center">Pos 2θ(°)</th>\n                               <th className="p-2 text-[8px] uppercase text-slate-500 font-black text-center">FWHM(°)</th>';
code = code.replace(targetHeader, newHeader);

const oldCalcBlock = `const displacementShift = -userParams.sampleDisplacement * Math.cos(thetaRad);
                                  display2Theta += userParams.zeroShift + displacementShift;
                                }`;
                                
const newCalcBlock = `const displacementShift = -userParams.sampleDisplacement * Math.cos(thetaRad);
                                  display2Theta += userParams.zeroShift + displacementShift;
                                }

                                let displayFWHM = 0;
                                if (display2Theta > 0) {
                                   const thetaRad = (display2Theta/2) * (Math.PI / 180);
                                   const bSizeRad = (0.9 * 1.5406) / ((userParams.crystalliteSize * 10) * Math.cos(thetaRad));
                                   const bSizeDeg = bSizeRad * (180 / Math.PI);
                                   const bStrainRad = 4 * userParams.microstrain * Math.tan(thetaRad);
                                   const bStrainDeg = bStrainRad * (180 / Math.PI);
                                   displayFWHM = userParams.fwhm + bSizeDeg + bStrainDeg;
                                }`;
code = code.replace(oldCalcBlock, newCalcBlock);

const targetTd = `<td className="p-2 text-center text-[10px] font-mono text-slate-400 font-bold">
                                     {display2Theta > 0 ? display2Theta.toFixed(2) : '-'}
                                   </td>`;
const newTd = `<td className="p-2 text-center text-[10px] font-mono text-slate-400 font-bold">
                                     {display2Theta > 0 ? display2Theta.toFixed(2) : '-'}
                                   </td>
                                   <td className="p-2 text-center text-[10px] font-mono text-rose-400 font-bold">
                                     {displayFWHM > 0 ? displayFWHM.toFixed(3) : '-'}
                                   </td>`;

code = code.replace(targetTd, newTd);

fs.writeFileSync('components/RietveldModule.tsx', code);
