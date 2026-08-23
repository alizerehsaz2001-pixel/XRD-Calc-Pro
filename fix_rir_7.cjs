const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

code = code.replace(/<RotateCcw className="w-4 h-4" \/>/g, '<RefreshCw className="w-4 h-4" />');

fs.writeFileSync('components/ReferenceIntensityRatioModule.tsx', code);
