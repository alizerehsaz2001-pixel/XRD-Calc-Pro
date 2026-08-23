const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

code = code.replace(/\{phases\.map\(p => \(/g, '{calculations.phaseResults.map(p => (');

fs.writeFileSync('components/ReferenceIntensityRatioModule.tsx', code);
