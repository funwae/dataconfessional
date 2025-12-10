import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateAdmissionSchema = z.object({
  text: z.string().min(1).optional(),
  isTalkingPoint: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; admissionId: string } }
) {
  try {
    const body = await request.json();
    const updateData = updateAdmissionSchema.parse(body);

    // Verify admission belongs to project
    const existingAdmission = await prisma.keyAdmission.findFirst({
      where: {
        id: params.admissionId,
        projectId: params.id,
      },
    });

    if (!existingAdmission) {
      return NextResponse.json(
        { error: 'Admission not found' },
        { status: 404 }
      );
    }

    const admission = await prisma.keyAdmission.update({
      where: { id: params.admissionId },
      data: updateData,
    });

    return NextResponse.json({ admission });
  } catch (error: any) {
    console.error('Error updating admission:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; admissionId: string } }
) {
  try {
    // Verify admission belongs to project
    const existingAdmission = await prisma.keyAdmission.findFirst({
      where: {
        id: params.admissionId,
        projectId: params.id,
      },
    });

    if (!existingAdmission) {
      return NextResponse.json(
        { error: 'Admission not found' },
        { status: 404 }
      );
    }

    await prisma.keyAdmission.delete({
      where: { id: params.admissionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting admission:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

