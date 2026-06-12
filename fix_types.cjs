const fs = require('fs');
const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');

// I'll update the "Carbon & 2D Materials" for the 30 specific materials
let newData = data;

function replaceType(namePart, newType) {
  const re = new RegExp(`(name: ".*?(?:${namePart}).*?",\\s*type: ")Carbon & 2D Materials(")`, 'g');
  newData = newData.replace(re, `$1${newType}$2`);
}

replaceType('Quartz', 'Minerals, Ores & Geology');
replaceType('Cristobalite', 'Minerals, Ores & Geology');
replaceType('Tridymite', 'Minerals, Ores & Geology');
replaceType('Stishovite', 'Minerals, Ores & Geology');
replaceType('Keatite', 'Minerals, Ores & Geology');
replaceType('Moganite', 'Minerals, Ores & Geology');
replaceType('Seifertite', 'Minerals, Ores & Geology');
replaceType('Coesite', 'Minerals, Ores & Geology');
replaceType('Wurtzite', 'Semiconductors & Photonics');
replaceType('Crocidolite', 'Minerals, Ores & Geology');
replaceType('Andalusite', 'Minerals, Ores & Geology');
replaceType('Kyanite', 'Minerals, Ores & Geology');
replaceType('Sillimanite', 'Minerals, Ores & Geology');
replaceType('Fayalite', 'Minerals, Ores & Geology');
replaceType('Albite', 'Minerals, Ores & Geology');
replaceType('Sanidine', 'Minerals, Ores & Geology');
replaceType('Celestine', 'Minerals, Ores & Geology');
replaceType('Glaucophane', 'Minerals, Ores & Geology');
replaceType('Staurolite', 'Minerals, Ores & Geology');
replaceType('Chrysoberyl', 'Minerals, Ores & Geology');
replaceType('Ice ', 'Minerals, Ores & Geology');

// Now let's check for other obvious physical or chemical errors.
// Like Diamond with wrong space group, etc.
fs.writeFileSync('./utils/materialDB.ts', newData);
