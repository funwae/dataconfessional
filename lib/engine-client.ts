// Frontend wrapper for Tauri engine commands
// Handles streaming responses and error handling

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import type {
  EngineHealth,
  EngineChatRequest,
  EngineReportRequest,
  EngineReportResponse,
} from './engine-config';

/**
 * Check engine health status
 */
export async function checkEngineHealth(): Promise<EngineHealth> {
  try {
    return await invoke<EngineHealth>('engine_health');
  } catch (error: any) {
    throw new Error(error || 'Failed to check engine health');
  }
}

/**
 * Install a model pack
 */
export async function installPack(packId: string): Promise<EngineHealth> {
  try {
    return await invoke<EngineHealth>('engine_install_pack', { packId });
  } catch (error: any) {
    throw new Error(error || 'Failed to install pack');
  }
}

/**
 * Chat with the engine (streaming)
 * Returns the full response and sets up event listeners for chunks
 */
export async function chat(
  request: EngineChatRequest,
  onChunk?: (chunk: string) => void,
  onDone?: () => void
): Promise<string> {
  try {
    // Set up event listeners before calling
    const chunkUnlisten = onChunk
      ? await listen<string>('engine_chat_chunk', (event) => {
          onChunk(event.payload);
        })
      : null;

    const doneUnlisten = onDone
      ? await listen('engine_chat_done', () => {
          onDone();
          chunkUnlisten?.();
          doneUnlisten?.();
        })
      : null;

    // Call the command
    const result = await invoke<string>('engine_chat', { request });

    // Clean up listeners if not already done
    if (!onDone) {
      chunkUnlisten?.();
      doneUnlisten?.();
    }

    return result;
  } catch (error: any) {
    throw new Error(error || 'Failed to chat with engine');
  }
}

/**
 * Generate a report
 */
export async function generateReport(
  request: EngineReportRequest
): Promise<EngineReportResponse> {
  try {
    return await invoke<EngineReportResponse>('engine_generate_report', { request });
  } catch (error: any) {
    throw new Error(error || 'Failed to generate report');
  }
}

