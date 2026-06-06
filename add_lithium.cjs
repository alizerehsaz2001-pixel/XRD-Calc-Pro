const fs = require('fs');

const materials = [
  {
    name: "Lithium (Metal)",
    type: "Metal",
    pattern: "36.2, 100\n52.4, 40\n65.1, 30",
    description: "Pure lithium metal, the lightest crystalline solid element. Essential for high-energy density batteries and fusion materials.",
    formula: "Li",
    elements: ["Li"],
    crystalSystem: "Cubic",
    spaceGroup: "Im-3m",
    density: 0.534,
    applications: ["Lithium-Ion Batteries", "Alloys", "Nuclear Reactors"],
  }
];

const dbPath = 'utils/materialDB.ts';
let code = fs.readFileSync(dbPath, 'utf8');

const lastBracketIndex = code.lastIndexOf('];');

if (lastBracketIndex !== -1) {
  const stringified = materials.map(m => {
    return `  {
    name: "${m.name}",
    type: "${m.type}",
    pattern: "${m.pattern.replace(/\n/g, '\\n')}",
    description: "${m.description}",
    formula: "${m.formula}",
    elements: ${JSON.stringify(m.elements)},
    crystalSystem: "${m.crystalSystem}",
    spaceGroup: "${m.spaceGroup}",
    density: ${m.density},
    applications: ${JSON.stringify(m.applications)},
  }`;
  }).join(',\n');
  
  const before = code.substring(0, lastBracketIndex);
  const after = code.substring(lastBracketIndex);
  
  const lastCharIsComma = before.trim().endsWith(',');
  
  const finalInserted = before + (lastCharIsComma ? "" : ",") + "\n" + stringified + "\n" + after;
  fs.writeFileSync(dbPath, finalInserted);
  console.log('Successfully inserted lithium');
} else {
  console.error("Could not find end of array '];'");
}
