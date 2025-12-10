import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  goalType: z.enum(['MARKET_SNAPSHOT', 'SALES_OVERVIEW', 'MARKETING_PERFORMANCE', 'GENERAL_ANALYSIS']).optional(),
  audienceType: z.enum(['SELF', 'MANAGER_DIRECTOR', 'EXECUTIVE_EXTERNAL']).optional(),
  tone: z.enum(['serious', 'gossip']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        dataSources: {
          include: {
            _count: {
              select: {
                tables: true,
                documentChunks: true,
              },
            },
          },
        },
        charts: {
          orderBy: { orderIndex: 'asc' },
        },
        reports: {
          include: {
            sections: {
              orderBy: { orderIndex: 'asc' },
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

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ project });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


