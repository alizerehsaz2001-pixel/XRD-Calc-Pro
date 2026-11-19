import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db, useAuth } from '../services/firebase';
import { MATERIAL_DB } from '../utils/materialDB';
import { saveOfflineMaterial } from '../utils/offlineDb';

export type CustomCrystalSystem =
  | 'Cubic'
  | 'Tetragonal'
  | 'Hexagonal'
  | 'Trigonal'
  | 'Orthorhombic'
  | 'Monoclinic'
  | 'Triclinic'
  | 'Amorphous';

export type CustomCentering = 'P' | 'I' | 'F' | 'C' | 'R';

export interface CustomMaterialPeak {
  twoTheta: number;
  intensity: number;
  fwhm: number;
  h: number;
  k: number;
  l: number;
  dSpacing?: number;
}

export interface UserCustomMaterial {
  id: string;
  name: string;
  formula: string;
  category: string;
  description: string;
  crystalSystem: CustomCrystalSystem;
  centering: CustomCentering;
  spaceGroup: string;
  spaceGroupNumber: number;
  zValue: number;
  lattice: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  };
  density: number;
  molecularWeight: number;
  youngsModulusGPa: number;
  poissonRatio: number;
  rir: number;
  massAttenuation: number;
  crystalliteSizeNm: number;
  microstrain: number;
  wavelength: number;
  etaMix: number;
  preferredR: number;
  preferredAxis: string;
  residualStressMPa: number;
  filmThicknessNm: number;
  roughnessNm: number;
  sldXray: number;
  scatteringLengthFm: number;
  magneticMomentMuB: number;
  propagationVector: { x: number; y: number; z: number };
  neelTempK: number;
  nearestNeighborA: number;
  peaks: CustomMaterialPeak[];
  updatedAt: string;
  isCustom: true;
}

const STORAGE_KEY = 'xrd_user_custom_materials_v1';
const ACTIVE_KEY = 'xrd_active_custom_material_id_v1';
const SUITE_DB_KEY = 'crystal_suite_materials_v1';

export function computeUnitCellVolume(lattice: UserCustomMaterial['lattice']): number {
  const { a, b, c, alpha, beta, gamma } = lattice;
  const ar = (alpha * Math.PI) / 180;
  const br = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const ca = Math.cos(ar);
  const cb = Math.cos(br);
  const cg = Math.cos(gr);
  const under = Math.max(1e-9, 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg);
  return a * b * c * Math.sqrt(under);
}

export function computeTheoreticalDensity(
  zValue: number,
  molecularWeight: number,
  lattice: UserCustomMaterial['lattice']
): number {
  const vol = computeUnitCellVolume(lattice);
  if (vol <= 0 || zValue <= 0 || molecularWeight <= 0) return 0;
  return (zValue * molecularWeight) / (0.602214076 * vol);
}

function isSystematicAllowed(h: number, k: number, l: number, centering: CustomCentering): boolean {
  if (h === 0 && k === 0 && l === 0) return false;
  switch (centering) {
    case 'I':
      return (h + k + l) % 2 === 0;
    case 'F': {
      const p1 = Math.abs(h % 2);
      const p2 = Math.abs(k % 2);
      const p3 = Math.abs(l % 2);
      return p1 === p2 && p2 === p3;
    }
    case 'C':
      return (h + k) % 2 === 0;
    case 'R':
      return ((-h + k + l) % 3 + 3) % 3 === 0;
    case 'P':
    default:
      return true;
  }
}

