import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { prisma } from './prisma';

export interface ParsedTable {
  name: string;
  rows: any[];
  columns: string[];
}

export async function parseCSV(fileBuffer: Buffer): Promise<ParsedTable> {
  const csvText = fileBuffer.toString('utf-8');
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  const rows = result.data as any[];
  const columns = result.meta.fields || [];

  return {
    name: 'Sheet1',
    rows,
    columns,
  };
}

export async function parseXLSX(fileBuffer: Buffer): Promise<ParsedTable[]> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const tables: ParsedTable[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    if (jsonData.length === 0) return;

    const firstRow = jsonData[0] as any;
    const columns = Object.keys(firstRow);

    tables.push({
      name: sheetName,
      rows: jsonData,
      columns,
    });
  });

  return tables;
}

export function inferColumnType(values: any[]): string {
  const nonNullValues = values.filter(v => v != null);
  if (nonNullValues.length === 0) return 'string';

  // Check for dates
  const dateCount = nonNullValues.filter(v => {
    if (typeof v === 'string') {
      const date = new Date(v);
      return !isNaN(date.getTime());
    }
    return false;
  }).length;

  if (dateCount / nonNullValues.length > 0.8) return 'date';

  // Check for numbers
  const numCount = nonNullValues.filter(v => typeof v === 'number' || !isNaN(Number(v))).length;
  if (numCount / nonNullValues.length > 0.8) return 'numeric';

  // Check for booleans
  const boolCount = nonNullValues.filter(v => typeof v === 'boolean' || v === 'true' || v === 'false').length;
  if (boolCount / nonNullValues.length > 0.8) return 'boolean';

  // Check for categorical (low distinct count)
  if (nonNullValues.length > 0) {
    const distinct = new Set(nonNullValues.map(v => String(v))).size;
    if (distinct < 20 && distinct < nonNullValues.length * 0.5) {
      return 'categorical';
    }
  }

  return 'string';
}

export function calculateColumnStats(columnName: string, values: any[], dataType: string) {
  const nonNullValues = values.filter(v => v != null);
  const nullPercentage = ((values.length - nonNullValues.length) / values.length) * 100;
  const distinctCount = new Set(nonNullValues.map(v => String(v))).size;

  let min: number | null = null;
  let max: number | null = null;
  let mean: number | null = null;
  let stdDev: number | null = null;

  if (dataType === 'numeric' && nonNullValues.length > 0) {
    const numbers = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n));
    if (numbers.length > 0) {
      numbers.sort((a, b) => a - b);
      min = numbers[0];
      max = numbers[numbers.length - 1];
      mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;

      if (numbers.length > 1) {
        const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean!, 2), 0) / numbers.length;
        stdDev = Math.sqrt(variance);
      }
    }
  }

  return {
    name: columnName,
    dataType,
    nullPercentage,
    distinctCount,
    min,
    max,
    mean,
    stdDev,
  };
}

export async function profileTable(tableId: string) {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      columnProfiles: true,
      dataSource: true,
    },
  });

  if (!table) throw new Error('Table not found');

  // For MVP, we'll store sample data in the DataSource meta
  // In production, you'd fetch from object storage
  return table;
}


