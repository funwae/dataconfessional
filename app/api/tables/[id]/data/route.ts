import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const table = await prisma.table.findUnique({
      where: { id: params.id },
      include: {
        dataSource: true,
        columnProfiles: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get sample data from dataSource meta (stored during upload)
    let meta: any = {};
    if (table.dataSource.meta) {
      try {
        meta = typeof table.dataSource.meta === 'string'
          ? JSON.parse(table.dataSource.meta)
          : table.dataSource.meta;
      } catch (e) {
        // Meta parsing failed
      }
    }
    const tableData = meta?.tables?.[table.name];

    if (!tableData || !tableData.sampleRows) {
      return NextResponse.json(
        { error: 'Table data not available' },
        { status: 404 }
      );
    }

    // Return sample rows (first 1000 for charts)
    const rows = tableData.sampleRows.slice(0, 1000);
    const columns = tableData.columns || [];

    return NextResponse.json({
      rows,
      columns,
      totalRows: table.rowCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

