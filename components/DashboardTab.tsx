'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_THEME, getColorForIndex } from '@/lib/chart-theme';
import { formatValue, detectNumberFormat } from '@/lib/formatting';

interface Chart {
  id: string;
  title: string;
  chartType: string;
  config: any;
  insight: string | null;
  isPinned: boolean;
  orderIndex: number;
  table?: {
    id: string;
    dataSource?: {
      meta?: any;
    };
  };
}

export default function DashboardTab({ projectId, onUpdate }: { projectId: string; onUpdate: () => void }) {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  useEffect(() => {
    loadCharts();
  }, [projectId]);

  const loadCharts = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/dashboard`);
      const data = await response.json();
      // Parse config JSON strings
      const chartsWithParsedConfig = (data.charts || []).map((chart: any) => ({
        ...chart,
        config: typeof chart.config === 'string' ? JSON.parse(chart.config) : (chart.config || {}),
      }));
      setCharts(chartsWithParsedConfig);
    } catch (error) {
      console.error('Failed to load charts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/dashboard/generate`, {
        method: 'POST',
      });

      if (response.ok) {
        loadCharts();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to generate dashboard');
      }
    } catch (error) {
      alert('Failed to generate dashboard');
    } finally {
      setGenerating(false);
    }
  };

  const handlePinChart = async (chartId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/dashboard`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charts: [{ id: chartId, isPinned }],
        }),
      });

      if (response.ok) {
        loadCharts();
      }
    } catch (error) {
      console.error('Failed to update chart:', error);
    }
  };

  const [chartData, setChartData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Load data for all charts that have tables
    const loadChartData = async () => {
      for (const chart of charts) {
        if (chart.table?.id && !chartData[chart.id]) {
          try {
            const response = await fetch(`/api/tables/${chart.table.id}/data`);
            const data = await response.json();
            if (data.rows) {
              setChartData((prev) => ({ ...prev, [chart.id]: data.rows }));
            }
          } catch (error) {
            console.error(`Failed to load data for chart ${chart.id}:`, error);
          }
        }
      }
    };
    loadChartData();
  }, [charts.length]); // Only reload when number of charts changes

  const renderChart = (chart: Chart, isExpanded: boolean = false) => {
    const data = chartData[chart.id] || [];
    const config = chart.config || {};
    const COLORS = CHART_THEME.colors.palette;

    // Transform data based on chart config
    let chartData = data;
    if (config.xField && config.yField && data.length > 0) {
      // Detect number format from sample values
      const yValues = data.map((r: any) => {
        const val = r[config.yField];
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      }).filter((v: number) => !isNaN(v));

      const numberFormat = detectNumberFormat(yValues[0] || 0, yValues);

      chartData = data.map((row: any) => {
        const yValue = typeof row[config.yField] === 'number'
          ? row[config.yField]
          : parseFloat(row[config.yField]) || 0;

        return {
          name: String(row[config.xField] || ''),
          value: yValue,
          formattedValue: formatValue(yValue, numberFormat),
          ...(config.seriesField && { series: String(row[config.seriesField] || '') }),
        };
      });
    }

    // If no data, show placeholder
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No data available
        </div>
      );
    }

    switch (chart.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={isExpanded ? 500 : 300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_THEME.colors.primary}
                strokeWidth={CHART_THEME.line.strokeWidth}
                dot={{ fill: CHART_THEME.colors.primary, r: CHART_THEME.line.dotRadius }}
                activeDot={{ r: CHART_THEME.line.activeDotRadius }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={isExpanded ? 500 : 300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={CHART_THEME.tooltip}
                formatter={(value: any) => {
                  const item = chartData.find((d: any) => d.value === value);
                  return item?.formattedValue || formatValue(value);
                }}
                labelFormatter={(label) => `${config.xField}: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill={CHART_THEME.colors.primary}
                radius={[CHART_THEME.bar.borderRadius, CHART_THEME.bar.borderRadius, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'stackedBar':
        // Group by series if available
        const groupedData = config.seriesField
          ? chartData.reduce((acc: any, item: any) => {
              const key = item.name;
              if (!acc[key]) acc[key] = { name: key };
              acc[key][item.series] = item.value;
              return acc;
            }, {})
          : chartData;
        const seriesValues = config.seriesField
          ? [...new Set(chartData.map((d: any) => d.series))].filter(Boolean)
          : [];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.values(groupedData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {seriesValues.length > 0
                ? seriesValues.map((series, idx) => (
                    <Bar key={series} dataKey={series} stackId="a" fill={COLORS[idx % COLORS.length]} />
                  ))
                : <Bar dataKey="value" fill="#8884d8" />}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.value}`}
                outerRadius={chart.chartType === 'donut' ? 80 : 100}
                innerRadius={chart.chartType === 'donut' ? 40 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'funnel':
        // Sort by value descending for funnel
        const funnelData = [...chartData].sort((a: any, b: any) => b.value - a.value);
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(chartData[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.slice(0, 10).map((row: any, idx: number) => (
                  <tr key={idx}>
                    {Object.values(row).map((val: any, i: number) => (
                      <td key={i} className="px-4 py-2 text-sm text-gray-900">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {chartData.length > 10 && (
              <p className="text-xs text-gray-500 mt-2">Showing first 10 of {chartData.length} rows</p>
            )}
          </div>
        );
      default:
        return (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart type: {chart.chartType}
          </div>
        );
    }
  };

  const [chartLoading, setChartLoading] = useState<Record<string, boolean>>({});
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">What the data is starting to say</h2>
          <p className="text-sm text-gray-600 mt-1">
            {charts.length > 0
              ? `${charts.length} chart${charts.length !== 1 ? 's' : ''} the booth has suggested`
              : 'We\'ll scan your tables and suggest charts that tell the clearest story'}
          </p>
        </div>
        {charts.length === 0 && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center space-x-2 transition-colors"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate first dashboard</span>
              </>
            )}
          </button>
        )}
      </div>

      {charts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 mb-4">
            No charts yet. Generate a first dashboard or add more data to give the booth more to work with.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate first dashboard'}
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {charts.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-700 font-medium mb-1">Total Charts</div>
                <div className="text-2xl font-bold text-slate-900">{charts.length}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-700 font-medium mb-1">Pinned Charts</div>
                <div className="text-2xl font-bold text-purple-900">
                  {charts.filter((c) => c.isPinned).length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-700 font-medium mb-1">Chart Types</div>
                <div className="text-2xl font-bold text-green-900">
                  {new Set(charts.map((c) => c.chartType)).size}
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts
              .sort((a, b) => {
                // Pinned charts first
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return a.orderIndex - b.orderIndex;
              })
              .map((chart) => {
                const isLoading = !chartData[chart.id] && chart.table?.id;
                return (
                  <div
                    key={chart.id}
                    className={`bg-white/70 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 p-6 ${
                      expandedChart === chart.id ? 'md:col-span-2' : ''
                    } ${chart.isPinned ? 'ring-2 ring-amber-200 border-amber-300' : ''}`}
                  >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                      {chart.chartType}
                    </span>
                    {chart.table?.dataSource && (
                      <span className="text-xs text-gray-500" title="Data source">
                        📊
                      </span>
                    )}
                  </div>
                      {chart.insight && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{chart.insight}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handlePinAdmission(chart.id, chart.insight || chart.title, 'chart')}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Pin as admission"
                      >
                        📌
                      </button>
                      <button
                        onClick={() => setExpandedChart(expandedChart === chart.id ? null : chart.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                        title={expandedChart === chart.id ? 'Collapse' : 'Expand'}
                      >
                        {expandedChart === chart.id ? '⛶' : '⛶'}
                      </button>
                      <button
                        onClick={() => handlePinChart(chart.id, !chart.isPinned)}
                        className={`p-1.5 rounded hover:bg-gray-100 ${
                          chart.isPinned ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={chart.isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        ⭐
                      </button>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-sm text-gray-500">Loading chart data...</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {renderChart(chart, expandedChart === chart.id)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


