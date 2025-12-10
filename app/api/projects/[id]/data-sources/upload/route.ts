import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCSV, parseXLSX, inferColumnType, calculateColumnStats } from '@/lib/data-processing';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getUploadsDir, ensureProjectDirs } from '@/lib/file-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filePathParam = formData.get('filePath') as string | null; // From Tauri
    const name = formData.get('name') as string || file?.name || 'uploaded-file';

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

    let buffer: Buffer;
    let fileName: string;
    let filePath: string;

    // Handle desktop mode (file path from Tauri) or web mode (file from FormData)
    if (filePathParam) {
      // Desktop mode - file already selected via Tauri dialog
      filePath = filePathParam;
      fileName = filePath.split(/[/\\]/).pop() || 'file';
      buffer = await readFile(filePath);

      // Copy to project uploads directory
      await ensureProjectDirs(params.id);
      const uploadsDir = await getUploadsDir(params.id);
      await mkdir(uploadsDir, { recursive: true });
      const projectFilePath = join(uploadsDir, `${Date.now()}-${fileName}`);
      await writeFile(projectFilePath, buffer);
      filePath = projectFilePath;
    } else if (file) {
      // Web mode - file from FormData
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      fileName = file.name;

      // Save to uploads directory
      const UPLOAD_DIR = join(process.cwd(), 'uploads');
      await mkdir(UPLOAD_DIR, { recursive: true });
      filePath = join(UPLOAD_DIR, `${params.id}-${Date.now()}-${fileName}`);
      await writeFile(filePath, buffer);
    } else {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine file type
    const fileType = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
      ? 'XLSX'
      : 'CSV';

    // Create data source record
    const dataSource = await prisma.dataSource.create({
      data: {
        projectId: params.id,
        type: fileType,
        name,
        status: 'PENDING',
        rawPath: filePath,
      },
    });

    // Process file asynchronously (for MVP, we'll do it synchronously)
    try {
      let tables: any[];
      if (fileType === 'XLSX') {
        tables = await parseXLSX(buffer);
      } else {
        const table = await parseCSV(buffer);
        tables = [table];
      }

      // Create table records and column profiles
      for (const table of tables) {
        const tableRecord = await prisma.table.create({
          data: {
            dataSourceId: dataSource.id,
            name: table.name,
            rowCount: table.rows.length,
            columnCount: table.columns.length,
          },
        });

        // Profile each column
        for (const columnName of table.columns) {
          const columnValues = table.rows.map((row: any) => row[columnName]);
          const dataType = inferColumnType(columnValues);
          const stats = calculateColumnStats(columnName, columnValues, dataType);

          await prisma.columnProfile.create({
            data: {
              tableId: tableRecord.id,
              ...stats,
            },
          });
        }

        // Store sample data in meta for quick access (first 100 rows)
        const sampleRows = table.rows.slice(0, 100);
        // Get existing meta or create new
        const existingMeta = dataSource.meta ? JSON.parse(dataSource.meta) : {};
        const updatedMeta = {
          ...existingMeta,
          tables: {
            ...(existingMeta.tables || {}),
            [table.name]: {
              sampleRows,
              columns: table.columns,
            },
          },
        };
        await prisma.dataSource.update({
          where: { id: dataSource.id },
          data: {
            meta: JSON.stringify(updatedMeta),
          },
        });
      }

      // Mark as processed
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: { status: 'PROCESSED' },
      });

      const updatedDataSource = await prisma.dataSource.findUnique({
        where: { id: dataSource.id },
        include: {
          tables: {
            include: {
              columnProfiles: true,
            },
          },
        },
      });

      return NextResponse.json({ dataSource: updatedDataSource }, { status: 201 });
    } catch (error: any) {
      // Mark as error
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'ERROR',
          errorMessage: error.message || 'Processing failed',
        },
      });

      return NextResponse.json(
        { error: 'Failed to process file', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


