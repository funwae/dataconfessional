/**
 * Formatting utilities for consistent number, date, and currency display
 */

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return formatNumber(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'month-year' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  if (format === 'month-year') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(d);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
  }

  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d, 'short');
}

export function detectNumberFormat(value: number, sampleValues?: number[]): {
  type: 'currency' | 'percentage' | 'count' | 'decimal';
  decimals: number;
  unit?: string;
} {
  // If we have sample values, analyze them
  if (sampleValues && sampleValues.length > 0) {
    const max = Math.max(...sampleValues);
    const min = Math.min(...sampleValues);

    // Check if values look like currency (typically > 1, often round numbers)
    if (max > 1 && (max % 1 === 0 || (max % 0.01 < 0.001))) {
      return { type: 'currency', decimals: 2 };
    }

    // Check if values are percentages (0-100 range)
    if (max <= 100 && min >= 0) {
      return { type: 'percentage', decimals: 1, unit: '%' };
    }

    // Check if values are counts (integers)
    if (sampleValues.every(v => Number.isInteger(v))) {
      return { type: 'count', decimals: 0 };
    }
  }

  // Default based on value
  if (value < 1 && value > 0) {
    return { type: 'percentage', decimals: 1, unit: '%' };
  }

  if (Number.isInteger(value)) {
    return { type: 'count', decimals: 0 };
  }

  return { type: 'decimal', decimals: 2 };
}

export function formatValue(value: number, format?: {
  type: 'currency' | 'percentage' | 'count' | 'decimal';
  decimals: number;
  unit?: string;
}): string {
  if (!format) {
    format = detectNumberFormat(value);
  }

  switch (format.type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value, format.decimals);
    case 'count':
      return formatNumber(value, 0);
    case 'decimal':
      return formatNumber(value, format.decimals);
    default:
      return formatNumber(value, 2);
  }
}

