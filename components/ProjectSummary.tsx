'use client';

import { useEffect, useState } from 'react';

interface ProjectSummary {
  dataSourceCount: number;
  chartCount: number;
  reportCount: number;
  totalRows: number;
  lastUpdated: string;
  status: 'ready' | 'in_progress' | 'needs_data';
}

export default function ProjectSummary({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [projectId]);

  const loadSummary = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/summary`);
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready to Export';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Needs Data';
    }
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white/70 rounded-lg shadow-sm border-l-4 border-slate-900 p-4">
          <div className="text-sm text-gray-600 mb-1">Data Sources</div>
          <div className="text-2xl font-bold text-gray-900">{summary.dataSourceCount}</div>
        </div>
        <div className="bg-white/70 rounded-lg shadow-sm border-l-4 border-slate-700 p-4">
          <div className="text-sm text-gray-600 mb-1">Charts</div>
          <div className="text-2xl font-bold text-gray-900">{summary.chartCount}</div>
        </div>
        <div className="bg-white/70 rounded-lg shadow-sm border-l-4 border-green-600 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Rows</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.totalRows.toLocaleString()}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg shadow-sm border-l-4 border-amber-600 p-4">
          <div className="text-sm text-gray-600 mb-1">Reports</div>
          <div className="text-2xl font-bold text-gray-900">{summary.reportCount}</div>
        </div>
      </div>

      <div className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Project Status</div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  summary.status
                )}`}
              >
                {getStatusText(summary.status)}
              </span>
              <span className="text-xs text-gray-500">
                Last updated: {new Date(summary.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
          {summary.status === 'ready' && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Ready for export
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

