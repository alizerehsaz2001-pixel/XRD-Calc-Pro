const fs = require('fs');

let code = fs.readFileSync('utils/physics.ts', 'utf8');

const importStatement = "import { MATERIAL_DB } from './materialDB';\n";
if (!code.includes("import { MATERIAL_DB }")) {
  code = importStatement + code;
}

const dbStart = code.indexOf(`  // Expanded Database of Common Phases\n  const DB = [`);
const dbEndTarget = `    }\n  ];`;
let dbEnd = code.indexOf(dbEndTarget, dbStart);
if (dbStart !== -1 && dbEnd !== -1) {
  const dbEndIndex = dbEnd + dbEndTarget.length;
  
  const mapLogic = `  const DB = MATERIAL_DB.map(m => {
    return {
      name: m.name,
      formula: m.formula || '',
      cardId: 'COD-' + Math.floor(1000000 + Math.random() * 9000000),
      peaks: m.pattern ? parseXYData(m.pattern).map(p => ({t: p.twoTheta, i: p.intensity})) : [],
      description: m.description,
      crystalSystem: m.crystalSystem,
      spaceGroup: m.spaceGroup,
      density: m.density,
      applications: m.applications,
      materialType: m.type,
      molecularWeight: (m as any).molecularWeight,
      bandGap: (m as any).bandGap,
      elasticModulus: (m as any).elasticModulus,
      magneticProperties: (m as any).magneticProperties,
      opticalProperties: (m as any).opticalProperties,
      hazards: (m as any).hazards
    };
  });`;

  code = code.slice(0, dbStart) + mapLogic + code.slice(dbEndIndex);
  fs.writeFileSync('utils/physics.ts', code);
  console.log("Replaced DB successfully");
} else {
  console.log("Could not find DB bounds", dbStart, dbEnd);
}
