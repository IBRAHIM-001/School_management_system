export interface SQLiteStatus {
  connected: boolean;
  engine: string;
  dbFile?: string;
  fileSizeBytes?: number;
  lastSyncTime?: string;
  isElectron?: boolean;
  error?: string;
}

export async function checkSQLiteHealth(): Promise<SQLiteStatus> {
  const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isElectron);
  try {
    const res = await fetch('/api/sqlite/stats');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return {
      connected: true,
      engine: data.stats?.dbEngine || 'SQLite 3',
      dbFile: data.stats?.dbFile || 'school_management.db',
      fileSizeBytes: data.stats?.fileSizeBytes || 0,
      lastSyncTime: data.stats?.lastModified || new Date().toISOString(),
      isElectron
    };
  } catch (err: any) {
    return {
      connected: false,
      engine: 'SQLite 3 (Local Cache Fallback)',
      dbFile: 'school_management.db',
      isElectron,
      error: err.message
    };
  }
}

export async function loadFromSQLite() {
  try {
    const res = await fetch('/api/sqlite/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (e) {
    console.warn('[SQLite Client] Could not load from SQLite API directly:', e);
    return null;
  }
}

export async function saveToSQLite(payload: {
  classes?: any[];
  years?: any[];
  terms?: any[];
  students?: any[];
  categories?: any[];
  products?: any[];
  billings?: any[];
  breakdowns?: any[];
  allocations?: any[];
  logs?: any[];
  userAccounts?: any[];
  settings?: Record<string, string>;
  activeTermId?: number;
}) {
  try {
    const res = await fetch('/api/sqlite/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    console.error('[SQLite Client] Failed to save to SQLite database:', e);
    return { success: false, error: e.message };
  }
}

export async function purgeSQLiteServer() {
  try {
    const res = await fetch('/api/sqlite/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    console.error('[SQLite Client] Failed to purge SQLite database:', e);
    return { success: false, error: e.message };
  }
}

export function downloadSQLiteDatabase() {
  window.location.href = '/api/sqlite/download';
}
