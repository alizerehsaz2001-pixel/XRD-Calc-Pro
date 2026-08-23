const fs = require('fs');

let code = fs.readFileSync('components/ResidualStressModule.tsx', 'utf8');

// Check if playSynthTone is imported
if (!code.includes("import { playSynthTone }")) {
  code = code.replace("import { useSettings,", "import { playSynthTone } from '../utils/sound';\nimport { useSettings,");
}

// Add appState and computingStep state
const stateInsertRegex = /\/\/ Tab & View States\s+const \[activeTab, setActiveTab\] = useState/;
if (!code.includes("const [appState, setAppState]")) {
  code = code.replace(
    stateInsertRegex,
    `const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');\n  const [computingStep, setComputingStep] = useState<number>(-1);\n\n  const startComputation = () => {\n    setAppState('computing');\n    setComputingStep(0);\n    playSynthTone('tick');\n    setTimeout(() => {\n      setComputingStep(1);\n      playSynthTone('tick');\n    }, 500);\n    setTimeout(() => {\n      setComputingStep(2);\n      playSynthTone('tick');\n    }, 1000);\n    setTimeout(() => {\n      setComputingStep(3);\n      playSynthTone('chime');\n    }, 1500);\n    setTimeout(() => {\n      setAppState('results');\n    }, 2000);\n  };\n\n  // Tab & View States\n  const [activeTab, setActiveTab] = useState`
  );
}

fs.writeFileSync('components/ResidualStressModule.tsx', code);
console.log('Added appState variables and startComputation');
