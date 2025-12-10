// Desktop configuration utilities
// Detects if running in Tauri and provides desktop-specific functions

export function isDesktop(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!(window as any).__TAURI__;
}

export async function getAppDataDir(): Promise<string> {
  if (isDesktop()) {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      return await appDataDir();
    } catch (error) {
      console.error('Failed to get app data directory:', error);
      return './';
    }
  }
  return './';
}

export async function getDownloadsDir(): Promise<string> {
  if (isDesktop()) {
    try {
      const { downloadDir } = await import('@tauri-apps/api/path');
      return await downloadDir();
    } catch (error) {
      console.error('Failed to get downloads directory:', error);
      return './';
    }
  }
  return './';
}

