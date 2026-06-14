export interface OfflineMaterial {
  name: string;
  formula: string;
  category?: string;
  type?: string;
  crystalSystem?: string;
  spaceGroup?: string;
  density?: number;
  molecularWeight?: number;
  elasticModulus?: number;
  description?: string;
  pattern?: string;
  applications?: string[];
  elements?: string[];
  lastModified?: string;
  isSynced?: boolean;
}

export interface OfflineAnalysisResult {
  id: string;
  type: 'bragg' | 'scherrer' | 'williamson_hall' | 'rietveld' | 'fwhm';
  title: string;
  timestamp: string;
  wavelength?: number;
  inputData: any; // Form values
  results: any; // Array or object of computed properties
  isSynced?: boolean;
}

const DB_NAME = 'XRD_CrystalPro_OfflineDB';
const DB_VERSION = 2;

export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;

      // Store Materials
      if (!db.objectStoreNames.contains('materials')) {
        db.createObjectStore('materials', { keyPath: 'name' });
      }

      // Store Offline Analysis Results
      if (!db.objectStoreNames.contains('analysisResults')) {
        const store = db.createObjectStore('analysisResults', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// --- Materials Storage ---

export async function saveOfflineMaterial(material: OfflineMaterial): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readwrite');
    const store = transaction.objectStore('materials');
    const request = store.put({
      ...material,
      lastModified: new Date().toISOString(),
    });

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
  });
}

export async function bulkSaveOfflineMaterials(materials: OfflineMaterial[]): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readwrite');
    const store = transaction.objectStore('materials');
    
    materials.forEach(m => {
      store.put({
        ...m,
        lastModified: new Date().toISOString()
      });
    });

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

export async function getOfflineMaterials(): Promise<OfflineMaterial[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readonly');
    const store = transaction.objectStore('materials');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteOfflineMaterial(name: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readwrite');
    const store = transaction.objectStore('materials');
    const request = store.delete(name);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
  });
}

// --- Analysis Results ---

export async function saveOfflineAnalysis(analysis: OfflineAnalysisResult): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('analysisResults', 'readwrite');
    const store = transaction.objectStore('analysisResults');
    const request = store.put({
      ...analysis,
      timestamp: analysis.timestamp || new Date().toISOString()
    });

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
  });
}

export async function getOfflineAnalyses(): Promise<OfflineAnalysisResult[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('analysisResults', 'readonly');
    const store = transaction.objectStore('analysisResults');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Sort descending by timestamp
      const results = request.result as OfflineAnalysisResult[];
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(results);
    };
  });
}

export async function deleteOfflineAnalysis(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('analysisResults', 'readwrite');
    const store = transaction.objectStore('analysisResults');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
  });
}

export async function clearOfflineAnalyses(): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('analysisResults', 'readwrite');
    const store = transaction.objectStore('analysisResults');
    const request = store.clear();

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
  });
}
