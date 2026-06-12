const fs = require('fs');
const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');

const regex = /name: "(.*?)",\s*(?:type: "(.*?)",)?/g;
let match;
while ((match = regex.exec(data)) !== null) {
  const name = match[1];
  const type = match[2];
  
  if (type && type === "Carbon & 2D Materials" && (!name.includes("C") && !name.includes("Graph") && !name.includes("Diamond") && !name.includes("MXene") && !name.includes("MoS2") && !name.includes("Boron Nitride"))) {
     console.log(`Hmm: ${name} -> ${type}`);
  }
}
