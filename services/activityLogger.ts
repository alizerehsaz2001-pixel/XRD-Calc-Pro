import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';

export type ActivityCategory =
  | 'AUTH'
  | 'NAVIGATION'
  | 'CALCULATION'
  | 'PARAMETER'
  | 'EXPORT'
  | 'AI_ANALYSIS'
  | 'DATABASE'
  | 'SYSTEM'
  | 'SECURITY';

export interface UserActivity {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  category: ActivityCategory;
  action: string;
  module?: string;
  details?: string;
  timestamp: string;
  clientInfo?: string;
  synced?: boolean;
}

export interface LogActivityParams {
  category: ActivityCategory;
  action: string;
  module?: string;
  details?: Record<string, any> | string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'xrd_user_activity_ledger_v2';
const MAX_LOCAL_LOGS = 500;

// Subscribed listeners
type ActivityListener = (activities: UserActivity[]) => void;
const listeners = new Set<ActivityListener>();

function notifyListeners(activities: UserActivity[]) {
  listeners.forEach(fn => {
    try {
      fn(activities);
    } catch (err) {
      console.warn('[ActivityLogger] Listener notification error:', err);
    }
  });
}

// Generate client device fingerprint
function getClientSignature(): string {
  if (typeof window === 'undefined') return 'SSR/Server';
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  return `${isMobile ? 'Mobile' : 'Desktop'} (${screenRes}) - ${navigator.language || 'en'}`;
}

// Read from LocalStorage cache
export function getLocalActivities(): UserActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[ActivityLogger] Failed to read cached activities:', e);
    return [];
  }
}

