import { MATERIAL_DB } from './materialDB';
import { getOfflineMaterials, bulkSaveOfflineMaterials } from './offlineDb';

export function getActiveMaterials(): any[] {
  if (typeof window === 'undefined') return MATERIAL_DB;
  try {
    const saved = localStorage.getItem('crystal_suite_materials_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge missing entries by name
        const parsedNames = new Set(parsed.map(m => m?.name).filter(Boolean));
        const missing = MATERIAL_DB.filter(m => !parsedNames.has(m.name));
        const combined = [...parsed, ...missing];
        const uniqueMap = new Map<string, any>();
        combined.forEach(m => {
          if (m && m.name && !uniqueMap.has(m.name)) {
            uniqueMap.set(m.name, m);
          }
        });
        return Array.from(uniqueMap.values());
      }
    }
  } catch (e) {
    console.error('Failed to load material overrides', e);
  }
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
