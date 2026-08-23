const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

code = code.replace(/\{p\.crystallineFraction\?\.toFixed\(2\) \|\| 0\} wt%/g, "{p.crystallineFraction?.toFixed(2) || 0} wt%");
code = code.replace(/p\.crystallineFraction/g, "(p as any).crystallineFraction");

fs.writeFileSync('components/ReferenceIntensityRatioModule.tsx', code);
