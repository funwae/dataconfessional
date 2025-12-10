import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateMeetingBrief, generateSpeakerNotes } from '@/lib/export-formats';
import { getExportsDir, ensureProjectDirs } from '@/lib/file-storage';

const exportSchema = z.object({
  type: z.enum(['SUMMARY', 'DECK', 'FULL', 'MARKDOWN', 'MEETING_BRIEF', 'SPEAKER_NOTES']),
  includeCharts: z.boolean().default(true),
  includeAppendix: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, includeCharts, includeAppendix } = exportSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        reports: {
          include: {
            sections: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
        charts: {
          where: includeCharts ? {} : undefined,
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

    const report = project.reports[0];
    if (!report) {
      return NextResponse.json(
        { error: 'No report found for this project' },
        { status: 400 }
      );
    }

    // Generate export content
    let content = '';
    let fileExtension = '';
    let contentType = 'text/markdown';

    if (type === 'MARKDOWN') {
      content = generateMarkdown(report, project.charts);
      fileExtension = 'md';
      contentType = 'text/markdown';
    } else if (type === 'SUMMARY') {
      content = generateSummary(report);
      fileExtension = 'md';
      contentType = 'text/markdown';
    } else if (type === 'FULL') {
      // Full report with all sections
      content = generateMarkdown(report, includeCharts ? project.charts : []);
      fileExtension = 'md';
      contentType = 'text/markdown';
      // TODO: For production, convert to PDF using pdfkit or similar
    } else if (type === 'DECK') {
      // Generate slide deck format (Markdown for now, PPTX in production)
      content = generateDeckFormat(report, project.charts);
      fileExtension = 'md';
      contentType = 'text/markdown';
      // TODO: For production, convert to PPTX using pptxgenjs or similar
    } else if (type === 'MEETING_BRIEF') {
      // Generate one-page meeting brief
      content = generateMeetingBrief(report, includeCharts ? project.charts : []);
      fileExtension = 'md';
      contentType = 'text/markdown';
    } else if (type === 'SPEAKER_NOTES') {
      // Generate speaker notes
      content = generateSpeakerNotes(report, includeCharts ? project.charts : []);
      fileExtension = 'md';
      contentType = 'text/markdown';
    }

    // Save export
    await ensureProjectDirs(params.id);
    const exportsDir = await getExportsDir(params.id);
    const fileName = `${project.name.replace(/\s/g, '_')}-${type.toLowerCase()}-${Date.now()}.${fileExtension}`;
    const filePath = join(exportsDir, fileName);
    await writeFile(filePath, content, 'utf-8');

    // Create export record
    const exportRecord = await prisma.export.create({
      data: {
        projectId: params.id,
        type,
        path: filePath,
        options: JSON.stringify({
          includeCharts,
          includeAppendix,
        }),
      },
    });

    return NextResponse.json({
      export: exportRecord,
      downloadUrl: `/api/exports/${exportRecord.id}/download`,
      filePath: filePath, // Return file path for desktop app
    }, { status: 201 });
  } catch (error: any) {
    console.error('Export error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exports = await prisma.export.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ exports });
  } catch (error: any) {
    console.error('Error loading exports:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMarkdown(report: any, charts: any[]): string {
  let md = `# ${report.title}\n\n`;
  md += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
  md += `---\n\n`;

  for (const section of report.sections) {
    md += `## ${section.title}\n\n`;
    // Convert markdown-style content to plain text if needed
    const content = section.content || '';
    md += `${content.trim()}\n\n`;
    md += `---\n\n`;
  }

  if (charts.length > 0) {
    md += `## Charts and Visualizations\n\n`;
    for (const chart of charts) {
      md += `### ${chart.title}\n\n`;
      if (chart.insight) {
        md += `**Insight:** ${chart.insight}\n\n`;
      }
      md += `*Chart Type: ${chart.chartType}*\n\n`;
    }
  }

  md += `\n---\n\n`;
  md += `*End of Report*\n`;

  return md;
}

function generateSummary(report: any): string {
  // Just the executive summary section
  const execSummary = report.sections.find((s: any) =>
    s.key === 'executive_summary' || s.title.toLowerCase().includes('executive')
  );

  let md = `# Executive Summary\n\n`;
  md += `*${report.title}*\n\n`;
  md += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
  md += `---\n\n`;

  if (execSummary) {
    md += `${execSummary.content}\n\n`;
  } else {
    // Fallback to first section
    md += `${report.sections[0]?.content || 'No content available'}\n\n`;
  }

  md += `---\n\n`;
  md += `*For full report, see the complete document.*\n`;

  return md;
}

function generateDeckFormat(report: any, charts: any[]): string {
  let md = `# ${report.title}\n\n`;
  md += `*Presentation Deck*\n\n`;
  md += `---\n\n`;

  // Title slide
  md += `## Slide 1: Title\n\n`;
  md += `${report.title}\n\n`;
  md += `---\n\n`;

  // Overview slide
  md += `## Slide 2: Overview\n\n`;
  const overview = report.sections.find((s: any) =>
    s.key === 'executive_summary' || s.title.toLowerCase().includes('summary') || s.title.toLowerCase().includes('overview')
  );
  if (overview) {
    // Take first 3-4 sentences for overview slide
    const sentences = overview.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10).slice(0, 4);
    sentences.forEach((sentence: string) => {
      md += `• ${sentence.trim()}.\n\n`;
    });
  }
  md += `---\n\n`;

  // One slide per major section
  for (const section of report.sections) {
    if (section.key === 'executive_summary') continue; // Already covered

    md += `## Slide: ${section.title}\n\n`;
    // Bullet points from content (first 5-6 points)
    const lines = section.content.split('\n').filter((line: string) => line.trim().length > 0);
    const bullets = lines.slice(0, 6);
    bullets.forEach((line: string) => {
      const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
      if (cleanLine) {
        md += `• ${cleanLine}\n\n`;
      }
    });
    md += `---\n\n`;
  }

  // Chart slides
  if (charts.length > 0) {
    charts.forEach((chart, idx) => {
      md += `## Slide: ${chart.title}\n\n`;
      if (chart.insight) {
        md += `${chart.insight}\n\n`;
      }
      md += `*[Chart visualization: ${chart.chartType}]*\n\n`;
      md += `---\n\n`;
    });
  }

  // Closing slide
  md += `## Slide: Key Takeaways\n\n`;
  md += `• Review the data insights above\n`;
  md += `• Consider next steps based on findings\n`;
  md += `• Questions?\n\n`;

  return md;
}


