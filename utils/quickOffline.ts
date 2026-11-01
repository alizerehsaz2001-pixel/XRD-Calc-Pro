import { MATERIAL_DB } from './materialDB';
import { getActiveMaterials } from './materialsHelper';
import { 
  bulkSaveOfflineMaterials, 
  saveOfflineAnalysis, 
  getOfflineMaterials, 
  getOfflineAnalyses,
  OfflineAnalysisResult 
} from './offlineDb';

export const QUICK_OFFLINE_KEY = 'xrd_quick_offline_mode';
export const QUICK_OFFLINE_TIMESTAMP_KEY = 'xrd_quick_offline_cached_at';
export const QUICK_OFFLINE_MAT_COUNT_KEY = 'xrd_quick_offline_materials_count';
export const QUICK_OFFLINE_ANALYSIS_COUNT_KEY = 'xrd_quick_offline_analysis_count';

export interface QuickOfflineStatus {
  isEnabled: boolean;
  lastCachedAt: string | null;
  cachedMaterialsCount: number;
  cachedAnalysisCount: number;
}

export interface ForceCacheResult {
  success: boolean;
  materialsCount: number;
  analysisCount: number;
  timestamp: string;
  error?: string;
}

/**
 * Checks if Quick Offline Mode is currently enabled
 */