function computeDSpacing(
  h: number,
  k: number,
  l: number,
  lattice: UserCustomMaterial['lattice']
): number {
  const { a, b, c, alpha, beta, gamma } = lattice;
  const ar = (alpha * Math.PI) / 180;
  const br = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const ca = Math.cos(ar);
  const cb = Math.cos(br);
  const cg = Math.cos(gr);
  const sa = Math.sin(ar);
  const sb = Math.sin(br);
  const sg = Math.sin(gr);

  const volFactor = 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg;
  if (volFactor <= 1e-9) return 0;

  const s11 = b * b * c * c * sa * sa;
  const s22 = a * a * c * c * sb * sb;
  const s33 = a * a * b * b * sg * sg;
  const s12 = a * b * c * c * (ca * cb - cg);
  const s23 = a * a * b * c * (cb * cg - ca);
  const s13 = a * b * b * c * (cg * ca - cb);

  const v2 = a * a * b * b * c * c * volFactor;
  const invD2 =
    (s11 * h * h +
      s22 * k * k +
      s33 * l * l +
      2 * s12 * h * k +
      2 * s23 * k * l +
      2 * s13 * h * l) /
    v2;

  return invD2 > 1e-12 ? 1 / Math.sqrt(invD2) : 0;
}

export function generateBraggPeaksFromLattice(params: {
  crystalSystem: CustomCrystalSystem;
  centering: CustomCentering;
  lattice: UserCustomMaterial['lattice'];
  wavelength: number;
  crystalliteSizeNm: number;
  microstrain: number;
  maxPeaks?: number;
}): CustomMaterialPeak[] {
  const {
    crystalSystem,
    centering,
    lattice,
    wavelength,
    crystalliteSizeNm,
    microstrain,
    maxPeaks = 10,
  } = params;

  if (crystalSystem === 'Amorphous') {
    return [
      { twoTheta: 21.5, intensity: 100, fwhm: 4.8, h: 1, k: 0, l: 0, dSpacing: wavelength / (2 * Math.sin((10.75 * Math.PI) / 180)) },
      { twoTheta: 42.0, intensity: 35, fwhm: 6.2, h: 2, k: 0, l: 0, dSpacing: wavelength / (2 * Math.sin((21.0 * Math.PI) / 180)) },
    ];
  }

  const maxIdx = lattice.a > 7 || lattice.c > 9 ? 5 : 4;
  const buckets = new Map<string, { twoTheta: number; d: number; h: number; k: number; l: number; mult: number }>();

  for (let h = 0; h <= maxIdx; h++) {
    for (let k = -maxIdx; k <= maxIdx; k++) {
      if (crystalSystem === 'Cubic' && k < 0) continue;
      if (crystalSystem === 'Cubic' && k > h) continue;
      for (let l = -maxIdx; l <= maxIdx; l++) {
        if ((crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Orthorhombic') && l < 0) continue;
        if (crystalSystem === 'Cubic' && l > k) continue;
        if (h === 0 && k < 0) continue;
        if (h === 0 && k === 0 && l <= 0) continue;
        if (!isSystematicAllowed(h, k, l, centering)) continue;

        const d = computeDSpacing(h, k, l, lattice);
        if (d <= 0) continue;
        const sinT = wavelength / (2 * d);
        if (sinT <= 0.1 || sinT >= 0.92) continue;
        const twoTheta = (2 * Math.asin(sinT) * 180) / Math.PI;
        if (twoTheta < 14 || twoTheta > 118) continue;

        const key = twoTheta.toFixed(2);
        const existing = buckets.get(key);
        if (existing) {
          existing.mult += 1;
        } else {
          buckets.set(key, { twoTheta, d, h: Math.abs(h), k: Math.abs(k), l: Math.abs(l), mult: 1 });
        }
      }
    }
  }

  const sorted = Array.from(buckets.values())
    .sort((a, b) => a.twoTheta - b.twoTheta)
    .slice(0, maxPeaks);

  const K = 0.9;
  const safeD = Math.max(3, crystalliteSizeNm);
  const safeStrain = Math.max(0, microstrain);
  const instFwhm = 0.075;

  const rawPeaks = sorted.map((b, idx) => {
    const thetaRad = ((b.twoTheta / 2) * Math.PI) / 180;
    const cosT = Math.max(0.15, Math.cos(thetaRad));
    const tanT = Math.tan(thetaRad);
    const betaSizeDeg = ((K * wavelength) / (safeD * 10 * cosT)) * (180 / Math.PI);
    const betaStrainDeg = (4 * safeStrain * tanT) * (180 / Math.PI);
    const totalFwhm = Math.sqrt(betaSizeDeg * betaSizeDeg + betaStrainDeg * betaStrainDeg + instFwhm * instFwhm);

    // Lorentz-polarization + multiplicity approximate relative intensity
    const lp = (1 + Math.pow(Math.cos(2 * thetaRad), 2)) / (Math.sin(thetaRad) * Math.sin(thetaRad) * cosT);
    const formDecay = Math.exp(-0.32 * (Math.sin(thetaRad) / wavelength) ** 2);
    const rawInt = lp * formDecay * (1 + b.mult * 0.45) * (idx === 0 ? 1.2 : 1.0);

    return {
      twoTheta: Number(b.twoTheta.toFixed(3)),
      rawInt,
      fwhm: Number(Math.max(0.08, Math.min(3.5, totalFwhm)).toFixed(3)),
      h: b.h,
      k: b.k,
      l: b.l,
      dSpacing: Number(b.d.toFixed(4)),
    };
  });

  const maxInt = Math.max(1e-6, ...rawPeaks.map((p) => p.rawInt));
  return rawPeaks.map((p) => ({
    twoTheta: p.twoTheta,
    intensity: Number(Math.max(6, (p.rawInt / maxInt) * 100).toFixed(1)),
    fwhm: p.fwhm,
    h: p.h,
    k: p.k,
    l: p.l,
    dSpacing: p.dSpacing,
  }));
}

export function formatCustomMaterialPattern(mat: UserCustomMaterial): string {
  return mat.peaks
    .map((p) => `${p.twoTheta.toFixed(3)}, ${p.intensity.toFixed(1)}`)
    .join('\n');
}

export function buildStarterCustomMaterials(): UserCustomMaterial[] {
  const lsmLattice = { a: 3.872, b: 3.872, c: 3.872, alpha: 90, beta: 90, gamma: 90 };
  const lsmPeaks = generateBraggPeaksFromLattice({
    crystalSystem: 'Cubic',
    centering: 'P',
    lattice: lsmLattice,
    wavelength: 1.54056,
    crystalliteSizeNm: 28,
    microstrain: 0.0018,
    maxPeaks: 8,
  });

  const heaLattice = { a: 3.572, b: 3.572, c: 3.572, alpha: 90, beta: 90, gamma: 90 };
  const heaPeaks = generateBraggPeaksFromLattice({
    crystalSystem: 'Cubic',
    centering: 'F',
    lattice: heaLattice,
    wavelength: 1.54056,
    crystalliteSizeNm: 22,
    microstrain: 0.0026,
    maxPeaks: 7,
  });

  return [
    {
      id: 'custom_lsm_perovskite',
      name: 'Custom LSMO Perovskite',
      formula: 'La0.8Sr0.2MnO3',
      category: 'Perovskites & Photovoltaics',
      description: 'User-customizable Sr-doped lanthanum manganite cathode / spintronic perovskite.',
      crystalSystem: 'Cubic',
      centering: 'P',
      spaceGroup: 'Pm-3m',
      spaceGroupNumber: 221,
      zValue: 1,
      lattice: lsmLattice,
      density: 6.52,
      molecularWeight: 231.59,
      youngsModulusGPa: 162,
      poissonRatio: 0.27,
      rir: 3.85,
      massAttenuation: 194.2,
      crystalliteSizeNm: 28,
      microstrain: 0.0018,
      wavelength: 1.54056,
      etaMix: 0.52,
      preferredR: 0.88,
      preferredAxis: '0, 0, 1',
      residualStressMPa: -210,
      filmThicknessNm: 42,
      roughnessNm: 0.55,
      sldXray: 48.2,
      scatteringLengthFm: 5.95,
      magneticMomentMuB: 3.7,
      propagationVector: { x: 0.5, y: 0.5, z: 0.5 },
      neelTempK: 345,
      nearestNeighborA: 1.94,
      peaks: lsmPeaks,
      updatedAt: new Date().toISOString(),
      isCustom: true,
    },
    {
      id: 'custom_hea_cocrfeni',
      name: 'Custom CoCrFeNi HEA',
      formula: 'CoCrFeNi',
      category: 'Metals, Intermetallics & Metallurgy',
      description: 'User-customizable single-phase FCC equiatomic high-entropy alloy with moderate microstrain.',
      crystalSystem: 'Cubic',
      centering: 'F',
      spaceGroup: 'Fm-3m',
      spaceGroupNumber: 225,
      zValue: 4,
      lattice: heaLattice,
      density: 8.21,
      molecularWeight: 56.37,
      youngsModulusGPa: 215,
      poissonRatio: 0.29,
      rir: 4.1,
      massAttenuation: 218.5,
      crystalliteSizeNm: 22,
      microstrain: 0.0026,
      wavelength: 1.54056,
      etaMix: 0.44,
      preferredR: 0.72,
      preferredAxis: '1, 1, 1',
      residualStressMPa: -340,
      filmThicknessNm: 65,
      roughnessNm: 0.7,
      sldXray: 61.5,
      scatteringLengthFm: 6.45,
      magneticMomentMuB: 1.45,
      propagationVector: { x: 0, y: 0, z: 0 },
      neelTempK: 130,
      nearestNeighborA: 2.52,
      peaks: heaPeaks,
      updatedAt: new Date().toISOString(),
      isCustom: true,
    },
  ];
}

function mirrorToSuiteDatabase(customList: UserCustomMaterial[]) {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = localStorage.getItem(SUITE_DB_KEY);
    const existingParsed: any[] = existingRaw ? JSON.parse(existingRaw) : [];
    const customNames = new Set(customList.map((m) => m.name.toLowerCase()));
    const nonCustom = Array.isArray(existingParsed)
      ? existingParsed.filter((m) => m && !m.isUserCustomMaterial && !customNames.has(String(m.name || '').toLowerCase()))
      : [];

    const converted = customList.map((m) => {
      const elements = Array.from(new Set(m.formula.match(/[A-Z][a-z]?/g) || []));
      return {
        id: m.id,
        name: m.name,
        type: m.category || 'Custom Standard',
        formula: m.formula,
        crystalSystem: m.crystalSystem,
        spaceGroup: `${m.spaceGroup} (${m.spaceGroupNumber})`,
        density: m.density,
        molecularWeight: m.molecularWeight,
        elasticModulus: m.youngsModulusGPa,
        description: m.description,
        pattern: formatCustomMaterialPattern(m),
        applications: ['User Custom Material', m.category],
        elements,
        zValue: m.zValue,
        latticeParams: { ...m.lattice },
        isUserCustomMaterial: true,
      };
    });

    const base = nonCustom.length > 0 ? nonCustom : MATERIAL_DB;
    localStorage.setItem(SUITE_DB_KEY, JSON.stringify([...converted, ...base]));

    // Mirror into IndexedDB asynchronously
    converted.forEach((entry) => {
      saveOfflineMaterial({
        name: entry.name,
        formula: entry.formula,
        type: entry.type,
        crystalSystem: entry.crystalSystem,
        spaceGroup: entry.spaceGroup,
        density: entry.density,
        molecularWeight: entry.molecularWeight,
        elasticModulus: entry.elasticModulus,
        description: entry.description,
        pattern: entry.pattern,
        applications: entry.applications,
        elements: entry.elements,
        isSynced: false,
      }).catch(() => {
        // IndexedDB optional fallback
      });
    });

    window.dispatchEvent(new CustomEvent('xrd-custom-materials-updated', { detail: customList }));
  } catch {
    // Ignore storage quota issues
  }
}

interface ApplyPayload {
  material: UserCustomMaterial;
  targetModule: string | 'all';
  nonce: number;
}

interface CustomMaterialContextValue {
  customMaterials: UserCustomMaterial[];
  activeCustomMaterialId: string | null;
  activeCustomMaterial: UserCustomMaterial | null;
  setActiveCustomMaterialId: (id: string | null) => void;
  applyTrigger: ApplyPayload | null;
  applyToSection: (material: UserCustomMaterial, targetModule: string) => void;
  saveCustomMaterial: (mat: UserCustomMaterial, applyAfterSaveModule?: string) => void;
  deleteCustomMaterial: (id: string) => void;
  duplicateCustomMaterial: (id: string) => UserCustomMaterial | null;
  editorOpen: boolean;
  editorMode: 'create' | 'edit';
  editingMaterial: UserCustomMaterial | null;
  editorTargetModule: string;
  openEditor: (mode: 'create' | 'edit', targetModule: string, material?: UserCustomMaterial | null) => void;
  closeEditor: () => void;
  lastAppliedBanner: { materialName: string; moduleId: string; ts: number } | null;
}

const CustomMaterialContext = createContext<CustomMaterialContextValue | null>(null);

export const CustomMaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [customMaterials, setCustomMaterials] = useState<UserCustomMaterial[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback to starter templates
      }
    }
    return buildStarterCustomMaterials();
  });

  const [activeCustomMaterialId, setActiveCustomMaterialIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_KEY);
    }
    return null;
  });

  const [applyTrigger, setApplyTrigger] = useState<ApplyPayload | null>(null);
  const [lastAppliedBanner, setLastAppliedBanner] = useState<{
    materialName: string;
    moduleId: string;
    ts: number;
  } | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingMaterial, setEditingMaterial] = useState<UserCustomMaterial | null>(null);
  const [editorTargetModule, setEditorTargetModule] = useState<string>('bragg');

  // Ensure active ID is always valid if list is non-empty
  useEffect(() => {
    if (customMaterials.length > 0) {
      if (!activeCustomMaterialId || !customMaterials.some((m) => m.id === activeCustomMaterialId)) {
        setActiveCustomMaterialIdState(customMaterials[0].id);
      }
    } else if (activeCustomMaterialId !== null) {
      setActiveCustomMaterialIdState(null);
    }
  }, [customMaterials, activeCustomMaterialId]);

  // Persist to localStorage + mirror into suite database
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customMaterials));
      if (activeCustomMaterialId) {
        localStorage.setItem(ACTIVE_KEY, activeCustomMaterialId);
      }
    } catch {
      // Ignore storage errors
    }
    mirrorToSuiteDatabase(customMaterials);
  }, [customMaterials, activeCustomMaterialId]);

  // Sync from Firestore when signed in
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const q = query(collection(db, 'customMaterials'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (cancelled || snap.empty) return;
        const remoteMaterials: UserCustomMaterial[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.name && data?.formula) {
            const parsedPeaks: CustomMaterialPeak[] = String(data.pattern || '')
              .split('\n')
              .map((line) => line.split(',').map((s) => Number(s.trim())))
              .filter((parts) => parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]))
              .map((parts) => ({
                twoTheta: parts[0],
                intensity: parts[1],
                fwhm: Number.isFinite(parts[2]) ? parts[2] : 0.25,
                h: Number.isFinite(parts[3]) ? parts[3] : 1,
                k: Number.isFinite(parts[4]) ? parts[4] : 0,
                l: Number.isFinite(parts[5]) ? parts[5] : 0,
              }));

            const fallbackLattice = { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 };
            remoteMaterials.push({
              id: docSnap.id,
              name: String(data.name),
              formula: String(data.formula),
              category: String(data.type || 'Custom Standard'),
              description: String(data.description || ''),
              crystalSystem: (data.crystalSystem as CustomCrystalSystem) || 'Cubic',
              centering: 'P',
              spaceGroup: String(data.spaceGroup || 'Pm-3m'),
              spaceGroupNumber: 221,
              zValue: 4,
              lattice: fallbackLattice,
              density: typeof data.density === 'number' ? data.density : 4.5,
              molecularWeight: typeof data.molecularWeight === 'number' ? data.molecularWeight : 120,
              youngsModulusGPa: typeof data.elasticModulus === 'number' ? data.elasticModulus : 150,
              poissonRatio: 0.28,
              rir: 2.5,
              massAttenuation: 65,
              crystalliteSizeNm: 30,
              microstrain: 0.0015,
              wavelength: 1.54056,
              etaMix: 0.45,
              preferredR: 0.85,
              preferredAxis: '0, 0, 1',
              residualStressMPa: -150,
              filmThicknessNm: 45,
              roughnessNm: 0.6,
              sldXray: 34,
              scatteringLengthFm: 5.5,
              magneticMomentMuB: 2.5,
              propagationVector: { x: 0.5, y: 0.5, z: 0.5 },
              neelTempK: 150,
              nearestNeighborA: 2.35,
              peaks:
                parsedPeaks.length > 0
                  ? parsedPeaks
                  : generateBraggPeaksFromLattice({
                      crystalSystem: 'Cubic',
                      centering: 'P',
                      lattice: fallbackLattice,
                      wavelength: 1.54056,
                      crystalliteSizeNm: 30,
                      microstrain: 0.0015,
                    }),
              updatedAt: new Date().toISOString(),
              isCustom: true,
            });
          }
        });

        if (remoteMaterials.length > 0) {
          setCustomMaterials((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));
            remoteMaterials.forEach((rm) => {
              if (!byId.has(rm.id)) byId.set(rm.id, rm);
            });
            return Array.from(byId.values());
          });
        }
      } catch {
        // Offline or unauthenticated fallback silently handled
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const syncSingleToFirestore = useCallback(
    async (mat: UserCustomMaterial) => {
      if (!user?.uid) return;
      try {
        const safeId = mat.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || `mat_${Date.now()}`;
        const payload: Record<string, any> = {
          id: safeId,
          userId: user.uid,
          name: mat.name.slice(0, 195),
          formula: mat.formula.slice(0, 95),
          pattern: formatCustomMaterialPattern(mat).slice(0, 195000),
          type: (mat.category || 'Custom Standard').slice(0, 195),
          description: (mat.description || '').slice(0, 1950),
          crystalSystem: mat.crystalSystem.slice(0, 195),
          spaceGroup: mat.spaceGroup.slice(0, 195),
          density: Number(mat.density) || 0,
          molecularWeight: Number(mat.molecularWeight) || 0,
          elasticModulus: Number(mat.youngsModulusGPa) || 0,
        };
        await setDoc(doc(db, 'customMaterials', safeId), payload);
      } catch (err) {
        console.warn('Firestore custom material sync skipped:', err);
      }
    },
    [user?.uid]
  );

  const setActiveCustomMaterialId = useCallback((id: string | null) => {
    setActiveCustomMaterialIdState(id);
  }, []);

  const applyToSection = useCallback((material: UserCustomMaterial, targetModule: string) => {
    setActiveCustomMaterialIdState(material.id);
    const nonce = Date.now() + Math.random();
    setApplyTrigger({ material, targetModule, nonce });
    setLastAppliedBanner({ materialName: material.name, moduleId: targetModule, ts: Date.now() });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xrd-apply-custom-material', {
          detail: { material, targetModule, nonce },
        })
      );
    }
  }, []);

  const saveCustomMaterial = useCallback(
    (mat: UserCustomMaterial, applyAfterSaveModule?: string) => {
      const normalized: UserCustomMaterial = {
        ...mat,
        id: mat.id || `custom_${Date.now()}`,
        updatedAt: new Date().toISOString(),
        isCustom: true,
      };
      setCustomMaterials((prev) => {
        const exists = prev.some((m) => m.id === normalized.id);
        return exists
          ? prev.map((m) => (m.id === normalized.id ? normalized : m))
          : [normalized, ...prev];
      });
      setActiveCustomMaterialIdState(normalized.id);
      syncSingleToFirestore(normalized);

      if (applyAfterSaveModule) {
        applyToSection(normalized, applyAfterSaveModule);
      }
    },
    [applyToSection, syncSingleToFirestore]
  );

  const deleteCustomMaterial = useCallback(
    (id: string) => {
      setCustomMaterials((prev) => prev.filter((m) => m.id !== id));
      if (user?.uid) {
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
        deleteDoc(doc(db, 'customMaterials', safeId)).catch(() => {});
      }
    },
    [user?.uid]
  );

  const duplicateCustomMaterial = useCallback(
    (id: string): UserCustomMaterial | null => {
      const source = customMaterials.find((m) => m.id === id);
      if (!source) return null;
      const copy: UserCustomMaterial = {
        ...source,
        id: `custom_${Date.now()}`,
        name: `${source.name} (Copy)`,
        lattice: { ...source.lattice },
        propagationVector: { ...source.propagationVector },
        peaks: source.peaks.map((p) => ({ ...p })),
        updatedAt: new Date().toISOString(),
        isCustom: true,
      };
      saveCustomMaterial(copy);
      return copy;
    },
    [customMaterials, saveCustomMaterial]
  );

  const openEditor = useCallback(
    (mode: 'create' | 'edit', targetModule: string, material?: UserCustomMaterial | null) => {
      setEditorMode(mode);
      setEditorTargetModule(targetModule);
      setEditingMaterial(mode === 'edit' ? material ?? null : null);
      setEditorOpen(true);
    },
    []
  );

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
  }, []);

  const activeCustomMaterial = useMemo(
    () => customMaterials.find((m) => m.id === activeCustomMaterialId) ?? customMaterials[0] ?? null,
    [customMaterials, activeCustomMaterialId]
  );

  const value = useMemo<CustomMaterialContextValue>(
    () => ({
      customMaterials,
      activeCustomMaterialId,
      activeCustomMaterial,
      setActiveCustomMaterialId,
      applyTrigger,
      applyToSection,
      saveCustomMaterial,
      deleteCustomMaterial,
      duplicateCustomMaterial,
      editorOpen,
      editorMode,
      editingMaterial,
      editorTargetModule,
      openEditor,
      closeEditor,
      lastAppliedBanner,
    }),
    [
      customMaterials,
      activeCustomMaterialId,
      activeCustomMaterial,
      setActiveCustomMaterialId,
      applyTrigger,
      applyToSection,
      saveCustomMaterial,
      deleteCustomMaterial,
      duplicateCustomMaterial,
      editorOpen,
      editorMode,
      editingMaterial,
      editorTargetModule,
      openEditor,
      closeEditor,
      lastAppliedBanner,
    ]
  );

  return <CustomMaterialContext.Provider value={value}>{children}</CustomMaterialContext.Provider>;
};

