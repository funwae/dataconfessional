'use client';

import { useState, useEffect } from 'react';
import ExportPreview from './ExportPreview';
import SaveTemplateModal from './SaveTemplateModal';

interface ReportSection {
  id: string;
  key: string;
  title: string;
  content: string;
  orderIndex: number;
}

interface Report {
  id: string;
  title: string;
  templateType: string;
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}

export default function ReportsTab({ projectId, onUpdate }: { projectId: string; onUpdate: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'SUMMARY' | 'DECK' | 'FULL' | 'MARKDOWN' | 'MEETING_BRIEF' | 'SPEAKER_NOTES'>('MARKDOWN');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [tone, setTone] = useState<'serious' | 'gossip'>('serious');
  const [projectTone, setProjectTone] = useState<'serious' | 'gossip'>('serious');

  useEffect(() => {
    loadReports();
    loadProjectTone();
  }, [projectId]);

  const loadProjectTone = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.project?.tone) {
        setProjectTone(data.project.tone);
        setTone(data.project.tone);
      }
    } catch (error) {
      console.error('Failed to load project tone:', error);
    }
  };

  const handleUpdateTone = async (newTone: 'serious' | 'gossip') => {
    setTone(newTone);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: newTone }),
      });
      setProjectTone(newTone);
    } catch (error) {
      console.error('Failed to update tone:', error);
    }
  };

  const handlePinAdmission = async (sourceId: string, text: string, sourceType: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.length > 200 ? text.substring(0, 200) + '...' : text,
          sourceType,
          sourceId,
          isTalkingPoint: false,
        }),
      });

      if (response.ok) {
        // Show a brief success indicator
        alert('Admission pinned!');
      }
    } catch (error) {
      console.error('Failed to pin admission:', error);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/reports`);
      const data = await response.json();
      setReports(data.reports || []);
      if (data.reports && data.reports.length > 0) {
        setSelectedReport(data.reports[0]);
        setSelectedSection(data.reports[0].sections[0] || null);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exportType,
          includeCharts,
          includeAppendix: false,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Check if running in Tauri (desktop mode)
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          try {
            const { save } = await import('@tauri-apps/api/dialog');
            const { writeTextFile } = await import('@tauri-apps/api/fs');
            const { sendNotification } = await import('@tauri-apps/api/notification');

            // Get export content from API
            const exportResponse = await fetch(data.downloadUrl);
            const content = await exportResponse.text();

            // Determine file extension
            const extensions: Record<string, string> = {
              'SUMMARY': 'md',
              'DECK': 'md',
              'FULL': 'md',
              'MARKDOWN': 'md',
            };
            const ext = extensions[exportType] || 'md';

            // Show save dialog
            const filePath = await save({
              filters: [{
                name: exportType,
                extensions: [ext]
              }],
              defaultPath: `${selectedReport.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${ext}`
            });

            if (filePath) {
              await writeTextFile(filePath, content);
              await sendNotification({
                title: 'Export Complete',
                body: `File saved to ${filePath}`,
              });
              setShowExportModal(false);
            }
          } catch (error: any) {
            console.error('Tauri export error:', error);
            alert(error.message || 'Failed to save file');
          }
        } else {
          // Web mode - download file
          window.location.href = data.downloadUrl;
          setShowExportModal(false);
        }
      } else {
        alert(data.error || 'Export failed');
      }
    } catch (error) {
      alert('Export failed');
    }
  };

  const handleSectionEdit = async (sectionId: string, content: string) => {
    // Update local state immediately
    setEditingContent({ ...editingContent, [sectionId]: content });

    // Update selected section
    if (selectedSection && selectedSection.id === sectionId) {
      setSelectedSection({ ...selectedSection, content });
    }

    // Save to backend
    try {
      await fetch(`/api/reports/${selectedReport?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: [{ id: sectionId, content }],
        }),
      });
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  };

  const handleRegenerateSection = async (sectionId: string) => {
    if (!selectedReport || !selectedSection) return;

    setRegenerating(true);
    try {
      // In desktop mode, use engine directly
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        // Fetch project data for context
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        const projectData = await projectResponse.json();

        if (!projectResponse.ok || !projectData.project) {
          throw new Error('Failed to load project data');
        }

        const project = projectData.project;

        // Build data summary
        const dataSummaries: string[] = [];
        if (project.dataSources) {
          for (const dataSource of project.dataSources) {
            if (dataSource.tables && dataSource.tables.length > 0) {
              for (const table of dataSource.tables) {
                const summary = `Table "${table.name}" from "${dataSource.name}":
- ${table.rowCount} rows, ${table.columnCount} columns
- Columns: ${table.columnProfiles?.map((cp: any) => `${cp.name} (${cp.dataType})`).join(', ') || 'N/A'}`;
                dataSummaries.push(summary);
              }
            }
          }
        }

        // Use engine to generate report section
        const { generateReport } = await import('@/lib/engine-client');
        const response = await generateReport({
          templateType: selectedReport.templateType || 'general',
          audience: (project.audienceType?.toLowerCase() || 'self') as 'self' | 'team' | 'exec',
          dataSummary: dataSummaries.join('\n\n'),
        });

        // Parse the markdown to extract the section content
        // For now, we'll use the full report and extract the relevant section
        const sectionTitle = selectedSection.title;
        const sectionMatch = response.markdown.match(
          new RegExp(`##\\s+${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i')
        );

        const newContent = sectionMatch ? sectionMatch[1].trim() : response.markdown;

        // Update the section via API
        const updateResponse = await fetch(`/api/reports/${selectedReport.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sections: [{ id: sectionId, content: newContent }],
          }),
        });

        if (updateResponse.ok) {
          loadReports();
        } else {
          const errorData = await updateResponse.json();
          alert(errorData.error || 'Failed to save regenerated section');
        }
      } else {
        // Web mode - use API route
        const response = await fetch(`/api/reports/${selectedReport.id}/sections/${sectionId}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const data = await response.json();
        if (response.ok) {
          loadReports();
        } else {
          alert(data.error || 'Failed to regenerate section');
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to regenerate section');
    } finally {
      setRegenerating(false);
    }
  };

  const formatReportContent = (content: string) => {
    // Enhanced markdown formatting for preview
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentParagraph: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const formatText = (text: string): (string | JSX.Element)[] => {
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      const boldRegex = /\*\*(.+?)\*\*/g;
      const italicRegex = /\*(.+?)\*/g;
      let match;

      // Process bold first
      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-gray-900">{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      // Then process italic in the parts
      const finalParts: (string | JSX.Element)[] = [];
      parts.forEach((part, idx) => {
        if (typeof part === 'string') {
          let partLastIndex = 0;
          while ((match = italicRegex.exec(part)) !== null) {
            if (match.index > partLastIndex) {
              finalParts.push(part.substring(partLastIndex, match.index));
            }
            finalParts.push(<em key={`italic-${idx}-${match.index}`} className="italic text-gray-600">{match[1]}</em>);
            partLastIndex = match.index + match[0].length;
          }
          if (partLastIndex < part.length) {
            finalParts.push(part.substring(partLastIndex));
          }
        } else {
          finalParts.push(part);
        }
      });

      return finalParts.length > 0 ? finalParts : [text];
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ');
        const formatted = formatText(text);
        elements.push(
          <p key={elements.length} className="text-gray-700 leading-relaxed mb-3">
            {formatted}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={elements.length} className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} ml-6 mb-4 space-y-1`}>
            {currentList.map((item, i) => {
              const formatted = formatText(item);
              return (
                <li key={i} className="text-gray-700">
                  {formatted}
                </li>
              );
            })}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        flushParagraph();
        return;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushList();
        flushParagraph();
        const text = trimmed.substring(4);
        const formatted = formatText(text);
        elements.push(
          <h3 key={elements.length} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            {formatted}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        flushList();
        flushParagraph();
        const text = trimmed.substring(3);
        const formatted = formatText(text);
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2">
            {formatted}
          </h2>
        );
        return;
      }

      // Numbered list
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        flushParagraph();
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(numberedMatch[2]);
        return;
      }

      // Bullet list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushParagraph();
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(trimmed.substring(2));
        return;
      }

      // Regular paragraph
      flushList();
      currentParagraph.push(trimmed);
    });

    flushList();
    flushParagraph();

    return <div className="space-y-2">{elements}</div>;
  };

  if (loading) {
    return <div className="text-gray-600">Loading reports...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-600 mb-4">
          No briefings yet. This is where we turn what the data said into something you can say out loud.
        </p>
      </div>
    );
  }

  return (
      <div className="flex gap-6">
      {/* Report Outline */}
      <div className="w-64 bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Briefings and reports</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="text-sm px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 flex items-center space-x-1 transition-colors"
            >
              <span>💾</span>
              <span>Save as Template</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="text-sm px-3 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center space-x-1 transition-colors"
            >
              <span>📥</span>
              <span>Export</span>
            </button>
          </div>
        </div>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {selectedReport?.sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedSection?.id === section.id
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                <span>{section.title}</span>
              </div>
            </button>
          ))}
        </div>
        {selectedReport && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div>{selectedReport.sections.length} sections</div>
              <div className="mt-1">
                {selectedReport.sections.reduce((sum, s) => sum + s.content.length, 0).toLocaleString()} characters
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="flex-1 bg-white/70 rounded-lg shadow-sm border border-slate-200 p-6">
        {selectedSection ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedSection.title}</h2>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Tone:</span>
                  <button
                    onClick={() => handleUpdateTone('serious')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      tone === 'serious'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Serious
                  </button>
                  <button
                    onClick={() => handleUpdateTone('gossip')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      tone === 'gossip'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Data Gossip
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePinAdmission(selectedSection.id, selectedSection.content, 'report')}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                    title="Pin section as admission"
                  >
                    📌 Pin
                  </button>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`px-3 py-1 text-sm rounded ${
                      previewMode
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {previewMode ? '✏️ Edit' : '👁️ Preview'}
                  </button>
                  <button
                    onClick={() => handleRegenerateSection(selectedSection.id)}
                    disabled={regenerating}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {regenerating ? 'Regenerating...' : '🔄 Regenerate'}
                  </button>
                </div>
              </div>
            </div>
            {previewMode ? (
              <div className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 border border-gray-200 min-h-[500px] shadow-inner">
                  {formatReportContent(editingContent[selectedSection.id] ?? selectedSection.content)}
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <textarea
                  value={editingContent[selectedSection.id] ?? selectedSection.content}
                  onChange={(e) => handleSectionEdit(selectedSection.id, e.target.value)}
                  className="w-full min-h-[500px] px-4 py-2 border border-slate-300 rounded-md font-sans text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  placeholder="Start typing your report content here..."
                />
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {previewMode ? 'Preview mode - switch to edit to make changes' : 'Changes are saved automatically'}
              </div>
              <div className="text-xs text-gray-400">
                {selectedSection.content.length} characters
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">Select a section to view content</div>
        )}
      </div>

      {/* Export Modal with Preview */}
      {showExportModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Export Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export Type
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SUMMARY">📄 Executive Summary</option>
                    <option value="DECK">📊 Slide Deck</option>
                    <option value="FULL">📑 Full Report</option>
                    <option value="MARKDOWN">📝 Markdown</option>
                    <option value="MEETING_BRIEF">📋 Meeting Brief (One-Page)</option>
                    <option value="SPEAKER_NOTES">📝 Speaker Notes</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {exportType === 'SUMMARY' && 'Brief executive overview'}
                    {exportType === 'DECK' && 'Presentation-ready slides'}
                    {exportType === 'FULL' && 'Complete detailed report'}
                    {exportType === 'MARKDOWN' && 'Plain text markdown format'}
                    {exportType === 'MEETING_BRIEF' && 'One-page brief with key takeaways and talking points'}
                    {exportType === 'SPEAKER_NOTES' && 'Structured notes for presenting each section'}
                  </p>
                  {(exportType === 'MEETING_BRIEF' || exportType === 'SPEAKER_NOTES') && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                      {exportType === 'MEETING_BRIEF'
                        ? '📄 One-page brief with key takeaways and talking points'
                        : '📝 Structured notes for presenting each section'}
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Include charts in export</span>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setShowExportPreview(true);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center space-x-2"
                  >
                    <span>👁️</span>
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      handleExport();
                    }}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <span>📥</span>
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          projectId={projectId}
          onClose={() => setShowSaveTemplateModal(false)}
          onSaved={() => {
            setShowSaveTemplateModal(false);
            // Optionally show a success message
          }}
        />
      )}

      {/* Export Preview Modal */}
      {showExportPreview && (
        <ExportPreview
          projectId={projectId}
          exportType={exportType}
          includeCharts={includeCharts}
          onClose={() => setShowExportPreview(false)}
          onExport={() => {
            setShowExportPreview(false);
            handleExport();
          }}
        />
      )}
    </div>
  );
}


