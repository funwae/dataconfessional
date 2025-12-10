// API Key storage utilities for desktop app
// Uses Tauri commands to access Windows Credential Manager

export async function getApiKey(): Promise<string | null> {
  // Check if running in Tauri
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    // Web mode - fallback to environment variable
    return process.env.ANTHROPIC_API_KEY || null;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    const key = await invoke<string>('get_api_key');
    return key;
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

export async function storeApiKey(key: string): Promise<void> {
  // Check if running in Tauri
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    // Web mode - can't store securely, just return
    console.warn('API key storage not available in web mode');
    return;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('store_api_key', { key });
  } catch (error) {
    console.error('Failed to store API key:', error);
    throw new Error('Failed to store API key securely');
  }
}

export async function hasApiKey(): Promise<boolean> {
  // Check if running in Tauri
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    // Web mode - check environment variable
    return !!process.env.ANTHROPIC_API_KEY;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    return await invoke<boolean>('has_api_key');
  } catch (error) {
    console.error('Failed to check API key:', error);
    return false;
  }
}

export async function deleteApiKey(): Promise<void> {
  // Check if running in Tauri
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    // Web mode - nothing to delete
    return;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('delete_api_key');
  } catch (error) {
    console.error('Failed to delete API key:', error);
    throw new Error('Failed to delete API key');
  }
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    if (!key || !key.trim()) {
      throw new Error('API key cannot be empty');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your key and try again.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
    }

    return true;
  } catch (error: any) {
    console.error('API key test failed:', error);
    if (error.message) {
      throw error; // Re-throw with user-friendly message
    }
    throw new Error('Failed to connect to API. Please check your internet connection.');
  }
}

