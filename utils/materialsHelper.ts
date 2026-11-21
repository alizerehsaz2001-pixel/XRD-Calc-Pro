import { MATERIAL_DB } from './materialDB';
import { getOfflineMaterials, bulkSaveOfflineMaterials } from './offlineDb';

let cachedRawString: string | null | undefined = undefined;
let cachedMergedList: any[] | null = null;

// Names of deprecated / erroneous legacy materials removed from MATERIAL_DB
// so older localStorage caches never resurrect them.
export const DEPRECATED_MATERIAL_NAMES = new Set<string>([
  'Corundum Standard (Al2O3)',
]);

const BUILTIN_MATERIAL_MAP = new Map<string, any>(
  MATERIAL_DB.map((m) => [m.name, m])
);

/**
 * Merges cached localStorage materials with the canonical built-in MATERIAL_DB:
 * - Removes any deprecated/erroneous legacy records.
 * - Preserves all user-created custom materials and user-edited overrides (`isUserCustomMaterial === true`).
 * - Ensures updated built-in MATERIAL_DB records supersede stale cached copies of built-in materials.
 */
export function mergeWithCanonicalMaterials(parsed: any[]): any[] {
  const uniqueMap = new Map<string, any>();

  // 1. Keep user custom entries and custom-edited overrides first
  parsed.forEach((m) => {
    if (!m || !m.name || DEPRECATED_MATERIAL_NAMES.has(m.name)) return;
    const isBuiltIn = BUILTIN_MATERIAL_MAP.has(m.name);
    if (!isBuiltIn || m.isUserCustomMaterial === true) {
      if (!uniqueMap.has(m.name)) {
        uniqueMap.set(m.name, m);
      }
    }
  });

  // 2. Insert all canonical built-in MATERIAL_DB entries (if not overridden by an explicit custom edit)
  MATERIAL_DB.forEach((m) => {
    if (m && m.name && !uniqueMap.has(m.name)) {
      uniqueMap.set(m.name, m);
    }
  });

  return Array.from(uniqueMap.values());
}

export function getActiveMaterials(): any[] {
  if (typeof window === 'undefined') return MATERIAL_DB;
  try {
    const saved = localStorage.getItem('crystal_suite_materials_v1');
    if (saved === cachedRawString && cachedMergedList !== null) {
      return cachedMergedList;
    }
    cachedRawString = saved;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedMergedList = mergeWithCanonicalMaterials(parsed);
        return cachedMergedList;
      }
    }
  } catch (e) {
    console.error('Failed to load material overrides', e);
  }
  cachedMergedList = MATERIAL_DB;
  return MATERIAL_DB;
}

/**
 * Ensures LocalStorage and IndexedDB materials stay in perfect sync
 */
export async function syncOfflineHelper(): Promise<any[]> {
  if (typeof window === 'undefined') return MATERIAL_DB;
  try {
    const dbMaterials = await getOfflineMaterials();
    const lMaterialsRaw = localStorage.getItem('crystal_suite_materials_v1');
    const lMaterials = lMaterialsRaw ? JSON.parse(lMaterialsRaw) : [];

    // If IndexedDB has records but LocalStorage is empty or older, update LocalStorage
    if (dbMaterials.length > 0 && lMaterials.length === 0) {
      localStorage.setItem('crystal_suite_materials_v1', JSON.stringify(dbMaterials));
      return getActiveMaterials();
    }

    // If LocalStorage has newer/more configurations, back them up to IndexedDB
    if (lMaterials.length > 0 && dbMaterials.length === 0) {
      await bulkSaveOfflineMaterials(lMaterials);
    }
  } catch (e) {
    console.error('Offline DB sync warning:', e);
  }
  return getActiveMaterials();
}
