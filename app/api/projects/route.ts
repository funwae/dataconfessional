import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultUser } from '@/lib/default-user';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  goalType: z.enum(['MARKET_SNAPSHOT', 'SALES_OVERVIEW', 'MARKETING_PERFORMANCE', 'GENERAL_ANALYSIS']),
  audienceType: z.enum(['SELF', 'MANAGER_DIRECTOR', 'EXECUTIVE_EXTERNAL']),
  templateId: z.string().optional(), // Optional template to apply
});

export async function GET(request: NextRequest) {
  try {
    const user = await getDefaultUser();

    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            dataSources: true,
            charts: true,
            reports: true,
          },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Error loading projects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectData = createProjectSchema.parse(body);

    const user = await getDefaultUser();

    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        goalType: projectData.goalType,
        audienceType: projectData.audienceType,
        ownerId: user.id,
      },
      include: {
        _count: {
          select: {
            dataSources: true,
            charts: true,
            reports: true,
          },
        },
      },
    });

    // Apply template if provided
    if (projectData.templateId) {
      try {
        const { applyTemplateToProject } = await import('@/lib/template-application');
        await applyTemplateToProject(projectData.templateId, project.id);
      } catch (templateError: any) {
        console.error('Error applying template:', templateError);
        // Continue even if template application fails
      }
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
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


