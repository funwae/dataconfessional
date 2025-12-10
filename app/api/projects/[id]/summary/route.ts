import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
            tables: true,
          },
        },
        charts: true,
        reports: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const totalRows = project.dataSources.reduce((sum, ds) => {
      return sum + ds.tables.reduce((tableSum, table) => tableSum + table.rowCount, 0);
    }, 0);

    // Determine status
    let status: 'ready' | 'in_progress' | 'needs_data' = 'needs_data';
    if (project.dataSources.length > 0 && project.charts.length > 0 && project.reports.length > 0) {
      status = 'ready';
    } else if (project.dataSources.length > 0) {
      status = 'in_progress';
    }

    const summary = {
      dataSourceCount: project.dataSources.length,
      chartCount: project.charts.length,
      reportCount: project.reports.length,
      totalRows,
      lastUpdated: project.updatedAt.toISOString(),
      status,
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

