with open("utils/materialDB.ts", "r") as f:
    code = f.read()

import re

# Find position of 'const uniqueMap = new Map'
pos = code.find("const uniqueMap = new Map")
if pos != -1:
    # Find the closing bracket before this
    bracket_pos = code.rfind("];", 0, pos)
    if bracket_pos != -1:
        new_items_js = """,
  {
    name: "45S5 Bioglass-Ceramic (Hench Glass)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "29.80, 100, 1, 1, 0\\n32.40, 85, 2, 0, 0\\n34.10, 60, 2, 1, 1\\n48.50, 30, 2, 2, 0",
    description: "Original bioactive Hench glass-ceramic (45SiO2-24.5CaO-24.5Na2O-6P2O5). Upon physiological immersion in simulated body fluid (SBF), it rapidly forms an osteoconductive hydroxycarbonate apatite (HCA) surface layer that bonds strongly with soft and hard tissue.",
    formula: "45SiO2-24.5CaO-24.5Na2O-6P2O5",
    elements: ["Si", "O", "Ca", "Na", "P"],
    crystalSystem: "Glass-Ceramic",
    spaceGroup: "Combeite (P21/c + Amorphous)",
    density: 2.70,
    applications: ["Bone Void Fillers", "Periodontal Defect Repair", "Hypersensitive Dentin Treatment", "Bioactive Bone Scaffolds"],
    molecularWeight: 60.08,
    elasticModulus: 35
  },
  {
    name: "Octacalcium Phosphate (OCP)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "4.72, 100, 1, 0, 0\\n9.45, 55, 2, 0, 0\\n14.20, 25, 3, 0, 0\\n26.10, 80, 0, 0, 2\\n31.80, 70, 2, 1, 1",
    description: "Biological precursor phase in human bone, dentin, and tooth enamel mineralization. Possesses an alternating apatitic layer and hydrated sub-layer structure, imparting high bio-resorbability and osteoinductive signaling for bone tissue repair.",
    formula: "Ca8H2(PO4)6·5H2O",
    elements: ["Ca", "H", "P", "O"],
    crystalSystem: "Triclinic",
    spaceGroup: "P-1 (No. 2)",
    density: 2.61,
    applications: ["Precursor Bone Mineralization", "Dental Enamel Remineralization", "Osteoinductive Grafts"],
    molecularWeight: 982.53,
    elasticModulus: 45
  },
  {
    name: "Dicalcium Phosphate Dihydrate (DCPD / Brushite)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "11.62, 100, 0, 2, 0\\n20.93, 85, 0, 4, 0\\n29.28, 75, -1, 2, 1\\n30.50, 60, -1, 4, 1\\n34.15, 40, -2, 2, 0",
    description: "Fast-setting, acidic calcium phosphate mineral ubiquitous in self-setting resorbable orthopedic bone cements. Dissolves under physiological conditions to promote active endogenous bone remodeling.",
    formula: "CaHPO4·2H2O",
    elements: ["Ca", "H", "P", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "Ia (No. 9)",
    density: 2.31,
    applications: ["Resorbable Bone Cements", "Maxillofacial Reconstruction", "Targeted Drug Delivery Vehicles"],
    molecularWeight: 172.09,
    elasticModulus: 22
  },
  {
    name: "Monocalcium Phosphate Monohydrate (MCPM)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "7.52, 100, 0, 0, 1\\n15.10, 80, 0, 0, 2\\n22.80, 65, 0, 0, 3\\n24.20, 45, 1, 1, 0\\n30.60, 50, 1, 1, 2",
    description: "Highly soluble acidic calcium phosphate component used in dual-component surgical bone cements. Reacts rapidly with basic calcium salts (such as TTCP or CaO) to yield resorbable brushite or hydroxyapatite matrices.",
    formula: "Ca(H2PO4)2·H2O",
    elements: ["Ca", "H", "P", "O"],
    crystalSystem: "Triclinic",
    spaceGroup: "P-1 (No. 2)",
    density: 2.22,
    applications: ["Injectable Bone Cements", "Dentistry Pulp Capping", "Calcium Release Matrices"],
    molecularWeight: 252.07,
    elasticModulus: 18
  },
  {
    name: "Tetracalcium Phosphate (TTCP / Hilgenstockite)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "29.20, 70, 0, 2, 0\\n29.80, 100, 2, 0, 0\\n31.20, 85, 1, 2, 1\\n32.50, 65, 2, 1, 1\\n33.80, 40, 2, 2, 0",
    description: "The most basic calcium phosphate phase (Ca/P molar ratio = 2.0). Serves as the key reactant in apatitic self-setting calcium phosphate cements, reacting with acidic phosphates to form hydroxyapatite at body temperature without exothermicity.",
    formula: "Ca4(PO4)2O",
    elements: ["Ca", "P", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21 (No. 4)",
    density: 3.05,
    applications: ["Self-Setting Apatite Cements", "Acoustic Bone Reconstruction", "In Situ Setting Root Fillers"],
    molecularWeight: 366.25,
    elasticModulus: 68
  },
  {
    name: "Strontium-Substituted Hydroxyapatite (Sr-HAp 10 mol%)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "25.75, 40, 0, 0, 2\\n28.02, 15, 1, 0, 2\\n31.65, 100, 2, 1, 1\\n32.08, 90, 1, 1, 2\\n32.78, 55, 3, 0, 0\\n46.50, 35, 2, 2, 2",
    description: "Bioactive osteoinductive bioceramic incorporating 10 mol% strontium ions. Strontium replacement for calcium stimulates osteoblast cell proliferation while inhibiting osteoclast activity, offering targeted treatment for osteoporotic bone defects.",
    formula: "Ca9Sr(PO4)6(OH)2",
    elements: ["Ca", "Sr", "P", "O", "H"],
    crystalSystem: "Hexagonal",
    spaceGroup: "P63/m (No. 176)",
    density: 3.28,
    applications: ["Osteoporotic Bone Void Fillers", "Bioactive Scaffold Coatings", "Orthopedic Tissue Engineering"],
    molecularWeight: 1052.1,
    elasticModulus: 95
  },
  {
    name: "Fluorapatite (FAp)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "25.80, 38, 0, 0, 2\\n28.10, 15, 1, 0, 2\\n31.90, 100, 2, 1, 1\\n32.30, 92, 1, 1, 2\\n33.00, 60, 3, 0, 0\\n46.80, 38, 2, 2, 2",
    description: "Fluorinated calcium phosphate bioceramic (Ca10(PO4)6F2). Fluoride ion substitution into the apatite channel dramatically increases thermal stability and lowers chemical solubility in acidic oral environments, conferring superior dental caries resistance.",
    formula: "Ca10(PO4)6F2",
    elements: ["Ca", "P", "O", "F"],
    crystalSystem: "Hexagonal",
    spaceGroup: "P63/m (No. 176)",
    density: 3.20,
    applications: ["Dental Enamel Remineralization", "Acid-Resistant Toothpaste Additive", "Prosthetic Joint Plasma Coatings"],
    molecularWeight: 1008.6,
    elasticModulus: 110
  },
  {
    name: "Mineral Trioxide Aggregate (MTA)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "29.40, 100, 2, 0, 0\\n32.20, 90, 0, 2, 2\\n34.30, 70, 2, 2, 0\\n41.20, 50, 1, 1, 4\\n51.60, 35, 3, 1, 2",
    description: "Surgical endodontic biocompatible cement mixture composed primarily of tricalcium silicate, dicalcium silicate, tricalcium aluminate, and radiopaque bismuth oxide (Bi2O3). Sets in moist physiological tissue to form calcium silicate hydrate gel and bio-interactive calcium hydroxide.",
    formula: "(CaO)3·SiO2 + Bi2O3",
    elements: ["Ca", "Si", "O", "Bi", "Al"],
    crystalSystem: "Monoclinic + Cubic",
    spaceGroup: "Cm / P21/m",
    density: 3.15,
    applications: ["Root End Filling", "Pulp Capping Dental Surgery", "Perforation Repair Cements"],
    molecularWeight: 228.32,
    elasticModulus: 30
  },
  {
    name: "Y-TZP Zirconia Dental Bioceramic (3Y-TZP)",
    "type": "Biomaterials & Pharmaceuticals",
    pattern: "30.20, 100, 1, 0, 1\\n34.60, 25, 0, 0, 2\\n35.20, 30, 1, 1, 0\\n50.20, 65, 1, 1, 2\\n50.80, 40, 2, 0, 0\\n59.80, 35, 2, 1, 1",
    description: "Yttria-stabilized tetragonal zirconia polycrystal ceramic (3 mol% Y2O3). Renowned for stress-induced phase transformation toughening (t -> m transition at crack tips), providing unprecedented fracture toughness (>8 MPa·m1/2) for structural all-ceramic dental crowns and orthopedic joint implants.",
    formula: "ZrO2 (3 mol% Y2O3)",
    elements: ["Zr", "Y", "O"],
    crystalSystem: "Tetragonal",
    spaceGroup: "P42/nmc (No. 137)",
    density: 6.08,
    applications: ["High-Load Dental Crowns & Bridges", "Femoral Head Joint Arthroplasty", "Dental Abutments"],
    molecularWeight: 123.22,
    elasticModulus: 210
  },
  {
    name: "Bioactive Glass 13-93 Scaffold",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "29.20, 100, 1, 1, 0\\n31.80, 75, 2, 0, 0\\n33.90, 50, 2, 1, 1\\n48.10, 25, 2, 2, 0",
    description: "FDA-cleared resorbable bioactive silicate glass (53SiO2-6Na2O-12K2O-5MgO-20CaO-4P2O5) specifically engineered for 3D printed porous bone tissue engineering scaffolds. Viscous flow sintering processing enables intricate trabecular architecture creation.",
    formula: "53SiO2-6Na2O-12K2O-5MgO-20CaO-4P2O5",
    elements: ["Si", "O", "Na", "K", "Mg", "Ca", "P"],
    crystalSystem: "Glass-Ceramic",
    spaceGroup: "Amorphous + Silicate Phases",
    density: 2.65,
    applications: ["3D Printed Bone Scaffolds", "Load-Bearing Bone Defect Reconstruction", "Vascularized Bone Regeneration"],
    molecularWeight: 62.15,
    elasticModulus: 32
  },
  {
    name: "Paracetamol (Acetaminophen) Form I (Monoclinic)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "12.10, 45, 0, 0, 1\\n13.80, 100, 1, 1, 0\\n15.60, 35, 0, 2, 0\\n18.20, 60, 1, 1, 1\\n23.50, 85, 2, 0, 0\\n26.60, 90, 2, 1, 1",
    description: "Thermodynamically stable monoclinic crystalline polymorph Form I of paracetamol (4-acetamidophenol) active pharmaceutical ingredient (API). Characterized by hydrogen-bonded corrugated sheet sub-layers; benchmark standard for solid-state drug formulation quality control.",
    formula: "C8H9NO2",
    elements: ["C", "H", "N", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/a (No. 14)",
    density: 1.29,
    applications: ["Analgesic & Antipyretic Tablets", "API Polymorphic Stability Quality Control", "Solid Dosage Formulation"],
    molecularWeight: 151.16,
    elasticModulus: 11.2
  },
  {
    name: "Paracetamol (Acetaminophen) Form II (Orthorhombic)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "9.20, 50, 0, 1, 0\\n14.10, 100, 1, 1, 0\\n17.80, 70, 0, 2, 0\\n20.40, 80, 1, 2, 0\\n24.20, 65, 2, 0, 0\\n27.10, 45, 2, 1, 1",
    description: "Metastable orthorhombic polymorph Form II of paracetamol. Features parallel hydrogen-bonded planar layers that undergo slip deformation under compression, imparting exceptional direct compressibility without requiring wet granulation binders.",
    formula: "C8H9NO2",
    elements: ["C", "H", "N", "O"],
    crystalSystem: "Orthorhombic",
    spaceGroup: "Pca21 (No. 29)",
    density: 1.34,
    applications: ["Direct Compression Tablet Manufacturing", "Fast-Melt Tablet Formulations", "Polymorphic Transformation Research"],
    molecularWeight: 151.16,
    elasticModulus: 8.5
  },
  {
    name: "Aspirin (Acetylsalicylic Acid) Form I",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "7.80, 60, 0, 0, 1\\n15.60, 100, 1, 1, 0\\n20.50, 45, 0, 2, 1\\n22.70, 85, 2, 0, 0\\n27.10, 70, 2, 1, 1\\n32.40, 30, 3, 0, 0",
    description: "Monoclinic crystal Form I of acetylsalicylic acid analgesic active pharmaceutical ingredient. Features centro-symmetric carboxylic acid dimers linked by intermolecular hydrogen bonding in a monoclinic lattice.",
    formula: "C9H8O4",
    elements: ["C", "H", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/c (No. 14)",
    density: 1.40,
    applications: ["Cardiovascular Antiplatelet Therapy", "Analgesic Solid Dosage Tablets", "Pharmaceutical Reference Standard"],
    molecularWeight: 180.16,
    elasticModulus: 7.8
  },
  {
    name: "Metformin Hydrochloride Form I",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "12.80, 100, 0, 1, 1\\n17.60, 80, 1, 1, 0\\n22.40, 90, 1, 2, 0\\n24.10, 70, 0, 2, 2\\n29.50, 60, 2, 1, 1",
    description: "Thermodynamically stable monoclinic crystal Form I of biguanide antidiabetic API metformin HCl. Exhibits dense ionic salt hydrogen bonding networks between protonated biguanidinium cations and chloride anions.",
    formula: "C4H11N5·HCl",
    elements: ["C", "H", "N", "Cl"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21/c (No. 14)",
    density: 1.36,
    applications: ["Type 2 Diabetes Oral Glycemic Control", "Sustained Release Direct Tablet Compaction", "Salt Screening Quality Control"],
    molecularWeight: 165.62,
    elasticModulus: 14.5
  },
  {
    name: "Alpha-Lactose Monohydrate (Pharma Excipient)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "12.50, 100, 0, 1, 1\\n16.40, 85, 1, 1, 0\\n19.10, 95, 0, 2, 1\\n20.00, 80, 1, 2, 0\\n21.20, 60, 1, 1, 2",
    description: "Crystalline disaccharide monohydrate excipient ubiquitous in solid dosage tablet compression. Serves as a primary diluent, binder, and carrier crystal in dry powder inhaler (DPI) formulations owing to consistent surface energy and compaction behavior.",
    formula: "C12H22O11·H2O",
    elements: ["C", "H", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21 (No. 4)",
    density: 1.54,
    applications: ["Direct Compression Tablet Filler & Diluent", "Dry Powder Inhaler (DPI) Lactose Carrier", "Wet Granulation Processing"],
    molecularWeight: 360.31,
    elasticModulus: 5.4
  },
  {
    name: "Microcrystalline Cellulose (MCC I-beta)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "15.20, 60, 1, -1, 0\\n16.50, 75, 1, 1, 0\\n22.60, 100, 2, 0, 0\\n34.50, 20, 0, 0, 4",
    description: "Purified, partially depolymerized alpha-cellulose crystalline excipient (Native Cellulose I-beta). Recognized as the supreme direct-compression tableting binder due to exceptional plastic deformation and mechanical interlocking under compaction pressure.",
    formula: "(C6H10O5)n",
    elements: ["C", "H", "O"],
    crystalSystem: "Monoclinic",
    spaceGroup: "P21 (No. 4)",
    density: 1.58,
    applications: ["Direct Compression Tableting Binder", "Tablet Disintegrant & Hardness Enhancer", "Extrusion-Spheronization Pelletization"],
    molecularWeight: 162.14,
    elasticModulus: 15.0
  },
  {
    name: "Beta-D-Mannitol (Pharma Grade Excipient)",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "9.60, 40, 0, 1, 1\\n14.60, 100, 1, 1, 0\\n18.80, 70, 0, 2, 1\\n20.40, 85, 1, 2, 0\\n22.10, 60, 2, 0, 0\\n25.20, 50, 2, 1, 1",
    description: "Crystalline sugar alcohol beta-polymorph excipient prized in orally disintegrating tablets (ODTs) and freeze-dried lyophilized protein biopharmaceuticals. Offers non-hygroscopic protection and a cooling, pleasant mouthfeel.",
    formula: "C6H14O6",
    elements: ["C", "H", "O"],
    crystalSystem: "Orthorhombic",
    spaceGroup: "P212121 (No. 19)",
    density: 1.52,
    applications: ["Orally Disintegrating Tablets (ODT)", "Lyophilization Cryoprotectant & Bulking Agent", "Chewable Tablet Excipient"],
    molecularWeight: 182.17,
    elasticModulus: 12.8
  },
  {
    name: "Amoxicillin Trihydrate",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "12.10, 70, 0, 1, 1\\n15.20, 100, 1, 1, 0\\n18.00, 85, 0, 2, 0\\n23.10, 60, 2, 0, 0\\n26.80, 45, 2, 1, 1",
    description: "Broad-spectrum beta-lactam antibiotic active pharmaceutical ingredient crystal phase. Crystalline trihydrate matrix contains three stoichiometry-bound water molecules per amoxicillin unit, establishing a stable crystalline lattice resistant to ambient humidity.",
    formula: "C16H19N3O5S·3H2O",
    elements: ["C", "H", "N", "O", "S"],
    crystalSystem: "Orthorhombic",
    spaceGroup: "P212121 (No. 19)",
    density: 1.41,
    applications: ["Antibacterial Suspensions & Oral Capsules", "Hydrate Dehydration Solid-State Analysis", "Pharmaceutical Quality Control"],
    molecularWeight: 419.45,
    elasticModulus: 6.2
  },
  {
    name: "Indomethacin Gamma-Form",
    type: "Biomaterials & Pharmaceuticals",
    pattern: "11.60, 100, 1, 0, 0\\n17.00, 80, 0, 1, 1\\n19.60, 90, 1, 1, 0\\n21.80, 75, 2, 0, 0\\n26.60, 50, 2, 1, 1",
    description: "Thermodynamically stable gamma-polymorph of non-steroidal anti-inflammatory active pharmaceutical ingredient indomethacin. Features cyclic centrosymmetric carboxylic acid hydrogen-bonded dimers in a triclinic unit cell.",
    formula: "C19H16ClNO4",
    elements: ["C", "H", "Cl", "N", "O"],
    crystalSystem: "Triclinic",
    spaceGroup: "P-1 (No. 2)",
    density: 1.38,
    applications: ["Rheumatoid Arthritis Anti-Inflammatory API", "Amorphous Solid Dispersion Stability Testing", "Hot-Melt Extrusion (HME) Research"],
    molecularWeight: 357.79,
    elasticModulus: 9.1
  }
"""
        code = code[:bracket_pos] + new_items_js + code[bracket_pos:]
        with open("utils/materialDB.ts", "w") as f:
            f.write(code)
        print("SUCCESS! Inserted 19 materials into materialDB.ts")
    else:
        print("bracket_pos not found")
else:
    print("pos not found")
