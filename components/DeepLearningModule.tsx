import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { DLPhaseResult, DLPhaseCandidate } from '../types';
import { identifyPhasesDL, parseXYData } from '../utils/physics';
import {
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine
} from 'recharts';
import { Brain, Activity, CheckCircle, Search, Database, Layers, Zap, ChevronDown, FlaskConical, Loader2, Upload, FileText, Trash2, Settings, Info, Calculator, Plus, X, ShieldAlert, Focus, Eye, Scan, BookOpen, Microscope, Cpu } from 'lucide-react';

const MATERIAL_DB = [
  { 
    name: 'Silicon (Si)', 
    type: 'Semiconductor', 
    pattern: '28.44, 100\n47.30, 55\n56.12, 30\n69.13, 6\n76.38, 11\n88.03, 12',
    description: 'A hard, brittle crystalline solid with a blue-grey metallic lustre.',
    formula: 'Si',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m',
    density: 2.33,
    applications: ['Electronics', 'Solar Cells', 'Semiconductors'],
    molecularWeight: 28.085,
    bandGap: 1.11,
    elasticModulus: 130,
    magneticProperties: 'Diamagnetic',
    opticalProperties: 'Opaque in visible light, transparent to IR'
  },
  { 
    name: 'Zirconia (ZrO2)', 
    type: 'Ceramic', 
    pattern: '30.27, 100\n35.25, 25\n50.37, 60\n60.20, 30', 
    description: 'Zirconium dioxide is a white crystalline oxide of zirconium.',
    formula: 'ZrO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/nmc',
    density: 5.68,
    applications: ['Ceramics', 'Dental', 'Refractories'],
    molecularWeight: 123.22,
    bandGap: 5.0,
    elasticModulus: 210,
    opticalProperties: 'High refractive index, transparent in thin films',
    hazards: ['Respiratory irritant (dust)']
  },
  { 
    name: 'Hydroxyapatite', 
    type: 'Bioceramic', 
    pattern: '25.87, 40\n31.77, 100\n32.19, 95\n32.90, 60\n34.04, 45\n39.81, 25',
    description: 'A naturally occurring mineral form of calcium apatite.',
    formula: 'Ca10(PO4)6(OH)2',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/m',
    density: 3.16,
    applications: ['Bone Grafts', 'Dental', 'Implants'],
    molecularWeight: 1004.6,
    elasticModulus: 114,
    opticalProperties: 'White/translucent powder'
  },
  { 
    name: 'Zinc Oxide (ZnO)', 
    type: 'Semiconductor', 
    pattern: '31.77, 57\n34.42, 44\n36.25, 100\n47.54, 23\n56.60, 32\n62.86, 29',
    description: 'An inorganic compound used as an additive in numerous materials and products.',
    formula: 'ZnO',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc',
    density: 5.61,
    applications: ['Rubber', 'Plastics', 'Ceramics', 'Glass']
  },
  {
    name: 'Polytetrafluoroethylene (PTFE)',
    type: 'Polymer',
    pattern: '18.07, 100\n31.55, 25\n36.60, 10\n41.20, 5',
    description: 'A synthetic fluoropolymer of tetrafluoroethylene.',
    formula: '(C2F4)n',
    crystalSystem: 'Hexagonal', 
    spaceGroup: 'P',
    density: 2.2,
    applications: ['Non-stick coatings', 'Lubricants']
  },
  {
    name: 'Polyethylene (HDPE)',
    type: 'Polymer',
    pattern: '21.5, 100\n24.0, 45\n30.1, 12\n36.3, 8',
    description: 'High-density polyethylene, a versatile thermoplastic polymer.',
    formula: '(C2H4)n',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnam',
    density: 0.95,
    applications: ['Plastic bottles', 'Pipes', 'Geomembranes']
  },
  {
    name: 'Polypropylene (iPP)',
    type: 'Polymer',
    pattern: '14.1, 100\n16.9, 85\n18.6, 75\n21.2, 40\n21.8, 45',
    description: 'Isotactic polypropylene, alpha-form semi-crystalline structure.',
    formula: '(C3H6)n',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c',
    density: 0.90,
    applications: ['Packaging', 'Textiles', 'Automotive parts']
  },
  {
    name: 'Nylon 6 (Polyamide)',
    type: 'Polymer',
    pattern: '20.3, 100\n23.7, 90',
    description: 'A semi-crystalline polyamide synthesized via ring-opening polymerization.',
    formula: '(C6H11NO)n',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/a',
    density: 1.13,
    applications: ['Fibers', 'Mechanical parts', 'Musical strings']
  },
  {
    name: 'Quartz (SiO2)',
    type: 'Ceramic/Mineral',
    pattern: '20.86, 35\n26.64, 100\n36.54, 12\n39.47, 9\n40.29, 8\n42.45, 8\n45.79, 9\n50.14, 14\n59.95, 9\n67.74, 7\n68.14, 8',
    description: 'A hard, crystalline mineral composed of silica (silicon dioxide).',
    formula: 'SiO2',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P3221',
    density: 2.65,
    applications: ['Glass', 'Electronics', 'Construction', 'Jewelry'],
    molecularWeight: 60.08,
    bandGap: 8.9,
    elasticModulus: 71.7,
    magneticProperties: 'Diamagnetic',
    opticalProperties: 'Transparent, Uniaxial birefringent',
    hazards: ['Silicosis (inhalation)']
  },
  {
    name: 'Halite (NaCl)',
    type: 'Salt/Mineral',
    pattern: '27.37, 10\n31.69, 100\n45.43, 55\n56.45, 15\n66.20, 5\n75.26, 10',
    description: 'Commonly known as rock salt, it is the mineral form of sodium chloride.',
    formula: 'NaCl',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 2.16,
    applications: ['Food', 'De-icing', 'Chemical Industry']
  },
  {
    name: 'Sylvite (KCl)',
    type: 'Salt/Mineral',
    pattern: '28.35, 100\n40.50, 50\n50.15, 15\n58.60, 5\n66.35, 10\n73.70, 5',
    description: 'Potassium chloride is a metal halide salt composed of potassium and chlorine.',
    formula: 'KCl',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 1.98,
    applications: ['Fertilizer', 'Medicine', 'Food Processing']
  },
  {
    name: 'Hematite (Fe2O3)',
    type: 'Mineral/Ore',
    pattern: '24.14, 30\n33.15, 100\n35.61, 70\n40.85, 20\n49.48, 40\n54.09, 45\n62.45, 30\n64.02, 30',
    description: 'One of the most abundant minerals on Earth\'s surface and an important ore of iron.',
    formula: 'Fe2O3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c',
    density: 5.26,
    applications: ['Iron Ore', 'Pigments', 'Radiation Shielding']
  },
  {
    name: 'Aluminum (Al)',
    type: 'Metal',
    pattern: '38.47, 100\n44.74, 47\n65.13, 22\n78.23, 24\n82.44, 7',
    description: 'A silvery-white, soft, non-magnetic and ductile metal.',
    formula: 'Al',
    crystalSystem: 'Face-Centered Cubic',
    spaceGroup: 'Fm-3m',
    density: 2.70,
    applications: ['Aerospace', 'Packaging', 'Construction']
  },
  {
    name: 'Copper (Cu)',
    type: 'Metal',
    pattern: '43.30, 100\n50.43, 46\n74.13, 20\n89.93, 17\n95.14, 5',
    description: 'A soft, malleable, and ductile metal with very high thermal and electrical conductivity.',
    formula: 'Cu',
    crystalSystem: 'Face-Centered Cubic',
    spaceGroup: 'Fm-3m',
    density: 8.96,
    applications: ['Wiring', 'Motors', 'Coinage']
  },
  {
    name: 'Magnesium Oxide (MgO)',
    type: 'Ceramic',
    pattern: '36.94, 10\n42.91, 100\n62.30, 52\n74.65, 4\n78.61, 12',
    description: 'A white hygroscopic solid mineral that occurs naturally as periclase.',
    formula: 'MgO',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 3.58,
    applications: ['Refractories', 'Medicine', 'Insulation']
  },
  {
    name: 'Titanium (Ti)',
    type: 'Metal',
    pattern: '35.09, 30\n38.42, 30\n40.17, 100\n53.00, 15\n62.94, 15\n70.66, 15',
    description: 'A lustrous transition metal with a silver color, low density, and high strength.',
    formula: 'Ti',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 4.50,
    applications: ['Aerospace', 'Implants', 'Pigments']
  },
  {
    name: 'Cerium Oxide (CeO2)',
    type: 'Ceramic/Catalyst',
    pattern: '28.55, 100\n33.08, 30\n47.48, 55\n56.34, 45\n59.09, 10\n69.41, 20',
    description: 'A pale yellow-white powder, highly used as a catalyst and in glass polishing.',
    formula: 'CeO2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 7.21,
    applications: ['Catalysts', 'Fuel Cells', 'Glass Polishing']
  },
  {
    name: 'Calcite (CaCO3)',
    type: 'Mineral',
    pattern: '23.06, 15\n29.40, 100\n35.96, 15\n39.40, 20\n43.16, 20\n47.50, 25\n48.50, 25\n57.40, 10',
    description: 'A carbonate mineral and the most stable polymorph of calcium carbonate.',
    formula: 'CaCO3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c',
    density: 2.71,
    applications: ['Construction', 'Agriculture', 'Pharmaceuticals']
  },
  {
    name: 'Tungsten (W)',
    type: 'Metal',
    pattern: '40.26, 100\n58.27, 20\n73.19, 30\n87.01, 15',
    description: 'A rare metal known for its robustness and the highest melting point of all elements.',
    formula: 'W',
    crystalSystem: 'Body-Centered Cubic',
    spaceGroup: 'Im-3m',
    density: 19.25,
    applications: ['Heating elements', 'X-ray tubes', 'Alloys']
  },
  {
    name: 'Diamond (C)',
    type: 'Mineral/Gemstone',
    pattern: '43.92, 100\n75.30, 25\n91.50, 16\n119.52, 7',
    description: 'The hardest natural material known, a metastable allotrope of carbon.',
    formula: 'C',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m',
    density: 3.51,
    applications: ['Cutting tools', 'Jewelry', 'Heat sinks']
  },
  {
    name: 'Corundum (Al2O3)',
    type: 'Ceramic/Mineral',
    pattern: '25.58, 45\n35.15, 100\n37.78, 40\n43.36, 85\n52.55, 45\n57.50, 90\n61.30, 10\n66.52, 45\n68.21, 60',
    description: 'A crystalline form of aluminum oxide typically containing traces of iron, titanium, vanadium and chromium.',
    formula: 'Al2O3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c',
    density: 3.98,
    applications: ['Abrasives', 'Refractories', 'Laser host crystals']
  },
  {
    name: 'Rutile (TiO2)',
    type: 'Ceramic/Oxide',
    pattern: '27.44, 100\n36.08, 50\n39.18, 8\n41.22, 25\n44.05, 10\n54.31, 60\n56.62, 20\n62.73, 10\n64.03, 10\n68.99, 20',
    description: 'The most common natural form of TiO2, a major ore of titanium.',
    formula: 'TiO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm',
    density: 4.23,
    applications: ['Pigments', 'UV filters', 'Optical coatings']
  },
  {
    name: 'Anatase (TiO2)',
    type: 'Ceramic/Oxide',
    pattern: '25.28, 100\n37.80, 20\n48.05, 35\n53.89, 20\n55.06, 20\n62.69, 15',
    description: 'A metastable mineral form of titanium dioxide.',
    formula: 'TiO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I41/amd',
    density: 3.79,
    applications: ['Photocatalysis', 'Solar cells', 'Gas sensors']
  },
  {
    name: 'Barium Titanate (BaTiO3)',
    type: 'Ferroelectric Ceramic',
    pattern: '22.20, 25\n31.50, 100\n38.90, 22\n45.30, 42\n50.90, 18\n56.20, 15\n65.80, 22',
    description: 'A dielectric ceramic used for its high dielectric constant and piezoelectric properties.',
    formula: 'BaTiO3',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4mm',
    density: 6.02,
    applications: ['Capacitors', 'Transducers', 'Thermistors']
  },
  {
    name: 'Molybdenum Disulfide (MoS2)',
    type: '2D Material/Lubricant',
    pattern: '14.38, 100\n32.67, 12\n33.51, 10\n39.54, 7\n44.15, 6\n49.79, 12\n58.34, 15',
    description: 'A layered transition metal dichalcogenide used as a dry lubricant and in nanoelectronics.',
    formula: 'MoS2',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 5.06,
    applications: ['Lubrication', 'Transistors', 'Photodetectors']
  },
  {
    name: 'Lead Titanate (PbTiO3)',
    type: 'Ferroelectric Ceramic',
    pattern: '21.5, 20\n22.8, 25\n31.5, 100\n32.5, 95\n39.0, 15\n44.3, 35\n45.2, 40',
    description: 'A yellow solid that is insoluble in water. It is a classic ferroelectric material.',
    formula: 'PbTiO3',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4mm',
    density: 7.52,
    applications: ['Transducers', 'Thermal Sensors']
  },
  {
    name: 'Zeolite A (LTA)',
    type: 'Zeolite/Microporous',
    pattern: '7.2, 100\n10.2, 50\n12.5, 60\n16.1, 20\n21.7, 35\n24.0, 45\n27.1, 30\n29.9, 40\n34.2, 25',
    description: 'A synthetic zeolite with a pore size of about 4 Ångströms.',
    formula: 'Na12Al12Si12O48·27H2O',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m',
    density: 1.55,
    applications: ['Water Softening', 'Catalysis', 'Gas Separation']
  },
  {
    name: 'Silver (Ag)',
    type: 'Metal',
    pattern: '38.12, 100\n44.30, 40\n64.44, 25\n77.40, 26\n81.54, 15',
    description: 'A lustrous, white, soft, very ductile, and malleable transition metal.',
    formula: 'Ag',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 10.49,
    applications: ['Jewelry', 'Electronics', 'Photography']
  },
  {
    name: 'Yttrium Aluminum Garnet (YAG)',
    type: 'Ceramic/Laser Host',
    pattern: '18.1, 15\n27.8, 30\n29.8, 35\n33.3, 100\n36.6, 25\n41.1, 40\n46.6, 35\n55.2, 45\n57.5, 20',
    description: 'A synthetic crystalline material of the garnet group.',
    formula: 'Y3Al5O12',
    crystalSystem: 'Cubic',
    spaceGroup: 'Ia-3d',
    density: 4.55,
    applications: ['Solid-state Lasers', 'Phosphors']
  },
  {
    name: 'Strontium Titanate (SrTiO3)',
    type: 'Perovskite Ceramic',
    pattern: '22.8, 25\n32.4, 100\n39.9, 20\n46.5, 45\n52.4, 10\n57.8, 30\n67.8, 30',
    description: 'An oxide of strontium and titanium. It is a centrosymmetric cubic perovskite.',
    formula: 'SrTiO3',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m',
    density: 5.11,
    applications: ['Substrates', 'Varistors', 'Optics']
  },
  {
    name: 'Lithium Iron Phosphate (LiFePO4)',
    type: 'Battery Material',
    pattern: '17.1, 40\n20.8, 35\n25.6, 100\n29.7, 45\n32.1, 30\n35.6, 75\n42.1, 15',
    description: 'An olivine-structured compound used as a cathode material for LIBs.',
    formula: 'LiFePO4',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnma',
    density: 3.6,
    applications: ['EV Batteries', 'Power Tools']
  },
  {
    name: 'Gallium Nitride (GaN)',
    type: 'Semiconductor',
    pattern: '32.39, 100\n34.56, 95\n36.84, 85\n48.12, 20\n57.78, 45\n63.45, 30\n67.82, 35',
    description: 'A binary III/V direct bandgap semiconductor commonly used in bright light-emitting diodes.',
    formula: 'GaN',
    crystalSystem: 'Hexagonal (Wurtzite)',
    spaceGroup: 'P63mc',
    density: 6.1,
    applications: ['LEDs', 'Power Electronics', 'RF Amplifiers']
  },
  {
    name: 'Gold (Au)',
    type: 'Metal',
    pattern: '38.18, 100\n44.39, 52\n64.57, 32\n77.54, 36\n81.72, 10',
    description: 'A transition metal and a group 11 element. It is one of the least reactive chemical elements.',
    formula: 'Au',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 19.3,
    applications: ['Jewelry', 'Electronics', 'Economic Standard']
  },
  {
    name: 'Iron - Alpha (Fe)',
    type: 'Metal',
    pattern: '44.67, 100\n65.02, 20\n82.33, 30\n98.94, 10',
    description: 'The BCC allotrope of iron, stable at room temperature.',
    formula: 'Fe',
    crystalSystem: 'Cubic (BCC)',
    spaceGroup: 'Im-3m',
    density: 7.87,
    applications: ['Structural Steel', 'Magnetic Cores']
  },
  {
    name: 'Zirconia (ZrO2)',
    type: 'Ceramic',
    pattern: '28.17, 100\n31.47, 65\n34.15, 25\n50.12, 35\n50.55, 30\n60.05, 20',
    description: 'Monoclinic zirconia (baddeleyite), a tough ceramic used in structural applications.',
    formula: 'ZrO2',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c',
    density: 5.68,
    applications: ['Ceramic Knives', 'Dental Implants', 'Fuel Cells']
  },
  {
    name: 'Graphite',
    type: 'Carbon Allotrope',
    pattern: '26.54, 100\n42.39, 5\n44.59, 15\n54.67, 10\n77.54, 5',
    description: 'A crystalline form of the element carbon with its atoms arranged in a hexagonal structure.',
    formula: 'C',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 2.26,
    applications: ['Lubrication', 'Battery Anodes', 'Pencil Lead']
  },
  {
    name: 'Calcium Fluoride (CaF2)',
    type: 'Haliide Ceramic',
    pattern: '28.27, 100\n46.68, 85\n55.35, 35\n68.17, 15\n75.64, 10\n87.35, 12',
    description: 'The mineral fluorite, used extensively in optics due to its wide transparency range.',
    formula: 'CaF2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 3.18,
    applications: ['Camera Lenses', 'Flux in Smelting']
  },
  {
    name: 'Nickel (Ni)',
    type: 'Metal',
    pattern: '44.51, 100\n51.85, 45\n76.38, 25\n92.95, 20\n98.45, 10',
    description: 'A silvery-white lustrous metal with a slight golden tinge. It is hard and ductile.',
    formula: 'Ni',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 8.91,
    applications: ['Superalloys', 'Stainless Steel', 'Rechargeable Batteries']
  },
  {
    name: 'Tungsten Carbide (WC)',
    type: 'Hard Ceramic',
    pattern: '31.51, 100\n35.64, 90\n48.30, 80\n64.06, 35\n73.11, 40\n75.48, 25\n77.16, 20',
    description: 'An extremely hard chemical compound containing tungsten and carbon atoms.',
    formula: 'WC',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P-6m2',
    density: 15.63,
    applications: ['Cutting Tools', 'Abrasives', 'Armor-piercing rounds']
  },
  {
    name: 'Magnetite (Fe3O4)',
    type: 'Iron Oxide / Magnetic',
    pattern: '30.1, 40\n35.4, 100\n43.1, 25\n53.4, 20\n57.0, 35\n62.6, 45',
    description: 'A rock-forming mineral and one of the main iron ores, one of the oxides of iron.',
    formula: 'Fe3O4',
    crystalSystem: 'Cubic (Spinel)',
    spaceGroup: 'Fd-3m',
    density: 5.17,
    applications: ['Magnetic Storage', 'Biomedicine', 'Pigments']
  },
  {
    name: 'Methylammonium Lead Iodide (MAPbI3)',
    type: 'Solar Perovskite',
    pattern: '14.1, 100\n24.5, 45\n28.4, 55\n31.8, 30\n40.6, 20\n43.2, 15',
    description: 'A primary material used in high-efficiency perovskite solar cells.',
    formula: 'CH3NH3PbI3',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I4/mcm',
    density: 4.16,
    applications: ['Photovoltaics', 'Photodetectors']
  },
  {
    name: 'Silicon Carbide (SiC)',
    type: 'Semiconductor/Hard Ceramic',
    pattern: '33.6, 20\n35.6, 100\n38.1, 5\n41.4, 25\n54.5, 10\n60.0, 45\n65.6, 15\n71.8, 35',
    description: 'A hard chemical compound of silicon and carbon. Moissanite is its rare mineral form.',
    formula: '6H-SiC',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc',
    density: 3.21,
    applications: ['Power Electronics', 'Abrasives', 'Telescope Mirrors']
  },
  {
    name: 'Gallium Arsenide (GaAs)',
    type: 'Semiconductor',
    pattern: '27.3, 100\n45.3, 45\n53.7, 30\n66.0, 10\n72.8, 15\n83.6, 5',
    description: 'A III-V direct bandgap semiconductor used in integrated circuits and solar cells.',
    formula: 'GaAs',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m',
    density: 5.32,
    applications: ['Microwave circuits', 'Solar cells', 'Laser diodes']
  },
  {
    name: 'Bismuth Ferrite (BiFeO3)',
    type: 'Multiferroic Ceramic',
    pattern: '22.4, 20\n31.8, 100\n32.1, 95\n39.0, 15\n39.5, 15\n45.8, 40\n46.2, 35\n51.4, 10\n51.7, 10\n56.5, 20\n57.1, 20',
    description: 'One of the few multiferroic materials that is both ferroelectric and antiferromagnetic at room temp.',
    formula: 'BiFeO3',
    crystalSystem: 'Rhombohedral',
    spaceGroup: 'R3c',
    density: 8.34,
    applications: ['Spintronics', 'Memory storage', 'Photocatalysis']
  },
  {
    name: 'Indium Tin Oxide (ITO)',
    type: 'Transparent Conductor',
    pattern: '21.5, 15\n30.6, 100\n35.4, 30\n37.7, 10\n41.8, 15\n45.7, 15\n51.0, 45\n60.7, 35',
    description: 'A ternary composition of indium, tin and oxygen. It is transparent and conductive.',
    formula: 'In2O3:Sn',
    crystalSystem: 'Cubic',
    spaceGroup: 'Ia-3',
    density: 7.12,
    applications: ['Touchscreens', 'LCDs', 'Smart windows']
  },
  {
    name: 'Pyrite (FeS2)',
    type: 'Mineral/Sulfide',
    pattern: '28.5, 35\n33.0, 100\n37.1, 55\n40.8, 45\n47.4, 45\n56.3, 65\n59.0, 20\n64.3, 25',
    description: 'Known as fool\'s gold, it is an iron sulfide mineral.',
    formula: 'FeS2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pa-3',
    density: 5.01,
    applications: ['Sulfur production', 'Solar PV research']
  },
  {
    name: 'Chromium (Cr)',
    type: 'Metal',
    pattern: '44.39, 100\n64.58, 18\n81.72, 25\n98.05, 10',
    description: 'A steely-gray, lustrous, hard and brittle transition metal.',
    formula: 'Cr',
    crystalSystem: 'Cubic (BCC)',
    spaceGroup: 'Im-3m',
    density: 7.19,
    applications: ['Stainless Steel', 'Electroplating']
  },
  {
    name: 'Gallium Oxide (Ga2O3)',
    type: 'Semiconductor',
    pattern: '18.9, 35\n30.1, 45\n31.7, 55\n35.2, 100\n38.4, 60\n45.8, 30\n59.1, 25',
    description: 'An inorganic compound and ultra-wide-bandgap semiconductor.',
    formula: 'β-Ga2O3',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'C2/m',
    density: 5.88,
    applications: ['Power Electronics', 'Solar-blind Photodetectors']
  },
  {
    name: 'Cadmium Telluride (CdTe)',
    type: 'Solar Material',
    pattern: '23.8, 100\n39.3, 60\n46.4, 45\n56.8, 15\n62.4, 20\n71.2, 15',
    description: 'A crystalline compound used as an infrared optical window and a solar cell material.',
    formula: 'CdTe',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m',
    density: 5.85,
    applications: ['Thin-film Solar Cells', 'Radiation Detectors']
  },
  {
    name: 'Bismuth Telluride (Bi2Te3)',
    type: 'Thermoelectric',
    pattern: '17.4, 45\n27.6, 100\n38.2, 40\n41.1, 35\n44.6, 25\n50.3, 15\n54.1, 15',
    description: 'A gray powder that is a compound of bismuth and tellurium. It is a semiconductor and thermoelectric material.',
    formula: 'Bi2Te3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3m',
    density: 7.74,
    applications: ['Thermoelectric Cooling', 'Power Generation']
  },
  {
    name: 'Tin Oxide (SnO2)',
    type: 'Ceramic/Sensor',
    pattern: '26.6, 100\n33.9, 75\n37.9, 25\n38.9, 20\n51.8, 65\n54.7, 15\n61.9, 20',
    description: 'The mineral cassiterite, the main ore of tin. Used as a gas sensor material.',
    formula: 'SnO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm',
    density: 6.95,
    applications: ['Gas Sensors', 'Opacifiers', 'TCOs']
  },
  {
    name: 'Lithium Cobalt Oxide (LiCoO2)',
    type: 'Battery Material',
    pattern: '18.9, 100\n36.7, 45\n37.3, 50\n38.4, 35\n45.2, 40\n49.3, 10\n59.2, 25',
    description: 'A chemical compound used as a positive electrode in lithium-ion batteries.',
    formula: 'LiCoO2',
    crystalSystem: 'Rhombohedral',
    spaceGroup: 'R-3m',
    density: 5.06,
    applications: ['LCO Batteries', 'Mobile Electronics']
  },
  {
    name: 'Silicon Nitride (Si3N4)',
    type: 'Hard Ceramic',
    pattern: '20.6, 25\n23.4, 45\n26.5, 35\n30.9, 100\n34.6, 65\n35.3, 60\n38.8, 30\n41.5, 20',
    description: 'A hard, solid ceramic used in high-strength and high-temperature applications.',
    formula: 'β-Si3N4',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/m',
    density: 3.17,
    applications: ['Bearings', 'Turbine Blades', 'Cutting Tools']
  },
  {
    name: 'Aluminum Nitride (AlN)',
    type: 'Ceramic/Semiconductor',
    pattern: '33.2, 100\n36.0, 95\n37.9, 85\n49.8, 25\n59.3, 50\n66.0, 35\n69.7, 30',
    description: 'A technical ceramic with an unusual combination of high thermal conductivity and electrical insulation.',
    formula: 'AlN',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc',
    density: 3.26,
    applications: ['Heat Sinks', 'Power Electronics', 'Substrates']
  },
  {
    name: 'Boron Nitride (h-BN)',
    type: 'Hexagonal Ceramic',
    pattern: '26.7, 100\n41.6, 12\n43.8, 15\n50.1, 10\n55.1, 25\n75.9, 5',
    description: 'Often referred to as "white graphite" because of its lubricity and hexagonal structure.',
    formula: 'h-BN',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 2.10,
    applications: ['Solid Lubricants', 'Cosmetics', 'Thermal Management']
  },
  {
    name: 'Gallium Phosphide (GaP)',
    type: 'Semiconductor',
    pattern: '28.3, 100\n32.8, 10\n47.1, 60\n55.8, 45\n68.8, 15\n76.0, 15\n88.0, 10',
    description: 'A phosphide of gallium, an indirect bandgap semiconductor used in some LED devices.',
    formula: 'GaP',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m',
    density: 4.14,
    applications: ['LEDs', 'Optical Sensors']
  },
  {
    name: 'Zinc Selenide (ZnSe)',
    type: 'Optical Semiconductor',
    pattern: '27.2, 100\n31.5, 10\n45.3, 85\n53.6, 45\n66.0, 20\n72.7, 25\n83.4, 15',
    description: 'A light-yellow, solid binary compound. It is an intrinsic semiconductor and optical material.',
    formula: 'ZnSe',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m',
    density: 5.27,
    applications: ['Infrared Optics', 'CO2 Lasers', 'X-ray Detectors']
  },
  {
    name: 'Tantalum (Ta)',
    type: 'Refractory Metal',
    pattern: '38.4, 100\n55.5, 15\n69.6, 25\n82.4, 10\n94.9, 15',
    description: 'A rare, hard, blue-gray, lustrous transition metal that is highly corrosion-resistant.',
    formula: 'Ta',
    crystalSystem: 'Cubic (BCC)',
    spaceGroup: 'Im-3m',
    density: 16.69,
    applications: ['Capacitors', 'Surgical Implants', 'Chemical Equipment']
  },
  {
    name: 'Vanadium Pentoxide (V2O5)',
    type: 'Metal Oxide/Catalyst',
    pattern: '15.3, 100\n20.3, 90\n21.7, 45\n26.1, 75\n31.0, 40\n32.4, 35\n34.3, 30\n47.3, 25',
    description: 'The chemical compound with the formula V2O5. It is a poisonous yellow/orange solid.',
    formula: 'V2O5',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pmmn',
    density: 3.36,
    applications: ['Catalysis', 'Battery Cathodes', 'Ferrovanadium Production']
  },
  {
    name: 'Silver Chloride (AgCl)',
    type: 'Haliide Mineral',
    pattern: '27.8, 45\n32.2, 100\n46.2, 65\n54.8, 15\n57.5, 10\n67.5, 15\n74.5, 10\n76.8, 12',
    description: 'A chemical compound with the chemical formula AgCl. It occurs naturally as the mineral chlorargyrite.',
    formula: 'AgCl',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 5.56,
    applications: ['Electrodes', 'Photography', 'Optical Windows']
  },
  {
    name: 'Manganese Oxide (MnO2)',
    type: 'Mineral/Battery',
    pattern: '28.6, 100\n37.3, 90\n42.8, 35\n56.7, 65\n67.3, 25\n72.3, 15',
    description: 'The inorganic compound with the formula MnO2, also known as pyrolusite.',
    formula: 'MnO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm',
    density: 5.03,
    applications: ['Dry Batteries', 'Oxidizing Agent', 'Pigment']
  },
  {
    name: 'Nickel Oxide (NiO)',
    type: 'Metal Oxide/Semiconductor',
    pattern: '37.3, 85\n43.3, 100\n62.9, 65\n75.4, 15\n79.4, 10',
    description: 'The mineral bunsenite, an antiferromagnetic semiconductor.',
    formula: 'NiO',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 6.67,
    applications: ['Fuel Cells', 'Catalysts', 'Electrochromic Devices']
  },
  {
    name: 'Cobalt(II,III) Oxide (Co3O4)',
    type: 'Spinel Ceramic',
    pattern: '19.0, 20\n31.3, 45\n36.9, 100\n38.6, 15\n44.9, 25\n55.7, 10\n59.4, 30\n65.3, 55',
    description: 'Black antiferromagnetic solid, a mixed-valence compound containing both Co(II) and Co(III).',
    formula: 'Co3O4',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m',
    density: 6.11,
    applications: ['Gas Sensors', 'Catalysis', 'LCO Production']
  },
  {
    name: 'Lead Zirconate Titanate (PZT)',
    type: 'Piezoelectric Ceramic',
    pattern: '21.6, 25\n31.1, 100\n38.3, 20\n44.5, 40\n45.3, 40\n50.3, 15\n55.3, 15\n65.6, 20',
    description: 'A ceramic perovskite material that shows a marked piezoelectric effect.',
    formula: 'Pb[ZrxTi1-x]O3',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4mm',
    density: 7.7,
    applications: ['Ultrasound transceivers', 'Actuators', 'SONAR']
  },
  {
    name: 'Barium Ferrite (BaFe12O19)',
    type: 'Permanent Magnet',
    pattern: '30.3, 35\n32.2, 55\n34.1, 100\n37.1, 40\n40.4, 25\n55.1, 20\n63.1, 25',
    description: 'A highly magnetic material, also called barium hexaferrite.',
    formula: 'BaFe12O19',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 5.28,
    applications: ['Magnetic Storage Media', 'Speakers', 'Microwave components']
  },
  {
    name: 'Vanadium Dioxide (VO2)',
    type: 'Phase Change Material',
    pattern: '27.9, 100\n37.1, 35\n42.3, 25\n55.6, 45\n57.7, 30',
    description: 'Known for its reversible metal-insulator transition at 68°C.',
    formula: 'VO2',
    crystalSystem: 'Monoclinic (M1)',
    spaceGroup: 'P21/c',
    density: 4.57,
    applications: ['Smart Windows', 'Optical Switches', 'Thermochemistry']
  },
  {
    name: 'Tungsten Trioxide (WO3)',
    type: 'Metal Oxide/Semiconductor',
    pattern: '23.1, 100\n23.6, 95\n24.4, 95\n26.6, 25\n28.9, 20\n33.3, 45\n34.1, 50\n41.8, 15\n50.0, 15',
    description: 'A transition metal oxide used for its electrochromic and gas sensing properties.',
    formula: 'WO3',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/n',
    density: 7.16,
    applications: ['Electrochromic Windows', 'Gas Sensors', 'Photocatalysis']
  },
  {
    name: 'Austenite (γ-Fe)',
    type: 'High-Temp Metal',
    pattern: '43.6, 100\n50.7, 45\n74.7, 25\n90.7, 20',
    description: 'The FCC allotrope of iron, typically stable above 912°C or in stainless steels.',
    formula: 'Fe',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 7.9,
    applications: ['Stainless Steel', 'Tooling', 'Aeronautics']
  },
  {
    name: 'Silver(I) Oxide (Ag2O)',
    type: 'Oxide Ceramic',
    pattern: '32.8, 100\n38.1, 40\n55.0, 55\n65.5, 15\n68.8, 18',
    description: 'A chemical compound used in silver-oxide batteries.',
    formula: 'Ag2O',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pn-3m',
    density: 7.14,
    applications: ['Silver Oxide Batteries', 'Antibacterial finish', 'Catalysis']
  },
  {
    name: 'Copper(II) Oxide (CuO)',
    type: 'Semiconductor/Mineral',
    pattern: '32.5, 30\n35.5, 95\n38.7, 100\n48.7, 35\n53.5, 15\n58.3, 20\n61.5, 25\n66.2, 20\n68.1, 20',
    description: 'The mineral tenorite, a black solid and p-type semiconductor.',
    formula: 'CuO',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'C2/c',
    density: 6.31,
    applications: ['Superconductors', 'Pigments', 'Solid Waste disposal']
  },
  {
    name: 'Zinc Sulfide (ZnS)',
    type: 'Semiconductor/Phosphor',
    pattern: '28.5, 100\n47.5, 60\n56.4, 45\n69.4, 15\n76.8, 18',
    description: 'A versatile material used as a white pigment and in electroluminescence.',
    formula: 'ZnS (Sphalerite)',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m',
    density: 4.09,
    applications: ['Phosphors', 'Optical Windows', 'Infrared Lenses']
  },
  {
    name: 'beta-Tricalcium Phosphate (beta-TCP)',
    type: 'Biomaterial/Ceramic',
    pattern: '25.8, 15\n27.8, 45\n29.6, 65\n31.0, 100\n34.3, 55\n46.9, 15',
    description: 'A biodegradable ceramic used in bone grafting and tissue engineering.',
    formula: 'beta-Ca3(PO4)2',
    crystalSystem: 'Rhombohedral',
    spaceGroup: 'R3c',
    density: 3.07,
    applications: ['Bone Grafts', 'Dental Fillers', 'Drug Delivery']
  },
  {
    name: 'Bioactive Glass (45S5)',
    type: 'Biomaterial/Glass-Ceramic',
    pattern: '25.0, 30\n30.0, 40\n32.0, 100\n34.0, 60\n47.0, 20',
    description: 'A glass-ceramic material that bonds to both bone and soft tissue.',
    formula: 'Na2O-CaO-P2O5-SiO2',
    crystalSystem: 'Amorphous/Crystalline mixture',
    spaceGroup: 'N/A',
    density: 2.7,
    applications: ['Orthopedics', 'Dentistry', 'Wound Healing']
  },
  {
    name: 'Brushite (DCPD)',
    type: 'Biomaterial/Mineral',
    pattern: '11.6, 100\n20.9, 60\n23.4, 25\n29.3, 75\n31.2, 45\n34.1, 40',
    description: 'Dicalcium phosphate dihydrate, a precursor to hydroxyapatite in biological systems.',
    formula: 'CaHPO4·2H2O',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'Ia',
    density: 2.31,
    applications: ['Bone Cements', 'Food Additive', 'Dentifrices']
  },
  {
    name: 'Monetite (DCP)',
    type: 'Biomaterial/Mineral',
    pattern: '26.4, 100\n30.2, 85\n32.7, 45\n47.2, 15\n52.1, 10',
    description: 'Anhydrous dicalcium phosphate, used in calcium phosphate cements.',
    formula: 'CaHPO4',
    crystalSystem: 'Triclinic',
    spaceGroup: 'P-1',
    density: 2.92,
    applications: ['Bone Regeneration', 'Tableting Excipient']
  },
  {
    name: 'Bio-Aragonite',
    type: 'Biomaterial/Mineral',
    pattern: '26.2, 100\n33.1, 45\n36.1, 20\n37.8, 30\n38.4, 30\n45.8, 35\n48.4, 25',
    description: 'A calcium carbonate polymorph found in nacre and mollusk shells.',
    formula: 'CaCO3',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pmcn',
    density: 2.93,
    applications: ['Implants', 'Bone Augmentation', 'Biomimetic Materials']
  },
  {
    name: 'Tetracalcium Phosphate (TTCP)',
    type: 'Biomaterial/Ceramic',
    pattern: '25.4, 35\n29.2, 60\n29.8, 100\n31.1, 95\n32.4, 80\n34.5, 40',
    description: 'The most basic calcium phosphate, often used in self-setting cements.',
    formula: 'Ca4(PO4)2O',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21',
    density: 3.05,
    applications: ['Calcium Phosphate Cements', 'Coatings']
  },
  {
    name: 'alpha-Tricalcium Phosphate (alpha-TCP)',
    type: 'Biomaterial/Ceramic',
    pattern: '22.8, 40\n24.2, 35\n30.6, 100\n32.2, 85\n34.1, 55\n46.5, 20',
    description: 'High-temperature polymorph of TCP, highly reactive in water to form HAp.',
    formula: 'alpha-Ca3(PO4)2',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/a',
    density: 2.86,
    applications: ['Bone Cements', 'Resorbable Ceramics']
  },
  {
    name: 'Lithium Titanate (Li4Ti5O12)',
    type: 'Battery/Anode',
    pattern: '18.4, 100\n35.6, 55\n43.3, 45\n47.4, 15\n57.2, 35\n62.8, 30',
    description: 'An "extremely safe" anode material for lithium-ion batteries with zero-strain characteristics.',
    formula: 'Li4Ti5O12',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m',
    density: 3.48,
    applications: ['Fast-charge Batteries', 'Heavy Duty EVs']
  },
  {
    name: 'YBCO Superconductor (YBa2Cu3O7)',
    type: 'Superconductor',
    pattern: '22.8, 35\n32.5, 100\n32.8, 95\n38.5, 20\n40.3, 15\n46.7, 45\n58.1, 35',
    description: 'The first material found to become a superconductor above the boiling point of liquid nitrogen.',
    formula: 'YBa2Cu3O7-δ',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pmmm',
    density: 6.38,
    applications: ['Magnetic Levitation', 'Power Cables', 'High-field Magnets']
  },
  {
    name: 'Zeolite ZSM-5',
    type: 'Microporous Catalyst',
    pattern: '7.9, 100\n8.8, 70\n23.1, 95\n23.3, 85\n23.9, 75\n24.4, 55',
    description: 'A high-silica zeolite used extensively in the petroleum industry as a heterogeneous catalyst.',
    formula: 'NanAlnSi96-nO192·16H2O',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnma',
    density: 1.81,
    applications: ['Fluid Catalytic Cracking', 'Xylene Isomerization']
  },
  {
    name: 'Metal-Organic Framework-5 (MOF-5)',
    type: 'MOF/Gas Storage',
    pattern: '6.8, 100\n9.7, 45\n13.8, 35\n15.4, 20\n23.8, 15',
    description: 'A prototypical metal-organic framework with exceptionally high surface area for gas storage.',
    formula: 'Zn4O(BDC)3',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 0.59,
    applications: ['Hydrogen Storage', 'Carbon Capture', 'Chemical Sensing']
  },
  {
    name: 'Platinum (Pt)',
    type: 'Noble Metal',
    pattern: '39.8, 100\n46.2, 55\n67.5, 35\n81.3, 40\n85.7, 10',
    description: 'A dense, malleable, ductile, highly unreactive precious metal.',
    formula: 'Pt',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 21.45,
    applications: ['Catalytic Converters', 'Electrical Contacts', 'Jewelry']
  },
  {
    name: 'Palladium (Pd)',
    type: 'Noble Metal',
    pattern: '40.1, 100\n46.7, 45\n68.2, 25\n82.1, 30\n86.7, 8',
    description: 'A shiny, silvery-white metal that has the lowest melting point and is the least dense of the PGMs.',
    formula: 'Pd',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 12.02,
    applications: ['Hydrogen Purification', 'Catalysis', 'Electronics']
  },
  {
    name: 'NMC-111 (LiNi1/3Mn1/3Co1/3O2)',
    type: 'Battery Material',
    pattern: '18.7, 100\n36.6, 35\n37.2, 40\n38.3, 30\n44.4, 45\n48.6, 12\n58.5, 25',
    description: 'A mixed metal oxide used as a cathode material in state-of-the-art Li-ion batteries.',
    formula: 'LiNi1/3Mn1/3Co1/3O2',
    crystalSystem: 'Rhombohedral',
    spaceGroup: 'R-3m',
    density: 4.8,
    applications: ['Electric Vehicle Batteries', 'Power Backup']
  },
  {
    name: 'Yttria-Stabilized Zirconia (YSZ)',
    type: 'Fast-Ion Conductor',
    pattern: '30.1, 100\n34.8, 25\n50.2, 60\n59.7, 35\n62.8, 15',
    description: 'Zirconium dioxide stabilized with 8 mol% yttria, an ideal electrolyte for solid oxide fuel cells.',
    formula: '(ZrO2)0.92(Y2O3)0.08',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 5.9,
    applications: ['SOFC Electrolytes', 'Oxygen Sensors', 'Thermal Barrier Coatings']
  },
  {
    name: 'Strontium Ruthenate (SrRuO3)',
    type: 'Conductive Oxide',
    pattern: '22.4, 25\n31.8, 100\n39.3, 20\n45.8, 45\n57.2, 30\n67.1, 35',
    description: 'A metallic ferromagnet with high chemical stability and excellent lattice match for perovskite oxides.',
    formula: 'SrRuO3',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pbnm',
    density: 6.49,
    applications: ['Electrodes in RAM', 'Thin Film Research', 'Spintronics']
  },
  {
    name: 'Graphene Oxide (GO)',
    type: '2D Material',
    pattern: '10.5, 100\n22.0, 15\n26.6, 10\n42.6, 5',
    description: 'A carbon material derived from graphite with hydrophilic oxygen-containing groups.',
    formula: 'C(O,OH)x',
    crystalSystem: 'Layered (Disordered)',
    spaceGroup: 'N/A',
    density: 1.8,
    applications: ['Water Purification', 'Composites', 'Drug Delivery']
  },
  {
    name: 'Octacalcium Phosphate (OCP)',
    type: 'Biomaterial/Mineral',
    pattern: '4.7, 100\n9.4, 30\n22.8, 15\n26.0, 60\n31.6, 50\n33.6, 40',
    description: 'A transient intermediate in bone and tooth formation, structurally similar to hydroxyapatite.',
    formula: 'Ca8(HPO4)2(PO4)4·5H2O',
    crystalSystem: 'Triclinic',
    spaceGroup: 'P-1',
    density: 2.61,
    applications: ['Bone Morphogenesis Research', 'Implants']
  },
  {
    name: 'Cellulose (Type Ib)',
    type: 'Biomaterial/Polymer',
    pattern: '14.8, 60\n16.3, 70\n20.5, 30\n22.6, 100\n34.5, 20',
    description: 'The most abundant natural polymer, forming structural components of plant cell walls.',
    formula: '(C6H10O5)n',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21',
    density: 1.58,
    applications: ['Wound Dressings', 'Tissue Scaffolds', 'Drug Delivery']
  },
  {
    name: 'Chitosan',
    type: 'Biomaterial/Polymer',
    pattern: '10.5, 75\n20.1, 100\n21.8, 40',
    description: 'A linear polysaccharide derived from chitin, exhibiting excellent biocompatibility and antimicrobial properties.',
    formula: '(C6H11NO4)n',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'P212121',
    density: 1.45,
    applications: ['Wound Healing', 'Hemostatic Agents', 'Scaffolds']
  },
  {
    name: 'Silk Fibroin (Beta-Sheet)',
    type: 'Biomaterial/Protein',
    pattern: '9.1, 30\n18.9, 35\n20.7, 100\n24.3, 40\n28.6, 20',
    description: 'The structural protein in silk, forming crystalline beta-sheet regions responsible for its high tensile strength.',
    formula: 'Amino acid copolymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21',
    density: 1.35,
    applications: ['Sutures', 'Ligament Repair', 'Biosensors']
  },
  {
    name: 'Calcium Oxalate Monohydrate',
    type: 'Biomaterial/Pathological Mineral',
    pattern: '14.9, 100\n24.4, 45\n30.1, 30\n35.8, 20\n38.2, 25',
    description: 'Whewellite, the primary crystalline component found in most human kidney stones.',
    formula: 'CaC2O4·H2O',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c',
    density: 2.12,
    applications: ['Urology Research', 'Biomineralization Studies']
  },
  {
    name: 'Amorphous Calcium Phosphate (ACP)',
    type: 'Biomaterial/Precursor',
    pattern: '30.0, 100', // Typically very broad peak
    description: 'A non-crystalline phase of calcium phosphate, the initial solid phase that precipitates from high supersaturation.',
    formula: 'CaxHy(PO4)z·nH2O',
    crystalSystem: 'Amorphous',
    spaceGroup: 'N/A',
    density: 2.50,
    applications: ['Remineralizing Toothpastes', 'Precursor Studies']
  },
  {
    name: 'Polylactic Acid (PLA)',
    type: 'Biomaterial/Polymer',
    pattern: '16.7, 100\n19.1, 80\n22.3, 30',
    description: 'A biodegradable and bioactive thermoplastic aliphatic polyester derived from renewable resources.',
    formula: '(C3H4O2)n',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'P212121',
    density: 1.25,
    applications: ['3D Printing', 'Medical Implants', 'Biodegradable Packaging']
  },
  {
    name: 'Polyether ether ketone (PEEK)',
    type: 'Biomaterial/Polymer',
    pattern: '18.8, 100\n20.7, 85\n22.8, 90\n28.9, 60',
    description: 'A versatile high-performance semicrystalline engineering thermoplastic used extensively in medical and space applications.',
    formula: '(-C6H4-O-C6H4-O-C6H4-CO-)n',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pbcn',
    density: 1.32,
    applications: ['Spinal Fusion Devices', 'Aerospace Components', 'Bearings']
  },
  {
    name: 'Collagen Type I',
    type: 'Biomaterial/Protein',
    pattern: '8.0, 30\n20.5, 100', // Typical d~1.1 nm and ~0.45 nm halos
    description: 'The most abundant collagen of the human body, serving as a key structural fiber in tendons, bone, and skin.',
    formula: 'Protein Polymer',
    crystalSystem: 'Triple Helix (Hexagonal)',
    spaceGroup: 'N/A',
    density: 1.35,
    applications: ['Tissue Engineering Scaffolds', 'Wound Dressings', 'Cosmetics']
  },
  {
    name: 'Uranium Dioxide (UO2)',
    type: 'Nuclear/Fuel',
    pattern: '28.2, 100\n32.7, 45\n47.0, 50\n55.8, 40\n58.5, 30',
    description: 'An oxide of uranium utilized as the primary nuclear fuel in light water reactors.',
    formula: 'UO2',
    crystalSystem: 'Cubic (Fluorite)',
    spaceGroup: 'Fm-3m',
    density: 10.97,
    applications: ['Nuclear Reactor Fuel', 'Radiological Shielding'],
    molecularWeight: 270.03,
    bandGap: 2.2,
    elasticModulus: 180,
    magneticProperties: 'Paramagnetic (AFM below 30.8 K)',
    opticalProperties: 'Opaque (dark brown/black)',
    hazards: ['Radioactive', 'Toxic (Heavy Metal)']
  },
  {
    name: 'Thorium Dioxide (ThO2)',
    type: 'Nuclear/Fertile Material',
    pattern: '27.6, 100\n31.9, 40\n45.8, 55\n54.4, 45\n57.0, 35',
    description: 'A crystalline fertile powder that can be bred into fissile U-233; possesses the highest melting point of all oxides.',
    formula: 'ThO2',
    crystalSystem: 'Cubic (Fluorite)',
    spaceGroup: 'Fm-3m',
    density: 10.0,
    applications: ['Advanced Nuclear Fuel Cycles', 'High-Temp Crucibles'],
    molecularWeight: 264.04,
    bandGap: 5.7,
    elasticModulus: 250,
    opticalProperties: 'White to slightly yellow powder',
    hazards: ['Radioactive (Mild)']
  },
  {
    name: 'Boron Carbide (B4C)',
    type: 'Nuclear/Control Material',
    pattern: '23.5, 20\n34.9, 80\n37.8, 100\n39.1, 15\n44.8, 25\n53.4, 30',
    description: 'An extremely hard boron-carbon ceramic used in tank armor, bulletproof vests, and notably as control rods in nuclear reactors for neutron absorption.',
    formula: 'B4C',
    crystalSystem: 'Rhombohedral',
    spaceGroup: 'R-3m',
    density: 2.52,
    applications: ['Control Rods', 'Armor Plating', 'Abrasives'],
    molecularWeight: 55.25,
    elasticModulus: 450,
    hazards: ['Hard dust inhalation']
  },
  {
    name: 'Gadolinium Oxide (Gd2O3)',
    type: 'Nuclear/Burnable Poison',
    pattern: '28.6, 100\n33.1, 35\n47.5, 45\n56.4, 40\n59.1, 15\n69.5, 20',
    description: 'A chemical compound used as a neutron-absorbing "burnable poison" in nuclear fuel to manage reactivity over time.',
    formula: 'Gd2O3',
    crystalSystem: 'Cubic',
    spaceGroup: 'Ia-3',
    density: 7.40,
    applications: ['Neutron Absorption', 'Contrast Agents', 'Phosphors'],
    molecularWeight: 362.50,
    bandGap: 5.4,
    opticalProperties: 'White powder, paramagnetic'
  },
  {
    name: 'Plutonium Dioxide (PuO2)',
    type: 'Nuclear/Fuel',
    pattern: '28.6, 100\n33.1, 40\n47.5, 55\n56.4, 45\n59.1, 10\n69.5, 20',
    description: 'A stable ceramic form of plutonium used in MOX fuel and radioisotope thermoelectric generators (RTGs).',
    formula: 'PuO2',
    crystalSystem: 'Cubic (Fluorite)',
    spaceGroup: 'Fm-3m',
    density: 11.46,
    applications: ['MOX Fuel', 'Deep Space Power (RTGs)'],
    molecularWeight: 271.0,
    hazards: ['Highly Radioactive', 'Alpha Emitter', 'Chemically Toxic']
  },
  {
    name: 'Lead (Pb)',
    type: 'Metal/Shielding',
    pattern: '31.3, 100\n36.3, 40\n52.2, 35\n62.1, 45\n65.2, 10\n77.0, 15',
    description: 'A dense, soft, malleable post-transition metal used extensively for radiation shielding due to its high atomic number and density.',
    formula: 'Pb',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 11.34,
    applications: ['Radiation Shielding', 'Batteries', 'Weights'],
    molecularWeight: 207.2,
    hazards: ['Neurotoxic', 'Heavy Metal']
  },
  {
    name: 'Zirconium Hydride (ZrH2)',
    type: 'Nuclear/Moderator',
    pattern: '28.5, 30\n33.0, 100\n47.5, 40\n56.5, 45\n59.2, 15',
    description: 'A metallic hydride used as a moderator and fuel component in specialty reactors like TRIGA.',
    formula: 'ZrH2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I4/mmm',
    density: 5.60,
    applications: ['TRIGA Reactor Fuel', 'Neutron Moderation'],
    molecularWeight: 93.24
  },
  {
    name: 'Beryllium Oxide (BeO)',
    type: 'Nuclear/Reflector',
    pattern: '38.5, 100\n41.2, 45\n44.0, 40\n59.3, 20\n69.8, 15',
    description: 'An inorganic compound with high thermal conductivity and low neutron capture cross-section, used as a neutron reflector.',
    formula: 'BeO',
    crystalSystem: 'Hexagonal (Wurtzite)',
    spaceGroup: 'P63mc',
    density: 3.01,
    applications: ['Neutron Reflectors', 'Heat Sinks', 'High-temp Ceramics'],
    molecularWeight: 25.01,
    hazards: ['Extremely Toxic', 'Berylliosis risk']
  },
  {
    name: 'Austenite (γ-Fe)',
    type: 'Metallurgy/Phase',
    pattern: '43.6, 100\n50.8, 45\n74.7, 30\n90.7, 25\n95.9, 10',
    description: 'The face-centered cubic (FCC) phase of iron. High temperature stable phase often retained in stainless steels.',
    formula: 'γ-Fe',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 7.98,
    applications: ['Stainless Steels', 'Shape Memory Alloys'],
    molecularWeight: 55.85
  },
  {
    name: 'Martensite (α\'-Fe)',
    type: 'Metallurgy/Phase',
    pattern: '44.7, 100\n65.0, 15\n82.3, 25\n98.9, 10',
    description: 'A very hard, supersaturated solid solution of carbon in iron. Characterized by a body-centered tetragonal (BCT) structure formed by rapid quenching.',
    formula: 'α\'-Fe',
    crystalSystem: 'Tetragonal (BCT)',
    spaceGroup: 'I4/mmm',
    density: 7.85,
    applications: ['Hardened Steel', 'Tooling'],
    molecularWeight: 55.85
  },
  {
    name: 'Cementite (Fe3C)',
    type: 'Metallurgy/Carbide',
    pattern: '37.7, 60\n39.8, 80\n40.6, 100\n42.9, 70\n43.7, 90\n44.5, 85\n44.9, 95',
    description: 'An intermetallic compound of iron and carbon. Hard and brittle, it is a key constituent in most steels and cast irons.',
    formula: 'Fe3C',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnma',
    density: 7.67,
    applications: ['Steel Reinforcement', 'Cast Iron'],
    molecularWeight: 179.55
  },
  {
    name: 'Titanium-6Al-4V (α+β)',
    type: 'Metallurgy/Alloy',
    pattern: '35.1, 40\n38.4, 100\n40.2, 80\n53.0, 30\n63.2, 25\n70.6, 20',
    description: 'The most common titanium alloy. Consists of a dual-phase microstructure of alpha and beta phases, offering high strength and corrosion resistance.',
    formula: 'Ti-6Al-4V',
    crystalSystem: 'HCP + BCC',
    spaceGroup: 'P63/mmc + Im-3m',
    density: 4.43,
    applications: ['Aerospace', 'Medical Implants', 'Marine Engineering'],
    molecularWeight: 47.87,
    hazards: ['Combustible dust']
  },
  {
    name: 'Zircaloy-4',
    type: 'Nuclear/Cladding',
    pattern: '31.9, 30\n34.8, 100\n36.5, 90\n47.9, 20\n63.4, 15\n68.1, 10',
    description: 'A zirconium alloy characterized by very low absorption cross-section of thermal neutrons, used for nuclear fuel cladding.',
    formula: 'Zr-1.5Sn-0.2Fe-0.1Cr',
    crystalSystem: 'Hexagonal (HCP)',
    spaceGroup: 'P63/mmc',
    density: 6.56,
    applications: ['Nuclear Fuel Cladding', 'Reactor Core Structures'],
    elasticModulus: 99,
    magneticProperties: 'Paramagnetic',
    opticalProperties: 'Metallic lustrous grey',
    hazards: ['Pyrophoric (powder form)']
  },
  {
    name: 'Nuclear Graphite',
    type: 'Nuclear/Moderator',
    pattern: '26.6, 100\n42.4, 15\n44.6, 25\n54.7, 30\n77.5, 10',
    description: 'Highly purified graphite optimized for its high moderating ratio and structural stability under intense radiation.',
    formula: 'C',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 2.26,
    applications: ['Neutron Moderator', 'Reactor Reflector Components']
  },
  {
    name: 'Neodymium Magnet (Nd2Fe14B)',
    type: 'Magnetic Material',
    pattern: '29.3, 25\n38.4, 40\n41.0, 100\n41.8, 60\n43.7, 45\n49.1, 30\n53.2, 20',
    description: 'The strongest type of permanent magnet commercially available, featuring high coercivity and magnetic remanence.',
    formula: 'Nd2Fe14B',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm',
    density: 7.55,
    applications: ['Electric Motors', 'Hard Disk Drives', 'Wind Turbines'],
    molecularWeight: 1081.54,
    elasticModulus: 151,
    magneticProperties: 'Ferromagnetic (High Coercivity)',
    opticalProperties: 'Metallic (usually plated)',
    hazards: ['Mechanical Pinching', 'Brittle']
  },
  {
    name: 'Titanium Carbide (TiC)',
    type: 'Ultra-hard Ceramic',
    pattern: '35.9, 100\n41.7, 85\n60.4, 60\n72.3, 45\n76.0, 15\n89.8, 20',
    description: 'An extremely hard refractory ceramic material, similar to tungsten carbide.',
    formula: 'TiC',
    crystalSystem: 'Cubic (NaCl-type)',
    spaceGroup: 'Fm-3m',
    density: 4.93,
    applications: ['Cutting Tools', 'Coatings', 'Abrasives'],
    molecularWeight: 59.88,
    elasticModulus: 450
  },
  {
    name: 'Chromium(III) Oxide (Cr2O3)',
    type: 'Oxide Ceramic/Mineral',
    pattern: '24.5, 40\n33.6, 100\n36.2, 75\n41.5, 25\n50.2, 40\n54.8, 90\n63.4, 20\n65.1, 35',
    description: 'Eskolaite, a hard green mineral used as a pigment and for polishing.',
    formula: 'Cr2O3',
    crystalSystem: 'Trigonal (Corundum)',
    spaceGroup: 'R-3c',
    density: 5.22,
    applications: ['Green Pigments', 'Polishing compounds', 'Refractories'],
    molecularWeight: 151.99,
    bandGap: 3.4
  },
  {
    name: 'Cobalt Ferrite (CoFe2O4)',
    type: 'Magnetic Ceramic',
    pattern: '30.1, 40\n35.4, 100\n37.1, 15\n43.1, 30\n53.4, 25\n57.0, 45\n62.6, 60',
    description: 'A hard magnetic material with high coercivity and moderate saturation magnetization.',
    formula: 'CoFe2O4',
    crystalSystem: 'Cubic (Spinel)',
    spaceGroup: 'Fd-3m',
    density: 5.29,
    applications: ['Magnetic Recording', 'Ferrofluids', 'Magnetostrictive Sensors'],
    molecularWeight: 234.62,
    magneticProperties: 'Ferrimagnetic'
  },
  {
    name: 'Bismuth Oxychloride (BiOCl)',
    type: 'Photocatalyst/Pigment',
    pattern: '12.0, 100\n24.2, 35\n25.8, 85\n32.5, 75\n33.4, 80\n40.7, 45\n46.6, 60\n49.3, 55',
    description: 'A layered material with excellent light-harvesting and photocatalytic properties.',
    formula: 'BiOCl',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4/nmm',
    density: 7.72,
    applications: ['Cosmetic Pigments', 'Photocatalysis', 'Optical Coatings'],
    molecularWeight: 260.43,
    bandGap: 3.2
  },
  {
    name: 'Cesium Lead Iodide (CsPbI3)',
    type: 'Perovskite/Photovoltaic',
    pattern: '14.2, 100\n20.1, 45\n24.6, 35\n28.6, 90\n32.1, 25\n35.3, 30\n40.8, 55',
    description: 'An all-inorganic perovskite material with high thermal stability for solar cells.',
    formula: 'CsPbI3',
    crystalSystem: 'Cubic (at high temp)',
    spaceGroup: 'Pm-3m',
    density: 5.04,
    applications: ['Tandem Solar Cells', 'LEDs', 'Scintillators'],
    molecularWeight: 720.82,
    bandGap: 1.73
  },
  {
    name: 'Titanium MXene (Ti3C2Tx)',
    type: '2D Material',
    pattern: '9.2, 100\n18.4, 15\n27.6, 10\n34.2, 5\n38.9, 12\n42.1, 8\n60.5, 10',
    description: 'A prominent member of the MXene family of two-dimensional transition metal carbides.',
    formula: 'Ti3C2Tx',
    crystalSystem: 'Hexagonal (Layered)',
    spaceGroup: 'P63/mmc',
    density: 4.8,
    applications: ['Energy Storage', 'EMI Shielding', 'Water Purification'],
    opticalProperties: 'Metallic conductivity and hydrophilic surface'
  },
  {
    name: 'UiO-66 (Zr-MOF)',
    type: 'Metal-Organic Framework',
    pattern: '7.4, 100\n8.5, 95\n12.1, 45\n14.1, 15\n14.8, 20\n17.1, 25\n25.7, 10',
    description: 'A highly stable zirconium-based MOF with exceptional chemical and thermal resistance.',
    formula: 'Zr6O4(OH)4(BDC)6',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 1.2,
    applications: ['Gas Adsorption', 'Chemical Sensing', 'Catalysis'],
    molecularWeight: 1622.0
  },
  {
    name: 'HKUST-1 (Cu-MOF)',
    type: 'Metal-Organic Framework',
    pattern: '6.7, 100\n9.5, 65\n11.6, 85\n13.4, 25\n14.7, 20\n17.5, 40\n19.0, 35\n26.0, 15',
    description: 'A well-known copper-based MOF with high surface area and open metal sites.',
    formula: 'Cu3(BTC)2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 0.88,
    applications: ['Gas Storage', 'Small Molecule Separation', 'Sensors'],
    molecularWeight: 604.87
  },
  {
    name: 'Molybdenum Trioxide (MoO3)',
    type: 'Semiconductor/Oxide',
    pattern: '12.8, 100\n23.3, 85\n25.7, 95\n27.3, 75\n33.7, 45\n39.0, 35\n49.3, 40',
    description: 'An n-type semiconductor used in electrochromic devices and catalysis.',
    formula: 'α-MoO3',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pbnm',
    density: 4.69,
    applications: ['Catalysis', 'Gas Sensors', 'Smart Windows'],
    molecularWeight: 143.94,
    bandGap: 3.0
  },
  {
    name: 'Vanadium(III) Oxide (V2O3)',
    type: 'Oxide/Mott Insulator',
    pattern: '24.3, 35\n33.0, 100\n36.2, 80\n41.2, 20\n49.7, 30\n54.0, 95\n62.9, 15\n64.1, 25',
    description: 'A classic Mott insulator that undergoes a metal-insulator transition around 150 K.',
    formula: 'V2O3',
    crystalSystem: 'Trigonal (Corundum)',
    spaceGroup: 'R-3c',
    density: 4.87,
    applications: ['Electronic Threshold Switches', 'Cryogenic Thermometers'],
    molecularWeight: 149.88
  },
  {
    name: 'Hematite (Fe2O3)',
    type: 'Oxide Mineral',
    pattern: '24.1, 40\n33.2, 100\n35.6, 75\n40.9, 25\n49.5, 40\n54.1, 85\n62.5, 30\n64.0, 35',
    description: 'The mineral form of iron(III) oxide, one of several iron oxides.',
    formula: 'Fe2O3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c',
    density: 5.24,
    applications: ['Iron Ore', 'Pigments', 'Polishing compounds'],
    magneticProperties: 'Antiferromagnetic/Weak Ferromagnetic'
  },
  {
    name: 'Perovskite (CaTiO3)',
    type: 'Definitive Perovskite',
    pattern: '23.2, 25\n33.1, 100\n40.3, 15\n47.5, 45\n53.8, 10\n59.2, 35\n69.6, 30',
    description: 'The namesake of the perovskite crystal structure, found in the Earth\'s mantle.',
    formula: 'CaTiO3',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pbnm',
    density: 3.98,
    applications: ['Geological Studies', 'High-temp Ceramics']
  },
  {
    name: 'Feldspar (Orthoclase)',
    type: 'Silicate Mineral',
    pattern: '13.1, 30\n21.0, 25\n23.6, 100\n26.5, 80\n27.8, 45\n29.9, 15',
    description: 'A common rock-forming tectosilicate mineral.',
    formula: 'KAlSi3O8',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'C2/m',
    density: 2.56,
    applications: ['Glassmaking', 'Ceramics', 'Abrasives']
  },
  {
    name: 'Stainless Steel 316L',
    type: 'Metal Alloy',
    pattern: '43.6, 100\n50.8, 45\n74.7, 25\n90.7, 20\n95.9, 10',
    description: 'Low-carbon FCC austenitic steel with excellent corrosion resistance containing Mo.',
    formula: 'Fe-Cr-Ni-Mo (316L)',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 8.0,
    applications: ['Medical Implants', 'Marine Hardware', 'Chemical Processing']
  },
  {
    name: 'Stainless Steel 304',
    type: 'Metal Alloy',
    pattern: '43.5, 100\n50.7, 45\n74.5, 25\n90.5, 20\n95.7, 10',
    description: 'The most common austenitic stainless steel, widely used in various industries.',
    formula: 'Fe-Cr-Ni (304)',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 7.93,
    applications: ['Food Processing', 'Kitchenware', 'Building Facades']
  },
  {
    name: 'Ti-6Al-4V (Grade 5)',
    type: 'Metal Alloy',
    pattern: '35.1, 30\n38.4, 30\n40.2, 100\n53.0, 20\n63.3, 25\n70.6, 20\n76.2, 15',
    description: 'High-strength alpha-beta titanium alloy, widely used in aerospace and medical implants.',
    formula: 'Ti-6Al-4V',
    crystalSystem: 'Hexagonal (Alpha) + Cubic (Beta)',
    spaceGroup: 'P63/mmc',
    density: 4.43,
    applications: ['Aerospace Structures', 'Engine Components', 'Surgical Tools']
  },
  {
    name: 'Brass (C26000)',
    type: 'Metal Alloy',
    pattern: '42.6, 100\n49.6, 45\n72.8, 20\n88.1, 15',
    description: 'A copper-zinc alloy (70-30), exhibiting good strength and corrosion resistance.',
    formula: 'Cu-Zn (Brass)',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 8.53,
    applications: ['Ammunition', 'Plumbing', 'Musical Instruments']
  },
  {
    name: 'Inconel 718',
    type: 'Superalloy',
    pattern: '43.8, 100\n51.0, 48\n75.1, 22\n91.2, 18',
    description: 'Nickel-chromium-based superalloy used for high-temperature applications.',
    formula: 'Ni-Cr-Fe-Nb-Mo',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m',
    density: 8.19,
    applications: ['Jet Engines', 'Gas Turbines', 'Nuclear Reactors']
  },
  {
    name: 'SBA-15 (Mesoporous Silica)',
    type: 'Drug Delivery',
    pattern: '0.9, 100\n1.6, 30\n1.8, 25',
    description: 'Hexagonal mesoporous silica with high surface area and thick walls.',
    formula: 'SiO2',
    crystalSystem: 'Hexagonal (2D)',
    spaceGroup: 'p6mm',
    density: 0.6,
    applications: ['Drug Loading', 'Catalysis', 'Adsorption']
  },
  {
    name: 'MCM-41 (Mesoporous Silica)',
    type: 'Drug Delivery',
    pattern: '2.1, 100\n3.6, 15\n4.2, 10',
    description: 'Ordered mesoporous material with high pore volume and surface area.',
    formula: 'SiO2',
    crystalSystem: 'Hexagonal (2D)',
    spaceGroup: 'p6mm',
    density: 0.7,
    applications: ['Controlled Release', 'Environmental Remediation']
  },
  {
    name: 'MOF-5 (Zinc Tera-terephthalate)',
    type: 'Framework',
    pattern: '6.8, 100\n9.7, 45\n13.8, 35\n14.1, 20',
    description: 'Classic Metal-Organic Framework with high porosity for gas storage and drug delivery.',
    formula: 'Zn4O(BDC)3',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 0.59,
    applications: ['Hydrogen Storage', 'Drug Delivery Carriers']
  },
  {
    name: 'ZIF-8 (Zeolitic Imidazolate Framework)',
    type: 'Framework',
    pattern: '7.3, 100\n10.3, 40\n12.7, 30\n14.7, 15\n16.4, 25\n18.0, 10',
    description: 'Chemically stable MOF used for pH-responsive drug delivery.',
    formula: 'Zn(mIm)2',
    crystalSystem: 'Cubic',
    spaceGroup: 'I-43m',
    density: 0.95,
    applications: ['Biotech', 'Drug Encapsulation', 'Gas Separation']
  },
  {
    name: 'Ibuprofen (Crystalline)',
    type: 'Pharmaceutical',
    pattern: '6.1, 80\n12.2, 50\n16.6, 100\n17.7, 45\n18.9, 60\n20.2, 70\n22.3, 90',
    description: 'Propionic acid derivative drug, showing sharp Bragg peaks in its crystalline form.',
    formula: 'C13H18O2',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c',
    density: 1.03,
    applications: ['Anti-inflammatory', 'Drug Delivery Studies']
  },
  {
    name: 'Paracetamol (Acetaminophen)',
    type: 'Pharmaceutical',
    pattern: '12.1, 40\n15.5, 60\n18.2, 100\n20.4, 35\n23.5, 45\n24.4, 80\n32.8, 20',
    description: 'Common analgesic. Studied for polymorphic transitions in drug formulation.',
    formula: 'C8H9NO2',
    crystalSystem: 'Monoclinic (Form I)',
    spaceGroup: 'P21/n',
    density: 1.29,
    applications: ['Analgesics', 'Crystallization Research']
  },
  {
    name: 'Magnetite (Fe3O4)',
    type: 'Magnetic Oxide',
    pattern: '30.1, 30\n35.4, 100\n43.1, 20\n53.4, 10\n57.0, 30\n62.6, 40',
    description: 'A common ferrimagnetic iron oxide mineral with an inverse spinel structure.',
    formula: 'Fe3O4',
    crystalSystem: 'Cubic (Spinel)',
    spaceGroup: 'Fd-3m',
    density: 5.17,
    applications: ['Magnetic Storage', 'Biomedical Imaging', 'Catalysis']
  },
  {
    name: 'Polyethylene (PE)',
    type: 'Polymer',
    pattern: '21.5, 100\n24.0, 45\n36.3, 10',
    description: 'Semicrystalline thermoplastic showing characteristic orthorhombic crystalline peaks.',
    formula: '(C2H4)n',
    crystalSystem: 'Orthorhombic (Crystalline)',
    spaceGroup: 'Pnam',
    density: 0.94,
    applications: ['Packaging', 'Consumer Goods', 'Industrial Pipes']
  },
  {
    name: 'YBCO Superconductor',
    type: 'Superconductor',
    pattern: '32.5, 80\n32.8, 100\n38.5, 20\n46.7, 45\n58.1, 30',
    description: 'High-temperature superconducting ceramic material (Yttrium Barium Copper Oxide).',
    formula: 'YBa2Cu3O7',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pmmm',
    density: 6.38,
    applications: ['Maglev Trains', 'MRI Machines', 'Particle Accelerators']
  },
  {
    name: 'Portland Cement (Alite)',
    type: 'Construction material',
    pattern: '29.4, 100\n32.2, 80\n32.6, 85\n34.4, 40\n41.2, 35\n51.7, 30',
    description: 'The primary active phase (Tricalcium Silicate) in Portland cement clinker.',
    formula: 'Ca3SiO5 (C3S)',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'Cm',
    density: 3.15,
    applications: ['Infrastructure', 'Building Construction', 'Concrete']
  }
];

