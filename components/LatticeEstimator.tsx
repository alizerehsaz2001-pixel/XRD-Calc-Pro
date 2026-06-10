import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  HelpCircle, 
  Cpu, 
  Layers, 
  CheckCircle, 
  Activity, 
  Zap, 
  Boxes,
  Database,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';

interface LatticeEstimatorProps {
  results: BraggResult[];
}

type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic';

interface FitReflection {
  twoTheta: number;
  dObs: number;
  dHkl: [number, number, number];
  hklString: string;
  dCalc: number;
  twoThetaCalc: number;
  errorPct: number;
}

// Robust helper to parse individual HKL strings like "111", "(1 1 1)", "2, 0, 0", "-1 1 0"
const parseSingleHKL = (hklStr: string): [number, number, number] | null => {
  if (!hklStr) return null;
  const clean = hklStr.replace(/[()]/g, '').trim();
  
  // Try spaces or commas
  const parts = clean.split(/[\s,]+/).filter(x => x !== '');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const k = parseInt(parts[1], 10);
    const l = parseInt(parts[2], 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      return [h, k, l];
    }
  }
  
  // Try contiguous digits like "111" or "311"
  const matches = clean.match(/^([+-]?\d)([+-]?\d)([+-]?\d)$/);
  if (matches) {
    const h = parseInt(matches[1], 10);
    const k = parseInt(matches[2], 10);
    const l = parseInt(matches[3], 10);
    return [h, k, l];
  }
  
  return null;
};

