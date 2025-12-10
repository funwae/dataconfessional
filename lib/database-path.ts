// Database path management for desktop app
// Uses Tauri app data directory when available, falls back to current directory for web

export async function getDatabasePath(): Promise<string> {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const appData = await appDataDir();
      return `${appData}data-confessional.db`;
    } catch (error) {
      console.error('Failed to get Tauri app data dir:', error);
      // Fallback to current directory
      return './data-confessional.db';
    }
  }

  // Web mode or fallback
  return './data-confessional.db';
}

export async function ensureDatabaseDir(): Promise<string> {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const { createDir, exists } = await import('@tauri-apps/api/fs');
      const appData = await appDataDir();

      // Ensure app data directory exists
      if (!(await exists(appData))) {
        await createDir(appData, { recursive: true });
      }

      return appData;
    } catch (error) {
      console.error('Failed to ensure database directory:', error);
      return './';
    }
  }

  // Web mode - no directory creation needed
  return './';
}

export async function getDatabaseUrl(): Promise<string> {
  const path = await getDatabasePath();
  return `file:${path}`;
}

export async function initializeDatabasePath(): Promise<void> {
  try {
    await ensureDatabaseDir();
    const dbUrl = await getDatabaseUrl();
    process.env.DATABASE_URL = dbUrl;
  } catch (error: any) {
    console.error('Failed to initialize database path:', error);
    // Fallback to default
    process.env.DATABASE_URL = 'file:./data-confessional.db';

    // If in desktop mode, show user-friendly error
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      throw new Error('Failed to initialize database. Please check file permissions.');
    }
  }
}

