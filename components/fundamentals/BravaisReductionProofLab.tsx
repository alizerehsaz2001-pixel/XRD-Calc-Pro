import React, { useState } from 'react';
import { GitMerge, AlertTriangle, CheckCircle2, ArrowRight, Eye } from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { FORBIDDEN_BRAVAIS_PROOFS, type ForbiddenBravaisProof } from './bravaisPhysics';

interface BravaisReductionProofLabProps {
  onJumpToBravais?: (pearson: string) => void;
}

export const BravaisReductionProofLab: React.FC<BravaisReductionProofLabProps> = ({
  onJumpToBravais,
}) => {
  const [selectedId, setSelectedId] = useState<string>('tF');
  const [showReducedOverlay, setShowReducedOverlay] = useState<boolean>(true);

  const activeProof: ForbiddenBravaisProof =
    FORBIDDEN_BRAVAIS_PROOFS.find((p) => p.id === selectedId) || FORBIDDEN_BRAVAIS_PROOFS[0];

  const renderGeometricProofSvg = (proof: ForbiddenBravaisProof) => {
    const mode = proof.svgMode;

    if (mode === 'tF_to_tI' || mode === 'tC_to_tP' || mode === 'cC_breaks_cubic') {
      // 2x2 basal square net showing 45° rotated reduced square cell a' = a/√2
      const gridPts: [number, number][] = [];
      for (let ix = 0; ix <= 2; ix++) {
        for (let iy = 0; iy <= 2; iy++) {
          gridPts.push([56 + ix * 64, 24 + iy * 64]);
        }
      }
      const faceCenters: [number, number][] = [
        [88, 56],
        [152, 56],
        [88, 120],
        [152, 120],
      ];
      const lateralFaceCenters: [number, number][] =
        mode === 'tF_to_tI'
          ? [
              [88, 24],
              [152, 24],
              [56, 56],
              [120, 56],
              [184, 56],
              [88, 88],
              [152, 88],
              [56, 120],
              [120, 120],
              [184, 120],
              [88, 152],
              [152, 152],
            ]
          : [];

      return (
        <svg viewBox="0 0 240 176" className="w-full h-44 select-none">
          <rect x="4" y="4" width="232" height="168" rx="8" fill="#050811" stroke="#1e293b" />
          <text x="14" y="18" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">
            BASAL (001) PROJECTION · 2×2 LATTICE NET
          </text>

          {/* Original conventional 2x2 square grid */}
          {[56, 120, 184].map((x) => (
            <line key={`v-${x}`} x1={x} y1={24} x2={x} y2={152} stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
          ))}
          {[24, 88, 152].map((y) => (
            <line key={`h-${y}`} x1={56} y1={y} x2={184} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
          ))}

          {/* Original Forbidden Cell Highlight */}
          <rect
            x="56"
            y="24"
            width="64"
            height="64"
            fill="rgba(244,63,94,0.08)"
            stroke="#fb7185"
            strokeWidth="1.4"
            strokeDasharray="4 2"
          />
          <text x="61" y="35" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {proof.forbiddenSymbol} (a)
          </text>

          {/* 45° Rotated Reduced Cell Overlay */}
          {showReducedOverlay && (
            <g>
              <polygon
                points="120,24 152,56 120,88 88,56"
                fill="rgba(16,185,129,0.20)"
                stroke="#34d399"
                strokeWidth="2"
              />
              <line x1="120" y1="88" x2="152" y2="56" stroke="#10b981" strokeWidth="2.4" />
              <line x1="120" y1="88" x2="88" y2="56" stroke="#38bdf8" strokeWidth="2.4" />
              <text x="144" y="80" fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                a&apos;=a/√2
              </text>
              <text x="120" y="106" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {mode === 'tF_to_tI'
                  ? 'Reduced tI (z=½ at center!)'
                  : mode === 'cC_breaks_cubic'
                  ? 'Drops to tP (no 3-fold ⟨111⟩!)'
                  : 'Reduced tP (Z=1, 45° rotated)'}
              </text>
            </g>
          )}

          {/* Lateral z=1/2 face centers for tF -> becomes body center of tI */}
          {lateralFaceCenters.map(([cx, cy], idx) => (
            <circle
              key={`lat-${idx}`}
              cx={cx}
              cy={cy}
              r={cx === 120 && cy === 56 ? 4.4 : 2.5}
              fill={cx === 120 && cy === 56 ? '#fbbf24' : '#f59e0b'}
              opacity={cx === 120 && cy === 56 ? 1 : 0.55}
              stroke="#0f172a"
              strokeWidth="0.8"
            />
          ))}

          {/* Basal C-face / F-face centers at z=0 */}
          {faceCenters.map(([cx, cy], idx) => (
            <circle key={`fc-${idx}`} cx={cx} cy={cy} r="3.6" fill="#38bdf8" stroke="#0f172a" strokeWidth="0.9" />
          ))}

          {/* Corner nodes at z=0 */}
          {gridPts.map(([cx, cy], idx) => (
            <circle key={`gp-${idx}`} cx={cx} cy={cy} r="3.6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.9" />
          ))}

          {/* Legend */}
          <circle cx="18" cy="162" r="2.8" fill="#e2e8f0" />
          <text x="25" y="165" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">z=0 corner</text>
          <circle cx="88" cy="162" r="2.8" fill="#38bdf8" />
          <text x="95" y="165" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">z=0 face</text>
          {mode === 'tF_to_tI' && (
            <>
              <circle cx="154" cy="162" r="2.8" fill="#fbbf24" />
              <text x="161" y="165" fill="#fcd34d" fontSize="7.5" fontFamily="monospace">z=½ → body</text>
            </>
          )}
        </svg>
      );
    }

    if (mode === 'mI_to_mC' || mode === 'mF_to_mC' || mode === 'aCentered_to_aP') {
      // Oblique (010) ac-plane projection showing shear re-indexing mI -> mC / aI -> aP
      const pts: [number, number][] = [];
      for (let ix = 0; ix <= 2; ix++) {
        for (let iz = 0; iz <= 1; iz++) {
          pts.push([42 + ix * 66 + iz * 22, 134 - iz * 74]);
        }
      }
      const p00 = pts[0]; // (0,0)
      const p01 = pts[1]; // (0,1)
      const p10 = pts[2]; // (1,0)
      const p11 = pts[3]; // (1,1)
      const p20 = pts[4]; // (2,0)
      const p21 = pts[5]; // (2,1)
      const bodyMid: [number, number] = [(p00[0] + p11[0]) / 2, (p00[1] + p11[1]) / 2];
      const bodyMid2: [number, number] = [(p10[0] + p21[0]) / 2, (p10[1] + p21[1]) / 2];

      return (
        <svg viewBox="0 0 240 176" className="w-full h-44 select-none">
          <rect x="4" y="4" width="232" height="168" rx="8" fill="#050811" stroke="#1e293b" />
          <text x="14" y="18" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {mode === 'aCentered_to_aP'
              ? 'GENERAL OBLIQUE PLANE · ZERO ANGLE LOCKS'
              : 'MONOCLINIC (010) ac-PLANE · UNIQUE b ⊥ SCREEN'}
          </text>

          {/* Original Forbidden Parallelogram */}
          <polygon
            points={`${p00.join(',')} ${p10.join(',')} ${p11.join(',')} ${p01.join(',')}`}
            fill="rgba(244,63,94,0.09)"
            stroke="#fb7185"
            strokeWidth="1.4"
            strokeDasharray="4 2"
          />
          <polygon
            points={`${p10.join(',')} ${p20.join(',')} ${p21.join(',')} ${p11.join(',')}`}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="3 2"
          />

          {/* Reduced Cell Overlay */}
          {showReducedOverlay && mode === 'mI_to_mC' && (
            <g>
              <polygon
                points={`${p00.join(',')} ${p10.join(',')} ${p21.join(',')} ${p11.join(',')}`}
                fill="rgba(16,185,129,0.18)"
                stroke="#34d399"
                strokeWidth="2"
              />
              <text x="140" y="96" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
                mC (c&apos;=a+c)
              </text>
            </g>
          )}
          {showReducedOverlay && (mode === 'mF_to_mC' || mode === 'aCentered_to_aP') && (
            <g>
              <polygon
                points={`${p00.join(',')} ${p10.join(',')} ${bodyMid2.join(',')} ${bodyMid.join(',')}`}
                fill="rgba(16,185,129,0.20)"
                stroke="#34d399"
                strokeWidth="2"
              />
              <text x="112" y="114" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {mode === 'mF_to_mC' ? "c'=½(a+c) → mC" : "c'=½(a+b+c) → aP"}
              </text>
            </g>
          )}

          {/* Centering nodes at y=1/2 */}
          <circle cx={bodyMid[0]} cy={bodyMid[1]} r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="0.9" />
          <circle cx={bodyMid2[0]} cy={bodyMid2[1]} r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="0.9" />

          {/* Corner nodes */}
          {pts.map(([cx, cy], idx) => (
            <circle key={`mp-${idx}`} cx={cx} cy={cy} r="3.6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.9" />
          ))}

          <text x="14" y="162" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
            β unconstrained → shear basis absorbs centering site
          </text>
        </svg>
      );
    }

    // Hexagonal 6-fold symmetry breaking SVG
    const cx = 120;
    const cy = 92;
    const R = 52;
    const hexVerts = Array.from({ length: 6 }, (_, i) => {
      const ang = (i * 60 * Math.PI) / 180;
      return [cx + R * Math.cos(ang), cy + R * Math.sin(ang)] as [number, number];
    });
    const badCenter: [number, number] = [
      (cx + hexVerts[0][0] + hexVerts[1][0]) / 2 - cx / 2 + 24,
      (cy + hexVerts[0][1] + hexVerts[1][1]) / 2 - cy / 2 + 18,
    ];
    const rhombCenter: [number, number] = [
      (cx + hexVerts[0][0] + hexVerts[1][0] + hexVerts[2][0]) / 4,
      (cy + hexVerts[0][1] + hexVerts[1][1] + hexVerts[2][1]) / 4,
    ];

    return (
      <svg viewBox="0 0 240 176" className="w-full h-44 select-none">
        <rect x="4" y="4" width="232" height="168" rx="8" fill="#050811" stroke="#1e293b" />
        <text x="14" y="18" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">
          HEXAGONAL (0001) BASAL NET · 6-FOLD SYMMETRY TEST
        </text>

        <polygon
          points={hexVerts.map((p) => p.join(',')).join(' ')}
          fill="rgba(56,189,248,0.06)"
          stroke="#334155"
          strokeWidth="1.2"
        />
        {/* Single 120° primitive rhombic cell */}
        <polygon
          points={`${cx},${cy} ${hexVerts[0].join(',')} ${hexVerts[1].join(',')} ${hexVerts[2].join(',')}`}
          fill="rgba(244,63,94,0.10)"
          stroke="#fb7185"
          strokeWidth="1.4"
          strokeDasharray="3 2"
        />

        {/* Attempted C-center node */}
        <circle cx={rhombCenter[0]} cy={rhombCenter[1]} r="4.2" fill="#fb7185" stroke="#fff" strokeWidth="0.9" />

        {/* 60° rotated ghost copies showing broken lattice invariance */}
        {showReducedOverlay &&
          [1, 2, 3, 4, 5].map((step) => {
            const rad = (step * 60 * Math.PI) / 180;
            const dx = rhombCenter[0] - cx;
            const dy = rhombCenter[1] - cy;
            const rx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
            const ry = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
            return (
              <g key={step}>
                <circle cx={rx} cy={ry} r="3.4" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="2 1.5" />
              </g>
            );
          })}

        {hexVerts.map(([vx, vy], i) => (
          <circle key={i} cx={vx} cy={vy} r="3.2" fill="#e2e8f0" />
        ))}
        <circle cx={cx} cy={cy} r="3.6" fill="#38bdf8" />
        {/* Suppress unused var warning if any */}
        <circle cx={badCenter[0]} cy={badCenter[1]} r="0" opacity="0" />

        <text x="120" y="162" textAnchor="middle" fill="#fcd34d" fontSize="7.5" fontFamily="monospace">
          60° rotation creates conflicting sites → 6-fold axis broken!
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitMerge className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
            Auguste Bravais (1848) Proof Lab · Why Are There Only 14 Lattices (Not 28)?
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            playSynthTone('tick');
            setShowReducedOverlay((prev) => !prev);
          }}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            showReducedOverlay
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
              : 'bg-[#070A12] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>{showReducedOverlay ? 'Showing Reduced Valid Cell' : 'Overlay Reduced Cell'}</span>
        </button>
      </div>

      {/* Selector Strip for the 7 Forbidden / Redundant Centerings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
        {FORBIDDEN_BRAVAIS_PROOFS.map((p) => {
          const isSel = p.id === activeProof.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                playSynthTone('tick');
                setSelectedId(p.id);
              }}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                isSel
                  ? 'bg-[#0B1324] border-amber-500/70 text-white'
                  : 'bg-[#070A12] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs font-extrabold ${isSel ? 'text-rose-300' : 'text-rose-400/90'}`}>
                  <s>{p.forbiddenSymbol}</s>
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">→ {p.reducesTo}</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">{p.systemName}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive Proof Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
          {renderGeometricProofSvg(activeProof)}
        </div>

        <div className="lg:col-span-7 bg-[#070A12] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                {activeProof.verdict === 'redundant' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-sm font-bold text-slate-100 font-sans">
                  Why <span className="font-mono text-rose-300">{activeProof.forbiddenSymbol}</span> ({activeProof.forbiddenName}) Is Excluded
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase ${
                  activeProof.verdict === 'redundant' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {activeProof.verdict === 'redundant'
                  ? `Redundant → Reduces to ${activeProof.reducesTo}`
                  : `Breaks Symmetry → Drops to ${activeProof.reducesTo}`}
              </span>
            </div>

            <p className="text-xs font-sans text-slate-300 leading-relaxed">
              {activeProof.proofExplanation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-1">
            <div className="sm:col-span-4 bg-[#0B0F19] border border-slate-800 rounded-lg p-2">
              <div className="text-[9px] text-slate-500 text-center mb-1">Basis Reduction M</div>
              <div className="grid grid-cols-2 gap-1 text-center text-[11px] font-bold text-emerald-300">
                {activeProof.matrix2x2.flat().map((v, i) => (
                  <div key={i} className="bg-emerald-500/10 rounded py-0.5">
                    {v}
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-8 space-y-1.5 text-[10.5px]">
              <div className="bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-300">
                {activeProof.transformationSummary}
              </div>
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-amber-300 font-bold">{activeProof.volumeRatio}</span>
                {onJumpToBravais && ['tI', 'tP', 'mC', 'aP'].includes(activeProof.reducesTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      playSynthTone('tick');
                      onJumpToBravais(activeProof.reducesTo);
                    }}
                    className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Inspect Valid {activeProof.reducesTo}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
