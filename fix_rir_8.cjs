const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

code = code.replace(/<RotateCcw className="w-4 h-4" \/>/g, '<RefreshCw className="w-4 h-4" />');
// Wait, I already did that and it didn't find RotateCcw? Let me check line 2217
