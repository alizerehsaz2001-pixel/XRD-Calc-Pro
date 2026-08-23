const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

code = code.replace(/<\/div>\s*<\/motion\.div>\s*}\)\s*{\/\* Python Scripting Engine/, '</div>\n        {/* Python Scripting Engine');

fs.writeFileSync('components/SupercellTransformationModule.tsx', code);
console.log("Replaced 6!");
