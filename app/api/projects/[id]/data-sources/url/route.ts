import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const urlSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { url, name } = urlSchema.parse(body);

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

    // Fetch URL content
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DataNexus/1.0)',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      html = await response.text();
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch URL', details: error.message },
        { status: 400 }
      );
    }

    // Simple HTML parsing - extract text content
    // Remove script and style tags
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : name || new URL(url).hostname;

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = metaMatch ? metaMatch[1] : null;

    // Chunk text (simple chunking - ~2000 chars per chunk)
    const chunkSize = 2000;
    const chunks: string[] = [];
    for (let i = 0; i < textContent.length; i += chunkSize) {
      chunks.push(textContent.slice(i, i + chunkSize));
    }

    // Create data source
    const dataSource = await prisma.dataSource.create({
      data: {
        projectId: params.id,
        type: 'URL',
        name: name || title,
        status: 'PROCESSED',
        meta: JSON.stringify({
          url,
          title,
          description,
        }),
        documentChunks: {
          create: chunks.map((text, index) => ({
            orderIndex: index,
            text,
          })),
        },
      },
      include: {
        documentChunks: true,
      },
    });

    return NextResponse.json({ dataSource }, { status: 201 });
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


