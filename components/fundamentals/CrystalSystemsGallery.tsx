import React, { useState, useId } from 'react';
import { Box, Compass } from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export interface SystemGalleryItem {
  id: string;
  name: string;
  orderRank: number;
  axialRelation: string;
  angleRelation: string;
  mineralName: string;
  mineralFormula: string;
  mineralClass: string;
  mineralColor: string;
  mineralColorHex: string;
  cleavage: string;
  opticalProperties: string;
  bravaisTypes: string[];
  characteristicSymmetry: string;
  description: string;
  shapeType: 'cube' | 'tetragonal' | 'orthorhombic' | 'hexagonal_prism' | 'rhombohedron' | 'monoclinic' | 'triclinic';
}

export const GALLERY_SYSTEMS: SystemGalleryItem[] = [
  {
    id: 'cubic',
    name: 'Cubic',
    orderRank: 1,
    axialRelation: 'a = b = c',
    angleRelation: 'α = β = γ = 90°',
    mineralName: 'Fluorite',
    mineralFormula: 'CaF₂',
    mineralClass: 'Halide (Fm-3m)',
    mineralColor: 'Octahedral Cubic Habit',
    mineralColorHex: '#38bdf8',
    cleavage: 'Perfect Octahedral {111} (4 directions)',
    opticalProperties: 'Isotropic (n = 1.434), zero birefringence',
    bravaisTypes: ['cP', 'cI', 'cF'],
    characteristicSymmetry: 'Four 3-fold rotation/inversion axes along ⟨111⟩ body diagonals',
    description: 'Highest holohedral symmetry (order 48, m-3m). Exhibits isotropic physical tensors for optical refraction, thermal expansion, and electrical conductivity.',
    shapeType: 'cube'
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal',
    orderRank: 2,
    axialRelation: 'a = b ≠ c',
    angleRelation: 'α = β = 90°, γ = 120°',
    mineralName: 'Beryl',
    mineralFormula: 'Be₃Al₂Si₆O₁₈',
    mineralClass: 'Cyclosilicate (P6/mcc)',
    mineralColor: 'Hexagonal Prismatic {10-10}',
    mineralColorHex: '#38bdf8',
    cleavage: 'Imperfect Basal {0001}',
    opticalProperties: 'Uniaxial (−), n_ω = 1.586, n_ε = 1.578',
    bravaisTypes: ['hP'],
    characteristicSymmetry: 'One 6-fold rotation or rotoinversion axis along [0001]',
    description: 'Constructed from three 120° rhombic primitive cells sharing a central [0001] hexad axis. Exhibits transversely isotropic second-rank physical tensors.',
    shapeType: 'hexagonal_prism'
  },
  {
    id: 'trigonal',
    name: 'Trigonal',
    orderRank: 3,
    axialRelation: 'a = b = c',
    angleRelation: 'α = β = γ ≠ 90°',
    mineralName: 'Calcite / Rhodochrosite',
    mineralFormula: 'MnCO₃ / CaCO₃',
    mineralClass: 'Carbonate (R-3c)',
    mineralColor: 'Rhombohedral {10-14}',
    mineralColorHex: '#38bdf8',
    cleavage: 'Perfect Rhombohedral {10-14} (3 directions)',
    opticalProperties: 'Uniaxial (−), extreme birefringence (δ = 0.172–0.220)',
    bravaisTypes: ['hR', 'hP'],
    characteristicSymmetry: 'One 3-fold rotation or rotoinversion axis along [111] / [0001]',
    description: 'Indexed in either primitive rhombohedral axes (a = b = c, α ≠ 90°) or the triple hexagonal obverse cell (−h + k + l = 3n).',
    shapeType: 'rhombohedron'
  },
  {
    id: 'tetragonal',
    name: 'Tetragonal',
    orderRank: 4,
    axialRelation: 'a = b ≠ c',
    angleRelation: 'α = β = γ = 90°',
    mineralName: 'Wulfenite / Rutile',
    mineralFormula: 'PbMoO₄ / TiO₂',
    mineralClass: 'Molybdate / Oxide (I4₁/a)',
    mineralColor: 'Tabular Square / Pyramidal',
    mineralColorHex: '#38bdf8',
    cleavage: 'Distinct Pyramidal {011}',
    opticalProperties: 'Uniaxial (−/+), δ = 0.100–0.287',
    bravaisTypes: ['tP', 'tI'],
    characteristicSymmetry: 'One 4-fold rotation or rotoinversion axis along [001]',
    description: 'Orthogonal square-base prism stretched or compressed along the c-axis. Face-centered tF reduces to body-centered tI via a 45° [110] basal rotation.',
    shapeType: 'tetragonal'
  },
  {
    id: 'orthorhombic',
    name: 'Orthorhombic',
    orderRank: 5,
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α = β = γ = 90°',
    mineralName: 'Forsterite (Olivine)',
    mineralFormula: '(Mg,Fe)₂SiO₄',
    mineralClass: 'Nesosilicate (Pnma)',
    mineralColor: 'Bipyramidal Prismatic',
    mineralColorHex: '#38bdf8',
    cleavage: 'Pinacoidal {010} and {100}',
    opticalProperties: 'Biaxial (+), 2V = 82°–90°, n_α < n_β < n_γ',
    bravaisTypes: ['oP', 'oI', 'oF', 'oC'],
    characteristicSymmetry: 'Three mutually perpendicular 2-fold axes or mirror planes (mmm)',
    description: 'Three unequal orthogonal axes. Uniquely accommodates all four canonical Bravais centering types (Primitive, Body, Face, and Base centering).',
    shapeType: 'orthorhombic'
  },
  {
    id: 'monoclinic',
    name: 'Monoclinic',
    orderRank: 6,
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α = γ = 90°, β ≠ 90°',
    mineralName: 'Azurite / Gypsum',
    mineralFormula: 'Cu₃(CO₃)₂(OH)₂',
    mineralClass: 'Carbonate (P2₁/c)',
    mineralColor: 'Inclined Prismatic (β > 90°)',
    mineralColorHex: '#38bdf8',
    cleavage: 'Prismatic {011} and Pinacoidal {100}',
    opticalProperties: 'Biaxial (+), inclined extinction in (010)',
    bravaisTypes: ['mP', 'mC'],
    characteristicSymmetry: 'Single 2-fold rotation axis along unique b-axis [010] or mirror ⊥ b',
    description: 'Parallelepiped sheared in the (010) plane with oblique angle β > 90°. Introduces the off-diagonal metric tensor cross-term g₁₃ = a·c·cosβ.',
    shapeType: 'monoclinic'
  },
  {
    id: 'triclinic',
    name: 'Triclinic',
    orderRank: 7,
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α ≠ β ≠ γ ≠ 90°',
    mineralName: 'Microcline / Albite',
    mineralFormula: 'KAlSi₃O₈',
    mineralClass: 'Tectosilicate (P-1)',
    mineralColor: 'Oblique Pinacoidal',
    mineralColorHex: '#38bdf8',
    cleavage: 'Oblique {001} ∧ {010} ≈ 89.7°',
    opticalProperties: 'Biaxial (−), oblique extinction on all faces',
    bravaisTypes: ['aP'],
    characteristicSymmetry: 'Identity (1) or Inversion Center (-1) only',
    description: 'Completely general oblique parallelepiped with 6 independent metric tensor components (a, b, c, α, β, γ) and zero rotational or mirror symmetry.',
    shapeType: 'triclinic'
  }
];

