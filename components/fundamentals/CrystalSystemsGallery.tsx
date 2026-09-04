import React, { useState } from 'react';
import { 
  Box, 
  Sparkles, 
  Layers, 
  Info, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Compass
} from 'lucide-react';
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
  // Specialized 3D projection parameters for the thumbnail
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
    mineralClass: 'Halide Mineral',
    mineralColor: 'Purple / Violet / Blue',
    mineralColorHex: '#a855f7',
    cleavage: 'Perfect Octahedral {111} in 4 directions',
    opticalProperties: 'Isotropic (n = 1.434), no double refraction',
    bravaisTypes: ['P', 'I', 'F'],
    characteristicSymmetry: 'Four 3-fold axes along ⟨111⟩ body diagonals',
    description: 'Perfect isometric symmetry. Crystal habits commonly exhibit sharp cubes {100}, octahedra {111}, or dodecahedra.',
    shapeType: 'cube'
  },
  {
    id: 'tetragonal',
    name: 'Tetragonal',
    orderRank: 4,
    axialRelation: 'a = b ≠ c',
    angleRelation: 'α = β = γ = 90°',
    mineralName: 'Wulfenite',
    mineralFormula: 'PbMoO₄',
    mineralClass: 'Molybdate Mineral',
    mineralColor: 'Vibrant Orange / Honey Yellow',
    mineralColorHex: '#f97316',
    cleavage: 'Distinct pyramidal {011}',
    opticalProperties: 'Uniaxial negative, extreme birefringence (δ = 0.100)',
    bravaisTypes: ['P', 'I'],
    characteristicSymmetry: 'One 4-fold axis along [001] c-axis',
    description: 'Square prism base with elongated or tabular height c. Wulfenite famously forms paper-thin tabular square blades.',
    shapeType: 'tetragonal'
  },
  {
    id: 'orthorhombic',
    name: 'Orthorhombic',
    orderRank: 5,
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α = β = γ = 90°',
    mineralName: 'Olivine (Forsterite)',
    mineralFormula: '(Mg,Fe)₂SiO₄',
    mineralClass: 'Nesosilicate Gemstone',
    mineralColor: 'Peridot Olive Green',
    mineralColorHex: '#84cc16',
    cleavage: 'Poor {010} and {100}',
    opticalProperties: 'Biaxial (+), high positive relief in thin section',
    bravaisTypes: ['P', 'I', 'F', 'C'],
    characteristicSymmetry: 'Three mutually perpendicular 2-fold axes or mirror planes',
    description: 'Rectangular prism where all 3 axes are mutually perpendicular but unequal in length. Dominant mineral of Earth’s upper mantle.',
    shapeType: 'orthorhombic'
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal',
    orderRank: 2,
    axialRelation: 'a = b ≠ c',
    angleRelation: 'α = β = 90°, γ = 120°',
    mineralName: 'Emerald (Beryl)',
    mineralFormula: 'Be₃Al₂Si₆O₁₈ : Cr³⁺',
    mineralClass: 'Cyclosilicate Gemstone',
    mineralColor: 'Vivid Emerald Green',
    mineralColorHex: '#10b981',
    cleavage: 'Imperfect basal {0001}',
    opticalProperties: 'Uniaxial negative, pleochroism green to blue-green',
    bravaisTypes: ['P'],
    characteristicSymmetry: 'One 6-fold rotation axis along [0001]',
    description: 'Hexagonal prism constructed from three primitive rhombic cells. Basal planes form 120° diamond grids terminating in 6 prism faces.',
    shapeType: 'hexagonal_prism'
  },
  {
    id: 'trigonal',
    name: 'Trigonal',
    orderRank: 3,
    axialRelation: 'a = b = c',
    angleRelation: 'α = β = γ ≠ 90°',
    mineralName: 'Rhodochrosite',
    mineralFormula: 'MnCO₃',
    mineralClass: 'Carbonate Mineral',
    mineralColor: 'Rose Red / Pink',
    mineralColorHex: '#f43f5e',
    cleavage: 'Perfect Rhombohedral {101̄1} in 3 directions',
    opticalProperties: 'Uniaxial negative, extreme carbonate birefringence (δ = 0.220)',
    bravaisTypes: ['R'],
    characteristicSymmetry: 'One 3-fold rotation axis along the body diagonal',
    description: 'A sheared cube with 3 identical edge lengths and 3 identical oblique angles. Breaks cleanly into rhombohedral cleavage fragments.',
    shapeType: 'rhombohedron'
  },
  {
    id: 'monoclinic',
    name: 'Monoclinic',
    orderRank: 6,
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α = γ = 90°, β ≠ 90°',
    mineralName: 'Azurite',
    mineralFormula: 'Cu₃(CO₃)₂(OH)₂',
    mineralClass: 'Basic Copper Carbonate',
    mineralColor: 'Deep Royal Azure Blue',
    mineralColorHex: '#2563eb',
    cleavage: 'Perfect {011} and fair {100}',
    opticalProperties: 'Biaxial (+), intense pleochroism in polarized light',
    bravaisTypes: ['P', 'C'],
    characteristicSymmetry: 'One 2-fold rotation axis along unique axis b (or m ⊥ b)',
    description: 'Skewed rectangular block leaning along the unique b-axis where β > 90°. Houses space group P2₁/c (#14), the most common in organic chemistry.',
    shapeType: 'monoclinic'
  },
  {
    id: 'triclinic',
    name: 'Triclinic',
    orderRank: 7,
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α ≠ β ≠ γ ≠ 90°',
    mineralName: 'Amazonite (Microcline)',
    mineralFormula: 'KAlSi₃O₈',
    mineralClass: 'Tectosilicate Feldspar',
    mineralColor: 'Blue-Green Turquoise',
    mineralColorHex: '#06b6d4',
    cleavage: 'Nearly right-angle cleavage {001} and {010}',
    opticalProperties: 'Biaxial (-), diagnostic tartan/cross-hatch grid twinning',
    bravaisTypes: ['P'],
    characteristicSymmetry: 'Identity (1) or Inversion Center (1̄) only',
    description: 'Completely skewed parallelepiped with all 3 lengths unequal and all 3 angles non-orthogonal. Lowest spatial symmetry in crystallography.',
    shapeType: 'triclinic'
  }
];

