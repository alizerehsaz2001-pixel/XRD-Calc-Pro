const fs = require('fs');

let code = fs.readFileSync('components/MethodOfMomentsModule.tsx', 'utf8');

// Ensure playSynthTone and RotateCcw are imported
if (!code.includes("import { playSynthTone }")) {
  code = code.replace("import { useSettings,", "import { playSynthTone } from '../utils/sound';\nimport { useSettings,");
}
if (!code.includes("RotateCcw")) {
  code = code.replace("Sparkles,", "Sparkles,\n  RotateCcw,");
}

// Add appState & computingStep
const stateMarker = "const [copiedNotification, setCopiedNotification] = useState(false);";
if (!code.includes("const [appState, setAppState]")) {
  code = code.replace(
    stateMarker,
    `const [copiedNotification, setCopiedNotification] = useState(false);
  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState<number>(-1);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 500);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 1000);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('chime');
    }, 1500);
    setTimeout(() => {
      setAppState('results');
    }, 2000);
  };`
  );
}

fs.writeFileSync('components/MethodOfMomentsModule.tsx', code);
console.log('Added appState to MethodOfMomentsModule.tsx');