export const CrystalSystemsGallery: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('cubic');
  const uid = useId().replace(/:/g, '');

  const activeItem = GALLERY_SYSTEMS.find(s => s.id === selectedId) || GALLERY_SYSTEMS[0];

  // Unified CAD 3D Shaded Polyhedron Thumbnail for each Crystal System
  const renderShapeSvg = (sys: SystemGalleryItem, isSelected: boolean) => {
    const w = 130;
    const h = 106;
    const strokeFront = isSelected ? '#38bdf8' : '#64748b';
    const strokeBack = isSelected ? '#1e3a5f' : '#334155';

    const commonDefs = (
      <defs>
        <linearGradient id={`galTop-${sys.id}-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isSelected ? '#38bdf8' : '#94a3b8'} stopOpacity={isSelected ? '0.26' : '0.12'} />
          <stop offset="100%" stopColor={isSelected ? '#0284c7' : '#334155'} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`galFront-${sys.id}-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isSelected ? '#0ea5e9' : '#475569'} stopOpacity={isSelected ? '0.14' : '0.07'} />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`galRight-${sys.id}-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isSelected ? '#0369a1' : '#334155'} stopOpacity={isSelected ? '0.20' : '0.10'} />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id={`galVert-${sys.id}-${uid}`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor={isSelected ? '#7dd3fc' : '#94a3b8'} />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
    );

    const renderCadBox = (
      front: [number, number][],
      back: [number, number][],
      annotation: React.ReactNode
    ) => {
      const topPoly = [front[3], front[2], back[2], back[3]].map(p => p.join(',')).join(' ');
      const rightPoly = [front[1], back[1], back[2], front[2]].map(p => p.join(',')).join(' ');
      const frontPoly = front.map(p => p.join(',')).join(' ');
      const backPoly = back.map(p => p.join(',')).join(' ');

      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto select-none">
          {commonDefs}
          <polygon points={backPoly} fill="none" stroke={strokeBack} strokeWidth="0.9" strokeDasharray="2.5 2" />
          <line x1={front[0][0]} y1={front[0][1]} x2={back[0][0]} y2={back[0][1]} stroke={strokeBack} strokeWidth="0.9" strokeDasharray="2.5 2" />
          <polygon points={topPoly} fill={`url(#galTop-${sys.id}-${uid})`} />
          <polygon points={rightPoly} fill={`url(#galRight-${sys.id}-${uid})`} />
          <polygon points={frontPoly} fill={`url(#galFront-${sys.id}-${uid})`} stroke={strokeFront} strokeWidth="1.2" strokeLinejoin="round" />
          <line x1={front[1][0]} y1={front[1][1]} x2={back[1][0]} y2={back[1][1]} stroke={strokeFront} strokeWidth="1.1" />
          <line x1={front[2][0]} y1={front[2][1]} x2={back[2][0]} y2={back[2][1]} stroke={strokeFront} strokeWidth="1.1" />
          <line x1={front[3][0]} y1={front[3][1]} x2={back[3][0]} y2={back[3][1]} stroke={strokeFront} strokeWidth="1.1" />
          {annotation}
          {[...back, ...front].map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r="2.2" fill={`url(#galVert-${sys.id}-${uid})`} />
          ))}
        </svg>
      );
    };

    switch (sys.shapeType) {
      case 'cube':
        return renderCadBox(
          [[34, 76], [78, 76], [78, 32], [34, 32]],
          [[52, 58], [96, 58], [96, 14], [52, 14]],
          <g>
            <line x1="34" y1="76" x2="96" y2="14" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" />
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">a = b = c · 90°</text>
          </g>
        );

      case 'tetragonal':
        return renderCadBox(
          [[40, 82], [74, 82], [74, 22], [40, 22]],
          [[56, 68], [90, 68], [90, 8], [56, 8]],
          <g>
            <line x1="65" y1="75" x2="65" y2="15" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" />
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">a = b ≠ c · 90°</text>
          </g>
        );

      case 'orthorhombic':
        return renderCadBox(
          [[28, 78], [82, 78], [82, 34], [28, 34]],
          [[46, 62], [100, 62], [100, 18], [46, 18]],
          <g>
            <polyline points="28,70 36,70 36,78" fill="none" stroke="#38bdf8" strokeWidth="1" />
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">a ≠ b ≠ c · 90°</text>
          </g>
        );

      case 'hexagonal_prism':
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto select-none">
            {commonDefs}
            <polygon points="65,54 90,63 90,77 65,86 40,77 40,63" fill="none" stroke={strokeBack} strokeWidth="0.9" strokeDasharray="2 1.5" />
            <polygon points="40,32 65,41 65,86 40,77" fill={`url(#galFront-${sys.id}-${uid})`} />
            <polygon points="65,41 90,32 90,77 65,86" fill={`url(#galRight-${sys.id}-${uid})`} />
            <polygon points="65,10 90,19 90,32 65,41 40,32 40,19" fill={`url(#galTop-${sys.id}-${uid})`} stroke={strokeFront} strokeWidth="1.2" />
            <line x1="40" y1="19" x2="40" y2="63" stroke={strokeFront} strokeWidth="1" />
            <line x1="40" y1="32" x2="40" y2="77" stroke={strokeFront} strokeWidth="1.1" />
            <line x1="65" y1="41" x2="65" y2="86" stroke={strokeFront} strokeWidth="1.2" />
            <line x1="90" y1="32" x2="90" y2="77" stroke={strokeFront} strokeWidth="1.1" />
            <line x1="90" y1="19" x2="90" y2="63" stroke={strokeFront} strokeWidth="1" />
            <line x1="65" y1="25" x2="65" y2="70" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" />
            {[[65, 10], [90, 19], [90, 32], [65, 41], [40, 32], [40, 19]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2" fill={`url(#galVert-${sys.id}-${uid})`} />
            ))}
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">γ = 120° · [0001]</text>
          </svg>
        );

      case 'rhombohedron':
        return renderCadBox(
          [[32, 78], [78, 78], [90, 36], [44, 36]],
          [[48, 60], [94, 60], [106, 18], [60, 18]],
          <g>
            <line x1="32" y1="78" x2="106" y2="18" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" />
            <path d="M 42,78 A 10 10 0 0 0 36,68" fill="none" stroke="#f59e0b" strokeWidth="1.1" />
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">α = β = γ ≠ 90°</text>
          </g>
        );

      case 'monoclinic':
        return renderCadBox(
          [[28, 78], [76, 78], [92, 34], [44, 34]],
          [[44, 62], [92, 62], [108, 18], [60, 18]],
          <g>
            <path d="M 66,78 A 10 10 0 0 1 80,68" fill="none" stroke="#f59e0b" strokeWidth="1.15" />
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">α = γ = 90°, β ≠ 90°</text>
          </g>
        );

      case 'triclinic':
        return renderCadBox(
          [[28, 80], [74, 74], [94, 34], [48, 40]],
          [[44, 62], [90, 56], [110, 16], [64, 22]],
          <g>
            <circle cx="69" cy="48" r="2.8" fill="none" stroke="#f59e0b" strokeWidth="1.1" />
            <circle cx="69" cy="48" r="1" fill="#f59e0b" />
            <text x="65" y="96" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">α ≠ β ≠ γ ≠ 90°</text>
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 font-semibold">
            <span>Crystallographic System Atlas</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">7 Holohedral Point-Group Classes &amp; Optical Indicatrices</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            The 7 Crystal Systems &amp; Representative Minerals
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Comparative CAD wireframes, axial/angular metric constraints, representative mineral realizations, and optical indicatrix tensors across all seven holohedral symmetry classes.
          </p>
        </div>
      </div>

      {/* 7 Crystal Systems CAD Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {GALLERY_SYSTEMS.map((sys) => {
          const isSelected = sys.id === selectedId;
          return (
            <button
              key={sys.id}
              onClick={() => { playSynthTone('tick'); setSelectedId(sys.id); }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-[#0F172A] border-cyan-500/80 text-white'
                  : 'bg-[#070A12] border-slate-800/90 hover:border-slate-700 hover:bg-[#0B0F19]'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-100">{sys.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500">#{sys.orderRank}</span>
                </div>

                <div className="text-[10px] font-mono text-slate-300 truncate">
                  {sys.axialRelation}
                </div>
                <div className="text-[9px] font-mono text-cyan-400 truncate">
                  {sys.angleRelation}
                </div>

                {/* 3D CAD Polyhedron */}
                <div className="my-2.5 py-1 bg-[#05080F] rounded-lg border border-slate-800/80">
                  {renderShapeSvg(sys, isSelected)}
                </div>

                {/* Mineral Realization */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-200 truncate">{sys.mineralName}</div>
                  <div className="text-[10px] font-mono text-amber-400 truncate">{sys.mineralFormula}</div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected System Deep Scientific Profile */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Mineralogical & Physical Tensor Profile */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Reference Mineral Specimen
              </span>
              <h3 className="text-xl font-bold text-slate-100">{activeItem.mineralName}</h3>
            </div>
          </div>

          <div className="bg-[#070A12] p-4 rounded-xl border border-slate-800/90 space-y-2.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
              <span className="text-slate-400 font-sans">Chemical Formula</span>
              <span className="font-semibold text-amber-400">{activeItem.mineralFormula}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
              <span className="text-slate-400 font-sans">Classification &amp; Space Group</span>
              <span className="text-slate-200">{activeItem.mineralClass}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
              <span className="text-slate-400 font-sans">Morphological Habit</span>
              <span className="text-slate-200">{activeItem.mineralColor}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
              <span className="text-slate-400 font-sans">Cleavage Planes</span>
              <span className="text-cyan-300">{activeItem.cleavage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Optical Indicatrix</span>
              <span className="text-slate-300 font-sans text-right">{activeItem.opticalProperties}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeItem.description}
          </p>
        </div>

        {/* Right Col: Symmetry & Optical Indicatrix CAD Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                Holohedral Symmetry &amp; Tensor Anisotropy
              </span>
              <h4 className="text-xl font-bold text-slate-100">{activeItem.name} System Metrology</h4>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-500 text-[11px]">Pearson:</span>
              {activeItem.bravaisTypes.map(t => (
                <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-[#070A12] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Direct Axial Constraint</span>
              <span className="text-slate-100 font-semibold text-sm mt-0.5 block">{activeItem.axialRelation}</span>
            </div>

            <div className="bg-[#070A12] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Interaxial Angle Constraint</span>
              <span className="text-cyan-300 font-semibold text-sm mt-0.5 block">{activeItem.angleRelation}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070A12] border border-slate-800 text-xs flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                Defining Symmetry Requirement
              </span>
              <p className="text-slate-200 leading-relaxed mt-0.5">
                {activeItem.characteristicSymmetry}
              </p>
            </div>
          </div>

          {/* CAD Optical Indicatrix & Point-Group Stereogram SVG */}
          <div className="bg-[#070A12] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span className="font-semibold text-cyan-400">
                FIG · STEREOGRAPHIC POINT-GROUP PROJECTION &amp; 3D OPTICAL INDICATRIX ELLIPSOID
              </span>
              <span className="text-slate-500">{activeItem.name} Class</span>
            </div>

            <svg viewBox="0 0 400 138" className="w-full h-auto select-none">
              <defs>
                <radialGradient id={`indEllipsoid-${uid}`} cx="36%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.45" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.4" />
                </radialGradient>
                <pattern id={`stereoGrid-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#0f172a" strokeWidth="0.6" />
                </pattern>
              </defs>

              {/* Left Viewport: Wulff Stereographic Point-Group Projection */}
              <rect x="4" y="4" width="188" height="130" rx="6" fill={`url(#stereoGrid-${uid})`} stroke="#1e293b" strokeWidth="0.8" />
              <circle cx="98" cy="62" r="40" fill="rgba(15, 23, 42, 0.6)" stroke="#475569" strokeWidth="1.2" />
              <circle cx="98" cy="62" r="20" fill="none" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="2 2" />
              <line x1="52" y1="62" x2="144" y2="62" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="98" y1="16" x2="98" y2="108" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />

              {activeItem.id === 'cubic' && (
                <g>
                  <line x1="70" y1="34" x2="126" y2="90" stroke="#38bdf8" strokeWidth="1.1" />
                  <line x1="126" y1="34" x2="70" y2="90" stroke="#38bdf8" strokeWidth="1.1" />
                  <rect x="94.5" y="58.5" width="7" height="7" fill="#38bdf8" />
                  {[[78, 42], [118, 42], [78, 82], [118, 82]].map(([x, y], i) => (
                    <polygon key={i} points={`${x},${y - 4.5} ${x - 4},${y + 3} ${x + 4},${y + 3}`} fill="#f59e0b" />
                  ))}
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    m-3m · Four ⟨111⟩ Triads + Three ⟨100⟩ Tetrads
                  </text>
                </g>
              )}

              {activeItem.id === 'tetragonal' && (
                <g>
                  <line x1="58" y1="62" x2="138" y2="62" stroke="#38bdf8" strokeWidth="1.3" />
                  <line x1="98" y1="22" x2="98" y2="102" stroke="#38bdf8" strokeWidth="1.3" />
                  <line x1="70" y1="34" x2="126" y2="90" stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" />
                  <line x1="126" y1="34" x2="70" y2="90" stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" />
                  <rect x="94" y="58" width="8" height="8" fill="#f59e0b" />
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    4/mmm · Principal [001] Tetrad + 4 Mirrors
                  </text>
                </g>
              )}

              {activeItem.id === 'orthorhombic' && (
                <g>
                  <line x1="58" y1="62" x2="138" y2="62" stroke="#38bdf8" strokeWidth="1.4" />
                  <line x1="98" y1="22" x2="98" y2="102" stroke="#38bdf8" strokeWidth="1.4" />
                  <ellipse cx="98" cy="62" rx="3.5" ry="6.5" fill="#f59e0b" />
                  <ellipse cx="98" cy="22" rx="5.5" ry="2.8" fill="#38bdf8" />
                  <ellipse cx="138" cy="62" rx="2.8" ry="5.5" fill="#38bdf8" />
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    mmm · Three Orthogonal 2-Fold Diads (a ⊥ b ⊥ c)
                  </text>
                </g>
              )}

              {activeItem.id === 'hexagonal' && (
                <g>
                  {[0, 30, 60, 90, 120, 150].map((ang) => {
                    const rad = (ang * Math.PI) / 180;
                    return (
                      <line
                        key={ang}
                        x1={98 - 40 * Math.cos(rad)}
                        y1={62 - 40 * Math.sin(rad)}
                        x2={98 + 40 * Math.cos(rad)}
                        y2={62 + 40 * Math.sin(rad)}
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                    );
                  })}
                  <polygon points="98,55 104,58.5 104,65.5 98,69 92,65.5 92,58.5" fill="#f59e0b" />
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    6/mmm · Principal [0001] Hexad + 6 Mirrors
                  </text>
                </g>
              )}

              {activeItem.id === 'trigonal' && (
                <g>
                  {[0, 60, 120].map((ang) => {
                    const rad = (ang * Math.PI) / 180;
                    return (
                      <line
                        key={ang}
                        x1={98 - 40 * Math.cos(rad)}
                        y1={62 - 40 * Math.sin(rad)}
                        x2={98 + 40 * Math.cos(rad)}
                        y2={62 + 40 * Math.sin(rad)}
                        stroke="#38bdf8"
                        strokeWidth="1.15"
                      />
                    );
                  })}
                  <polygon points="98,55 104,66 92,66" fill="#f59e0b" />
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    -3m · Rotoinversion Triad + 3 Dihedral Mirrors
                  </text>
                </g>
              )}

              {activeItem.id === 'monoclinic' && (
                <g>
                  <circle cx="98" cy="62" r="40" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                  <ellipse cx="98" cy="62" rx="4" ry="7" fill="#f59e0b" />
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    2/m · Unique [010] Diad Axis ⊥ Mirror Plane m
                  </text>
                </g>
              )}

              {activeItem.id === 'triclinic' && (
                <g>
                  <circle cx="98" cy="62" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                  <circle cx="98" cy="62" r="1.6" fill="#f59e0b" />
                  <text x="98" y="124" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                    -1 (Pinacoidal) · Inversion Center Only
                  </text>
                </g>
              )}

              {/* Right Viewport: 3D Shaded Optical Indicatrix Ellipsoid */}
              <rect x="200" y="4" width="196" height="130" rx="6" fill={`url(#stereoGrid-${uid})`} stroke="#1e293b" strokeWidth="0.8" />
              {activeItem.id === 'cubic' ? (
                <g>
                  <circle cx="298" cy="60" r="34" fill={`url(#indEllipsoid-${uid})`} stroke="#38bdf8" strokeWidth="1.3" />
                  <ellipse cx="298" cy="60" rx="34" ry="11" fill="none" stroke="#7dd3fc" strokeWidth="0.9" strokeDasharray="3 2" />
                  <ellipse cx="298" cy="60" rx="11" ry="34" fill="none" stroke="#7dd3fc" strokeWidth="0.9" strokeDasharray="3 2" />
                  <text x="298" y="124" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    Isotropic Sphere · n_x = n_y = n_z
                  </text>
                </g>
              ) : activeItem.id === 'tetragonal' || activeItem.id === 'hexagonal' || activeItem.id === 'trigonal' ? (
                <g>
                  <ellipse cx="298" cy="60" rx="25" ry="36" fill={`url(#indEllipsoid-${uid})`} stroke="#38bdf8" strokeWidth="1.3" />
                  <ellipse cx="298" cy="60" rx="25" ry="9" fill="none" stroke="#7dd3fc" strokeWidth="0.9" strokeDasharray="3 2" />
                  <line x1="298" y1="18" x2="298" y2="102" stroke="#f59e0b" strokeWidth="1.3" />
                  <text x="304" y="28" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">n_ε (Optic Axis c)</text>
                  <text x="298" y="124" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    Uniaxial Ellipsoid · n_ω ≠ n_ε
                  </text>
                </g>
              ) : (
                <g>
                  <ellipse
                    cx="298"
                    cy="60"
                    rx="36"
                    ry="24"
                    transform={activeItem.id === 'monoclinic' ? 'rotate(-15 298 60)' : activeItem.id === 'triclinic' ? 'rotate(20 298 60)' : undefined}
                    fill={`url(#indEllipsoid-${uid})`}
                    stroke="#38bdf8"
                    strokeWidth="1.3"
                  />
                  <ellipse
                    cx="298"
                    cy="60"
                    rx="36"
                    ry="9"
                    transform={activeItem.id === 'monoclinic' ? 'rotate(-15 298 60)' : activeItem.id === 'triclinic' ? 'rotate(20 298 60)' : undefined}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="0.85"
                    strokeDasharray="3 2"
                  />
                  <line x1="270" y1="32" x2="326" y2="88" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" />
                  <line x1="326" y1="32" x2="270" y2="88" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" />
                  <text x="298" y="42" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    2V Optic Axial Angle
                  </text>
                  <text x="298" y="124" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    Biaxial Triaxial · n_α &lt; n_β &lt; n_γ
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
