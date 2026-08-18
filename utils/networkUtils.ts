/**
 * High-Speed Network Availability & Network Quality Detection Utilities
 * XRD-Calc Pro Data-Saving Synchronization Framework
 */

export interface NetworkQualityInfo {
  isOnline: boolean;
  isHighSpeed: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number | null; // In Mbps (e.g. 10 = 10 Mbps)
  rtt: number | null; // Round trip time in ms
  saveData: boolean; // Browser/OS Data Saver flag
  connectionType: string; // 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  speedCategory: 'high-speed' | 'moderate' | 'low-speed' | 'offline';
  reason: string;
  measuredLatencyMs: number | null;
  lastChecked: string;
}

export interface AutoSyncConfig {
  enabled: boolean;
  highSpeedOnly: boolean;
  respectDataSaver: boolean;
  minDownlinkMbps: number; // e.g. 1.5 Mbps
  maxLatencyMs: number; // e.g. 350 ms
}

const AUTO_SYNC_CONFIG_KEY = 'xrd_auto_sync_config';

export const DEFAULT_AUTO_SYNC_CONFIG: AutoSyncConfig = {
  enabled: true,
  highSpeedOnly: true,
  respectDataSaver: true,
  minDownlinkMbps: 1.5,
  maxLatencyMs: 350,
};

export function getStoredAutoSyncConfig(): AutoSyncConfig {
  try {
    const saved = localStorage.getItem(AUTO_SYNC_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_AUTO_SYNC_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load auto sync config from localStorage:', e);
  }
  return DEFAULT_AUTO_SYNC_CONFIG;
}

export function saveStoredAutoSyncConfig(config: Partial<AutoSyncConfig>): AutoSyncConfig {
  const current = getStoredAutoSyncConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(AUTO_SYNC_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save auto sync config to localStorage:', e);
  }
  return updated;
}

/**
 * Gets the current network connection details via W3C Network Information API if available.
 */
function getConnectionObject(): any {
  if (typeof navigator === 'undefined') return null;
  return (
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection ||
    null
  );
}

/**
 * Evaluates current network quality and high-speed availability.
 */
export function getNetworkQualityInfo(latencyMs: number | null = null, config: AutoSyncConfig = DEFAULT_AUTO_SYNC_CONFIG): NetworkQualityInfo {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const conn = getConnectionObject();

  const effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown' = conn?.effectiveType || 'unknown';
  const downlink: number | null = typeof conn?.downlink === 'number' ? conn.downlink : null;
  const rtt: number | null = typeof conn?.rtt === 'number' ? conn.rtt : null;
  const saveData: boolean = !!conn?.saveData;
  const connectionType: string = conn?.type || (conn?.effectiveType ? 'cellular/wifi' : 'broadband');

  if (!isOnline) {
    return {
      isOnline: false,
      isHighSpeed: false,
      effectiveType: 'unknown',
      downlink: 0,
      rtt: null,
      saveData: false,
      connectionType: 'none',
      speedCategory: 'offline',
      reason: 'No network connection detected. Operating in offline cache-first mode.',
      measuredLatencyMs: null,
      lastChecked: new Date().toISOString(),
    };
  }

  // 1. Data Saver Check
  if (config.respectDataSaver && saveData) {
    return {
      isOnline: true,
      isHighSpeed: false,
      effectiveType,
      downlink,
      rtt,
      saveData: true,
      connectionType,
      speedCategory: 'low-speed',
      reason: 'Browser/OS Data Saver is active. Auto-sync is paused to conserve bandwidth.',
      measuredLatencyMs: latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  // 2. Slow Network / 2G / 3G Check
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return {
      isOnline: true,
      isHighSpeed: false,
      effectiveType,
      downlink,
      rtt,
      saveData,
      connectionType,
      speedCategory: 'low-speed',
      reason: 'Slow 2G connection detected. Automatic sync is paused to prevent high latency.',
      measuredLatencyMs: latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  if (config.highSpeedOnly && effectiveType === '3g') {
    return {
      isOnline: true,
      isHighSpeed: false,
      effectiveType,
      downlink,
      rtt,
      saveData,
      connectionType,
      speedCategory: 'moderate',
      reason: 'Standard 3G network detected. Auto-sync is paused (requires High-Speed 4G/WiFi).',
      measuredLatencyMs: latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  // 3. Bandwidth / Downlink Threshold Check
  if (config.highSpeedOnly && downlink !== null && downlink < config.minDownlinkMbps) {
    return {
      isOnline: true,
      isHighSpeed: false,
      effectiveType,
      downlink,
      rtt,
      saveData,
      connectionType,
      speedCategory: 'moderate',
      reason: `Bandwidth (${downlink.toFixed(1)} Mbps) is below high-speed threshold (≥ ${config.minDownlinkMbps} Mbps). Auto-sync paused.`,
      measuredLatencyMs: latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  // 4. RTT / Latency Threshold Check
  if (config.highSpeedOnly && rtt !== null && rtt > config.maxLatencyMs) {
    return {
      isOnline: true,
      isHighSpeed: false,
      effectiveType,
      downlink,
      rtt,
      saveData,
      connectionType,
      speedCategory: 'moderate',
      reason: `Network latency (${rtt} ms) exceeds optimal response threshold (≤ ${config.maxLatencyMs} ms). Auto-sync paused.`,
      measuredLatencyMs: latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  // 5. Measured Ping Check (fallback or active)
  if (config.highSpeedOnly && latencyMs !== null && latencyMs > config.maxLatencyMs) {
    return {
      isOnline: true,
      isHighSpeed: false,
      effectiveType,
      downlink,
      rtt,
      saveData,
      connectionType,
      speedCategory: 'moderate',
      reason: `Ping latency (${Math.round(latencyMs)} ms) is high. Auto-sync paused to save data.`,
      measuredLatencyMs: latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  // Connection qualifies as high-speed!
  const speedLabel = downlink ? `${downlink.toFixed(1)} Mbps` : (effectiveType === '4g' ? '4G/Broadband' : 'High-Speed');
  const rttLabel = rtt ? `${rtt}ms RTT` : (latencyMs ? `${Math.round(latencyMs)}ms latency` : 'Low Latency');

  return {
    isOnline: true,
    isHighSpeed: true,
    effectiveType: effectiveType === 'unknown' ? '4g' : effectiveType,
    downlink: downlink || 10,
    rtt: rtt || (latencyMs ? Math.round(latencyMs) : 40),
    saveData: false,
    connectionType,
    speedCategory: 'high-speed',
    reason: `High-speed network verified (${speedLabel}, ${rttLabel}). Ready for automatic IndexedDB sync.`,
    measuredLatencyMs: latencyMs,
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Performs a lightweight latency ping check to evaluate live round-trip time.
 */
export async function measureNetworkLatency(timeoutMs = 2500): Promise<number | null> {
  if (typeof window === 'undefined' || !navigator.onLine) return null;

  try {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Use health endpoint with cache-busting timestamp
    const res = await fetch(`/api/health?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const end = performance.now();
      return Math.max(1, end - start);
    }
  } catch (err) {
    // Attempt fallback to root index head request
    try {
      const start = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`/?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return Math.max(1, performance.now() - start);
      }
    } catch (e) {
      // Network ping failed or timed out
    }
  }
  return null;
}

/**
 * Subscribes to network connection change events.
 */
export function subscribeToNetworkChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback();
  const handleOffline = () => callback();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  const conn = getConnectionObject();
  if (conn && conn.addEventListener) {
    conn.addEventListener('change', callback);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (conn && conn.removeEventListener) {
      conn.removeEventListener('change', callback);
    }
  };
}
