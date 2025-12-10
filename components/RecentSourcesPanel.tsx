'use client';

import { useState, useEffect } from 'react';
import { getRecentSourcesAsync, getRecentTemplatesAsync, type RecentSource, type RecentTemplate } from '@/lib/recent-sources';

interface RecentSourcesPanelProps {
  onSelectSource?: (source: RecentSource) => void;
  onSelectTemplate?: (templateId: string) => void;
}

export default function RecentSourcesPanel({ onSelectSource, onSelectTemplate }: RecentSourcesPanelProps) {
  const [sources, setSources] = useState<RecentSource[]>([]);
  const [templates, setTemplates] = useState<RecentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const [recentSources, recentTemplates] = await Promise.all([
        getRecentSourcesAsync(),
        getRecentTemplatesAsync(),
      ]);
      setSources(recentSources);
      setTemplates(recentTemplates);
    } catch (error) {
      console.error('Failed to load recent items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      file: '📁',
      url: '🔗',
      text: '📝',
    };
    return icons[type] || '📄';
  };

  if (loading) {
    return (
      <div className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4">
        <p className="text-sm text-gray-500">Loading recent items...</p>
      </div>
    );
  }

  if (sources.length === 0 && templates.length === 0) {
    return (
      <div className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Recent</h3>
        <p className="text-sm text-gray-500">No recent sources or templates</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Recent</h3>

      {sources.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Sources</h4>
          <div className="space-y-2">
            {sources.slice(0, 5).map((source) => (
              <button
                key={source.id}
                onClick={() => onSelectSource?.(source)}
                className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span>{getTypeIcon(source.type)}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{source.name}</span>
                </div>
                <div className="text-xs text-gray-500">{formatDate(source.lastUsed)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {templates.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Templates</h4>
          <div className="space-y-2">
            {templates.slice(0, 5).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate?.(template.templateId)}
                className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span>📋</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{template.name}</span>
                </div>
                <div className="text-xs text-gray-500">{formatDate(template.lastUsed)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

