import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultUser } from '@/lib/default-user';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  chartConfigs: z.array(z.any()).optional(),
  reportSections: z.array(z.any()).optional(),
  defaultAudience: z.enum(['SELF', 'MANAGER_DIRECTOR', 'EXECUTIVE_EXTERNAL']).optional(),
  defaultTone: z.enum(['serious', 'gossip']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDefaultUser();

    const template = await prisma.savedTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Parse JSON strings
    const templateWithParsed = {
      ...template,
      chartConfigs: JSON.parse(template.chartConfigs),
      reportSections: JSON.parse(template.reportSections),
    };

    return NextResponse.json({ template: templateWithParsed });
  } catch (error: any) {
    console.error('Error loading template:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
    const updateData = updateTemplateSchema.parse(body);

    const user = await getDefaultUser();

    // Verify template belongs to user
    const existingTemplate = await prisma.savedTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updatePayload: any = {};
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.chartConfigs !== undefined) updatePayload.chartConfigs = JSON.stringify(updateData.chartConfigs);
    if (updateData.reportSections !== undefined) updatePayload.reportSections = JSON.stringify(updateData.reportSections);
    if (updateData.defaultAudience !== undefined) updatePayload.defaultAudience = updateData.defaultAudience;
    if (updateData.defaultTone !== undefined) updatePayload.defaultTone = updateData.defaultTone;

    const template = await prisma.savedTemplate.update({
      where: { id: params.id },
      data: updatePayload,
    });

    // Parse JSON strings for response
    const templateWithParsed = {
      ...template,
      chartConfigs: JSON.parse(template.chartConfigs),
      reportSections: JSON.parse(template.reportSections),
    };

    return NextResponse.json({ template: templateWithParsed });
  } catch (error: any) {
    console.error('Error updating template:', error);
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDefaultUser();

    // Verify template belongs to user
    const existingTemplate = await prisma.savedTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    await prisma.savedTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

