'use client';

import { useState, useEffect } from 'react';

interface KeyAdmission {
  id: string;
  text: string;
  sourceType: string;
  sourceId: string;
  isTalkingPoint: boolean;
  orderIndex: number;
  createdAt: string;
}

export default function KeyAdmissionsPanel({ projectId }: { projectId: string }) {
  const [admissions, setAdmissions] = useState<KeyAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTalkingPoints, setFilterTalkingPoints] = useState(false);

  useEffect(() => {
    loadAdmissions();
  }, [projectId]);

  const loadAdmissions = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/admissions`);
      const data = await response.json();
      setAdmissions(data.admissions || []);
    } catch (error) {
      console.error('Failed to load admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTalkingPoint = async (admissionId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/admissions/${admissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTalkingPoint: !currentValue }),
      });

      if (response.ok) {
        loadAdmissions();
      }
    } catch (error) {
      console.error('Failed to update admission:', error);
    }
  };

  const handleDelete = async (admissionId: string) => {
    if (!confirm('Remove this admission?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/admissions/${admissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadAdmissions();
      }
    } catch (error) {
      console.error('Failed to delete admission:', error);
    }
  };

  const filteredAdmissions = filterTalkingPoints
    ? admissions.filter(a => a.isTalkingPoint)
    : admissions;

  const getSourceLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      chart: '📊 Chart',
      qa: '💬 Q&A',
      report: '📄 Report',
    };
    return labels[sourceType] || sourceType;
  };

  return (
    <div className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Key Admissions</h3>
          <button
            onClick={() => setFilterTalkingPoints(!filterTalkingPoints)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              filterTalkingPoints
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filterTalkingPoints ? 'Show All' : 'Talking Points Only'}
          </button>
        </div>
        <p className="text-xs text-gray-500">Pinned insights from your data</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">Loading...</div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p className="mb-2">No admissions yet</p>
            <p className="text-xs">Pin insights from charts, Q&A, or reports</p>
          </div>
        ) : (
          filteredAdmissions.map((admission) => (
            <div
              key={admission.id}
              className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs text-gray-500">
                      {getSourceLabel(admission.sourceType)}
                    </span>
                    {admission.isTalkingPoint && (
                      <span className="text-xs px-2 py-0.5 bg-slate-900 text-white rounded">
                        Talking Point
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{admission.text}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => handleToggleTalkingPoint(admission.id, admission.isTalkingPoint)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    admission.isTalkingPoint
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {admission.isTalkingPoint ? '✓ Talking Point' : 'Mark as Talking Point'}
                </button>
                <button
                  onClick={() => handleDelete(admission.id)}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

