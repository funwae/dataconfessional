'use client';

import { useState, useEffect } from 'react';

interface ExportPreviewProps {
  projectId: string;
  exportType: 'SUMMARY' | 'DECK' | 'FULL' | 'MARKDOWN';
  includeCharts: boolean;
  onClose: () => void;
  onExport: () => void;
}

export default function ExportPreview({
  projectId,
  exportType,
  includeCharts,
  onClose,
  onExport,
}: ExportPreviewProps) {
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadPreview();
  }, [projectId, exportType, includeCharts]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      // Get project stats
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();

      const reportRes = await fetch(`/api/projects/${projectId}/reports`);
      const reportData = await reportRes.json();

      const statsData = {
        reportSections: reportData.reports[0]?.sections?.length || 0,
        chartCount: projectData.project?.charts?.length || 0,
        dataSourceCount: projectData.project?.dataSources?.length || 0,
      };
      setStats(statsData);

      // Generate preview text
      const previewText = generatePreviewText(exportType, statsData, includeCharts);
      setPreview(previewText);
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewText = (type: string, stats: any, charts: boolean) => {
    let text = `Export Type: ${type}\n\n`;
    text += `📊 Export Summary:\n`;
    text += `  • Report Sections: ${stats.reportSections}\n`;
    text += `  • Charts: ${charts ? stats.chartCount : 0} (${charts ? 'included' : 'excluded'})\n`;
    text += `  • Data Sources: ${stats.dataSourceCount}\n\n`;

    if (type === 'SUMMARY') {
      text += `This export will include:\n`;
      text += `  ✓ Executive summary section\n`;
      text += `  ✓ Key insights and takeaways\n`;
      text += `${charts ? '  ✓ Chart references' : '  ✗ Charts (excluded)'}\n`;
    } else if (type === 'DECK') {
      text += `This export will include:\n`;
      text += `  ✓ Title slide\n`;
      text += `  ✓ Overview slide\n`;
      text += `  ✓ One slide per section (${stats.reportSections} slides)\n`;
      text += `${charts ? `  ✓ Chart slides (${stats.chartCount} slides)` : '  ✗ Charts (excluded)'}\n`;
      text += `  ✓ Key takeaways slide\n`;
    } else if (type === 'FULL') {
      text += `This export will include:\n`;
      text += `  ✓ All ${stats.reportSections} report sections\n`;
      text += `  ✓ Complete narrative content\n`;
      text += `${charts ? `  ✓ ${stats.chartCount} charts` : '  ✗ Charts (excluded)'}\n`;
    } else {
      text += `This export will include:\n`;
      text += `  ✓ All report sections in Markdown format\n`;
      text += `${charts ? `  ✓ Chart descriptions` : '  ✗ Charts (excluded)'}\n`;
    }

    return text;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Export Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg shadow-sm">
          <div className="text-sm text-slate-900 whitespace-pre-wrap font-mono leading-relaxed">
            {preview}
          </div>
        </div>

        {stats && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 text-center border border-slate-200">
              <div className="text-3xl font-bold text-slate-900">{stats.reportSections}</div>
              <div className="text-xs text-slate-700 font-medium mt-1">Sections</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
              <div className="text-3xl font-bold text-purple-900">
                {includeCharts ? stats.chartCount : 0}
              </div>
              <div className="text-xs text-purple-700 font-medium mt-1">Charts</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-900">{stats.dataSourceCount}</div>
              <div className="text-xs text-green-700 font-medium mt-1">Data Sources</div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onExport}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 flex items-center justify-center space-x-2 transition-colors"
          >
            <span>📥</span>
            <span>Export Now</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

