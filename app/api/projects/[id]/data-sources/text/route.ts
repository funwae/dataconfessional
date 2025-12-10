import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const textSchema = z.object({
  text: z.string().min(1),
  name: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { text, name } = textSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Chunk text (simple chunking - ~2000 chars per chunk)
    const chunkSize = 2000;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    // Create data source
    const dataSource = await prisma.dataSource.create({
      data: {
        projectId: params.id,
        type: 'TEXT',
        name: name || 'Pasted Text',
        status: 'PROCESSED',
        meta: JSON.stringify({
          textLength: text.length,
          chunkCount: chunks.length,
        }),
        documentChunks: {
          create: chunks.map((chunkText, index) => ({
            orderIndex: index,
            text: chunkText,
          })),
        },
      },
      include: {
        documentChunks: true,
      },
    });

    return NextResponse.json({ dataSource }, { status: 201 });
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

