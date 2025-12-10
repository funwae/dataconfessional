import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLLMClient } from '@/lib/llm-client';
import { z } from 'zod';

const qaSchema = z.object({
  question: z.string().min(1),
  sourceIds: z.array(z.string()).optional(),
  tone: z.enum(['serious', 'gossip']).optional().default('serious'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { question, sourceIds, tone } = qaSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        dataSources: {
          where: sourceIds && sourceIds.length > 0
            ? { id: { in: sourceIds }, status: 'PROCESSED' }
            : { status: 'PROCESSED' },
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

    // Build context
    const context = `Project: ${project.name}
Goal: ${project.goalType}
Audience: ${project.audienceType}`;

    // Build data summaries
    const dataSummaries: string[] = [];

    for (const dataSource of project.dataSources) {
      if (dataSource.tables.length > 0) {
        for (const table of dataSource.tables) {
          const summary = `Table "${table.name}" from "${dataSource.name}":
- ${table.rowCount} rows, ${table.columnCount} columns
- Columns: ${table.columnProfiles.map(cp => {
            let colInfo = `${cp.name} (${cp.dataType})`;
            if (cp.dataType === 'numeric') {
              colInfo += `: min=${cp.min}, max=${cp.max}, mean=${cp.mean?.toFixed(2)}`;
            } else if (cp.distinctCount) {
              colInfo += `: ${cp.distinctCount} distinct values`;
            }
            return colInfo;
          }).join(', ')}`;
          dataSummaries.push(summary);
        }
      }

      if (dataSource.documentChunks.length > 0) {
        // Use first few chunks as context
        const chunks = dataSource.documentChunks.slice(0, 3);
        const textSummary = `Text source "${dataSource.name}":
${chunks.map(c => c.text.substring(0, 500)).join('\n\n...\n\n')}`;
        dataSummaries.push(textSummary);
      }
    }

    // Get LLM answer
    const llmClient = getLLMClient();
    const projectTone = project.tone || tone || 'serious';
    const result = await llmClient.answerQuestion(
      question,
      context,
      dataSummaries.join('\n\n'),
      projectTone
    );

    // Save interaction
    const supportingDataObj = {
      sources: project.dataSources.map(ds => ({
        id: ds.id,
        name: ds.name,
        type: ds.type,
      })),
    };
    const interaction = await prisma.qAInteraction.create({
      data: {
        projectId: params.id,
        question,
        answer: result.answer,
        supportingData: JSON.stringify(supportingDataObj),
        caveats: result.caveats.join(','), // Store as comma-separated string
        tone: projectTone,
      },
    });

    return NextResponse.json({
      interaction,
      answer: result.answer,
      supportingData: result.supportingData,
      caveats: result.caveats,
    });
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


