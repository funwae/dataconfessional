import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultUser } from '@/lib/default-user';
import { parseCSV, parseXLSX, inferColumnType, calculateColumnStats } from '@/lib/data-processing';
import { suggestCharts } from '@/lib/chart-suggestion';
import { getLLMClient } from '@/lib/llm-client';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getUploadsDir, ensureProjectDirs } from '@/lib/file-storage';
import { z } from 'zod';

const quickConfessionSchema = z.object({
  question: z.string().min(1),
  audience: z.enum(['SELF', 'MANAGER_DIRECTOR', 'EXECUTIVE_EXTERNAL']),
  files: z.array(z.object({
    name: z.string(),
    path: z.string().optional(),
    content: z.string().optional(), // For text/URL
    type: z.enum(['CSV', 'XLSX', 'URL', 'TEXT']),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, audience, files } = quickConfessionSchema.parse(body);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file or data source is required' },
        { status: 400 }
      );
    }

    // Get default user
    const user = await getDefaultUser();

    // Create project
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        name: `Quick Confession: ${question.substring(0, 50)}`,
        goalType: 'GENERAL_ANALYSIS',
        audienceType: audience,
      },
    });

    // Process all files in parallel
    const dataSources = await Promise.all(
      files.map(async (file) => {
        let buffer: Buffer | null = null;
        let filePath: string;
        let processedTables: any[] = [];

        if (file.type === 'CSV' || file.type === 'XLSX') {
          // Handle file upload
          if (file.path) {
            // Desktop mode - read from path
            buffer = await readFile(file.path);
            await ensureProjectDirs(project.id);
            const uploadsDir = await getUploadsDir(project.id);
            await mkdir(uploadsDir, { recursive: true });
            const projectFilePath = join(uploadsDir, `${Date.now()}-${file.name}`);
            await writeFile(projectFilePath, buffer);
            filePath = projectFilePath;
          } else if (file.content) {
            // Web mode - content as base64 or direct
            buffer = Buffer.from(file.content, 'base64');
            const UPLOAD_DIR = join(process.cwd(), 'uploads');
            await mkdir(UPLOAD_DIR, { recursive: true });
            filePath = join(UPLOAD_DIR, `${project.id}-${Date.now()}-${file.name}`);
            await writeFile(filePath, buffer);
          } else {
            throw new Error(`File ${file.name} missing path or content`);
          }

          // Parse file
          if (file.type === 'XLSX') {
            processedTables = await parseXLSX(buffer!);
          } else {
            const table = await parseCSV(buffer!);
            processedTables = [table];
          }
        } else if (file.type === 'URL') {
          // Fetch URL content
          const response = await fetch(file.content || '', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DataConfessional/1.0)',
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
          }
          const html = await response.text();
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          // Chunk text
          const chunkSize = 2000;
          const chunks: string[] = [];
          for (let i = 0; i < textContent.length; i += chunkSize) {
            chunks.push(textContent.slice(i, i + chunkSize));
          }

          // Create data source with document chunks
          const dataSource = await prisma.dataSource.create({
            data: {
              projectId: project.id,
              type: 'URL',
              name: file.name,
              status: 'PROCESSED',
              meta: JSON.stringify({
                url: file.content,
                textLength: textContent.length,
                chunkCount: chunks.length,
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

          return dataSource;
        } else if (file.type === 'TEXT') {
          // Handle text input
          const textContent = file.content || '';
          const chunkSize = 2000;
          const chunks: string[] = [];
          for (let i = 0; i < textContent.length; i += chunkSize) {
            chunks.push(textContent.slice(i, i + chunkSize));
          }

          const dataSource = await prisma.dataSource.create({
            data: {
              projectId: project.id,
              type: 'TEXT',
              name: file.name,
              status: 'PROCESSED',
              meta: JSON.stringify({
                textLength: textContent.length,
                chunkCount: chunks.length,
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

          return dataSource;
        }

        // For CSV/XLSX files, create data source with tables
        const dataSource = await prisma.dataSource.create({
          data: {
            projectId: project.id,
            type: file.type,
            name: file.name,
            status: 'PENDING',
            rawPath: filePath,
          },
        });

        // Process tables
        for (const table of processedTables) {
          const tableRecord = await prisma.table.create({
            data: {
              dataSourceId: dataSource.id,
              name: table.name,
              rowCount: table.rows.length,
              columnCount: table.columns.length,
            },
          });

          // Profile columns
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

          // Store sample data
          const sampleRows = table.rows.slice(0, 100);
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
              status: 'PROCESSED',
            },
          });
        }

        return await prisma.dataSource.findUnique({
          where: { id: dataSource.id },
          include: {
            tables: {
              include: {
                columnProfiles: true,
              },
            },
          },
        });
      })
    );

    // Generate charts (2-4 charts)
    const chartSuggestions = await suggestCharts(project.id);
    const selectedSuggestions = chartSuggestions.slice(0, 4); // Limit to 4

    // Get project with data sources for chart generation
    const projectWithData = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        dataSources: {
          where: { status: 'PROCESSED' },
          include: {
            tables: {
              include: {
                columnProfiles: true,
              },
            },
            documentChunks: true,
          },
        },
      },
    });

    const charts = await Promise.all(
      selectedSuggestions.map(async (suggestion, index) => {
        const table = projectWithData!.dataSources
          .flatMap(ds => ds.tables)
          .find(t => t.columnProfiles.some(cp => cp.name === suggestion.xField || cp.name === suggestion.yField));

        let sampleData: any[] = [];
        if (table) {
          const dataSource = projectWithData!.dataSources.find(ds =>
            ds.tables.some(t => t.id === table.id)
          );
          if (dataSource?.meta) {
            try {
              const meta = typeof dataSource.meta === 'string'
                ? JSON.parse(dataSource.meta)
                : dataSource.meta;
              const tableMeta = meta?.tables?.[table.name];
              if (tableMeta?.sampleRows) {
                sampleData = tableMeta.sampleRows.slice(0, 10);
              }
            } catch (e) {
              // Meta parsing failed
            }
          }
        }

        let title = suggestion.title;
        let insight: string | null = null;

        try {
          const llmClient = getLLMClient();
          const result = await llmClient.describeChart(suggestion.config, sampleData);
          title = result.title;
          insight = result.insight;
        } catch (error) {
          console.error('LLM chart description failed:', error);
        }

        return prisma.chart.create({
          data: {
            projectId: project.id,
            tableId: table?.id,
            title,
            chartType: suggestion.chartType,
            config: JSON.stringify(suggestion.config),
            insight,
            orderIndex: index,
            generatedBy: 'system',
          },
        });
      })
    );

    // Generate quick confession (confession paragraph + talking points)
    const llmClient = getLLMClient();
    const quickConfession = await llmClient.generateQuickConfession(
      question,
      projectWithData!,
      audience
    );

    // Build data summaries for report context
    const dataSummaries: string[] = [];
    for (const dataSource of projectWithData!.dataSources) {
      if (dataSource.tables.length > 0) {
        for (const table of dataSource.tables) {
          const summary = `Table: ${table.name} (${table.rowCount} rows, ${table.columnCount} columns)
Columns: ${table.columnProfiles.map(cp => `${cp.name} (${cp.dataType})`).join(', ')}`;
          dataSummaries.push(summary);
        }
      }
      if (dataSource.documentChunks && dataSource.documentChunks.length > 0) {
        const textSummary = `Text source: ${dataSource.name}
Total chunks: ${dataSource.documentChunks.length}`;
        dataSummaries.push(textSummary);
      }
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
      },
      charts: charts.map(chart => ({
        ...chart,
        config: typeof chart.config === 'string' ? JSON.parse(chart.config) : chart.config,
      })),
      confession: quickConfession.confession,
      talkingPoints: quickConfession.talkingPoints,
      dataSources: dataSources.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Quick confession error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