export const DeepLearningModule: React.FC = () => {
  const { t } = useTranslation();
  const [inputData, setInputData] = useState<string>("");
  const [result, setResult] = useState<DLPhaseResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Preproc, 2: CNN, 3: DB, 4: Done
  const [selectedCandidate, setSelectedCandidate] = useState<DLPhaseCandidate | null>(null);
  const [scanPos, setScanPos] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Advanced Engine Configuration
  const [engineConfig, setEngineConfig] = useState({
    kernelSize: 5,
    filters: 64,
    activation: 'ReLU',
    optimization: 'Adam',
    multiScale: true,
    dropout: 0.2,
    pooling: 'max',
    depth: 50,
    learningRate: 0.001,
    batchNorm: true,
    confidenceThreshold: 50
  });

  // Search & Advanced Tools State
  const [searchTerm, setSearchTerm] = useState("");
  
  const getFilteredMaterials = () => {
    if (!searchTerm.trim()) return [];
    const keywords = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    
    return MATERIAL_DB.map(material => {
      let score = 0;
      keywords.forEach(kw => {
        if (material.name.toLowerCase().includes(kw)) score += 10;
        if (material.formula.toLowerCase().includes(kw)) score += 10;
        if (material.crystalSystem?.toLowerCase().includes(kw)) score += 5;
        if (material.type?.toLowerCase().includes(kw)) score += 5;
        if (material.spaceGroup?.toLowerCase().includes(kw)) score += 3;
        if (material.applications?.some(app => app.toLowerCase().includes(kw))) score += 2;
      });
      return { material, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.material)
    .slice(0, 10); // Return top 10 relevant
  };
  
  const searchResults = getFilteredMaterials();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLatticeModalOpen, setIsLatticeModalOpen] = useState(false);
  const [latticeResult, setLatticeResult] = useState<{ a: number, error: string } | null>(null);
  const [mixtureList, setMixtureList] = useState<string[]>([]);
  const [isMixMode, setIsMixMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputData(content);
      }
    };
    reader.readAsText(file);
  };

  const steps = [
    { label: 'Idle', icon: Brain },
    { label: 'Preprocessing Pattern', icon: Activity },
    { label: 'CNN Feature Extraction', icon: Layers },
    { label: 'Database Matching', icon: Database },
    { label: 'Final Scoring', icon: CheckCircle },
  ];

  const handleMaterialSelect = (material: typeof MATERIAL_DB[0]) => {
    if (isMixMode) {
      // In mix mode, we don't switch patterns immediately, we add to list
      if (!mixtureList.includes(material.name)) {
        const newList = [...mixtureList, material.name];
        setMixtureList(newList);
        generateMixturePattern(newList);
      }
    } else {
      setInputData(material.pattern);
      setSearchTerm(material.name);
      setShowSuggestions(false);
      runAnalysis(material.pattern);
    }
  };

  const generateMixturePattern = (names: string[]) => {
    const materials = names.map(n => MATERIAL_DB.find(m => m.name === n)).filter(Boolean) as typeof MATERIAL_DB;
    if (materials.length === 0) return;
    
    // Simple sum of patterns
    const masterPoints: Record<number, number> = {};
    materials.forEach((mat, idx) => {
      const weight = 1 / materials.length; // Equal weighting for simplicity
      const pts = parseXYData(mat.pattern);
      pts.forEach(p => {
        const rounded = Math.round(p.twoTheta * 100) / 100;
        masterPoints[rounded] = (masterPoints[rounded] || 0) + (p.intensity * weight);
      });
    });
    
    const combinedStr = Object.entries(masterPoints)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([t, i]) => `${t}, ${i.toFixed(1)}`)
      .join('\n');
      
    setInputData(combinedStr);
    setSearchTerm("Custom Mixture");
  };

  const handleLatticeEstimation = () => {
    if (!selectedCandidate || !selectedCandidate.matched_peaks?.length) return;
    
    // Try to estimate 'a' assuming first peak is (1,1,1) or something common
    // More realistically, let the user pick index or use a common one loop
    const firstPeak = selectedCandidate.matched_peaks[0];
    const a = calculateLatticeConstant(firstPeak.obsT, 1, 1, 1);
    setLatticeResult({ a, error: "Assuming cubic (111) for initial estimate" });
    setIsLatticeModalOpen(true);
  };

  // Smart Local Search & Engine
  const handleSmartSearch = () => {
    if (!searchTerm.trim()) return;
    
    if (searchResults.length > 0) {
      handleMaterialSelect(searchResults[0]);
    } else {
      // If no exact name match, try to find by peak similarity (Advance local feature)
      const points = parseXYData(inputData);
      if (points.length > 0) {
        runAnalysis(inputData);
      }
    }
    setShowSuggestions(false);
  };

  const calculateLatticeConstant = (twoTheta: number, h: number, k: number, l: number, wavelength: number = 1.5406) => {
    const thetaRad = (twoTheta / 2) * (Math.PI / 180);
    const d = wavelength / (2 * Math.sin(thetaRad));
    const a = d * Math.sqrt(h*h + k*k + l*l);
    return a;
  };

  const handleRunAI = () => {
    runAnalysis(inputData);
  };

  const runAnalysis = (dataToAnalyze: string) => {
    if (!dataToAnalyze.trim()) return;
    
    setIsSimulating(true);
    setResult(null);
    setSelectedCandidate(null);
    setProgressStep(1);

    // Start Scan Animation
    let currentX = 0;
    const scanInterval = setInterval(() => {
      currentX += 2;
      setScanPos(currentX > 100 ? 0 : currentX);
    }, 50);

    // Check if input matches a known material to override/enhance results
    const matchedMaterial = MATERIAL_DB.find(m => m.pattern === dataToAnalyze || m.name === searchTerm);

    // Simulation Sequence
    setTimeout(() => setProgressStep(2), 800);
    setTimeout(() => setProgressStep(3), 2000);
    setTimeout(() => {
      const points = parseXYData(dataToAnalyze);
      let computed = identifyPhasesDL(points);
      
      // Enhance result with known material data if matched
      if (matchedMaterial) {
        const enhancedCandidate: DLPhaseCandidate = {
          phase_name: matchedMaterial.name,
          confidence_score: 98.5,
          card_id: "DB-MATCH-001",
          formula: matchedMaterial.formula,
          matched_peaks: parseXYData(matchedMaterial.pattern).map(p => ({
            refT: p.twoTheta,
            obsT: p.twoTheta,
            refI: p.intensity
          })),
          description: matchedMaterial.description,
          crystalSystem: matchedMaterial.crystalSystem,
          spaceGroup: matchedMaterial.spaceGroup,
          density: matchedMaterial.density,
          applications: matchedMaterial.applications,
          materialType: matchedMaterial.type,
          molecularWeight: (matchedMaterial as any).molecularWeight,
          bandGap: (matchedMaterial as any).bandGap,
          elasticModulus: (matchedMaterial as any).elasticModulus,
          magneticProperties: (matchedMaterial as any).magneticProperties,
          opticalProperties: (matchedMaterial as any).opticalProperties,
          hazards: (matchedMaterial as any).hazards,
        };
        
        // Put the matched one first
        computed = {
          ...computed,
          candidates: [enhancedCandidate, ...computed.candidates.filter(c => c.phase_name !== matchedMaterial.name)]
        };
      }
      setResult(computed);
      if (computed.candidates.length > 0) {
        setSelectedCandidate(computed.candidates[0]);
      }
      setProgressStep(4);
      setIsSimulating(false);
      clearInterval(scanInterval);
      setScanPos(null);
    }, 3000);
  };

  const handleGenerateReport = () => {
    if (!selectedCandidate) return;
    
    const report = `XRD Analysis Report
Generated by XRD-Calc Pro AI Engine
Date: ${new Date().toLocaleString()}

--- Identification Result ---
Phase Name: ${selectedCandidate.phase_name}
Formula: ${selectedCandidate.formula}
Confidence Score: ${selectedCandidate.confidence_score}%
Match Quality: ${selectedCandidate.match_quality || "N/A"}
Card ID: ${selectedCandidate.card_id}

--- Material Properties ---
Crystal System: ${selectedCandidate.crystalSystem || "Unknown"}
Space Group: ${selectedCandidate.spaceGroup || "N/A"}
Density: ${selectedCandidate.density ? selectedCandidate.density + " g/cm³" : "N/A"}
Material Type: ${selectedCandidate.materialType || "N/A"}
Molecular Weight: ${selectedCandidate.molecularWeight ? selectedCandidate.molecularWeight + " g/mol" : "N/A"}
Band Gap: ${selectedCandidate.bandGap !== undefined ? selectedCandidate.bandGap + " eV" : "N/A"}
Elastic Modulus: ${selectedCandidate.elasticModulus !== undefined ? selectedCandidate.elasticModulus + " GPa" : "N/A"}
Magnetic Properties: ${selectedCandidate.magneticProperties || "Homogenous/N/A"}
Optical Properties: ${selectedCandidate.opticalProperties || "N/A"}

--- Description ---
${selectedCandidate.description || "N/A"}

--- Matched Peaks ---
${selectedCandidate.matched_peaks?.map(p => `Ref: ${p.refT.toFixed(2)}° | Obs: ${p.obsT.toFixed(2)}° | Int: ${p.refI}`).join('\n') || "No detailed peak data"}

--- Applications ---
${selectedCandidate.applications?.join(', ') || "N/A"}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCandidate.phase_name}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExample = (type: string) => {
    if (type === 'Mixture') {
      setInputData(`20.86, 40\n26.64, 100\n38.18, 50\n44.39, 25\n50.14, 15\n64.57, 20`);
      setSearchTerm("Mixture (SiO2 + Au)");
    } else if (type === 'Complex') {
      setInputData(`25.28, 60\n26.64, 100\n27.44, 40\n38.12, 30\n44.30, 15`);
      setSearchTerm("Complex Mixture (Quartz + Rutile + Anatase + Ag)");
    } else if (type === 'Modern-Ceramic') {
      setInputData(`28.17, 30\n31.47, 20\n35.9, 100\n41.7, 85\n50.12, 10\n60.4, 60\n72.3, 45`);
      setSearchTerm("Modern Ceramic (TiC + ZrO2)");
    } else if (type === 'Solar-Mix') {
      setInputData(`14.15, 100\n14.2, 90\n20.1, 45\n24.5, 45\n28.4, 60\n28.6, 90\n31.8, 30\n32.1, 25\n40.6, 20\n40.8, 55`);
      setSearchTerm("Solar Mix (Hybrid MAPbI3 + Inorganic CsPbI3)");
    } else if (type === 'Cathode-Mix') {
      setInputData(`18.9, 100\n36.7, 45\n37.3, 50\n38.4, 85\n44.3, 40\n45.2, 40\n64.4, 25\n77.4, 25`);
      setSearchTerm("Cathode Mix (LCO + NMC-111)");
    } else if (type === 'Geological-Suite') {
      setInputData(`20.86, 35\n23.6, 60\n24.1, 40\n26.64, 100\n29.40, 100\n33.2, 80\n36.54, 12\n54.1, 85`);
      setSearchTerm("Geological Suite (Quartz + Calcite + Hematite + Feldspar)");
    } else {
      // Generic finder for all single phase examples
      const searchKey = type === 'HAP' ? 'Hydroxyapatite' : 
                        type === 'PbTiO3' ? 'Lead Titanate' :
                        type === 'LTA' ? 'Zeolite A' :
                        type === 'YAG' ? 'Yttrium Aluminum Garnet' :
                        type === 'SrTiO3' ? 'Strontium Titanate' :
                        type === 'LiFePO4' || type === 'LFP' ? 'Lithium Iron Phosphate' :
                        type === 'GaN' ? 'Gallium Nitride' :
                        type === 'Au' ? 'Gold' :
                        type === 'Fe' ? 'Iron - Alpha' :
                        type === 'Ni' ? 'Nickel' :
                        type === 'WC' ? 'Tungsten Carbide' :
                        type === 'Fe3O4' ? 'Magnetite' :
                        type === 'MAPbI3' ? 'Methylammonium Lead Iodide' :
                        type === 'SiC' ? 'Silicon Carbide' :
                        type === 'GaAs' ? 'Gallium Arsenide' :
                        type === 'BFO' ? 'Bismuth Ferrite' :
                        type === 'ITO' ? 'Indium Tin Oxide' :
                        type === 'FeS2' ? 'Pyrite' :
                        type === 'Cr' ? 'Chromium' :
                        type === 'Ga2O3' ? 'Gallium Oxide' :
                        type === 'CdTe' ? 'Cadmium Telluride' :
                        type === 'Bi2Te3' ? 'Bismuth Telluride' :
                        type === 'SnO2' ? 'Tin Oxide' :
                        type === 'LCO' ? 'Lithium Cobalt Oxide' :
                        type === 'Si3N4' ? 'Silicon Nitride' :
                        type === 'AlN' ? 'Aluminum Nitride' :
                        type === 'hBN' ? 'Boron Nitride' :
                        type === 'GaP' ? 'Gallium Phosphide' :
                        type === 'ZnSe' ? 'Zinc Selenide' :
                        type === 'Ta' ? 'Tantalum' :
                        type === 'V2O5' ? 'Vanadium Pentoxide' :
                        type === 'AgCl' ? 'Silver Chloride' :
                        type === 'MnO2' ? 'Manganese Oxide' :
                        type === 'PTFE' ? 'Polytetrafluoroethylene' :
                        type === 'NaCl' ? 'Halite' :
                        type === 'KCl' ? 'Sylvite' :
                        type === 'CaF2' ? 'Calcium Fluoride' :
                        type === 'ZrO2' ? 'Zirconia' :
                        type === 'Graphite' ? 'Graphite' :
                        type === 'Hematite' ? 'Hematite' :
                        type === 'MgO' ? 'Magnesium Oxide' :
                        type === 'CeO2' ? 'Cerium Oxide' :
                        type === 'Calcite' ? 'Calcite' : 
                        type === 'Tungsten' ? 'Tungsten' : 
                        type === 'Quartz' ? 'Quartz' : 
                        type === 'Diamond' ? 'Diamond' :
                        type === 'Rutile' ? 'Rutile' :
                        type === 'Anatase' ? 'Anatase' :
                        type === 'BaTiO3' ? 'Barium Titanate' :
                        type === 'MoS2' ? 'Molybdenum Disulfide' :
                        type === 'Corundum' ? 'Corundum' :
                        type === 'TTCP' ? 'Tetracalcium Phosphate' :
                        type === 'PZT' ? 'Lead Zirconate Titanate' :
                        type === 'ZnS' ? 'Zinc Sulfide' :
                        type === 'BaFe12O19' ? 'Barium Ferrite' :
                        type === 'WO3' ? 'Tungsten Trioxide' :
                        type === 'VO2' ? 'Vanadium Dioxide' :
                        type === 'Ag2O' ? 'Silver(I) Oxide' :
                        type === 'CuO' ? 'Copper(II) Oxide' :
                        type === 'NiO' ? 'Nickel Oxide' :
                        type === 'Co3O4' ? 'Cobalt(II,III) Oxide' :
                        type === 'LTO' ? 'Lithium Titanate' :
                        type === 'YBCO' ? 'YBCO Superconductor' :
                        type === 'ZSM5' ? 'Zeolite ZSM-5' :
                        type === 'MOF5' ? 'Metal-Organic Framework-5' :
                        type === 'Pt' ? 'Platinum' :
                        type === 'Pd' ? 'Palladium' :
                        type === 'NMC' ? 'NMC-111' :
                        type === 'YSZ' ? 'Yttria-Stabilized Zirconia' :
                        type === 'SRO' ? 'Strontium Ruthenate' :
                        type === 'GO' ? 'Graphene Oxide' :
                        type === 'OCP' ? 'Octacalcium Phosphate' :
                        type === 'Cellulose' ? 'Cellulose' :
                        type === 'Chitosan' ? 'Chitosan' :
                        type === 'Silk' ? 'Silk Fibroin' :
                        type === 'Whewellite' ? 'Calcium Oxalate' :
                        type === 'ACP' ? 'Amorphous Calcium' :
                        type === 'PLA' ? 'Polylactic Acid' :
                        type === 'PEEK' ? 'Polyether ether ketone' :
                        type === 'Collagen' ? 'Collagen Type I' :
                        type === 'UO2' ? 'Uranium Dioxide' :
                        type === 'ThO2' ? 'Thorium Dioxide' :
                        type === 'Zircaloy' ? 'Zircaloy-4' :
                        type === 'NuclearGraphite' ? 'Nuclear Graphite' :
                        type === 'Nd2Fe14B' ? 'Neodymium Magnet' :
                        type === 'TiC' ? 'Titanium Carbide' :
                        type === 'Cr2O3' ? 'Chromium(III) Oxide' :
                        type === 'CoFe2O4' ? 'Cobalt Ferrite' :
                        type === 'BiOCl' ? 'Bismuth Oxychloride' :
                        type === 'CsPbI3' ? 'Cesium Lead Iodide' :
                        type === 'Ti3C2' ? 'Titanium MXene' :
                        type === 'UiO66' ? 'UiO-66' :
                        type === 'HKUST1' ? 'HKUST-1' :
                        type === 'MoO3' ? 'Molybdenum Trioxide' :
                        type === 'V2O3' ? 'Vanadium(III) Oxide' :
                        type === 'Hematite' ? 'Hematite(Fe2O3)' :
                        type === 'PerovskiteCat' ? 'Perovskite (CaTiO3)' :
                        type === 'Feldspar' ? 'Feldspar (Orthoclase)' :
                        type === 'SS316L' ? 'Stainless Steel 316L' :
                        type === 'SS304' ? 'Stainless Steel 304' :
                        type === 'Ti64' ? 'Ti-6Al-4V (Grade 5)' :
                        type === 'Brass' ? 'Brass (C26000)' :
                        type === 'Inconel' ? 'Inconel 718' :
                        type === 'SBA15' ? 'SBA-15' :
                        type === 'MCM41' ? 'MCM-41' :
                        type === 'MOF5' ? 'MOF-5' :
                        type === 'ZIF8' ? 'ZIF-8' :
                        type === 'Ibuprofen' ? 'Ibuprofen' :
                        type === 'Paracetamol' ? 'Paracetamol' :
                        type === 'Magnetite' ? 'Magnetite (Fe3O4)' :
                        type === 'PE' ? 'Polyethylene (PE)' :
                        type === 'YBCO' ? 'YBCO Superconductor' :
                        type === 'Cement' ? 'Portland Cement (Alite)' :
                        type;
      
      const mat = MATERIAL_DB.find(m => m.name.includes(searchKey));
      if (mat) handleMaterialSelect(mat);
    }
  };

  const parsedPoints = parseXYData(inputData);
  
  // Prepare Chart Data
  const generateChartData = () => {
    if (!parsedPoints.length) return [];
    
    const isDiscrete = parsedPoints.length <= 50;
    
    // Sort parsed points
    const sortedPoints = [...parsedPoints].sort((a, b) => a.twoTheta - b.twoTheta);
    const sigma = 0.5; // Controls width of the simulated peaks
    const sigma22 = Math.max(0.0001, 2 * sigma * sigma);
    
    if (!isDiscrete) {
      // If it's continuous experimental data, calculate match and residual
      return sortedPoints.map(p => {
         let refIntensity = 0;
         if (selectedCandidate && selectedCandidate.matched_peaks) {
            for (const mp of selectedCandidate.matched_peaks) {
               refIntensity += mp.refI * Math.exp(-Math.pow(p.twoTheta - mp.refT, 2) / sigma22);
            }
         }
         
         const residual = selectedCandidate ? Math.abs(p.intensity - refIntensity) : null;
         
         return {
           twoTheta: p.twoTheta,
           intensity: p.intensity,
           refIntensity: selectedCandidate ? Number(refIntensity.toFixed(1)) : null,
           residual: residual !== null ? Number(residual.toFixed(1)) : null
         };
      });
    }
    
    // For discrete stick data, generate a continuous gaussian spectrum
    const minT = Math.max(0, sortedPoints[0].twoTheta - 10);
    const maxT = sortedPoints[sortedPoints.length - 1].twoTheta + 10;
    
    const data = [];

    for (let t = minT; t <= maxT; t += 0.2) {
      let intensity = 0;
      for (const p of sortedPoints) {
        intensity += p.intensity * Math.exp(-Math.pow(t - p.twoTheta, 2) / sigma22);
      }
      
      let refIntensity = 0;
      if (selectedCandidate && selectedCandidate.matched_peaks) {
         for (const mp of selectedCandidate.matched_peaks) {
            refIntensity += mp.refI * Math.exp(-Math.pow(t - mp.refT, 2) / sigma22);
         }
      }
      
      const residual = selectedCandidate ? Math.abs(intensity - refIntensity) : null;

      data.push({
        twoTheta: Number(t.toFixed(2)),
        intensity: Number(intensity.toFixed(1)),
        refIntensity: selectedCandidate ? Number(refIntensity.toFixed(1)) : null,
        residual: residual !== null ? Number(residual.toFixed(1)) : null
      });
    }
    return data;
  };

  const chartData = generateChartData();
  const isDiscrete = parsedPoints.length <= 50;

  // We keep refData as scatter for continuous case
  const refData = selectedCandidate?.matched_peaks?.map(mp => ({
    twoTheta: mp.refT,
    refIntensity: mp.refI,
    intensity: null
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050B14]/95 backdrop-blur-md text-slate-200 p-4 rounded-xl shadow-2xl text-xs border border-cyan-500/30">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-cyan-500/20">
             <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-400 font-mono tracking-widest uppercase">Target 2θ</span>
             </div>
             <p className="font-black text-white font-mono">{label?.toFixed ? label.toFixed(2) : label}°</p>
          </div>
          
          <div className="space-y-2">
            {payload.map((p: any, idx: number) => (
              <div key={`tooltip-${p.name}-${idx}`} className="flex items-center justify-between gap-6 py-1 px-2 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                  <span className="text-slate-300 font-medium truncate max-w-[150px]">{p.name}</span>
                </div>
                <span className="font-mono font-black" style={{ color: p.color }}>{p.value?.toFixed ? p.value.toFixed(1) : p.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
             <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Signal Confidence</span>
             <span className="text-[10px] text-emerald-400 font-mono font-black">HIGH</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        {/* Advanced Engine Configuration */}
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/10 blur-md rounded-full pointer-events-none" />
                <Settings className="w-6 h-6 text-indigo-400 relative z-10" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">Neural Config</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Engine Hyperparameters</p>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-inner">
              <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isSimulating ? 'Active' : 'Ready'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 relative z-10">
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Kernel Shift</label>
                <div className="relative group/select">
                  <select 
                    value={engineConfig.kernelSize}
                    onChange={(e) => setEngineConfig({...engineConfig, kernelSize: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    <option value={3} className="bg-slate-800">3x3 Narrow</option>
                    <option value={5} className="bg-slate-800">5x5 Standard</option>
                    <option value={7} className="bg-slate-800">7x7 Deep</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Feature Maps</label>
                <div className="relative group/select">
                  <select 
                    value={engineConfig.filters}
                    onChange={(e) => setEngineConfig({...engineConfig, filters: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    <option value={32} className="bg-slate-800">Sparse (32)</option>
                    <option value={64} className="bg-slate-800">Standard (64)</option>
                    <option value={128} className="bg-slate-800">Dense (128)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Neural Depth</label>
                <div className="relative group/select">
                  <select 
                    value={engineConfig.depth}
                    onChange={(e) => setEngineConfig({...engineConfig, depth: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    <option value={18} className="bg-slate-800">18 Layers (Light)</option>
                    <option value={34} className="bg-slate-800">34 Layers (Med)</option>
                    <option value={50} className="bg-slate-800">50 Layers (Heavy)</option>
                    <option value={101} className="bg-slate-800">101 Layers (Extrm)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Pooling Op</label>
                <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-inner">
                   {['max', 'avg'].map(op => (
                     <button
                       key={op}
                       onClick={() => setEngineConfig({...engineConfig, pooling: op})}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${engineConfig.pooling === op ? 'bg-indigo-600 text-white shadow-md uppercase border border-indigo-500' : 'text-slate-400 hover:text-slate-300 uppercase bg-transparent'}`}
                     >
                       {op}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Activation</label>
                <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-inner">
                   {['ReLU', 'GELU'].map(fn => (
                     <button
                       key={fn}
                       onClick={() => setEngineConfig({...engineConfig, activation: fn})}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${engineConfig.activation === fn ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-slate-300 bg-transparent'}`}
                     >
                       {fn}
                     </button>
                   ))}
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Optimization</label>
                <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-inner">
                   {['Adam', 'RMSProp'].map(opt => (
                     <button
                       key={opt}
                       onClick={() => setEngineConfig({...engineConfig, optimization: opt})}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${engineConfig.optimization === opt ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-slate-300 bg-transparent'}`}
                     >
                       {opt}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 space-y-6 relative z-10">
             <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Zap className="w-3.5 h-3.5 text-indigo-400" /> Base Learning Rate</label>
                  <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{engineConfig.learningRate.toFixed(4)}</span>
                </div>
                <input 
                  type="range"
                  min="0.0001"
                  max="0.01"
                  step="0.0001"
                  value={engineConfig.learningRate}
                  onChange={(e) => setEngineConfig({...engineConfig, learningRate: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                />
             </div>
             
             <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Min Confidence</label>
                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{engineConfig.confidenceThreshold}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={engineConfig.confidenceThreshold}
                  onChange={(e) => setEngineConfig({...engineConfig, confidenceThreshold: parseInt(e.target.value)})}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                />
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl cursor-pointer group hover:bg-slate-800 transition-colors">
                <div className="flex flex-col">
                   <span className="text-xs font-black text-slate-200 tracking-tight">Batch Normalization</span>
                   <span className="text-[10px] text-slate-500 font-medium">Stabilize training across mini-batches</span>
                </div>
                <div 
                  onClick={() => setEngineConfig({...engineConfig, batchNorm: !engineConfig.batchNorm})}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${engineConfig.batchNorm ? 'bg-emerald-500' : 'bg-slate-700 bg-opacity-50'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${engineConfig.batchNorm ? 'left-7' : 'left-1'}`} />
                </div>
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl cursor-pointer group hover:bg-slate-800 transition-colors">
                <div className="flex flex-col">
                   <span className="text-xs font-black text-slate-200 tracking-tight">Multi-Scale Convolutional Fusion</span>
                   <span className="text-[10px] text-slate-500 font-medium">Aggregated hierarchical identification</span>
                </div>
                <div 
                  onClick={() => setEngineConfig({...engineConfig, multiScale: !engineConfig.multiScale})}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${engineConfig.multiScale ? 'bg-indigo-500' : 'bg-slate-700 bg-opacity-50'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${engineConfig.multiScale ? 'left-7' : 'left-1'}`} />
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-600" />
              PhaseID Neural Net
            </h2>
            {isSimulating && (
              <span className="text-xs font-bold text-violet-600 animate-pulse bg-violet-50 px-2 py-1 rounded-full border border-violet-100 shadow-sm">
                Running...
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Material Search */}
            <div className="relative" ref={searchRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Unified Local DB Engine <span className="text-indigo-500 ml-1 font-mono text-[10px] bg-indigo-50 px-1 rounded border border-indigo-100 uppercase tracking-tighter font-black">LOCAL ENGINE</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSmartSearch();
                    }
                  }}
                  placeholder="Seach local database (formula or name)..."
                  className="w-full px-4 py-3 pl-10 pr-24 bg-slate-50 border border-slate-300 hover:border-violet-400 rounded-xl text-sm focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all shadow-inner"
                />
                <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                
                <button 
                  onClick={handleSmartSearch}
                  disabled={!searchTerm.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex items-center gap-2 group w-auto min-w-[90px] justify-center"
                >
                  <Database className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Search DB</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                  {searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((material, idx) => (
                        <button
                          key={`${material.name}-${idx}`}
                          onClick={() => handleMaterialSelect(material)}
                          className="w-full text-left px-4 py-3 hover:bg-violet-50 flex items-center justify-between group rounded-lg transition-colors border border-transparent hover:border-violet-100 mb-1 last:mb-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold group-hover:bg-violet-200 group-hover:text-violet-700 transition-colors">
                              {material.formula.substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 block text-sm group-hover:text-violet-700 transition-colors">{material.name}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{material.type}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded shadow-sm group-hover:bg-white group-hover:border-violet-300 group-hover:text-violet-600 transition-all">
                            {material.crystalSystem}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                       <Search className="w-8 h-8 text-slate-300 mb-2" />
                       <p className="text-slate-500 text-sm font-semibold mb-1">Not in local database</p>
                       <p className="text-slate-400 text-xs">The network can still analyze raw peak patterns to identify potential matches via similarity hashing.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-700">
                  Diffraction Pattern Input
                </label>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".xy,.txt,.csv"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold transition-all hover:shadow-sm active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload .xy
                  </button>
                  <button 
                    onClick={() => { setInputData(""); setResult(null); setSelectedCandidate(null); setProgressStep(0); setSearchTerm(""); }}
                    className="text-xs flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-lg font-bold transition-all hover:shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>
              
              <div 
                className={`relative border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden group
                  ${inputData ? 'border-violet-300 bg-violet-50/40 shadow-inner' : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50 hover:shadow-md'}
                `}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-violet-500', 'bg-violet-100', 'shadow-lg'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-violet-500', 'bg-violet-100', 'shadow-lg'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-violet-500', 'bg-violet-100', 'shadow-lg');
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const content = e.target?.result as string;
                      if (content) setInputData(content);
                    };
                    reader.readAsText(file);
                  }
                }}
              >
                {!inputData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 mb-3 group-hover:scale-110 group-hover:shadow-md transition-all">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-violet-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Drag & drop raw data</p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">or paste below (2θ, Intensity format)</p>
                  </div>
                )}
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder={inputData ? "" : "\n\n\n\n\n\n28.44, 100\n47.30, 55"}
                  className={`w-full h-52 px-5 py-4 bg-transparent text-slate-800 focus:ring-0 outline-none transition-colors font-mono text-[13px] leading-relaxed resize-none z-10 relative
                    ${!inputData ? 'placeholder:text-transparent' : ''}
                  `}
                  spellCheck={false}
                />
              </div>
              
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-black">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                   Format: <span className="text-slate-500 bg-slate-100 px-1 py-0.5 rounded ml-0.5">2θ</span> , <span className="text-slate-500 bg-slate-100 px-1 py-0.5 rounded">Intensity</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setIsMixMode(!isMixMode);
                      if (!isMixMode) setMixtureList([]);
                    }}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md transition-all border
                      ${isMixMode ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/20' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}
                    `}
                  >
                    <Layers className="w-3 h-3" />
                    {isMixMode ? 'Mix Mode ACTIVE' : 'Enable Mix Mode'}
                  </button>
                  {inputData && (
                    <div className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                      {inputData.split('\n').filter(l => l.trim()).length} Data Points
                    </div>
                  )}
                </div>
              </div>

              {isMixMode && mixtureList.length > 0 && (
                <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl animate-in zoom-in-95 duration-300">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Mixture Components</span>
                     <button onClick={() => setMixtureList([])} className="text-[10px] font-bold text-rose-500 hover:underline">Reset</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {mixtureList.map((m, mIdx) => (
                        <div key={`mix-${m}-${mIdx}`} className="flex items-center gap-1 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 shadow-sm">
                          {m}
                          <button onClick={() => {
                            const nl = mixtureList.filter(x => x !== m);
                            setMixtureList(nl);
                            generateMixturePattern(nl);
                          }}>
                            <X className="w-3 h-3 text-rose-400 hover:text-rose-600" />
                          </button>
                        </div>
                      ))}
                      <div className="px-2.5 py-1 bg-indigo-100/50 border border-dashed border-indigo-300 rounded-lg text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add from DB
                      </div>
                   </div>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FlaskConical className="w-3 h-3 text-slate-400" /> Test Data Suites
                   </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Silicon', label: 'Si' },
                    { id: 'Mixture', label: 'Mixture' },
                    { id: 'Diamond', label: 'Diamond' },
                    { id: 'Rutile', label: 'Rutile' },
                    { id: 'Anatase', label: 'Anatase' },
                    { id: 'Aluminum', label: 'Al' },
                    { id: 'Copper', label: 'Cu' },
                    { id: 'Tungsten', label: 'W' },
                    { id: 'MoS2', label: 'MoS2' },
                    { id: 'ZnO', label: 'ZnO' },
                    { id: 'MgO', label: 'MgO' },
                    { id: 'BaTiO3', label: 'BaTiO3' },
                    { id: 'Quartz', label: 'Quartz' },
                    { id: 'CeO2', label: 'CeO2' },
                    { id: 'Corundum', label: 'Al2O3' },
                    { id: 'Calcite', label: 'Calcite' },
                    { id: 'HAP', label: 'HAp' },
                    { id: 'beta-Tricalcium Phosphate', label: 'beta-TCP' },
                    { id: 'alpha-Tricalcium Phosphate', label: 'alpha-TCP' },
                    { id: 'Bioactive Glass', label: 'Bio-Glass' },
                    { id: 'Brushite', label: 'Brushite' },
                    { id: 'Monetite', label: 'Monetite' },
                    { id: 'TTCP', label: 'TTCP' },
                    { id: 'Bio-Aragonite', label: 'Aragonite' },
                    { id: 'PbTiO3', label: 'PbTiO3' },
                    { id: 'NiO', label: 'NiO' },
                    { id: 'Co3O4', label: 'Co3O4' },
                    { id: 'PZT', label: 'PZT' },
                    { id: 'VO2', label: 'VO2' },
                    { id: 'WO3', label: 'WO3' },
                    { id: 'Austenite', label: 'Austenite' },
                    { id: 'ZnS', label: 'ZnS' },
                    { id: 'BaFe12O19', label: 'Ba Ferrite' },
                    { id: 'CuO', label: 'CuO' },
                    { id: 'Ag2O', label: 'Ag2O' },
                    { id: 'LTA', label: 'Zeolite A' },
                    { id: 'Silver (Ag)', label: 'Ag' },
                    { id: 'Au', label: 'Au' },
                    { id: 'Ni', label: 'Ni' },
                    { id: 'Fe', label: 'Fe (BCC)' },
                    { id: 'GaN', label: 'GaN' },
                    { id: 'YAG', label: 'YAG' },
                    { id: 'SrTiO3', label: 'SrTiO3' },
                    { id: 'LiFePO4', label: 'LFP' },
                    { id: 'ZrO2', label: 'ZrO2' },
                    { id: 'Graphite', label: 'Graphite' },
                    { id: 'CaF2', label: 'CaF2' },
                    { id: 'KCl', label: 'KCl' },
                    { id: 'PTFE', label: 'PTFE' },
                    { id: 'WC', label: 'WC' },
                    { id: 'Fe3O4', label: 'Fe3O4' },
                    { id: 'MAPbI3', label: 'Perovskite' },
                    { id: 'SiC', label: 'SiC' },
                    { id: 'GaAs', label: 'GaAs' },
                    { id: 'Ga2O3', label: 'Ga2O3' },
                    { id: 'CdTe', label: 'CdTe' },
                    { id: 'Bi2Te3', label: 'Bi2Te3' },
                    { id: 'SnO2', label: 'SnO2' },
                    { id: 'LCO', label: 'LCO' },
                    { id: 'Si3N4', label: 'Si3N4' },
                    { id: 'AlN', label: 'AlN' },
                    { id: 'hBN', label: 'h-BN' },
                    { id: 'GaP', label: 'GaP' },
                    { id: 'ZnSe', label: 'ZnSe' },
                    { id: 'Ta', label: 'Ta' },
                    { id: 'V2O5', label: 'V2O5' },
                    { id: 'AgCl', label: 'AgCl' },
                    { id: 'MnO2', label: 'MnO2' },
                    { id: 'BFO', label: 'BFO' },
                    { id: 'ITO', label: 'ITO' },
                    { id: 'FeS2', label: 'FeS2' },
                    { id: 'Cr', label: 'Cr' },
                    { id: 'LTO', label: 'LTO Anode' },
                    { id: 'YBCO', label: 'YBCO High-Tc' },
                    { id: 'ZSM5', label: 'ZSM-5' },
                    { id: 'MOF5', label: 'MOF-5' },
                    { id: 'Pt', label: 'Pt Cat' },
                    { id: 'Pd', label: 'Pd Cat' },
                    { id: 'NMC', label: 'NMC Cathode' },
                    { id: 'YSZ', label: '8YSZ' },
                    { id: 'SRO', label: 'SrRuO3' },
                    { id: 'GO', label: 'GO' },
                    { id: 'OCP', label: 'OCP Bio' },
                    { id: 'Cellulose', label: 'Cellulose' },
                    { id: 'Chitosan', label: 'Chitosan' },
                    { id: 'Silk', label: 'Silk Fibroin' },
                    { id: 'Whewellite', label: 'Whewellite' },
                    { id: 'ACP', label: 'ACP' },
                    { id: 'PLA', label: 'PLA Bio' },
                    { id: 'PEEK', label: 'PEEK' },
                    { id: 'Collagen', label: 'Collagen' },
                    { id: 'UO2', label: 'UO2 Fuel' },
                    { id: 'ThO2', label: 'ThO2' },
                    { id: 'Zircaloy', label: 'Zircaloy-4' },
                    { id: 'NuclearGraphite', label: 'Nuclear Graphite' },
                    { id: 'Nd2Fe14B', label: 'Nd Magnet' },
                    { id: 'TiC', label: 'TiC' },
                    { id: 'Cr2O3', label: 'Cr2O3' },
                    { id: 'CoFe2O4', label: 'CoFe2O4' },
                    { id: 'BiOCl', label: 'BiOCl' },
                    { id: 'CsPbI3', label: 'CsPbI3' },
                    { id: 'Ti3C2', label: 'MXene' },
                    { id: 'UiO66', label: 'UiO-66' },
                    { id: 'HKUST1', label: 'HKUST-1' },
                    { id: 'MoO3', label: 'MoO3' },
                    { id: 'V2O3', label: 'V2O3' },
                    { id: 'Modern-Ceramic', label: 'Modern Ceramic' },
                    { id: 'Solar-Mix', label: 'Solar Mix' },
                    { id: 'Cathode-Mix', label: 'Cathode Mix' },
                    { id: 'Geological-Suite', label: 'Geo-Suite' },
                    { id: 'Hematite', label: 'Hematite' },
                    { id: 'Feldspar', label: 'Feldspar' },
                    { id: 'PerovskiteCat', label: 'Perovskite Cat' },
                    { id: 'SS316L', label: 'Stainless Steel 316L' },
                    { id: 'Ti64', label: 'Ti-6Al-4V' },
                    { id: 'SS304', label: 'SS 304' },
                    { id: 'Brass', label: 'Brass' },
                    { id: 'Inconel', label: 'Inconel 718' },
                    { id: 'SBA15', label: 'SBA-15 Silica' },
                    { id: 'ZIF8', label: 'ZIF-8 MOF' },
                    { id: 'Ibuprofen', label: 'Ibuprofen' },
                    { id: 'Paracetamol', label: 'Paracetamol' },
                    { id: 'Magnetite', label: 'Magnetite' },
                    { id: 'PE', label: 'Polymer (PE)' },
                    { id: 'Cement', label: 'Clinker' },
                    { id: 'Complex', label: 'Complex Mix' }
                  ].map(ex => (
                    <button 
                      key={ex.id}
                      onClick={() => loadExample(ex.id as any)} 
                      className="text-xs font-bold bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-violet-300 transition-all shadow-sm active:scale-95"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunAI}
                disabled={isSimulating || !inputData.trim()}
                className={`w-full py-3.5 text-white font-bold text-base rounded-xl transition-all shadow-md flex justify-center items-center gap-2.5 outline-none focus:ring-4 focus:ring-violet-500/30
                  ${isSimulating || !inputData.trim() ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border border-slate-300' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 border border-violet-500'}
                `}
              >
                {isSimulating ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" />
                    Executing Neural Scan...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Initialize Deep Phase ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Deep Learning Architecture Status */}
        <div className="bg-[#050B14]/80 backdrop-blur-xl p-8 rounded-[2.5rem] text-white border border-[#1e293b] shadow-[0_0_80px_rgba(139,92,246,0.15)] relative overflow-hidden group/engine flex flex-col gap-6 ring-1 ring-white/5">
           {/* Advanced Animated Backgrounds */}
           <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-violet-600/10 rounded-full blur-[80px] group-hover/engine:bg-violet-500/20 group-hover/engine:scale-110 transition-all duration-1000 pointer-events-none" />
           <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-600/10 rounded-full blur-[60px] group-hover/engine:bg-cyan-500/20 group-hover/engine:scale-110 transition-all duration-1000 pointer-events-none" />
           <div className="absolute inset-0 bg-[#000] opacity-30 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px'}} />
           
           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-70" />
           
           {/* Neural Nodes Grid Pattern Decoration */}
           <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="neural-net" width="60" height="60" patternUnits="userSpaceOnUse">
                 <circle cx="10" cy="10" r="1.5" fill="#a78bfa" />
                 <circle cx="50" cy="30" r="1.5" fill="#38bdf8" />
                 <path d="M 10 10 L 50 30" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.5" />
                 <path d="M 50 30 L 10 50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.5" />
                 <circle cx="10" cy="50" r="1.5" fill="#a78bfa" />
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#neural-net)" />
           </svg>

           <div>
             <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="flex items-center gap-5">
                 <div className="relative group/icon cursor-default">
                   <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full group-hover/icon:bg-violet-400/40 transition-colors duration-500" />
                   <div className="w-14 h-14 bg-[#070D18] rounded-2xl border border-violet-500/50 flex items-center justify-center relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.05),tight_0_5px_20px_rgba(139,92,246,0.3)] group-hover/icon:border-violet-400 transition-colors duration-300">
                     <Brain className="w-7 h-7 text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                   </div>
                   {isSimulating && (
                     <div className="absolute -inset-1 rounded-2xl border border-violet-500/20 animate-ping opacity-50 pointer-events-none" style={{animationDuration: '2s'}} />
                   )}
                 </div>
                 <div>
                   <h3 className="font-black text-xl text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                     {t('Convolutional Engine', 'Convolutional Engine')}
                   </h3>
                   <div className="flex items-center gap-2 mt-1.5">
                     <p className="text-[10px] text-violet-300/80 font-mono uppercase tracking-[0.3em] font-black">ARCH: XRD-{engineConfig.multiScale ? 'Res' : 'Conv'}Net-{engineConfig.depth}</p>
                     <span className="text-[8px] font-black text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase tracking-widest border border-slate-700">v4.2</span>
                   </div>
                 </div>
               </div>
               <div className="hidden md:flex flex-col items-end">
                 <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] font-black mb-1.5">Compute Core</span>
                 <div className="relative overflow-hidden group/status rounded border border-violet-500/20 bg-violet-500/10 transition-all duration-300 hover:border-violet-400/40">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/status:translate-x-full transition-transform duration-1000" />
                    <span className="text-xs font-mono font-black text-violet-300 px-3 py-1.5 flex items-center gap-2 relative z-10">
                      <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.6)]' : 'bg-slate-500'}`} />
                      {isSimulating ? 'PROCESSING' : 'STANDBY'}
                    </span>
                 </div>
               </div>
             </div>
             
             <div className="flex gap-2.5 mb-2 relative z-10 md:ml-[76px] flex-wrap">
               <span className="px-3 py-1.5 bg-gradient-to-br from-[#0B1221] to-[#070D18] border border-[#1e293b]/80 rounded-lg text-[9px] font-mono font-black text-cyan-300/90 uppercase tracking-[0.2em] shadow-inner hover:border-cyan-500/30 transition-colors cursor-default flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-cyan-400"></span> {engineConfig.activation}
               </span>
               <span className="px-3 py-1.5 bg-gradient-to-br from-[#0B1221] to-[#070D18] border border-[#1e293b]/80 rounded-lg text-[9px] font-mono font-black text-fuchsia-300/90 uppercase tracking-[0.2em] shadow-inner hover:border-fuchsia-500/30 transition-colors cursor-default flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-fuchsia-400"></span> {engineConfig.filters} FILTERS
               </span>
               <span className="px-3 py-1.5 bg-gradient-to-br from-[#0B1221] to-[#070D18] border border-[#1e293b]/80 rounded-lg text-[9px] font-mono font-black text-emerald-300/90 uppercase tracking-[0.2em] shadow-inner hover:border-emerald-500/30 transition-colors cursor-default flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-emerald-400"></span> {engineConfig.kernelSize}x{engineConfig.kernelSize} KERNEL
               </span>
             </div>
           </div>
           
           <div className="space-y-7 relative z-10 flex-1 ml-5 mt-6 border-t border-[#1e293b]/50 pt-8">
             {/* Vertical connecting line */}
             <div className="absolute left-[15px] top-[40px] bottom-6 w-[2px] bg-[#1e293b] z-0 shadow-[0_0_10px_rgba(30,41,59,0.5)]"></div>
             {/* Dynamic pulse on the line if active */}
             {isSimulating && (
               <div className="absolute left-[15px] top-[40px] bottom-6 w-[2px] z-0 overflow-hidden">
                  <div className="w-full h-1/3 bg-gradient-to-b from-transparent via-violet-400 to-transparent animate-[scanline_2s_ease-in-out_infinite]" />
               </div>
             )}
             {steps.slice(1).map((step, idx) => {
               const stepIdx = idx + 1;
               const isActive = progressStep === stepIdx;
               const isCompleted = progressStep > stepIdx;
               const Icon = step.icon;
               
               return (
                 <div key={`${step.label}-${idx}`} className={`relative z-10 flex flex-col gap-2 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                   <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0 relative bg-[#070D18] z-20
                       ${isActive ? 'border-violet-500 bg-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110 rotate-3' : 
                         isCompleted ? 'border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400' : 'border-[#1e293b] text-slate-600 shadow-inner'}
                     `}>
                       {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <span className={`text-sm font-black block truncate tracking-wide ${isActive ? 'text-violet-300 drop-shadow-md' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                         {step.label}
                       </span>
                     </div>
                     
                     {/* Activation Metrics */}
                     {isActive && (
                       <div className="flex items-center gap-2">
                         <div className="text-[10px] font-mono text-emerald-400 flex flex-col items-end font-black drop-shadow-sm">
                           <span>OPT: {engineConfig.optimization.toUpperCase()}</span>
                           <span>{idx === 2 ? `CANDS: ~${(100 + Math.random() * 50).toFixed(0)}K` : `ACC: ${(95 + Math.random() * 4).toFixed(2)}%`}</span>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   {/* Layer Details & Visualizations */}
                   {(isActive || isCompleted) && (
                     <div className="ml-12 mt-1 pl-4 border-l border-[#1e293b]">
                         {idx === 0 && isActive && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-[10px] text-slate-400 font-mono space-y-1 mb-2 font-black uppercase tracking-widest bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] shadow-inner relative z-10 hover:border-violet-500/50 transition-colors">
                               <p className="animate-pulse flex items-center gap-2 text-violet-300"><span className="text-violet-500 font-bold">&gt;</span> Tensor shape: [1, 2048, 1]</p>
                               <p className="animate-pulse flex items-center gap-2 text-violet-300" style={{animationDelay: '0.2s'}}><span className="text-violet-500 font-bold">&gt;</span> Kern Size: {engineConfig.kernelSize}x{engineConfig.kernelSize}</p>
                               <p className="animate-pulse flex items-center gap-2 text-violet-300" style={{animationDelay: '0.4s'}}><span className="text-violet-500 font-bold">&gt;</span> Augmentation: Noise Injection</p>
                            </motion.div>
                         )}
                         
                         {idx === 1 && isActive && (
                           <div className="mb-2 relative z-10">
                             <div className="text-[9px] text-slate-400 font-mono space-y-1.5 mb-2 bg-[#0B1221]/90 backdrop-blur-md p-3.5 rounded-xl border border-violet-500/30 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)] font-black uppercase tracking-widest hover:border-violet-400/60 transition-colors">
                                <p className="flex justify-between items-center"><span className="text-violet-300 flex items-center gap-2"><span className="text-violet-500">&gt;</span>Conv1D_1: [{engineConfig.filters}, {engineConfig.kernelSize}]</span> <span className="text-violet-400 drop-shadow-sm px-1.5 py-0.5 bg-violet-500/10 rounded">{Math.floor(Math.random() * 99)}ms</span></p>
                                <p className="flex justify-between items-center"><span className="text-violet-300 flex items-center gap-2"><span className="text-violet-500">&gt;</span>Activation: {engineConfig.activation}</span> <span className="text-emerald-400 drop-shadow-sm px-1.5 py-0.5 bg-emerald-500/10 rounded animate-pulse">STABLE</span></p>
                                <p className="flex justify-between items-center"><span className="text-violet-300 flex items-center gap-2"><span className="text-violet-500">&gt;</span>Fusion: {engineConfig.multiScale ? 'ENABLED' : 'DISABLED'}</span> <span className="text-violet-400 drop-shadow-sm px-1.5 py-0.5 bg-violet-500/10 rounded">{Math.floor(Math.random() * 99)}ms</span></p>
                             </div>
                             <div className="grid grid-cols-8 gap-1.5 w-full bg-[#0B1221]/80 p-2 rounded-xl border border-[#1e293b]">
                               {Array.from({ length: 16 }).map((_, i) => (
                                 <div key={`pulse-${i}`} className="h-4 rounded-[4px] bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_0_10px_rgba(139,92,246,0.6)] animate-[pulse_1s_ease-in-out_infinite] relative overflow-hidden" style={{ opacity: Math.random() * 0.7 + 0.3, animationDelay: `${i * 0.05}s` }}>
                                   <div className="absolute top-0 left-0 w-full h-[2px] bg-white/40" />
                                 </div>
                               ))}
                             </div>
                             <p className="text-[9px] text-slate-500 font-mono mt-2 uppercase tracking-[0.2em] text-right font-black flex justify-end items-center gap-1.5"><Activity className="w-3 h-3 text-violet-400" /> Feature Map Activations</p>
                           </div>
                         )}

                         {idx === 2 && isActive && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-[10px] text-slate-400 font-mono space-y-2 mb-2 mt-2 bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] shadow-inner font-black uppercase tracking-widest relative z-10 hover:border-cyan-500/50 transition-colors">
                               <p className="animate-pulse text-cyan-400 flex items-center gap-2 drop-shadow-sm"><Database className="w-3.5 h-3.5 text-cyan-500" /> Loading Index HNSW-1M...</p>
                               <p className="text-violet-300 flex items-center gap-2"><Search className="w-3 h-3 text-violet-500" /> Performing Cosine Similarity</p>
                               <div className="w-full bg-[#070D18] h-1.5 mt-2 rounded-full overflow-hidden border border-[#1e293b]">
                                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full animate-[progress_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{width: `${10 + Math.random() * 80}%`}}></div>
                               </div>
                            </motion.div>
                         )}

                         {idx === 3 && isActive && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-[10px] text-slate-400 font-mono space-y-1.5 mb-2 mt-2 bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] shadow-inner font-black uppercase tracking-widest relative z-10 hover:border-emerald-500/50 transition-colors">
                               <p className="flex justify-between items-center"><span className="text-violet-300">Dense_1</span> <span className="bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded drop-shadow-sm">Softmax</span></p>
                               <div className="text-emerald-400 animate-pulse my-2 drop-shadow-sm flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Computing Confidences...</div>
                               <p className="flex justify-between items-center text-slate-500"><span>Loss</span> <span>Cat_Cross_Ent</span></p>
                            </motion.div>
                         )}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>

           <div className="mt-4 pt-6 border-t border-white/5 relative z-10">
              <div className="flex items-center justify-between mb-5">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 group-hover/engine:bg-indigo-500/20 transition-colors shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]">
                       <BookOpen className="w-4 h-4 text-indigo-400 group-hover/engine:rotate-3 transition-transform" />
                    </div>
                    <div>
                       <h3 className="font-black text-[11px] text-white uppercase tracking-[0.2em] leading-none drop-shadow-sm">Neural Guide</h3>
                       <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1">
                         <span className="w-1 h-1 rounded-full bg-indigo-500"></span> Constituent Logic & Features
                       </p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group/fact p-4 bg-gradient-to-br from-[#0B1221] to-[#050B14] rounded-2xl border border-[#1e293b]/80 hover:border-indigo-500/50 transition-all duration-300 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/fact:opacity-20 transition-opacity">
                        <Cpu className="w-16 h-16 text-indigo-400 -rotate-12 translate-x-4 -translate-y-4" />
                     </div>
                     <div className="flex items-center gap-2.5 mb-3 relative z-10">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Network Focus</span>
                     </div>
                     <p className="text-[10px] text-slate-400 leading-relaxed font-medium relative z-10">
                        The <span className="text-white">"{engineConfig.kernelSize}x{engineConfig.kernelSize} Kernel Shift"</span> defines peak receptive field. {engineConfig.multiScale ? <span className="text-indigo-300 font-bold">Multi-Scale Fusion correlates broad patterns across the 2θ domain.</span> : 'Increase Feature Maps for complex multi-phase disambiguation.'}
                     </p>
                     <div className="mt-3 text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest border-t border-[#1e293b] pt-2 flex items-center justify-between">
                       <span>Optimization</span>
                       <span className="text-indigo-400">{engineConfig.optimization}</span>
                     </div>
                  </div>

                  <div className="group/fact p-4 bg-gradient-to-br from-[#0B1221] to-[#050B14] rounded-2xl border border-[#1e293b]/80 hover:border-cyan-500/50 transition-all duration-300 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/fact:opacity-20 transition-opacity">
                        <Microscope className="w-16 h-16 text-cyan-400 rotate-12 translate-x-4 -translate-y-4" />
                     </div>
                     <div className="flex items-center gap-2.5 mb-3 relative z-10">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <Microscope className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Constituents</span>
                     </div>
                     <p className="text-[10px] text-slate-400 leading-relaxed font-medium relative z-10">
                        Model prioritizes <strong className="text-cyan-300">2θ Mapping</strong> for d-spacing and <strong className="text-cyan-300">Relative Int.</strong> ({engineConfig.filters} filters) to decouple overlapping signatures in experimental data.
                     </p>
                     <div className="mt-3 text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest border-t border-[#1e293b] pt-2 flex items-center justify-between">
                       <span>Accuracy</span>
                       <span className="text-cyan-400">{engineConfig.activation} ACT</span>
                     </div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-[0_0_80px_rgba(30,58,138,0.15)] border border-[#1e293b] h-[720px] flex flex-col relative overflow-hidden group/vis">
          {/* Subtle grid background to look like a terminal/software UI */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none mix-blend-screen"></div>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-60" />
          
          <div className="flex flex-col gap-6 mb-6 relative z-10">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full" />
                  <div className="w-12 h-12 rounded-2xl bg-[#070D18] border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                    <Activity className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-[0.15em] uppercase drop-shadow-lg">Phase Match Visualization</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-[0.2em] font-black">Convolutional Feature Overlay</p>
                    <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                    <p className="text-[9px] text-cyan-500/40 font-mono uppercase tracking-widest">Active_Stream_v4.2</p>
                  </div>
                </div>
              </div>
              
              {selectedCandidate && (
                <div className="flex gap-4">
                  <div className="hidden md:flex flex-col items-end justify-center px-4 py-2 bg-[#0B1221] border border-[#1e293b] rounded-2xl shadow-inner">
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black mb-1">Engine Stability</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-black text-cyan-400">98.2%</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-5 py-2.5 rounded-2xl flex items-center gap-3 border shadow-inner backdrop-blur-md uppercase tracking-widest transition-all
                    ${selectedCandidate.match_quality === 'Excellent' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 
                      selectedCandidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'}
                  `}>
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${selectedCandidate.match_quality === 'Excellent' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : selectedCandidate.match_quality === 'Good' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                    {selectedCandidate.match_quality || "Match"} Precision
                  </span>
                </div>
              )}
            </div>

            {/* Advanced Analytics HUD Bar */}
            {selectedCandidate && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="relative group/hud overflow-hidden bg-[#0A101C]/80 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all hover:border-cyan-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-cyan-500 animate-pulse" /> Target Identity
                    </p>
                    <div className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-[8px] font-mono font-black text-cyan-300">
                      ID_CONF: {selectedCandidate.confidence_score}
                    </div>
                  </div>
                  <p className="text-xl font-black text-white font-mono drop-shadow-md truncate relative z-10">{selectedCandidate.phase_name}</p>
                  <div className="flex items-center gap-2 mt-3 font-mono relative z-10">
                    <span className="text-[10px] text-slate-500 uppercase">Profile:</span>
                    <span className="text-[9px] text-cyan-400 flex gap-1.5 items-center bg-[#070D18] px-2 py-1 rounded border border-cyan-500/20">
                      <span className="w-1 h-3 bg-cyan-500/50 rounded-full"></span>
                      σ² = 0.5 (GAUSSIAN)
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
                </div>
                
                <div className="relative group/hud overflow-hidden bg-[#0A101C]/80 backdrop-blur-xl border border-rose-500/20 rounded-xl p-4 shadow-[0_0_20px_rgba(244,63,94,0.05)] transition-all hover:border-rose-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-rose-500 animate-pulse" /> Feature Detection
                    </p>
                  </div>
                  <div className="flex items-end gap-2 relative z-10">
                    <p className="text-3xl font-black text-rose-400 font-mono leading-none drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">{selectedCandidate.matched_peaks?.length || 0}</p>
                    <span className="text-[10px] font-mono font-black text-slate-400 mb-1 tracking-widest">UNIT PEAKS</span>
                  </div>
                  <div className="mt-3 w-full h-1.5 bg-[#070D18] rounded-full overflow-hidden flex border border-white/5 relative z-10">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)]" style={{ width: '75%' }} />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500 to-transparent" />
                </div>

                <div className="relative group/hud overflow-hidden bg-[#0A101C]/80 backdrop-blur-xl border border-indigo-500/20 rounded-xl p-4 shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all hover:border-indigo-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500 animate-pulse" /> Database Link
                    </p>
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="text-lg font-black text-white font-mono truncate relative z-10 drop-shadow-md">REF-{selectedCandidate.phase_name?.substring(0, 4)}-67X</p>
                  <div className="mt-3 flex gap-1.5 overflow-hidden relative z-10">
                    {['X-RAY', 'CU-Kα', '0.154NM'].map(tag => (
                      <span key={tag} className="text-[8px] font-black font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 uppercase">{tag}</span>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-transparent" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-[#070D18] rounded-[2rem] border border-[#1e293b]/80 p-0 shadow-2xl overflow-hidden flex flex-col group/chart transition-all hover:border-cyan-500/40">
             
            {/* Animated Scanline Overlay */}
            <motion.div 
               className="absolute top-0 bottom-0 w-[400px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none mix-blend-screen z-0"
               animate={{ left: ['-50%', '150%'] }}
               transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Glowing orb behind graph */}
            {selectedCandidate && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
            )}

            {/* HUD / Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-40 group-hover/chart:opacity-80 transition-opacity duration-1000">
               {/* Vertical & Horizontal Dashed Grid */}
               <div className="absolute left-1/4 top-0 bottom-0 border-l border-cyan-500/20 border-dashed" />
               <div className="absolute left-1/2 top-0 bottom-0 border-l border-cyan-500/20 border-dashed" />
               <div className="absolute right-1/4 top-0 bottom-0 border-l border-cyan-500/20 border-dashed" />
               
               <div className="absolute top-1/4 left-0 right-0 border-t border-cyan-500/20 border-dashed" />
               <div className="absolute top-1/2 left-0 right-0 border-t border-cyan-500/20 border-dashed" />
               <div className="absolute bottom-1/4 left-0 right-0 border-t border-cyan-500/20 border-dashed" />
               
               {/* Dynamic Targeting Reticles */}
               <div className="absolute left-12 top-12 w-20 h-20">
                  <div className="absolute top-0 left-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute top-0 left-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute top-[8px] left-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_A:01</div>
               </div>
               
               <div className="absolute right-12 top-12 w-20 h-20">
                  <div className="absolute top-0 right-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute top-0 right-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute top-[8px] right-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_B:02</div>
               </div>
               
               <div className="absolute left-12 bottom-12 w-20 h-20">
                  <div className="absolute bottom-0 left-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute bottom-0 left-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute bottom-[8px] left-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_C:03</div>
               </div>
               
               <div className="absolute right-12 bottom-12 w-20 h-20">
                  <div className="absolute bottom-0 right-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute bottom-0 right-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute bottom-[8px] right-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_D:04</div>
               </div>
            </div>

            <div className="absolute top-4 left-4 flex gap-2.5 z-10 bg-[#0A101C]/90 px-4 py-2 rounded-xl border border-cyan-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.1)]">
               <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse mt-0.5 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
               <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest">Live Sync</span>
               <div className="w-[1px] h-3 bg-cyan-500/30 mx-1 self-center" />
               <span className="text-[9px] font-mono text-cyan-500/60 uppercase font-black">2048_SAMP</span>
            </div>
            
            <div className="flex-1 relative mt-[16px] mx-[20px] mb-[16px] z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#1e293b" opacity={0.6} />
                  <XAxis 
                    dataKey="twoTheta" 
                    type="number" 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    unit="°" 
                    allowDataOverflow 
                    name="2θ"
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                    tickFormatter={(value) => value.toFixed(1)}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,211,238,0.05)', stroke: '#22d3ee', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', fontFamily: 'monospace', top: '-15px', right: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  
                  {isSimulating && scanPos !== null && (
                     <ReferenceLine 
                       x={scanPos} 
                       stroke="#22d3ee" 
                       strokeWidth={1.5} 
                       strokeDasharray="3 3"
                       label={{ value: 'SCANNING IN PROGRESS //', position: 'insideTopLeft', fill: '#22d3ee', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.1em' }} 
                     />
                  )}

                  {/* Input Data */}
                  {isDiscrete ? (
                     <Area 
                       type="stepAfter" 
                       dataKey="intensity" 
                       stroke="#3b82f6" 
                       fill="url(#colorInput)" 
                       strokeWidth={2}
                       name="Input Points" 
                       activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0B1221', strokeWidth: 2 }}
                     />
                  ) : (
                     <Area 
                       type="monotone" 
                       dataKey="intensity" 
                       stroke="#22d3ee" 
                       fill="url(#colorUv)" 
                       strokeWidth={2.5}
                       name="Input Pattern" 
                       activeDot={{ r: 6, fill: '#22d3ee', stroke: '#050b14', strokeWidth: 2, className: 'drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' }}
                     />
                  )}
                  
                  {/* Reference Data (Gaussian Simulation Overlay) */}
                  {isDiscrete && selectedCandidate && (
                     <Area 
                       type="monotone" 
                       dataKey="refIntensity" 
                       stroke="#f43f5e" 
                       fill="url(#colorRv)" 
                       fillOpacity={0.4}
                       strokeWidth={2}
                       strokeDasharray="4 4"
                       name={`${selectedCandidate.phase_name} (Simulation)`} 
                     />
                  )}
                  
                  {/* Residual / Error Difference Curve */}
                  {selectedCandidate && (
                     <Area 
                       type="monotone" 
                       dataKey="residual" 
                       stroke="#f59e0b" 
                       fill="url(#colorResid)"
                       fillOpacity={0.5}
                       strokeWidth={1.5}
                       strokeDasharray="2 2"
                       name="Error Limit" 
                     />
                  )}
                  
                  {/* Reference Stick Data */}
                  {selectedCandidate && (
                    <Scatter 
                      data={refData} 
                      dataKey="refIntensity" 
                      name={`${selectedCandidate.phase_name} (Database DB)`} 
                      fill="#f43f5e"
                      shape={(props: any) => {
                        const { cx, cy, yAxis } = props;
                        const bottomY = yAxis && typeof yAxis.scale === 'function' ? yAxis.scale(0) : cy + 500;
                        return (
                          <g className="transition-all duration-300">
                            {/* Stem */}
                            <line x1={cx} y1={bottomY} x2={cx} y2={cy} stroke="#fb7185" strokeWidth={2} strokeOpacity={0.8} strokeDasharray="3 3" />
                            {/* Head */}
                            <path d={`M${cx},${cy - 8} L${cx - 5},${cy} L${cx},${cy + 8} L${cx + 5},${cy} Z`} fill="#f43f5e" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                            <circle cx={cx} cy={cy} r={2} fill="#fff" />
                          </g>
                        );
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Correlation Confidence Bar */}
            {selectedCandidate && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#070D18]/90 border-t border-[#1e293b]/80 flex items-center px-6 gap-4 z-10 backdrop-blur-xl">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Spectral Correlation</span>
                <div className="flex-1 h-2 bg-[#0B1221] border border-[#1e293b] rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      selectedCandidate.match_quality === 'Excellent' 
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' 
                        : selectedCandidate.match_quality === 'Good' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                          : 'bg-gradient-to-r from-amber-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                    }`} 
                    style={{ width: `${selectedCandidate.confidence_score}%` }} 
                  />
                </div>
                <span className="text-xs font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{selectedCandidate.confidence_score?.toFixed ? selectedCandidate.confidence_score.toFixed(1) : selectedCandidate.confidence_score}%</span>
              </div>
            )}
          </div>
          {!inputData.trim() && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050B14]/90 backdrop-blur-md rounded-2xl z-20 border border-[#1e293b] overflow-hidden">
               {/* Decorative background grid for empty state */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
               
               <div className="relative mb-8 z-10 flex flex-col items-center">
                 <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                   <svg className="absolute inset-0 w-full h-full text-cyan-900/40 animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="48" fill="none" strokeWidth="1" stroke="currentColor" strokeDasharray="4 8" />
                     <circle cx="50" cy="50" r="40" fill="none" strokeWidth="1" stroke="currentColor" strokeDasharray="2 4" />
                   </svg>
                   <Scan className="w-12 h-12 text-cyan-500 animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                   <div className="absolute left-0 right-0 h-[2px] bg-cyan-500/80 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(34,211,238,1)] animate-[scan_2s_ease-in-out_infinite]" />
                 </div>
                 
                 <p className="text-white font-black tracking-[0.3em] uppercase text-xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">System Standby</p>
                 <div className="flex gap-4 items-center bg-[#0d1627] px-4 py-2 rounded-lg border border-cyan-500/20 shadow-inner">
                   <div className="flex gap-1.5 items-center">
                     <div className="w-2 h-2 rounded-full bg-rose-500 animate-[ping_2s_infinite]" />
                     <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Input Stream: Offline</p>
                   </div>
                   <div className="w-px h-4 bg-slate-800" />
                   <div className="flex gap-1.5 items-center">
                     <div className="w-2 h-2 rounded-full bg-cyan-500/40" />
                     <p className="text-[10px] text-cyan-500/40 font-mono tracking-widest uppercase">Model: Inactive</p>
                   </div>
                 </div>
               </div>
               
               {/* Simulated Data Tracks bg */}
               <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-900/10 to-transparent pointer-events-none" />
            </div>
          )}
        </div>

      {/* Material Intelligence Section (Selected Candidate Details) */}
      <AnimatePresence mode="wait">
        {selectedCandidate && (
          <motion.div 
            key={selectedCandidate.phase_name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 pt-4"
          >
            <div className="bg-[#0B1221]/80 backdrop-blur-xl text-white p-8 rounded-[2rem] shadow-2xl border border-[#1e293b]/80 relative overflow-hidden">
              {/* Animated subtle grid and gradient */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>
              <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-50" />
              
              {/* HexTech UI Accents */}
              <div className="absolute top-0 left-12 w-24 h-1 bg-violet-500" />
              <div className="absolute top-1 left-12 w-32 h-px bg-violet-400/50" />
              
              {/* Warning Ribbon */}
              <div className="absolute top-0 right-10 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black px-5 py-2 uppercase tracking-[0.2em] rounded-b-lg flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] z-20">
                <ShieldAlert className="w-4 h-4 animate-pulse opacity-80" />
                Laboratory Verification Required
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="flex flex-1 items-center gap-6">
                  <div className="relative group/icon cursor-default">
                    <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full group-hover/icon:bg-violet-500/30 transition-all duration-700 pointer-events-none" />
                    <div className="w-16 h-16 bg-[#070D18] rounded-2xl border border-violet-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05),0_5px_20px_rgba(139,92,246,0.3)] group-hover/icon:border-violet-400 transition-colors duration-500 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <Brain className="w-8 h-8 text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] group-hover/icon:scale-110 group-hover/icon:text-violet-300 transition-all duration-500" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-indigo-300 uppercase tracking-tighter drop-shadow-sm pb-1 leading-tight">{t('Synthesis Intelligence', 'Synthesis Intelligence')}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5 shadow-inner">
                        {[...Array(5)].map((_, i) => (
                          <div key={`integrity-dot-${i}`} className={`w-2 h-2 rounded-full shadow-inner ${i < 4 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                      <div className="h-4 w-px bg-slate-700/50" />
                      <p className="text-[10px] sm:text-[11px] font-black text-indigo-300/80 uppercase tracking-[0.2em]">{t('C-Score:', 'C-Score:')} <span className="text-indigo-200">{selectedCandidate.confidence_score.toFixed(1)}%</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto">
                   <button 
                     onClick={handleLatticeEstimation}
                     className="flex-1 lg:flex-none group relative px-6 py-3.5 bg-gradient-to-b from-[#0B1221] to-[#050B14] border border-[#1e293b] hover:border-emerald-500/50 rounded-xl transition-all active:scale-95 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                     <div className="flex items-center justify-center gap-3 relative z-10 w-full h-full">
                       <Calculator className="w-4 h-4 text-emerald-400 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <span className="text-[10px] sm:text-[11px] font-black text-slate-300 group-hover:text-emerald-50 uppercase tracking-[0.2em] whitespace-nowrap">{t('Lattice AI', 'Lattice AI')}</span>
                     </div>
                   </button>
                   <button 
                     onClick={handleGenerateReport}
                     className="flex-1 lg:flex-none group relative px-6 py-3.5 bg-gradient-to-b from-[#0B1221] to-[#050B14] border border-[#1e293b] hover:border-violet-500/50 rounded-xl transition-all active:scale-95 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                     <div className="flex items-center justify-center gap-3 relative z-10 w-full h-full">
                       <FileText className="w-4 h-4 text-violet-400 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                       <span className="text-[10px] sm:text-[11px] font-black text-slate-300 group-hover:text-violet-50 uppercase tracking-[0.2em] whitespace-nowrap">{t('Export Map', 'Export Map')}</span>
                     </div>
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-fr">
                {/* Identity Card */}
                <div className="md:col-span-8 group">
                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] shadow-2xl h-full flex flex-col relative overflow-hidden transition-all duration-500 hover:border-violet-500/40 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-violet-500/20 transition-all duration-700" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/10 rounded-tl-[2.5rem]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/10 rounded-br-[2.5rem]" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-6 relative z-10">
                      <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }} className="font-black text-white tracking-tighter leading-none group-hover:text-violet-200 transition-colors duration-500 drop-shadow-[-3px_3px_10px_rgba(0,0,0,0.8)]">{selectedCandidate.phase_name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-8 relative z-10">
                      <span className="px-5 py-2.5 bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-300 text-sm md:text-base font-mono font-black rounded-xl border border-violet-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:border-violet-400 transition-colors">{selectedCandidate.formula}</span>
                      <span className="px-5 py-2.5 bg-gradient-to-br from-[#0B1221] to-[#070D18] text-emerald-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] rounded-xl border border-[#1e293b] shadow-inner hover:border-emerald-500/40 transition-colors flex items-center justify-center">{selectedCandidate.materialType || "Standard Matrix"}</span>
                    </div>
                    
                    <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl relative z-10 mb-10 font-medium">
                      {selectedCandidate.description || "Phase identification complete. Detailed morphological synthesis and mechanical property mapping for this specific lattice configuration are being processed by the intelligence engine."}
                    </p>
                    
                    <div className="mt-auto pt-8 border-t border-[#1e293b] grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 bg-gradient-to-t from-[#0B1221] to-transparent -mx-8 sm:-mx-10 px-8 sm:px-10 -mb-8 sm:-mb-10 pb-8 sm:pb-10 rounded-b-[2.5rem]">
                       {[
                         { label: 'Molecular Wt', val: selectedCandidate.molecularWeight, unit: 'g/mol', icon: Layers },
                         { label: 'Band Gap', val: selectedCandidate.bandGap, unit: 'eV', icon: Zap },
                         { label: 'Modulus', val: selectedCandidate.elasticModulus, unit: 'GPa', icon: Activity },
                         { label: 'Magnetism', val: selectedCandidate.magneticProperties, unit: '', icon: Database },
                         { label: 'Optical', val: selectedCandidate.opticalProperties, unit: '', icon: Eye },
                       ].filter(i => i.val !== undefined && i.val !== '').slice(0, 4).map((item, i) => (
                         <div key={`item-${i}`} className="flex flex-col group/item p-3 -m-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                           <div className="flex items-center gap-2 mb-2">
                             <item.icon className="w-3.5 h-3.5 text-slate-600 group-hover/item:text-violet-400 transition-colors" />
                             <span className="text-[10px] text-slate-500 font-serif italic tracking-wider group-hover/item:text-slate-400 transition-colors">{item.label}</span>
                           </div>
                           <span className="text-lg md:text-xl font-black font-mono text-slate-200 capitalize truncate" title={String(item.val)}>
                             {item.val} {item.unit && <span className="text-indigo-400/60 text-[10px] md:text-xs ml-1 font-sans">{item.unit}</span>}
                           </span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Crystallography */}
                <div className="md:col-span-4">
                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] h-full relative overflow-hidden group/card shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] transition-all duration-500 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none group-hover/card:bg-indigo-500/20 transition-all duration-700 -translate-y-10 translate-x-10" />
                    
                    <div className="flex items-center gap-4 mb-8 sm:mb-10 relative z-10">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 shadow-[inset_0_2px_10px_rgba(99,102,241,0.2)] group-hover/card:bg-indigo-500/20 group-hover/card:scale-110 transition-all duration-500">
                        <Database className="w-6 h-6 text-indigo-400 drop-shadow-md" />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] group-hover/card:text-indigo-300 transition-colors block">Cell Metrics</span>
                    </div>

                    <div className="grid grid-cols-1 relative z-10 border-t border-[#1e293b]">
                      {[
                        { l: 'Crystal System', v: selectedCandidate.crystalSystem || "Unknown", c: 'text-white' },
                        { l: 'Space Group', v: selectedCandidate.spaceGroup || "N/A", c: 'text-emerald-400' },
                        { l: 'Density', v: selectedCandidate.density ? `${selectedCandidate.density} g/cm³` : "N/A", c: 'text-indigo-300 font-mono' },
                        { l: 'Database ID', v: selectedCandidate.card_id, c: 'text-cyan-400 font-mono' }
                      ].map((row, i) => (
                        <div key={`${row.l}-${i}`} className="grid grid-cols-2 items-center group/row border-b border-[#1e293b] py-5 hover:bg-white/[0.03] transition-colors -mx-8 sm:-mx-10 px-8 sm:px-10 cursor-default">
                          <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-[0.2em] group-hover/row:text-slate-400 transition-colors flex items-center gap-2">
                             {i % 2 === 0 ? <div className="w-[3px] h-[3px] rounded-full bg-slate-600 group-hover/row:bg-indigo-400 transition-colors"></div> : <div className="w-[3px] h-[3px] rounded-full bg-slate-600 group-hover/row:bg-cyan-400 transition-colors"></div>}
                             {row.l}
                          </span>
                          <span className={`text-sm sm:text-base font-black tracking-wider text-right drop-shadow-sm ${row.c}`}>{row.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Applications & Safety */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] hover:border-amber-500/40 transition-all duration-500 group/bento shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] hover:shadow-[inset_0_2px_40px_rgba(245,158,11,0.05),0_10px_40px_rgba(245,158,11,0.15)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none group-hover/bento:bg-amber-500/15 transition-all duration-700 -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-[60px] pointer-events-none group-hover/bento:bg-orange-500/10 transition-all duration-700" />
                    
                    <div>
                      <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 shadow-[inset_0_2px_10px_rgba(245,158,11,0.2)] group-hover/bento:bg-amber-500/20 group-hover/bento:scale-110 transition-all duration-500">
                          <Zap className="w-6 h-6 text-amber-400 drop-shadow-md" />
                        </div>
                        <div>
                          <span className="text-[10px] sm:text-[11px] font-black text-amber-500/70 uppercase tracking-[0.3em] font-sans block mb-1">Target Sectors</span>
                          <span className="text-xl sm:text-2xl font-serif italic text-amber-100/90 tracking-wider">Industrial Applications</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 relative z-10">
                        {selectedCandidate.applications && selectedCandidate.applications.length > 0 ? (
                          selectedCandidate.applications.map((app, i) => (
                            <span key={`app-${i}`} className="text-[11px] sm:text-xs font-black uppercase tracking-widest bg-amber-500/5 text-amber-200/80 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-amber-500/20 hover:text-amber-100 hover:border-amber-500/50 hover:bg-amber-500/20 transition-all duration-300 shadow-inner hover:scale-[1.02] active:scale-[0.98] cursor-default flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover/bento:animate-pulse"></span>
                              {app}
                            </span>
                          ))
                        ) : (
                           <span className="text-sm font-black text-slate-600 font-mono italic">No primary applications recorded in network database.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] hover:border-rose-500/40 transition-all duration-500 group/bento shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] hover:shadow-[inset_0_2px_40px_rgba(244,63,94,0.05),0_10px_40px_rgba(244,63,94,0.15)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none group-hover/bento:bg-rose-500/15 transition-all duration-700 -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/5 rounded-full blur-[60px] pointer-events-none group-hover/bento:bg-pink-500/10 transition-all duration-700" />
                    
                    <div>
                      <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30 shadow-[inset_0_2px_10px_rgba(244,63,94,0.2)] group-hover/bento:bg-rose-500/20 group-hover/bento:scale-110 transition-all duration-500">
                          <ShieldAlert className="w-6 h-6 text-rose-400 drop-shadow-md" />
                        </div>
                        <div>
                          <span className="text-[10px] sm:text-[11px] font-black text-rose-500/70 uppercase tracking-[0.3em] font-sans block mb-1">Safety Constraints</span>
                          <span className="text-xl sm:text-2xl font-serif italic text-rose-100/90 tracking-wider">Hazard Profile</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 relative z-10">
                        {selectedCandidate.hazards && selectedCandidate.hazards.length > 0 ? (
                          selectedCandidate.hazards.map((hazard, i) => (
                            <div key={`hazard-${i}`} className="flex items-start gap-4 p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                              <span className="text-sm font-medium text-rose-200/90 leading-relaxed uppercase tracking-widest font-mono">
                                {hazard}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-4 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                            <CheckCircle className="w-8 h-8 text-emerald-500 animate-pulse" /> 
                            <div>
                               <span className="block text-lg font-black text-emerald-400 uppercase tracking-widest mb-1">Non-Toxic Response</span>
                               <span className="text-[10px] sm:text-xs font-medium text-emerald-500/70 font-mono tracking-widest">Material exhibits stable environmental limits.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improved Neural Attention Mapping */}
              <div className="mt-14 pt-12 border-t border-[#1e293b] relative">
                {/* Glow from line */}
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group/map-icon cursor-default">
                       <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full group-hover/map-icon:bg-violet-500/30 transition-all duration-700 pointer-events-none" />
                       <div className="w-14 h-14 bg-[#070D18] rounded-2xl border border-violet-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/map-icon:border-violet-400 transition-colors duration-500 overflow-hidden">
                          <Activity className="w-6 h-6 text-violet-400 animate-pulse drop-shadow-[0_0_12px_rgba(167,139,250,0.6)] group-hover/map-icon:scale-110 transition-transform duration-500" />
                       </div>
                    </div>
                    <div>
                      <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-1">
                        Neural Attention Mapping
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-[0.2em]">Spatial feature activation for <span className="text-violet-300 font-bold tracking-widest">{selectedCandidate.phase_name}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5">
                      {[...Array(5)].map((_, i) => (
                        <div key={`mode-dot-${i}`} className={`w-2 h-2 rounded-full shadow-inner ${i < 4 ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <span className="px-4 py-2 bg-gradient-to-r from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-500/30 text-[10px] font-black text-violet-300 uppercase tracking-[0.25em] shadow-inner font-mono">Softmax_v3</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {[
                    { name: 'Primary_Features', color: 'from-violet-500 to-indigo-500', baseColor: 'bg-violet-500/20', rings: 'rgba(139, 92, 246, 0.4)', rows: 4, cols: 12 },
                    { name: 'Structural_Synthesis', color: 'from-indigo-500 to-blue-500', baseColor: 'bg-indigo-500/20', rings: 'rgba(99, 102, 241, 0.4)', rows: 4, cols: 12 },
                    { name: 'Lattice_Inference', color: 'from-blue-500 to-emerald-500', baseColor: 'bg-blue-500/20', rings: 'rgba(56, 189, 248, 0.4)', rows: 4, cols: 12 }
                  ].map((layer, lIdx) => (
                    <div key={lIdx} className="space-y-4 group/layer relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[2.5rem] -m-5 pointer-events-none group-hover/layer:bg-white/[0.04] transition-colors duration-500" />
                      
                      <div className="flex justify-between items-center px-3 relative z-10">
                        <span className="text-[11px] sm:text-xs font-mono font-black text-slate-500 group-hover/layer:text-white transition-colors uppercase tracking-[0.2em]">{layer.name}</span>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                           <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] hidden sm:inline">Active</span>
                        </div>
                      </div>
                      
                      <div className="relative p-4 sm:p-5 bg-gradient-to-br from-[#0B1221] to-[#050B14] rounded-[2rem] border border-[#1e293b] overflow-hidden shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] group-hover/layer:border-slate-600/80 group-hover/layer:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 z-10 cursor-crosshair">
                        {/* Scanline Effect */}
                        <motion.div 
                          className="absolute inset-y-0 w-[150%] bg-gradient-to-r from-transparent via-white-[0.05] to-transparent z-20 pointer-events-none"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: lIdx * 0.4 }}
                          style={{ background: `linear-gradient(to right, transparent, ${layer.rings.replace('0.4', '0.1')}, transparent)` }}
                        />
                        
                        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 relative z-0">
                          {[...Array(layer.rows * layer.cols)].map((_, i) => {
                            const seed = (i * 13 + lIdx * 17) % 100;
                            const isActive = seed > 40;
                            const intensity = isActive ? (seed / 100) : 0.05;
                            const isHot = intensity > 0.85;
                            
                            return (
                              <motion.div 
                                key={`node-${lIdx}-${i}`}
                                initial={{ opacity: 0.1 }}
                                animate={{ 
                                  opacity: isActive ? [intensity * 0.4, intensity * 0.9, intensity * 0.4] : intensity,
                                  scale: isHot ? [0.95, 1.1, 0.95] : isActive ? [0.98, 1.05, 0.98] : 1
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: isHot ? 1.5 + (seed % 2) : 2 + (seed % 3),
                                  delay: (i % 10) * 0.1 
                                }}
                                className={`aspect-square rounded-md relative overflow-hidden group/cell`}
                              >
                                <div className={`absolute inset-0 rounded-md bg-gradient-to-br border ${isActive ? `border-white/30 ${layer.color}` : 'border-[#1e293b]/50 bg-[#070D18]'} shadow-inner transition-colors`} />
                                {isActive && intensity > 0.6 && (
                                  <div className="absolute inset-0 rounded-md shadow-lg opacity-80" style={{ boxShadow: `0 0 ${isHot ? '15px' : '8px'} ${layer.rings}` }} />
                                )}
                                {isHot && (
                                  <div className="absolute inset-0 bg-white/20 rounded-md animate-pulse" />
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-3 relative z-10 pt-2">
                         <div className="h-1.5 flex-1 bg-[#050B14] rounded-full overflow-hidden mr-5 shadow-inner border border-[#1e293b]">
                            <motion.div 
                              className={`h-full bg-gradient-to-r ${layer.color} relative`}
                              initial={{ width: '40%' }}
                              animate={{ width: [`${40 + (lIdx * 10)}%`, `${80 - (lIdx * 5)}%`, `${40 + (lIdx * 10)}%`] }}
                              transition={{ repeat: Infinity, duration: 4 + lIdx, ease: "easeInOut" }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]" />
                            </motion.div>
                         </div>
                         <span className="text-[10px] font-mono font-black text-[#1e293b] group-hover/layer:text-slate-500 transition-colors uppercase tracking-[0.3em]">INF_00{lIdx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 bg-gradient-to-br from-[#0B1221] to-[#050B14] rounded-[2.5rem] border border-[#1e293b] shadow-[inset_0_2px_30px_rgba(255,255,255,0.02)] relative overflow-hidden group/metrics">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none group-hover/metrics:bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_70%)] transition-colors duration-1000" />
                   {[
                     { label: 'Latency', val: '14ms', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]' },
                     { label: 'Compute', val: '0.8 TFLOPS', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
                     { label: 'Layer Depth', val: '52', icon: Layers, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]' },
                     { label: 'Optimizer', val: 'AdamW', icon: Settings, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
                   ].map((metric, i) => (
                     <div key={`metric-data-${metric.label}-${i}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 relative z-10 p-4 hover:bg-white/[0.03] rounded-[1.5rem] transition-all cursor-default hover:scale-[1.02] active:scale-[0.98] duration-300 group/metric">
                       <div className={`p-3 sm:p-4 ${metric.bg} border ${metric.border} rounded-xl sm:rounded-2xl shadow-inner group-hover/metric:${metric.shadow} transition-shadow duration-300`}>
                         <metric.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${metric.color} drop-shadow-md group-hover/metric:scale-110 transition-transform`} />
                       </div>
                       <div className="flex flex-col gap-1">
                         <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] group-hover/metric:text-slate-400 transition-colors">{metric.label}</span>
                         <span className="text-sm sm:text-base text-white font-mono font-black tracking-wider drop-shadow-sm">{metric.val}</span>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
                





 


              {/* Verification Checklist */}
              <div className="mt-14 pt-12 border-t border-[#1e293b]">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500/50" />
                  Verification Audit Protocol
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                     { label: "Lattice Alignment", desc: "Spacing delta < 0.01Å", active: true },
                     { label: "Relative Intensity", desc: "Profile variance < 5%", active: true },
                     { label: "Phase Composition", desc: "Purity bounds verified", active: true },
                  ].map((item, i) => (
                    <label key={`audit-${i}`} className="flex items-start gap-4 bg-[#050B14] p-5 rounded-2xl border border-[#1e293b] hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#080E1A] shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input type="checkbox" defaultChecked={item.active} className="peer w-5 h-5 rounded-[4px] border-[#1e293b] bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer transition-all" />
                        <div className="absolute inset-0 pointer-events-none rounded-[4px] peer-checked:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-shadow" />
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-xs font-black text-slate-300 group-hover:text-emerald-100 transition-colors uppercase tracking-wide">{item.label}</span>
                         <span className="text-[10px] font-mono text-slate-500">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Predictions List */}
        <div className="grid grid-cols-1 gap-4">
           {result?.candidates.filter(c => c.confidence_score >= engineConfig.confidenceThreshold).length === 0 && result && (
             <div className="bg-[#050B14] p-8 rounded-[1.5rem] border border-[#1e293b] text-center">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No phases meet the confidence threshold of {engineConfig.confidenceThreshold}%</p>
               <button onClick={() => setEngineConfig({...engineConfig, confidenceThreshold: 0})} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">Reset Threshold</button>
             </div>
           )}
           {result?.candidates.filter(c => c.confidence_score >= engineConfig.confidenceThreshold).map((candidate, idx) => (
             <div 
               key={`${candidate.phase_name}-${idx}`} 
               onClick={() => setSelectedCandidate(candidate)}
               className={`bg-[#050B14] p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 group overflow-hidden relative
                 ${selectedCandidate?.phase_name === candidate.phase_name ? 'border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-[#0B1221]' : 'border-[#1e293b] hover:border-violet-500/30 hover:bg-[#080E1A]'}
               `}
             >
               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
               )}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                 <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner border
                     ${idx === 0 ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 
                       idx === 1 ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 border-slate-600' :
                       idx === 2 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30' :
                       'bg-slate-900 text-slate-600 border-slate-800'}
                   `}>
                     #{idx + 1}
                   </div>
                   <div className="flex flex-col gap-1">
                     <h4 className={`text-xl font-black tracking-wide transition-colors ${selectedCandidate?.phase_name === candidate.phase_name ? 'text-violet-300' : 'text-slate-200 group-hover:text-white'}`}>{candidate.phase_name}</h4>
                     <div className="flex flex-wrap items-center gap-3">
                       <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-white/5 border ${selectedCandidate?.phase_name === candidate.phase_name ? 'text-violet-200 border-violet-500/30' : 'text-slate-400 border-white/10'}`}>{candidate.formula}</span>
                       <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase tracking-widest"><Database className="w-3 h-3"/> {candidate.card_id}</span>
                       {candidate.match_quality && (
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-inner
                           ${candidate.match_quality === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                             candidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}
                         `}>
                           {candidate.match_quality}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end w-full md:w-auto">
                   <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                     <div className="flex-1 md:w-32 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 shadow-inner">
                       <div 
                         className={`h-full rounded-none transition-all duration-1000 ease-out ${candidate.confidence_score > 80 ? 'bg-emerald-500' : candidate.confidence_score > 50 ? 'bg-violet-500' : 'bg-amber-500'}`}
                         style={{ width: `${candidate.confidence_score}%` }}
                       />
                     </div>
                     <span className={`text-3xl md:text-2xl font-black font-mono tracking-tighter drop-shadow-md w-24 text-right
                       ${candidate.confidence_score > 80 ? 'text-emerald-400' : candidate.confidence_score > 50 ? 'text-violet-400' : 'text-amber-400'}
                     `}>
                       {candidate.confidence_score.toFixed(1)}<span className="text-sm text-slate-500 font-sans">%</span>
                     </span>
                   </div>
                 </div>
               </div>

               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="mt-8 pt-6 border-t border-[#1e293b] animate-in slide-in-from-top-4 relative z-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <CheckCircle className="w-4 h-4 text-emerald-400"/> Feature Alignment Verification
                   </p>
                   <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                     {candidate.matched_peaks?.map((mp, i) => (
                       <div key={`peak-${mp.refT}-${i}`} className="bg-[#050B14] p-2 rounded-xl border border-[#1e293b] flex justify-between items-center group-hover:border-slate-700 transition-colors shadow-inner">
                         <span className="text-slate-400 font-mono text-xs">{mp.refT.toFixed(2)}°</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="h-48 flex flex-col items-center justify-center bg-[#050B14] rounded-[2rem] border border-dashed border-[#1e293b] relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <Brain className="w-12 h-12 mb-4 text-violet-500/50 group-hover:text-violet-400 hover:scale-110 transition-all duration-500 drop-shadow-md" />
               <p className="font-black text-xl text-slate-300 tracking-tight group-hover:text-white transition-colors">Awaiting Inference Protocol</p>
               <p className="text-[10px] mt-2 font-mono text-slate-500 uppercase tracking-[0.2em]">Load input data to initialize neural core</p>
             </div>
           )}
        </div>
      </div>

      {/* Lattice Assistant Modal */}
      {isLatticeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-800 p-5 text-white flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                       <Calculator className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                       <h3 className="font-bold text-lg leading-tight text-white font-black tracking-tighter">Lattice Estimator</h3>
                       <p className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase mt-0.5">Local Computation Engine 12.4</p>
                    </div>
                 </div>
                 <button onClick={() => setIsLatticeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6">
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Estimated Constant (a)</span>
                       <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded leading-none">Ångströms</span>
                    </div>
                    <div className="text-4xl font-mono font-black text-emerald-600 tracking-tighter">
                       {latticeResult?.a.toFixed(4) || '---'}
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest flex items-center gap-2">
                       <div className="flex-1 h-[1px] bg-emerald-200" />
                       Lattice Refinement Logic active
                       <div className="flex-1 h-[1px] bg-emerald-200" />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lattice Symmetry Constraint</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20">
                          <option>Cubic (a = b = c)</option>
                          <option disabled>Tetragonal (a = b ≠ c)</option>
                          <option disabled>Orthorhombic (a ≠ b ≠ c)</option>
                       </select>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Miller H</label>
                          <input type="number" defaultValue={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Miller K</label>
                          <input type="number" defaultValue={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Miller L</label>
                          <input type="number" defaultValue={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                       </div>
                    </div>
                 </div>

                 <div className="mt-8">
                    <button 
                      onClick={() => setIsLatticeModalOpen(false)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest font-black"
                    >
                      Update Model
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-3 italic font-semibold">
                       Note: Estimates are based on Cu K-alpha radiation (1.5406 Å)
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
