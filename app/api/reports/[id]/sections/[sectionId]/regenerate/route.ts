import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLLMClient } from '@/lib/llm-client';
import { z } from 'zod';

const regenerateSchema = z.object({
  angle: z.string().optional(),
  tone: z.enum(['technical', 'executive', 'casual']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const body = await request.json();
    const { angle, tone } = regenerateSchema.parse(body);

    const section = await prisma.reportSection.findUnique({
      where: { id: params.sectionId },
      include: {
        report: {
          include: {
            project: {
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
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Build context
    const dataSummaries = section.report.project.dataSources
      .flatMap(ds => ds.tables)
      .map(table => `Table: ${table.name} (${table.rowCount} rows)`);

    const prompt = `Regenerate the "${section.title}" section.
${angle ? `Focus on: ${angle}` : ''}
${tone ? `Tone: ${tone}` : ''}

Available data: ${dataSummaries.join(', ')}`;

    const llmClient = getLLMClient();
    const newContent = await llmClient.generateReportSections(
      prompt,
      dataSummaries.join('\n'),
      tone || 'general'
    );

    const updatedSection = await prisma.reportSection.update({
      where: { id: params.sectionId },
      data: { content: newContent },
    });

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


