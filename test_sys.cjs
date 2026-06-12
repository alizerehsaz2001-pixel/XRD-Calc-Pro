const fs = require('fs');

const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');
const regex = /name: "(.*?)",\s*(?:type: ".*?",\s*)?pattern:(?:.|\n)*?crystalSystem: "(.*?)",\s*spaceGroup: "(.*?)"/g;

let match;
while ((match = regex.exec(data)) !== null) {
  const name = match[1];
  const sys = match[2];
  const sg = match[3];
  
  if (name.includes('Titanium Dioxide') || name.includes('Graphene') || name.includes('Diamond')) {
      // just a sample
  }
}
