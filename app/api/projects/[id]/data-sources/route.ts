import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataSources = await prisma.dataSource.findMany({
      where: { projectId: params.id },
      include: {
        tables: {
          include: {
            columnProfiles: true,
          },
        },
        documentChunks: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            tables: true,
            documentChunks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ dataSources });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


