const fs = require('fs');

const materials = [
  {
    name: "Lithium Cobalt Oxide (LCO)",
    type: "Energy Materials",
    pattern: "18.9, 100\n37.6, 20\n38.4, 25\n39.0, 30\n45.0, 45\n49.3, 30\n59.5, 20",
    description: "A widely used cathode material for lithium-ion batteries in portable electronics, characterized by high energy density but moderate stability.",
    formula: "LiCoO2",
    elements: ["Li", "Co", "O"],
    crystalSystem: "Trigonal",
    spaceGroup: "R-3m",
    density: 5.01,
    applications: ["Lithium-Ion Batteries", "Portable Electronics"],
  },
  {
    name: "Lithium Iron Phosphate (LFP)",
    type: "Energy Materials",
    pattern: "17.0, 40\n20.7, 30\n25.5, 40\n29.7, 80\n35.6, 100\n37.8, 40\n42.3, 30",
    description: "A robust, highly safe cathode material for lithium-ion batteries. Known for excellent thermal stability and long cycle life.",
    formula: "LiFePO4",
    elements: ["Li", "Fe", "P", "O"],
    crystalSystem: "Orthorhombic",
    spaceGroup: "Pnma",
    density: 3.6,
    applications: ["Electric Vehicles", "Energy Storage Systems", "Power Tools"],
  },
  {
    name: "Lithium Manganese Oxide (LMO)",
    type: "Energy Materials",
    pattern: "18.6, 100\n36.1, 40\n44.1, 50\n48.1, 20\n58.3, 25",
    description: "Spinel-type cathode material. Offers lower cost and high rate capability but can suffer from capacity fading at high temperatures.",
    formula: "LiMn2O4",
    elements: ["Li", "Mn", "O"],
    crystalSystem: "Cubic",
    spaceGroup: "Fd-3m",
    density: 4.14,
    applications: ["Power Tools", "Medical Devices", "Electric Vehicles"],
  },
  {
    name: "Lithium Nickel Manganese Cobalt Oxide (NMC 111)",
    type: "Energy Materials",
    pattern: "18.7, 100\n36.7, 20\n37.9, 25\n44.3, 40\n48.5, 30\n58.8, 20",
    description: "An optimization of LCO where Nickel, Manganese, and Cobalt are mixed. Provides an excellent balance of energy density, power, and safety.",
    formula: "LiNi0.33Mn0.33Co0.33O2",
    elements: ["Li", "Ni", "Mn", "Co", "O"],
    crystalSystem: "Trigonal",
    spaceGroup: "R-3m",
    density: 4.65,
    applications: ["Electric Vehicles", "Grid Energy Storage", "Power Tools"],
  },
  {
    name: "Lithium Nickel Cobalt Aluminum Oxide (NCA)",
    type: "Energy Materials",
    pattern: "18.6, 100\n36.5, 25\n37.8, 20\n44.2, 45\n48.4, 30",
    description: "A high-energy-density cathode material primarily adopted by leading EV manufacturers. Minor aluminum addition improves thermal stability.",
    formula: "LiNi0.8Co0.15Al0.05O2",
    elements: ["Li", "Ni", "Co", "Al", "O"],
    crystalSystem: "Trigonal",
    spaceGroup: "R-3m",
    density: 4.75,
    applications: ["Traction Batteries", "Electric Vehicles"],
  },
  {
    name: "Lithium Titanate (LTO)",
    type: "Energy Materials",
    pattern: "18.3, 100\n35.5, 40\n43.2, 45\n47.3, 20\n57.1, 25\n62.7, 30\n66.0, 15",
    description: "A specialized anode material. Despite lower voltage, it offers extraordinary cycle life, rapid charging, and high safety.",
    formula: "Li4Ti5O12",
    elements: ["Li", "Ti", "O"],
    crystalSystem: "Cubic",
    spaceGroup: "Fd-3m",
    density: 3.49,
    applications: ["Fast-Charging Batteries", "Grid Storage", "Electric Buses"],
  },
  {
    name: "Lithium Carbonate",
    type: "Mineral/Precursor",
    pattern: "21.2, 80\n29.3, 100\n30.5, 60\n31.7, 70\n34.2, 30\n36.9, 40",
    description: "An essential precursor inorganic compound used heavily in the production of lithium-ion batteries and as a pharmaceutical treatment for bipolar disorder.",
    formula: "Li2CO3",
    elements: ["Li", "C", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "C2/c",
    density: 2.11,
    applications: ["Battery Precursor", "Pharmaceuticals", "Glass and Ceramics"],
  },
  {
    name: "Lithium Hydroxide Monohydrate",
    type: "Mineral/Precursor",
    pattern: "15.2, 40\n20.4, 100\n21.8, 30\n29.1, 80\n33.6, 60",
    description: "Another vital precursor material, particularly preferred for synthesizing nickel-rich cathode materials (like NMC and NCA) due to its lower melting point.",
    formula: "LiOH.H2O",
    elements: ["Li", "O", "H"],
    crystalSystem: "Monoclinic",
    spaceGroup: "C2/m",
    density: 1.51,
    applications: ["Battery Precursor", "CO2 Scrubbing", "Lubricating Greases"],
  }
];

const dbPath = 'utils/materialDB.ts';
let code = fs.readFileSync(dbPath, 'utf8');

const lastBracketIndex = code.lastIndexOf('];');

if (lastBracketIndex !== -1) {
  const stringified = materials.map(m => {
    return `  {
    name: "${m.name}",
    type: "${m.type}",
    pattern: "${m.pattern.replace(/\n/g, '\\n')}",
    description: "${m.description}",
    formula: "${m.formula}",
    elements: ${JSON.stringify(m.elements)},
    crystalSystem: "${m.crystalSystem}",
    spaceGroup: "${m.spaceGroup}",
    density: ${m.density},
    applications: ${JSON.stringify(m.applications)},
  }`;
  }).join(',\n');
  
  const before = code.substring(0, lastBracketIndex);
  const after = code.substring(lastBracketIndex);
  
  const lastCharIsComma = before.trim().endsWith(',');
  
  const finalInserted = before + (lastCharIsComma ? "" : ",") + "\n" + stringified + "\n" + after;
  fs.writeFileSync(dbPath, finalInserted);
  console.log('Successfully inserted lithium compounds');
} else {
  console.error("Could not find end of array '];'");
}
