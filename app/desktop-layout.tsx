'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/desktop/Sidebar';
import MainView from '@/components/desktop/MainView';
import QAPanel from '@/components/desktop/QAPanel';
import KeyAdmissionsPanel from '@/components/KeyAdmissionsPanel';
import ProjectSummary from '@/components/ProjectSummary';
import ResultsSummary from '@/components/ResultsSummary';
import { checkEngineHealth } from '@/lib/engine-client';
import type { EngineHealth } from '@/lib/engine-config';
import EngineSettings from '@/components/EngineSettings';

export default function DesktopLayout() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [qaPanelOpen, setQaPanelOpen] = useState(true);
  const [admissionsPanelOpen, setAdmissionsPanelOpen] = useState(false);
  const [engineHealth, setEngineHealth] = useState<EngineHealth | null>(null);
  const [showEngineSettings, setShowEngineSettings] = useState(false);

  useEffect(() => {
    loadEngineHealth();
    // Refresh engine health periodically
    const interval = setInterval(loadEngineHealth, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEngineHealth = async () => {
    try {
      const health = await checkEngineHealth();
      setEngineHealth(health);
    } catch (error) {
      console.error('Failed to check engine health:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#f6f1e8] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        {selectedProject && (
          <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-slate-900">
                  {selectedProject ? 'Project' : 'Data Confessional'}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                {/* Engine Status Indicator */}
                {engineHealth && (
                  <div
                    className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                      engineHealth.engineConfigured
                        ? 'bg-green-100 text-green-700'
                        : engineHealth.ollamaAvailable
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                    title={
                      engineHealth.engineConfigured
                        ? 'Engine ready'
                        : engineHealth.ollamaAvailable
                        ? 'Engine degraded - missing models'
                        : 'Engine not available'
                    }
                  >
                    <span>{engineHealth.engineConfigured ? '✓' : engineHealth.ollamaAvailable ? '⚠' : '✗'}</span>
                    <span>Engine</span>
                  </div>
                )}
                <button
                  onClick={() => setAdmissionsPanelOpen(!admissionsPanelOpen)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    admissionsPanelOpen
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={admissionsPanelOpen ? 'Hide Admissions' : 'Show Admissions'}
                >
                  📌 Key Admissions
                </button>
                <button
                  onClick={() => setQaPanelOpen(!qaPanelOpen)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    qaPanelOpen
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {qaPanelOpen ? 'Hide Q&A' : 'Show Q&A'}
                </button>
                <button
                  onClick={() => setShowEngineSettings(!showEngineSettings)}
                  className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedProject && (
              <>
                {/* Results Summary */}
                <div className="px-6 pt-4">
                  <ResultsSummary projectId={selectedProject} />
                </div>
                {/* Project Summary */}
                <div className="px-6">
                  <ProjectSummary projectId={selectedProject} />
                </div>
              </>
            )}
            <MainView projectId={selectedProject} />
          </div>
          {admissionsPanelOpen && selectedProject && (
            <div className="w-80 border-l border-slate-200 bg-white/70">
              <KeyAdmissionsPanel projectId={selectedProject} />
            </div>
          )}
          {qaPanelOpen && (
            <QAPanel
              projectId={selectedProject}
              onClose={() => setQaPanelOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Engine Settings Modal */}
      {showEngineSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEngineSettings(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full border border-slate-200 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Engine Settings</h2>
              <button
                onClick={() => setShowEngineSettings(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <EngineSettings onClose={() => setShowEngineSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

