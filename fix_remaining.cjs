const fs = require('fs');
let data = fs.readFileSync('./utils/materialDB.ts', 'utf8');

function replaceType(namePart, newType) {
  const re = new RegExp(`(name: ".*?(?:${namePart}).*?",\\s*type: ")Carbon & 2D Materials(")`, 'g');
  data = data.replace(re, `$1${newType}$2`);
}

replaceType('Diopside', 'Minerals, Ores & Geology');
replaceType('Labradorite', 'Minerals, Ores & Geology');
replaceType('Zoisite', 'Minerals, Ores & Geology');

fs.writeFileSync('./utils/materialDB.ts', data);
