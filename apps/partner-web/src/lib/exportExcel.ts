/**
 * Client-side data export. Produces a CSV (UTF-8 with BOM) that opens directly
 * in Excel / Google Sheets — no dependency, works offline.
 */
export type Cell = string | number | boolean | null | undefined;

function csvEscape(v: Cell): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportRows(filename: string, headers: string[], rows: Cell[][]): void {
  const lines = [headers, ...rows].map((r) => r.map(csvEscape).join(','));
  const csv = '﻿' + lines.join('\r\n'); // BOM so Excel reads UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Paise → plain rupees number (no symbol) for spreadsheet math. */
export const rupeeCell = (paise: number): number => Math.round(paise / 100);
