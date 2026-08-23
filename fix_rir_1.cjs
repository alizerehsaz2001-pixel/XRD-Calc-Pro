const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

const injection = `
  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState(-1);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 700);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 1400);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('tick');
    }, 2100);
    setTimeout(() => {
      setAppState('results');
      playSynthTone('success');
    }, 3000);
  };
`;
code = code.replace("  const [amorphousWtPct", injection + "\n  const [amorphousWtPct");
fs.writeFileSync('components/ReferenceIntensityRatioModule.tsx', code);
