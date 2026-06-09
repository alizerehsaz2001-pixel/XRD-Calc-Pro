const fs = require('fs');

const data = fs.readFileSync('./utils/materialDB.ts', 'utf8');

const newMaterials = [
  {
    name: "Egyptian Blue (Cuprorivaite)",
    type: "Historical & Pigments",
    pattern: "20.6, 20\n23.4, 40\n24.0, 100\n26.5, 30\n29.1, 80\n31.8, 50\n34.5, 25\n39.2, 15",
    description: "One of the first synthetic pigments, created in ancient Egypt by heating silica, copper, calcium, and soda. Extremely stable and still bright blue today.",
    formula: "CaCuSi4O10",
    elements: ["Ca", "Cu", "Si", "O"],
    crystalSystem: "Tetragonal",
    spaceGroup: "P4/ncc",
    density: 3.08,
    applications: ["Ancient Pigments", "Archaeometry", "Cultural Heritage", "Near-IR Luminescence"],
    molecularWeight: 375.8,
    elasticModulus: 45
  },
  {
    name: "Han Purple",
    type: "Historical & Pigments",
    pattern: "22.1, 45\n24.3, 100\n26.6, 80\n29.4, 30\n31.5, 50\n35.2, 20\n38.7, 10",
    description: "A synthetic barium copper silicate pigment developed in ancient China. Used to paint the Terracotta Army. Notably, it exhibits unique quantum magnetic properties at ultralow temperatures.",
    formula: "BaCuSi2O6",
    elements: ["Ba", "Cu", "Si", "O"],
    crystalSystem: "Tetragonal",
    spaceGroup: "I41/acd",
    density: 4.88,
    applications: ["Ancient Chinese Pigments", "Quantum Materials", "Terracotta Warriors"],
    molecularWeight: 400.9,
    elasticModulus: 52
  },
  {
    name: "Lead White (Hydrocerussite)",
    type: "Historical & Pigments",
    pattern: "24.6, 100\n27.2, 60\n34.1, 55\n36.4, 25\n43.8, 30\n47.1, 15",
    description: "A toxic but highly opaque white pigment used globally from Antiquity until the 20th century. Prepared by exposing lead to vinegar and horse manure vapors.",
    formula: "2PbCO3·Pb(OH)2",
    elements: ["Pb", "C", "O", "H"],
    crystalSystem: "Trigonal",
    spaceGroup: "P-3m1",
    density: 6.8,
    applications: ["Renaissance Painting", "Historical Cosmetics", "Archaeometry"],
    molecularWeight: 775.6,
    elasticModulus: 30
  },
  {
    name: "Cinnabar (Vermilion)",
    type: "Historical & Pigments",
    pattern: "26.5, 100\n28.2, 35\n31.2, 80\n37.4, 25\n43.5, 40\n45.9, 15",
    description: "The bright scarlet to brick-red ore of mercury. Used since antiquity as the pigment vermilion for murals, illuminated manuscripts, and lacquerware.",
    formula: "HgS",
    elements: ["Hg", "S"],
    crystalSystem: "Trigonal",
    spaceGroup: "P3121",
    density: 8.1,
    applications: ["Classical Pigments", "Red Lacquer", "Alchemical Studies"],
    molecularWeight: 232.7,
    elasticModulus: 40
  },
  {
    name: "Lapis Lazuli (Lazurite)",
    type: "Historical & Pigments",
    pattern: "13.8, 20\n24.1, 70\n28.3, 100\n34.8, 40\n42.1, 25\n47.5, 15",
    description: "A complex feldspathoid mineral responsible for the deep celestial blue of Lapis Lazuli. Ground to produce authentic ultramarine, Europe's most expensive Renaissance pigment.",
    formula: "Na6Ca2(Al6Si6O24)(S,SO4,Cl)2",
    elements: ["Na", "Ca", "Al", "Si", "O", "S", "Cl"],
    crystalSystem: "Cubic",
    spaceGroup: "P43n",
    density: 2.4,
    applications: ["Illuminated Manuscripts", "Renaissance Art", "Gemology"],
    molecularWeight: 950.0,
    elasticModulus: 65
  },
  {
    name: "Malachite (Green Copper Carbonate)",
    type: "Historical & Pigments",
    pattern: "11.1, 20\n16.2, 55\n24.0, 100\n31.3, 85\n35.4, 40\n39.8, 30",
    description: "A green copper carbonate hydroxide mineral. Extremely popular in antiquity as a pigment and for ornamental carving in Egypt and Russia.",
    formula: "Cu2CO3(OH)2",
    elements: ["Cu", "C", "O", "H"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/a",
    density: 4.0,
    applications: ["Green Pigment", "Smelting Copper Ore", "Ornamental Stone"],
    molecularWeight: 221.1,
    elasticModulus: 50
  },
  {
    name: "Azurite",
    type: "Historical & Pigments",
    pattern: "15.7, 40\n22.8, 60\n25.3, 100\n30.8, 45\n35.3, 55\n38.3, 20",
    description: "A soft, deep-blue copper mineral. It was the most important blue pigment in European painting from the Middle Ages to the Renaissance, often shifting green (to malachite) over centuries.",
    formula: "Cu3(CO3)2(OH)2",
    elements: ["Cu", "C", "O", "H"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/c",
    density: 3.77,
    applications: ["Historical Painting", "Fresco Pigment", "Mineralogy"],
    molecularWeight: 344.7,
    elasticModulus: 45
  },
  {
    name: "Orpiment",
    type: "Historical & Pigments",
    pattern: "14.3, 100\n17.8, 60\n28.6, 40\n32.2, 35\n36.4, 25\n41.0, 15",
    description: "A golden-yellow arsenic sulfide mineral. Used worldwide as a vibrant yellow pigment despite its high toxicity, and prominently in alchemy.",
    formula: "As2S3",
    elements: ["As", "S"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/n",
    density: 3.49,
    applications: ["Yellow Pigment", "Alchemy"],
    molecularWeight: 246.0,
    elasticModulus: 20
  },
  {
    name: "Realgar",
    type: "Historical & Pigments",
    pattern: "16.1, 100\n18.3, 50\n24.9, 40\n29.5, 60\n34.2, 30",
    description: "A ruby-red arsenic sulfide. Known as 'sandaracha' in ancient Rome, used as a red pigment and poison, though it degrades to yellow pararealgar under light.",
    formula: "As4S4",
    elements: ["As", "S"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/n",
    density: 3.56,
    applications: ["Red Pigment", "Fireworks (Historical)", "Poisons"],
    molecularWeight: 427.9,
    elasticModulus: 15
  },
  {
    name: "Mayan Blue (Palygorskite base)",
    type: "Historical & Pigments",
    pattern: "8.4, 100\n13.7, 40\n16.4, 15\n19.8, 55\n27.5, 25\n34.2, 10",
    description: "A remarkably resilient azure pigment synthesized by pre-Columbian Mesoamerican cultures. It consists of the organic dye indigo trapped within the crystalline lattice of palygorskite clay.",
    formula: "(Mg,Al)2Si4O10(OH)·4H2O",
    elements: ["Mg", "Al", "Si", "O", "H", "C", "N"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P2/a",
    density: 2.1,
    applications: ["Mesoamerican Murals", "Pottery", "Nanocomposite Precursor"],
    molecularWeight: 450.0,
    elasticModulus: 10
  },
  {
    name: "Wootz Steel (Cementite Phase in Iron)",
    type: "Historical & Metallurgical",
    pattern: "37.8, 40\n40.1, 50\n42.8, 80\n43.7, 100\n45.8, 70\n48.2, 30",
    description: "Crucible steel characterized by a pattern of bands. The bands are formed by sheets of microscopic cementite (Fe3C) particles in a pearlite matrix. The origins of legendary Damascus swords.",
    formula: "Fe3C",
    elements: ["Fe", "C"],
    crystalSystem: "Orthorhombic",
    spaceGroup: "Pnma",
    density: 7.69,
    applications: ["Advanced Weaponry (Historic)", "Archaeometallurgy", "Nanotube Research"],
    molecularWeight: 179.5,
    elasticModulus: 200
  },
  {
    name: "Kamacite (Meteoric Iron)",
    type: "Historical & Metallurgical",
    pattern: "44.6, 100\n64.9, 20\n82.2, 35\n98.7, 10\n116.1, 15",
    description: "An alloy of iron and nickel (typically up to 7% Ni) found almost exclusively in meteorites. The earliest iron tools crafted by humanity were cold-forged from kamacite.",
    formula: "Fe0.9Ni0.1",
    elements: ["Fe", "Ni"],
    crystalSystem: "Cubic",
    spaceGroup: "Im-3m",
    density: 7.9,
    applications: ["Meteoritics", "Pre-Bronze Age Artifacts"],
    molecularWeight: 56.1,
    elasticModulus: 210
  },
  {
    name: "Historical Bronze (Cu-Sn Alpha solid solution)",
    type: "Historical & Metallurgical",
    pattern: "42.5, 100\n49.5, 45\n72.2, 25\n87.3, 20",
    description: "Characteristic XRD profile of ancient cast bronze (approx. 10% tin). The peak positions are slightly shifted from pure copper due to lattice expansion by tin atoms.",
    formula: "Cu0.9Sn0.1",
    elements: ["Cu", "Sn"],
    crystalSystem: "Cubic",
    spaceGroup: "Fm-3m",
    density: 8.8,
    applications: ["Bronze Age Weaponry", "Statuary", "Numismatics"],
    molecularWeight: 69.1,
    elasticModulus: 110
  },
  {
    name: "Electrum (Gold-Silver Alloy)",
    type: "Historical & Metallurgical",
    pattern: "38.1, 100\n44.3, 40\n64.5, 30\n77.5, 35",
    description: "A naturally occurring or artificially mixed alloy of gold and silver. Used for the earliest known metal coins in Lydia and ancient Egyptian obelisk coatings.",
    formula: "Au0.5Ag0.5",
    elements: ["Au", "Ag"],
    crystalSystem: "Cubic",
    spaceGroup: "Fm-3m",
    density: 14.5,
    applications: ["Ancient Coinage", "Jewelry"],
    molecularWeight: 152.4,
    elasticModulus: 80
  },
  {
    name: "Alum (Potassium Alum)",
    type: "Historical & Pigments",
    pattern: "10.4, 20\n21.1, 100\n30.2, 70\n35.4, 40\n48.2, 30",
    description: "Used widely in antiquity as a mordant to fix organic dyes (like Tyrian Purple or Madder) onto fabrics, making the colors fast and bright.",
    formula: "KAl(SO4)2·12H2O",
    elements: ["K", "Al", "S", "O", "H"],
    crystalSystem: "Cubic",
    spaceGroup: "Pa-3",
    density: 1.72,
    applications: ["Dye Mordanting", "Tanning", "Water Purification"],
    molecularWeight: 474.4,
    elasticModulus: 10
  },
  {
    name: "Bone Ash (Hydroxylapatite)",
    type: "Historical & Ceramics",
    pattern: "25.8, 40\n31.8, 100\n32.2, 60\n32.9, 60\n39.8, 20\n46.7, 30\n49.5, 25",
    description: "Calcined animal bone, primarily hydroxylapatite. Historically used for making cupels for assaying silver/gold, and later for creating Bone China.",
    formula: "Ca10(PO4)6(OH)2",
    elements: ["Ca", "P", "O", "H"],
    crystalSystem: "Hexagonal",
    spaceGroup: "P63/m",
    density: 3.16,
    applications: ["Bone China", "Cupellation", "Fertilizer (Historical)"],
    molecularWeight: 1004.6,
    elasticModulus: 110
  },
  {
    name: "Roman Concrete (Tobermorite binder)",
    type: "Historical & Ceramics",
    pattern: "7.8, 100\n16.1, 20\n29.1, 80\n29.9, 65\n31.8, 40",
    description: "Tobermorite is a rare calcium silicate hydrate mineral, but it formed abundantly in Roman marine concrete (opus caementicium) yielding incredible multi-millennia durability.",
    formula: "Ca5Si6O16(OH)2·4H2O",
    elements: ["Ca", "Si", "O", "H"],
    crystalSystem: "Orthorhombic",
    spaceGroup: "C2221",
    density: 2.45,
    applications: ["Ancient Architecture", "Marine Concrete", "Archaeology"],
    molecularWeight: 730.0,
    elasticModulus: 40
  },
  {
    name: "Natron",
    type: "Historical & Chemicals",
    pattern: "16.8, 100\n26.6, 20\n31.7, 40\n34.2, 60\n38.4, 25\n40.1, 15",
    description: "A naturally occurring mixture of sodium carbonate decahydrate and sodium bicarbonate. Essential in ancient Egyptian mummification and early glassmaking.",
    formula: "Na2CO3·10H2O",
    elements: ["Na", "C", "O", "H"],
    crystalSystem: "Monoclinic",
    spaceGroup: "C2/c",
    density: 1.46,
    applications: ["Mummification", "Faience", "Glassmaking"],
    molecularWeight: 286.1,
    elasticModulus: 5
  },
  {
    name: "Litharge",
    type: "Historical & Pigments",
    pattern: "28.5, 100\n32.7, 50\n47.1, 35\n55.4, 40\n58.0, 15",
    description: "Lead(II) oxide (red/yellow). Crucial in antiquity for the cupellation of silver, and as an historic pigment and drying agent for oil paints.",
    formula: "PbO",
    elements: ["Pb", "O"],
    crystalSystem: "Tetragonal",
    spaceGroup: "P4/nmm",
    density: 9.53,
    applications: ["Cupellation", "Pigments", "Lead Glass"],
    molecularWeight: 223.2,
    elasticModulus: 45
  },
  {
    name: "Verdigris (Copper Acetate)",
    type: "Historical & Pigments",
    pattern: "12.5, 100\n16.1, 55\n22.8, 40\n26.4, 25\n30.5, 15",
    description: "A synthetic blue-green pigment widely used from antiquity to the 19th century, made by hanging copper plates over boiling vinegar in sealed pots.",
    formula: "Cu(CH3COO)2·H2O",
    elements: ["Cu", "C", "H", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "C2/c",
    density: 1.88,
    applications: ["Historical Pigments", "Illuminated Manuscripts", "Fungicide (Historic)"],
    molecularWeight: 199.6,
    elasticModulus: 10
  }
];

let itemsString = newMaterials.map(mat => '  ' + JSON.stringify(mat, null, 2).replace(/\n/g, '\n  ')).join(',\n');

const endOfArrayStr = `];\n\n// Deduplicate MATERIAL_DB`;

if (data.includes(endOfArrayStr)) {
  const updatedData = data.replace(endOfArrayStr, `,\n${itemsString}\n];\n\n// Deduplicate MATERIAL_DB`);
  fs.writeFileSync('./utils/materialDB.ts', updatedData, 'utf8');
  console.log("Successfully appended historical materials.");
} else {
  // Let's just find the last "];"
  const idx = data.lastIndexOf('];');
  if (idx !== -1) {
    const updatedData = data.substring(0, idx) + ',\n' + itemsString + '\n' + data.substring(idx);
    fs.writeFileSync('./utils/materialDB.ts', updatedData, 'utf8');
    console.log("Successfully appended historical materials using index.");
  } else {
    console.log("Could not find the end of the array.");
  }
}
