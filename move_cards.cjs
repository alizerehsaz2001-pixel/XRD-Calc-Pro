const fs = require('fs');
let code = fs.readFileSync('components/SelectionRulesModule.tsx', 'utf8');

const physStart = code.indexOf('{/* Physical Context Card */}');
const symEndStr = '{/* Lattice Centering Quick Reference */}';
const symEnd = code.indexOf(symEndStr);

if (physStart !== -1 && symEnd !== -1) {
    const extractedCards = code.substring(physStart, symEnd);
    code = code.substring(0, physStart) + "        " + code.substring(symEnd);

    const resultsStart = code.indexOf('{/* Results Section */}');
    const gridWrapStart = `<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">\n`;
    const gridWrapEnd = `        </div>\n\n        `;

    code = code.substring(0, resultsStart) + gridWrapStart + extractedCards + gridWrapEnd + code.substring(resultsStart);

    fs.writeFileSync('components/SelectionRulesModule.tsx', code);
    console.log("Successfully moved cards.");
} else {
    console.log("Could not find the bounds.");
}
