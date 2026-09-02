/**
 * High-fidelity synthetic diffraction pattern benchmarks for testing Vision and OCR engines.
 */

export interface BenchmarkPattern {
  id: string;
  title: string;
  subtitle: string;
  category: '2D Debye Rings' | 'Single Crystal SAED' | 'Textured Fiber' | '1D Diffractogram';
  description: string;
}

export const BENCHMARK_PATTERNS: BenchmarkPattern[] = [
  {
    id: 'lab6_powder',
    title: 'LaB₆ Standard Calibrant',
    subtitle: 'NIST SRM 660c Debye-Scherrer Rings',
    category: '2D Debye Rings',
    description: 'Sharp, untextured concentric rings with Cu Kα wavelength for beam center and ring fitting verification.'
  },
  {
    id: 'ceo2_ceria',
    title: 'CeO₂ Nanoparticle Standard',
    subtitle: 'Fm-3m Face-Centered Cubic',
    category: '2D Debye Rings',
    description: 'Concentric shells displaying significant peak broadening for Scherrer crystallite sizing.'
  },
  {
    id: 'si_saed',
    title: 'Silicon [001] SAED Spot Matrix',
    subtitle: 'Diamond Cubic Single-Crystal',
    category: 'Single Crystal SAED',
    description: 'Orthogonal reciprocal lattice grid for zone axis indexing, unit cell vectors, and spot segmentation.'
  },
  {
    id: 'polymer_fiber',
    title: 'Oriented Polymer / Carbon Fiber',
    subtitle: 'High Anisotropy Arcs',
    category: 'Textured Fiber',
    description: 'Debye rings broken into azimuthal arcs for Herman orientation factor (f) and texture evaluation.'
  },
  {
    id: 'xrd_diffractogram_scan',
    title: '1D Powder XRD Scan with Peak Table',
    subtitle: 'Graph & Peak Annotations',
    category: '1D Diffractogram',
    description: 'Digitized spectrum graph with 2θ angle labels, ICDD card annotations, and peak intensity table for OCR testing.'
  }
];