// Save to LocalStorage cache
function saveLocalActivities(activities: UserActivity[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep max records
    const bounded = activities.slice(0, MAX_LOCAL_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
    notifyListeners(bounded);
  } catch (e) {
    console.warn('[ActivityLogger] Failed to save cached activities:', e);
  }
}

/**
 * Universal Core Logger Function
 * Logs action to both local memory/storage and Firebase Firestore (if logged in)
 */
export async function logActivity(params: LogActivityParams): Promise<UserActivity> {
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || (typeof localStorage !== 'undefined' ? (localStorage.getItem('xrd_guest_session_id') || (() => {
    const newGuestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('xrd_guest_session_id', newGuestId);
    return newGuestId;
  })()) : 'anonymous_guest');

  const userEmail = currentUser?.email || undefined;
  const userName = currentUser?.displayName || (typeof localStorage !== 'undefined' ? (() => {
    try {
      const reg = localStorage.getItem('xrd_user_registration');
      if (reg) return JSON.parse(reg).name;
    } catch {}
    return undefined;
  })() : undefined);

  let detailsStr = '';
  if (typeof params.details === 'string') {
    detailsStr = params.details;
  } else if (params.details && typeof params.details === 'object') {
    try {
      detailsStr = JSON.stringify(params.details);
    } catch {
      detailsStr = String(params.details);
    }
  }

  // Ensure string lengths abide by firestore.rules bounds
  const activityId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const activity: UserActivity = {
    id: activityId,
    userId: currentUserId,
    userEmail: userEmail ? userEmail.slice(0, 250) : undefined,
    userName: userName ? userName.slice(0, 190) : undefined,
    category: params.category,
    action: params.action.slice(0, 290),
    module: params.module ? params.module.slice(0, 95) : undefined,
    details: detailsStr ? detailsStr.slice(0, 19500) : undefined,
    timestamp: new Date().toISOString(),
    clientInfo: getClientSignature().slice(0, 180),
    synced: false
  };

  // 1. Save locally immediately
  const existing = getLocalActivities();
  const updated = [activity, ...existing];
  saveLocalActivities(updated);

  // 2. Persist to Firestore if user is authenticated
  if (currentUser && currentUser.uid) {
    try {
      const actRef = doc(db, 'userActivities', activity.id);
      const payload: Record<string, any> = {
        id: activity.id,
        userId: currentUser.uid,
        category: activity.category,
        action: activity.action,
        timestamp: activity.timestamp,
      };

      if (activity.module) payload.module = activity.module;
      if (activity.details) payload.details = activity.details;
      if (activity.userEmail) payload.userEmail = activity.userEmail;
      if (activity.userName) payload.userName = activity.userName;

      await setDoc(actRef, payload);
      
      // Mark as synced locally
      activity.synced = true;
      const currentList = getLocalActivities();
      const idx = currentList.findIndex(a => a.id === activity.id);
      if (idx !== -1) {
        currentList[idx].synced = true;
        saveLocalActivities(currentList);
      }
    } catch (err) {
      console.warn('[ActivityLogger] Cloud write deferred / offline cache preserved:', err);
    }
  }

  return activity;
}

/**
 * Convenience Helper Functions for Specific User Acts
 */

export function logNavigation(toModule: string, fromModule?: string, details?: Record<string, any>) {
  const moduleNames: Record<string, string> = {
    bragg: "Bragg's Law Peak Analysis",
    scherrer: "Scherrer Crystallite Size Method",
    wh: "Williamson-Hall Size & Strain Analysis",
    monshi_scherrer: "Monshi-Scherrer Modified Model",
    double_voigt: "Double-Voigt Peak Deconvolution",
    integral: "Integral Breadth Analysis",
    integral_adv: "Advanced Multi-Line Integral Breadth",
    wa: "Warren-Averbach Size-Strain Fourier",
    method_of_moments: "Method of Moments Peak Analyzer",
    preferred_orientation: "March-Dollase Preferred Orientation",
    residual_stress: "Sin²ψ Residual Stress Analysis",
    xrr: "X-Ray Reflectivity (XRR) Thin Film Analysis",
    cohen: "Cohen Lattice Refinement",
    metric_tensor: "Direct & Reciprocal Metric Tensor",
    supercell_transform: "Supercell Transformation Engine",
    pawley_lebail: "Pawley & Le Bail Profile Decomposition",
    rir: "Reference Intensity Ratio (RIR) Quant",
    rietveld: "Full-Profile Rietveld Refinement",
    neutron: "Neutron Powder Diffraction",
    magnetic: "Magnetic Neutron Scattering",
    dl: "Deep Learning Phase Classifier",
    image_analysis: "XRD Micrograph & Pattern Computer Vision",
    image_gen: "Neural Crystal Morphology Studio",
    python_export: "Python & Jupyter Script Generator",
    periodic_table: "Interactive Periodic Table & Form Factors",
    database: "Crystallographic Material Database",
    learn: "Crystallography Knowledge Base & Textbook",
    profile: "Laboratory Director Portfolio & Credentials",
    settings: "System Configuration & Physical Units",
    selection: "Instrumental Line Profile Selection",
    fwhm: "Peak FWHM Deconvolution Engine",
    compare: "Multi-Pattern Diffraction Comparison"
  };

  const toLabel = moduleNames[toModule] || toModule;
  const fromLabel = fromModule ? (moduleNames[fromModule] || fromModule) : undefined;

  return logActivity({
    category: 'NAVIGATION',
    action: `Navigated to ${toLabel}`,
    module: toModule,
    details: {
      toModule,
      toModuleName: toLabel,
      fromModule,
      fromModuleName: fromLabel,
      ...details
    }
  });
}

export function logAuth(action: 'LOGIN' | 'LOGOUT' | 'PROFILE_UPDATE' | 'REGISTRATION' | 'SESSION_START', details?: Record<string, any>) {
  const actionLabels = {
    LOGIN: 'User Authenticated with Google Cloud',
    LOGOUT: 'User Signed Out of Laboratory Session',
    PROFILE_UPDATE: 'User Profile & Academic Credentials Updated',
    REGISTRATION: 'New Researcher Laboratory Profile Registered',
    SESSION_START: 'Laboratory Session Initialized'
  };

  return logActivity({
    category: 'AUTH',
    action: actionLabels[action] || `Auth: ${action}`,
    module: 'Authentication',
    details: {
      authEvent: action,
      ...details
    }
  });
}

export function logCalculation(
  moduleName: string,
  calculationType: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>
) {
  return logActivity({
    category: 'CALCULATION',
    action: `Executed ${calculationType}`,
    module: moduleName,
    details: {
      calculationType,
      inputs,
      outputs
    }
  });
}

export function logParamChange(
  moduleName: string,
  paramName: string,
  oldVal: any,
  newVal: any,
  extra?: Record<string, any>
) {
  return logActivity({
    category: 'PARAMETER',
    action: `Adjusted ${paramName}: ${String(oldVal)} → ${String(newVal)}`,
    module: moduleName,
    details: {
      paramName,
      previousValue: oldVal,
      newValue: newVal,
      ...extra
    }
  });
}

export function logExport(format: string, title: string, meta?: Record<string, any>) {
  return logActivity({
    category: 'EXPORT',
    action: `Exported ${format.toUpperCase()}: ${title}`,
    module: meta?.module || 'Exporter',
    details: {
      format,
      title,
      ...meta
    }
  });
}

export function logAI(feature: string, promptSummary: string, meta?: Record<string, any>) {
  return logActivity({
    category: 'AI_ANALYSIS',
    action: `AI Intelligence: ${feature}`,
    module: meta?.module || 'AI Engine',
    details: {
      feature,
      promptSummary,
      ...meta
    }
  });
}

export function logDatabase(action: string, entityName: string, details?: Record<string, any>) {
  return logActivity({
    category: 'DATABASE',
    action: `Database: ${action} (${entityName})`,
    module: 'Database',
    details: {
      dbAction: action,
      entity: entityName,
      ...details
    }
  });
}

export function logSystem(action: string, details?: Record<string, any>) {
  return logActivity({
    category: 'SYSTEM',
    action: `System: ${action}`,
    module: 'System',
    details
  });
}

/**
 * Fetch activities from Firestore for the current user
 */
export async function fetchCloudActivities(): Promise<UserActivity[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return getLocalActivities();

  try {
    const q = query(
      collection(db, 'userActivities'),
      where('userId', '==', currentUser.uid)
    );
    const snap = await getDocs(q);
    const items: UserActivity[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as UserActivity;
      items.push({
        ...data,
        synced: true
      });
    });

    // Sort by timestamp desc
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Merge with local items that might not have synced yet
    const local = getLocalActivities();
    const map = new Map<string, UserActivity>();
    items.forEach(i => map.set(i.id, i));
    local.forEach(l => {
      if (!map.has(l.id)) {
        map.set(l.id, l);
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    saveLocalActivities(merged);
    return merged;
  } catch (err) {
    console.warn('[ActivityLogger] Cloud fetch error, using local buffer:', err);
    return getLocalActivities();
  }
}

/**
 * Sync unsynced local activities to Firestore
 */
export async function syncPendingActivities(): Promise<number> {
  const currentUser = auth.currentUser;
  if (!currentUser) return 0;

  const local = getLocalActivities();
  const unsynced = local.filter(a => !a.synced);
  if (unsynced.length === 0) return 0;

  let count = 0;
  for (const item of unsynced.slice(0, 50)) {
    try {
      const actRef = doc(db, 'userActivities', item.id);
      const payload: Record<string, any> = {
        id: item.id,
        userId: currentUser.uid,
        category: item.category,
        action: item.action,
        timestamp: item.timestamp,
      };
      if (item.module) payload.module = item.module;
      if (item.details) payload.details = item.details;
      if (item.userEmail) payload.userEmail = item.userEmail;
      if (item.userName) payload.userName = item.userName;

      await setDoc(actRef, payload);
      item.synced = true;
      count++;
    } catch (e) {
      console.warn('[ActivityLogger] Sync item failed:', item.id, e);
    }
  }

  saveLocalActivities(local);
  return count;
}

/**
 * Clear all activities
 */
export async function clearAllActivities(): Promise<void> {
  saveLocalActivities([]);
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const q = query(
        collection(db, 'userActivities'),
        where('userId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('[ActivityLogger] Cloud clear error:', e);
    }
  }
}

/**
 * Subscribe to activity changes in real-time
 */
export function subscribeToActivities(listener: ActivityListener): () => void {
  listeners.add(listener);
  // Initial callback
  listener(getLocalActivities());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Export logs as JSON file
 */
export function exportActivitiesAsJson(activities?: UserActivity[]): void {
  const list = activities || getLocalActivities();
  const jsonStr = JSON.stringify(list, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `XRD_User_Activity_Ledger_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export logs as CSV file
 */
export function exportActivitiesAsCsv(activities?: UserActivity[]): void {
  const list = activities || getLocalActivities();
  const headers = ['ID', 'Timestamp', 'User', 'Category', 'Action', 'Module', 'Details', 'Synced'];
  const rows = list.map(a => [
    `"${a.id}"`,
    `"${a.timestamp}"`,
    `"${a.userEmail || a.userId}"`,
    `"${a.category}"`,
    `"${a.action.replace(/"/g, '""')}"`,
    `"${(a.module || '').replace(/"/g, '""')}"`,
    `"${(a.details || '').replace(/"/g, '""')}"`,
    `"${a.synced ? 'YES' : 'NO'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `XRD_User_Activity_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
