'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ResultsSummary {
  projectName: string;
  dataSourceCount: number;
  chartCount: number;
  reportSectionCount: number;
  totalRows: number;
  status: 'ready' | 'in_progress' | 'needs_data';
  lastGenerated: string;
}

export default function ResultsSummary({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSummary();
  }, [projectId]);

  const loadSummary = async () => {
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      const project = projectData.project;

      const summaryRes = await fetch(`/api/projects/${projectId}/summary`);
      const summaryData = await summaryRes.json();

      setSummary({
        projectName: project.name,
        dataSourceCount: summaryData.summary.dataSourceCount,
        chartCount: summaryData.summary.chartCount,
        reportSectionCount: summaryData.summary.reportCount > 0
          ? project.reports[0]?.sections?.length || 0
          : 0,
        totalRows: summaryData.summary.totalRows,
        status: summaryData.summary.status,
        lastGenerated: project.updatedAt,
      });
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const isReady = summary.status === 'ready';

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-sm p-6 border border-slate-200 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Results Summary</h2>
          <p className="text-sm text-gray-600">{summary.projectName}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          isReady
            ? 'bg-green-100 text-green-800 border border-green-300'
            : summary.status === 'in_progress'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-gray-100 text-gray-800 border border-gray-300'
        }`}>
          {isReady ? '✓ Ready to Export' : summary.status === 'in_progress' ? '⏳ In Progress' : '📊 Needs Data'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data Sources</div>
          <div className="text-3xl font-bold text-gray-900">{summary.dataSourceCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.totalRows.toLocaleString()} total rows
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Charts Generated</div>
          <div className="text-3xl font-bold text-gray-900">{summary.chartCount}</div>
          <div className="text-xs text-gray-500 mt-1">Visualizations</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Report Sections</div>
          <div className="text-3xl font-bold text-gray-900">{summary.reportSectionCount}</div>
          <div className="text-xs text-gray-500 mt-1">Content sections</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
          <div className="text-sm font-semibold text-gray-900">
            {new Date(summary.lastGenerated).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(summary.lastGenerated).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {isReady && (
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎉</div>
              <div>
                <div className="font-semibold text-gray-900">Your project is ready!</div>
                <div className="text-sm text-gray-600">
                  All data has been processed and reports are generated. You can now export your results.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                router.push(`/projects/${projectId}`);
                // Switch to reports tab
                setTimeout(() => {
                  const reportsTab = document.querySelector('button:has-text("Reports")');
                  if (reportsTab) (reportsTab as HTMLElement).click();
                }, 100);
              }}
              className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 font-medium flex items-center space-x-2 transition-colors"
            >
              <span>📥</span>
              <span>Go to Export</span>
            </button>
          </div>
        </div>
      )}

      {!isReady && summary.status === 'in_progress' && (
        <div className="bg-white rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">⏳</div>
            <div>
              <div className="font-semibold text-gray-900">Almost there!</div>
              <div className="text-sm text-gray-600">
                {summary.chartCount === 0
                  ? 'Generate your dashboard to create charts and reports.'
                  : 'Your data is being processed. Check back soon.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

