import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  ChevronDown,
  Sliders,
  AlertTriangle,
  Copy,
  Check,
  TrendingUp,
  RotateCcw,
  Flame,
  Home,
  Globe,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MathFormula, EquationPlate, formatSymbolToTex } from './common/MathFormula';

interface MathVariable {
  symbol: string;
  value: number | string;
  unit: string;
  name: string;
}

interface ScientificMathControlProps {
  title?: string;
  formula: string;
  description: string;
  variables: MathVariable[];
  result: number | string;
  resultUnit: string;
  resultName: string;
}

const getVar = (vars: Record<string, number>, keys: string[], fallback: number): number => {
  for (const key of keys) {
    if (vars[key] !== undefined && !isNaN(vars[key])) return vars[key];
  }
  return fallback;
};

const getUnitByKeys = (variables: MathVariable[], keys: string[]): string => {
  for (const key of keys) {
    const found = variables.find((v) => v.symbol === key);
    if (found) return found.unit || '';
  }
  return '';
};

const wavelengthToNmFactor = (lambda: number, unit: string): { factor: number; unitTex: string } => {
  const u = unit.trim().toLowerCase();
  if (u === 'nm') return { factor: 1, unitTex: '\\mathrm{nm}' };
  if (u === 'pm') return { factor: 0.001, unitTex: '\\mathrm{pm}' };
  if (u === 'µm' || u === 'um') return { factor: 1000, unitTex: '\\mu\\mathrm{m}' };
  if (u === 'å' || u === 'a' || u === 'angstrom') return { factor: 0.1, unitTex: '\\text{\\AA}' };
  // Fallback heuristic when no explicit unit is provided
  return lambda > 0.5
    ? { factor: 0.1, unitTex: '\\text{\\AA}' }
    : { factor: 1, unitTex: '\\mathrm{nm}' };
};

const inferDimensionalTag = (title: string, unit: string): string => {
  const t = title.toLowerCase();
  if (t.includes('scherrer') || t.includes('bragg') || t.includes('d-spacing') || t.includes('lattice') || t.includes('size-strain separation')) {
    return unit ? `[L] · ${unit}` : '[L]';
  }
  if (t.includes('williamson') || t.includes('integral breadth') || t.includes('deconvolution') || t.includes('caglioti')) {
    return '[1] · rad';
  }
  if (t.includes('density')) return '[M·L⁻³] · g/cm³';
  if (t.includes('mass-energy') || t.includes('einstein') || t.includes('rest energy') || t.includes('neutron')) {
    return '[M·L²·T⁻²]';
  }
  if (t.includes('curie') || t.includes('susceptibility')) return '[emu/mol]';
  if (t.includes('structure factor') || t.includes('march-dollase') || t.includes('pseudo-voigt')) {
    return 'Dimensionless [1]';
  }
  return unit ? `Unit · ${unit}` : 'Analytical Relation';
};

