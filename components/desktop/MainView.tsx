'use client';

import { useState } from 'react';
import DataSourcesTab from '@/components/DataSourcesTab';
import DashboardTab from '@/components/DashboardTab';
import ReportsTab from '@/components/ReportsTab';

interface MainViewProps {
  projectId: string | null;
}

export default function MainView({ projectId }: MainViewProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard' | 'reports'>('data');

  const handleUpdate = () => {
    // Trigger refresh if needed
  };

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f6f1e8]">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Select a project to get started</p>
          <p className="text-sm text-slate-500">Or create a new confession from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f6f1e8] overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white/50 backdrop-blur-sm">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('data')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'data'
                ? 'border-slate-700 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            What you brought in
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dashboard'
                ? 'border-slate-700 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            What the data is saying
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-slate-700 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Briefings
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'data' && (
          <DataSourcesTab projectId={projectId} onUpdate={handleUpdate} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab projectId={projectId} onUpdate={handleUpdate} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab projectId={projectId} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
}

