const fs = require('fs');
const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');

const regex = /name: "(.*?)",\s*(?:type: ".*?",\s*)?pattern:(?:.|\n)*?crystalSystem: "(.*?)",\s*spaceGroup: "(.*?)"/g;
let match;
while ((match = regex.exec(data)) !== null) {
  const name = match[1];
  const sys = match[2];
  const sg = match[3];
  
  if (sys === "Cubic" && !sg.includes("-3") && !sg.toLowerCase().includes("m3") && !sg.toLowerCase().includes("23") && sg !== "Fd-3m" && sg !== "Fm-3m" && sg !== "Im-3m" && sg !== "Pm-3m") {
     console.log(`Cubic mismatch? ${name} -> ${sg}`);
  }
  if (sys === "Hexagonal" && !sg.toLowerCase().includes("p6") && !sg.toLowerCase().includes("r3") && !sg.toLowerCase().includes("p3")) {
     console.log(`Hex mismatch? ${name} -> ${sg}`);
  }
}