export const LatticeEstimator: React.FC<LatticeEstimatorProps> = ({ results }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();
  
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [selectedReflectionIndex, setSelectedReflectionIndex] = useState<number>(0);
  
  // Extract reflections with valid, non-zero parsed HKL values
  const validReflections = useMemo(() => {
    return results
      .map(r => {
        const hkl = r.hkl ? parseSingleHKL(r.hkl) : null;
        return {
          original: r,
          hkl,
        };
      })
      .filter((item): item is { original: BraggResult; hkl: [number, number, number] } => {
        if (!item.hkl) return false;
        const [h, k, l] = item.hkl;
        return h !== 0 || k !== 0 || l !== 0;
      });
  }, [results]);

  // Keep selected index in bound
  useEffect(() => {
    if (selectedReflectionIndex >= validReflections.length) {
      setSelectedReflectionIndex(Math.max(0, validReflections.length - 1));
    }
  }, [validReflections, selectedReflectionIndex]);

  // Least Squares Solvers for Cell Refinement
  const fitResults = useMemo(() => {
    if (validReflections.length === 0) return null;

    // We fit depending on selected crystal system
    let a = 0;
    let b = 0;
    let c = 0;
    let errorMsg = '';
    let hasDiverged = false;

    try {
      if (crystalSystem === 'Cubic') {
        // 1/d^2 = (h^2 + k^2 + l^2) / a^2
        // Find best 'a' to minimize absolute residuals or matching average sum
        // a_i = d_obs * sqrt(h^2 + k^2 + l^2)
        const aVals = validReflections.map(rf => {
          const [h, k, l] = rf.hkl;
          const mult = Math.sqrt(h * h + k * k + l * l);
          return rf.original.dSpacing * mult;
        });
        
        a = aVals.reduce((sum, v) => sum + v, 0) / aVals.length;
        b = a;
        c = a;
      }
      else if (crystalSystem === 'Tetragonal') {
        // 1/d^2 = (h^2 + k^2)/a^2 + l^2/c^2
        // Let x1 = h^2 + k^2, x2 = l^2, y = 1/d^2. Solve for u=1/a^2, w=1/c^2 using linear least squares
        if (validReflections.length < 2) {
          errorMsg = 'At least 2 distinct reflections with varied hkl structures are required to fit Tetragonal parameters.';
          hasDiverged = true;
        } else {
          let sumX1_2 = 0, sumX2_2 = 0, sumX1X2 = 0;
          let sumX1Y = 0, sumX2Y = 0;
          
          validReflections.forEach(rf => {
            const [h, k, l] = rf.hkl;
            const x1 = h * h + k * k;
            const x2 = l * l;
            const y = 1 / (rf.original.dSpacing * rf.original.dSpacing);
            
            sumX1_2 += x1 * x1;
            sumX2_2 += x2 * x2;
            sumX1X2 += x1 * x2;
            sumX1Y += x1 * y;
            sumX2Y += x2 * y;
          });
          
          const det = sumX1_2 * sumX2_2 - sumX1X2 * sumX1X2;
          if (Math.abs(det) < 1e-7) {
            errorMsg = 'System is singular or collinear. Ensure reflections have varying l and h/k coordinates.';
            hasDiverged = true;
          } else {
            const u = (sumX2_2 * sumX1Y - sumX1X2 * sumX2Y) / det;
            const w = (sumX1_2 * sumX2Y - sumX1X2 * sumX1Y) / det;
            
            if (u <= 0 || w <= 0) {
              errorMsg = 'Refinement generated unphysical results (imaginary constants). Verify peak assignments.';
              hasDiverged = true;
            } else {
              a = 1 / Math.sqrt(u);
              b = a;
              c = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Hexagonal') {
        // 1/d^2 = 4/3 * (h^2 + hk + k^2)/a^2 + l^2/c^2
        if (validReflections.length < 2) {
          errorMsg = 'At least 2 reflections with distinct hk/l coordinates needed for Hexagonal fit.';
          hasDiverged = true;
        } else {
          let sumX1_2 = 0, sumX2_2 = 0, sumX1X2 = 0;
          let sumX1Y = 0, sumX2Y = 0;
          
          validReflections.forEach(rf => {
            const [h, k, l] = rf.hkl;
            const x1 = (4 / 3) * (h * h + h * k + k * k);
            const x2 = l * l;
            const y = 1 / (rf.original.dSpacing * rf.original.dSpacing);
            
            sumX1_2 += x1 * x1;
            sumX2_2 += x2 * x2;
            sumX1X2 += x1 * x2;
            sumX1Y += x1 * y;
            sumX2Y += x2 * y;
          });
          
          const det = sumX1_2 * sumX2_2 - sumX1X2 * sumX1X2;
          if (Math.abs(det) < 1e-7) {
            errorMsg = 'Collinear matrix. Vary peak Miller inputs across prismatic and basal planes.';
            hasDiverged = true;
          } else {
            const u = (sumX2_2 * sumX1Y - sumX1X2 * sumX2Y) / det;
            const w = (sumX1_2 * sumX2Y - sumX1X2 * sumX1Y) / det;
            
            if (u <= 0 || w <= 0) {
              errorMsg = 'Fitting converged to non-positive parameters. Double-check wavelength or Miller values.';
              hasDiverged = true;
            } else {
              a = 1 / Math.sqrt(u);
              b = a;
              c = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Orthorhombic') {
        // 1/d^2 = h^2/a^2 + k^2/b^2 + l^2/c^2
        // We have 3 unknowns: u = 1/a^2, v = 1/b^2, w = 1/c^2. Solve A β = B with Cramer's Rule
        if (validReflections.length < 3) {
          errorMsg = 'At least 3 distinct reflections (independent axes) are required to solve Orthorhombic cell.';
          hasDiverged = true;
        } else {
          let a00 = 0, a01 = 0, a02 = 0;
          let a10 = 0, a11 = 0, a12 = 0;
          let a20 = 0, a21 = 0, a22 = 0;
          let b0 = 0, b1 = 0, b2 = 0;
          
          validReflections.forEach(rf => {
            const [h, k, l] = rf.hkl;
            const h2 = h * h, k2 = k * k, l2 = l * l;
            const y = 1 / (rf.original.dSpacing * rf.original.dSpacing);
            
            a00 += h2 * h2;
            a01 += h2 * k2;
            a02 += h2 * l2;
            
            a11 += k2 * k2;
            a12 += k2 * l2;
            
            a22 += l2 * l2;
            
            b0 += h2 * y;
            b1 += k2 * y;
            b2 += l2 * y;
          });
          
          a10 = a01;
          a20 = a02;
          a21 = a12;
          
          // Determinant of A
          const dFull = a00 * (a11 * a22 - a12 * a21) - 
                        a01 * (a10 * a22 - a12 * a20) + 
                        a02 * (a10 * a21 - a11 * a20);
                        
          if (Math.abs(dFull) < 1e-6) {
            errorMsg = 'Indeterminate crystal vectors. Please supply non-collinear structures (e.g. 100, 010, 001).';
            hasDiverged = true;
          } else {
            const dU = b0 * (a11 * a22 - a12 * a21) - 
                       a01 * (b1 * a22 - a12 * b2) + 
                       a02 * (b1 * a21 - a11 * b2);
                       
            const dV = a00 * (b1 * a22 - a12 * b2) - 
                       b0 * (a10 * a22 - a12 * a20) + 
                       a02 * (a10 * b2 - b1 * a20);
                       
            const dW = a00 * (a11 * b2 - b1 * a21) - 
                       a01 * (a10 * b2 - b1 * a20) + 
                       b0 * (a10 * a21 - a11 * a20);
                       
            const u = dU / dFull;
            const v = dV / dFull;
            const w = dW / dFull;
            
            if (u <= 0 || v <= 0 || w <= 0) {
              errorMsg = 'Matrix converged to negative solutions. Ensure distinct axes planes indexes are mapped properly.';
              hasDiverged = true;
            } else {
              a = 1 / Math.sqrt(u);
              b = 1 / Math.sqrt(v);
              c = 1 / Math.sqrt(w);
            }
          }
        }
      }
    } catch (e: any) {
      errorMsg = 'Calculation error: ' + e.message;
      hasDiverged = true;
    }

    if (hasDiverged) {
      return { hasDiverged: true, errorMsg, reflections: [] };
    }

    // Now calculate d_calculated, 2theta_calculated, and error for each reflection
    const fittedReflections: FitReflection[] = validReflections.map(rf => {
      const [h, k, l] = rf.hkl;
      let dCalc = 0;
      
      if (crystalSystem === 'Cubic') {
        dCalc = a / Math.sqrt(h * h + k * k + l * l);
      } else if (crystalSystem === 'Tetragonal') {
        const term = (h * h + k * k) / (a * a) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
      } else if (crystalSystem === 'Hexagonal') {
        const term = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
      } else if (crystalSystem === 'Orthorhombic') {
        const term = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
      }

      // Reconstruct wavelength to map back to 2theta
      // d = lambda / (2 * sin(theta)) => sin(theta) = lambda / (2 * d)
      // theta = arcsin(lambda / (2 * d))
      // 2theta = 2 * arcsin(lambda / (2*d))
      // Find peak original wavelength
      const wl = rf.original.sinThetaOverLambda 
        ? Math.sin((rf.original.twoTheta / 2) * (Math.PI / 180)) / rf.original.sinThetaOverLambda 
        : 1.5406;
      
      const ratio = wl / (2 * dCalc);
      const twoThetaCalc = ratio < 1 
        ? (2 * Math.asin(ratio)) * (180 / Math.PI) 
        : 180.0;
        
      const errorPct = Math.abs(rf.original.dSpacing - dCalc) / rf.original.dSpacing * 100;

      return {
        twoTheta: rf.original.twoTheta,
        dObs: rf.original.dSpacing,
        dHkl: rf.hkl,
        hklString: rf.original.hkl || '',
        dCalc,
        twoThetaCalc,
        errorPct
      };
    });

    const averageError = fittedReflections.reduce((sum, r) => sum + r.errorPct, 0) / fittedReflections.length;
    
    // Calculates volume of the unit cell
    let volume = 0;
    if (crystalSystem === 'Cubic') volume = a * a * a;
    else if (crystalSystem === 'Tetragonal') volume = a * a * c;
    else if (crystalSystem === 'Hexagonal') volume = (Math.sqrt(3) / 2) * a * a * c; // Hexagonal prism volume
    else if (crystalSystem === 'Orthorhombic') volume = a * b * c;

    return {
      hasDiverged: false,
      a,
      b,
      c,
      volume,
      averageError,
      reflections: fittedReflections
    };

  }, [validReflections, crystalSystem]);

  // Unit cell SVG wireframe coordinates projection
  const svgWidth = 240;
  const svgHeight = 240;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2 + 10;

  // Compute live relative scales for a,b,c based on parameters
  const relativeScales = useMemo(() => {
    if (!fitResults || fitResults.hasDiverged) {
      return { sa: 80, sb: 80, sc: 80 };
    }
    const maxVal = Math.max(fitResults.a, fitResults.b, fitResults.c);
    const scalingFactor = 75 / maxVal; // Maximum size is 75px
    return {
      sa: fitResults.a * scalingFactor,
      sb: fitResults.b * scalingFactor,
      sc: fitResults.c * scalingFactor
    };
  }, [fitResults]);

  // standard project function
  const projectPoint = (x3d: number, y3d: number, z3d: number) => {
    const angle = Math.PI / 6; // 30 deg isometry
    const screenX = centerX + (x3d - y3d) * Math.cos(angle);
    const screenY = centerY + (x3d + y3d) * Math.sin(angle) - z3d;
    return { x: screenX, y: screenY };
  };

  // Generate paths and shapes for SVG wireframe
  const wireframePaths = useMemo(() => {
    const { sa, sb, sc } = relativeScales;
    
    // Vertices of the 3D unit cell
    const v0 = projectPoint(0, 0, 0);       // Origin
    const v1 = projectPoint(sa, 0, 0);      // Bottom X axis
    const v2 = projectPoint(0, sb, 0);      // Bottom Y axis
    const v3 = projectPoint(sa, sb, 0);     // Bottom XY face
    const v4 = projectPoint(0, 0, sc);       // Top Z axis
    const v5 = projectPoint(sa, 0, sc);      // Top XZ face
    const v6 = projectPoint(0, sb, sc);      // Top YZ face
    const v7 = projectPoint(sa, sb, sc);     // Top XYZ face

    return { v0, v1, v2, v3, v4, v5, v6, v7 };
  }, [relativeScales]);

  // Selected hkl plane for visual overlay shading inside the cell
  const planeShapePath = useMemo(() => {
    if (!fitResults || fitResults.hasDiverged || fitResults.reflections.length === 0) {
      return '';
    }
    
    const activeRef = fitResults.reflections[selectedReflectionIndex];
    if (!activeRef) return '';
    
    const [hRaw, kRaw, lRaw] = activeRef.dHkl;
    const h = Math.max(0.1, Math.abs(hRaw)); // Prevent division by zero
    const k = Math.max(0.1, Math.abs(kRaw));
    const l = Math.max(0.1, Math.abs(lRaw));
    
    const { sa, sb, sc } = relativeScales;

    // Check cases for intercepts
    const hasH = Math.abs(hRaw) > 0;
    const hasK = Math.abs(kRaw) > 0;
    const hasL = Math.abs(lRaw) > 0;

    let points = [];

    if (hasH && hasK && hasL) {
      // Standard plane intersecting all three axes
      // Intercepts are 1/h, 1/k, 1/l
      const p1 = projectPoint(sa / h, 0, 0);
      const p2 = projectPoint(0, sb / k, 0);
      const p3 = projectPoint(0, 0, sc / l);
      points = [p1, p2, p3];
    } else if (hasH && hasK && !hasL) {
      // Parallel to z axis (l=0)
      const p1 = projectPoint(sa / h, 0, 0);
      const p2 = projectPoint(0, sb / k, 0);
      const p3 = projectPoint(0, sb / k, sc);
      const p4 = projectPoint(sa / h, 0, sc);
      points = [p1, p2, p3, p4];
    } else if (hasH && !hasK && hasL) {
      // Parallel to y axis (k=0)
      const p1 = projectPoint(sa / h, 0, 0);
      const p2 = projectPoint(0, sb, 0); // extend through face
      const p3 = projectPoint(0, 0, sc / l);
      
      // Better: standard crystal geometry intercepts at a/h and c/l and parallel to y (extending to b)
      const inter1 = projectPoint(sa / h, 0, 0);
      const inter2 = projectPoint(0, 0, sc / l);
      const inter3 = projectPoint(0, sb, sc / l);
      const inter4 = projectPoint(sa / h, sb, 0);
      points = [inter1, inter2, inter3, inter4];
    } else if (!hasH && hasK && hasL) {
      // Parallel to x axis (h=0)
      const inter1 = projectPoint(0, sb / k, 0);
      const inter2 = projectPoint(0, 0, sc / l);
      const inter3 = projectPoint(sa, 0, sc / l);
      const inter4 = projectPoint(sa, sb / k, 0);
      points = [inter1, inter2, inter3, inter4];
    } else if (hasH && !hasK && !hasL) {
      // Parallel to BC plane at x = 1/h (like (100))
      const p1 = projectPoint(sa / h, 0, 0);
      const p2 = projectPoint(sa / h, sb, 0);
      const p3 = projectPoint(sa / h, sb, sc);
      const p4 = projectPoint(sa / h, 0, sc);
      points = [p1, p2, p3, p4];
    } else if (!hasH && hasK && !hasL) {
      // Parallel to AC plane at y = 1/k (like (010))
      const p1 = projectPoint(0, sb / k, 0);
      const p2 = projectPoint(sa, sb / k, 0);
      const p3 = projectPoint(sa, sb / k, sc);
      const p4 = projectPoint(0, sb / k, sc);
      points = [p1, p2, p3, p4];
    } else if (!hasH && !hasK && hasL) {
      // Parallel to AB plane at z = 1/l (like (001))
      const p1 = projectPoint(0, 0, sc / l);
      const p2 = projectPoint(sa, 0, sc / l);
      const p3 = projectPoint(sa, sb, sc / l);
      const p4 = projectPoint(0, sb, sc / l);
      points = [p1, p2, p3, p4];
    }

    if (points.length < 3) return '';
    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
  }, [fitResults, selectedReflectionIndex, relativeScales]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight uppercase">
            <Boxes className="h-5 w-5 text-indigo-500 shrink-0" />
            Cell Refinement & Lattice Solver
          </h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Lattice Parameters Fit using Miller Indexes
          </p>
        </div>

        {/* Crystal System Tabs Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
          {(['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic'] as CrystalSystem[]).map(sys => (
            <button
              key={sys}
              onClick={() => setCrystalSystem(sys)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all border-none ${
                crystalSystem === sys
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
              }`}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {validReflections.length === 0 ? (
        <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <Info className="h-8 w-8 text-slate-400 mb-2.5 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Miller Indices Required</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-md leading-relaxed">
            Please assign Miller Indices (e.g., 111, 200, 220) to your 2θ peaks in the input panel to activate live least-squares lattice cell refinements.
          </p>
        </div>
      ) : fitResults && fitResults.hasDiverged ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/15 text-rose-800 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
          <HelpCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Refinement Incompatible</h4>
            <p className="text-xs mt-1 leading-normal opacity-90">{fitResults.errorMsg}</p>
          </div>
        </div>
      ) : fitResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Fit Constants Cards Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Lattice param a */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant a</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {fitResults.a.toFixed(Math.min(precision + 1, 5))}
                  </span>
                  <span className="text-[10px] font-black text-slate-400">Å</span>
                </div>
              </div>

              {/* Lattice param b */}
              <div className={`bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center transition-all ${
                crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'opacity-40 select-none' : ''
              }`}>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant b</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {fitResults.b.toFixed(Math.min(precision + 1, 5))}
                  </span>
                  <span className="text-[10px] font-black text-slate-400">Å</span>
                </div>
              </div>

              {/* Lattice param c */}
              <div className={`bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center transition-all ${
                crystalSystem === 'Cubic' ? 'opacity-40 select-none' : ''
              }`}>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant c</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {fitResults.c.toFixed(Math.min(precision + 1, 5))}
                  </span>
                  <span className="text-[10px] font-black text-slate-400">Å</span>
                </div>
              </div>

              {/* Cell Volume */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Cell Volume</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {fitResults.volume.toFixed(Math.min(precision, 4))}
                  </span>
                  <span className="text-[10px] font-black text-indigo-400">Å³</span>
                </div>
              </div>

              {/* Fit R-factor Quality */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center col-span-2 sm:col-span-1">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Diffraction Residual (GoF)</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-full ${
                    fitResults.averageError < 0.2
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : fitResults.averageError < 1.0
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    {fitResults.averageError.toFixed(4)}%
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                    {fitResults.averageError < 0.2 ? 'Excellent' : fitResults.averageError < 1.0 ? 'Acceptable' : 'Unfit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reflections Fit table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900 max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-150 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">HKL</th>
                    <th className="px-4 py-2.5">2θ (Obs)</th>
                    <th className="px-4 py-2.5">2θ (Calc)</th>
                    <th className="px-4 py-2.5">d (Obs)</th>
                    <th className="px-4 py-2.5">d (Calc)</th>
                    <th className="px-4 py-2.5 text-right">Residual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {fitResults.reflections.map((ref, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedReflectionIndex(idx)}
                      className={`cursor-pointer transition-all ${
                        selectedReflectionIndex === idx
                          ? 'bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                      }`}
                    >
                      <td className="px-4 py-2 font-bold font-sans text-indigo-600 dark:text-indigo-400">
                        ({ref.hklString})
                      </td>
                      <td className="px-4 py-2 font-bold tabular-nums text-slate-900 dark:text-slate-100">{ref.twoTheta.toFixed(3)}°</td>
                      <td className="px-4 py-2 tabular-nums text-slate-400">{ref.twoThetaCalc.toFixed(2)}°</td>
                      <td className="px-4 py-2 font-black tabular-nums text-indigo-700 dark:text-indigo-300">{ref.dObs.toFixed(4)}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-400">{ref.dCalc.toFixed(4)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          ref.errorPct < 0.2
                            ? 'text-emerald-600 bg-emerald-500/5 dark:text-emerald-400'
                            : ref.errorPct < 1.0
                              ? 'text-amber-600 bg-amber-500/5 dark:text-amber-400'
                              : 'text-rose-600 bg-rose-500/5 dark:text-rose-400'
                        }`}>
                          {ref.errorPct.toFixed(3)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 transition-colors flex items-center gap-1.5 leading-normal">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              Click on rows to dynamically shade the matching plane index inside the isometric unit cell preview.
            </p>
          </div>

          {/* Isometric SVG Column */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 self-start">
              Isometric Unit Cell Preview
            </h4>
            
            <div className="w-full relative aspect-square bg-[#05070a] border border-slate-205 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg flex items-center justify-center">
              {/* background grids decoration */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
              
              <svg 
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                preserveAspectRatio="xMidYMid meet"
                className="relative z-10"
              >
                <defs>
                  <radialGradient id="atomSph" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#475569" />
                  </radialGradient>
                  <radialGradient id="hklAtomSph" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#3730a3" />
                  </radialGradient>
                </defs>

                {/* Back edges (dashed for depth) */}
                <line x1={wireframePaths.v0.x} y1={wireframePaths.v0.y} x2={wireframePaths.v1.x} y2={wireframePaths.v1.y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={wireframePaths.v0.x} y1={wireframePaths.v0.y} x2={wireframePaths.v2.x} y2={wireframePaths.v2.y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={wireframePaths.v0.x} y1={wireframePaths.v0.y} x2={wireframePaths.v4.x} y2={wireframePaths.v4.y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="1" />

                {/* Live Shaded HKL Plane */}
                {planeShapePath && (
                  <path 
                    d={planeShapePath} 
                    fill="url(#hklAtomSph)" 
                    fillOpacity="0.25" 
                    stroke="#818cf8" 
                    strokeWidth="1.5" 
                    strokeLinejoin="round"
                    className="animate-pulse"
                  />
                )}

                {/* Main front edges */}
                <line x1={wireframePaths.v6.x} y1={wireframePaths.v6.y} x2={wireframePaths.v7.x} y2={wireframePaths.v7.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v5.x} y1={wireframePaths.v5.y} x2={wireframePaths.v7.x} y2={wireframePaths.v7.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v4.x} y1={wireframePaths.v4.y} x2={wireframePaths.v5.x} y2={wireframePaths.v5.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v4.x} y1={wireframePaths.v4.y} x2={wireframePaths.v6.x} y2={wireframePaths.v6.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                
                <line x1={wireframePaths.v3.x} y1={wireframePaths.v3.y} x2={wireframePaths.v7.x} y2={wireframePaths.v7.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v2.x} y1={wireframePaths.v2.y} x2={wireframePaths.v3.x} y2={wireframePaths.v3.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v2.x} y1={wireframePaths.v2.y} x2={wireframePaths.v6.x} y2={wireframePaths.v6.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v1.x} y1={wireframePaths.v1.y} x2={wireframePaths.v3.x} y2={wireframePaths.v3.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1={wireframePaths.v1.x} y1={wireframePaths.v1.y} x2={wireframePaths.v5.x} y2={wireframePaths.v5.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                {/* Atoms at Vertices */}
                {Object.entries(wireframePaths).map(([key, point]) => (
                  <circle 
                    key={key} 
                    cx={point.x} 
                    cy={point.y} 
                    r="4" 
                    fill="url(#atomSph)" 
                    stroke="rgba(0,0,0,0.5)" 
                    strokeWidth="0.5" 
                  />
                ))}

                {/* Current interactive reflection indicator label overlay */}
                {fitResults.reflections[selectedReflectionIndex] && (
                  <g transform={`translate(${centerX - 40}, ${svgHeight - 15})`}>
                    <rect width="80" height="15" rx="4" fill="rgba(99,102,241,0.2)" stroke="rgba(129,140,248,0.4)" strokeWidth="0.5" />
                    <text x="40" y="11" fill="#818cf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Plane: ({fitResults.reflections[selectedReflectionIndex].hklString})
                    </text>
                  </g>
                )}
              </svg>
              
              {/* Corner badge to display active unit cell symmetry status */}
              <span className="absolute top-3.5 right-3.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-bold font-mono tracking-widest uppercase text-indigo-400 rounded-full select-none z-20">
                {crystalSystem} Bravais lattice
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
