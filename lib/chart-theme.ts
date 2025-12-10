/**
 * Professional chart theme configuration
 * Business-friendly color palette and styling
 */

export const CHART_COLORS = {
  primary: '#3b82f6',      // Blue - main data series
  secondary: '#10b981',   // Green - positive metrics
  accent: '#8b5cf6',      // Purple - highlights
  warning: '#f59e0b',     // Amber - attention
  danger: '#ef4444',      // Red - critical
  neutral: '#6b7280',     // Gray - secondary data

  // Extended palette for multiple series
  palette: [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ],

  // Grayscale for backgrounds
  background: {
    light: '#f9fafb',
    medium: '#f3f4f6',
    dark: '#e5e7eb',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
  },
};

export const CHART_THEME = {
  colors: CHART_COLORS,

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Chart-specific settings
  line: {
    strokeWidth: 2,
    dotRadius: 4,
    activeDotRadius: 6,
  },

  bar: {
    borderRadius: 4,
    spacing: 0.2,
  },

  pie: {
    innerRadius: 0, // 0 for pie, > 0 for donut
    outerRadius: 100,
    labelLine: false,
  },

  // Grid and axes
  grid: {
    stroke: '#e5e7eb',
    strokeDasharray: '3 3',
  },

  axis: {
    stroke: '#6b7280',
    fontSize: 12,
    tickSize: 5,
  },

  // Tooltip
  tooltip: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: 8,
    fontSize: 12,
  },

  // Legend
  legend: {
    fontSize: 12,
    iconSize: 12,
    spacing: 8,
  },
};

export function getColorForIndex(index: number): string {
  return CHART_COLORS.palette[index % CHART_COLORS.palette.length];
}

export function getColorForChartType(chartType: string, index: number = 0): string {
  const colorMap: Record<string, string> = {
    line: CHART_COLORS.primary,
    bar: CHART_COLORS.primary,
    stackedBar: CHART_COLORS.primary,
    pie: CHART_COLORS.palette[index],
    donut: CHART_COLORS.palette[index],
    funnel: CHART_COLORS.primary,
    table: CHART_COLORS.neutral,
  };

  return colorMap[chartType] || getColorForIndex(index);
}

