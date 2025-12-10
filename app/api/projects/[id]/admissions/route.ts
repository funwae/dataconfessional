import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAdmissionSchema = z.object({
  text: z.string().min(1),
  sourceType: z.enum(['chart', 'qa', 'report']),
  sourceId: z.string(),
  isTalkingPoint: z.boolean().optional().default(false),
  orderIndex: z.number().optional().default(0),
});

const updateAdmissionSchema = z.object({
  text: z.string().min(1).optional(),
  isTalkingPoint: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admissions = await prisma.keyAdmission.findMany({
      where: { projectId: params.id },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ admissions });
  } catch (error: any) {
    console.error('Error loading admissions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const admissionData = createAdmissionSchema.parse(body);

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

    const admission = await prisma.keyAdmission.create({
      data: {
        projectId: params.id,
        text: admissionData.text,
        sourceType: admissionData.sourceType,
        sourceId: admissionData.sourceId,
        isTalkingPoint: admissionData.isTalkingPoint,
        orderIndex: admissionData.orderIndex,
      },
    });

    return NextResponse.json({ admission }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating admission:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

