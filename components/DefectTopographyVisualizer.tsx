import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Rotate3d, Info, Activity, Sliders, RefreshCw, Zap } from 'lucide-react';

interface DefectTopographyVisualizerProps {
  rmsStrain: number;
  burgersVectorNm: number;
  youngsModulusGpa: number;
  selectedLNm: number;
}

export const DefectTopographyVisualizer: React.FC<DefectTopographyVisualizerProps> = ({
  rmsStrain,
  burgersVectorNm,
  youngsModulusGpa,
  selectedLNm
}) => {
  // Interaction and perspective states
  const [angleX, setAngleX] = useState(-18);
  const [angleY, setAngleY] = useState(24);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [defectType, setDefectType] = useState<'edge' | 'screw'>('edge');
  const [strainMultiplier, setStrainMultiplier] = useState<number>(2.5);
  const [slipSlide, setSlipSlide] = useState<number>(0); // dynamic shear slip offset
  const [isShearing, setIsShearing] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ax: 0, ay: 0 });

  // Handle continuous rotation
  useEffect(() => {
    let lastTime = performance.now();
    const tick = (time: number) => {
      if (autoRotate && !isDragging) {
        const delta = (time - lastTime) / 1000;
        setAngleY(prev => (prev + delta * 8) % 360); // Slow cosmic spin
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [autoRotate, isDragging]);

  // Handle automatic slip/shear animation cycle
  useEffect(() => {
    if (!isShearing) return;
    let startVal = slipSlide;
    let startTime = performance.now();
    const duration = 2000; // 2 seconds

    const runShear = (now: number) => {
      const elapsed = now - startTime;
      const progress = elapsed / duration;
      if (progress < 1) {
        // Sine wave oscillation for sliding
        setSlipSlide(startVal + Math.sin(progress * Math.PI * 2) * 0.35);
        animFrameRef.current = requestAnimationFrame(runShear);
      } else {
        setSlipSlide(0);
        setIsShearing(false);
      }
    };
    animFrameRef.current = requestAnimationFrame(runShear);
  }, [isShearing]);

  // Touch & Mouse rotation handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setAutoRotate(false);
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ax: angleX,
      ay: angleY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const nextAngleX = Math.max(-80, Math.min(80, dragStart.current.ax + dy * 0.5));
    const nextAngleY = (dragStart.current.ay - dx * 0.5 + 360) % 360;
    setAngleX(nextAngleX);
    setAngleY(nextAngleY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setAutoRotate(false);
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ax: angleX,
        ay: angleY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    const nextAngleX = Math.max(-80, Math.min(80, dragStart.current.ax + dy * 0.5));
    const nextAngleY = (dragStart.current.ay - dx * 0.5 + 360) % 360;
    setAngleX(nextAngleX);
    setAngleY(nextAngleY);
  };

  // Safe RMS Strain checking
  const currentStrain = rmsStrain > 0 && Number.isFinite(rmsStrain) ? rmsStrain : 0.0012;
  const bVector = burgersVectorNm > 0 && Number.isFinite(burgersVectorNm) ? burgersVectorNm : 0.25;

  // Let's model a 3D grid block of silicon/metal lattice
  // Dimensions of grid: width (i), height (j), depth (k)
  const gridW = 9;  // i: -4 to 4
  const gridH = 9;  // j: -4 to 4
  const gridD = 3;  // k: -1 to 1

  const dSpacing = 16; // equilibrium lattice parameter in units

  // List of all generated atoms with applied elastic displacement field
  const atoms: {
    key: string;
    i: number;
    j: number;
    k: number;
    x0: number; // undistorted
    y0: number;
    z0: number;
    x: number;  // displaced
    y: number;
    z: number;
    localStrain: number; // custom local pressure/shear strain
  }[] = [];

  // Index maps to quickly find atoms for drawing bonds
  const atomMap: Record<string, number> = {};

  let atomCount = 0;
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      for (let k = -1; k <= 1; k++) {
        const x0 = i * dSpacing;
        const y0 = j * dSpacing;
        const z0 = k * dSpacing * 1.2;

        let dx = 0;
        let dy = 0;
        let dz = 0;
        let localStrain = 0;

        // Core coordinates relative to dislocation center
        const cx = x0;
        const cy = y0;
        const cz = z0;
        const r2 = cx * cx + cy * cy;
        const r = Math.sqrt(r2) + 0.1;

        // Displacement intensity scaling
        const amp = currentStrain * 1500 * strainMultiplier;

        if (defectType === 'edge') {
          // INSERT EXTRA HALF-PLANE at the top-center (x=0, y>0)
          // Mathematical edge dislocation core representation
          if (r2 > 1) {
            // Hydrostatic pressure strain field (Compression at top y>0, Tension at bottom y<0)
            localStrain = -(amp * 0.9 * cy) / (r2 / 12 + 10);

            // Polar Angle for branch cut displacement
            // branch cut is along positive y-axis (cy > 0)
            const thetaCut = Math.atan2(cx, Math.max(0.1, cy));
            
            // X-displacement: separates atoms on left/right to form extra plane gap
            dx = (amp * bVector * 1.8 * thetaCut) / Math.PI;

            // Y-displacement: compressive elasticity curve
            dy = -(amp * 1.2 * cx * cy) / (r2 + 100);

            // Add dynamic slip coordinate shear
            if (cy > 0) {
              dx += slipSlide * dSpacing * 0.8;
            } else {
              dx -= slipSlide * dSpacing * 0.8;
            }
          }
        } else {
          // SCREW DISLOCATION
          // Slip plane at y=0, dislocation line runs parallel to Z-axis
          // Out of plane displacement (z-direction) with shear strain field
          if (r2 > 1) {
            const theta = Math.atan2(cy, cx);
            dz = (amp * bVector * 2.2 * theta) / Math.PI;
            // Shear Strain amplitude
            localStrain = (amp * 0.8) / (r / 5 + 3);
            
            // Apply slight physical helical pitch to x and y coordinates
            dx = (amp * 0.15 * cy) / (r + 4);
            dy = -(amp * 0.15 * cx) / (r + 4);
          }
        }

        const displacedX = x0 + dx;
        const displacedY = y0 + dy;
        const displacedZ = z0 + dz;

        const key = `${i}_${j}_${k}`;
        atoms.push({
          key,
          i, j, k,
          x0, y0, z0,
          x: displacedX,
          y: displacedY,
          z: displacedZ,
          localStrain
        });

        atomMap[key] = atomCount;
        atomCount++;
      }
    }
  }

  // Define 3D rotation projection helper
  const rotate3D = (x: number, y: number, z: number) => {
    // Rotation around Y
    const rY = (angleY * Math.PI) / 180;
    const cosY = Math.cos(rY);
    const sinY = Math.sin(rY);
    let x1 = x * cosY + z * sinY;
    let z1 = -x * sinY + z * cosY;

    // Rotation around X
    const rX = (angleX * Math.PI) / 180;
    const cosX = Math.cos(rX);
    const sinX = Math.sin(rX);
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    return [x1, y2, z2];
  };

  // Project atoms into 2D SVG canvas area (width: 250, height: 210)
  const centerCanvasX = 125;
  const centerCanvasY = 105;
  const scale = 1.35;

  const projectedAtoms = atoms.map(atom => {
    const [rx, ry, rz] = rotate3D(atom.x, atom.y, atom.z);
    // Orthographic projection with slight perspective depth sorting factor
    const depthFactor = 200 / (200 + rz * 0.4);
    const px = centerCanvasX + rx * scale * depthFactor;
    const py = centerCanvasY + ry * scale * depthFactor;
    return {
      ...atom,
      rx, ry, rz,
      px, py
    };
  });

  // Collect lattice elastic bonds (chemical links) between immediate neighbors
  interface Bond {
    id: string;
    p1: { px: number; py: number; rz: number };
    p2: { px: number; py: number; rz: number };
    avgStrain: number;
    depth: number;
  }
  const bonds: Bond[] = [];

  // Iterate over lattice structure to construct neighbors
  projectedAtoms.forEach(atom => {
    const { i, j, k, px, py, rz, localStrain } = atom;

    // Connect to right neighbor (i + 1)
    if (i < 4) {
      const rightKey = `${i + 1}_${j}_${k}`;
      if (rightKey in atomMap) {
        const other = projectedAtoms[atomMap[rightKey]];
        bonds.push({
          id: `${atom.key}-R`,
          p1: { px, py, rz },
          p2: { px: other.px, py: other.py, rz: other.rz },
          avgStrain: (Math.abs(localStrain) + Math.abs(other.localStrain)) / 2,
          depth: (rz + other.rz) / 2
        });
      }
    }

    // Connect to bottom neighbor (j + 1)
    if (j < 4) {
      const bottomKey = `${i}_${j + 1}_${k}`;
      if (bottomKey in atomMap) {
        const other = projectedAtoms[atomMap[bottomKey]];
        bonds.push({
          id: `${atom.key}-B`,
          p1: { px, py, rz },
          p2: { px: other.px, py: other.py, rz: other.rz },
          avgStrain: (Math.abs(localStrain) + Math.abs(other.localStrain)) / 2,
          depth: (rz + other.rz) / 2
        });
      }
    }

    // Connect to forward depth layers (k + 1)
    if (k < 1) {
      const forwardKey = `${i}_${j}_${k + 1}`;
      if (forwardKey in atomMap) {
        const other = projectedAtoms[atomMap[forwardKey]];
        bonds.push({
          id: `${atom.key}-F`,
          p1: { px, py, rz },
          p2: { px: other.px, py: other.py, rz: other.rz },
          avgStrain: (Math.abs(localStrain) + Math.abs(other.localStrain)) / 2,
          depth: (rz + other.rz) / 2
        });
      }
    }
  });

  // Painter's algorithm: sort bonds and atoms by depth so they overlap correctly (back-to-front, higher rz means farther/back)
  const sortedBonds = [...bonds].sort((a, b) => b.depth - a.depth);
  const sortedAtoms = [...projectedAtoms].sort((a, b) => b.rz - a.rz);

  // Dynamic Peierls-Nabarro lattice obstacle shear energy estimation
  // W_PN \approx E * b / (1 - \nu) exp(-2 \pi d / b)
  const shearModulus = youngsModulusGpa * 0.38; // estimated bulk shear modulus
  const dSpacingNm = 0.28; // interplanar distance
  const exponentFactor = (2 * Math.PI * dSpacingNm) / bVector;
  const peierlsModulus = shearModulus * Math.exp(-exponentFactor) * 1.5;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* 3D Kinetic Simulation Viewer Block */}
      <div 
        className="w-full h-[250px] bg-slate-950/90 rounded-2xl border border-slate-900 shadow-inner relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        id="defect-topo-stage"
      >
        {/* Glowing Stress Core Field Aura as backdrop wrapper */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none drop-shadow-2xl">
          <div className="w-32 h-32 rounded-full bg-indigo-500/10 blur-[30px]" />
        </div>

        {/* Crystalline coordinate vectors overlay HUD */}
        <div className="absolute top-3.5 left-4 flex items-center gap-2 pointer-events-none z-10">
          <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[8px] font-mono tracking-widest text-[#a855f7]/70 font-black uppercase">Topography Grid</span>
            <span className="text-[10px] font-mono tracking-wide text-slate-300 uppercase">
              {defectType === 'edge' ? 'Edge Dislocation Core ⊥' : 'Screw Helical Slip ↻'}
            </span>
          </div>
        </div>

        <div className="absolute top-3.5 right-4 z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setDefectType(prev => prev === 'edge' ? 'screw' : 'edge');
            }}
            className="px-2 py-1 bg-black/60 hover:bg-slate-900 border border-white/10 hover:border-[#a855f7]/30 text-[8px] font-mono font-bold text-slate-300 rounded-lg flex items-center gap-1 transition-all uppercase tracking-wider"
          >
            <RefreshCw className="w-2.5 h-2.5 text-[#a855f7]" /> Swap Core
          </button>
        </div>

        {/* 3D Vector Crystalline Graph */}
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 250 210">
          {/* Stress contour lines */}
          <circle cx={centerCanvasX} cy={centerCanvasY} r="35" fill="none" stroke="rgba(168, 85, 247, 0.08)" strokeDasharray="3 3" />
          <circle cx={centerCanvasX} cy={centerCanvasY} r="65" fill="none" stroke="rgba(168, 85, 247, 0.04)" strokeDasharray="2 4" />

          {/* Reference Dislocation Slip Plane Indicator */}
          {defectType === 'edge' && (
            <g>
              <line 
                x1={centerCanvasX - 85} 
                y1={centerCanvasY} 
                x2={centerCanvasX + 85} 
                y2={centerCanvasY} 
                stroke="rgba(244, 63, 94, 0.25)" 
                strokeWidth="1.2" 
                strokeDasharray="4 2" 
              />
              <text 
                x={centerCanvasX + 45} 
                y={centerCanvasY - 5} 
                fill="rgba(244, 63, 94, 0.7)" 
                fontSize="6" 
                fontFamily="monospace"
                fontWeight="bold"
              >
                SLIP PLANE
              </text>
            </g>
          )}

          {/* Render Crystalline Bonds / Interatomic Forces */}
          {sortedBonds.map((bond) => {
            // High-strain bonds are red, compressive are orange, tensile are cyan, healthy are slate
            let strokeColor = 'rgba(71, 85, 105, 0.25)'; // base slate bond
            let strokeW = 0.55;

            if (bond.avgStrain > 0.04) {
              const strRatio = Math.min(1.0, bond.avgStrain * 6);
              strokeColor = `rgba(${Math.floor(139 + 116 * strRatio)}, ${Math.floor(92 - 40 * strRatio)}, ${Math.floor(246 - 150 * strRatio)}, 0.55)`;
              strokeW = 0.85 + strRatio * 0.6;
            }

            return (
              <line
                key={bond.id}
                x1={bond.p1.px}
                y1={bond.p1.py}
                x2={bond.p2.px}
                y2={bond.p2.py}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeLinecap="round"
              />
            );
          })}

          {/* Render Atoms */}
          {sortedAtoms.map((atom) => {
            // Color mapping based on localized microstrain
            // Tension: Cool neon blue (negative localstrain)
            // Compression: Warm neon red (positive localstrain)
            let fillColor = 'rgba(148, 163, 184, 0.85)'; // slate grey for regular bulk
            let sizeRadius = 1.8;

            if (atom.localStrain > 0.01) {
              // Compressive strain - shift towards bright crimson/orange
              const rRatio = Math.min(1.0, atom.localStrain * 5);
              fillColor = `rgba(${Math.floor(239)}, ${Math.floor(68 * (1 - rRatio) + 120 * rRatio)}, ${Math.floor(68 * (1 - rRatio))}, 0.95)`;
              sizeRadius = 2.4 + rRatio * 0.8;
            } else if (atom.localStrain < -0.01) {
              // Tensile strain - shift towards glowing electric cyan/blue
              const bRatio = Math.min(1.0, Math.abs(atom.localStrain) * 5);
              fillColor = `rgba(${Math.floor(6 * bRatio)}, ${Math.floor(182 * bRatio + 200 * (1 - bRatio))}, ${255}, 0.95)`;
              sizeRadius = 2.0 + bRatio * 0.6;
            }

            // Draw a neat atomic circle
            return (
              <circle
                key={atom.key}
                cx={atom.px}
                cy={atom.py}
                r={sizeRadius}
                fill={fillColor}
                opacity={0.9}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="0.4"
                style={{
                  filter: Math.abs(atom.localStrain) > 0.08 ? 'drop-shadow(0 0 3px rgba(239,68,68,0.5))' : 'none'
                }}
              />
            );
          })}

          {/* Dislocation core center decorator tag ⊥ */}
          {defectType === 'edge' && (
            <text
              x={centerCanvasX - 4}
              y={centerCanvasY - 5}
              fill="#fb7185"
              fontSize="12"
              fontWeight="black"
              fontFamily="sans-serif"
              style={{ filter: 'drop-shadow(0px 1px 6px rgba(251,113,133,0.8))' }}
            >
              ⊥
            </text>
          )}
        </svg>

        {/* Visualizer instruction label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-55 whitespace-nowrap bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/5 pointer-events-none">
          <Rotate3d className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[7.5px] font-mono uppercase tracking-[0.2em] text-slate-300 font-bold">Slide to inspect lattice angles</span>
        </div>
      </div>

      {/* Interactive Controls & Fine-Tuning widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
        {/* Dynamic Sliders */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">Topography Deformation</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Magnification Factor:</span>
              <span className="text-[#a855f7] font-bold">{strainMultiplier.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="1.0" 
              max="6.0" 
              step="0.5"
              value={strainMultiplier}
              onChange={(e) => setStrainMultiplier(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#a855f7] focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (!isShearing) {
                setIsShearing(true);
              }
            }}
            disabled={isShearing}
            className={`w-full py-2 border rounded-xl font-mono text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isShearing 
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 cursor-not-allowed'
                : 'bg-white/5 hover:bg-purple-500/10 border-white/10 hover:border-purple-500/30 text-white'
            }`}
          >
            <Activity className="w-3 h-3 animate-pulse" />
            {isShearing ? 'Shearing slip active...' : 'Apply Shear slip displacement'}
          </button>
        </div>

        {/* Live physical energy estimate details */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest">
            <span>Harmonic Constants</span>
            <span>Est. Peierls Barrier</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <span className="text-[10px] font-mono text-slate-400 leading-tight">
              Shear plane: <span className="text-slate-200 font-bold">({defectType === 'edge' ? '001' : '110'})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 leading-tight">
              Peierls barrier density: <span className="text-emerald-400 font-black">{peierlsModulus.toFixed(3)} MPa</span>
            </span>
          </div>

          <div className="flex gap-2 items-start text-[8px] text-slate-500 leading-relaxed font-sans mt-1">
            <Info className="w-3 h-3 text-[#a855f7] shrink-0 mt-0.5" />
            <span>
              Real-time distortion mimics atomic shearing of the chosen crystallite zone {selectedLNm.toFixed(0)} nm column node.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
