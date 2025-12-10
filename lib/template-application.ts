import { prisma } from './prisma';

/**
 * Apply a saved template to a project
 * Creates charts and report structure based on template configuration
 */
export async function applyTemplateToProject(templateId: string, projectId: string): Promise<void> {
  // Get template
  const template = await prisma.savedTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      dataSources: {
        where: { status: 'PROCESSED' },
        include: {
          tables: {
            include: {
              columnProfiles: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Parse template configs
  const chartConfigs = JSON.parse(template.chartConfigs);
  const reportSections = JSON.parse(template.reportSections);

  // Apply default audience and tone to project
  await prisma.project.update({
    where: { id: projectId },
    data: {
      audienceType: template.defaultAudience,
      // Note: tone will be added to Project model later
    },
  });

  // Create charts from template
  if (chartConfigs && chartConfigs.length > 0) {
    for (let i = 0; i < chartConfigs.length; i++) {
      const chartConfig = chartConfigs[i];

      // Find matching table if config specifies fields
      let tableId: string | null = null;
      if (chartConfig.config?.xField || chartConfig.config?.yField) {
        const matchingTable = project.dataSources
          .flatMap(ds => ds.tables)
          .find(t => {
            const columnNames = t.columnProfiles.map(cp => cp.name);
            return (
              (chartConfig.config.xField && columnNames.includes(chartConfig.config.xField)) ||
              (chartConfig.config.yField && columnNames.includes(chartConfig.config.yField))
            );
          });
        tableId = matchingTable?.id || null;
      }

      await prisma.chart.create({
        data: {
          projectId,
          tableId,
          title: chartConfig.title || `Chart ${i + 1}`,
          chartType: chartConfig.chartType,
          config: JSON.stringify(chartConfig.config || {}),
          insight: chartConfig.insight || null,
          orderIndex: i,
          generatedBy: 'template',
        },
      });
    }
  }

  // Create report from template
  if (reportSections && reportSections.length > 0) {
    const report = await prisma.report.create({
      data: {
        projectId,
        templateType: 'general_analysis', // Default, can be customized
        title: `${project.name} - Report`,
        sections: {
          create: reportSections.map((section: any, index: number) => ({
            key: section.key || `section_${index}`,
            title: section.title || `Section ${index + 1}`,
            content: section.content || '',
            orderIndex: section.orderIndex !== undefined ? section.orderIndex : index,
          })),
        },
      },
    });
  }
}

