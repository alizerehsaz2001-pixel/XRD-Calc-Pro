const fs = require('fs');
let code = fs.readFileSync('components/DeepLearningModule.tsx', 'utf8');
const lines = code.split('\n');

let dbStart = -1;
let dbEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const MATERIAL_DB = [')) {
    dbStart = i;
  }
  if (dbStart !== -1 && lines[i].includes('export const DeepLearningModule')) {
    // Need to backtrack to find end of MATERIAL_DB Array
    for (let j = i - 1; j > dbStart; j--) {
      if (lines[j].trim() === '];') {
        dbEnd = j;
        break;
      }
    }
    break;
  }
}

if (dbStart !== -1 && dbEnd !== -1) {
  const dbLines = lines.slice(dbStart, dbEnd + 1);
  dbLines[0] = dbLines[0].replace('const MATERIAL_DB', 'export const MATERIAL_DB');
  
  const materialDBcode = dbLines.join('\n');
  fs.writeFileSync('utils/materialDB.ts', materialDBcode);

  const importLine = "import { MATERIAL_DB } from '../utils/materialDB';\n";
  const newCode = lines.slice(0, dbStart).join('\n') + '\n' + importLine + '\n' + lines.slice(dbEnd + 1).join('\n');
  fs.writeFileSync('components/DeepLearningModule.tsx', newCode);
  console.log("Extraction successful.");
} else {
  console.log("Could not find bounds", dbStart, dbEnd);
}
