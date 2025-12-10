import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLLMClient } from '@/lib/llm-client';
import { REPORT_TEMPLATES, getTemplateForGoalType } from '@/lib/report-templates';

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
            documentChunks: true,
          },
        },
        charts: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get template
    const templateKey = getTemplateForGoalType(project.goalType);
    const template = REPORT_TEMPLATES[templateKey];

    // Build data summaries
    const dataSummaries: string[] = [];

    for (const dataSource of project.dataSources) {
      if (dataSource.tables.length > 0) {
        for (const table of dataSource.tables) {
          const summary = `Table: ${table.name} (${table.rowCount} rows, ${table.columnCount} columns)
Columns: ${table.columnProfiles.map(cp => `${cp.name} (${cp.dataType})`).join(', ')}
Key metrics: ${table.columnProfiles
            .filter(cp => cp.dataType === 'numeric')
            .map(cp => `${cp.name}: min=${cp.min}, max=${cp.max}, mean=${cp.mean?.toFixed(2)}`)
            .join('; ')}`;
          dataSummaries.push(summary);
        }
      }

      if (dataSource.documentChunks.length > 0) {
        const textSummary = `Text source: ${dataSource.name}
Total chunks: ${dataSource.documentChunks.length}
First chunk preview: ${dataSource.documentChunks[0]?.text.substring(0, 200)}...`;
        dataSummaries.push(textSummary);
      }
    }

    // Build chart descriptions
    const chartDescriptions = project.charts.map(
      (chart) => `${chart.title} (${chart.chartType}): ${chart.insight || 'No insight'}`
    );

    // Build template prompt
    const templatePrompt = template.sections
      .map((section) => `${section.title}: ${section.description}`)
      .join('\n');

    const dataSummaryText = dataSummaries.join('\n\n');
    const chartSummaryText = chartDescriptions.join('\n');

    // Determine audience tone
    const audienceMap: Record<string, string> = {
      SELF: 'individual contributor',
      MANAGER_DIRECTOR: 'manager or director',
      EXECUTIVE_EXTERNAL: 'executive or external client',
    };
    const audience = audienceMap[project.audienceType] || 'general audience';

    // Generate report using LLM
    const llmClient = getLLMClient();
    const projectTone = project.tone || 'serious';
    const fullReport = await llmClient.generateReportSections(
      templatePrompt,
      `Data Summaries:\n${dataSummaryText}\n\nCharts:\n${chartSummaryText}`,
      audience,
      projectTone
    );

    // Parse the LLM response into sections
    // Simple parsing - split by headings
    const sections: { key: string; title: string; content: string }[] = [];
    const lines = fullReport.split('\n');
    let currentSection: { key: string; title: string; content: string } | null = null;

    for (const line of lines) {
      // Check if line is a heading (starts with # or is a section title)
      const headingMatch = line.match(/^#+\s*(.+)$/);
      if (headingMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const title = headingMatch[1].trim();
        const templateSection = template.sections.find(
          (s) => s.title.toLowerCase() === title.toLowerCase()
        );
        currentSection = {
          key: templateSection?.key || title.toLowerCase().replace(/\s+/g, '_'),
          title,
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }

    // If parsing failed, create sections from template
    if (sections.length === 0) {
      for (const templateSection of template.sections) {
        sections.push({
          key: templateSection.key,
          title: templateSection.title,
          content: `[Content for ${templateSection.title}]`,
        });
      }
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        projectId: params.id,
        templateType: templateKey,
        title: `${project.name} - Report`,
        tone: projectTone,
        sections: {
          create: sections.map((section, index) => ({
            key: section.key,
            title: section.title,
            orderIndex: index,
            content: section.content.trim(),
          })),
        },
      },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


