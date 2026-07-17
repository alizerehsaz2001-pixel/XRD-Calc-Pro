import React, { useState, useEffect, useRef } from 'react';
import { MagneticAtom, MagneticResult, LatticeParameters } from '../types';
import { calculateMagneticDiffraction, NEUTRON_SCATTERING_LENGTHS, MAGNETIC_FORM_FACTORS, NEUTRON_WAVELENGTHS, calculateCellVolume } from '../utils/physics';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { Upload, Atom, Zap, Info, Layers, Download, Move, Database, Trash2, Plus, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MagneticNeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(2.4); 
  const [lattice, setLattice] = useState<LatticeParameters>({
    a: 4.0, b: 4.0, c: 4.0, alpha: 90, beta: 90, gamma: 90
  });
  const [kVector, setKVector] = useState({ x: 0, y: 0, z: 0 });

  // Visualizer Rotation State
  const [rotation, setRotation] = useState({ x: 25, y: -45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Simulation Environment States
  const [temperature, setTemperature] = useState<number>(10);
  const [criticalTemp, setCriticalTemp] = useState<number>(310);
  const [polarizationMode, setPolarizationMode] = useState<'none' | 'up' | 'down'>('none');
  const [visTab, setVisTab] = useState<'chart' | 'rings' | 'susceptibility'>('chart');
  const [ringRenderMode, setRingRenderMode] = useState<'total' | 'nuclear' | 'magnetic'>('total');

  const ringsCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [atoms, setAtoms] = useState<MagneticAtom[]>([
    { id: '1', element: 'Mn', label: 'Mn (Up)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 0, mz: 4, ion: 'Mn2+' },
    { id: '2', element: 'Mn', label: 'Mn (Down)', b: -3.73, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -4, ion: 'Mn2+' },
  ]);

  const [results, setResults] = useState<MagneticResult[]>([]);

  const polVector = polarizationMode === 'none' 
    ? { x: 0, y: 0, z: 0 } 
    : (polarizationMode === 'up' ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: -1 });

  const handleCalculate = () => {
    const computed = calculateMagneticDiffraction(
      wavelength, 
      lattice, 
      atoms, 
      100, 
      kVector,
      temperature,
      criticalTemp,
      polVector
    );
    setResults(computed);
  };

  const handleExport = () => {
    const data = {
      lattice,
      atoms,
      wavelength,
      kVector,
      temperature,
      criticalTemp,
      polarizationMode,
      type: 'Magnetic Neutron',
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magnetic-structure-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    handleCalculate();
  }, [atoms, wavelength, lattice, kVector, temperature, criticalTemp, polarizationMode]);

  const updateAtom = (id: string, field: keyof MagneticAtom, value: any) => {
    setAtoms(atoms.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: value };
        if (field === 'element' && NEUTRON_SCATTERING_LENGTHS[value]) {
          updated.b = NEUTRON_SCATTERING_LENGTHS[value];
        }
        return updated;
      }
      return a;
    }));
  };

  // Dynamic Atom list controls
  const handleAddAtom = () => {
    const newId = (Date.now() + Math.random()).toString();
    setAtoms([
      ...atoms,
      {
        id: newId,
        element: 'Fe',
        label: `Fe (Site ${atoms.length + 1})`,
        b: 9.45,
        x: 0,
        y: 0,
        z: 0.5,
        B_iso: 0.5,
        mx: 0,
        my: 0,
        mz: 2.0,
        ion: 'Fe3+'
      }
    ]);
  };

  const handleDeleteAtom = (id: string) => {
    if (atoms.length <= 1) return;
    setAtoms(atoms.filter(a => a.id !== id));
  };

  // Quick alignment operations
  const alignSpinsAxis = (axis: 'x' | 'y' | 'z', value: number) => {
    setAtoms(atoms.map(a => ({
      ...a,
      mx: axis === 'x' ? value : 0,
      my: axis === 'y' ? value : 0,
      mz: axis === 'z' ? value : 0,
    })));
  };

  const invertSpins = () => {
    setAtoms(atoms.map(a => ({
      ...a,
      mx: -(a.mx || 0),
      my: -(a.my || 0),
      mz: -(a.mz || 0),
    })));
  };

  const randomizeSpins = () => {
    setAtoms(atoms.map(a => {
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const mag = 3.5;
      return {
        ...a,
        mx: parseFloat((mag * Math.sin(theta) * Math.cos(phi)).toFixed(1)),
        my: parseFloat((mag * Math.sin(theta) * Math.sin(phi)).toFixed(1)),
        mz: parseFloat((mag * Math.cos(theta)).toFixed(1))
      };
    }));
  };

  // 3D Visualizer Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: Math.max(-95, Math.min(95, prev.x - dy * 0.5)),
      y: prev.y + dx * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Rotatable Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.38;

    const rx = rotation.x * Math.PI / 180;
    const ry = rotation.y * Math.PI / 180;

    const project = (fx: number, fy: number, fz: number) => {
      const dx = fx - 0.5;
      const dy = fy - 0.5;
      const dz = fz - 0.5;

      const x1 = dx * Math.cos(ry) - dz * Math.sin(ry);
      const z1 = dx * Math.sin(ry) + dz * Math.cos(ry);

      const y2 = dy * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = dy * Math.sin(rx) + z1 * Math.cos(rx);

      return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2 };
    };

    const elements: any[] = [];

    // Unit Cell edge vertices
    const vertices = [
      [0,0,0], [1,0,0], [0,1,0], [0,0,1],
      [1,1,0], [1,0,1], [0,1,1], [1,1,1]
    ];
    const edges = [
      [0,1], [0,2], [0,3],
      [1,4], [1,5], [2,4], [2,6], [3,5], [3,6],
      [7,4], [7,5], [7,6]
    ];

    edges.forEach(([v1, v2]) => {
      const p1 = vertices[v1];
      const p2 = vertices[v2];
      const proj1 = project(p1[0], p1[1], p1[2]);
      const proj2 = project(p2[0], p2[1], p2[2]);
      elements.push({
        type: 'edge',
        p1: proj1,
        p2: proj2,
        color: 'rgba(99, 102, 241, 0.25)',
        width: 1.5,
        z: (proj1.z + proj2.z) / 2
      });
    });

    // Metric axes
    const origin = project(0, 0, 0);
    const ax_a = project(0.4, 0, 0);
    const ax_b = project(0, 0.4, 0);
    const ax_c = project(0, 0, 0.4);

    elements.push({ type: 'axis', p1: origin, p2: ax_a, label: 'a', color: '#ef4444', z: origin.z });
    elements.push({ type: 'axis', p1: origin, p2: ax_b, label: 'b', color: '#10b981', z: origin.z });
    elements.push({ type: 'axis', p1: origin, p2: ax_c, label: 'c', color: '#3b82f6', z: origin.z });

    let tFactor = 1.0;
    if (temperature !== undefined && criticalTemp !== undefined && criticalTemp > 0) {
      if (temperature >= criticalTemp) {
        tFactor = 0.0;
      } else {
        tFactor = Math.pow(1 - temperature / criticalTemp, 0.36);
      }
    }

    // Atoms
    atoms.forEach((atom) => {
      const proj = project(atom.x, atom.y, atom.z);
      let color = '#a78bfa';
      if (atom.element === 'Fe') color = '#ef4444';
      else if (atom.element === 'Mn') color = '#f97316';
      else if (atom.element === 'Co') color = '#8b5cf6';
      else if (atom.element === 'Ni') color = '#06b6d4';
      else if (atom.element === 'Cu') color = '#10b981';
      else if (atom.element === 'Cr') color = '#eab308';

      elements.push({
        type: 'atom',
        p: proj,
        rawAtom: atom,
        radius: 12 + Math.abs(atom.b || 3) * 0.4,
        color: color,
        label: atom.label,
        mx: (atom.mx || 0) * tFactor,
        my: (atom.my || 0) * tFactor,
        mz: (atom.mz || 0) * tFactor,
        z: proj.z
      });
    });

    elements.sort((a, b) => b.z - a.z);

    elements.forEach((el) => {
      if (el.type === 'edge') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.stroke();
      } else if (el.type === 'axis') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = el.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(el.label, el.p2.x + 4, el.p2.y + 4);
      } else if (el.type === 'atom') {
        const grad = ctx.createRadialGradient(
          el.p.x - el.radius * 0.3, el.p.y - el.radius * 0.3, el.radius * 0.1,
          el.p.x, el.p.y, el.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, el.color);
        grad.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, el.radius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(el.label, el.p.x, el.p.y - el.radius - 4);

        const momentMag = Math.sqrt(el.mx*el.mx + el.my*el.my + el.mz*el.mz);
        if (momentMag > 0.05) {
          const arrowScale = 0.15;
          const destProj = project(el.rawAtom.x + el.mx * arrowScale, el.rawAtom.y + el.my * arrowScale, el.rawAtom.z + el.mz * arrowScale);

          ctx.beginPath();
          ctx.moveTo(el.p.x, el.p.y);
          ctx.lineTo(destProj.x, destProj.y);
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          const angle = Math.atan2(destProj.y - el.p.y, destProj.x - el.p.x);
          const headLength = 7;
          ctx.beginPath();
          ctx.moveTo(destProj.x, destProj.y);
          ctx.lineTo(destProj.x - headLength * Math.cos(angle - Math.PI / 6), destProj.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(destProj.x - headLength * Math.cos(angle + Math.PI / 6), destProj.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
        }
      }
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ROTATION X: ${Math.round(rotation.x)}° Y: ${Math.round(rotation.y)}°`, 10, 15);
    ctx.fillText('DRAG TO ORBIT CELLS', 10, 26);
  }, [atoms, rotation, temperature, criticalTemp]);

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);
      if (data.lattice) {
        setLattice({
          a: data.lattice.a || 4.0,
          b: data.lattice.b || data.lattice.a || 4.0,
          c: data.lattice.c || data.lattice.a || 4.0,
          alpha: data.lattice.alpha || 90,
          beta: data.lattice.beta || 90,
          gamma: data.lattice.gamma || 90
        });
      }
      if (data.kVector) {
        setKVector({
          x: data.kVector.x || 0,
          y: data.kVector.y || 0,
          z: data.kVector.z || 0
        });
      }
      if (data.atoms && Array.isArray(data.atoms)) {
        const newAtoms = data.atoms.map((a: any) => ({
          id: a.id || Date.now().toString() + Math.random(),
          element: a.element,
          label: a.label || a.element,
          b: a.b || NEUTRON_SCATTERING_LENGTHS[a.element] || 0,
          x: a.x,
          y: a.y,
          z: a.z,
          B_iso: a.B_iso || 0.5,
          mx: a.mx || 0,
          my: a.my || 0,
          mz: a.mz || 0,
          ion: a.ion || ''
        }));
        setAtoms(newAtoms);
      }
      setShowImport(false);
      setImportJson("");
      setImportError(null);
    } catch (e) {
      setImportError("Invalid JSON structure. Please check commas, quotes, and braces.");
    }
  };

  const loadPreset = (type: 'Ferro' | 'AntiFerro' | 'Ferrimagnetic' | 'Spiral') => {
    if (type === 'Ferro') {
      setLattice({ a: 2.87, b: 2.87, c: 2.87, alpha: 90, beta: 90, gamma: 90 }); 
      setAtoms([
        { id: '1', element: 'Fe', label: 'Fe', b: 9.45, x: 0, y: 0, z: 0, B_iso: 0.4, mx: 0, my: 0, mz: 2.2, ion: 'Fe3+' },
      ]);
    } else if (type === 'AntiFerro') {
      setLattice({ a: 4.0, b: 4.0, c: 4.0, alpha: 90, beta: 90, gamma: 90 });
      setAtoms([
        { id: '1', element: 'Mn', label: 'Mn (Up)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 0, mz: 5, ion: 'Mn2+' },
        { id: '2', element: 'Mn', label: 'Mn (Down)', b: -3.73, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -5, ion: 'Mn2+' },
      ]);
    } else if (type === 'Ferrimagnetic') {
      setLattice({ a: 8.39, b: 8.39, c: 8.39, alpha: 90, beta: 90, gamma: 90 }); // Magnetite-like
      setAtoms([
        { id: '1', element: 'Fe', label: 'Fe (Tet)', b: 9.45, x: 0.125, y: 0.125, z: 0.125, B_iso: 0.5, mx: 0, my: 0, mz: 4.0, ion: 'Fe3+' },
        { id: '2', element: 'Fe', label: 'Fe (Oct 1)', b: 9.45, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -4.0, ion: 'Fe2+' },
        { id: '3', element: 'Fe', label: 'Fe (Oct 2)', b: 9.45, x: 0.125, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -4.0, ion: 'Fe3+' },
      ]);
    } else if (type === 'Spiral') {
      setLattice({ a: 5.24, b: 5.24, c: 5.24, alpha: 90, beta: 90, gamma: 90 }); // Complex spiral-like
      setAtoms([
        { id: '1', element: 'Co', label: 'Co 1', b: 2.49, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 3.5, my: 0, mz: 0, ion: 'Co2+' },
        { id: '2', element: 'Co', label: 'Co 2', b: 2.49, x: 0.5, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 3.5, mz: 0, ion: 'Co2+' },
        { id: '3', element: 'Co', label: 'Co 3', b: 2.49, x: 0, y: 0.5, z: 0, B_iso: 0.5, mx: -3.5, my: 0, mz: 0, ion: 'Co2+' },
        { id: '4', element: 'Co', label: 'Co 4', b: 2.49, x: 0.5, y: 0.5, z: 0, B_iso: 0.5, mx: 0, my: -3.5, mz: 0, ion: 'Co2+' },
      ]);
    }
  };

  // Temperature influence factor
  let tempFactor = 1.0;
  if (temperature !== undefined && criticalTemp !== undefined && criticalTemp > 0) {
    if (temperature >= criticalTemp) {
      tempFactor = 0.0;
    } else {
      tempFactor = Math.pow(1 - temperature / criticalTemp, 0.36);
    }
  }

  // Magnetic computed values
  const cellVolume = calculateCellVolume ? calculateCellVolume(lattice) : (lattice.a * lattice.b * lattice.c);
  const totalB = atoms.reduce((acc, atom) => acc + (atom.b || 0), 0);
  const cellSLD = cellVolume > 0 ? (10 * totalB) / cellVolume : 0;

  // Net magnetic moment vector and its magnitude (temperature corrected)
  const netMx = atoms.reduce((acc, a) => acc + (a.mx || 0) * tempFactor, 0);
  const netMy = atoms.reduce((acc, a) => acc + (a.my || 0) * tempFactor, 0);
  const netMz = atoms.reduce((acc, a) => acc + (a.mz || 0) * tempFactor, 0);
  const netMomentMagnitude = Math.sqrt(netMx*netMx + netMy*netMy + netMz*netMz);

  // Total absolute moment in cell (temperature corrected)
  const sumAbsMoment = atoms.reduce((acc, a) => {
    const magnitude = Math.sqrt(((a.mx||0) * tempFactor)**2 + ((a.my||0) * tempFactor)**2 + ((a.mz||0) * tempFactor)**2);
    return acc + magnitude;
  }, 0);

  // Determine magnetic order classification (at 0K or simulated state)
  const sumAbsMoment0K = atoms.reduce((acc, a) => {
    const magnitude = Math.sqrt((a.mx||0)**2 + (a.my||0)**2 + (a.mz||0)**2);
    return acc + magnitude;
  }, 0);
  const netMx0K = atoms.reduce((acc, a) => acc + (a.mx || 0), 0);
  const netMy0K = atoms.reduce((acc, a) => acc + (a.my || 0), 0);
  const netMz0K = atoms.reduce((acc, a) => acc + (a.mz || 0), 0);
  const netMomentMagnitude0K = Math.sqrt(netMx0K*netMx0K + netMy0K*netMy0K + netMz0K*netMz0K);

  let orderType = 'Paramagnetic (PM)';
  let isNonCollinear = false;
  if (sumAbsMoment0K > 0.05) {
    const nonZeroMoments = atoms
      .map(a => [a.mx || 0, a.my || 0, a.mz || 0])
      .filter(v => Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2) > 0.05);

    if (nonZeroMoments.length >= 2) {
      const v0 = nonZeroMoments[0];
      const m0 = Math.sqrt(v0[0]**2 + v0[1]**2 + v0[2]**2);
      const n0 = m0 > 0 ? [v0[0]/m0, v0[1]/m0, v0[2]/m0] : [0, 0, 0];
      for (let i = 1; i < nonZeroMoments.length; i++) {
        const vi = nonZeroMoments[i];
        const mi = Math.sqrt(vi[0]**2 + vi[1]**2 + vi[2]**2);
        const ni = mi > 0 ? [vi[0]/mi, vi[1]/mi, vi[2]/mi] : [0, 0, 0];
        // Check angle/alignment
        const dot = n0[0]*ni[0] + n0[1]*ni[1] + n0[2]*ni[2];
        if (Math.abs(Math.abs(dot) - 1) > 0.05) {
          isNonCollinear = true;
          break;
        }
      }
    }

    if (temperature >= criticalTemp) {
      orderType = `Paramagnetic (Fluctuations above T_c=${criticalTemp}K)`;
    } else if (netMomentMagnitude0K < 0.05) {
      orderType = isNonCollinear ? 'Spiral Helimagnetic' : 'Antiferromagnetic (AFM)';
    } else if (Math.abs(netMomentMagnitude0K - sumAbsMoment0K) < 0.05) {
      orderType = 'Ferromagnetic (FM)';
    } else {
      orderType = 'Ferrimagnetic (FiM) / Canted';
    }
  }

  // Curie-Weiss paramagnetism simulation points
  const getCurieWeissPoints = () => {
    const thetaCW = orderType.includes('Ferro') || orderType.includes('FM')
      ? 0.9 * criticalTemp 
      : (orderType.includes('Anti') || orderType.includes('AFM') || orderType.includes('Spiral') ? -0.5 * criticalTemp : 0.2 * criticalTemp);
    
    const sumSqMoments = atoms.reduce((acc, a) => {
      const mag = (a.mx||0)**2 + (a.my||0)**2 + (a.mz||0)**2;
      return acc + mag;
    }, 0);
    const C = Math.max(0.1, 0.125 * sumSqMoments);

    const points = [];
    const tMin = Math.max(1, criticalTemp + 10);
    const tMax = tMin + 400;
    const steps = 40;
    const stepSize = (tMax - tMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const T = tMin + i * stepSize;
      const chi = C / (T - thetaCW);
      points.push({
        T: parseFloat(T.toFixed(0)),
        chi: parseFloat(chi.toFixed(5)),
        invChi: parseFloat((1 / chi).toFixed(2)),
        linearFit: parseFloat(((T - thetaCW) / C).toFixed(2))
      });
    }
    return { points, thetaCW, C };
  };

  const curieWeiss = getCurieWeissPoints();

  // Debye-Scherrer powder rings canvas effect
  useEffect(() => {
    const canvas = ringsCanvasRef.current;
    if (!canvas || visTab !== 'rings') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background: dark space look
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Center beam stop (classical detector design)
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Beam stop outline/lead cup shadow
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale parameter for rings
    const scaleFactor = width / 2.3;

    results.forEach((r) => {
      let intensity = r.totalIntensity;
      let color = 'rgba(129, 140, 248, 0.45)'; // Indigo for total
      if (ringRenderMode === 'nuclear') {
        intensity = r.nuclearIntensity;
        color = 'rgba(148, 163, 184, 0.45)'; // Slate for nuclear
      } else if (ringRenderMode === 'magnetic') {
        intensity = r.magneticIntensity;
        color = 'rgba(236, 72, 153, 0.45)'; // Pink for magnetic
      }

      if (intensity < 0.1) return;

      const twoThetaRad = (r.twoTheta / 2) * (Math.PI / 180);
      if (r.twoTheta >= 90) return; // falls out of front plate detector

      const R = scaleFactor * Math.tan(twoThetaRad * 2);
      if (R <= 0 || R > width) return;

      // Draw the main blurred ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      const alpha = 0.1 + (intensity / 100) * 0.7;
      ctx.strokeStyle = color.replace('0.45', alpha.toString());
      ctx.lineWidth = 1.0 + (intensity / 100) * 3;
      ctx.stroke();

      // Add spotty graininess (powder speckles)
      const spotCount = Math.floor(intensity * 1.8);
      ctx.fillStyle = color.replace('0.45', '0.9');
      for (let s = 0; s < spotCount; s++) {
        const angle = Math.random() * 2 * Math.PI;
        const rDev = (Math.random() - 0.5) * (1.2 + (intensity / 100) * 1.5);
        const sx = cx + (R + rDev) * Math.cos(angle);
        const sy = cy + (R + rDev) * Math.sin(angle);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
    });

    // Label for the center beam stop
    ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEUTRON BEAM STOP', cx, cy - 10);
  }, [results, visTab, ringRenderMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl border border-indigo-500/30">
                <Atom className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Magnetic Cell</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Spin Structure Modeler</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImport(true)}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-colors"
                title="Import Structure"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
              </button>
              <button 
                onClick={handleExport}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition-colors"
                title="Export Structure"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-8 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'Ferro', label: 'Ferro' },
              { id: 'AntiFerro', label: 'Anti-Ferro' },
              { id: 'Ferrimagnetic', label: 'Ferrimagnetic' },
              { id: 'Spiral', label: 'Spiral Pinwheel' }
            ].map(p => (
              <button 
                key={p.id}
                onClick={() => loadPreset(p.id as any)} 
                className="px-4 py-1.5 bg-slate-950/40 border border-slate-800 rounded-xl transition-all hover:bg-slate-800 hover:border-slate-700 group shrink-0"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{p.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showImport && (
              <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-800 relative text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Import Magnetic Structure</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Paste Structure JSON with Moments</p>
                  
                  {importError && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono font-medium leading-relaxed">
                      ⚠ {importError}
                    </div>
                  )}

                  <textarea
                    value={importJson}
                    onChange={(e) => {
                      setImportJson(e.target.value);
                      if (importError) setImportError(null);
                    }}
                    placeholder='{"lattice": {"a": 4.0}, "atoms": [{"element": "Mn", "mx": 0, "mz": 4, ...}]}'
                    className="w-full h-48 p-4 bg-black/40 border border-slate-800 rounded-2xl font-mono text-xs mb-6 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300 resize-none"
                  />
                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => {
                        setShowImport(false);
                        setImportError(null);
                      }}
                      className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleImport}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.2)] transition-all active:scale-95"
                    >
                      Load Data
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Wavelength (Å)</label>
                   <div className="relative group">
                     <input
                      type="number"
                      step="0.01"
                      value={wavelength}
                      onChange={(e) => setWavelength(parseFloat(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-950/50 text-indigo-400 border border-slate-800 rounded-2xl text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-700 uppercase tracking-widest">Å</span>
                   </div>
                   <div className="mt-3 grid grid-cols-2 gap-2">
                     {Object.entries(NEUTRON_WAVELENGTHS).map(([name, val]) => (
                       <button
                         key={name}
                         onClick={() => setWavelength(val)}
                         className={`py-1.5 px-2 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all
                           ${wavelength === val 
                             ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                             : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-400 hover:border-slate-700'
                           }
                         `}
                       >
                         {name.replace(' (avg)', '')}
                       </button>
                     ))}
                   </div>
                </div>
                           <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {['a', 'b', 'c'].map((axis) => (
                      <div key={axis} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{axis} (Å)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lattice[axis as keyof LatticeParameters]}
                          onChange={(e) => setLattice({ ...lattice, [axis]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-950/50 text-indigo-400 border border-slate-800 rounded-xl text-xs font-black font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['alpha', 'beta', 'gamma'].map((angle) => (
                      <div key={angle} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          {angle === 'alpha' ? 'α' : angle === 'beta' ? 'β' : 'γ'}°
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={lattice[angle as keyof LatticeParameters]}
                          onChange={(e) => setLattice({ ...lattice, [angle]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-950/50 text-indigo-400 border border-slate-800 rounded-xl text-xs font-black font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Propagation vector wave vector k */}
              <div className="space-y-1.5 p-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Propagation Wave Vector (k)</label>
                  <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Satellites</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['kx', 'ky', 'kz'].map((comp, idx) => {
                    const keys = ['x', 'y', 'z'] as const;
                    const key = keys[idx];
                    return (
                      <div key={comp} className="space-y-1">
                        <span className="text-[8px] text-slate-500 font-black px-1 uppercase tracking-widest">{comp}</span>
                        <input
                          type="number"
                          step="0.05"
                          value={kVector[key]}
                          onChange={(e) => setKVector({ ...kVector, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 font-mono text-[11px] font-black rounded-lg outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { label: 'Commensurate [0 0 0]', val: { x: 0, y: 0, z: 0 } },
                    { label: 'AFM Doubling [0 0 0.5]', val: { x: 0, y: 0, z: 0.5 } },
                    { label: 'C-axis Wave [0 0 0.15]', val: { x: 0, y: 0, z: 0.15 } },
                    { label: 'Incommensurate [0.1 0.1 0]', val: { x: 0.1, y: 0.1, z: 0 } }
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setKVector(preset.val)}
                      className={`px-2 py-1 text-[8px] font-mono rounded border transition-all shrink-0
                        ${kVector.x === preset.val.x && kVector.y === preset.val.y && kVector.z === preset.val.z
                          ? 'bg-indigo-550/20 border-indigo-500/40 text-indigo-400 font-bold'
                          : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-400 hover:border-slate-700'
                        }
                      `}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Environment (T & Polarization) */}
              <div className="space-y-4 p-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Simulation Environment</label>
                  <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Active Physics</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Temperature Control */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Temperature T: <span className="text-indigo-400 font-mono font-black">{temperature} K</span></span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="600"
                      value={temperature}
                      onChange={(e) => setTemperature(parseInt(e.target.value))}
                      className="w-full accent-indigo-550 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Critical Temperature */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Néel/Curie Temp T_c:</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={criticalTemp}
                        onChange={(e) => setCriticalTemp(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 font-mono text-[11px] font-black rounded-lg outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 font-black">K</span>
                    </div>
                  </div>
                </div>

                {/* Neutron Polarization State */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Neutron Polarization Vector (P)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'Unpolarized', desc: 'I_tot = I_n + I_m' },
                      { id: 'up', label: 'Polarized Up (+z)', desc: 'Interference constructive' },
                      { id: 'down', label: 'Polarized Down (-z)', desc: 'Interference destructive' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPolarizationMode(p.id as any)}
                        className={`px-2 py-1.5 rounded-xl border text-left transition-all flex flex-col justify-between h-[42px]
                          ${polarizationMode === p.id
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 font-bold'
                            : 'bg-black/20 border-slate-850 text-slate-500 hover:text-slate-400 hover:border-slate-700'
                          }
                        `}
                      >
                        <span className="text-[9px] font-black uppercase tracking-tight leading-none">{p.label}</span>
                        <span className="text-[7px] text-slate-600 font-bold truncate mt-0.5">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/50 pt-8">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Magnetic Basis</h4>
                 </div>
                 <button
                   onClick={handleAddAtom}
                   className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-[9px] font-black uppercase tracking-wider text-white rounded-xl transition-all"
                 >
                   <Plus className="w-3 h-3 mr-1" /> ADD ATOM
                 </button>
               </div>
               
               <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                 {atoms.map((atom) => (
                   <div key={atom.id} className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/80 group/atom hover:border-slate-700 transition-colors">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={atom.label}
                            onChange={(e) => updateAtom(atom.id, 'label', e.target.value)}
                            className="bg-transparent border-b border-dashed border-slate-700 focus:border-indigo-500 font-black text-xs text-white outline-none py-0.5 w-32"
                          />
                          <span className="text-[8.5px] font-bold text-slate-500 bg-black/40 px-1.5 py-0.5 border border-slate-850 rounded">b={atom.b} fm</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           {/* Small vector indicator */}
                           <div className="flex items-center gap-1 bg-black/20 p-1 rounded-md border border-slate-800">
                              <Move className="w-3 h-3 text-indigo-400" style={{ transform: `rotate(${Math.atan2(atom.my, atom.mx) * (180/Math.PI)}deg)` }} />
                              <span className="text-[8px] font-mono font-black text-slate-500">M={Math.sqrt((atom.mx||0)**2 + (atom.my||0)**2 + (atom.mz||0)**2).toFixed(1)}</span>
                           </div>

                           {atoms.length > 1 && (
                             <button
                               onClick={() => handleDeleteAtom(atom.id)}
                               className="p-1 px-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                               title="Delete Atom"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Element</label>
                         <select 
                           value={atom.element}
                           onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                           className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                         >
                           {Object.keys(NEUTRON_SCATTERING_LENGTHS).sort().map(el => (
                             <option key={el} value={el}>{el}</option>
                           ))}
                         </select>
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Magnetic Ion</label>
                         <select 
                           value={atom.ion || ''}
                           onChange={(e) => updateAtom(atom.id, 'ion', e.target.value)}
                           className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                         >
                           <option value="">Generic</option>
                           {Object.keys(MAGNETIC_FORM_FACTORS).sort().map(ion => (
                             <option key={ion} value={ion}>{ion}</option>
                           ))}
                         </select>
                       </div>
                     </div>

                     <div className="grid grid-cols-3 gap-3 mb-4">
                           <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-600 px-1 uppercase tracking-widest">x</label><input type="number" step="0.05" value={atom.x} onChange={(e) => updateAtom(atom.id, 'x', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 text-white border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] font-black focus:border-slate-600 outline-none transition-all"/></div>
                           <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-600 px-1 uppercase tracking-widest">y</label><input type="number" step="0.05" value={atom.y} onChange={(e) => updateAtom(atom.id, 'y', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 text-white border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] font-black focus:border-slate-600 outline-none transition-all"/></div>
                           <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-600 px-1 uppercase tracking-widest">z</label><input type="number" step="0.05" value={atom.z} onChange={(e) => updateAtom(atom.id, 'z', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 text-white border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] font-black focus:border-slate-600 outline-none transition-all"/></div>
                     </div>

                     <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Moment Vector (μB)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           <div className="space-y-1"><span className="text-[8px] text-indigo-500/60 font-black px-1 uppercase tracking-widest">Mx (μB)</span><input type="number" step="0.1" value={atom.mx} onChange={(e) => updateAtom(atom.id, 'mx', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-1 font-mono text-[11px] font-black focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"/></div>
                           <div className="space-y-1"><span className="text-[8px] text-indigo-500/60 font-black px-1 uppercase tracking-widest">My (μB)</span><input type="number" step="0.1" value={atom.my} onChange={(e) => updateAtom(atom.id, 'my', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-1 font-mono text-[11px] font-black focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"/></div>
                           <div className="space-y-1"><span className="text-[8px] text-indigo-500/60 font-black px-1 uppercase tracking-widest">Mz (μB)</span><input type="number" step="0.1" value={atom.mz} onChange={(e) => updateAtom(atom.id, 'mz', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-1 font-mono text-[11px] font-black focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"/></div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Rotatable 3D Spin and Lattice Visualizer Card */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-500/15 rounded-xl border border-pink-500/20">
                <Layers className="w-4.5 h-4.5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">3D Spin & Lattice Visualizer</h4>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Interactive Magnetic Vector Array</p>
              </div>
            </div>
            <button
              onClick={() => setRotation({ x: 25, y: -45 })}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 hover:text-white rounded-xl text-[8px] text-slate-400 font-mono flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3 h-3 text-slate-500" /> RESET VIEW
            </button>
          </div>

          <div className="relative bg-black/40 rounded-2xl border border-slate-800/80 overflow-hidden cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-[220px] block"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Spins Quick-Align operations</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => alignSpinsAxis('z', 4.0)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[8px] font-mono text-slate-300 rounded"
              >
                ALIGN ALL Z+
              </button>
              <button
                type="button"
                onClick={() => {
                  setAtoms(atoms.map((a, idx) => ({ ...a, mx: 0, my: 0, mz: idx % 2 === 0 ? 4.0 : -4.0 })));
                }}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[8px] font-mono text-slate-300 rounded"
              >
                AFM COLLINEAR (+/-)
              </button>
              <button
                type="button"
                onClick={invertSpins}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[8px] font-mono text-slate-300 rounded"
              >
                INVERT ALL SPINS
              </button>
              <button
                type="button"
                onClick={randomizeSpins}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[8px] font-mono text-slate-300 rounded"
              >
                RANDOM SPHERICAL
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0B1228] p-6 rounded-3xl border border-indigo-500/15 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
           
           <div className="flex items-center gap-3 mb-5 relative z-10 text-left">
             <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
               <Database className="w-4 h-4 text-indigo-400" />
             </div>
             <div>
               <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Magnetic Physical Signatures</h4>
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">Computed Unit Cell Properties</span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 relative z-10 text-left">
             <div className="bg-[#070C18]/80 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Cell Volume</span>
                <span className="text-xs font-mono font-black text-indigo-400 block mt-1">{cellVolume.toFixed(2)} <span className="text-[9px] text-slate-600 font-sans font-bold">Å³</span></span>
             </div>
             
             <div className="bg-[#070C18]/80 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Magnetic Phase</span>
                <span className="text-xs font-bold text-amber-400 block mt-1 truncate" title={orderType}>{orderType}</span>
             </div>

             <div className="bg-[#070C18]/80 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Nuclear SLD</span>
                <span className="text-xs font-mono font-black text-cyan-400 block mt-1">{cellSLD.toFixed(3)} <span className="text-[8px] text-slate-600 font-sans font-bold">10⁻⁶Å⁻²</span></span>
             </div>

             <div className="bg-[#070C18]/80 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Net Moment |M|</span>
                <span className="text-xs font-mono font-black text-rose-400 block mt-1">{netMomentMagnitude.toFixed(2)} <span className="text-[9px] text-slate-600 font-sans font-bold">μB</span></span>
             </div>
           </div>

           {/* Vector orientation breakdown */}
           <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-2xl relative z-10 text-left">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Net Spin vector components</span>
             <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
               <div className="bg-slate-900/40 p-1.5 rounded-lg border border-white/5">
                 <span className="block text-[8px] text-slate-500 font-sans uppercase">Mx</span>
                 <span className="text-slate-300 font-black">{netMx.toFixed(2)} μB</span>
               </div>
               <div className="bg-slate-900/40 p-1.5 rounded-lg border border-white/5">
                 <span className="block text-[8px] text-slate-500 font-sans uppercase">My</span>
                 <span className="text-slate-300 font-black">{netMy.toFixed(2)} μB</span>
               </div>
               <div className="bg-slate-900/40 p-1.5 rounded-lg border border-white/5">
                 <span className="block text-[8px] text-slate-500 font-sans uppercase">Mz</span>
                 <span className="text-slate-300 font-black">{netMz.toFixed(2)} μB</span>
               </div>
             </div>
           </div>

           <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-400 leading-normal relative z-10 text-left select-none">
             <strong>Interaction Parameter:</strong> Magnetic scattering occurs selectively if the magnetic moment runs <strong>perpendicular</strong> to the scattering vector Q. This enables neutron spectrometers to resolve complex collinear AFM structures and spiral spin arrays.
           </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        
        <ScientificMathControl
          title="Curie-Weiss Magnetic Susceptibility"
          formula="\chi = \frac{C}{T - \theta_p}"
          description="Verify the paramagnetic susceptibility as a function of temperature above the magnetic ordering critical point."
          variables={[
            { symbol: 'C', name: 'Curie Constant', value: curieWeiss.C, unit: 'emu·K/mol' },
            { symbol: 'T', name: 'Temperature T', value: 300, unit: 'K' },
            { symbol: 'θ_p', name: 'Paramagnetic Curie Temp (θ_p)', value: curieWeiss.thetaCW, unit: 'K' }
          ]}
          result={300 - curieWeiss.thetaCW !== 0 ? curieWeiss.C / (300 - curieWeiss.thetaCW) : 0}
          resultUnit="emu/mol"
          resultName="Susceptibility (χ)"
        />

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 h-[420px] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Tab Selection */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 relative z-10 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
              {[
                { id: 'chart', label: 'Diffraction Spectrum' },
                { id: 'rings', label: '2D Powder Rings' },
                { id: 'susceptibility', label: 'Curie-Weiss Susceptibility' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVisTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all
                    ${visTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {visTab === 'chart' && (
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-slate-500" />
                   <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">Nuclear</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                   <span className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest">Magnetic</span>
                 </div>
              </div>
            )}

            {visTab === 'rings' && (
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-850">
                <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest mr-1">View:</span>
                {[
                  { id: 'total', label: 'Total' },
                  { id: 'nuclear', label: 'Nuclear' },
                  { id: 'magnetic', label: 'Magnetic' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setRingRenderMode(mode.id as any)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight transition-all
                      ${ringRenderMode === mode.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                      }
                    `}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
            {visTab === 'chart' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={results} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="twoTheta" 
                    label={{ value: '2\u03b8 (deg)', position: 'bottom', fill: '#64748b', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}
                    type="number"
                    domain={[0, 'auto']}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis hide/>
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as MagneticResult;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-800 pb-2">
                               Reflection Profile: {d.label || `(${d.hkl.join(' ')})`}
                            </p>
                            <div className="space-y-2 mt-1">
                               <div className="flex justify-between items-center gap-8">
                                  <span className="text-[11px] font-bold text-slate-400">Nuclear Intensity</span>
                                  <span className="text-xs font-mono font-black text-slate-200">{d.nuclearIntensity.toFixed(1)}</span>
                               </div>
                               <div className="flex justify-between items-center gap-8">
                                  <span className="text-[11px] font-bold text-indigo-400">Magnetic Intensity</span>
                                  <span className="text-xs font-mono font-black text-indigo-405">{d.magneticIntensity.toFixed(1)}</span>
                               </div>
                               <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-8">
                                  <span className="text-[11px] font-black text-white font-sans">Total Intensity</span>
                                  <span className="text-sm font-mono font-black text-white">{d.totalIntensity.toFixed(1)}</span>
                                </div>
                               {polarizationMode !== 'none' && (
                                 <div className="text-[9px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/15 mt-1 text-center">
                                   Polarization interference active
                                 </div>
                               )}
                               <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800/40">
                                  <span>2\u03b8 = {d.twoTheta.toFixed(2)}\u00b0</span>
                                  <span>d = {d.dSpacing.toFixed(3)} \u00c5</span>
                               </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="nuclearIntensity" stackId="a" fill="#475569" name="Nuclear" barSize={8} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="magneticIntensity" stackId="a" fill="#6366f1" name="Magnetic" barSize={8} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {visTab === 'rings' && (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <canvas 
                  ref={ringsCanvasRef} 
                  className="w-full h-full max-w-[280px] max-h-[280px] rounded-2xl shadow-inner border border-slate-800/50 bg-[#090d16] cursor-crosshair"
                />
                <div className="absolute bottom-2 left-2 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/60 p-1.5 rounded border border-slate-850/50">
                  2D Detector Plate Projector
                </div>
              </div>
            )}

            {visTab === 'susceptibility' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={curieWeiss.points} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="T" 
                    label={{ value: 'Temperature T (K)', position: 'bottom', fill: '#64748b', fontSize: 10, fontWeight: 900, offset: 10 }}
                    tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#818cf8', fontSize: 9, fontWeight: 750 }}
                    label={{ value: 'Susceptibility \u03c7 (emu/mol\u00b7Oe)', angle: -90, position: 'left', fill: '#818cf8', fontSize: 9, fontWeight: 800, offset: -5 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#f43f5e', fontSize: 9, fontWeight: 750 }}
                    label={{ value: 'Inverse Susceptibility 1/\u03c7', angle: 90, position: 'right', fill: '#f43f5e', fontSize: 9, fontWeight: 800, offset: 5 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-800 pb-2">
                               Paramagnetic State Info
                            </p>
                            <div className="space-y-1 mt-1.5 text-xs">
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-slate-500">T =</span>
                                <span className="font-mono font-black text-white">{payload[0].payload.T} K</span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-indigo-400">\u03c7 =</span>
                                <span className="font-mono font-black text-indigo-400">{payload[0].payload.chi.toFixed(5)}</span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-rose-400">1/\u03c7 =</span>
                                <span className="font-mono font-black text-rose-400">{payload[0].payload.invChi}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Line yAxisId="left" type="monotone" dataKey="chi" stroke="#818cf8" name="Susceptibility \u03c7" dot={false} strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="invChi" stroke="#f43f5e" name="Inverse 1/\u03c7" dot={false} strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="linearFit" stroke="#fda4af" name="Curie-Weiss Linear Fit" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex flex-col max-h-[450px]">
          <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Reflections Manifest
             </h3>
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Calculated Intensity Spectrum</span>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
             <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-800">
                   <tr>
                      <th className="px-6 py-4 font-black">Plane Index</th>
                      <th className="px-6 py-4 font-black text-right">Position (2θ)</th>
                      <th className="px-6 py-4 font-black text-right">d-Spacing</th>
                      <th className="px-6 py-4 font-black text-right text-slate-500">Nuc</th>
                      <th className="px-6 py-4 font-black text-right text-indigo-400">Mag</th>
                      <th className="px-6 py-4 font-black text-right text-white">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                   {results.map((r, i) => (
                      <tr key={`${r.twoTheta}-${i}`} className="bg-transparent hover:bg-slate-800/40 transition-colors group">
                         <td className="px-6 py-3.5 font-mono font-black text-slate-200 group-hover:text-white transition-colors">
                           <span className="opacity-40">[</span>{r.hkl.join(' ')}<span className="opacity-40">]</span>
                           {r.label && r.label.includes('k') && (
                             <span className="ml-2 px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black rounded font-sans uppercase">
                               Satellite
                             </span>
                           )}
                           <div className="text-[9px] text-slate-500 font-semibold font-sans mt-0.5 whitespace-pre">
                             {r.label || `Plane [${r.hkl.join(' ')}]`}
                           </div>
                         </td>
                         <td className="px-6 py-3.5 text-right text-slate-400 font-bold font-mono">{r.twoTheta.toFixed(2)}°</td>
                         <td className="px-6 py-3.5 text-right text-slate-500 font-bold font-mono">{r.dSpacing.toFixed(3)} Å</td>
                         <td className="px-6 py-3.5 text-right text-slate-400 font-bold font-mono">{r.nuclearIntensity.toFixed(1)}</td>
                         <td className="px-6 py-3.5 text-right font-mono text-indigo-400 font-black bg-indigo-500/5">{r.magneticIntensity.toFixed(1)}</td>
                         <td className="px-6 py-3.5 text-right font-black text-white">{r.totalIntensity.toFixed(1)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};