// Map formulas to rigorous numerical evaluators & multi-line LaTeX derivations
const evaluateFormula = (
  formulaTitle: string,
  vars: Record<string, number>,
  variables: MathVariable[],
  originalResult: number
): { value: number; unit: string; steps: string } => {
  const titleLower = formulaTitle.toLowerCase();

  if (titleLower.includes('bragg')) {
    const lambda = getVar(vars, ['λ', 'lambda'], 1.54056);
    const theta = getVar(vars, ['θ', 'theta'], 0.25);
    const n = getVar(vars, ['n'], 1);
    const sinTheta = Math.sin(theta);
    const num = n * lambda;
    const den = 2 * sinTheta;
    const d = den !== 0 ? num / den : 0;
    return {
      value: d,
      unit: 'Å',
      steps: `\\begin{aligned}
d_{hkl} &= \\frac{n\\,\\lambda}{2\\sin\\theta} = \\frac{${n} \\times ${lambda.toFixed(5)}\\,\\text{\\AA}}{2\\sin(${theta.toFixed(4)}\\,\\mathrm{rad})} \\\\[4pt]
&= \\frac{${num.toFixed(5)}\\,\\text{\\AA}}{${den.toFixed(5)}} = \\mathbf{${d.toFixed(4)}\\,\\text{\\AA}}
\\end{aligned}`,
    };
  }

  if (titleLower.includes('scherrer')) {
    const K = getVar(vars, ['K_hkl', 'K', 'k'], 0.9);
    const lambda = getVar(vars, ['λ', 'lambda'], 1.54056);
    const beta = getVar(vars, ['β_s', 'β_sample', 'β', 'beta'], 0.01);
    const theta = getVar(vars, ['θ', 'theta'], 0.25);
    const lambdaUnit = getUnitByKeys(variables, ['λ', 'lambda']);
    const { factor, unitTex } = wavelengthToNmFactor(lambda, lambdaUnit);
    const lambdaNm = lambda * factor;
    const cosTheta = Math.cos(theta);
    const num = K * lambdaNm;
    const den = beta * cosTheta;
    const Dv = den !== 0 ? num / den : 0;
    return {
      value: Dv,
      unit: 'nm',
      steps: `\\begin{aligned}
D_{hkl} &= \\frac{K_{hkl}\\,\\lambda}{\\beta_{\\mathrm{s}}\\cos\\theta} = \\frac{${K.toFixed(3)} \\times ${lambda.toFixed(5)}\\,${unitTex}${factor !== 1 ? ` \\times ${factor}` : ''}}{${beta.toFixed(5)}\\,\\mathrm{rad} \\times \\cos(${theta.toFixed(4)}\\,\\mathrm{rad})} \\\\[4pt]
&= \\frac{${num.toFixed(5)}\\,\\mathrm{nm}}{${den.toFixed(6)}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}}
\\end{aligned}`,
    };
  }

  if (titleLower.includes('size-strain separation')) {
    const K = getVar(vars, ['K', 'K_hkl'], 1.0);
    const lambda = getVar(vars, ['λ', 'lambda'], 1.5406);
    const m = getVar(vars, ['m', 'Slope'], 0.001);
    const c = getVar(vars, ['c', 'Intercept'], 0.002);
    const E_GPa = getVar(vars, ['E', 'E_0'], 130);
    const lambdaUnit = getUnitByKeys(variables, ['λ', 'lambda']);
    const { factor, unitTex } = wavelengthToNmFactor(lambda, lambdaUnit);
    const lambdaNm = lambda * factor;
    const lambdaAngstrom = lambdaNm * 10;
    const fmtSci = (v: number) =>
      v === 0 ? '0' : Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5 ? v.toExponential(4) : v.toFixed(5);

    if (titleLower.includes('(hw ') || titleLower.includes('halder-wagner')) {
      const Dv = m > 1e-12 ? (K * lambdaNm) / m : 0;
      const eps = c > 0 ? Math.sqrt(c) / 4 : 0;
      return {
        value: Dv,
        unit: 'nm',
        steps: `\\begin{aligned}
D_V &= \\frac{K\\lambda}{m} = \\frac{${K.toFixed(3)} \\times ${lambda.toFixed(4)}\\,${unitTex}${factor !== 1 ? `\\times ${factor}` : ''}}{${fmtSci(m)}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}} \\\\[4pt]
\\varepsilon &= \\frac{\\sqrt{\\max(0, c)}}{4} = \\frac{\\sqrt{${fmtSci(Math.max(0, c))}}}{4} = ${(eps * 1000).toFixed(3)}\\times 10^{-3}\\;(${(eps * 100).toFixed(4)}\\%)
\\end{aligned}`,
      };
    }

    if (titleLower.includes('(ssp ')) {
      const Dv = m > 1e-12 ? (K * lambdaNm) / m : 0;
      const eps = c > 0 && lambdaAngstrom > 0 ? Math.sqrt(c) / (2 * lambdaAngstrom) : 0;
      return {
        value: Dv,
        unit: 'nm',
        steps: `\\begin{aligned}
D_V &= \\frac{K\\lambda}{m} = \\frac{${K.toFixed(3)} \\times ${lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{${fmtSci(m)}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}} \\\\[4pt]
\\varepsilon &= \\frac{\\sqrt{\\max(0, c)}}{2\\lambda} = \\frac{\\sqrt{${fmtSci(Math.max(0, c))}}}{2 \\times ${lambdaAngstrom.toFixed(4)}\\,\\text{\\AA}} = ${(eps * 1000).toFixed(3)}\\times 10^{-3}\\;(${(eps * 100).toFixed(4)}\\%)
\\end{aligned}`,
      };
    }

    if (titleLower.includes('(gwh ') || titleLower.includes('gaussian-wh')) {
      const Dv = c > 1e-16 ? (K * lambdaNm) / Math.sqrt(c) : 0;
      const eps = m > 0 ? Math.sqrt(m) : 0;
      return {
        value: Dv,
        unit: 'nm',
        steps: `\\begin{aligned}
D_V &= \\frac{K\\lambda}{\\sqrt{c}} = \\frac{${K.toFixed(3)} \\times ${lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{\\sqrt{${fmtSci(Math.max(0, c))}}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}} \\\\[4pt]
\\varepsilon &= \\sqrt{\\max(0, m)} = \\sqrt{${fmtSci(Math.max(0, m))}} = ${(eps * 1000).toFixed(3)}\\times 10^{-3}\\;(${(eps * 100).toFixed(4)}\\%)
\\end{aligned}`,
      };
    }

    if (titleLower.includes('(usdm ')) {
      const Dv = c > 1e-12 ? (K * lambdaNm) / c : 0;
      const sigmaPa = Math.max(0, m);
      const sigmaMPa = sigmaPa / 1e6;
      const eps = E_GPa > 0 ? sigmaPa / (E_GPa * 1e9) : 0;
      return {
        value: Dv,
        unit: 'nm',
        steps: `\\begin{aligned}
D_V &= \\frac{K\\lambda}{c} = \\frac{${K.toFixed(3)} \\times ${lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{${fmtSci(c)}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}} \\\\[4pt]
\\sigma &= m = ${sigmaMPa.toFixed(2)}\\,\\mathrm{MPa}, \\qquad \\varepsilon = \\frac{\\sigma}{E_0} = \\frac{${sigmaMPa.toFixed(2)}\\,\\mathrm{MPa}}{${E_GPa.toFixed(1)}\\,\\mathrm{GPa}} = ${(eps * 1000).toFixed(3)}\\times 10^{-3}
\\end{aligned}`,
      };
    }

    if (titleLower.includes('(udedm ')) {
      const Dv = c > 1e-12 ? (K * lambdaNm) / c : 0;
      const uJm3 = Math.max(0, m) * Math.max(0, m);
      const uKjM3 = uJm3 / 1000;
      const eps = E_GPa > 0 ? Math.sqrt((2 * uJm3) / (E_GPa * 1e9)) : 0;
      return {
        value: Dv,
        unit: 'nm',
        steps: `\\begin{aligned}
D_V &= \\frac{K\\lambda}{c} = \\frac{${K.toFixed(3)} \\times ${lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{${fmtSci(c)}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}} \\\\[4pt]
u &= m^2 = ${uKjM3.toFixed(3)}\\,\\mathrm{kJ/m}^3, \\qquad \\varepsilon = \\sqrt{\\frac{2u}{E_0}} = ${(eps * 1000).toFixed(3)}\\times 10^{-3}
\\end{aligned}`,
      };
    }

    // UDM & mWH
    const Dv = c > 1e-12 ? (K * lambdaNm) / c : 0;
    const eps = Math.max(0, m);
    return {
      value: Dv,
      unit: 'nm',
      steps: `\\begin{aligned}
D_V &= \\frac{K\\lambda}{c} = \\frac{${K.toFixed(3)} \\times ${lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{${fmtSci(c)}} = \\mathbf{${Dv.toFixed(2)}\\,\\mathrm{nm}} \\\\[4pt]
\\varepsilon &= m = ${(eps * 1000).toFixed(3)}\\times 10^{-3}\\;(${(eps * 100).toFixed(4)}\\%)
\\end{aligned}`,
    };
  }

  if (titleLower.includes('williamson') || titleLower.includes('advanced integral breadth')) {
    const K = getVar(vars, ['K', 'K_hkl'], 0.9);
    const lambda = getVar(vars, ['λ', 'lambda'], 1.54056);
    const D = getVar(vars, ['D', 'D_V', 'D_v'], 20.0);
    const epsilon = getVar(vars, ['ε', 'epsilon'], 0.002);
    const theta = getVar(vars, ['θ', 'theta'], 0.25);
    const lambdaUnit = getUnitByKeys(variables, ['λ', 'lambda']);
    const { factor } = wavelengthToNmFactor(lambda, lambdaUnit);
    const lambdaNm = lambda * factor;
    const term1 = D !== 0 ? (K * lambdaNm) / D : 0;
    const term2 = 4 * epsilon * Math.sin(theta);
    const yVal = term1 + term2;
    return {
      value: yVal,
      unit: 'rad',
      steps: `\\begin{aligned}
\\beta\\cos\\theta &= \\frac{K\\lambda}{D} + 4\\varepsilon\\sin\\theta \\\\[4pt]
&= \\frac{${K.toFixed(3)} \\times ${lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{${D.toFixed(2)}\\,\\mathrm{nm}} + 4(${epsilon.toFixed(5)})\\sin(${theta.toFixed(4)}) \\\\[4pt]
&= ${term1.toFixed(6)} + ${term2.toFixed(6)} = \\mathbf{${yVal.toFixed(6)}\\,\\mathrm{rad}}
\\end{aligned}`,
    };
  }

  if (titleLower.includes('pseudo-voigt')) {
    const eta = getVar(vars, ['η', 'eta'], 0.5);
    const L = getVar(vars, ['L'], 1.0);
    const G = getVar(vars, ['G'], 1.0);
    const I = eta * L + (1 - eta) * G;
    return {
      value: I,
      unit: 'arb. u.',
      steps: `\\begin{aligned}
pV(2\\theta) &= \\eta\\,L(2\\theta) + (1 - \\eta)\\,G(2\\theta) \\\\[4pt]
&= ${eta.toFixed(3)}(${L.toFixed(3)}) + ${(1 - eta).toFixed(3)}(${G.toFixed(3)}) = \\mathbf{${I.toFixed(4)}}
\\end{aligned}`,
    };
  }

  if (titleLower.includes('integral breadth')) {
    const Area = getVar(vars, ['Area', 'area', 'A'], 1.0);
    const Imax = getVar(vars, ['I_{max}', 'I_max', 'Imax'], 1.0);
    const beta = Imax !== 0 ? Area / Imax : 0;
    return {
      value: beta,
      unit: 'rad',
      steps: `\\beta = \\frac{\\int I(2\\theta)\\,\\mathrm{d}(2\\theta)}{I_{\\max}} = \\frac{${Area.toFixed(4)}}{${Imax.toFixed(4)}} = \\mathbf{${beta.toFixed(5)}\\,\\mathrm{rad}}`,
    };
  }

  if (titleLower.includes('lattice parameters')) {
    const d = getVar(vars, ['d', 'd_hkl'], 2.0);
    const h = getVar(vars, ['h'], 1);
    const k = getVar(vars, ['k'], 1);
    const l = getVar(vars, ['l'], 1);
    const s = h * h + k * k + l * l;
    const a = d * Math.sqrt(s);
    return {
      value: a,
      unit: 'Å',
      steps: `a = d_{hkl}\\sqrt{h^2 + k^2 + l^2} = ${d.toFixed(4)}\\sqrt{${h}^2 + ${k}^2 + ${l}^2} = ${d.toFixed(4)}\\sqrt{${s}} = \\mathbf{${a.toFixed(4)}\\,\\text{\\AA}}`,
    };
  }

  if (
    titleLower.includes('deconvolution') ||
    titleLower.includes('instrumental') ||
    titleLower.includes('fwhm verifier') ||
    titleLower.includes('caglioti')
  ) {
    const betaObs = getVar(vars, ['β_obs', 'beta_obs'], 0.01);
    const betaInst = getVar(vars, ['β_inst', 'beta_inst'], 0.002);
    const diff = betaObs * betaObs - betaInst * betaInst;
    const betaSample = diff > 0 ? Math.sqrt(diff) : 0;
    return {
      value: betaSample,
      unit: 'rad',
      steps: `\\beta_{\\mathrm{sample}} = \\sqrt{\\beta_{\\mathrm{obs}}^2 - \\beta_{\\mathrm{inst}}^2} = \\sqrt{(${betaObs.toFixed(5)})^2 - (${betaInst.toFixed(5)})^2} = \\mathbf{${betaSample.toFixed(5)}\\,\\mathrm{rad}}`,
    };
  }

  if (titleLower.includes('warren') || titleLower.includes('fourier')) {
    const A1 = getVar(vars, ['A_1', 'A1'], 0.85);
    const A2 = getVar(vars, ['A_2', 'A2'], 0.7);
    const L = getVar(vars, ['L', 'L_nm'], 10.0);
    const d1 = getVar(vars, ['d_1', 'd1'], 2.35);
    const d2 = getVar(vars, ['d_2', 'd2'], 1.17);
    const s1 = 1 / d1;
    const s2 = 1 / d2;
    const num = Math.log(A1 / A2);
    const den = 2 * Math.PI * Math.PI * L * L * (s2 * s2 - s1 * s1);
    const val = den !== 0 && num / den > 0 ? Math.sqrt(num / den) : 0;
    return {
      value: val,
      unit: '',
      steps: `\\begin{aligned}
\\langle\\varepsilon_L^2\\rangle^{1/2} &= \\sqrt{\\frac{\\ln(A_1 / A_2)}{2\\pi^2 L^2 \\left(d_2^{-2} - d_1^{-2}\\right)}} \\\\[4pt]
&= \\sqrt{\\frac{\\ln(${A1.toFixed(3)} / ${A2.toFixed(3)})}{2\\pi^2(${L.toFixed(1)})^2(${s2.toFixed(4)}^2 - ${s1.toFixed(4)}^2)}} = \\mathbf{${val.toFixed(6)}}
\\end{aligned}`,
    };
  }

  if (
    titleLower.includes('march-dollase') ||
    titleLower.includes('preferred') ||
    titleLower.includes('orientation') ||
    titleLower.includes('texture')
  ) {
    const r = getVar(vars, ['r', 'rValue'], 0.8);
    const alpha = getVar(vars, ['α', 'alpha'], 0.785);
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);
    const term = r * r * cosA * cosA + (sinA * sinA) / r;
    const W = term !== 0 ? Math.pow(term, -1.5) : 0;
    return {
      value: W,
      unit: '',
      steps: `\\begin{aligned}
P_K(r,\\alpha) &= \\left(r^2\\cos^2\\alpha + r^{-1}\\sin^2\\alpha\\right)^{-3/2} \\\\[4pt]
&= \\left(${r.toFixed(3)}^2\\cos^2(${alpha.toFixed(3)}) + \\frac{\\sin^2(${alpha.toFixed(3)})}{${r.toFixed(3)}}\\right)^{-3/2} = \\mathbf{${W.toFixed(4)}}
\\end{aligned}`,
    };
  }

  if (titleLower.includes('neutron de broglie') || titleLower.includes('neutron wavelength') || titleLower.includes('de broglie')) {
    const lambda = getVar(vars, ['λ', 'lambda'], 1.54);
    const E = lambda !== 0 ? 81.8048 / (lambda * lambda) : 0;
    return {
      value: E,
      unit: 'meV',
      steps: `E = \\frac{h^2}{2m_n\\lambda^2} = \\frac{81.8048\\,\\mathrm{meV}\\cdot\\text{\\AA}^2}{(${lambda.toFixed(4)}\\,\\text{\\AA})^2} = \\mathbf{${E.toFixed(2)}\\,\\mathrm{meV}}`,
    };
  }

  if (titleLower.includes('curie') || titleLower.includes('weiss') || titleLower.includes('susceptibility')) {
    const C = getVar(vars, ['C'], 1.5);
    const T = getVar(vars, ['T'], 10.0);
    const thetaP = getVar(vars, ['θ_p', 'theta_p'], 5.0);
    const diff = T - thetaP;
    const chi = diff !== 0 ? C / diff : 0;
    return {
      value: chi,
      unit: 'emu/mol',
      steps: `\\chi(T) = \\frac{C}{T - \\theta_p} = \\frac{${C.toFixed(2)}}{${T.toFixed(1)} - ${thetaP.toFixed(1)}} = \\mathbf{${chi.toFixed(4)}\\,\\mathrm{emu/mol}}`,
    };
  }

  if (titleLower.includes('structure factor') || titleLower.includes('selection') || titleLower.includes('absence')) {
    const h = Math.round(getVar(vars, ['h'], 1));
    const k = Math.round(getVar(vars, ['k'], 1));
    const l = Math.round(getVar(vars, ['l'], 1));
    const f = getVar(vars, ['f'], 1.0);
    const hEven = h % 2 === 0;
    const kEven = k % 2 === 0;
    const lEven = l % 2 === 0;
    const allowed = hEven === kEven && kEven === lEven;
    const F = allowed ? 4 * f : 0;
    return {
      value: F,
      unit: '',
      steps: `\\begin{aligned}
F_{hkl} &= f\\left[1 + e^{i\\pi(h+k)} + e^{i\\pi(k+l)} + e^{i\\pi(h+l)}\\right] \\\\[4pt]
&= ${f.toFixed(2)}\\left[1 + e^{i\\pi(${h}+${k})} + e^{i\\pi(${k}+${l})} + e^{i\\pi(${h}+${l})}\\right] = \\mathbf{${F.toFixed(2)}}
\\end{aligned}`,
    };
  }

  if (
    titleLower.includes('theoretical density') ||
    titleLower.includes('density verification') ||
    titleLower.includes('crystallographic density')
  ) {
    const Z = getVar(vars, ['Z'], 4);
    const M = getVar(vars, ['M'], 28.0855);
    const V = getVar(vars, ['V_cell', 'V'], 160.0);
    const Na = getVar(vars, ['N_A'], 6.02214e23);
    const rho = V !== 0 ? (Z * M) / (Na * V * 1e-24) : 0;
    return {
      value: rho,
      unit: 'g/cm³',
      steps: `\\begin{aligned}
\\rho_{\\mathrm{calc}} &= \\frac{Z\\,M}{N_{\\mathrm{A}}\\,V_{\\mathrm{cell}} \\times 10^{-24}} \\\\[4pt]
&= \\frac{${Math.round(Z)} \\times ${M.toFixed(4)}}{6.02214\\times 10^{23} \\times ${V.toFixed(2)} \\times 10^{-24}} = \\mathbf{${rho.toFixed(4)}\\,\\mathrm{g/cm}^3}
\\end{aligned}`,
    };
  }

  if (
    titleLower.includes('cubic d-spacing') ||
    titleLower.includes('interplanar d-spacing') ||
    titleLower.includes('spacing verification')
  ) {
    const a = getVar(vars, ['a'], 5.43);
    const h = getVar(vars, ['h'], 1);
    const k = getVar(vars, ['k'], 1);
    const l = getVar(vars, ['l'], 1);
    const s = h * h + k * k + l * l;
    const d = s !== 0 ? a / Math.sqrt(s) : 0;
    return {
      value: d,
      unit: 'Å',
      steps: `d_{hkl} = \\frac{a}{\\sqrt{h^2 + k^2 + l^2}} = \\frac{${a.toFixed(4)}\\,\\text{\\AA}}{\\sqrt{${h}^2 + ${k}^2 + ${l}^2}} = \\mathbf{${d.toFixed(5)}\\,\\text{\\AA}}`,
    };
  }

  if (titleLower.includes('mass-energy equivalence') || titleLower.includes('einstein') || titleLower.includes('rest energy')) {
    const m = getVar(vars, ['m'], 1.67e-27);
    const c = getVar(vars, ['c'], 299792458);
    const E = m * c * c;
    const EpJ = E * 1e12;
    const fmt = (v: number) => (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e6 ? v.toExponential(5) : v.toFixed(5));
    return {
      value: EpJ,
      unit: 'pJ',
      steps: `\\begin{aligned}
E &= m\\,c^2 = (${fmt(m)}\\,\\mathrm{kg})(2.99792\\times 10^8\\,\\mathrm{m/s})^2 \\\\[4pt]
&= ${fmt(E)}\\,\\mathrm{J} = \\mathbf{${fmt(EpJ)}\\,\\mathrm{pJ}}
\\end{aligned}`,
    };
  }

  return {
    value: originalResult,
    unit: '',
    steps: `\\mathrm{Evaluated\\ Value} = \\mathbf{${typeof originalResult === 'number' && !isNaN(originalResult) ? originalResult.toFixed(4) : originalResult}}`,
  };
};

