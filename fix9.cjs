const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

const replacement = "      )}\n    </div>\n  );\n};\n";
code = code.replace(/      \)}\n        <\/div>\n      \)}\n    <\/div>\n  \);\n};\n?$/, replacement);

fs.writeFileSync('components/SupercellTransformationModule.tsx', code);