export const CrystalSystemsGallery: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('cubic');

  const activeItem = GALLERY_SYSTEMS.find(s => s.id === selectedId) || GALLERY_SYSTEMS[0];

  // Helper to render scientifically accurate SVG shape thumbnail for each system (Image 2 reproduction)
  const renderShapeSvg = (sys: SystemGalleryItem) => {
    // Canvas 120 x 110
    const w = 130;
    const h = 110;

    switch (sys.shapeType) {
      case 'cube':
        // Isometric Cube: equal sides, right angles
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            {/* Faces */}
            <polygon points="35,75 80,75 80,35 35,35" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
            <polygon points="55,55 100,55 100,15 55,15" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
            {/* Connectors */}
            <line x1="35" y1="75" x2="55" y2="55" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="80" y1="75" x2="100" y2="55" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="80" y1="35" x2="100" y2="15" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="35" y1="35" x2="55" y2="15" stroke="#60a5fa" strokeWidth="1.5" />
            {/* Lattice points */}
            <circle cx="35" cy="75" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="80" cy="75" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="80" cy="35" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="35" cy="35" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="100" cy="55" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="100" cy="15" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="55" cy="15" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          </svg>
        );

      case 'tetragonal':
        // Elongated square prism (c > a)
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            {/* Front rectangle */}
            <polygon points="40,88 80,88 80,22 40,22" fill="none" stroke="#f97316" strokeWidth="1.5" />
            {/* Back rectangle */}
            <polygon points="56,72 96,72 96,6 56,6" fill="none" stroke="#ea580c" strokeWidth="1" strokeDasharray="3 2" />
            {/* Connectors */}
            <line x1="40" y1="88" x2="56" y2="72" stroke="#ea580c" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="80" y1="88" x2="96" y2="72" stroke="#f97316" strokeWidth="1.5" />
            <line x1="80" y1="22" x2="96" y2="6" stroke="#f97316" strokeWidth="1.5" />
            <line x1="40" y1="22" x2="56" y2="6" stroke="#f97316" strokeWidth="1.5" />
            <text x="83" y="55" fill="#fdba74" fontSize="9" fontFamily="monospace">c</text>
            <text x="56" y="98" fill="#fdba74" fontSize="9" fontFamily="monospace">a</text>
          </svg>
        );

      case 'orthorhombic':
        // Rectangular brick: a != b != c
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            <polygon points="30,82 85,82 85,38 30,38" fill="none" stroke="#84cc16" strokeWidth="1.5" />
            <polygon points="48,66 103,66 103,22 48,22" fill="none" stroke="#65a30d" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="30" y1="82" x2="48" y2="66" stroke="#65a30d" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="85" y1="82" x2="103" y2="66" stroke="#84cc16" strokeWidth="1.5" />
            <line x1="85" y1="38" x2="103" y2="22" stroke="#84cc16" strokeWidth="1.5" />
            <line x1="30" y1="38" x2="48" y2="22" stroke="#84cc16" strokeWidth="1.5" />
            <text x="55" y="93" fill="#bef264" fontSize="9" fontFamily="monospace">b</text>
            <text x="89" y="60" fill="#bef264" fontSize="9" fontFamily="monospace">c</text>
            <text x="28" y="72" fill="#bef264" fontSize="9" fontFamily="monospace">a</text>
          </svg>
        );

      case 'hexagonal_prism':
        // Full hexagonal prism as shown in Image 2!
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            {/* Top hexagon */}
            <polygon points="65,10 90,20 90,36 65,46 40,36 40,20" fill="none" stroke="#10b981" strokeWidth="1.5" />
            {/* Bottom hexagon */}
            <polygon points="65,58 90,68 90,84 65,94 40,84 40,68" fill="none" stroke="#059669" strokeWidth="1.2" />
            {/* Vertical pillars */}
            <line x1="40" y1="20" x2="40" y2="68" stroke="#10b981" strokeWidth="1.5" />
            <line x1="40" y1="36" x2="40" y2="84" stroke="#10b981" strokeWidth="1.5" />
            <line x1="65" y1="46" x2="65" y2="94" stroke="#10b981" strokeWidth="1.5" />
            <line x1="90" y1="36" x2="90" y2="84" stroke="#10b981" strokeWidth="1.5" />
            <line x1="90" y1="20" x2="90" y2="68" stroke="#10b981" strokeWidth="1.5" />
            <line x1="65" y1="10" x2="65" y2="58" stroke="#059669" strokeWidth="1" strokeDasharray="3 2" />
            {/* Inner rhombic lines */}
            <line x1="65" y1="46" x2="65" y2="28" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="40" y1="36" x2="65" y2="28" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="90" y1="36" x2="65" y2="28" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="2 2" />
            <text x="94" y="60" fill="#6ee7b7" fontSize="9" fontFamily="monospace">c</text>
            <text x="46" y="98" fill="#6ee7b7" fontSize="9" fontFamily="monospace">a</text>
          </svg>
        );

      case 'rhombohedron':
        // Sheared cube with equal sides a=b=c and oblique angle alpha (Image 2)
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            {/* Sheared front rhombus */}
            <polygon points="35,80 82,80 95,38 48,38" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Sheared back rhombus */}
            <polygon points="50,60 97,60 110,18 63,18" fill="none" stroke="#e11d48" strokeWidth="1" strokeDasharray="3 2" />
            {/* Connectors */}
            <line x1="35" y1="80" x2="50" y2="60" stroke="#e11d48" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="82" y1="80" x2="97" y2="60" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="95" y1="38" x2="110" y2="18" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="48" y1="38" x2="63" y2="18" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Angle alpha arc */}
            <path d="M 45,80 A 10 10 0 0 1 40,70" fill="none" stroke="#fda4af" strokeWidth="1.5" />
            <text x="44" y="73" fill="#fda4af" fontSize="8" fontFamily="monospace">α</text>
            <text x="56" y="92" fill="#fda4af" fontSize="9" fontFamily="monospace">a</text>
          </svg>
        );

      case 'monoclinic':
        // Leaning along b, beta > 90° (Image 2)
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            {/* Front parallelogram */}
            <polygon points="30,80 80,80 98,34 48,34" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            {/* Back parallelogram */}
            <polygon points="45,66 95,66 113,20 63,20" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="3 2" />
            {/* Connectors */}
            <line x1="30" y1="80" x2="45" y2="66" stroke="#2563eb" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="80" y1="80" x2="95" y2="66" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="98" y1="34" x2="113" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="48" y1="34" x2="63" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
            {/* Beta angle marker */}
            <path d="M 72,80 A 12 12 0 0 1 84,68" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
            <text x="80" y="72" fill="#93c5fd" fontSize="9" fontFamily="monospace">β</text>
            <text x="50" y="92" fill="#93c5fd" fontSize="9" fontFamily="monospace">b</text>
            <text x="96" y="55" fill="#93c5fd" fontSize="9" fontFamily="monospace">c</text>
          </svg>
        );

      case 'triclinic':
        // All angles skewed (Image 2)
        return (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 mx-auto">
            <polygon points="32,82 78,82 102,36 56,36" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
            <polygon points="44,64 90,64 114,18 68,18" fill="none" stroke="#0891b2" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="32" y1="82" x2="44" y2="64" stroke="#0891b2" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="78" y1="82" x2="90" y2="64" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="102" y1="36" x2="114" y2="18" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="56" y1="36" x2="68" y2="18" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="52" y="93" fill="#67e8f9" fontSize="9" fontFamily="monospace">b</text>
            <text x="96" y="52" fill="#67e8f9" fontSize="9" fontFamily="monospace">c</text>
            <text x="32" y="70" fill="#67e8f9" fontSize="9" fontFamily="monospace">a</text>
            <text x="70" y="76" fill="#67e8f9" fontSize="8" fontFamily="monospace">β</text>
            <text x="44" y="32" fill="#67e8f9" fontSize="8" fontFamily="monospace">γ</text>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ScienceNotes Master Chart • Image 2
            </span>
            <span className="text-xs text-slate-400 font-mono">Mineralogy & Symmetry Gallery</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            The 7 Crystal Systems & Representative Minerals
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Side-by-side scientific comparison of all 7 crystal systems featuring exact geometric cell wireframes with angles, and iconic geological minerals (Fluorite, Wulfenite, Olivine, Emerald, Rhodochrosite, Azurite, Amazonite).
          </p>
        </div>
      </div>

      {/* 7 Systems Horizontal Visual Grid (Direct reproduction of Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {GALLERY_SYSTEMS.map((sys) => {
          const isSelected = sys.id === selectedId;
          return (
            <div
              key={sys.id}
              onClick={() => { playSynthTone('tick'); setSelectedId(sys.id); }}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected 
                  ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              {/* Header Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-white">{sys.name}</span>
                  <span className="text-[9px] font-mono text-slate-500">#{sys.orderRank}</span>
                </div>

                <div className="text-[10px] font-mono text-indigo-300 font-semibold truncate">
                  {sys.axialRelation}
                </div>
                <div className="text-[9px] font-mono text-cyan-300 truncate">
                  {sys.angleRelation}
                </div>

                {/* 3D Shape Thumbnail */}
                <div className="my-3 py-1 bg-slate-950/90 rounded-2xl border border-slate-800/60">
                  {renderShapeSvg(sys)}
                </div>

                {/* Featured Mineral */}
                <div className="text-center pt-1 border-t border-slate-800/80">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: sys.mineralColorHex }} />
                  <div className="text-xs font-bold text-white truncate">{sys.mineralName}</div>
                  <div className="text-[9px] font-mono text-emerald-400 truncate">{sys.mineralFormula}</div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected System Deep Scientific Profile */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Mineral Profile */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: activeItem.mineralColorHex }}
            >
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Representative Mineral Specimen
              </span>
              <h3 className="text-2xl font-black text-white">{activeItem.mineralName}</h3>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Chemical Formula</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{activeItem.mineralFormula}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Mineral Classification</span>
              <span className="text-slate-200 font-bold">{activeItem.mineralClass}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Characteristic Specimen Color</span>
              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeItem.mineralColorHex }} />
                {activeItem.mineralColor}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cleavage Planes</span>
              <span className="font-mono text-cyan-300 font-bold">{activeItem.cleavage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Optical Behavior</span>
              <span className="text-slate-300 font-medium">{activeItem.opticalProperties}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {activeItem.description}
          </p>
        </div>

        {/* Right Col: Crystallographic & Symmetry Framework */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-indigo-400 block font-bold">
              Crystallographic Symmetries
            </span>
            <h4 className="text-xl font-bold text-white">{activeItem.name} System Symmetry Profile</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block">Axial Metric</span>
              <span className="text-indigo-300 font-bold text-sm">{activeItem.axialRelation}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block">Angle Metric</span>
              <span className="text-cyan-300 font-bold text-sm">{activeItem.angleRelation}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">
              Indispensable Symmetry Element
            </span>
            <p className="text-slate-200 leading-relaxed font-medium">
              {activeItem.characteristicSymmetry}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Allowed Bravais Lattices:</span>
            <div className="flex gap-2 font-mono font-bold text-amber-400">
              {activeItem.bravaisTypes.map(t => (
                <span key={t} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
