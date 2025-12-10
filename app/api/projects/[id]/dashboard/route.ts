import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const charts = await prisma.chart.findMany({
      where: { projectId: params.id },
      include: {
        table: {
          include: {
            dataSource: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ charts });
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
    const { charts } = body; // Array of { id, orderIndex, isPinned, title?, insight? }

    await Promise.all(
      charts.map((chart: any) =>
        prisma.chart.update({
          where: { id: chart.id },
          data: {
            orderIndex: chart.orderIndex,
            isPinned: chart.isPinned,
            title: chart.title,
            insight: chart.insight,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


