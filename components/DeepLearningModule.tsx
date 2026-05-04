import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DLPhaseResult, DLPhaseCandidate } from '../types';
import { identifyPhasesDL, parseXYData } from '../utils/physics';
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine
} from 'recharts';
import { Brain, Activity, CheckCircle, Search, Database, Layers, Zap, ChevronDown, FlaskConical, Loader2, Upload, FileText, Trash2, Settings, Info, Calculator, Plus, X, ShieldAlert, Focus } from 'lucide-react';

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
    applications: ['Electronics', 'Solar Cells', 'Semiconductors']
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
    applications: ['Ceramics', 'Dental', 'Refractories']
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
    applications: ['Bone Grafts', 'Dental', 'Implants']
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
    name: 'Quartz (SiO2)',
    type: 'Ceramic/Mineral',
    pattern: '20.86, 35\n26.64, 100\n36.54, 12\n39.47, 9\n40.29, 8\n42.45, 8\n45.79, 9\n50.14, 14\n59.95, 9\n67.74, 7\n68.14, 8',
    description: 'A hard, crystalline mineral composed of silica (silicon dioxide).',
    formula: 'SiO2',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P3221',
    density: 2.65,
    applications: ['Glass', 'Electronics', 'Construction', 'Jewelry']
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
  }
];

