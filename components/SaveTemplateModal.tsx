'use client';

import { useState } from 'react';
import { saveRecentTemplate } from '@/lib/recent-sources';

interface SaveTemplateModalProps {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveTemplateModal({ projectId, onClose, onSaved }: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Fetch project data to extract chart configs and report sections
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectResponse.json();

      if (!projectResponse.ok) {
        throw new Error(projectData.error || 'Failed to load project');
      }

      const project = projectData.project;

      // Extract chart configs
      const chartConfigs = (project.charts || []).map((chart: any) => ({
        chartType: chart.chartType,
        config: typeof chart.config === 'string' ? JSON.parse(chart.config) : chart.config,
        title: chart.title,
        insight: chart.insight,
      }));

      // Extract report sections
      const reportSections = (project.reports?.[0]?.sections || []).map((section: any) => ({
        key: section.key,
        title: section.title,
        content: section.content,
        orderIndex: section.orderIndex,
      }));

      // Save template
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          chartConfigs,
          reportSections,
          defaultAudience: project.audienceType,
          defaultTone: 'serious', // Default tone, can be updated later
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Save to recent templates
        if (data.template) {
          await saveRecentTemplate({
            id: data.template.id,
            name: data.template.name,
            templateId: data.template.id,
          });
        }
        onSaved();
        onClose();
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Save as Template</h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Template name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Monthly Sales Review"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe when to use this template..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-h-[80px]"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

