'use client';

import { useState } from 'react';
import Image from 'next/image';

interface QuickConfessionResult {
  project: {
    id: string;
    name: string;
  };
  charts: any[];
  confession: string;
  talkingPoints: string[];
  dataSources: number;
}

export default function QuickConfessionWizard({ onComplete, onCancel }: { onComplete: (result: QuickConfessionResult) => void; onCancel: () => void }) {
  const [step, setStep] = useState<'upload' | 'question' | 'generating' | 'results'>('upload');
  const [files, setFiles] = useState<Array<{ name: string; path?: string; content?: string; type: 'CSV' | 'XLSX' | 'URL' | 'TEXT' }>>([]);
  const [question, setQuestion] = useState('');
  const [audience, setAudience] = useState<'SELF' | 'MANAGER_DIRECTOR' | 'EXECUTIVE_EXTERNAL'>('SELF');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');
  const [result, setResult] = useState<QuickConfessionResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = async () => {
    // Check if running in Tauri (desktop mode)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { open } = await import('@tauri-apps/api/dialog');
        const selected = await open({
          multiple: true,
          filters: [{
            name: 'Data Files',
            extensions: ['csv', 'xlsx', 'xls']
          }]
        });

        if (selected) {
          const filePaths = Array.isArray(selected) ? selected : [selected];
          const newFiles = filePaths.map((path: string) => ({
            name: path.split(/[/\\]/).pop() || 'file',
            path,
            type: (path.endsWith('.xlsx') || path.endsWith('.xls')) ? 'XLSX' as const : 'CSV' as const,
          }));
          setFiles([...files, ...newFiles]);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to select file');
      }
    } else {
      // Web mode - use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.csv,.xlsx,.xls';
      input.onchange = (e: any) => {
        const selectedFiles = Array.from(e.target.files || []) as File[];
        selectedFiles.forEach(async (file) => {
          const bytes = await file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          setFiles([...files, {
            name: file.name,
            content: base64,
            type: (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) ? 'XLSX' : 'CSV',
          }]);
        });
      };
      input.click();
    }
  };

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      setFiles([...files, {
        name: new URL(urlInput).hostname,
        content: urlInput,
        type: 'URL',
      }]);
      setUrlInput('');
    }
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      setFiles([...files, {
        name: textName || 'Pasted Text',
        content: textInput,
        type: 'TEXT',
      }]);
      setTextInput('');
      setTextName('');
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError('Please add at least one file, URL, or text');
      return;
    }
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setStep('generating');
    setError('');

    try {
      // Prepare files for API
      const filesForApi = await Promise.all(
        files.map(async (file) => {
          if (file.type === 'CSV' || file.type === 'XLSX') {
            if (file.path && typeof window !== 'undefined' && (window as any).__TAURI__) {
              // Desktop mode - read file
              const { readBinaryFile } = await import('@tauri-apps/api/fs');
              const fileData = await readBinaryFile(file.path);
              const base64 = Buffer.from(fileData).toString('base64');
              return {
                name: file.name,
                path: file.path,
                content: base64,
                type: file.type,
              };
            } else {
              // Web mode - already have base64 content
              return {
                name: file.name,
                content: file.content,
                type: file.type,
              };
            }
          } else {
            return {
              name: file.name,
              content: file.content,
              type: file.type,
            };
          }
        })
      );

      const response = await fetch('/api/quick-confession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          audience,
          files: filesForApi,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        setStep('results');
      } else {
        setError(data.error || 'Failed to generate confession');
        setStep('upload');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate confession');
      setStep('upload');
    }
  };

  if (step === 'results' && result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full m-4 shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Confession</h2>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Confession Paragraph */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Confession:</h3>
            <p className="text-slate-900 leading-relaxed">{result.confession}</p>
          </div>

          {/* Talking Points */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">What you can say in the meeting:</h3>
            <ul className="space-y-2">
              {result.talkingPoints.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-slate-600 mr-2">•</span>
                  <span className="text-slate-900">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Charts Preview */}
          {result.charts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Charts ({result.charts.length}):</h3>
              <div className="grid grid-cols-2 gap-3">
                {result.charts.map((chart) => (
                  <div key={chart.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="text-sm font-medium text-slate-900">{chart.title}</div>
                    {chart.insight && (
                      <div className="text-xs text-slate-600 mt-1">{chart.insight}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => onComplete(result)}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Save as Full Project
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl border border-slate-200 text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Hearing the confession...</h3>
          <p className="text-sm text-slate-600">
            Processing your data and generating insights. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'question') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4 shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Quick Confession</h2>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What are you trying to figure out?
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are our key sales trends for Q1? Are we growing in the right regions?"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-h-[100px]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Who is this for?
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="SELF">Just me</option>
              <option value="MANAGER_DIRECTOR">My team</option>
              <option value="EXECUTIVE_EXTERNAL">Executives / clients</option>
            </select>
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium text-slate-700 mb-2">Files & Sources ({files.length}):</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-sm text-slate-700">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!question.trim() || files.length === 0}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Hear the confession
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upload step
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4 shadow-xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Quick Confession</h2>
            <p className="text-sm text-slate-600 mt-1">Drop in files, links, or text. Get instant insights.</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* File Upload */}
        <div className="mb-6">
          <button
            onClick={handleFileSelect}
            className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-center"
          >
            <div className="text-slate-600 mb-2">📁</div>
            <div className="text-sm font-medium text-slate-700">Click to select files</div>
            <div className="text-xs text-slate-500 mt-1">CSV or Excel files</div>
          </button>
        </div>

        {/* URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Or paste a URL</label>
          <div className="flex space-x-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddUrl();
              }}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
            <button
              onClick={handleAddUrl}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Or paste text</label>
          <input
            type="text"
            value={textName}
            onChange={(e) => setTextName(e.target.value)}
            placeholder="Name for this text (optional)"
            className="w-full mb-2 px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
          <div className="flex space-x-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your text here..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-h-[80px]"
            />
            <button
              onClick={handleAddText}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors self-start"
            >
              Add
            </button>
          </div>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-slate-700 mb-2">Added ({files.length}):</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-sm text-slate-700">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setStep('question')}
            disabled={files.length === 0}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

