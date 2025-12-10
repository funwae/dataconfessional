/**
 * Export format generators for Meeting Brief and Speaker Notes
 */

interface Report {
  id: string;
  title: string;
  sections: Array<{
    key: string;
    title: string;
    content: string;
    orderIndex: number;
  }>;
}

interface Chart {
  id: string;
  title: string;
  chartType: string;
  insight: string | null;
}

/**
 * Generate a one-page meeting brief with key points and charts
 */
export function generateMeetingBrief(report: Report, charts: Chart[]): string {
  let brief = `# ${report.title} - Meeting Brief\n\n`;
  brief += `*Generated ${new Date().toLocaleDateString()}*\n\n`;

  // Extract executive summary if available
  const execSummary = report.sections.find(s => s.key === 'executive_summary');
  if (execSummary) {
    brief += `## Key Takeaways\n\n`;
    // Extract first 3-5 bullet points or sentences
    const lines = execSummary.content.split('\n').filter(l => l.trim());
    const keyPoints = lines
      .slice(0, 5)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);

    keyPoints.forEach((point, idx) => {
      brief += `${idx + 1}. ${point}\n`;
    });
    brief += `\n`;
  }

  // Add top 2 most important charts
  if (charts.length > 0) {
    brief += `## Key Charts\n\n`;
    charts.slice(0, 2).forEach((chart, idx) => {
      brief += `### ${chart.title}\n\n`;
      if (chart.insight) {
        brief += `*${chart.insight}*\n\n`;
      }
    });
  }

  // Add "What to say" section from talking points
  brief += `## What to Say\n\n`;
  brief += `- Lead with the key takeaways above\n`;
  brief += `- Reference the charts for visual support\n`;
  brief += `- Be prepared to discuss implications and next steps\n\n`;

  return brief;
}

/**
 * Generate speaker notes for presentation
 */
export function generateSpeakerNotes(report: Report, charts: Chart[]): string {
  let notes = `# ${report.title} - Speaker Notes\n\n`;
  notes += `*Use these notes to guide your presentation*\n\n`;

  // Generate notes for each section
  report.sections.forEach((section, idx) => {
    notes += `## Slide ${idx + 1}: ${section.title}\n\n`;
    notes += `**Say this in your own words:**\n\n`;

    // Convert content to speaking points
    const lines = section.content.split('\n').filter(l => l.trim());
    lines.forEach((line, lineIdx) => {
      // Remove markdown formatting
      const cleanLine = line
        .replace(/^#+\s*/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^[-•*]\s*/, '')
        .trim();

      if (cleanLine.length > 0) {
        notes += `- ${cleanLine}\n`;
      }
    });

    // Add key numbers to mention
    const numbers = section.content.match(/\d+[%$]?/g);
    if (numbers && numbers.length > 0) {
      notes += `\n**Key numbers to mention:** ${numbers.slice(0, 3).join(', ')}\n`;
    }

    notes += `\n`;
  });

  // Add transitions
  notes += `## Transitions\n\n`;
  for (let i = 0; i < report.sections.length - 1; i++) {
    const current = report.sections[i];
    const next = report.sections[i + 1];
    notes += `After "${current.title}", transition to "${next.title}" by saying:\n`;
    notes += `"Now let's look at ${next.title.toLowerCase()}..."\n\n`;
  }

  // Add chart talking points
  if (charts.length > 0) {
    notes += `## Chart Talking Points\n\n`;
    charts.forEach((chart, idx) => {
      notes += `**${chart.title}:**\n`;
      if (chart.insight) {
        notes += `- ${chart.insight}\n`;
      }
      notes += `- Point out key trends or outliers\n`;
      notes += `- Connect to overall narrative\n\n`;
    });
  }

  return notes;
}

