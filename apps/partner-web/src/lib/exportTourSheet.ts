/**
 * Styled "Amazon Tour Sheet" export — reproduces the client's operational Excel
 * format (55 columns, multi-stop, bold centred headers, red status/photo columns,
 * yellow "Amazon Rely KM") as a .xls that opens in Excel with the formatting.
 *
 * Built as an HTML table with inline styles saved as application/vnd.ms-excel —
 * Excel renders the colours/borders. Columns we don't yet capture in the app are
 * left blank, ready to be filled (see the gap note in the app / docs).
 */
import type { Trip, FleetDriver, Truck } from './mocks.js';

interface Col { label: string; red?: boolean; yellow?: boolean; get: (t: Trip, ctx: Ctx) => string }
interface Ctx { phone: (name: string) => string; ttype: (reg: string) => string }

const AMZ_STATUS: Record<string, string> = {
  assigned: 'PLANNED', loading: 'IN PROGRESS', in_transit: 'IN TRANSIT',
  at_drop: 'AT DROP', pod_pending: 'POD PENDING', closed: 'COMPLETED',
};
const rupees0 = (p: number) => (p / 100).toLocaleString('en-IN');

function stopCols(n: number): Col[] {
  const stopVal = (t: Trip): string => (n === 1 ? t.from : n === 2 ? t.to : '');
  return [
    { label: `Stop ${n}`, get: (t) => stopVal(t) },
    { label: `Stop ${n} AMZ Arrival`, get: () => '' },
    { label: 'KM PHOTO\nYES/NO', red: true, get: () => '' },
    { label: 'Arrival Report', red: true, get: () => '' },
    { label: `Stop ${n} AMZ Departure`, get: () => '' },
    { label: 'INVOICE PHOTO\nYES/NO', red: true, get: () => '' },
    { label: 'Dispatch Report', red: true, get: () => '' },
    { label: 'KM', get: () => '' },
  ];
}

const COLUMNS: Col[] = [
  { label: 'DATE', get: (t) => t.date },
  { label: 'Tour ID', get: (t) => t.lr },
  { label: 'vr id', get: (t) => t.vehicleReg },
  { label: 'SE Tracker In This Line', get: () => '' },
  { label: 'Facility Sequence', get: (t) => `${t.from} -> ${t.to}` },
  { label: 'Toll', get: () => '' },
  { label: 'AMZ Equipment Type', get: (t, c) => c.ttype(t.vehicleReg) },
  { label: 'SE Equipment Type', get: () => '' },
  { label: 'AMZ Status', red: true, get: (t) => AMZ_STATUS[t.status] ?? '' },
  { label: 'Sarva Status', red: true, get: (t) => AMZ_STATUS[t.status] ?? '' },
  { label: 'PRESENT / Absent', red: true, get: () => 'PRESENT' },
  { label: 'SCHEDULE\\ ADHOC', get: () => 'SCHEDULE' },
  { label: 'No Load\\ Load', red: true, get: () => 'Load' },
  { label: 'Advance / Adhoc Amount', red: true, get: (t) => rupees0(t.freightPaise) },
  { label: 'Paid / Pending', red: true, get: () => '' },
  { label: 'Driver', get: (t) => t.driver },
  { label: 'Vehicle ID', get: (t) => t.vehicleReg },
  { label: 'Driver Number', get: (t, c) => c.phone(t.driver) },
  { label: "VENDOR'S NAME", get: () => '' },
  ...stopCols(1), ...stopCols(2), ...stopCols(3), ...stopCols(4),
  { label: 'TOTAL VEHICLE\nMANUAL KM', get: () => '' },
  { label: 'AMAZON\nRELY KM', yellow: true, get: () => '' },
  { label: 'GPS KM', get: () => '' },
  { label: 'Remarks', get: (t) => t.material },
];

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function exportTourSheet(trips: Trip[], drivers: FleetDriver[], trucks: Truck[]): void {
  const ctx: Ctx = {
    phone: (name) => drivers.find((d) => d.name === name)?.phone ?? '',
    ttype: (reg) => trucks.find((t) => t.reg === reg)?.type.replace('_', ' ') ?? '',
  };

  const thBase = 'font-weight:bold;text-align:center;vertical-align:middle;border:1px solid #808080;padding:4px 6px;font-size:10pt;background:#FFFFFF;';
  const head = COLUMNS.map((c) => {
    const style = thBase + (c.yellow ? 'background:#FFFF00;' : '') + (c.red ? 'color:#FF0000;' : 'color:#000000;');
    return `<th style="${style}">${esc(c.label).replace(/\n/g, '<br/>')}</th>`;
  }).join('');

  const body = trips.map((t) => {
    const tds = COLUMNS.map((c) => {
      const v = esc(c.get(t, ctx));
      const style = 'border:1px solid #C0C0C0;padding:3px 6px;font-size:10pt;text-align:center;' + (c.red ? 'color:#C00000;' : '');
      return `<td style="${style}">${v}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Tour Sheet</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table border="1" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sarva-tour-sheet-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
