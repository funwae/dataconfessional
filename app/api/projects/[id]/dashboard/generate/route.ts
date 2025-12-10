import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { suggestCharts } from '@/lib/chart-suggestion';
import { getLLMClient } from '@/lib/llm-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        dataSources: {
          where: { status: 'PROCESSED' },
          include: {
            tables: {
              include: {
                columnProfiles: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Generate chart suggestions
    const suggestions = await suggestCharts(params.id);

    // Create chart records
    const charts = await Promise.all(
      suggestions.map(async (suggestion, index) => {
        const table = project.dataSources
          .flatMap(ds => ds.tables)
          .find(t => t.columnProfiles.some(cp => cp.name === suggestion.xField || cp.name === suggestion.yField));

        // Get sample data for better chart descriptions
        let sampleData: any[] = [];
        if (table) {
          const dataSource = project.dataSources.find(ds =>
            ds.tables.some(t => t.id === table.id)
          );
          if (dataSource?.meta) {
            try {
              const meta = typeof dataSource.meta === 'string'
                ? JSON.parse(dataSource.meta)
                : dataSource.meta;
              const tableMeta = meta?.tables?.[table.name];
              if (tableMeta?.sampleRows) {
                sampleData = tableMeta.sampleRows.slice(0, 10);
              }
            } catch (e) {
              // Meta parsing failed, continue without sample data
            }
          }
        }

        // Use LLM to generate title and insight if available
        let title = suggestion.title;
        let insight: string | null = null;

        try {
          const llmClient = getLLMClient();
          const result = await llmClient.describeChart(suggestion.config, sampleData);
          title = result.title;
          insight = result.insight;
        } catch (error) {
          // Fallback to default if LLM fails
          console.error('LLM chart description failed:', error);
        }

        return prisma.chart.create({
          data: {
            projectId: params.id,
            tableId: table?.id,
            title,
            chartType: suggestion.chartType,
            config: JSON.stringify(suggestion.config),
            insight,
            orderIndex: index,
            generatedBy: 'system',
          },
        });
      })
    );

    return NextResponse.json({ charts }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


