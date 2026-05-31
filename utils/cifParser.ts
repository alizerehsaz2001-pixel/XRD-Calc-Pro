import { CrystalSystem, RietveldAtom, RietveldPhaseInput } from '../types';

export function parseCIF(cifContent: string, fileName: string): RietveldPhaseInput {
  const lines = cifContent.split('\n').map(l => l.trim());
  let a = 5.0, b = 5.0, c = 5.0;
  let alpha = 90, beta = 90, gamma = 90;
  let spaceGroup = '';
  const atoms: RietveldAtom[] = [];

  let inLoop = false;
  let loopHeaders: string[] = [];
  let atomSiteLoop = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove comments starting with #
    if (line.indexOf('#') !== -1) {
      line = line.substring(0, line.indexOf('#')).trim();
    }
    if (!line) continue;
    
    // Split by whitespace but respect quotes
    const tokens: string[] = [];
    let currentToken = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === "'" || char === '"') {
        inQuotes = !inQuotes;
      } else if (char.match(/\s/) && !inQuotes) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }
    if (currentToken) tokens.push(currentToken);

    if (tokens.length === 0) continue;

    if (tokens[0].toLowerCase() === 'loop_') {
      inLoop = true;
      loopHeaders = [];
      atomSiteLoop = false;
      continue;
    }

    if (inLoop) {
      if (tokens[0].startsWith('_')) {
        loopHeaders.push(tokens[0].toLowerCase());
        if (tokens[0].toLowerCase().includes('_atom_site_fract_x')) {
          atomSiteLoop = true;
        }
        continue;
      } else {
        if (atomSiteLoop) {
          // Parse atom row
          let element = 'X';
          let x = 0, y = 0, z = 0, occ = 1, bIso = 0.5;

          const labelIdx = loopHeaders.findIndex(h => h === '_atom_site_label' || h === '_atom_site_type_symbol');
          const xIdx = loopHeaders.findIndex(h => h === '_atom_site_fract_x');
          const yIdx = loopHeaders.findIndex(h => h === '_atom_site_fract_y');
          const zIdx = loopHeaders.findIndex(h => h === '_atom_site_fract_z');
          const occIdx = loopHeaders.findIndex(h => h === '_atom_site_occupancy');
          const uIsoIdx = loopHeaders.findIndex(h => h === '_atom_site_u_iso_or_equiv' || h === '_atom_site_b_iso_or_equiv');

          if (labelIdx !== -1 && tokens[labelIdx]) {
            element = tokens[labelIdx].replace(/[^A-Za-z]/g, '');
          }
          
          // Helper to parse value with standard uncertainty e.g. "0.123(4)"
          const parseVal = (str: string) => parseFloat(str.split('(')[0]);

          if (xIdx !== -1 && tokens[xIdx]) x = parseVal(tokens[xIdx]);
          if (yIdx !== -1 && tokens[yIdx]) y = parseVal(tokens[yIdx]);
          if (zIdx !== -1 && tokens[zIdx]) z = parseVal(tokens[zIdx]);
          if (occIdx !== -1 && tokens[occIdx]) occ = parseVal(tokens[occIdx]);
          if (uIsoIdx !== -1 && tokens[uIsoIdx]) bIso = parseVal(tokens[uIsoIdx]) * 8 * Math.PI * Math.PI; // roughly convert U to B if U

          atoms.push({
            element,
            x: x || 0,
            y: y || 0,
            z: z || 0,
            occupancy: occ || 1,
            bIso: Math.max(0.1, bIso)
          });
        }
        
        // If it's a loop row, we stay in loop, but if the next line starts with '_' and not data, it breaks, but for CIF, we only break if it's the end or a new tag or data_
      }
    }
    
    // Check if new tag outside loop
    if (tokens[0].startsWith('_') && !inLoop) {
      const tag = tokens[0].toLowerCase();
      let val = tokens.length > 1 ? tokens[1] : '';
      if (tokens.length === 1 && i + 1 < lines.length && !lines[i+1].startsWith('_')) {
        // Value might be on next line (or multiline)
        val = lines[i+1].split(' ')[0];
      }

      const cleanVal = parseFloat(val.split('(')[0]);

      if (tag === '_cell_length_a') a = cleanVal || a;
      if (tag === '_cell_length_b') b = cleanVal || b;
      if (tag === '_cell_length_c') c = cleanVal || c;
      if (tag === '_cell_angle_alpha') alpha = cleanVal || alpha;
      if (tag === '_cell_angle_beta') beta = cleanVal || beta;
      if (tag === '_cell_angle_gamma') gamma = cleanVal || gamma;
      if (tag === '_space_group_name_h-m_alt' || tag === '_symmetry_space_group_name_h-m') {
        spaceGroup = val.replace(/['"]/g, '');
      }
    }
    
    if (tokens[0].startsWith('data_') || (tokens[0].startsWith('_') && inLoop && !tokens[0].startsWith('_atom'))) {
      if (inLoop && !tokens[0].startsWith('_')) {
        // end loop maybe, but let's just handle it loosely
      }
    }
    
    if (tokens[0].startsWith('_') && !tokens[0].startsWith('_atom') && atoms.length > 0) {
      inLoop = false; // exited atom loop
    }
  }

  // Deduce Crystal System
  let crystalSystem: CrystalSystem = 'Triclinic';
  const is90 = (v: number) => Math.abs(v - 90) < 0.1;
  const is120 = (v: number) => Math.abs(v - 120) < 0.1;

  if (Math.abs(a - b) < 0.01 && Math.abs(b - c) < 0.01 && is90(alpha) && is90(beta) && is90(gamma)) {
    crystalSystem = 'Cubic';
  } else if (Math.abs(a - b) < 0.01 && is90(alpha) && is90(beta) && is90(gamma)) {
    crystalSystem = 'Tetragonal';
  } else if (Math.abs(a - b) < 0.01 && is90(alpha) && is90(beta) && is120(gamma)) {
    crystalSystem = 'Hexagonal';
  } else if (is90(alpha) && is90(beta) && is90(gamma)) {
    crystalSystem = 'Orthorhombic';
  } else if (is90(alpha) && is90(gamma)) {
    crystalSystem = 'Monoclinic';
  }

  return {
    name: fileName.replace('.cif', ''),
    crystalSystem,
    spaceGroup,
    a, b, c, 
    alpha, beta, gamma,
    atoms
  };
}
