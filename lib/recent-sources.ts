/**
 * Recent sources storage utilities
 * Uses localStorage for web, Tauri store for desktop
 */

interface RecentSource {
  id: string;
  name: string;
  path?: string;
  projectId: string;
  type: 'file' | 'url' | 'text';
  lastUsed: number;
}

interface RecentTemplate {
  id: string;
  name: string;
  templateId: string;
  lastUsed: number;
}

const RECENT_SOURCES_KEY = 'data-confessional-recent-sources';
const RECENT_TEMPLATES_KEY = 'data-confessional-recent-templates';
const MAX_RECENT_ITEMS = 10;

export async function saveRecentSource(source: Omit<RecentSource, 'lastUsed'>): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Check if running in Tauri
    if ((window as any).__TAURI__) {
      // Use Tauri store API if available
      const { Store } = await import('@tauri-apps/api/store');
      const store = new Store('.recent-sources.dat');

      const recent = (await store.get<RecentSource[]>(RECENT_SOURCES_KEY)) || [];
      const updated = [
        { ...source, lastUsed: Date.now() },
        ...recent.filter(s => s.id !== source.id),
      ].slice(0, MAX_RECENT_ITEMS);

      await store.set(RECENT_SOURCES_KEY, updated);
      await store.save();
    } else {
      // Use localStorage for web
      const recent = getRecentSources();
      const updated = [
        { ...source, lastUsed: Date.now() },
        ...recent.filter(s => s.id !== source.id),
      ].slice(0, MAX_RECENT_ITEMS);

      localStorage.setItem(RECENT_SOURCES_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to save recent source:', error);
  }
}

export function getRecentSources(): RecentSource[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_SOURCES_KEY);
    if (stored) {
      const sources = JSON.parse(stored) as RecentSource[];
      return sources.sort((a, b) => b.lastUsed - a.lastUsed);
    }
  } catch (error) {
    console.error('Failed to load recent sources:', error);
  }

  return [];
}

export async function getRecentSourcesAsync(): Promise<RecentSource[]> {
  if (typeof window === 'undefined') return [];

  try {
    // Check if running in Tauri
    if ((window as any).__TAURI__) {
      const { Store } = await import('@tauri-apps/api/store');
      const store = new Store('.recent-sources.dat');
      const recent = (await store.get<RecentSource[]>(RECENT_SOURCES_KEY)) || [];
      return recent.sort((a, b) => b.lastUsed - a.lastUsed);
    } else {
      return getRecentSources();
    }
  } catch (error) {
    console.error('Failed to load recent sources:', error);
    return [];
  }
}

export async function saveRecentTemplate(template: Omit<RecentTemplate, 'lastUsed'>): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Check if running in Tauri
    if ((window as any).__TAURI__) {
      const { Store } = await import('@tauri-apps/api/store');
      const store = new Store('.recent-templates.dat');

      const recent = (await store.get<RecentTemplate[]>(RECENT_TEMPLATES_KEY)) || [];
      const updated = [
        { ...template, lastUsed: Date.now() },
        ...recent.filter(t => t.templateId !== template.templateId),
      ].slice(0, MAX_RECENT_ITEMS);

      await store.set(RECENT_TEMPLATES_KEY, updated);
      await store.save();
    } else {
      // Use localStorage for web
      const recent = getRecentTemplates();
      const updated = [
        { ...template, lastUsed: Date.now() },
        ...recent.filter(t => t.templateId !== template.templateId),
      ].slice(0, MAX_RECENT_ITEMS);

      localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to save recent template:', error);
  }
}

export function getRecentTemplates(): RecentTemplate[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
    if (stored) {
      const templates = JSON.parse(stored) as RecentTemplate[];
      return templates.sort((a, b) => b.lastUsed - a.lastUsed);
    }
  } catch (error) {
    console.error('Failed to load recent templates:', error);
  }

  return [];
}

export async function getRecentTemplatesAsync(): Promise<RecentTemplate[]> {
  if (typeof window === 'undefined') return [];

  try {
    // Check if running in Tauri
    if ((window as any).__TAURI__) {
      const { Store } = await import('@tauri-apps/api/store');
      const store = new Store('.recent-templates.dat');
      const recent = (await store.get<RecentTemplate[]>(RECENT_TEMPLATES_KEY)) || [];
      return recent.sort((a, b) => b.lastUsed - a.lastUsed);
    } else {
      return getRecentTemplates();
    }
  } catch (error) {
    console.error('Failed to load recent templates:', error);
    return [];
  }
}

