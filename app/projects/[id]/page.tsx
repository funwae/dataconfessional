'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DataSourcesTab from '@/components/DataSourcesTab';
import DashboardTab from '@/components/DashboardTab';
import ReportsTab from '@/components/ReportsTab';
import AIChatPanel from '@/components/AIChatPanel';
import ProjectSummary from '@/components/ProjectSummary';
import ResultsSummary from '@/components/ResultsSummary';

interface Project {
  id: string;
  name: string;
  goalType: string;
  audienceType: string;
  dataSources: any[];
  charts: any[];
  reports: any[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard' | 'reports'>('data');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8]">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/projects"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Image
                  src="/logo.png"
                  alt="Data Confessional"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span>← Your confessions</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary - Shows when ready to export */}
        <ResultsSummary projectId={params.id as string} />

        {/* Project Summary - Quick stats */}
        <ProjectSummary projectId={params.id as string} />

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'data'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-slate-300'
              }`}
            >
              What you brought in
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-slate-300'
              }`}
            >
              What the data is saying
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reports'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-slate-300'
              }`}
            >
              Briefings
            </button>
          </nav>
        </div>

        {/* Content with AI Panel */}
        <div className="flex gap-6">
          <div className="flex-1">
            {activeTab === 'data' && (
              <DataSourcesTab projectId={params.id as string} onUpdate={loadProject} />
            )}
            {activeTab === 'dashboard' && (
              <DashboardTab projectId={params.id as string} onUpdate={loadProject} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab projectId={params.id as string} onUpdate={loadProject} />
            )}
          </div>

          {/* AI Chat Panel */}
          <div className="w-80">
            <AIChatPanel projectId={params.id as string} />
          </div>
        </div>
      </div>
    </div>
  );
}