const formatNumericReadout = (val: number | string, digits = 4): string => {
  if (typeof val !== 'number') return String(val);
  if (isNaN(val)) return '—';
  if (val !== 0 && (Math.abs(val) < 1e-3 || Math.abs(val) >= 1e6)) {
    return val.toExponential(digits);
  }
  return val.toFixed(digits);
};

export const ScientificMathControl: React.FC<ScientificMathControlProps> = ({
  title = 'Scientific Math Control & Verification',
  formula,
  description,
  variables,
  result,
  resultUnit,
  resultName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showUncertainty, setShowUncertainty] = useState(false);
  const [inputUncertaintyPercent, setInputUncertaintyPercent] = useState(2);
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'latex' | 'python' | 'json'>('latex');
  const [massScale, setMassScale] = useState<'atom' | 'mole' | 'gram' | 'kg' | 'custom'>('atom');
  const [customMassGrams, setCustomMassGrams] = useState<number>(1.0);
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialSims: Record<string, number> = {};
    variables.forEach((v) => {
      const parsed = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
      initialSims[v.symbol] = isNaN(parsed) ? 1 : parsed;
    });
    setSimulatedValues(initialSims);
  }, [variables]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const titleLower = title.toLowerCase();
  const isMassEnergy =
    titleLower.includes('mass-energy equivalence') ||
    titleLower.includes('einstein') ||
    titleLower.includes('rest energy');
  const elementSymbol = title.split(' ')[0] || 'Element';

  const restMassOfSingleAtom = useMemo(() => {
    const v0 = variables[0]?.value;
    return typeof v0 === 'string' ? parseFloat(v0) : v0 || 1.67e-27;
  }, [variables]);

  const atomicWeight = useMemo(() => restMassOfSingleAtom / 1.6605390666e-27, [restMassOfSingleAtom]);

  const mSelected = useMemo(() => {
    if (massScale === 'atom') return restMassOfSingleAtom;
    if (massScale === 'mole') return atomicWeight * 1e-3;
    if (massScale === 'gram') return 1e-3;
    if (massScale === 'kg') return 1.0;
    if (massScale === 'custom') return customMassGrams * 1e-3;
    return restMassOfSingleAtom;
  }, [massScale, restMassOfSingleAtom, atomicWeight, customMassGrams]);

  const currentVariablesMap = useMemo(() => {
    const map: Record<string, number> = {};
    variables.forEach((v) => {
      const rawVal = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
      map[v.symbol] = isSimulating ? (simulatedValues[v.symbol] ?? rawVal) : rawVal;
    });
    if (isMassEnergy && !isSimulating && map['m'] !== undefined) {
      map['m'] = mSelected;
    }
    return map;
  }, [variables, isSimulating, simulatedValues, isMassEnergy, mSelected]);

  const evaluated = useMemo(() => {
    const numericOriginalResult = typeof result === 'string' ? parseFloat(result) : result;
    return evaluateFormula(title, currentVariablesMap, variables, numericOriginalResult);
  }, [title, currentVariablesMap, variables, result]);

  const activeUnit = evaluated.unit || resultUnit;
  const dimensionTag = useMemo(() => inferDimensionalTag(title, activeUnit), [title, activeUnit]);

  const equationLegend = useMemo(
    () =>
      variables.slice(0, 6).map((v) => ({
        symbol: v.symbol,
        meaning: v.unit ? `${v.name} (${v.unit})` : v.name,
      })),
    [variables]
  );

  // Python script snippet
  const pythonSnippet = useMemo(() => {
    let pythonCode = `import numpy as np\n\n# Scientific Mathematical Verification: ${title}\n`;
    variables.forEach((v) => {
      const val = currentVariablesMap[v.symbol] ?? 0;
      const cleanSymbol = v.symbol.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, 'var_').toLowerCase();
      pythonCode += `${cleanSymbol} = ${val}  # ${v.name} (${v.unit || 'dimensionless'})\n`;
    });

    pythonCode += `\n# Evaluation\n`;
    if (titleLower.includes('bragg')) {
      pythonCode += `d_hkl = (n * lambda_val) / (2.0 * np.sin(theta))\nprint(f"d_hkl = {d_hkl:.5f} Å")\n`;
    } else if (titleLower.includes('scherrer')) {
      const lambdaUnit = getUnitByKeys(variables, ['λ', 'lambda']);
      const { factor } = wavelengthToNmFactor(getVar(currentVariablesMap, ['λ', 'lambda'], 1.54056), lambdaUnit);
      pythonCode += `d_hkl_nm = (k_hkl * lambda_val * ${factor}) / (beta_s * np.cos(theta))\nprint(f"D_hkl = {d_hkl_nm:.3f} nm")\n`;
    } else if (titleLower.includes('size-strain separation')) {
      const lambdaUnit = getUnitByKeys(variables, ['λ', 'lambda']);
      const { factor } = wavelengthToNmFactor(getVar(currentVariablesMap, ['λ', 'lambda'], 1.5406), lambdaUnit);
      if (titleLower.includes('(hw ') || titleLower.includes('(ssp ')) {
        pythonCode += `d_v_nm = (k * lambda_val * ${factor}) / m if m > 0 else 0.0\nprint(f"D_v = {d_v_nm:.3f} nm")\n`;
      } else if (titleLower.includes('(gwh ')) {
        pythonCode += `d_v_nm = (k * lambda_val * ${factor}) / np.sqrt(c) if c > 0 else 0.0\neps = np.sqrt(max(0.0, m))\nprint(f"D_v = {d_v_nm:.3f} nm, epsilon = {eps:.5e}")\n`;
      } else {
        pythonCode += `d_v_nm = (k * lambda_val * ${factor}) / c if c > 0 else 0.0\nprint(f"D_v = {d_v_nm:.3f} nm")\n`;
      }
    } else if (titleLower.includes('williamson') || titleLower.includes('advanced integral breadth')) {
      pythonCode += `y_val = (k * lambda_val * 0.1) / d + 4.0 * epsilon * np.sin(theta)\nprint(f"beta * cos(theta) = {y_val:.6f} rad")\n`;
    } else if (titleLower.includes('mass-energy equivalence') || titleLower.includes('einstein')) {
      pythonCode += `c = 299792458.0  # m/s\ne_joules = m * c**2\nprint(f"E = {e_joules:.6e} J ({e_joules * 1e12:.6e} pJ)")\n`;
    } else {
      pythonCode += `# LaTeX: ${formula}\nresult = ${evaluated.value}\nprint(f"${resultName} = {result:.5g} ${activeUnit}")\n`;
    }
    return pythonCode;
  }, [title, titleLower, variables, currentVariablesMap, formula, evaluated, resultName, activeUnit]);

  const jsonMetadata = useMemo(() => {
    const obj = {
      title,
      formula,
      description,
      dimensions: dimensionTag,
      parameters: variables.map((v) => ({
        symbol: v.symbol,
        name: v.name,
        value: currentVariablesMap[v.symbol],
        unit: v.unit || 'dimensionless',
      })),
      evaluatedResult: {
        name: resultName,
        value: evaluated.value,
        unit: activeUnit,
      },
    };
    return JSON.stringify(obj, null, 2);
  }, [title, formula, description, dimensionTag, variables, currentVariablesMap, resultName, evaluated, activeUnit]);

  // First-order Gaussian error propagation (central finite differences)
  const sensitivityAnalysis = useMemo(() => {
    const baseResult = evaluated.value;
    if (typeof baseResult !== 'number' || isNaN(baseResult) || baseResult === 0) {
      return {
        variablesSensitivity: [],
        totalUncertaintyAbs: 0,
        totalUncertaintyRelPercent: 0,
        mostSensitiveVar: null,
      };
    }

    const eps = 1e-4;
    const list = variables.map((v) => {
      const x0 = currentVariablesMap[v.symbol];
      if (typeof x0 !== 'number' || isNaN(x0) || x0 === 0) {
        return {
          symbol: v.symbol,
          name: v.name,
          unit: v.unit,
          partialDerivative: 0,
          elasticity: 0,
          sensitivity: 0,
        };
      }

      const dx = Math.abs(x0) * eps;
      const resUp = evaluateFormula(title, { ...currentVariablesMap, [v.symbol]: x0 + dx }, variables, baseResult).value;
      const resDown = evaluateFormula(title, { ...currentVariablesMap, [v.symbol]: x0 - dx }, variables, baseResult).value;
      const partialDerivative = (resUp - resDown) / (2 * dx);
      const sigmaX = Math.abs(x0) * (inputUncertaintyPercent / 100);
      const sigmaY = Math.abs(partialDerivative * sigmaX);
      const elasticity = Math.abs((partialDerivative * x0) / baseResult);

      return {
        symbol: v.symbol,
        name: v.name,
        unit: v.unit,
        partialDerivative: isFinite(partialDerivative) ? partialDerivative : 0,
        elasticity: isFinite(elasticity) ? elasticity : 0,
        sensitivity: isFinite(sigmaY) ? sigmaY : 0,
      };
    });

    const totalUncertaintyAbs = Math.sqrt(list.reduce((acc, item) => acc + item.sensitivity * item.sensitivity, 0));
    const totalUncertaintyRelPercent = (totalUncertaintyAbs / Math.abs(baseResult)) * 100;
    const sorted = [...list].sort((a, b) => b.sensitivity - a.sensitivity);
    const maxContribution = sorted[0]?.sensitivity || 1;

    return {
      variablesSensitivity: sorted.map((item) => ({
        ...item,
        percentageOfMax: maxContribution > 0 ? (item.sensitivity / maxContribution) * 100 : 0,
      })),
      totalUncertaintyAbs,
      totalUncertaintyRelPercent,
      mostSensitiveVar: sorted[0] || null,
    };
  }, [title, currentVariablesMap, evaluated.value, variables, inputUncertaintyPercent]);

  const eJoules = useMemo(() => mSelected * 299792458 * 299792458, [mSelected]);
  const eMeV = useMemo(() => eJoules / 1.602176634e-13, [eJoules]);
  const eTntTons = useMemo(() => eJoules / 4.184e9, [eJoules]);
  const homesPowered = useMemo(() => eJoules / 3.816e10, [eJoules]);
  const hiroshimaBombs = useMemo(() => eJoules / 6.276e13, [eJoules]);
  const lightbulbYears = useMemo(() => eJoules / 1.893456e9, [eJoules]);

  const resetAllSimulated = () => {
    const initial: Record<string, number> = {};
    variables.forEach((v) => {
      const parsed = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
      initial[v.symbol] = isNaN(parsed) ? 0 : parsed;
    });
    setSimulatedValues(initial);
  };

  return (
    <section
      aria-label={title}
      className="mt-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      {/* Header Accordion Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        id="scientific-check-header"
        className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-sky-400 shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate">
              {title}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Analytical Equation &amp; Sensitivity Audit</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {formatNumericReadout(evaluated.value, 3)} {activeUnit}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {!isOpen && (
            <div className="hidden md:block px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-w-[320px] overflow-hidden">
              <MathFormula tex={formula} />
            </div>
          )}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            {isOpen ? 'Hide derivation' : 'Inspect formula'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
              {/* Concise Physical Context */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {description}
              </p>

              {/* Governing Equation Plate */}
              <EquationPlate
                tex={formula}
                label="Governing Physical Law"
                dimension={dimensionTag}
                eqNumber="(1)"
                emphasis="primary"
                legend={equationLegend}
              />

              {/* Analytical Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSimulating) resetAllSimulated();
                      setIsSimulating(!isSimulating);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border whitespace-nowrap ${
                      isSimulating
                        ? 'bg-slate-900 dark:bg-sky-500/20 text-white dark:text-sky-200 border-slate-900 dark:border-sky-500/60'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isSimulating ? 'Simulator Active' : 'Parameter Simulator'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUncertainty(!showUncertainty)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border whitespace-nowrap ${
                      showUncertainty
                        ? 'bg-amber-600 dark:bg-amber-500/20 text-white dark:text-amber-200 border-amber-600 dark:border-amber-500/60'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{showUncertainty ? 'Hide Error Propagation' : 'Error Propagation'}</span>
                  </button>
                </div>

                {isSimulating && (
                  <button
                    type="button"
                    onClick={resetAllSimulated}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to measured inputs</span>
                  </button>
                )}
              </div>

              {/* Two-Column Analytical Evaluation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left: Active Physical Parameters */}
                <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {isSimulating ? 'Adjustable Parameters' : 'Substituted Parameters'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isSimulating ? 'Live perturbation' : 'From active reflection'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {variables.map((v, i) => {
                        const currentVal = currentVariablesMap[v.symbol];
                        const initialVal = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
                        const safeInitialVal = isNaN(initialVal) ? 0 : initialVal;
                        const step =
                          safeInitialVal === 0
                            ? 0.05
                            : Math.pow(10, Math.floor(Math.log10(Math.abs(safeInitialVal) || 1)) - 3);
                        const min = safeInitialVal === 0 ? 0 : Math.min(safeInitialVal * 0.1, safeInitialVal * 2.0);
                        const max = safeInitialVal === 0 ? 5 : Math.max(safeInitialVal * 0.1, safeInitialVal * 2.0);

                        return (
                          <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="inline-flex items-center justify-center min-w-[34px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-sky-300 text-xs shrink-0">
                                  <MathFormula tex={formatSymbolToTex(v.symbol)} />
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                  {v.name}
                                </span>
                              </div>
                              <div className="font-mono tabular-nums text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                {typeof currentVal === 'number'
                                  ? isNaN(currentVal)
                                    ? '0'
                                    : Math.abs(currentVal) > 0 && (Math.abs(currentVal) < 1e-4 || Math.abs(currentVal) >= 1e6)
                                    ? currentVal.toExponential(4)
                                    : currentVal.toFixed(5).replace(/\.?0+$/, '')
                                  : currentVal}
                                {v.unit && (
                                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                                    {v.unit}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSimulating && typeof currentVal === 'number' && (
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="range"
                                  min={isNaN(min) ? 0 : min}
                                  max={isNaN(max) ? 100 : max}
                                  step={step || 0.001}
                                  value={isNaN(currentVal) ? 0 : currentVal}
                                  onChange={(e) => {
                                    const newVal = parseFloat(e.target.value);
                                    setSimulatedValues((prev) => ({
                                      ...prev,
                                      [v.symbol]: newVal,
                                    }));
                                  }}
                                  className="flex-1 accent-blue-600 dark:accent-sky-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSimulatedValues((prev) => ({
                                      ...prev,
                                      [v.symbol]: safeInitialVal,
                                    }))
                                  }
                                  className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  Reset
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Authoritative Result & Step-by-Step Numerical Substitution */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{resultName}</div>
                      <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
                        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                          {formatNumericReadout(evaluated.value, 4)}
                        </span>
                        {activeUnit && (
                          <span className="text-base font-semibold text-blue-600 dark:text-sky-400">
                            {activeUnit}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <div>{isSimulating ? 'Simulated evaluation' : 'Direct analytical evaluation'}</div>
                      <div className="font-mono tabular-nums text-[11px] mt-0.5">{dimensionTag}</div>
                    </div>
                  </div>

                  <EquationPlate
                    tex={evaluated.steps}
                    label="Numerical Substitution & Reduction"
                    eqNumber="(2)"
                    emphasis="result"
                    className="flex-1 flex flex-col justify-between"
                  />
                </div>
              </div>

              {/* Einstein Mass-Energy Equivalents Panel */}
              {isMassEnergy && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {elementSymbol} Mass–Energy Scale Equivalencies
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Relativistic rest energy across atomic and macroscopic mass references
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {(['atom', 'mole', 'gram', 'kg', 'custom'] as const).map((scale) => (
                        <button
                          key={scale}
                          type="button"
                          onClick={() => setMassScale(scale)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            massScale === scale
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {scale === 'atom'
                            ? '1 Atom'
                            : scale === 'mole'
                            ? '1 Mole'
                            : scale === 'gram'
                            ? '1 g'
                            : scale === 'kg'
                            ? '1 kg'
                            : 'Custom'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {massScale === 'custom' && (
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                        <span className="font-sans text-slate-600 dark:text-slate-400">Custom Mass</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {customMassGrams.toFixed(3)} g
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="100"
                        step="0.001"
                        value={customMassGrams}
                        onChange={(e) => setCustomMassGrams(parseFloat(e.target.value) || 0.001)}
                        className="w-full accent-blue-600 dark:accent-sky-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Effective Rest Mass (m)</div>
                      <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                          {mSelected.toExponential(6)}
                        </span>
                        <span className="text-xs text-slate-500">kg</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                        {(mSelected / 1.6605390666e-27).toExponential(4)} u
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Rest Energy (<MathFormula tex="E = mc^2" />)
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                        <span className="text-lg font-semibold text-blue-600 dark:text-sky-400">
                          {eJoules.toExponential(6)}
                        </span>
                        <span className="text-xs text-slate-500">J</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                        {eMeV >= 1e6
                          ? `${(eMeV / 1e6).toFixed(4)} TeV`
                          : eMeV >= 1e3
                          ? `${(eMeV / 1e3).toFixed(4)} GeV`
                          : `${eMeV.toFixed(4)} MeV`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {[
                      {
                        icon: Flame,
                        label: 'Explosive Yield',
                        value:
                          eTntTons >= 1e6
                            ? `${(eTntTons / 1e6).toFixed(4)} Mt TNT`
                            : eTntTons >= 1e3
                            ? `${(eTntTons / 1e3).toFixed(4)} kt TNT`
                            : `${eTntTons.toFixed(4)} t TNT`,
                      },
                      {
                        icon: Home,
                        label: 'Grid Power Equivalent',
                        value:
                          homesPowered >= 1
                            ? `${homesPowered.toLocaleString(undefined, { maximumFractionDigits: 1 })} homes/yr`
                            : `${(homesPowered * 365.25).toFixed(1)} homes/day`,
                      },
                      {
                        icon: Globe,
                        label: 'Fission Benchmark (15 kt)',
                        value: `${hiroshimaBombs.toExponential(3)}×`,
                      },
                      {
                        icon: Sun,
                        label: '60 W Lamp Runtime',
                        value:
                          lightbulbYears >= 1e6
                            ? `${(lightbulbYears / 1e6).toFixed(3)}M yrs`
                            : lightbulbYears >= 1
                            ? `${lightbulbYears.toFixed(1)} yrs`
                            : `${(lightbulbYears * 365.25).toFixed(1)} days`,
                      },
                    ].map((eq) => {
                      const Icon = eq.icon;
                      return (
                        <div
                          key={eq.label}
                          className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5"
                        >
                          <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{eq.label}</div>
                            <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                              {eq.value}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gaussian Error Propagation & Sensitivity Audit */}
              <AnimatePresence>
                {showUncertainty && sensitivityAnalysis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/70 dark:border-amber-800/50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          First-Order Gaussian Error Propagation &amp; Parameter Sensitivities
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Relative input uncertainty:</span>
                        <select
                          value={inputUncertaintyPercent}
                          onChange={(e) => setInputUncertaintyPercent(parseInt(e.target.value, 10))}
                          className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value={1}>±1%</option>
                          <option value={2}>±2%</option>
                          <option value={5}>±5%</option>
                          <option value={10}>±10%</option>
                        </select>
                      </div>
                    </div>

                    <EquationPlate
                      tex={`\\sigma_y = \\sqrt{\\sum_{i=1}^{${variables.length}} \\left(\\frac{\\partial y}{\\partial x_i}\\,\\sigma_{x_i}\\right)^2} = \\mathbf{\\pm ${sensitivityAnalysis.totalUncertaintyAbs.toFixed(4)}\\,${activeUnit ? `\\mathrm{${activeUnit}}` : ''}} \\quad (${sensitivityAnalysis.totalUncertaintyRelPercent.toFixed(2)}\\%)`}
                      label="Quadrature Uncertainty Propagation Law"
                      eqNumber="(3)"
                      copyable={false}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      <div className="md:col-span-7 space-y-2.5">
                        {sensitivityAnalysis.variablesSensitivity.map((v, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-amber-300">
                                  <MathFormula tex={formatSymbolToTex(v.symbol)} />
                                </span>
                                <span>{v.name}</span>
                              </span>
                              <span className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">
                                {v.sensitivity > 1e-5
                                  ? `±${v.sensitivity.toFixed(4)} ${activeUnit} · |S| = ${v.elasticity.toFixed(2)}`
                                  : 'Negligible'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all duration-200"
                                style={{ width: `${Math.max(2, v.percentageOfMax)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="md:col-span-5 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Combined Standard Uncertainty
                        </div>
                        <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          ±{sensitivityAnalysis.totalUncertaintyAbs.toFixed(4)}{' '}
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            {activeUnit}
                          </span>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          ±{sensitivityAnalysis.totalUncertaintyRelPercent.toFixed(2)}% relative spread
                        </div>
                        {sensitivityAnalysis.mostSensitiveVar && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                            Dominant uncertainty driver:{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {sensitivityAnalysis.mostSensitiveVar.name}
                            </strong>{' '}
                            (±{sensitivityAnalysis.mostSensitiveVar.sensitivity.toFixed(4)} {activeUnit} per{' '}
                            {inputUncertaintyPercent}% input shift).
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Manuscript & Script Export Bar */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'latex', label: 'LaTeX Source' },
                        { id: 'python', label: 'Python (NumPy)' },
                        { id: 'json', label: 'JSON Audit' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy =
                        activeTab === 'latex'
                          ? formula
                          : activeTab === 'python'
                          ? pythonSnippet
                          : jsonMetadata;
                      handleCopy(textToCopy, activeTab);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedState === activeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-950 overflow-x-auto text-[11.5px] font-mono text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto whitespace-pre select-all">
                  {activeTab === 'latex' && formula}
                  {activeTab === 'python' && pythonSnippet}
                  {activeTab === 'json' && jsonMetadata}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
