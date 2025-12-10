'use client';

import { useState } from 'react';
import AIChatPanel from '@/components/AIChatPanel';

interface QAPanelProps {
  projectId: string | null;
  onClose: () => void;
}

export default function QAPanel({ projectId, onClose }: QAPanelProps) {
  if (!projectId) {
    return (
      <div className="w-80 bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="text-sm text-slate-600 text-center">
          Select a project to start asking questions
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex flex-col">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-2 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900">Interview your data</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600"
          title="Close panel"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChatPanel projectId={projectId} />
      </div>
    </div>
  );
}

