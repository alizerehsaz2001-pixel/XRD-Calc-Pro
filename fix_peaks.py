import re

with open('components/RietveldModule.tsx', 'r') as f:
    content = f.read()

# 1. Update the table headers
header_target = r"<th className=\"p-3 text-\[9px\] uppercase text-indigo-400/80 font-black tracking-widest\">HKL Index</th>.*?<th className=\"p-3 text-\[9px\] uppercase text-indigo-400/80 font-black tracking-widest text-right\">Delete</th>"

header_replacement = """<th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest">HKL Index</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center" title="Interplanar Spacing">d-spacing (Å)</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center" title="Bragg Angle">Pos 2θ(°)</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center" title="Lorentz-Polarization & Multiplicity">LP / j</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center">FWHM(°)</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center">Intensity</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-right">Delete</th>"""

if re.search(header_target, content, re.DOTALL):
    content = re.sub(header_target, header_replacement, content, flags=re.DOTALL)
    print("Matched headers!")
else:
    print("Could not match headers!")

# 2. Update the row calculation and rendering
row_calc_target = r"                                if \(display2Theta > 0\) \{\s+const thetaRad = rawTheta \* \(Math\.PI / 180\);\s+const displacementShift = -userParams\.sampleDisplacement \* Math\.cos\(thetaRad\);\s+display2Theta \+= userParams\.zeroShift \+ displacementShift;\s+\}\s+let displayFWHM = 0;\s+if \(display2Theta > 0\) \{\s+const thetaRad = \(display2Theta/2\) \* \(Math\.PI / 180\);\s+const bSizeRad = \(0\.9 \* 1\.5406\) / \(\(userParams\.crystalliteSize \* 10\) \* Math\.cos\(thetaRad\)\);\s+const bSizeDeg = bSizeRad \* \(180 / Math\.PI\);\s+const bStrainRad = 4 \* userParams\.microstrain \* Math\.tan\(thetaRad\);\s+const bStrainDeg = bStrainRad \* \(180 / Math\.PI\);\s+displayFWHM = userParams\.fwhm \+ bSizeDeg \+ bStrainDeg;\s+\}"

row_calc_replacement = """                                let dSpacing = 0;
                                let lpFactor = 0;
                                let mult = 0;

                                if (display2Theta > 0) {
                                  const thetaRad = rawTheta * (Math.PI / 180);
                                  const displacementShift = -userParams.sampleDisplacement * Math.cos(thetaRad);
                                  display2Theta += userParams.zeroShift + displacementShift;
                                  
                                  // d-spacing
                                  dSpacing = 1.5406 / (2 * Math.sin(thetaRad));
                                  
                                  // Lorentz-Polarization (LP) factor
                                  lpFactor = (1 + Math.pow(Math.cos(2*thetaRad), 2)) / (Math.pow(Math.sin(thetaRad), 2) * Math.cos(thetaRad));
                                  
                                  // Multiplicity approximation
                                  const {h, k, l} = peak;
                                  if (h===k && k===l) mult = 8;
                                  else if (h===k || k===l || h===l) mult = 24;
                                  else mult = 48;
                                  if (h===0 || k===0 || l===0) mult /= 2;
                                }

                                let displayFWHM = 0;
                                if (display2Theta > 0) {
                                   const thetaRad = (display2Theta/2) * (Math.PI / 180);
                                   const bSizeRad = (0.9 * 1.5406) / ((userParams.crystalliteSize * 10) * Math.cos(thetaRad));
                                   const bSizeDeg = bSizeRad * (180 / Math.PI);
                                   const bStrainRad = 4 * userParams.microstrain * Math.tan(thetaRad);
                                   const bStrainDeg = bStrainRad * (180 / Math.PI);
                                   displayFWHM = userParams.fwhm + bSizeDeg + bStrainDeg;
                                }"""

if re.search(row_calc_target, content, re.DOTALL):
    content = re.sub(row_calc_target, row_calc_replacement, content, flags=re.DOTALL)
    print("Matched row calc!")
else:
    print("Could not match row calc!")

# 3. Add the new columns to the table row
row_td_target = r"                                 <td className=\"p-3 text-center text-xs font-mono font-bold text-teal-200 tracking-tight\">\s+\{display2Theta > 0 \? display2Theta\.toFixed\(2\) : <span className=\"text-slate-600\">-</span>\}\s+</td>\s+<td className=\"p-3 text-center text-xs font-mono font-bold text-amber-200/90 tracking-tight\">\s+\{displayFWHM > 0 \? displayFWHM\.toFixed\(3\) : <span className=\"text-slate-600\">-</span>\}\s+</td>"

row_td_replacement = """                                 <td className="p-3 text-center text-[11px] font-mono font-bold text-blue-300 tracking-tight">
                                    {dSpacing > 0 ? dSpacing.toFixed(4) : <span className="text-slate-600">-</span>}
                                 </td>
                                 <td className="p-3 text-center text-xs font-mono font-bold text-teal-200 tracking-tight">
                                    {display2Theta > 0 ? display2Theta.toFixed(2) : <span className="text-slate-600">-</span>}
                                 </td>
                                 <td className="p-3 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <span className="text-[10px] font-mono font-bold text-purple-300">{lpFactor > 0 ? lpFactor.toFixed(1) : '-'}</span>
                                      <span className="text-[8px] font-mono text-slate-400">j={mult || '-'}</span>
                                    </div>
                                 </td>
                                 <td className="p-3 text-center text-xs font-mono font-bold text-amber-200/90 tracking-tight">
                                    {displayFWHM > 0 ? displayFWHM.toFixed(3) : <span className="text-slate-600">-</span>}
                                 </td>"""

if re.search(row_td_target, content, re.DOTALL):
    content = re.sub(row_td_target, row_td_replacement, content, flags=re.DOTALL)
    print("Matched row td!")
else:
    print("Could not match row td!")

with open('components/RietveldModule.tsx', 'w') as f:
    f.write(content)

