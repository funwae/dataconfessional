// File storage utilities for desktop app
// Uses Tauri app data directory when available

export async function getUploadsDir(projectId: string): Promise<string> {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const { join } = await import('@tauri-apps/api/path');
      const appData = await appDataDir();
      return await join(appData, 'projects', projectId, 'uploads');
    } catch (error) {
      console.error('Failed to get uploads directory:', error);
      // Fallback
      return `./uploads/${projectId}`;
    }
  }

  // Web mode
  return `./uploads/${projectId}`;
}

export async function getExportsDir(projectId: string): Promise<string> {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const { join } = await import('@tauri-apps/api/path');
      const appData = await appDataDir();
      return await join(appData, 'projects', projectId, 'exports');
    } catch (error) {
      console.error('Failed to get exports directory:', error);
      // Fallback
      return `./exports/${projectId}`;
    }
  }

  // Web mode
  return `./exports/${projectId}`;
}

export async function ensureProjectDirs(projectId: string): Promise<void> {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { createDir } = await import('@tauri-apps/api/fs');
      const { exists } = await import('@tauri-apps/api/fs');
      const uploadsDir = await getUploadsDir(projectId);
      const exportsDir = await getExportsDir(projectId);

      if (!(await exists(uploadsDir))) {
        await createDir(uploadsDir, { recursive: true });
      }
      if (!(await exists(exportsDir))) {
        await createDir(exportsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to ensure project directories:', error);
    }
  }
  // Web mode - directories created by API routes
}

