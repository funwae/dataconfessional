'use client';

import { useState, useEffect } from 'react';
import { saveRecentSource } from '@/lib/recent-sources';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  tables?: any[];
  documentChunks?: any[];
  _count?: {
    tables: number;
    documentChunks: number;
  };
}

export default function DataSourcesTab({ projectId, onUpdate }: { projectId: string; onUpdate: () => void }) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [urlName, setUrlName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textName, setTextName] = useState('');
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadDataSources();
  }, [projectId]);

  const loadDataSources = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/data-sources`);
      const data = await response.json();
      setDataSources(data.dataSources || []);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    // Check if running in Tauri (desktop mode)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { open } = await import('@tauri-apps/api/dialog');
        const { readBinaryFile } = await import('@tauri-apps/api/fs');

        const selected = await open({
          multiple: false,
          filters: [{
            name: 'Data Files',
            extensions: ['csv', 'xlsx', 'xls']
          }]
        });

        if (!selected || typeof selected !== 'string') {
          return; // User cancelled
        }

        setUploading(true);

        // Read file using Tauri
        const fileData = await readBinaryFile(selected);
        const fileName = selected.split(/[/\\]/).pop() || 'file';

        // Create FormData with file data
        const formData = new FormData();
        const blob = new Blob([fileData], { type: 'application/octet-stream' });
        formData.append('file', blob, fileName);
        formData.append('name', fileName);
        formData.append('filePath', selected); // Send path for desktop mode

        const response = await fetch(`/api/projects/${projectId}/data-sources/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          // Save to recent sources
          if (data.dataSource) {
            await saveRecentSource({
              id: data.dataSource.id,
              name: data.dataSource.name,
              path: selected,
              projectId: projectId,
              type: data.dataSource.type.toLowerCase(),
            });
          }
          setShowUploadModal(false);
          loadDataSources();
          onUpdate();
        } else {
          const data = await response.json();
          alert(data.error || 'Upload failed. Please check the file format and try again.');
        }
      } catch (error: any) {
        console.error('File upload error:', error);
        if (error.message) {
          alert(error.message);
        } else if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
          alert('Network error. Please check your connection and try again.');
        } else {
          alert('Upload failed. Please check the file format (CSV or Excel) and try again.');
        }
      } finally {
        setUploading(false);
      }
    } else {
      // Web mode - use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.xlsx,.xls';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        try {
          const response = await fetch(`/api/projects/${projectId}/data-sources/upload`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            // Save to recent sources
            if (data.dataSource) {
              await saveRecentSource({
                id: data.dataSource.id,
                name: data.dataSource.name,
                projectId: projectId,
                type: data.dataSource.type.toLowerCase(),
                path: file.name,
              });
            }
            setShowUploadModal(false);
            loadDataSources();
            onUpdate();
          } else {
            const data = await response.json();
            alert(data.error || 'Upload failed');
          }
        } catch (error) {
          alert('Upload failed');
        } finally {
          setUploading(false);
        }
      };
      input.click();
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/data-sources/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: urlName || undefined }),
      });

      if (response.ok) {
        const data = await response.json();
        // Save to recent sources
        if (data.dataSource) {
          await saveRecentSource({
            id: data.dataSource.id,
            name: data.dataSource.name,
            projectId: projectId,
            type: data.dataSource.type.toLowerCase(),
            path: url,
          });
        }
        setShowUrlModal(false);
        setUrl('');
        setUrlName('');
        loadDataSources();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to fetch URL');
      }
    } catch (error) {
      alert('Failed to fetch URL');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/data-sources/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textContent,
          name: textName || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Save to recent sources
        if (data.dataSource) {
          await saveRecentSource({
            id: data.dataSource.id,
            name: data.dataSource.name,
            projectId: projectId,
            type: data.dataSource.type.toLowerCase(),
            path: 'Pasted Text',
          });
        }
        setShowTextModal(false);
        setTextContent('');
        setTextName('');
        loadDataSources();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add text');
      }
    } catch (error) {
      alert('Failed to add text');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (sourceId: string) => {
    setPreviewSource(sourceId);
    setPreviewData(null);
    try {
      const response = await fetch(`/api/data-sources/${sourceId}/preview`);
      const data = await response.json();
      if (response.ok) {
        setPreviewData(data.preview);
      } else {
        alert(data.error || 'Failed to load preview');
        setPreviewSource(null);
      }
    } catch (error) {
      alert('Failed to load preview');
      setPreviewSource(null);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading data sources...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">What you brought in</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add files, links, or text to this confession
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleFileUpload}
            disabled={uploading}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '📁 Files'}
          </button>
          <button
            onClick={() => setShowUrlModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
          >
            🔗 Links
          </button>
          <button
            onClick={() => setShowTextModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
          >
            📝 Text
          </button>
        </div>
      </div>

      {dataSources.length === 0 ? (
        <div className="text-center py-12 bg-white/70 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-gray-600 mb-2">This room is quiet.</p>
          <p className="text-sm text-gray-500">Add a few files or links and we'll start listening.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dataSources.map((source) => (
            <div key={source.id} className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {source.type === 'FILE' ? '📄 File' : source.type === 'URL' ? '🔗 Link' : '📝 Text'} • {
                      source.status === 'PROCESSED'
                        ? 'Processed — this source is now part of the story'
                        : source.status === 'ERROR'
                        ? "Couldn't process this one"
                        : 'Processing… listening closely'
                    }
                  </p>
                  {source._count && (
                    <p className="text-sm text-gray-500 mt-2">
                      {source._count.tables > 0 && `${source._count.tables} tables`}
                      {source._count.documentChunks > 0 && `${source._count.documentChunks} chunks`}
                    </p>
                  )}
                  {source.tables && source.tables.length > 0 && (
                    <div className="mt-3">
                      {source.tables.map((table: any) => (
                        <div key={table.id} className="text-xs text-gray-600 mb-1">
                          {table.name}: {table.rowCount} rows × {table.columnCount} columns
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreview(source.id)}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                  >
                    View Summary
                  </button>
                  <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    source.status === 'PROCESSED'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : source.status === 'ERROR'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {source.status}
                </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Data Source Summary</h3>
              <button
                onClick={() => {
                  setPreviewSource(null);
                  setPreviewData(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            {previewData ? (
              <div className="space-y-4">
                {previewData.tables?.map((table: any) => (
                  <div key={table.name} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{table.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {table.rowCount} rows × {table.columnCount} columns
                    </p>
                    <div className="mb-3">
                      <h5 className="text-sm font-medium mb-2">Columns:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {table.columns?.map((col: any) => (
                          <div key={col.name} className="bg-gray-50 p-2 rounded">
                            <div className="font-medium">{col.name}</div>
                            <div className="text-gray-600">{col.type}</div>
                            {col.dataType === 'numeric' && col.mean && (
                              <div className="text-gray-500">
                                {col.min} - {col.max} (avg: {col.mean.toFixed(2)})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {table.sampleRows && table.sampleRows.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Sample Data (first 10 rows):</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(table.sampleRows[0] || {}).map((key) => (
                                  <th key={key} className="px-2 py-1 text-left">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.sampleRows.map((row: any, idx: number) => (
                                <tr key={idx} className="border-t">
                                  {Object.values(row).map((val: any, i: number) => (
                                    <td key={i} className="px-2 py-1">{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {previewData.textPreview && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Text Content</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {previewData.totalChunks} chunks total
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {previewData.textPreview.map((chunk: any, idx: number) => (
                        <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500 mb-1">Chunk {chunk.orderIndex + 1}</div>
                          <div className="text-gray-700">{chunk.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">Loading preview...</div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal (Web mode only - desktop uses native dialog) */}
      {showUploadModal && typeof window !== 'undefined' && !(window as any).__TAURI__ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-lg font-semibold mb-2">Files</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload CSV or Excel files. We'll profile the columns and use them for charts and reports.
            </p>
            <div className="mb-4 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploading(true);
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('name', file.name);

                    fetch(`/api/projects/${projectId}/data-sources/upload`, {
                      method: 'POST',
                      body: formData,
                    })
                      .then(async (response) => {
                        if (response.ok) {
                          setShowUploadModal(false);
                          loadDataSources();
                          onUpdate();
                        } else {
                          const data = await response.json();
                          alert(data.error || 'Upload failed');
                        }
                      })
                      .catch(() => alert('Upload failed'))
                      .finally(() => setUploading(false));
                  }
                }}
                disabled={uploading}
                className="w-full text-sm"
              />
              {uploading && (
                <p className="text-xs text-gray-500 mt-2">Listening to this file…</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-lg font-semibold mb-2">Links</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste links to pages, articles, or docs you want the booth to read.
            </p>
            <form onSubmit={handleUrlSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Paste a link you want the booth to read"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Custom name"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Fetching...' : 'Add Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Text Paste Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-lg font-semibold mb-2">Text</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste any notes, transcripts, or descriptions that add context.
            </p>
            <form onSubmit={handleTextSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={textName}
                  onChange={(e) => setTextName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Text source name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Content
                </label>
                <textarea
                  required
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md h-40 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Paste raw text here…"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={uploading || !textContent.trim()}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Adding...' : 'Add Text'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTextModal(false);
                    setTextContent('');
                    setTextName('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


