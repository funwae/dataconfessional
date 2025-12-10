'use client';

import { useState, useEffect } from 'react';
import { checkEngineHealth, installPack } from '@/lib/engine-client';
import type { EngineHealth } from '@/lib/engine-config';
import { DEFAULT_CONFIG } from '@/lib/engine-config';

interface EngineSetupWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type Step = 'checking' | 'ollama-missing' | 'pack-selection' | 'installing' | 'complete';

export default function EngineSetupWizard({ onComplete, onSkip }: EngineSetupWizardProps) {
  const [step, setStep] = useState<Step>('checking');
  const [health, setHealth] = useState<EngineHealth | null>(null);
  const [selectedPack, setSelectedPack] = useState<string>('analyst_fast');
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const healthStatus = await checkEngineHealth();
      setHealth(healthStatus);

      if (!healthStatus.ollamaAvailable) {
        setStep('ollama-missing');
      } else if (!healthStatus.engineConfigured || healthStatus.missingModels.length > 0) {
        setStep('pack-selection');
      } else {
        // Already configured
        onComplete();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to check engine status');
      setStep('ollama-missing');
    }
  };

  const handleRetry = () => {
    setError('');
    checkHealth();
  };

  const handleInstallPack = async () => {
    setInstalling(true);
    setError('');
    setInstallProgress('Installing model pack...');

    try {
      const updatedHealth = await installPack(selectedPack);
      setHealth(updatedHealth);
      setStep('complete');
      setInstallProgress('Installation complete!');

      // Auto-complete after a short delay
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to install pack');
      setInstallProgress('');
    } finally {
      setInstalling(false);
    }
  };

  const handleOpenOllamaSite = () => {
    window.open('https://ollama.com/download', '_blank');
  };

  if (step === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f1e8]">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Checking engine status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'ollama-missing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f1e8]">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Set up your local AI engine
            </h1>
            <p className="text-sm text-slate-600">
              Data Confessional uses a small background app called Ollama to run models on your machine. Install it once, and the booth will handle the rest.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleOpenOllamaSite}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Download Ollama for Windows
            </button>
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
            >
              I've installed it – Retry
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'pack-selection') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f1e8]">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full border border-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Choose an engine pack
            </h1>
            <p className="text-sm text-slate-600">
              Select a model pack based on your hardware. You can change this later in settings.
            </p>
          </div>

          {health?.missingModels && health.missingModels.length > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded text-sm">
              Missing models: {health.missingModels.join(', ')}
            </div>
          )}

          <div className="space-y-3 mb-6">
            {Object.entries(DEFAULT_CONFIG.packs).map(([packId, pack]) => (
              <button
                key={packId}
                onClick={() => setSelectedPack(packId)}
                className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${
                  selectedPack === packId
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900">{pack.label}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Analysis: {pack.analysisModel} • Report: {pack.reportModel}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleInstallPack}
              disabled={installing}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {installing ? 'Installing...' : 'Install Pack'}
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'installing' || step === 'complete') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f1e8]">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center">
            {step === 'installing' ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
                <p className="text-slate-600 mb-2">Installing model pack...</p>
                {installProgress && (
                  <p className="text-sm text-slate-500">{installProgress}</p>
                )}
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">✓</div>
                <p className="text-slate-600 mb-4">Your booth is ready. You can start asking questions.</p>
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

