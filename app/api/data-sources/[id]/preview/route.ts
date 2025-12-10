import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: params.id },
      include: {
        tables: {
          include: {
            columnProfiles: true,
          },
        },
        documentChunks: {
          orderBy: { orderIndex: 'asc' },
          take: 5, // First 5 chunks for preview
        },
      },
    });

    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    // Get sample data from meta (parse JSON string)
    let meta: any = {};
    if (dataSource.meta) {
      try {
        meta = typeof dataSource.meta === 'string'
          ? JSON.parse(dataSource.meta)
          : dataSource.meta;
      } catch (e) {
        // Meta parsing failed, continue with empty meta
      }
    }
    const preview: any = {
      name: dataSource.name,
      type: dataSource.type,
      status: dataSource.status,
      createdAt: dataSource.createdAt,
    };

    if (dataSource.tables.length > 0) {
      preview.tables = dataSource.tables.map((table) => {
        const tableMeta = meta?.tables?.[table.name];
        return {
          name: table.name,
          rowCount: table.rowCount,
          columnCount: table.columnCount,
          columns: table.columnProfiles.map((cp) => ({
            name: cp.name,
            type: cp.dataType,
            nullPercentage: cp.nullPercentage,
            distinctCount: cp.distinctCount,
            ...(cp.dataType === 'numeric' && {
              min: cp.min,
              max: cp.max,
              mean: cp.mean,
            }),
          })),
          sampleRows: tableMeta?.sampleRows?.slice(0, 10) || [],
        };
      });
    }

    if (dataSource.documentChunks.length > 0) {
      preview.textPreview = dataSource.documentChunks.map((chunk) => ({
        orderIndex: chunk.orderIndex,
        text: chunk.text.substring(0, 500) + (chunk.text.length > 500 ? '...' : ''),
      }));
      preview.totalChunks = dataSource.documentChunks.length;
    }

    return NextResponse.json({ preview });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

