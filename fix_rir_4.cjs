const fs = require('fs');
let code = fs.readFileSync('components/ReferenceIntensityRatioModule.tsx', 'utf8');

code = code.replace("      </div>div>", "      </div>");

fs.writeFileSync('components/ReferenceIntensityRatioModule.tsx', code);
