const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

code = code.replace(/<RotateCcw className="w-4 h-4" \/>/g, '<RefreshCw className="w-4 h-4" />');
// Actually, earlier the edit failed because `RotateCcw` might not be in the file inside the `<RotateCcw...` tag? Let me check line 2217 again!
// Oh, the error says:
// components/ReferenceIntensityRatioModule.tsx(2217,16): error TS2304: Cannot find name 'RotateCcw'.
// And in line 5 it is imported as `RotateCcw`. 