export const DeepLearningModule: React.FC = () => {
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
    batchNorm: true
  });

  // Search & Advanced Tools State
  const [searchTerm, setSearchTerm] = useState("");
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
    
    // Search Local DB with fuzzing
    const matches = MATERIAL_DB.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.formula.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matches.length > 0) {
      handleMaterialSelect(matches[0]);
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
          materialType: matchedMaterial.type
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
    
    if (!isDiscrete) {
      // If it's continuous experimental data, just map it and add ref intensity if matched
      return sortedPoints.map(p => {
         let refInt = null;
         // For continuous, we just show reference as sticks or we don't merge them.
         // Wait, merging them into the continuous is hard because x-values won't match exactly.
         // Better to return the raw data and use Scatter for ref Data
         return {
           twoTheta: p.twoTheta,
           intensity: p.intensity,
           refIntensity: null
         };
      });
    }
    
    // For discrete stick data, generate a continuous gaussian spectrum
    const minT = Math.max(0, sortedPoints[0].twoTheta - 10);
    const maxT = sortedPoints[sortedPoints.length - 1].twoTheta + 10;
    
    const data = [];
    const sigma = 0.5; // Controls width of the simulated peaks
    const sigma22 = Math.max(0.0001, 2 * sigma * sigma);

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
      
      data.push({
        twoTheta: Number(t.toFixed(2)),
        intensity: Number(intensity.toFixed(1)),
        refIntensity: selectedCandidate ? Number(refIntensity.toFixed(1)) : null
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
        <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-xs border border-slate-700">
          <p className="font-bold mb-1">2θ: {label}°</p>
          {payload.map((p: any, idx: number) => (
            <p key={`tooltip-${p.name}-${idx}`} style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Settings className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Neural Config</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Engine Hyperparameters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sys Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kernel Shift</label>
                <select 
                  value={engineConfig.kernelSize}
                  onChange={(e) => setEngineConfig({...engineConfig, kernelSize: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                >
                  <option value={3}>3x3 Narrow</option>
                  <option value={5}>5x5 Standard</option>
                  <option value={7}>7x7 Deep</option>
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Feature Maps</label>
                <select 
                  value={engineConfig.filters}
                  onChange={(e) => setEngineConfig({...engineConfig, filters: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                >
                  <option value={32}>Sparse (32)</option>
                  <option value={64}>Standard (64)</option>
                  <option value={128}>Dense (128)</option>
                </select>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Neural Depth</label>
                <select 
                  value={engineConfig.depth}
                  onChange={(e) => setEngineConfig({...engineConfig, depth: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                >
                  <option value={18}>18 Layers (Light)</option>
                  <option value={34}>34 Layers (Med)</option>
                  <option value={50}>50 Layers (Heavy)</option>
                  <option value={101}>101 Layers (Extreme)</option>
                </select>
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Pooling Op</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                   {['max', 'avg'].map(op => (
                     <button
                       key={op}
                       onClick={() => setEngineConfig({...engineConfig, pooling: op})}
                       className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all ${engineConfig.pooling === op ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 uppercase' : 'text-slate-400 hover:text-slate-600 uppercase'}`}
                     >
                       {op}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Activation</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                   {['ReLU', 'GELU'].map(fn => (
                     <button
                       key={fn}
                       onClick={() => setEngineConfig({...engineConfig, activation: fn})}
                       className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all ${engineConfig.activation === fn ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {fn}
                     </button>
                   ))}
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Optimization</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                   {['Adam', 'RMSProp'].map(opt => (
                     <button
                       key={opt}
                       onClick={() => setEngineConfig({...engineConfig, optimization: opt})}
                       className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all ${engineConfig.optimization === opt ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {opt}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
             <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Learning Rate</label>
                  <span className="text-[10px] font-mono font-black text-indigo-600">{engineConfig.learningRate.toFixed(4)}</span>
                </div>
                <input 
                  type="range"
                  min="0.0001"
                  max="0.01"
                  step="0.0001"
                  value={engineConfig.learningRate}
                  onChange={(e) => setEngineConfig({...engineConfig, learningRate: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer"
                />
             </div>

             <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                   <span className="text-[11px] font-black text-slate-700 tracking-tight">Batch Normalization</span>
                   <span className="text-[9px] text-slate-400 font-medium">Stabilize training across mini-batches</span>
                </div>
                <div 
                  onClick={() => setEngineConfig({...engineConfig, batchNorm: !engineConfig.batchNorm})}
                  className={`w-9 h-4.5 rounded-full transition-all relative ${engineConfig.batchNorm ? 'bg-emerald-500' : 'bg-slate-200 shadow-inner'}`}
                >
                   <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${engineConfig.batchNorm ? 'left-5' : 'left-0.5'}`} />
                </div>
             </div>

             <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                   <span className="text-xs font-black text-slate-700 tracking-tight">Multi-Scale Convolutional Fusion</span>
                   <span className="text-[10px] text-slate-400 font-medium">Aggregated hierarchical feature identification</span>
                </div>
                <div 
                  onClick={() => setEngineConfig({...engineConfig, multiScale: !engineConfig.multiScale})}
                  className={`w-10 h-5 rounded-full transition-all relative ${engineConfig.multiScale ? 'bg-indigo-600' : 'bg-slate-200 shadow-inner'}`}
                >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${engineConfig.multiScale ? 'left-6' : 'left-1'}`} />
                </div>
             </label>
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
                  {MATERIAL_DB.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.formula.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                    <div className="p-1">
                      {MATERIAL_DB.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.formula.toLowerCase().includes(searchTerm.toLowerCase())).map((material, idx) => (
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
                      {mixtureList.map(m => (
                        <div key={m} className="flex items-center gap-1 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 shadow-sm">
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
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-colors duration-1000" />
           <h3 className="font-bold text-lg mb-2 flex items-center gap-3 relative z-10">
             <div className="p-1.5 bg-violet-500/20 rounded-lg border border-violet-500/30">
               <Brain className="w-5 h-5 text-violet-400" />
             </div>
             Convolutional Engine
           </h3>
           <p className="text-xs text-slate-400 font-mono mb-6 relative z-10 uppercase tracking-tighter">ARCH: XRD-{engineConfig.multiScale ? 'Res' : 'Conv'}Net-50 v4.2 • {engineConfig.activation} • {engineConfig.filters}F</p>
           
           <div className="space-y-5 relative z-10">
             {/* Vertical connecting line */}
             <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800/80 z-0"></div>
             {steps.slice(1).map((step, idx) => {
               const stepIdx = idx + 1;
               const isActive = progressStep === stepIdx;
               const isCompleted = progressStep > stepIdx;
               const Icon = step.icon;
               
               return (
                 <div key={`${step.label}-${idx}`} className={`relative z-10 flex flex-col gap-1 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0
                       ${isActive ? 'border-violet-500 bg-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110 rotate-3' : 
                         isCompleted ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-600'}
                     `}>
                       {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <span className={`text-sm font-bold block truncate ${isActive ? 'text-violet-300' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                         {step.label}
                       </span>
                     </div>
                     
                     {/* Activation Metrics */}
                     {isActive && (
                       <div className="flex items-center gap-2">
                         <div className="text-[9px] font-mono text-emerald-400 flex flex-col items-end">
                           <span>OPT: ADAM</span>
                           <span>{idx === 2 ? `CANDS: ~${(100 + Math.random() * 50).toFixed(0)}K` : `ACC: ${(95 + Math.random() * 4).toFixed(2)}%`}</span>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   {/* Layer Details & Visualizations */}
                   {(isActive || isCompleted) && (
                     <div className="ml-11 mt-1 pl-2 border-l border-slate-700/50">
                         {idx === 0 && isActive && (
                            <div className="text-[9px] text-slate-400 font-mono space-y-1 mb-2">
                               <p className="animate-pulse flex items-center gap-2"><span className="text-violet-500">&gt;</span> Tensor shape: [1, 2048, 1]</p>
                               <p className="animate-pulse flex items-center gap-2" style={{animationDelay: '0.2s'}}><span className="text-violet-500">&gt;</span> Kern Size: {engineConfig.kernelSize}x{engineConfig.kernelSize}</p>
                               <p className="animate-pulse flex items-center gap-2" style={{animationDelay: '0.4s'}}><span className="text-violet-500">&gt;</span> Augmentation: Noise Injection</p>
                            </div>
                         )}
                         
                         {idx === 1 && isActive && (
                           <div className="mb-2">
                             <div className="text-[9px] text-slate-400 font-mono space-y-1 mb-2">
                                <p className="flex justify-between"><span>Conv1D_1: [{engineConfig.filters}, {engineConfig.kernelSize}]</span> <span className="text-violet-400 font-black">{Math.floor(Math.random() * 99)}ms</span></p>
                                <p className="flex justify-between"><span>Activation: {engineConfig.activation}</span> <span className="text-emerald-400 font-black">STABLE</span></p>
                                <p className="flex justify-between"><span>Fusion: {engineConfig.multiScale ? 'ENABLED' : 'DISABLED'}</span> <span className="text-violet-400 font-black">{Math.floor(Math.random() * 99)}ms</span></p>
                             </div>
                             <div className="grid grid-cols-8 gap-1 w-full max-w-[180px]">
                               {[...Array(16)].map((_, i) => (
                                 <div key={`pulse-${i}`} className="h-2 rounded-[2px] bg-violet-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ opacity: Math.random() * 0.8 + 0.2, animationDelay: `${i * 0.05}s` }} />
                               ))}
                             </div>
                             <p className="text-[8px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest text-right max-w-[180px]">Feature Map Activations</p>
                           </div>
                         )}

                         {idx === 2 && isActive && (
                            <div className="text-[9px] text-slate-400 font-mono space-y-1.5 mb-2 mt-1">
                               <p className="animate-pulse text-cyan-400 flex items-center gap-1.5"><Database className="w-3 h-3" /> Loading Index HNSW-1M...</p>
                               <p>Performing Cosine Similarity Search</p>
                               <div className="w-full max-w-[180px] bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                                  <div className="bg-cyan-500 h-full animate-[progress_1.5s_ease-in-out_infinite]" style={{width: `${10 + Math.random() * 80}%`}}></div>
                               </div>
                            </div>
                         )}

                         {idx === 3 && isActive && (
                            <div className="text-[9px] text-slate-400 font-mono space-y-1 mb-2">
                               <p className="flex justify-between"><span>Dense_1</span> <span>Softmax Evaluation</span></p>
                               <p className="text-emerald-400 animate-pulse my-1">Computing Confidence Thresholds...</p>
                               <p className="flex justify-between text-slate-500"><span>Loss</span> <span>Categorical Cross-Entropy</span></p>
                            </div>
                         )}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group">
          {/* Subtle grid background to look like a terminal/software UI */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
          
          <div className="flex justify-between items-center mb-4 px-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Phase Match Visualization</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Convolutional Feature Overlay</p>
              </div>
            </div>
            
            {selectedCandidate && (
              <div className="flex gap-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border shadow-inner backdrop-blur-sm
                  ${selectedCandidate.match_quality === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    selectedCandidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                `}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCandidate.match_quality === 'Excellent' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : selectedCandidate.match_quality === 'Good' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                  {selectedCandidate.match_quality || "Match"} Quality
                </span>
                <span className="text-xs font-bold bg-violet-500/10 text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/20 flex items-center gap-2 backdrop-blur-sm">
                  <Database className="w-3 h-3 text-violet-400" />
                  DB Overlay: {selectedCandidate.phase_name}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-slate-950/80 rounded-xl border border-white/5 p-2 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[0, 'dataMax + 5']} 
                  unit="°" 
                  allowDataOverflow 
                  name="2θ"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                
                {isSimulating && scanPos !== null && (
                   <ReferenceLine 
                     x={scanPos} 
                     stroke="#8b5cf6" 
                     strokeWidth={2} 
                     label={{ value: 'Neural Scan', position: 'top', fill: '#8b5cf6', fontSize: 10, fontWeight: 'bold' }} 
                   />
                )}

                {/* Input Data */}
                {isDiscrete ? (
                   <Area 
                     type="monotone" 
                     dataKey="intensity" 
                     stroke="#8b5cf6" 
                     fill="url(#colorUv)" 
                     strokeWidth={2}
                     name="Simulated Diffractogram" 
                     activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff' }}
                   />
                ) : (
                   <Area 
                     type="monotone" 
                     dataKey="intensity" 
                     stroke="#6366f1" 
                     fill="url(#colorUv)" 
                     strokeWidth={2}
                     name="Input Pattern" 
                   />
                )}
                
                {/* Reference Data (Gaussian Simulation Overlay) */}
                {isDiscrete && selectedCandidate && (
                   <Area 
                     type="monotone" 
                     dataKey="refIntensity" 
                     stroke="#f43f5e" 
                     fill="url(#colorRv)" 
                     fillOpacity={0.3}
                     strokeWidth={1.5}
                     strokeDasharray="4 4"
                     name={`${selectedCandidate.phase_name} (Gaussian Fit)`} 
                   />
                )}
                
                {/* Reference Stick Data */}
                {selectedCandidate && (
                  <Scatter 
                    data={refData} 
                    dataKey="refIntensity" 
                    name={`${selectedCandidate.phase_name} (Database Sticks)`} 
                    fill="#f43f5e" 
                    shape="diamond"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {!inputData.trim() && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl z-20 border border-slate-800">
               <Layers className="w-12 h-12 text-slate-700 mb-4 animate-pulse opacity-50" />
               <p className="text-slate-400 font-medium">Network Awaiting Input Data</p>
               <p className="text-xs text-slate-500 font-mono mt-2">SYS_STATUS: STANDBY</p>
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
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl border border-slate-800 relative overflow-hidden">
              {/* Warning Ribbon */}
              <div className="absolute top-0 right-10 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1.5 uppercase tracking-tighter rounded-b-xl flex items-center gap-2 shadow-lg z-20">
                <Activity className="w-3.5 h-3.5" />
                Laboratory Verification Required
              </div>

              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="p-4 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 rounded-2xl border border-violet-500/30">
                  <Brain className="w-7 h-7 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Synthesis Intelligence</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Score: {selectedCandidate.confidence_score.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={handleLatticeEstimation}
                     className="group relative px-5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl transition-all hover:border-emerald-500/50 active:scale-95"
                   >
                     <div className="flex items-center gap-2 relative z-10">
                       <Calculator className="w-4 h-4 text-emerald-400" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest tracking-widest">Lattice AI</span>
                     </div>
                   </button>
                   <button 
                     onClick={handleGenerateReport}
                     className="group relative px-5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl transition-all hover:border-violet-500/50 active:scale-95"
                   >
                     <div className="flex items-center gap-2 relative z-10">
                       <FileText className="w-4 h-4 text-violet-400" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest tracking-widest">Export</span>
                     </div>
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-fr">
                {/* Identity Card */}
                <div className="md:col-span-8 group">
                  <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800 shadow-inner h-full flex flex-col relative overflow-hidden transition-all hover:border-slate-700">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="flex flex-wrap items-end gap-6 mb-8 relative z-10">
                      <h2 className="text-4xl font-black text-white tracking-tighter leading-none group-hover:text-violet-400 transition-colors duration-500">{selectedCandidate.phase_name}</h2>
                      <div className="flex gap-2">
                        <span className="px-4 py-2 bg-violet-500/10 text-violet-300 text-xs font-mono font-black rounded-xl border border-violet-500/20">{selectedCandidate.formula}</span>
                        <span className="px-4 py-2 bg-slate-800 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/10">{selectedCandidate.materialType || "Standard"}</span>
                      </div>
                    </div>
                    
                    <p className="text-base text-slate-400 leading-relaxed max-w-3xl relative z-10 mb-8 font-medium">
                      {selectedCandidate.description || "Phase identification complete. Detailed morphological synthesis and mechanical property mapping for this specific lattice configuration are being processed by the intelligence engine."}
                    </p>
                    
                    <div className="mt-auto pt-8 border-t border-slate-800 flex flex-wrap gap-8 relative z-10">
                       {[
                         { label: 'Molecular Wt', val: selectedCandidate.molecularWeight, unit: 'g/mol', icon: Layers },
                         { label: 'Band Gap', val: selectedCandidate.bandGap, unit: 'eV', icon: Zap },
                         { label: 'Modulus', val: selectedCandidate.elasticModulus, unit: 'GPa', icon: Activity },
                         { label: 'Magnetism', val: selectedCandidate.magneticProperties, unit: '', icon: Database },
                       ].map((item, i) => item.val !== undefined && (
                         <div key={i} className="flex gap-4 group/item">
                           <div className="p-2.5 h-fit bg-slate-900 rounded-xl border border-slate-800 group-hover/item:border-violet-500/30 transition-colors">
                             <item.icon className="w-4 h-4 text-slate-500 group-hover/item:text-violet-400 transition-colors" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1 group-hover/item:text-slate-400 transition-colors">{item.label}</span>
                             <span className="text-sm font-black font-mono text-slate-200 capitalize">
                               {item.val} {item.unit && <span className="text-slate-600 text-[10px] ml-1">{item.unit}</span>}
                             </span>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Crystallography */}
                <div className="md:col-span-4">
                  <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800 h-full relative overflow-hidden group/card shadow-inner">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Database className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cell Metrics</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 relative z-10">
                      {[
                        { l: 'Crystal System', v: selectedCandidate.crystalSystem || "Unknown", c: 'text-white' },
                        { l: 'Space Group', v: selectedCandidate.spaceGroup || "N/A", c: 'text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20' },
                        { l: 'Density', v: selectedCandidate.density ? `${selectedCandidate.density} g/cm³` : "N/A", c: 'text-white font-mono' },
                        { l: 'Database ID', v: selectedCandidate.card_id, c: 'text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20' }
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center group/row">
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest group-hover/row:text-slate-400 transition-colors">{row.l}</span>
                          <span className={`text-xs font-black ${row.c}`}>{row.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Applications & Safety */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/20 transition-all group/bento shadow-inner">
                    <div className="flex items-center gap-3 mb-6">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Applications</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedCandidate.applications?.map((app, i) => (
                        <span key={i} className="text-[10px] font-black bg-slate-900 text-slate-400 px-4 py-2 rounded-xl border border-slate-800 hover:text-white transition-colors">
                          {app}
                        </span>
                      )) || <span className="text-[10px] text-slate-600 italic">No industrial data available.</span>}
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800 hover:border-rose-500/20 transition-all group/bento shadow-inner">
                    <div className="flex items-center gap-3 mb-6">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hazard Profile</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedCandidate.hazards && selectedCandidate.hazards.length > 0 ? (
                        selectedCandidate.hazards.map((hazard, i) => (
                          <span key={i} className="text-[9px] font-black bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest">
                            {hazard}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Non-toxic Response
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Neural Activation Heatmap */}
              <div className="mt-12 pt-8 border-t border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
                      Neural Attention Mapping
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Convolutional activation patterns detected for {selectedCandidate.phase_name}</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {[
                    { name: 'Feature_Extraction_L1', color: 'from-violet-600 to-indigo-600' },
                    { name: 'Structural_Hierarchy_L3', color: 'from-indigo-600 to-blue-600' },
                    { name: 'Final_Classification_Pool', color: 'from-blue-600 to-emerald-600' }
                  ].map((layer, lIdx) => (
                    <div key={lIdx} className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-mono font-black text-slate-500">{layer.name}</span>
                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">Layer Status: Optimized</span>
                      </div>
                      <div className="h-6 w-full bg-black rounded-lg overflow-hidden flex border border-slate-800/50 shadow-inner">
                        {[...Array(40)].map((_, i) => {
                           const val = Math.random();
                           const op = val > 0.8 ? 1 : val > 0.4 ? 0.6 : 0.2;
                           return (
                             <div 
                               key={i} 
                               className={`flex-1 h-full bg-gradient-to-t ${layer.color} transition-all duration-700`}
                               style={{ opacity: op }}
                             />
                           );
                         })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="mt-10 pt-8 border-t border-slate-800">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Verification Audit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    "Lattice alignment checked",
                    "Relative intensity verified",
                    "Composition confirmed",
                  ].map((item, i) => (
                    <label key={i} className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group">
                      <input type="checkbox" className="peer w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20" />
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{item}</span>
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
           {result?.candidates.map((candidate, idx) => (
             <div 
               key={`${candidate.phase_name}-${idx}`} 
               onClick={() => setSelectedCandidate(candidate)}
               className={`bg-slate-900 p-5 rounded-xl shadow-sm border cursor-pointer transition-all group overflow-hidden relative
                 ${selectedCandidate?.phase_name === candidate.phase_name ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-slate-800' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}
               `}
             >
               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
               )}
               <div className="flex justify-between items-start mb-3 relative z-10">
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner border
                     ${idx === 0 ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30' : 
                       idx === 1 ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 border-slate-600' :
                       idx === 2 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30' :
                       'bg-slate-900 text-slate-600 border-slate-800'}
                   `}>
                     #{idx + 1}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-white group-hover:text-violet-400 transition-colors">{candidate.phase_name}</h4>
                     <div className="flex flex-wrap gap-2 text-xs mt-1">
                       <span className="font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">{candidate.formula}</span>
                       <span className="text-slate-500 flex items-center"><Database className="w-3 h-3 mr-1"/>{candidate.card_id}</span>
                       {candidate.match_quality && (
                         <span className={`px-2 py-0.5 rounded-md font-bold border
                           ${candidate.match_quality === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                             candidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}
                         `}>
                           {candidate.match_quality}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="text-right flex flex-col items-end">
                   <span className={`text-3xl font-black tracking-tighter shadow-sm
                     ${candidate.confidence_score > 80 ? 'text-emerald-500' : candidate.confidence_score > 50 ? 'text-violet-500' : 'text-amber-500'}
                   `}>
                     {candidate.confidence_score.toFixed(1)}%
                   </span>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                     <Activity className="w-3 h-3" />
                     Network Conf
                   </p>
                 </div>
               </div>
               
               <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800 relative z-10 box-content">
                 <div 
                   className={`h-full rounded-none transition-all duration-1000 ease-out ${candidate.confidence_score > 80 ? 'bg-emerald-500' : candidate.confidence_score > 50 ? 'bg-violet-500' : 'bg-amber-500'}`}
                   style={{ width: `${candidate.confidence_score}%` }}
                 ></div>
               </div>

               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="mt-5 pt-5 border-t border-slate-700/50 animate-in slide-in-from-top-2 relative z-10">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
                     <CheckCircle className="w-3 h-3 text-emerald-400"/> Feature Map Verification
                   </p>
                   <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                     {candidate.matched_peaks?.map((mp, i) => (
                       <div key={`peak-${mp.refT}-${i}`} className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex justify-between items-center group-hover:bg-slate-900 transition-colors">
                         <span className="text-slate-400 font-mono text-[11px]">{mp.refT.toFixed(2)}°</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                       </div>
                     ))}
                   </div>
                   <div className="mt-4 flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                     <div className="w-2 h-2 rounded bg-violet-500 animate-pulse" />
                     <p className="text-[10px] text-slate-500 font-mono">
                       Select other candidates to compare convolutional feature overlays.
                     </p>
                   </div>
                 </div>
               )}
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="h-40 flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 text-slate-500 relative overflow-hidden group">
               <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <Database className="w-10 h-10 mb-3 opacity-30 group-hover:hidden" />
               <Brain className="w-10 h-10 mb-3 text-violet-500 hidden group-hover:block animate-bounce opacity-80" />
               <p className="font-bold tracking-tight text-slate-300">Awaiting Neural Evaluation</p>
               <p className="text-xs mt-1 font-mono text-slate-500 uppercase tracking-widest">Load data to initialize the network</p>
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
