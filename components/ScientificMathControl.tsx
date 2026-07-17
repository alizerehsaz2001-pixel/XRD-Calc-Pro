import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  ChevronDown, 
  CheckCircle2, 
  Sigma, 
  Sliders, 
  AlertTriangle, 
  Copy, 
  Check, 
  Terminal, 
  FileText,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

// Map formulas to numerical evaluators for Interactive Simulator & Error Propagation
const evaluateFormula = (formulaTitle: string, vars: { [symbol: string]: number }, originalResult: number): { value: number; unit: string; steps: string } => {
  const titleLower = formulaTitle.toLowerCase();
  
  if (titleLower.includes("bragg")) {
    const lambda = vars['λ'] !== undefined ? vars['λ'] : (vars['lambda'] || 1.54056);
    const theta = vars['θ'] !== undefined ? vars['θ'] : (vars['theta'] || 0.25);
    const n = vars['n'] !== undefined ? vars['n'] : 1;
    const sinTheta = Math.sin(theta);
    const d = sinTheta !== 0 ? (n * lambda) / (2 * sinTheta) : 0;
    return {
      value: d,
      unit: "Å",
      steps: `d = \\frac{${n} \\cdot ${lambda.toFixed(5)}}{2 \\cdot \\sin(${theta.toFixed(4)})} = \\frac{${(n * lambda).toFixed(5)}}{${(2 * sinTheta).toFixed(4)}} = ${d.toFixed(4)}\\text{ Å}`
    };
  }
  
  if (titleLower.includes("scherrer")) {
    const K = vars['K'] !== undefined ? vars['K'] : 0.9;
    const lambda = vars['λ'] !== undefined ? vars['λ'] : (vars['lambda'] || 1.54056);
    const beta = vars['β'] !== undefined ? vars['β'] : (vars['beta'] || 0.01);
    const theta = vars['θ'] !== undefined ? vars['θ'] : (vars['theta'] || 0.25);
    const cosTheta = Math.cos(theta);
    const factor = lambda > 10 ? 1 : 0.1;
    const Dv = (beta * cosTheta) !== 0 ? (K * lambda * factor) / (beta * cosTheta) : 0;
    return {
      value: Dv,
      unit: "nm",
      steps: `D_v = \\frac{${K} \\cdot (${lambda.toFixed(4)} \\cdot ${factor})}{${beta.toFixed(5)} \\cdot \\cos(${theta.toFixed(4)})} = ${Dv.toFixed(2)}\\text{ nm}`
    };
  }
  
  if (titleLower.includes("williamson") || titleLower.includes("advanced integral breadth")) {
    const K = vars['K'] !== undefined ? vars['K'] : 0.9;
    const lambda = vars['λ'] !== undefined ? vars['λ'] : (vars['lambda'] || 1.54056);
    const D = vars['D'] !== undefined ? vars['D'] : 20.0;
    const epsilon = vars['ε'] !== undefined ? vars['ε'] : (vars['epsilon'] || 0.002);
    const theta = vars['θ'] !== undefined ? vars['θ'] : (vars['theta'] || 0.25);
    
    const factor = lambda > 10 ? 1 : 0.1;
    const term1 = D !== 0 ? (K * lambda * factor) / D : 0;
    const term2 = 4 * epsilon * Math.sin(theta);
    const yVal = term1 + term2;
    return {
      value: yVal,
      unit: "rad",
      steps: `\\beta \\cos(\\theta) = \\frac{${K} \\cdot (${lambda.toFixed(4)} \\cdot ${factor})}{${D.toFixed(1)}} + 4 \\cdot ${epsilon.toFixed(5)} \\cdot \\sin(${theta.toFixed(4)}) = ${yVal.toFixed(6)}\\text{ rad}`
    };
  }
  
  if (titleLower.includes("pseudo-voigt")) {
    const eta = vars['η'] !== undefined ? vars['η'] : (vars['eta'] || 0.5);
    const L = vars['L'] !== undefined ? vars['L'] : 1.0;
    const G = vars['G'] !== undefined ? vars['G'] : 1.0;
    const I = eta * L + (1 - eta) * G;
    return {
      value: I,
      unit: "arb. u.",
      steps: `I = ${eta.toFixed(3)} \\cdot ${L.toFixed(3)} + (1 - ${eta.toFixed(3)}) \\cdot ${G.toFixed(3)} = ${I.toFixed(4)}`
    };
  }
  
  if (titleLower.includes("integral breadth")) {
    const Area = vars['Area'] !== undefined ? vars['Area'] : (vars['area'] || 1.0);
    const Imax = vars['I_{max}'] !== undefined ? vars['I_{max}'] : (vars['Imax'] || 1.0);
    const beta = Imax !== 0 ? Area / Imax : 0;
    return {
      value: beta,
      unit: "rad",
      steps: `\\beta = \\frac{${Area.toFixed(3)}}{${Imax.toFixed(3)}} = ${beta.toFixed(5)}\\text{ rad}`
    };
  }
  
  if (titleLower.includes("lattice parameters")) {
    const d = vars['d'] !== undefined ? vars['d'] : 2.0;
    const h = vars['h'] !== undefined ? vars['h'] : 1;
    const k = vars['k'] !== undefined ? vars['k'] : 1;
    const l = vars['l'] !== undefined ? vars['l'] : 1;
    const s = h*h + k*k + l*l;
    const a = d * Math.sqrt(s);
    return {
      value: a,
      unit: "Å",
      steps: `a = ${d.toFixed(4)} \\cdot \\sqrt{${h}^2 + ${k}^2 + ${l}^2} = ${a.toFixed(4)}\\text{ Å}`
    };
  }

  if (titleLower.includes("deconvolution") || titleLower.includes("instrumental") || titleLower.includes("fwhm verifier") || titleLower.includes("caglioti")) {
    const beta_obs = vars['β_obs'] !== undefined ? vars['β_obs'] : (vars['beta_obs'] || 0.01);
    const beta_inst = vars['β_inst'] !== undefined ? vars['β_inst'] : (vars['beta_inst'] || 0.002);
    const diff = beta_obs * beta_obs - beta_inst * beta_inst;
    const beta_sample = diff > 0 ? Math.sqrt(diff) : 0;
    return {
      value: beta_sample,
      unit: "rad",
      steps: `\\beta_{\\text{sample}} = \\sqrt{\\beta_{\\text{obs}}^2 - \\beta_{\\text{inst}}^2} = \\sqrt{${beta_obs.toFixed(5)}^2 - ${beta_inst.toFixed(5)}^2} = ${beta_sample.toFixed(5)}\\text{ rad}`
    };
  }

  if (titleLower.includes("warren") || titleLower.includes("fourier")) {
    const A1 = vars['A_1'] !== undefined ? vars['A_1'] : (vars['A1'] || 0.85);
    const A2 = vars['A_2'] !== undefined ? vars['A_2'] : (vars['A2'] || 0.70);
    const L = vars['L'] !== undefined ? vars['L'] : (vars['L_nm'] || 10.0);
    const d1 = vars['d_1'] !== undefined ? vars['d_1'] : (vars['d1'] || 2.35);
    const d2 = vars['d_2'] !== undefined ? vars['d_2'] : (vars['d2'] || 1.17);
    const s1 = 1 / d1;
    const s2 = 1 / d2;
    const num = Math.log(A1 / A2);
    const den = 2 * Math.PI * Math.PI * L * L * (s2*s2 - s1*s1);
    const val = den !== 0 && num / den > 0 ? Math.sqrt(num / den) : 0;
    return {
      value: val,
      unit: "",
      steps: `\\langle \\varepsilon_L^2 \\rangle^{1/2} = \\sqrt{\\frac{\\ln(A_1 / A_2)}{2 \\pi^2 L^2 (1/d_2^2 - 1/d_1^2)}} = \\sqrt{\\frac{\\ln(${A1.toFixed(3)} / ${A2.toFixed(3)})}{2 \\pi^2 \\cdot ${L.toFixed(1)}^2 \\cdot (${s2.toFixed(4)}^2 - ${s1.toFixed(4)}^2)}} = ${val.toFixed(6)}`
    };
  }

  if (titleLower.includes("march-dollase") || titleLower.includes("preferred") || titleLower.includes("orientation") || titleLower.includes("texture")) {
    const r = vars['r'] !== undefined ? vars['r'] : (vars['rValue'] || 0.8);
    const alpha = vars['α'] !== undefined ? vars['α'] : (vars['alpha'] || 0.785);
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);
    const term = r * r * cosA * cosA + (sinA * sinA) / r;
    const W = term !== 0 ? Math.pow(term, -1.5) : 0;
    return {
      value: W,
      unit: "",
      steps: `W(r, \\alpha) = (r^2 \\cos^2\\alpha + r^{-1} \\sin^2\\alpha)^{-3/2} = (${r.toFixed(3)}^2 \\cdot \\cos^2(${alpha.toFixed(3)}) + \\frac{\\sin^2(${alpha.toFixed(3)})}{${r.toFixed(3)}})^{-3/2} = ${W.toFixed(4)}`
    };
  }

  if (titleLower.includes("neutron de broglie") || titleLower.includes("neutron wavelength") || titleLower.includes("de broglie")) {
    const lambda = vars['λ'] !== undefined ? vars['λ'] : (vars['lambda'] || 1.54);
    const E = lambda !== 0 ? 81.8048 / (lambda * lambda) : 0;
    return {
      value: E,
      unit: "meV",
      steps: `E = \\frac{81.8048}{\\lambda^2} = \\frac{81.8048}{${lambda.toFixed(4)}^2} = ${E.toFixed(2)}\\text{ meV}`
    };
  }

  if (titleLower.includes("curie") || titleLower.includes("weiss") || titleLower.includes("susceptibility")) {
    const C = vars['C'] !== undefined ? vars['C'] : 1.5;
    const T = vars['T'] !== undefined ? vars['T'] : 10.0;
    const theta_p = vars['θ_p'] !== undefined ? vars['θ_p'] : (vars['theta_p'] || 5.0);
    const diff = T - theta_p;
    const chi = diff !== 0 ? C / diff : 0;
    return {
      value: chi,
      unit: "emu/mol",
      steps: `\\chi = \\frac{C}{T - \\theta_p} = \\frac{${C.toFixed(2)}}{${T.toFixed(1)} - ${theta_p.toFixed(1)}} = ${chi.toFixed(4)}\\text{ emu/mol}`
    };
  }

  if (titleLower.includes("structure factor") || titleLower.includes("selection") || titleLower.includes("absence")) {
    const h = vars['h'] !== undefined ? Math.round(vars['h']) : 1;
    const k = vars['k'] !== undefined ? Math.round(vars['k']) : 1;
    const l = vars['l'] !== undefined ? Math.round(vars['l']) : 1;
    const f = vars['f'] !== undefined ? vars['f'] : 1.0;
    
    const hEven = h % 2 === 0;
    const kEven = k % 2 === 0;
    const lEven = l % 2 === 0;
    const allowed = (hEven === kEven) && (kEven === lEven);
    const F = allowed ? 4 * f : 0;
    
    return {
      value: F,
      unit: "",
      steps: `F_{hkl} = f \\cdot [1 + e^{i\\pi(h+k)} + e^{i\\pi(k+l)} + e^{i\\pi(h+l)}] = ${f.toFixed(2)} \\cdot [1 + e^{i\\pi(${h}+${k})} + e^{i\\pi(${k}+${l})} + e^{i\\pi(${h}+${l})}] = ${F.toFixed(2)}`
    };
  }

  return {
    value: originalResult,
    unit: "",
    steps: `\\text{Result} = ${typeof originalResult === 'number' ? originalResult.toFixed(4) : originalResult}`
  };
};

