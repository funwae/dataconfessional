import { prisma } from './prisma';

export interface ChartSuggestion {
  chartType: string;
  title: string;
  xField?: string;
  yField?: string;
  seriesField?: string;
  config: any;
}

export async function suggestCharts(projectId: string): Promise<ChartSuggestion[]> {
  const tables = await prisma.table.findMany({
    where: {
      dataSource: {
        projectId,
        status: 'PROCESSED',
      },
    },
    include: {
      columnProfiles: true,
    },
  });

  const suggestions: ChartSuggestion[] = [];

  for (const table of tables) {
    const timeColumns = table.columnProfiles.filter(c => c.dataType === 'date');
    const metricColumns = table.columnProfiles.filter(c => c.dataType === 'numeric');
    const categoryColumns = table.columnProfiles.filter(
      c => c.dataType === 'categorical' || (c.dataType === 'string' && (c.distinctCount || 0) < 20)
    );

    // Time series charts
    if (timeColumns.length > 0 && metricColumns.length > 0) {
      for (const metric of metricColumns.slice(0, 3)) {
        suggestions.push({
          chartType: 'line',
          title: `${metric.name} Over Time`,
          xField: timeColumns[0].name,
          yField: metric.name,
          config: {
            xField: timeColumns[0].name,
            yField: metric.name,
          },
        });
      }
    }

    // Bar charts for category breakdowns
    if (categoryColumns.length > 0 && metricColumns.length > 0) {
      for (const metric of metricColumns.slice(0, 2)) {
        for (const category of categoryColumns.slice(0, 2)) {
          suggestions.push({
            chartType: 'bar',
            title: `${metric.name} by ${category.name}`,
            xField: category.name,
            yField: metric.name,
            config: {
              xField: category.name,
              yField: metric.name,
            },
          });
        }
      }
    }

    // Stacked bar if we have time + category + metric
    if (timeColumns.length > 0 && categoryColumns.length > 0 && metricColumns.length > 0) {
      suggestions.push({
        chartType: 'stackedBar',
        title: `${metricColumns[0].name} by ${categoryColumns[0].name} Over Time`,
        xField: timeColumns[0].name,
        yField: metricColumns[0].name,
        seriesField: categoryColumns[0].name,
        config: {
          xField: timeColumns[0].name,
          yField: metricColumns[0].name,
          seriesField: categoryColumns[0].name,
        },
      });
    }

    // Funnel chart if we detect pipeline stages
    const pipelineKeywords = ['stage', 'status', 'phase', 'step', 'funnel'];
    const potentialFunnelColumn = categoryColumns.find(c =>
      pipelineKeywords.some(keyword => c.name.toLowerCase().includes(keyword))
    );
    if (potentialFunnelColumn) {
      suggestions.push({
        chartType: 'funnel',
        title: `Pipeline: ${potentialFunnelColumn.name}`,
        xField: potentialFunnelColumn.name,
        yField: 'count',
        config: {
          xField: potentialFunnelColumn.name,
          yField: 'count',
        },
      });
    }

    // Pie chart for single category breakdown
    if (categoryColumns.length > 0 && metricColumns.length > 0) {
      suggestions.push({
        chartType: 'pie',
        title: `Distribution: ${metricColumns[0].name} by ${categoryColumns[0].name}`,
        xField: categoryColumns[0].name,
        yField: metricColumns[0].name,
        config: {
          xField: categoryColumns[0].name,
          yField: metricColumns[0].name,
        },
      });
    }
  }

  // Limit to top 6 suggestions
  return suggestions.slice(0, 6);
}


