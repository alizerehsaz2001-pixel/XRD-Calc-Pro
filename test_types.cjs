const fs = require('fs');
const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');
const regex = /type: "(.*?)",/g;
let match;
let types = new Set();
while ((match = regex.exec(data)) !== null) {
  types.add(match[1]);
}
console.log(Array.from(types).join('\n'));