export const ScientificMathControl: React.FC<ScientificMathControlProps> = ({
  title = "Scientific Math Control & Verification",
  formula,
  description,
  variables,
  result,
  resultUnit,
  resultName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showUncertainty, setShowUncertainty] = useState(false);
  const [inputUncertaintyPercent, setInputUncertaintyPercent] = useState(2); // Default ±2%
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'latex' | 'python' | 'json'>('latex');

  // Dynamic values state for the simulator
  const [simulatedValues, setSimulatedValues] = useState<{ [symbol: string]: number }>({});

  // Sync simulator state when inputs/props change
  useEffect(() => {
    const initialSims: { [symbol: string]: number } = {};
    variables.forEach(v => {
      const parsed = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
      initialSims[v.symbol] = isNaN(parsed) ? 1 : parsed;
    });
    setSimulatedValues(initialSims);
  }, [variables]);

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
  };

  // Base rendered LaTeX formula
  const renderedFormulaHtml = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      console.error(e);
      return `<span class="text-rose-400 font-mono">${formula}</span>`;
    }
  }, [formula]);

  // Active inputs depending on simulator state
  const currentVariablesMap = useMemo(() => {
    const map: { [symbol: string]: number } = {};
    variables.forEach(v => {
      const rawVal = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
      map[v.symbol] = isSimulating ? (simulatedValues[v.symbol] ?? rawVal) : rawVal;
    });
    return map;
  }, [variables, isSimulating, simulatedValues]);

  // Compute simulated result & LaTeX evaluation step
  const evaluated = useMemo(() => {
    const numericOriginalResult = typeof result === 'string' ? parseFloat(result) : result;
    return evaluateFormula(title, currentVariablesMap, numericOriginalResult);
  }, [title, currentVariablesMap, result]);

  // Latex of evaluated step
  const evaluatedStepHtml = useMemo(() => {
    try {
      return katex.renderToString(evaluated.steps, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return evaluated.steps;
    }
  }, [evaluated]);

  // Generate python simulation snippet
  const pythonSnippet = useMemo(() => {
    let pythonCode = `import numpy as np\n\n# --- Scientific Math Verification: ${title} ---\n`;
    variables.forEach(v => {
      const val = currentVariablesMap[v.symbol] || 0;
      const cleanSymbol = v.symbol.replace(/[^a-zA-Z0-9]/g, '_');
      pythonCode += `${cleanSymbol.toLowerCase()} = ${val} # ${v.name} (${v.unit || 'dimensionless'})\n`;
    });
    
    pythonCode += `\n# Calculation formula:\n`;
    const titleLower = title.toLowerCase();
    if (titleLower.includes("bragg")) {
      pythonCode += `d_spacing = (1 * lambda) / (2 * np.sin(theta))\nprint(f"Calculated d-spacing: {d_spacing:.5f} Å")\n`;
    } else if (titleLower.includes("scherrer")) {
      pythonCode += `factor = 0.1 if wavelength < 10 else 1.0\nd_v = (k * wavelength * factor) / (beta * np.cos(theta))\nprint(f"Crystallite size: {d_v:.3f} nm")\n`;
    } else if (titleLower.includes("williamson") || titleLower.includes("advanced integral breadth")) {
      pythonCode += `factor = 0.1 if wavelength < 10 else 1.0\ny_val = (k * wavelength * factor) / d + 4 * epsilon * np.sin(theta)\nprint(f"Broadening beta * cos(theta): {y_val:.6f} rad")\n`;
    } else if (titleLower.includes("pseudo-voigt")) {
      pythonCode += `intensity = eta * l + (1 - eta) * g\nprint(f"Calculated intensity: {intensity:.4f}")\n`;
    } else if (titleLower.includes("integral breadth")) {
      pythonCode += `beta = area / i_max\nprint(f"Integral breadth: {beta:.5f} rad")\n`;
    } else if (titleLower.includes("lattice parameters")) {
      pythonCode += `s = h**2 + k**2 + l**2\na = d * np.sqrt(s)\nprint(f"Unit cell a: {a:.5f} Å")\n`;
    } else {
      pythonCode += `# Custom formula: ${formula}\nresult = ${evaluated.value}\nprint(f"Result: {result}")\n`;
    }
    return pythonCode;
  }, [title, variables, currentVariablesMap, formula, evaluated]);

  // JSON metadata string
  const jsonMetadata = useMemo(() => {
    const obj = {
      title,
      formula,
      description,
      timestamp: new Date().toISOString(),
      parameters: variables.map(v => ({
        symbol: v.symbol,
        name: v.name,
        currentValue: currentVariablesMap[v.symbol],
        unit: v.unit
      })),
      verificationResult: {
        name: resultName,
        value: evaluated.value,
        unit: evaluated.unit || resultUnit
      }
    };
    return JSON.stringify(obj, null, 2);
  }, [title, formula, description, variables, currentVariablesMap, resultName, evaluated, resultUnit]);

  // Error Propagation & Sensitivities Analysis
  const sensitivityAnalysis = useMemo(() => {
    const baseResult = evaluated.value;
    if (typeof baseResult !== 'number' || isNaN(baseResult) || baseResult === 0) {
      return {
        variablesSensitivity: [],
        totalUncertaintyAbs: 0,
        totalUncertaintyRelPercent: 0,
        mostSensitiveVar: null
      };
    }

    const deltaPercent = 0.001; // Tiny perturbation for numerical derivative
    const list = variables.map(v => {
      const originalVal = currentVariablesMap[v.symbol];
      if (typeof originalVal !== 'number' || isNaN(originalVal)) {
        return { symbol: v.symbol, name: v.name, sensitivity: 0, errorContribution: 0 };
      }

      // Perturb variable up
      const perturbedMapUp = { ...currentVariablesMap, [v.symbol]: originalVal * (1 + deltaPercent) };
      const resUp = evaluateFormula(title, perturbedMapUp, baseResult).value;

      // Numerical derivative: (dy / dx)
      const dx = originalVal * deltaPercent;
      const dy = resUp - baseResult;
      const partialDerivative = dx !== 0 ? dy / dx : 0;

      // Absolute error propagated from this variable (e.g. ±2% error)
      const variableUncertainty = originalVal * (inputUncertaintyPercent / 100);
      const propagatedErrorAbs = Math.abs(partialDerivative * variableUncertainty);

      // Relative sensitivity factor
      const sensitivity = isNaN(propagatedErrorAbs) ? 0 : propagatedErrorAbs;

      return {
        symbol: v.symbol,
        name: v.name,
        sensitivity, // Absolute change in result
        errorContribution: originalVal !== 0 ? (Math.abs(partialDerivative * originalVal) / Math.abs(baseResult)) : 0
      };
    });

    // Propagated total uncertainty (Quadratic sum: sqrt(sum(df_dx * dx)^2))
    const totalUncertaintyAbs = Math.sqrt(list.reduce((acc, item) => acc + Math.pow(item.sensitivity, 2), 0));
    const totalUncertaintyRelPercent = (totalUncertaintyAbs / Math.abs(baseResult)) * 100;

    // Rank variables by absolute sensitivity contribution
    const sorted = [...list].sort((a, b) => b.sensitivity - a.sensitivity);
    const maxContribution = sorted[0]?.sensitivity || 1;

    const listWithRelativePercentages = sorted.map(item => ({
      ...item,
      percentageOfMax: maxContribution > 0 ? (item.sensitivity / maxContribution) * 100 : 0
    }));

    return {
      variablesSensitivity: listWithRelativePercentages,
      totalUncertaintyAbs,
      totalUncertaintyRelPercent,
      mostSensitiveVar: sorted[0] || null
    };
  }, [title, currentVariablesMap, evaluated.value, variables, inputUncertaintyPercent]);

  // Helper to render KaTeX symbols beautifully
  const renderSymbol = (symbol: string) => {
    const hasMath = /[\\_{}^[\]()|+=?*./ -]/.test(symbol) || 
                    ['η', 'β', 'λ', 'θ', 'ε', 'α', 'K', 'n', 'R_wp', 'R_{wp}', 'β_obs', 'β_inst', 'θ_p'].some(kw => symbol.includes(kw));
    
    if (hasMath) {
      let tex = symbol;
      if (symbol === 'η') tex = '\\eta';
      else if (symbol === 'β') tex = '\\beta';
      else if (symbol === 'λ') tex = '\\lambda';
      else if (symbol === 'θ') tex = '\\theta';
      else if (symbol === 'ε') tex = '\\varepsilon';
      else if (symbol === 'α') tex = '\\alpha';
      else if (symbol === 'β_obs') tex = '\\beta_{\\text{obs}}';
      else if (symbol === 'β_inst') tex = '\\beta_{\\text{inst}}';
      else if (symbol === 'θ_p') tex = '\\theta_{p}';
      else if (symbol === 'Slope (4ε)') tex = '4\\varepsilon';
      else if (symbol === 'R_wp' || symbol === 'R_{wp}') tex = 'R_{\\text{wp}}';
      else if (symbol === 'd(avg)') tex = 'd_{\\text{avg}}';
      
      try {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { throwOnError: false, displayMode: false }) }} />;
      } catch {
        return symbol;
      }
    }
    return symbol;
  };

  return (
    <div className="mt-4 border border-indigo-500/20 bg-gradient-to-b from-indigo-950/10 to-slate-900/40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
      
      {/* Header Accordion Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-950/20 to-transparent hover:from-indigo-950/30 transition-all duration-300"
        id="scientific-check-header"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono block leading-none mb-1">
              PHYSICS MODULE VERIFIER
            </span>
            <span className="text-sm font-bold text-slate-100 font-sans tracking-tight">
              {title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen && (
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-indigo-500/10 flex flex-col gap-6">
              
              {/* Description bar */}
              <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {description}
              </div>

              {/* Governing Equation Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-60">
                  <Sigma className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Governing physical Relation</span>
                </div>
                <div 
                  className="mt-6 text-slate-100 max-w-full overflow-x-auto select-all text-center"
                  dangerouslySetInnerHTML={{ __html: renderedFormulaHtml }} 
                />
              </div>

              {/* Simulator & Error propagation Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-950/10 p-3 rounded-xl border border-indigo-500/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsSimulating(!isSimulating);
                      if (!isSimulating) {
                        // Reset simulator values to current props
                        const initial: { [symbol: string]: number } = {};
                        variables.forEach(v => {
                          initial[v.symbol] = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
                        });
                        setSimulatedValues(initial);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSimulating 
                        ? 'bg-indigo-600 text-white border border-indigo-400 shadow-lg shadow-indigo-600/25' 
                        : 'bg-slate-900 text-indigo-400 border border-indigo-500/20 hover:bg-slate-800'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {isSimulating ? 'Active Simulator' : 'Toggle Math Simulator'}
                  </button>

                  <button
                    onClick={() => setShowUncertainty(!showUncertainty)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      showUncertainty 
                        ? 'bg-amber-600 text-white border border-amber-400 shadow-lg shadow-amber-600/25' 
                        : 'bg-slate-900 text-amber-500 border border-amber-500/20 hover:bg-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {showUncertainty ? 'Sensitivities: ON' : 'Error Propagation Check'}
                  </button>
                </div>

                {isSimulating && (
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Simulated Mode Active
                  </span>
                )}
              </div>

              {/* TWO COLUMN WORKSPACE (Sliders / Outputs / Error Propagation) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* LEFT COLUMN: Variable Inspector / Sim Sliders */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                      {isSimulating ? 'Adjustable Parameters' : 'Active Physical Parameters'}
                    </span>
                    <span className="text-[10px] text-slate-500 italic">
                      {isSimulating ? 'Tweak to observe results' : 'Calculated values'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {variables.map((v, i) => {
                      const currentVal = currentVariablesMap[v.symbol];
                      const initialVal = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
                      
                      // Calculate slider bounds
                      const isDegreeOrRad = v.symbol.includes('θ') || v.symbol.includes('theta') || v.symbol.includes('β') || v.symbol.includes('beta');
                      const step = initialVal === 0 ? 0.05 : Math.pow(10, Math.floor(Math.log10(Math.abs(initialVal) || 1)) - 3);
                      const min = initialVal === 0 ? 0 : Math.min(initialVal * 0.2, initialVal * 1.8);
                      const max = initialVal === 0 ? 5 : Math.max(initialVal * 0.2, initialVal * 1.8);

                      return (
                        <div key={i} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="text-indigo-400 font-black bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-flex items-center justify-center min-w-[28px] text-[11px]">
                                {renderSymbol(v.symbol)}
                              </span>
                              <span className="text-slate-400 font-sans font-medium text-[10px] uppercase truncate">
                                {v.name}
                              </span>
                            </div>
                            <div className="text-slate-200 font-bold">
                              {typeof currentVal === 'number' ? currentVal.toFixed(5).replace(/\.?0+$/, '') : currentVal}
                              <span className="text-slate-500 font-normal ml-1">{v.unit}</span>
                            </div>
                          </div>

                          {/* Render slider if simulator mode is active */}
                          {isSimulating && typeof currentVal === 'number' && (
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={min}
                                max={max}
                                step={step || 0.001}
                                value={currentVal}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value);
                                  setSimulatedValues(prev => ({
                                    ...prev,
                                    [v.symbol]: newVal
                                  }));
                                }}
                                className="flex-1 accent-indigo-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                              />
                              <button
                                onClick={() => {
                                  // Reset single variable
                                  setSimulatedValues(prev => ({
                                    ...prev,
                                    [v.symbol]: initialVal
                                  }));
                                }}
                                className="text-[9px] text-slate-500 hover:text-slate-300 font-mono transition-colors border border-slate-800 rounded px-1"
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

                {/* RIGHT COLUMN: Output display & Substitute calculation */}
                <div className="flex flex-col gap-5">
                  
                  {/* Verification Answer Card */}
                  <div className="bg-indigo-950/20 rounded-2xl p-5 border border-indigo-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-inner">
                    <div className="absolute top-3 right-3 opacity-50">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-2 font-mono">
                      Calculated Verification Answer
                    </span>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                        {typeof evaluated.value === 'number' 
                          ? (isNaN(evaluated.value) ? 'ERR' : evaluated.value.toFixed(4)) 
                          : evaluated.value
                        }
                      </span>
                      <span className="text-indigo-300 text-sm font-bold">{evaluated.unit || resultUnit}</span>
                    </div>
                    <span className="text-[10px] text-indigo-300/70 font-sans tracking-wide mt-1 uppercase">
                      {resultName}
                    </span>
                  </div>

                  {/* Substitution steps display */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group min-h-[100px]">
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-60">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        Substitution & Arithmetic Trace
                      </span>
                    </div>
                    <div 
                      className="mt-5 text-slate-200 overflow-x-auto select-all py-2 text-xs flex justify-center text-center"
                      dangerouslySetInnerHTML={{ __html: evaluatedStepHtml }} 
                    />
                  </div>

                </div>

              </div>

              {/* DYNAMIC ERROR PROPAGATION & SENSITIVITY VIEW */}
              <AnimatePresence>
                {showUncertainty && sensitivityAnalysis && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-amber-500/5 rounded-2xl border border-amber-500/20 p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                          Error Propagation & Parameter Sensitivities
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-400/80 font-mono">Input Uncertainty:</span>
                        <select 
                          value={inputUncertaintyPercent}
                          onChange={(e) => setInputUncertaintyPercent(parseInt(e.target.value))}
                          className="bg-slate-950 border border-amber-500/20 rounded px-2 py-0.5 text-xs text-amber-400 font-mono focus:outline-none"
                        >
                          <option value={1}>±1%</option>
                          <option value={2}>±2%</option>
                          <option value={5}>±5%</option>
                          <option value={10}>±10%</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      
                      {/* Left: Sensitivity Progress Bars */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                          Relative Sensitivity Factor Ranking
                        </span>
                        
                        <div className="flex flex-col gap-2.5">
                          {sensitivityAnalysis.variablesSensitivity.map((v, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                                  <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded">
                                    {renderSymbol(v.symbol)}
                                  </span>
                                  {v.name}
                                </span>
                                <span className="text-slate-400 italic">
                                  {v.sensitivity > 0.0001 ? `Impact Factor: ${v.sensitivity.toFixed(4)}` : 'Negligible Impact'}
                                </span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${v.percentageOfMax}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Propagated Total Error Answer */}
                      <div className="md:col-span-5 bg-slate-950/80 p-4 rounded-xl border border-amber-500/10 flex flex-col justify-center items-center text-center">
                        <TrendingUp className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-[9px] font-bold uppercase text-amber-400/80 tracking-widest font-mono">
                          Propagated Error in Result
                        </span>
                        <div className="text-2xl font-mono font-black text-white my-1">
                          ±{sensitivityAnalysis.totalUncertaintyAbs.toFixed(4)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          (~{sensitivityAnalysis.totalUncertaintyRelPercent.toFixed(2)}% overall variation)
                        </span>

                        {sensitivityAnalysis.mostSensitiveVar && (
                          <div className="mt-3 text-[9px] text-amber-200/80 leading-relaxed max-w-xs border-t border-amber-500/10 pt-2.5 font-sans">
                            Result is <strong>most sensitive</strong> to <strong>{sensitivityAnalysis.mostSensitiveVar.name}</strong>. A {inputUncertaintyPercent}% error in measurement triggers a <strong>{sensitivityAnalysis.mostSensitiveVar.sensitivity.toFixed(4)} {evaluated.unit || resultUnit}</strong> shift.
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* EXPORT WORKSPACE */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('latex')}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors font-mono ${
                        activeTab === 'latex' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      LaTeX Source
                    </button>
                    <button
                      onClick={() => setActiveTab('python')}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors font-mono ${
                        activeTab === 'python' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Python Script
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors font-mono ${
                        activeTab === 'json' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      JSON Metadata
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const textToCopy = activeTab === 'latex' ? formula : (activeTab === 'python' ? pythonSnippet : jsonMetadata);
                      handleCopy(textToCopy, activeTab);
                    }}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-mono"
                  >
                    {copiedState === activeTab ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedState === activeTab ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre">
                  {activeTab === 'latex' && (
                    <div className="text-indigo-300 select-all leading-normal">
                      {formula}
                    </div>
                  )}
                  {activeTab === 'python' && (
                    <div className="text-emerald-400 select-all leading-relaxed font-mono">
                      {pythonSnippet}
                    </div>
                  )}
                  {activeTab === 'json' && (
                    <div className="text-sky-400 select-all leading-relaxed font-mono">
                      {jsonMetadata}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