export function generateBenchmarkPatternDataUrl(patternId: string): string {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = size / 2;
  const cy = size / 2;

  if (patternId === 'lab6_powder') {
    // 2D Dark background with detector Poisson noise
    ctx.fillStyle = '#06080d';
    ctx.fillRect(0, 0, size, size);

    // Subtle radial background falloff
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 250);
    bgGrad.addColorStop(0, 'rgba(40, 45, 60, 0.4)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Radii of LaB6 Debye rings (in pixels for standard 150mm distance, 75um pixel)
    const ringRadii = [52, 74, 91, 105, 118, 129, 140, 150, 169, 178, 195, 212];
    const intensities = [220, 180, 140, 240, 110, 160, 95, 130, 85, 105, 150, 75];

    ringRadii.forEach((r, i) => {
      const intVal = intensities[i % intensities.length];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(${intVal}, ${Math.min(255, intVal + 30)}, ${Math.min(255, intVal + 60)}, 0.85)`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Outer glow for each ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(${intVal}, ${intVal}, 255, 0.25)`;
      ctx.lineWidth = 5.0;
      ctx.stroke();
    });

    // Beamstop shadow (shadow strip from center to bottom-right)
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4);
    ctx.lineTo(size - 20, size - 20);
    ctx.lineTo(size, size - 40);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(2, 4, 8, 0.95)';
    ctx.fill();

    // Center direct beam spot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();

  } else if (patternId === 'ceo2_ceria') {
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, size, size);

    // Broader Debye rings for nanoparticles (111, 200, 220, 311, 222, 400, 331, 420)
    const ceriaRadii = [60, 69, 98, 115, 120, 138, 151, 155, 170, 196, 225];
    ceriaRadii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(210, 225, 255, ${0.45 + (idx % 3) * 0.15})`;
      ctx.lineWidth = 4.5;
      ctx.stroke();
    });

    // Center direct beam
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  } else if (patternId === 'si_saed') {
    ctx.fillStyle = '#040609';
    ctx.fillRect(0, 0, size, size);

    // 2D Square spot grid (reciprocal lattice)
    const spacing = 38;
    const maxOrder = 5;

    for (let h = -maxOrder; h <= maxOrder; h++) {
      for (let k = -maxOrder; k <= maxOrder; k++) {
        // Selection rule for FCC diamond (h+k even, etc.)
        if ((Math.abs(h) + Math.abs(k)) % 2 !== 0 && (h * k) % 2 === 0) continue;
        
        const px = cx + h * spacing;
        const py = cy + k * spacing;
        const dist = Math.sqrt(h * h + k * k);
        if (dist > maxOrder + 0.5) continue;

        const spotIntensity = Math.max(0.1, 1.0 - dist * 0.14);
        const radius = Math.max(2, 5.5 - dist * 0.5);

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(180, 230, 255, ${spotIntensity})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Direct beam
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  } else if (patternId === 'polymer_fiber') {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, size, size);

    // Draw anisotropic arcs (meridional orientation around 90 deg and 270 deg)
    const radii = [65, 110, 160, 210];
    radii.forEach(r => {
      // Top arc (around 90 deg = Math.PI / 2)
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 0.3, Math.PI * 0.7);
      ctx.strokeStyle = 'rgba(220, 210, 255, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Bottom arc (around 270 deg = 3*Math.PI / 2)
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 1.3, Math.PI * 1.7);
      ctx.strokeStyle = 'rgba(220, 210, 255, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    });

    // Direct beam
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  } else if (patternId === 'xrd_diffractogram_scan') {
    // 1D Spectrum Diffractogram with text labels for Multimodal OCR
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Chart frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 40, size - 80, size - 180);

    // Title & Axis Labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('X-Ray Powder Diffractogram - Silicon / LaB6 Standard', 55, 28);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Radiation: Cu Kα (λ = 1.5406 Å) | PDF Card: #00-027-1402', 55, size - 120);
    ctx.fillText('2θ (degrees)', size / 2 - 30, size - 105);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 80; x < size - 50; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, size - 140);
      ctx.stroke();
      const deg = 20 + Math.round(((x - 50) / (size - 80)) * 60);
      ctx.fillText(`${deg}°`, x - 8, size - 125);
    }

    // Draw Simulated Spectrum Line
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const baselineY = size - 142;
    ctx.moveTo(50, baselineY);

    const peaks = [
      { x: 105, h: 140, label: '2θ = 28.44° (111)', d: 'd = 3.135 Å', i: '100%' },
      { x: 215, h: 80, label: '2θ = 47.30° (220)', d: 'd = 1.920 Å', i: '55%' },
      { x: 285, h: 55, label: '2θ = 56.12° (311)', d: 'd = 1.637 Å', i: '30%' },
      { x: 380, h: 35, label: '2θ = 69.13° (400)', d: 'd = 1.357 Å', i: '12%' },
      { x: 440, h: 42, label: '2θ = 76.38° (331)', d: 'd = 1.246 Å', i: '18%' }
    ];

    for (let x = 50; x < size - 30; x += 2) {
      let y = baselineY - (Math.random() * 4);
      peaks.forEach(p => {
        const dx = x - p.x;
        const peakContrib = p.h * Math.exp(-(dx * dx) / 16);
        y -= peakContrib;
      });
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Annotate peaks
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f59e0b';
    peaks.forEach(p => {
      ctx.fillText(p.label, p.x - 30, baselineY - p.h - 18);
      ctx.fillStyle = '#10b981';
      ctx.fillText(p.d, p.x - 20, baselineY - p.h - 6);
      ctx.fillStyle = '#f59e0b';
    });

    // Peak Table at bottom
    ctx.fillStyle = '#020617';
    ctx.fillRect(40, size - 90, size - 80, 80);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(40, size - 90, size - 80, 80);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('PEAK DIGITIZER INDEX TABLE:', 48, size - 75);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('#  | 2-Theta (°) | d-Spacing (Å) | I/I0 (%) | Phase hkl', 48, size - 62);
    peaks.slice(0, 3).forEach((p, idx) => {
      ctx.fillText(`0${idx+1} | ${p.label.slice(5, 11)}      | ${p.d.slice(4)}       | ${p.i.padEnd(8)} | Si ${p.label.slice(12)}`, 48, size - 48 + idx * 12);
    });
  }

  return canvas.toDataURL('image/png');
}
