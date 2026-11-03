import React, { useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  CheckCircle2,
  XCircle,
  Target,
  Activity,
  Sparkles,
  Sliders
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { CrystalSystemId, CenteringType, CRYSTAL_SYSTEMS_CATALOG } from './UnitCellsSection';

interface StereographicWulffExplorerProps {
  selectedSystemId: CrystalSystemId;
  activeCentering: CenteringType;
  onSelectSystem: (id: CrystalSystemId) => void;
  setActiveCentering: (c: CenteringType) => void;
}

interface ReflectionRow {
  h: number;
  k: number;
  l: number;
  label: string;
  dSpacing: number;
  twoThetaCu: number;
  twoThetaMo: number;
  qVector: number;
  allowed: boolean;
  ruleReason: string;
  structureFactorNorm: number; // |F_hkl|^2 / Z^2 normalized (0 or 1)
  multiplicity: number;
}

const REFERENCE_REFLECTIONS: [number, number, number][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
  [2, 0, 0],
  [0, 2, 0],
  [0, 0, 2],
  [2, 1, 0],
  [1, 1, 2],
  [2, 1, 1],
  [2, 2, 0],
  [2, 2, 2],
  [3, 1, 0],
  [3, 1, 1],
  [1, 0, 2],
  [1, 0, 4]
];

export const StereographicWulffExplorer: React.FC<StereographicWulffExplorerProps> = ({
  selectedSystemId,
  activeCentering,
  onSelectSystem,
  setActiveCentering
}) => {
  const activeSystem = useMemo(
    () => CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === selectedSystemId) || CRYSTAL_SYSTEMS_CATALOG[0],
    [selectedSystemId]
  );

  const [showWulffGrid, setShowWulffGrid] = useState<boolean>(true);
  const [showMirrorPlanes, setShowMirrorPlanes] = useState<boolean>(true);
  const [showSymmetryPoles, setShowSymmetryPoles] = useState<boolean>(true);
  const [showHklPoles, setShowHklPoles] = useState<boolean>(true);
  const [filterAllowedOnly, setFilterAllowedOnly] = useState<boolean>(false);
  const [hoveredPole, setHoveredPole] = useState<{ label: string; detail: string; x: number; y: number } | null>(null);

  // Evaluate Bravais centering systematic absence rule
  const evaluateExtinction = (h: number, k: number, l: number, centering: CenteringType): { allowed: boolean; reason: string } => {
    switch (centering) {
      case 'P':
        return { allowed: true, reason: 'Primitive (P): All (hkl) allowed (no translational extinction)' };
      case 'I': {
        const sum = h + k + l;
        const ok = Math.abs(sum) % 2 === 0;
        return {
          allowed: ok,
          reason: ok ? `h+k+l = ${sum} (even → allowed)` : `h+k+l = ${sum} (odd → destructive interference)`
        };
      }
      case 'F': {
        const parH = Math.abs(h) % 2;
        const parK = Math.abs(k) % 2;
        const parL = Math.abs(l) % 2;
        const unmixed = parH === parK && parK === parL;
        return {
          allowed: unmixed,
          reason: unmixed
            ? `Unmixed parity (${parH === 0 ? 'all even' : 'all odd'} → allowed)`
            : 'Mixed even/odd parity → forbidden in F-lattice'
        };
      }
      case 'C': {
        const sumHK = h + k;
        const ok = Math.abs(sumHK) % 2 === 0;
        return {
          allowed: ok,
          reason: ok ? `h+k = ${sumHK} (even → allowed)` : `h+k = ${sumHK} (odd → forbidden in C-lattice)`
        };
      }
      case 'R': {
        const val = -h + k + l;
        const ok = Math.abs(val) % 3 === 0;
        return {
          allowed: ok,
          reason: ok ? `-h+k+l = ${val} (3n → allowed obverse)` : `-h+k+l = ${val} (≠ 3n → forbidden obverse)`
        };
      }
    }
  };

  // Exact Triclinic/General d-spacing & reflection list
  const reflectionRows = useMemo<ReflectionRow[]>(() => {
    const { a, b, c, alpha, beta, gamma } = activeSystem.defaultParams;
    const toRad = Math.PI / 180;
    const aR = alpha * toRad;
    const bR = beta * toRad;
    const gR = gamma * toRad;

    const term =
      1 -
      Math.cos(aR) ** 2 -
      Math.cos(bR) ** 2 -
      Math.cos(gR) ** 2 +
      2 * Math.cos(aR) * Math.cos(bR) * Math.cos(gR);
    const V = a * b * c * Math.sqrt(Math.max(1e-9, term));

    const S11 = b * b * c * c * Math.sin(aR) ** 2;
    const S22 = a * a * c * c * Math.sin(bR) ** 2;
    const S33 = a * a * b * b * Math.sin(gR) ** 2;
    const S12 = a * b * c * c * (Math.cos(aR) * Math.cos(bR) - Math.cos(gR));
    const S23 = a * a * b * c * (Math.cos(bR) * Math.cos(gR) - Math.cos(aR));
    const S13 = a * b * b * c * (Math.cos(gR) * Math.cos(aR) - Math.cos(bR));

    const rows: ReflectionRow[] = [];

    REFERENCE_REFLECTIONS.forEach(([h, k, l]) => {
      const invD2 =
        (1 / (V * V)) *
        (S11 * h * h +
          S22 * k * k +
          S33 * l * l +
          2 * S12 * h * k +
          2 * S23 * k * l +
          2 * S13 * h * l);
      if (invD2 <= 0) return;

      const d = 1 / Math.sqrt(invD2);
      const q = (2 * Math.PI) / d;
      const sinCu = 1.5406 / (2 * d);
      const sinMo = 0.7107 / (2 * d);
      const twoThetaCu = sinCu <= 1 ? (2 * Math.asin(sinCu) * 180) / Math.PI : 0;
      const twoThetaMo = sinMo <= 1 ? (2 * Math.asin(sinMo) * 180) / Math.PI : 0;

      const ext = evaluateExtinction(h, k, l, activeCentering);

      // Estimate multiplicity based on crystal system & non-zero indices
      const nonZero = [h, k, l].filter(v => v !== 0).length;
      let mult = 2;
      if (activeSystem.id === 'cubic') {
        if (nonZero === 1) mult = 6;
        else if (nonZero === 2) mult = h === k || k === l || h === l ? 12 : 24;
        else mult = h === k && k === l ? 8 : 24;
      } else if (activeSystem.id === 'hexagonal' || activeSystem.id === 'tetragonal') {
        mult = nonZero === 1 ? (l !== 0 ? 2 : 4) : nonZero === 2 ? 8 : 16;
      } else if (activeSystem.id === 'orthorhombic') {
        mult = Math.pow(2, nonZero);
      } else if (activeSystem.id === 'monoclinic') {
        mult = nonZero === 1 ? 2 : 4;
      } else {
        mult = 2;
      }

      rows.push({
        h,
        k,
        l,
        label: `(${h}${k}${l})`,
        dSpacing: d,
        twoThetaCu,
        twoThetaMo,
        qVector: q,
        allowed: ext.allowed,
        ruleReason: ext.reason,
        structureFactorNorm: ext.allowed ? 1.0 : 0.0,
        multiplicity: mult
      });
    });

    // Sort by d-spacing descending (lowest 2θ first)
    return rows.sort((a, b) => b.dSpacing - a.dSpacing);
  }, [activeSystem, activeCentering]);

  // Stereographic projection coordinates for symmetry elements & (hkl) poles
  // Project spherical (theta in [0, 90], phi in [0, 360)) to 2D Wulff disc of radius R = 135 at (170, 170)
  const stereoData = useMemo(() => {
    const cx = 170;
    const cy = 170;
    const R = 135;

    const projectSpherical = (thetaDeg: number, phiDeg: number) => {
      const tRad = (thetaDeg * Math.PI) / 180;
      const pRad = (phiDeg * Math.PI) / 180;
      const r = R * Math.tan(tRad / 2);
      return {
        x: cx + r * Math.cos(pRad),
        y: cy - r * Math.sin(pRad)
      };
    };

    interface SymPole {
      x: number;
      y: number;
      order: 2 | 3 | 4 | 6 | -1;
      label: string;
      color: string;
    }

    const symPoles: SymPole[] = [];

    if (activeSystem.id === 'cubic') {
      // 4-fold axes: [001] center, [100],[010],[-100],[0-10] on perimeter
      symPoles.push({ ...projectSpherical(0, 0), order: 4, label: '[001] 4-fold', color: '#f97316' });
      [0, 90, 180, 270].forEach((phi, i) => {
        const labels = ['[100]', '[010]', '[1̄00]', '[01̄0]'];
        symPoles.push({ ...projectSpherical(90, phi), order: 4, label: `${labels[i]} 4-fold`, color: '#f97316' });
      });
      // 3-fold <111> axes at theta = 54.74 deg, phi = 45, 135, 225, 315
      [45, 135, 225, 315].forEach((phi, i) => {
        const labels = ['[111]', '[1̄11]', '[1̄1̄1]', '[11̄1]'];
        symPoles.push({ ...projectSpherical(54.74, phi), order: 3, label: `${labels[i]} 3-fold triad`, color: '#f59e0b' });
      });
      // 2-fold <110> axes at theta = 45 deg (0, 90, 180, 270) and theta = 90 deg (45, 135, 225, 315)
      [0, 90, 180, 270].forEach(phi => {
        symPoles.push({ ...projectSpherical(45, phi), order: 2, label: '⟨101⟩ 2-fold diad', color: '#38bdf8' });
      });
      [45, 135, 225, 315].forEach(phi => {
        symPoles.push({ ...projectSpherical(90, phi), order: 2, label: '⟨110⟩ 2-fold diad', color: '#38bdf8' });
      });
    } else if (activeSystem.id === 'hexagonal') {
      symPoles.push({ ...projectSpherical(0, 0), order: 6, label: '[0001] 6-fold hexad', color: '#10b981' });
      for (let i = 0; i < 12; i++) {
        symPoles.push({
          ...projectSpherical(90, i * 30),
          order: 2,
          label: i % 2 === 0 ? '⟨112̄0⟩ 2-fold' : '⟨101̄0⟩ 2-fold',
          color: '#38bdf8'
        });
      }
    } else if (activeSystem.id === 'trigonal') {
      symPoles.push({ ...projectSpherical(0, 0), order: 3, label: '[0001] 3-fold triad', color: '#f43f5e' });
      for (let i = 0; i < 6; i++) {
        symPoles.push({
          ...projectSpherical(90, i * 60),
          order: 2,
          label: '⟨112̄0⟩ 2-fold',
          color: '#38bdf8'
        });
      }
    } else if (activeSystem.id === 'tetragonal') {
      symPoles.push({ ...projectSpherical(0, 0), order: 4, label: '[001] 4-fold tetrad', color: '#f97316' });
      for (let i = 0; i < 8; i++) {
        symPoles.push({
          ...projectSpherical(90, i * 45),
          order: 2,
          label: i % 2 === 0 ? '⟨100⟩ 2-fold' : '⟨110⟩ 2-fold',
          color: '#38bdf8'
        });
      }
    } else if (activeSystem.id === 'orthorhombic') {
      symPoles.push({ ...projectSpherical(0, 0), order: 2, label: '[001] 2-fold', color: '#84cc16' });
      [0, 90, 180, 270].forEach((phi, i) => {
        const labels = ['[100]', '[010]', '[1̄00]', '[01̄0]'];
        symPoles.push({ ...projectSpherical(90, phi), order: 2, label: `${labels[i]} 2-fold`, color: '#84cc16' });
      });
    } else if (activeSystem.id === 'monoclinic') {
      // Unique axis b at phi = 90, 270
      symPoles.push({ ...projectSpherical(90, 90), order: 2, label: '[010] Unique 2-fold', color: '#38bdf8' });
      symPoles.push({ ...projectSpherical(90, 270), order: 2, label: '[01̄0] Unique 2-fold', color: '#38bdf8' });
    } else if (activeSystem.id === 'triclinic') {
      symPoles.push({ ...projectSpherical(0, 0), order: -1, label: '1̄ Inversion Center Only', color: '#06b6d4' });
    }

    // Generate crystallographic (hkl) pole family markers
    const hklPoles = [
      { theta: 26.56, phi: 0, label: '(102)' },
      { theta: 26.56, phi: 90, label: '(012)' },
      { theta: 26.56, phi: 180, label: '(1̄02)' },
      { theta: 26.56, phi: 270, label: '(01̄2)' },
      { theta: 35.26, phi: 45, label: '(112)' },
      { theta: 35.26, phi: 135, label: '(1̄12)' },
      { theta: 35.26, phi: 225, label: '(1̄1̄2)' },
      { theta: 35.26, phi: 315, label: '(11̄2)' }
    ].map(p => ({ ...projectSpherical(p.theta, p.phi), label: p.label }));

    return { cx, cy, R, symPoles, hklPoles };
  }, [activeSystem.id]);

  const displayedReflections = useMemo(() => {
    return filterAllowedOnly ? reflectionRows.filter(r => r.allowed) : reflectionRows;
  }, [reflectionRows, filterAllowedOnly]);

  const holohedralPointGroup: Record<CrystalSystemId, string> = {
    cubic: 'm3̄m (O_h)',
    hexagonal: '6/mmm (D_6h)',
    trigonal: '3̄m (D_3d)',
    tetragonal: '4/mmm (D_4h)',
    orthorhombic: 'mmm (D_2h)',
    monoclinic: '2/m (C_2h)',
    triclinic: '1̄ (C_i)'
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wulff Stereographic Net & Reciprocal Extinction Rules</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-300">Holohedral Class {holohedralPointGroup[selectedSystemId]}</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Stereographic Symmetry Projection & Structure Factor Extinctions
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Inspect upper-hemisphere Wulff net projections of rotation axes, mirror planes, and crystallographic poles alongside exact Bravais centering systematic absence rules <span className="font-mono text-indigo-300">|F(hkl)|²</span>.
          </p>
        </div>

        {/* Centering Quick Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 font-mono text-xs">
          <span className="text-[10px] text-slate-400 px-2 uppercase">Bravais:</span>
          {activeSystem.bravaisLattices.map(bl => (
            <button
              key={bl.type}
              onClick={() => {
                playSynthTone('tick');
                setActiveCentering(bl.type);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeCentering === bl.type
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {bl.type}-Lattice
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 2D Interactive Stereographic Wulff Net (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">
                Upper Hemisphere Wulff Net [001]
              </span>
              <h3 className="text-base font-bold text-white">
                {activeSystem.name} · Point Group {holohedralPointGroup[selectedSystemId]}
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {stereoData.symPoles.length} Poles
            </span>
          </div>

          {/* Interactive SVG Stereogram */}
          <div className="relative flex items-center justify-center py-2">
            <svg viewBox="0 0 340 340" className="w-full max-w-[330px] h-auto mx-auto overflow-visible select-none">
              <defs>
                <radialGradient id="stereoDiscGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="85%" stopColor="#020617" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </radialGradient>
              </defs>

              {/* Outer Equatorial Primitive Circle */}
              <circle
                cx={stereoData.cx}
                cy={stereoData.cy}
                r={stereoData.R}
                fill="url(#stereoDiscGrad)"
                stroke={showMirrorPlanes && activeSystem.id !== 'triclinic' ? '#6366f1' : '#334155'}
                strokeWidth={showMirrorPlanes && activeSystem.id !== 'triclinic' ? '2.5' : '1.5'}
              />

              {/* Wulff Net Altitude Circles (theta = 30°, 60°) & Azimuth Radials */}
              {showWulffGrid && (
                <g opacity="0.35">
                  <circle
                    cx={stereoData.cx}
                    cy={stereoData.cy}
                    r={stereoData.R * Math.tan((15 * Math.PI) / 180)}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={stereoData.cx}
                    cy={stereoData.cy}
                    r={stereoData.R * Math.tan((30 * Math.PI) / 180)}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {[0, 30, 60, 90, 120, 150].map(ang => {
                    const rad = (ang * Math.PI) / 180;
                    const dx = stereoData.R * Math.cos(rad);
                    const dy = stereoData.R * Math.sin(rad);
                    return (
                      <line
                        key={`grid-rad-${ang}`}
                        x1={stereoData.cx - dx}
                        y1={stereoData.cy - dy}
                        x2={stereoData.cx + dx}
                        y2={stereoData.cy + dy}
                        stroke="#334155"
                        strokeWidth="0.8"
                        strokeDasharray="2 3"
                      />
                    );
                  })}
                </g>
              )}

              {/* Mirror Planes (Solid Great Circles & Diameters) */}
              {showMirrorPlanes && (
                <g>
                  {(activeSystem.id === 'cubic' ||
                    activeSystem.id === 'tetragonal' ||
                    activeSystem.id === 'orthorhombic') && (
                    <>
                      <line
                        x1={stereoData.cx - stereoData.R}
                        y1={stereoData.cy}
                        x2={stereoData.cx + stereoData.R}
                        y2={stereoData.cy}
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                      <line
                        x1={stereoData.cx}
                        y1={stereoData.cy - stereoData.R}
                        x2={stereoData.cx}
                        y2={stereoData.cy + stereoData.R}
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {(activeSystem.id === 'cubic' || activeSystem.id === 'tetragonal') && (
                    <>
                      <line
                        x1={stereoData.cx - stereoData.R * 0.7071}
                        y1={stereoData.cy - stereoData.R * 0.7071}
                        x2={stereoData.cx + stereoData.R * 0.7071}
                        y2={stereoData.cy + stereoData.R * 0.7071}
                        stroke="#818cf8"
                        strokeWidth="1.6"
                      />
                      <line
                        x1={stereoData.cx - stereoData.R * 0.7071}
                        y1={stereoData.cy + stereoData.R * 0.7071}
                        x2={stereoData.cx + stereoData.R * 0.7071}
                        y2={stereoData.cy - stereoData.R * 0.7071}
                        stroke="#818cf8"
                        strokeWidth="1.6"
                      />
                    </>
                  )}

                  {activeSystem.id === 'cubic' && (
                    <>
                      {/* inclined {110} great circle arcs */}
                      <path
                        d={`M ${stereoData.cx - stereoData.R} ${stereoData.cy} Q ${stereoData.cx} ${stereoData.cy - stereoData.R * 0.414} ${stereoData.cx + stereoData.R} ${stereoData.cy}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.4"
                        opacity="0.75"
                      />
                      <path
                        d={`M ${stereoData.cx - stereoData.R} ${stereoData.cy} Q ${stereoData.cx} ${stereoData.cy + stereoData.R * 0.414} ${stereoData.cx + stereoData.R} ${stereoData.cy}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.4"
                        opacity="0.75"
                      />
                      <path
                        d={`M ${stereoData.cx} ${stereoData.cy - stereoData.R} Q ${stereoData.cx - stereoData.R * 0.414} ${stereoData.cy} ${stereoData.cx} ${stereoData.cy + stereoData.R}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.4"
                        opacity="0.75"
                      />
                      <path
                        d={`M ${stereoData.cx} ${stereoData.cy - stereoData.R} Q ${stereoData.cx + stereoData.R * 0.414} ${stereoData.cy} ${stereoData.cx} ${stereoData.cy + stereoData.R}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.4"
                        opacity="0.75"
                      />
                    </>
                  )}

                  {activeSystem.id === 'hexagonal' &&
                    [0, 30, 60, 90, 120, 150].map(ang => {
                      const rad = (ang * Math.PI) / 180;
                      const dx = stereoData.R * Math.cos(rad);
                      const dy = stereoData.R * Math.sin(rad);
                      return (
                        <line
                          key={`hex-m-${ang}`}
                          x1={stereoData.cx - dx}
                          y1={stereoData.cy - dy}
                          x2={stereoData.cx + dx}
                          y2={stereoData.cy + dy}
                          stroke="#10b981"
                          strokeWidth="1.7"
                        />
                      );
                    })}

                  {activeSystem.id === 'trigonal' &&
                    [30, 90, 150].map(ang => {
                      const rad = (ang * Math.PI) / 180;
                      const dx = stereoData.R * Math.cos(rad);
                      const dy = stereoData.R * Math.sin(rad);
                      return (
                        <line
                          key={`trig-m-${ang}`}
                          x1={stereoData.cx - dx}
                          y1={stereoData.cy - dy}
                          x2={stereoData.cx + dx}
                          y2={stereoData.cy + dy}
                          stroke="#f43f5e"
                          strokeWidth="1.7"
                        />
                      );
                    })}

                  {activeSystem.id === 'monoclinic' && (
                    <line
                      x1={stereoData.cx - stereoData.R}
                      y1={stereoData.cy}
                      x2={stereoData.cx + stereoData.R}
                      y2={stereoData.cy}
                      stroke="#38bdf8"
                      strokeWidth="2.2"
                    />
                  )}
                </g>
              )}

              {/* General (hkl) Form Poles */}
              {showHklPoles &&
                stereoData.hklPoles.map((p, idx) => (
                  <g
                    key={`hkl-p-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPole({
                        label: `Pole ${p.label}`,
                        detail: 'Upper-hemisphere crystallographic face normal intersection',
                        x: p.x,
                        y: p.y
                      })
                    }
                    onMouseLeave={() => setHoveredPole(null)}
                  >
                    <circle cx={p.x} cy={p.y} r="3.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                    <text x={p.x + 5} y={p.y - 4} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                      {p.label}
                    </text>
                  </g>
                ))}

              {/* Crystallographic Symmetry Axis Poles (2, 3, 4, 6, -1) */}
              {showSymmetryPoles &&
                stereoData.symPoles.map((sp, idx) => (
                  <g
                    key={`sym-p-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPole({
                        label: sp.label,
                        detail: `Symmetry Order ${sp.order} Axis Pole`,
                        x: sp.x,
                        y: sp.y
                      })
                    }
                    onMouseLeave={() => setHoveredPole(null)}
                  >
                    {sp.order === 4 && (
                      <rect
                        x={sp.x - 5}
                        y={sp.y - 5}
                        width="10"
                        height="10"
                        fill={sp.color}
                        stroke="#fff"
                        strokeWidth="1"
                        transform={`rotate(45 ${sp.x} ${sp.y})`}
                      />
                    )}
                    {sp.order === 3 && (
                      <polygon
                        points={`${sp.x},${sp.y - 6.5} ${sp.x - 5.8},${sp.y + 4.5} ${sp.x + 5.8},${sp.y + 4.5}`}
                        fill={sp.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    )}
                    {sp.order === 6 && (
                      <polygon
                        points={`${sp.x},${sp.y - 7} ${sp.x + 6},${sp.y - 3.5} ${sp.x + 6},${sp.y + 3.5} ${sp.x},${sp.y + 7} ${sp.x - 6},${sp.y + 3.5} ${sp.x - 6},${sp.y - 3.5}`}
                        fill={sp.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    )}
                    {sp.order === 2 && (
                      <ellipse
                        cx={sp.x}
                        cy={sp.y}
                        rx="6"
                        ry="3.2"
                        fill={sp.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    )}
                    {sp.order === -1 && (
                      <g>
                        <circle cx={sp.x} cy={sp.y} r="7" fill="none" stroke={sp.color} strokeWidth="2" />
                        <circle cx={sp.x} cy={sp.y} r="2.5" fill={sp.color} />
                      </g>
                    )}
                  </g>
                ))}

              {/* Axis Cardinal Labels */}
              <text x={stereoData.cx + stereoData.R + 7} y={stereoData.cy + 3} fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">
                +a
              </text>
              <text x={stereoData.cx - 8} y={stereoData.cy - stereoData.R - 7} fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                +b
              </text>
            </svg>

            {hoveredPole && (
              <div className="absolute bottom-2 left-4 right-4 bg-slate-900/95 border border-indigo-500/40 rounded-xl p-2.5 text-xs font-mono flex items-center justify-between shadow-xl">
                <span className="text-white font-bold">{hoveredPole.label}</span>
                <span className="text-cyan-300 text-[11px]">{hoveredPole.detail}</span>
              </div>
            )}
          </div>

          {/* Layer Toggles & Legend */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSymmetryPoles}
                  onChange={e => setShowSymmetryPoles(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500"
                />
                <span>Symmetry Poles</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMirrorPlanes}
                  onChange={e => setShowMirrorPlanes(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-500"
                />
                <span>Mirror Great Circles</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHklPoles}
                  onChange={e => setShowHklPoles(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                />
                <span>(hkl) Face Poles</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWulffGrid}
                  onChange={e => setShowWulffGrid(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-slate-500"
                />
                <span>Wulff Latitude Net</span>
              </label>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-orange-500 inline-block rotate-45" /> 4-Fold
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-400 inline-block" /> 3-Fold
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> 6-Fold
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 bg-sky-400 rounded-full inline-block" /> 2-Fold
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Structure Factor & Diffraction Extinction Table (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                Reciprocal Space Selection Rules · {activeCentering}-Centered Lattice
              </span>
              <h3 className="text-lg font-bold text-white">
                Interplanar d-Spacing, Bragg 2θ & Structure Factor |F(hkl)|²
              </h3>
            </div>

            <button
              onClick={() => {
                playSynthTone('tick');
                setFilterAllowedOnly(!filterAllowedOnly);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                filterAllowedOnly
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {filterAllowedOnly ? 'Showing Allowed Only' : 'Show All (Allowed + Forbidden)'}
            </button>
          </div>

          {/* Mathematical Structure Factor Rule Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Active Structure Factor Sum</span>
              <span className="text-indigo-300 font-bold">
                {activeCentering === 'P' && 'F(hkl) = f · [1]  →  All h,k,l Allowed'}
                {activeCentering === 'I' && 'F(hkl) = f · [1 + exp(πi(h+k+l))]  →  h+k+l = 2n'}
                {activeCentering === 'F' && 'F(hkl) = f · [1 + e^πi(h+k) + e^πi(h+l) + e^πi(k+l)]  →  h,k,l unmixed'}
                {activeCentering === 'C' && 'F(hkl) = f · [1 + exp(πi(h+k))]  →  h+k = 2n'}
                {activeCentering === 'R' && 'F(hkl) = f · [1 + e^(2πi(-h+k+l)/3) + e^(4πi(-h+k+l)/3)]  →  -h+k+l = 3n'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Default Metric</span>
              <span className="text-cyan-300 font-bold">
                a={activeSystem.defaultParams.a}Å, c={activeSystem.defaultParams.c}Å
              </span>
            </div>
          </div>

          {/* Reflection Table */}
          <div className="overflow-x-auto max-h-[380px] rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Plane (hkl)</th>
                  <th className="py-2.5 px-3">d(hkl) [Å]</th>
                  <th className="py-2.5 px-3">2θ Cu Kα</th>
                  <th className="py-2.5 px-3">2θ Mo Kα</th>
                  <th className="py-2.5 px-3">Mult. j</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Condition / Extinction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedReflections.map((row, idx) => (
                  <tr
                    key={`${row.label}-${idx}`}
                    className={
                      row.allowed
                        ? 'bg-slate-900/40 hover:bg-slate-800/50 text-slate-200'
                        : 'bg-rose-950/10 hover:bg-rose-950/20 text-slate-500'
                    }
                  >
                    <td className="py-2 px-3 font-bold text-white">{row.label}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{row.dSpacing.toFixed(4)}</td>
                    <td className="py-2 px-3 text-amber-300">
                      {row.twoThetaCu > 0 ? `${row.twoThetaCu.toFixed(2)}°` : '—'}
                    </td>
                    <td className="py-2 px-3 text-indigo-300">
                      {row.twoThetaMo > 0 ? `${row.twoThetaMo.toFixed(2)}°` : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{row.multiplicity}</td>
                    <td className="py-2 px-3">
                      {row.allowed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400/90 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px] font-sans text-slate-400">{row.ruleReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
