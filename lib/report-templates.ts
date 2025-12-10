export interface ReportTemplate {
  sections: {
    key: string;
    title: string;
    description: string;
  }[];
}

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  market_snapshot: {
    sections: [
      {
        key: 'executive_summary',
        title: 'Executive Summary',
        description: 'High-level overview of key findings and recommendations',
      },
      {
        key: 'market_overview',
        title: 'Market Overview',
        description: 'Overall market size, trends, and dynamics',
      },
      {
        key: 'key_segments',
        title: 'Key Segments',
        description: 'Breakdown of market segments and their characteristics',
      },
      {
        key: 'competitive_landscape',
        title: 'Competitive Landscape',
        description: 'Analysis of competitors and market positioning',
      },
      {
        key: 'risks_opportunities',
        title: 'Risks and Opportunities',
        description: 'Key risks and opportunities identified in the data',
      },
      {
        key: 'recommended_next_steps',
        title: 'Recommended Next Steps',
        description: 'Actionable recommendations based on the analysis',
      },
    ],
  },
  sales_overview: {
    sections: [
      {
        key: 'executive_summary',
        title: 'Executive Summary',
        description: 'Topline sales metrics and key highlights',
      },
      {
        key: 'pipeline_health',
        title: 'Pipeline Health',
        description: 'Overall pipeline status, value, and velocity',
      },
      {
        key: 'conversion_by_stage',
        title: 'Conversion by Stage',
        description: 'Conversion rates and bottlenecks by sales stage',
      },
      {
        key: 'segment_region_performance',
        title: 'Segment & Region Performance',
        description: 'Performance breakdown by segment and region',
      },
      {
        key: 'risks_opportunities',
        title: 'Risks and Opportunities',
        description: 'Key risks and opportunities in the sales pipeline',
      },
    ],
  },
  marketing_performance: {
    sections: [
      {
        key: 'overview',
        title: 'Overview',
        description: 'High-level marketing performance summary',
      },
      {
        key: 'channel_performance',
        title: 'Channel Performance',
        description: 'Performance metrics by marketing channel',
      },
      {
        key: 'campaign_highlights',
        title: 'Campaign Highlights',
        description: 'Notable campaigns and their results',
      },
      {
        key: 'funnel_analysis',
        title: 'Funnel Analysis',
        description: 'Analysis of the marketing funnel and conversion rates',
      },
      {
        key: 'improvement_ideas',
        title: 'Improvement Ideas',
        description: 'Recommendations for improving marketing performance',
      },
    ],
  },
  general_analysis: {
    sections: [
      {
        key: 'summary',
        title: 'Summary',
        description: 'Overall summary of the analysis',
      },
      {
        key: 'key_insights',
        title: 'Key Insights',
        description: 'Main insights derived from the data',
      },
      {
        key: 'supporting_evidence',
        title: 'Supporting Evidence',
        description: 'Data and metrics supporting the insights',
      },
      {
        key: 'open_questions',
        title: 'Open Questions',
        description: 'Questions that remain unanswered or require further investigation',
      },
    ],
  },
};

export function getTemplateForGoalType(goalType: string): string {
  const mapping: Record<string, string> = {
    MARKET_SNAPSHOT: 'market_snapshot',
    SALES_OVERVIEW: 'sales_overview',
    MARKETING_PERFORMANCE: 'marketing_performance',
    GENERAL_ANALYSIS: 'general_analysis',
  };
  return mapping[goalType] || 'general_analysis';
}