export function useCustomMaterials(): CustomMaterialContextValue {
  const ctx = useContext(CustomMaterialContext);
  if (!ctx) {
    throw new Error('useCustomMaterials must be used inside CustomMaterialProvider');
  }
  return ctx;
}

/**
 * Subscribe an analysis module to user custom-material apply events.
 * Accepts either a single moduleId or an array of moduleIds (e.g. ['scherrer', 'monshi_scherrer', 'xrd_nano']).
 */
export function useCustomMaterialApply(
  moduleIds: string | string[],
  onApply: (material: UserCustomMaterial) => void
) {
  const ctx = useContext(CustomMaterialContext);
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;
  const lastHandledNonceRef = useRef<number | null>(null);

  const idsKey = Array.isArray(moduleIds) ? moduleIds.join('|') : moduleIds;

  useEffect(() => {
    if (!ctx?.applyTrigger) return;
    const { material, targetModule, nonce } = ctx.applyTrigger;
    if (lastHandledNonceRef.current === nonce) return;
    const allowedIds = idsKey.split('|');
    if (targetModule === 'all' || allowedIds.includes(targetModule)) {
      lastHandledNonceRef.current = nonce;
      onApplyRef.current(material);
    }
  }, [ctx?.applyTrigger, idsKey]);
}