export function isQuickOfflineEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(QUICK_OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Gets the current Quick Offline status and cached counts
 */
export function getQuickOfflineStatus(): QuickOfflineStatus {
  if (typeof window === 'undefined') {
    return {
      isEnabled: false,
      lastCachedAt: null,
      cachedMaterialsCount: 0,
      cachedAnalysisCount: 0,
    };
  }

  try {
    const isEnabled = localStorage.getItem(QUICK_OFFLINE_KEY) === 'true';
    const lastCachedAt = localStorage.getItem(QUICK_OFFLINE_TIMESTAMP_KEY) || null;
    const matCountStr = localStorage.getItem(QUICK_OFFLINE_MAT_COUNT_KEY);
    const anaCountStr = localStorage.getItem(QUICK_OFFLINE_ANALYSIS_COUNT_KEY);

    return {
      isEnabled,
      lastCachedAt,
      cachedMaterialsCount: matCountStr ? parseInt(matCountStr, 10) : 0,
      cachedAnalysisCount: anaCountStr ? parseInt(anaCountStr, 10) : 0,
    };
  } catch {
    return {
      isEnabled: false,
      lastCachedAt: null,
      cachedMaterialsCount: 0,
      cachedAnalysisCount: 0,
    };
  }
}

/**
 * Explicitly force-caches all current materials and analysis state into IndexedDB
 */
export async function forceCacheAllToIndexedDB(): Promise<ForceCacheResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // 1. Gather all active & preset materials
    const activeMaterials = getActiveMaterials();
    const materialMap = new Map<string, any>();
    
    // Merge preset database with active overrides
    MATERIAL_DB.forEach(m => {
      if (m && m.name) materialMap.set(m.name, m);
    });
    activeMaterials.forEach(m => {
      if (m && m.name) materialMap.set(m.name, m);
    });

    const allMaterials = Array.from(materialMap.values()).map(m => ({
      name: m.name,
      formula: m.formula || m.chemicalFormula || 'Unknown',
      category: m.category || m.crystalSystem || 'Crystallographic Preset',
      type: m.type || 'Preset Standard',
      crystalSystem: m.crystalSystem || 'Cubic',
      spaceGroup: m.spaceGroup || 'P1',
      density: Number(m.density || 0),
      molecularWeight: Number(m.molecularWeight || 0),
      elasticModulus: Number(m.elasticModulus || 0),
      description: m.description || `Offline cached material record for ${m.name}`,
      pattern: m.pattern || '',
      applications: m.applications || [],
      elements: m.elements || [],
      lastModified: timestamp,
      isSynced: true,
    }));

    // Bulk save materials to IndexedDB
    await bulkSaveOfflineMaterials(allMaterials);

    // 2. Gather analysis sessions and calculation states from LocalStorage
    const analysisRecords: OfflineAnalysisResult[] = [];
    const keysToCheck = [
      { key: 'xrd_bragg_history', type: 'bragg' as const, title: 'Bragg Diffraction Session' },
      { key: 'xrd_history', type: 'bragg' as const, title: 'Diffraction Peak History' },
      { key: 'xrd_scherrer_state', type: 'scherrer' as const, title: 'Scherrer Crystallite Size Analysis' },
      { key: 'xrd_wh_state', type: 'williamson_hall' as const, title: 'Williamson-Hall Strain Analysis' },
      { key: 'xrd_fwhm_state', type: 'fwhm' as const, title: 'FWHM Peak Fitting Session' },
      { key: 'xrd_rietveld_state', type: 'rietveld' as const, title: 'Rietveld Refinement Profile' },
      { key: 'xrd_cohen_state', type: 'bragg' as const, title: 'Cohen Lattice Parameter Refinement' },
    ];

    for (const item of keysToCheck) {
      try {
        const raw = localStorage.getItem(item.key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((histItem, idx) => {
              analysisRecords.push({
                id: `offline_cache_${item.type}_${idx}_${Date.now()}`,
                type: item.type,
                title: histItem.sampleName || histItem.title || `${item.title} #${idx + 1}`,
                timestamp: histItem.timestamp || timestamp,
                wavelength: histItem.wavelength || 1.5406,
                inputData: histItem.inputData || histItem,
                results: histItem.results || histItem,
                isSynced: true,
              });
            });
          } else if (parsed && typeof parsed === 'object') {
            analysisRecords.push({
              id: `offline_cache_${item.type}_single_${Date.now()}`,
              type: item.type,
              title: parsed.title || item.title,
              timestamp: parsed.timestamp || timestamp,
              wavelength: parsed.wavelength || 1.5406,
              inputData: parsed.inputData || parsed,
              results: parsed.results || parsed,
              isSynced: true,
            });
          }
        }
      } catch (e) {
        console.warn(`[QuickOffline] Skipped key ${item.key}:`, e);
      }
    }

    // Save gathered analysis records to IndexedDB
    for (const rec of analysisRecords) {
      await saveOfflineAnalysis(rec);
    }

    // Verify stored items in IndexedDB
    const verifyMaterials = await getOfflineMaterials();
    const verifyAnalyses = await getOfflineAnalyses();

    const materialsCount = verifyMaterials.length;
    const analysisCount = verifyAnalyses.length;

    // Update timestamp and counts in localStorage
    localStorage.setItem(QUICK_OFFLINE_TIMESTAMP_KEY, timestamp);
    localStorage.setItem(QUICK_OFFLINE_MAT_COUNT_KEY, materialsCount.toString());
    localStorage.setItem(QUICK_OFFLINE_ANALYSIS_COUNT_KEY, analysisCount.toString());

    // Dispatch custom event so UI updates immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xrd_quick_offline_changed', {
        detail: { isEnabled: isQuickOfflineEnabled(), timestamp, materialsCount, analysisCount }
      }));
    }

    return {
      success: true,
      materialsCount,
      analysisCount,
      timestamp,
    };
  } catch (err: any) {
    console.error('[QuickOffline] Force cache error:', err);
    return {
      success: false,
      materialsCount: 0,
      analysisCount: 0,
      timestamp,
      error: err?.message || 'Failed to force-cache state to IndexedDB',
    };
  }
}

/**
 * Sets Quick Offline mode ON or OFF
 */
export async function setQuickOfflineMode(enabled: boolean): Promise<QuickOfflineStatus> {
  if (typeof window === 'undefined') {
    return getQuickOfflineStatus();
  }

  try {
    localStorage.setItem(QUICK_OFFLINE_KEY, enabled ? 'true' : 'false');

    if (enabled) {
      // Force-cache database & analysis state immediately upon turning ON
      await forceCacheAllToIndexedDB();
    } else {
      // Dispatch state change event
      window.dispatchEvent(new CustomEvent('xrd_quick_offline_changed', {
        detail: { isEnabled: false }
      }));
    }
  } catch (e) {
    console.error('[QuickOffline] Toggle mode error:', e);
  }

  return getQuickOfflineStatus();
}
