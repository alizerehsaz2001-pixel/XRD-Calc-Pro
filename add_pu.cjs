const fs = require('fs');

const pathDB = './utils/materialDB.ts';
let dbContent = fs.readFileSync(pathDB, 'utf-8');

const newMaterials = [
  {
    name: 'Plutonium (Delta Phase)',
    type: 'Actinide',
    pattern: '31.5, 100\n36.5, 45\n52.8, 60\n62.5, 20',
    description: 'Face-centered cubic phase of plutonium, typically stabilized at room temperature by alloying with small amounts of gallium or aluminum. Features anomalous density expansion.',
    formula: 'Pu (δ)',
    crystalSystem: 'Face-centered Cubic',
    spaceGroup: 'Fm-3m',
    density: 15.92,
    applications: ['Actinide Physics', 'Nuclear Research Alloys']
  },
  {
    name: 'Plutonium Dioxide (PuO2)',
    type: 'Actinide Oxide',
    pattern: '28.6, 100\n33.1, 80\n47.5, 60\n56.4, 40\n59.2, 30',
    description: 'Stable ceramic oxide form of plutonium. Extremely insoluble. Commonly utilized in mixed oxide (MOX) commercial nuclear reactor fuels and radioisotope thermoelectric generators (RTGs).',
    formula: 'PuO2',
    crystalSystem: 'Cubic (Fluorite)',
    spaceGroup: 'Fm-3m',
    density: 11.5,
    applications: ['MOX Fuel', 'RTG Heat Sources', 'Space Exploration']
  },
  {
    name: 'Plutonium (Alpha Phase)',
    type: 'Actinide',
    pattern: '20.1, 40\n25.5, 60\n30.2, 100\n32.5, 80\n40.1, 45',
    description: 'The standard room-temperature phase of pure, unalloyed plutonium. Features a highly complex monoclinic crystal structure and is exceptionally dense and brittle.',
    formula: 'Pu (α)',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/m',
    density: 19.86,
    applications: ['Actinide Metallurgy', 'Scientific Research']
  }
];

let itemsStr = newMaterials.map(m => `  {
  name: '${m.name}',
  type: '${m.type}',
  pattern: '${m.pattern.replace(/\n/g, '\\n')}',
  description: '${m.description.replace(/'/g, "\\'")}',
  formula: '${m.formula}',
  crystalSystem: '${m.crystalSystem}',${m.spaceGroup ? `\n  spaceGroup: '${m.spaceGroup}',` : ''}
  density: ${m.density},
  applications: ${JSON.stringify(m.applications)}
}`).join(',\n');

dbContent = dbContent.replace(/\n\];/, `,\n${itemsStr}\n];`);
fs.writeFileSync(pathDB, dbContent, 'utf-8');
console.log('Successfully injected Plutonium items into DB');

const pathComp = './components/DeepLearningModule.tsx';
let dlContent = fs.readFileSync(pathComp, 'utf-8');

const targetStr = "{ id: 'Polonium', label: 'Polonium (Po)' },";
const newItemsStr = `{ id: 'PuDelta', label: 'Plutonium (δ)' },
                        { id: 'PuAlpha', label: 'Plutonium (α)' },
                        { id: 'PuO2', label: 'PuO2 (Dioxide)' },`;

dlContent = dlContent.replace(targetStr, targetStr + '\n                        ' + newItemsStr);

const loadTargetStr = "type === 'Polonium' ? 'Polonium (Po)' :";
const newLoadStr = `type === 'PuDelta' ? 'Plutonium (Delta Phase)' :
                        type === 'PuAlpha' ? 'Plutonium (Alpha Phase)' :
                        type === 'PuO2' ? 'Plutonium Dioxide (PuO2)' :`;

if (dlContent.includes(loadTargetStr)) {
   dlContent = dlContent.replace(loadTargetStr, loadTargetStr + '\n                        ' + newLoadStr);
} else {
   console.log("Could not find line in DeepLearningModule for load");
}

fs.writeFileSync(pathComp, dlContent, 'utf-8');
console.log('Successfully updated DeepLearningModule.tsx');
