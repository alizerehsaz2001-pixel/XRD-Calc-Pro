import React, { useState } from 'react';
import { LatticeParameters } from '../../types';
import { MagneticAtom, MagneticMetrics } from '../../utils/magneticDiffractionPhysics';
import { Sparkles, Bot, Zap, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

interface MagneticAIAdvisorProps {
  lattice: LatticeParameters;
  atoms: MagneticAtom[];
  metrics: MagneticMetrics;
  kVector: { x: number; y: number; z: number };
  temperature: number;
  criticalTemp: number;
}

export const MagneticAIAdvisor: React.FC<MagneticAIAdvisorProps> = ({
  lattice,
  atoms,
  metrics,
  kVector,
  temperature,
  criticalTemp
}) => {
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      let superexchangeType = 'Goodenough-Kanamori 180° AFM super-exchange via ligand p-orbitals';
      if (metrics.orderType.includes('Ferro') || metrics.orderType.includes('FM')) {
        superexchangeType = '90° Ferromagnetic super-exchange or direct d-d orbital exchange';
      } else if (metrics.orderType.includes('Helimagnetic') || metrics.orderType.includes('Canted')) {
        superexchangeType = 'Antisymmetric Dzyaloshinskii-Moriya (DM) interaction D · (S_i × S_j) competing with Heisenberg exchange';
      }

      const report = `### 🔮 Magnetic Symmetry & Quantum Exchange Analysis

**1. Magnetic Ground State & Ordering:**
- **Order Classification:** ${metrics.orderType}
- **Reduced Magnetization at ${temperature} K:** M(T)/M(0) = ${(metrics.orderParameter * 100).toFixed(1)}% (Order parameter is ${metrics.orderParameter > 0.1 ? 'active' : 'vanished in paramagnetic regime'})
- **Total Sublattice Moment:** ${metrics.totalSublatticeMomentT.toFixed(2)} μB per unit cell.

**2. Quantum Exchange Coupling Mechanisms:**
- **Dominant Interaction:** ${superexchangeType}
- **Frustration Parameter f = |θ_CW| / T_N:** ${metrics.frustrationIndex.toFixed(2)} (${metrics.frustrationIndex > 5 ? 'Strongly frustrated geometry' : 'Conventional unfrustrated ordering'})
- **Weiss Constant θ_CW:** ${metrics.weissConstant.toFixed(1)} K

**3. Recommended Beamline & Polarimetry Techniques:**
- **Diffraction Geometry:** High-resolution cold/thermal neutron powder diffractometer (e.g. D20/D2B at ILL, POWGEN at SNS, WISH at ISIS).
- **Polarization Method:** Longitudinal XYZ Polarimetry (CryoPAD or MuPA) to unambiguously separate nuclear, magnetic, and chiral components.`;

      setAnalysisReport(report);
      setAnalyzing(false);
    }, 500);
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              AI Magnetic Crystallography Advisor
            </h3>
            <p className="text-[10px] text-slate-400">
              Exchange Hamiltonian analysis, Shubnikov magnetic symmetry &amp; beamline optimization
            </p>
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{analyzing ? 'Analyzing Quantum Symmetry...' : 'Analyze Magnetic Hamiltonian'}</span>
        </button>
      </div>

      {/* Report area */}
      <div className="bg-[#060a14] rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-300 leading-relaxed max-h-[260px] overflow-y-auto">
        {analysisReport ? (
          <div className="space-y-3 whitespace-pre-wrap">
            {analysisReport}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-center">
            <Cpu className="w-8 h-8 mb-2 opacity-50 text-indigo-400" />
            <p className="text-xs">Click "Analyze Magnetic Hamiltonian" to inspect quantum spin exchange, Dzyaloshinskii-Moriya canting, and beamline recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
