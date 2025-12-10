import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exportRecord = await prisma.export.findUnique({
      where: { id: params.id },
    });

    if (!exportRecord) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    const fileContent = await readFile(exportRecord.path, 'utf-8');

    // Determine content type
    const extension = exportRecord.path.split('.').pop();
    const contentTypeMap: Record<string, string> = {
      md: 'text/markdown; charset=utf-8',
      txt: 'text/plain; charset=utf-8',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    const contentType = contentTypeMap[extension || 'md'] || 'text/plain; charset=utf-8';

    const fileName = exportRecord.path.split('/').pop() || 'export';

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to download export', details: error.message },
      { status: 500 }
    );
  }
}


