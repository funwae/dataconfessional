import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultUser } from '@/lib/default-user';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  chartConfigs: z.array(z.any()).optional(),
  reportSections: z.array(z.any()).optional(),
  defaultAudience: z.enum(['SELF', 'MANAGER_DIRECTOR', 'EXECUTIVE_EXTERNAL']),
  defaultTone: z.enum(['serious', 'gossip']).default('serious'),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  chartConfigs: z.array(z.any()).optional(),
  reportSections: z.array(z.any()).optional(),
  defaultAudience: z.enum(['SELF', 'MANAGER_DIRECTOR', 'EXECUTIVE_EXTERNAL']).optional(),
  defaultTone: z.enum(['serious', 'gossip']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getDefaultUser();

    const templates = await prisma.savedTemplate.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error loading templates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const templateData = createTemplateSchema.parse(body);

    const user = await getDefaultUser();

    const template = await prisma.savedTemplate.create({
      data: {
        userId: user.id,
        name: templateData.name,
        description: templateData.description,
        chartConfigs: JSON.stringify(templateData.chartConfigs || []),
        reportSections: JSON.stringify(templateData.reportSections || []),
        defaultAudience: templateData.defaultAudience,
        defaultTone: templateData.defaultTone,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
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

