import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateReportSchema = z.object({
  title: z.string().optional(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    content: z.string().optional(),
    orderIndex: z.number().optional(),
  })).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateReportSchema.parse(body);

    // Update report title if provided
    if (data.title) {
      await prisma.report.update({
        where: { id: params.id },
        data: { title: data.title },
      });
    }

    // Update sections if provided
    if (data.sections) {
      await Promise.all(
        data.sections.map((section) =>
          prisma.reportSection.update({
            where: { id: section.id },
            data: {
              title: section.title,
              content: section.content,
              orderIndex: section.orderIndex,
            },
          })
        )
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({ report });
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


