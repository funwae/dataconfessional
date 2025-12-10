'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QuickConfessionWizard from '@/components/QuickConfessionWizard';
import RecentSourcesPanel from '@/components/RecentSourcesPanel';

interface Project {
  id: string;
  name: string;
  goalType: string;
  audienceType: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    dataSources: number;
    charts: number;
    reports: number;
  };
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selectedProject: string | null;
  onSelectProject: (projectId: string) => void;
}

export default function Sidebar({ collapsed, onToggle, selectedProject, onSelectProject }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('GENERAL_ANALYSIS');
  const [newProjectAudience, setNewProjectAudience] = useState('SELF');
  const [creating, setCreating] = useState(false);
  const [showQuickConfession, setShowQuickConfession] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          goalType: newProjectGoal,
          audienceType: newProjectAudience,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewProjectName('');
        loadProjects();
        onSelectProject(data.project.id);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create project');
      }
    } catch (error) {
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-100 rounded transition-colors"
          title="Expand sidebar"
        >
          →
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Your confessions</h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Collapse sidebar"
          >
            ←
          </button>
        </div>
        <button
          onClick={() => setShowQuickConfession(true)}
          className="w-full px-3 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm mb-2"
        >
          Quick Confession
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors text-sm"
        >
          Begin a new confession
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-sm text-slate-600 p-4">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-slate-600 p-4 text-center">
            <p className="mb-2">No confessions yet.</p>
            <p className="text-xs">Start by creating a project.</p>
            <div className="mt-4">
              <RecentSourcesPanel />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProject === project.id
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-medium truncate">{project.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {project._count.dataSources} sources • {project._count.charts} charts
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Start a new confession</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Q1 sales review – North America"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Goal type
                </label>
                <select
                  value={newProjectGoal}
                  onChange={(e) => setNewProjectGoal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="GENERAL_ANALYSIS">General Analysis</option>
                  <option value="MARKET_SNAPSHOT">Market Snapshot</option>
                  <option value="SALES_OVERVIEW">Sales Overview</option>
                  <option value="MARKETING_PERFORMANCE">Marketing Performance</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Audience
                </label>
                <select
                  value={newProjectAudience}
                  onChange={(e) => setNewProjectAudience(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="SELF">Just me</option>
                  <option value="MANAGER_DIRECTOR">My team</option>
                  <option value="EXECUTIVE_EXTERNAL">Executives / clients</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Confession Wizard */}
      {showQuickConfession && (
        <QuickConfessionWizard
          onComplete={(result) => {
            setShowQuickConfession(false);
            loadProjects();
            onSelectProject(result.project.id);
          }}
          onCancel={() => setShowQuickConfession(false)}
        />
      )}
    </div>
  );
}

