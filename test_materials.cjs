const fs = require('fs');

const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');

const regex = /name: "(.*?)",\s*type: "(.*?)",\s*pattern:(?:.|\n)*?formula: "(.*?)",/g;

let match;
let count = 0;
while ((match = regex.exec(data)) !== null) {
  const name = match[1];
  const type = match[2];
  const formula = match[3];
  
  if (type === "Carbon & 2D Materials" && (!formula.includes("C") && !name.includes("Graphene") && !name.includes("Carbon") && !name.includes("MXene") && !name.includes("MoS2"))) {
    console.log(`${name} (${formula}) -> ${type}`);
    count++;
  }
}
console.log(`Found ${count} potentially wrong categorized materials.`);
