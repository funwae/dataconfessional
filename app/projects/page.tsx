'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    goalType: 'GENERAL_ANALYSIS' as const,
    audienceType: 'SELF' as const,
  });
  const router = useRouter();

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
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      const data = await response.json();
      if (response.ok) {
        setShowCreateModal(false);
        setNewProject({ name: '', goalType: 'GENERAL_ANALYSIS', audienceType: 'SELF' });
        router.push(`/projects/${data.project.id}`);
      } else {
        setError(data.error || 'Failed to create project');
        console.error('Failed to create project:', data);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create project');
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8]">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="Data Confessional"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold text-gray-900">Data Confessional</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Begin a new confession
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your confessions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Each project is a quiet room where a specific question gets honest answers.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              You don&apos;t have any confessions yet. Start by creating a project for a question you&apos;re trying to answer.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Begin a new confession
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white/70 rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {project.goalType.replace(/_/g, ' ')} • {project.audienceType.replace(/_/g, ' ')}
                </p>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>{project._count.dataSources} sources</span>
                  <span>{project._count.charts} charts</span>
                  <span>{project._count.reports} reports</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Start a new confession</h3>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project name
                </label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Q1 sales review – North America"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What question are you exploring?
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Are we growing in the right regions and segments?"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Type
                </label>
                <select
                  value={newProject.goalType}
                  onChange={(e) => setNewProject({ ...newProject, goalType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MARKET_SNAPSHOT">Market Snapshot</option>
                  <option value="SALES_OVERVIEW">Sales Overview</option>
                  <option value="MARKETING_PERFORMANCE">Marketing Performance</option>
                  <option value="GENERAL_ANALYSIS">General Analysis</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Who is this for?
                </label>
                <select
                  value={newProject.audienceType}
                  onChange={(e) => setNewProject({ ...newProject, audienceType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  {creating ? 'Starting...' : 'Create project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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


