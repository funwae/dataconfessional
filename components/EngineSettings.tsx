'use client';

import { useState, useEffect } from 'react';
import { checkEngineHealth, installPack } from '@/lib/engine-client';
import type { EngineHealth } from '@/lib/engine-config';
import { DEFAULT_CONFIG } from '@/lib/engine-config';

interface EngineSettingsProps {
  onClose?: () => void;
}

export default function EngineSettings({ onClose }: EngineSettingsProps) {
  const [health, setHealth] = useState<EngineHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const healthStatus = await checkEngineHealth();
      setHealth(healthStatus);
      setSelectedPack(healthStatus.activePackId || 'analyst_fast');
    } catch (error: any) {
      console.error('Failed to load engine health:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairPack = async () => {
    if (!health?.activePackId) return;

    setLoading(true);
    try {
      const updatedHealth = await installPack(health.activePackId);
      setHealth(updatedHealth);
    } catch (error: any) {
      console.error('Failed to repair pack:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPack = async () => {
    if (!selectedPack) return;

    setLoading(true);
    try {
      const updatedHealth = await installPack(selectedPack);
      setHealth(updatedHealth);
    } catch (error: any) {
      console.error('Failed to switch pack:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    setTesting(true);
    setTestResult('');

    try {
      const { chat } = await import('@/lib/engine-client');
      const startTime = Date.now();

      await chat(
        {
          role: 'analysis',
          question: 'Say "ready" once.',
          contextSummary: 'Test',
          projectMeta: { name: 'Test', audience: 'self' },
        },
        (chunk) => {
          setTestResult((prev) => prev + chunk);
        }
      );

      const latency = Date.now() - startTime;
      setTestResult((prev) => prev + `\n\n(Latency: ${latency}ms)`);
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600">Loading engine status...</div>
      </div>
    );
  }

  const statusIcon = health?.engineConfigured
    ? '✅'
    : health?.ollamaAvailable
    ? '⚠️'
    : '❌';

  const statusText = health?.engineConfigured
    ? 'All good'
    : health?.ollamaAvailable
    ? 'Degraded'
    : 'Not connected';

  return (
    <div className="p-6 bg-white/70 rounded-lg shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Engine Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {/* Engine Status */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Engine Status</h3>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">{statusIcon}</span>
          <span className="text-slate-900">{statusText}</span>
        </div>
        {health && (
          <div className="text-xs text-slate-600 space-y-1">
            <div>Ollama: {health.ollamaAvailable ? 'Available' : 'Not available'}</div>
            {health.activePackId && (
              <div>Active Pack: {DEFAULT_CONFIG.packs[health.activePackId]?.label || health.activePackId}</div>
            )}
            {health.missingModels && health.missingModels.length > 0 && (
              <div className="text-amber-600">
                Missing: {health.missingModels.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pack Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Model Pack</h3>
        <select
          value={selectedPack}
          onChange={(e) => setSelectedPack(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 mb-2"
        >
          {Object.entries(DEFAULT_CONFIG.packs).map(([packId, pack]) => (
            <option key={packId} value={packId}>
              {pack.label}
            </option>
          ))}
        </select>
        <div className="flex space-x-2">
          <button
            onClick={handleSwitchPack}
            disabled={loading || selectedPack === health?.activePackId}
            className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Switch Pack
          </button>
          {health?.missingModels && health.missingModels.length > 0 && (
            <button
              onClick={handleRepairPack}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:opacity-50 transition-colors"
            >
              Repair Pack
            </button>
          )}
        </div>
      </div>

      {/* Quick Test */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Diagnostics</h3>
        <button
          onClick={handleQuickTest}
          disabled={testing || !health?.engineConfigured}
          className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          {testing ? 'Testing...' : 'Run Quick Test'}
        </button>
        {testResult && (
          <div className="mt-2 p-3 bg-slate-50 rounded text-xs text-slate-700 whitespace-pre-wrap">
            {testResult}
          </div>
        )}
      </div>

      {/* GPU Info */}
      {health?.gpuSummary && (
        <div className="text-xs text-slate-600">
          <div>GPU: {health.gpuSummary.vendor}</div>
          {health.gpuSummary.vramGb && (
            <div>VRAM: {health.gpuSummary.vramGb}GB</div>
          )}
        </div>
      )}
    </div>
  );
}

