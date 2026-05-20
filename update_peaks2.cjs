const fs = require('fs');
let code = fs.readFileSync('components/RietveldModule.tsx', 'utf8');

const oldCalc = `{userParams.peaks.map((peak, pIdx) => {
                                let display2Theta = 0;
                                if (simPhase === 'Quartz') {
                                  const origPeak = QUARTZ_PEAKS[pIdx];
                                  if (origPeak) {
                                    const shift = (userParams.a - TARGET_PARAMS['Quartz'].a) * 2; 
                                    display2Theta = origPeak.t - shift;
                                  }
                                } else {
                                  if (peak.h !== 0 || peak.k !== 0 || peak.l !== 0) {
                                    const d = userParams.a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
                                    const sinTheta = 1.5406 / (2 * d);
                                    if (sinTheta <= 1 && sinTheta > 0) {
                                      display2Theta = 2 * Math.asin(sinTheta) * (180 / Math.PI);
                                    }
                                  }
                                }`;

const newCalc = `{userParams.peaks.map((peak, pIdx) => {
                                let display2Theta = 0;
                                let rawTheta = 0;
                                if (simPhase === 'Quartz') {
                                  const origPeak = QUARTZ_PEAKS[pIdx];
                                  if (origPeak) {
                                    const shift = (userParams.a - TARGET_PARAMS['Quartz'].a) * 2; 
                                    display2Theta = origPeak.t - shift;
                                    rawTheta = display2Theta / 2;
                                  }
                                } else {
                                  if (peak.h !== 0 || peak.k !== 0 || peak.l !== 0) {
                                    const d = userParams.a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
                                    const sinTheta = 1.5406 / (2 * d);
                                    if (sinTheta <= 1 && sinTheta > 0) {
                                      rawTheta = Math.asin(sinTheta) * (180 / Math.PI);
                                      display2Theta = 2 * rawTheta;
                                    }
                                  }
                                }
                                
                                if (display2Theta > 0) {
                                  const thetaRad = rawTheta * (Math.PI / 180);
                                  const displacementShift = -userParams.sampleDisplacement * Math.cos(thetaRad);
                                  display2Theta += userParams.zeroShift + displacementShift;
                                }`;

code = code.replace(oldCalc, newCalc);

fs.writeFileSync('components/RietveldModule.tsx', code);
