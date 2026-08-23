const fs = require('fs');

let code = fs.readFileSync('components/ResidualStressModule.tsx', 'utf8');

// Find the component declaration
const compDeclMarker = "export const ResidualStressModule: React.FC = () => {";
const compDeclPos = code.indexOf(compDeclMarker);

// Find the return statement
const returnMarker = "    return (\n    <div className=\"space-y-6 max-w-7xl mx-auto pb-16\">";
const returnPos = code.indexOf(returnMarker);

if (compDeclPos === -1 || returnPos === -1) {
  console.error("Markers not found", { compDeclPos, returnPos });
  process.exit(1);
}

const beforeComp = code.substring(0, compDeclPos + compDeclMarker.length);
const returnAndAfter = code.substring(returnPos);

const stateAndHooksCode = `
  const { lengthUnit = 'Å' } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // State variables
  const [youngsModulus, setYoungsModulus] = useState<number>(MATERIAL_PRESETS[0].E);
  const [poissonsRatio, setPoissonsRatio] = useState<number>(MATERIAL_PRESETS[0].nu);
  const [unstressedTwoTheta, setUnstressedTwoTheta] = useState<number>(MATERIAL_PRESETS[0].twoTheta0);
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [azimuthPhi, setAzimuthPhi] = useState<number>(0);
  const [activePlane, setActivePlane] = useState<string>(MATERIAL_PRESETS[0].plane);
  const [points, setPoints] = useState<TiltPoint[]>(MATERIAL_PRESETS[0].points);

  const [xec, setXec] = useState<XECModel>({
    s1: -poissonsRatio / youngsModulus / 1000,
    halfS2: (1 + poissonsRatio) / youngsModulus / 1000,
    model: 'isotropic',
    anisotropyFactor: 1.0,
  });

  const [activeTab, setActiveTab] = useState<'sin2psi' | 'tensor' | 'compliance' | 'depth' | 'texture'>('sin2psi');
  const [isXecModalOpen, setIsXecModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawImportText, setRawImportText] = useState('');
  const [importError, setImportError] = useState('');

  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState<number>(-1);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 450);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 900);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('chime');
    }, 1350);
    setTimeout(() => {
      setAppState('results');
    }, 1800);
  };

  const loadPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    setYoungsModulus(preset.E);
    setPoissonsRatio(preset.nu);
    setUnstressedTwoTheta(preset.twoTheta0);
    setActivePlane(preset.plane);
    setPoints(preset.points);
    setXec({
      s1: -preset.nu / preset.E / 1000,
      halfS2: (1 + preset.nu) / preset.E / 1000,
      model: 'isotropic',
      anisotropyFactor: 1.0,
    });
  };

  const result = useMemo(() => {
    return calculateResidualStress(points, {
      youngsModulus,
      poissonsRatio,
      unstressedTwoTheta,
      wavelength,
      azimuthPhi,
      xec,
    });
  }, [points, youngsModulus, poissonsRatio, unstressedTwoTheta, wavelength, azimuthPhi, xec]);

  const handleExportCSV = () => {
    if (!result) return;
    let csv = 'Psi_deg,Sin2Psi,TwoTheta_deg,DSpacing_A,Strain,FittedD_A,Residual_A\n';
    result.points.forEach(p => {
      csv += \`\${p.psi},\${p.sin2Psi.toFixed(6)},\${p.twoTheta.toFixed(4)},\${p.dSpacing.toFixed(6)},\${p.strain.toExponential(6)},\${p.fittedD.toFixed(6)},\${p.residual.toExponential(6)}\\n\`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`residual_stress_\${activePlane.replace(/[{}]/g, '')}_\${azimuthPhi}deg.csv\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = () => {
    setImportError('');
    if (!rawImportText.trim()) {
      setImportError('Please paste valid CSV or whitespace-delimited XRD data');
      return;
    }
    const lines = rawImportText.trim().split('\\n');
    const newPoints: TiltPoint[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.toLowerCase().includes('psi')) continue;
      const parts = line.split(/[\\s,;\\t]+/).filter(Boolean);
      if (parts.length >= 2) {
        const psi = parseFloat(parts[0]);
        const twoTheta = parseFloat(parts[1]);
        const intensity = parts.length >= 3 ? parseFloat(parts[2]) : 500;
        const fwhm = parts.length >= 4 ? parseFloat(parts[3]) : 0.3;
        if (!isNaN(psi) && !isNaN(twoTheta)) {
          newPoints.push({ psi, twoTheta, intensity, fwhm });
        }
      }
    }
    if (newPoints.length < 3) {
      setImportError('Failed to parse at least 3 valid (Psi, 2Theta) points');
      return;
    }
    setPoints(newPoints);
    setIsImportModalOpen(false);
    setRawImportText('');
  };
`;

const finalCode = beforeComp + stateAndHooksCode + '\n' + returnAndAfter;
fs.writeFileSync('components/ResidualStressModule.tsx', finalCode);
console.log('Successfully repaired ResidualStressModule.tsx');
