'use client';

import { useState, useEffect, useRef } from 'react';
import { chat } from '@/lib/engine-client';
import { isDesktop } from '@/lib/desktop-config';

interface QAInteraction {
  id: string;
  question: string;
  answer: string;
  supportingData?: any;
  caveats?: string[];
  createdAt: string;
}

export default function AIChatPanel({ projectId }: { projectId: string }) {
  const [interactions, setInteractions] = useState<QAInteraction[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<'serious' | 'gossip'>('serious');
  const [projectData, setProjectData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    'Give me the top three things I should know.',
    'What changed the most since last period?',
    'Where are the biggest risks?',
    'What\'s surprising here?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [interactions]);

  useEffect(() => {
    // Load project data for context
    const loadProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectData(data.project);
        }
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    };
    loadProjectData();
  }, [projectId]);

  const buildContextSummary = (): string => {
    if (!projectData) return '';

    const summaries: string[] = [];

    if (projectData.dataSources) {
      for (const dataSource of projectData.dataSources) {
        if (dataSource.tables && dataSource.tables.length > 0) {
          for (const table of dataSource.tables) {
            const summary = `Table "${table.name}" from "${dataSource.name}":
- ${table.rowCount} rows, ${table.columnCount} columns
- Columns: ${table.columnProfiles?.map((cp: any) => {
              let colInfo = `${cp.name} (${cp.dataType})`;
              if (cp.dataType === 'numeric') {
                colInfo += `: min=${cp.min}, max=${cp.max}, mean=${cp.mean?.toFixed(2)}`;
              } else if (cp.distinctCount) {
                colInfo += `: ${cp.distinctCount} distinct values`;
              }
              return colInfo;
            }).join(', ') || 'N/A'}`;
            summaries.push(summary);
          }
        }

        if (dataSource.documentChunks && dataSource.documentChunks.length > 0) {
          const chunks = dataSource.documentChunks.slice(0, 3);
          const textSummary = `Text source "${dataSource.name}":
${chunks.map((c: any) => c.text.substring(0, 500)).join('\n\n...\n\n')}`;
          summaries.push(textSummary);
        }
      }
    }

    return summaries.join('\n\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question;
    setQuestion('');
    setLoading(true);

    // In web mode, use API route
    if (!isDesktop()) {
      try {
        const response = await fetch(`/api/projects/${projectId}/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userQuestion, tone }),
        });

        const data = await response.json();
        if (response.ok) {
          setInteractions((prev) => [
            ...prev,
            {
              id: data.interaction.id,
              question: userQuestion,
              answer: data.answer,
              supportingData: data.supportingData,
              caveats: data.caveats,
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          alert(data.error || 'Failed to get answer');
        }
      } catch (error) {
        alert('Failed to get answer');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Desktop mode - use engine directly
    let streamingAnswer = '';
    let currentInteractionId = `temp-${Date.now()}`;

    try {
      // Build context
      const contextSummary = buildContextSummary();
      const context = `Project: ${projectData?.name || 'Project'}
Goal: ${projectData?.goalType || 'GENERAL_ANALYSIS'}
Audience: ${projectData?.audienceType || 'SELF'}`;

      // Call engine directly
      const fullAnswer = await chat(
        {
          role: tone === 'gossip' ? 'gossip' : 'analysis',
          question: userQuestion,
          contextSummary: `${context}\n\n${contextSummary}`,
          projectMeta: {
            name: projectData?.name || 'Project',
            audience: (projectData?.audienceType?.toLowerCase() || 'self') as 'self' | 'team' | 'exec',
          },
        },
        (chunk) => {
          streamingAnswer += chunk;
          // Update the interaction in real-time
          setInteractions((prev) => {
            const existing = prev.find((i) => i.id === currentInteractionId);
            if (existing) {
              return prev.map((i) =>
                i.id === currentInteractionId
                  ? { ...i, answer: streamingAnswer }
                  : i
              );
            } else {
              return [
                ...prev,
                {
                  id: currentInteractionId,
                  question: userQuestion,
                  answer: streamingAnswer,
                  supportingData: {},
                  caveats: [],
                  createdAt: new Date().toISOString(),
                },
              ];
            }
          });
        }
      );

      // Parse the structured response
      const answerMatch = fullAnswer.match(/CONFESSION:\s*(.+?)(?=EVIDENCE:|$)/s);
      const evidenceMatch = fullAnswer.match(/EVIDENCE:\s*(.+?)(?=CAVEATS:|$)/s);
      const caveatsMatch = fullAnswer.match(/CAVEATS:\s*(.+?)$/s);

      const answer = answerMatch ? answerMatch[1].trim() : fullAnswer.split('EVIDENCE:')[0].trim();
      const supportingData = evidenceMatch
        ? evidenceMatch[1].split('\n').map((line: string) => line.replace(/^- /, '').trim()).filter(Boolean)
        : [];
      const caveats = caveatsMatch
        ? caveatsMatch[1].split('\n').map((line: string) => line.replace(/^- /, '').trim()).filter(Boolean)
        : [];

      // Save to database via API
      try {
        const saveResponse = await fetch(`/api/projects/${projectId}/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userQuestion,
            tone,
            // We'll let the API route generate the answer again for consistency
            // Or we could create a separate endpoint to just save the interaction
          }),
        });

        if (saveResponse.ok) {
          const data = await saveResponse.json();
          // Update with real ID from database
          setInteractions((prev) =>
            prev.map((i) =>
              i.id === currentInteractionId
                ? {
                    ...i,
                    id: data.interaction.id,
                    answer,
                    supportingData: { raw: supportingData },
                    caveats,
                  }
                : i
            )
          );
        }
      } catch (saveError) {
        console.error('Failed to save interaction:', saveError);
        // Keep the interaction with temp ID
      }
    } catch (error: any) {
      alert(error.message || 'Failed to get answer');
      // Remove the temp interaction on error
      setInteractions((prev) => prev.filter((i) => i.id !== currentInteractionId));
    } finally {
      setLoading(false);
    }
  };

  const handlePresetQuestion = (preset: string) => {
    setQuestion(preset);
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
        const button = document.activeElement as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓';
          setTimeout(() => {
            button.textContent = originalText;
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to pin admission:', error);
    }
  };

  return (
    <div className="bg-white/70 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-200px)] flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Interview your data</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Tone:</span>
            <button
              onClick={() => setTone('serious')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                tone === 'serious'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Serious
            </button>
            <button
              onClick={() => setTone('gossip')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                tone === 'gossip'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Data Gossip
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">Ask what the data has been hiding</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {interactions.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p className="mb-4">Start interviewing your data</p>
            <div className="space-y-2">
              {presetQuestions.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetQuestion(preset)}
                  className="block w-full text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        ) : (
          interactions.map((interaction) => (
            <div key={interaction.id} className="space-y-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm font-medium text-gray-900">{interaction.question}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {interaction.answer}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePinAdmission(interaction.id, interaction.answer, 'qa')}
                    className="ml-2 p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Pin as admission"
                  >
                    📌
                  </button>
                </div>
                {interaction.caveats && interaction.caveats.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Caveats:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {interaction.caveats.map((caveat, idx) => (
                        <li key={idx}>• {caveat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="text-center text-gray-500 text-sm">Interviewing your data…</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask what the data has been hiding…"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}


