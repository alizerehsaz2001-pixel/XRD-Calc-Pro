/**
 * Lightweight no-op activity logger.
 * Eliminates background click/navigation telemetry audit streams and localStorage overhead.
 */

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

const NOOP_ACTIVITY: UserActivity = {
  id: 'noop',
  userId: 'local',
  category: 'SYSTEM',
  action: '',
  timestamp: ''
};

export function getLocalActivities(): UserActivity[] {
  return [];
}

export async function logActivity(_params: LogActivityParams): Promise<UserActivity> {
  return NOOP_ACTIVITY;
}

export function logNavigation(_toModule: string, _fromModule?: string, _details?: Record<string, any>) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logAuth(
  _action: 'LOGIN' | 'LOGOUT' | 'PROFILE_UPDATE' | 'REGISTRATION' | 'SESSION_START',
  _details?: Record<string, any>
) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logCalculation(
  _moduleName: string,
  _calculationType: string,
  _inputs: Record<string, any>,
  _outputs: Record<string, any>
) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logParamChange(
  _moduleName: string,
  _paramName: string,
  _oldVal: any,
  _newVal: any,
  _extra?: Record<string, any>
) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logExport(_format: string, _title: string, _meta?: Record<string, any>) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logAI(_feature: string, _promptSummary: string, _meta?: Record<string, any>) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logDatabase(_action: string, _entityName: string, _details?: Record<string, any>) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export function logSystem(_action: string, _details?: Record<string, any>) {
  return Promise.resolve(NOOP_ACTIVITY);
}

export async function fetchCloudActivities(): Promise<UserActivity[]> {
  return [];
}

export async function syncPendingActivities(): Promise<number> {
  return 0;
}

export async function clearAllActivities(): Promise<void> {}

export function subscribeToActivities(listener: (activities: UserActivity[]) => void): () => void {
  listener([]);
  return () => {};
}

export function exportActivitiesAsJson(_activities?: UserActivity[]): void {}

export function exportActivitiesAsCsv(_activities?: UserActivity[]): void {}
