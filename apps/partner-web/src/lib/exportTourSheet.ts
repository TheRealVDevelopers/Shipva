/**
 * Styled "Amazon Tour Sheet" export — reproduces the client's operational Excel
 * format (54 columns, up to 4 stops, bold centred headers, red status/photo
 * columns, yellow "Amazon Rely KM") as a .xls that opens in Excel with the
 * formatting. Populated fully from Tour records.
 *
 * Column order is verified against their own "EXL Update.xlsx": stops 1–3 each
 * end with a KM column, stop 4 does not. Keep it that way — an extra column
 * shifts TOTAL/AMAZON RELY/GPS/Remarks and silently files numbers under the
 * wrong headers when they paste into their template.
 */
import type { Tour, TourStop } from './store.js';

interface Col { label: string; red?: boolean; yellow?: boolean; get: (t: Tour) => string }

const yn = (b: boolean) => (b ? 'YES' : 'NO');
const stopAt = (t: Tour, i: number): TourStop | undefined => t.stops[i];

function stopCols(n: number): Col[] {
  const i = n - 1;
  const cols: Col[] = [
    { label: `Stop ${n}`, get: (t) => stopAt(t, i)?.name ?? '' },
    { label: `Stop ${n} AMZ Arrival`, get: (t) => stopAt(t, i)?.amzArrival ?? '' },
    { label: 'KM PHOTO\nYES/NO', red: true, get: (t) => (stopAt(t, i)?.name ? yn(!!stopAt(t, i)?.kmPhoto) : '') },
    { label: 'Arrival Report', red: true, get: (t) => stopAt(t, i)?.arrivalReport ?? '' },
    { label: `Stop ${n} AMZ Departure`, get: (t) => stopAt(t, i)?.amzDeparture ?? '' },
    { label: 'INVOICE PHOTO\nYES/NO', red: true, get: (t) => (stopAt(t, i)?.name ? yn(!!stopAt(t, i)?.invoicePhoto) : '') },
    { label: 'Dispatch Report', red: true, get: (t) => stopAt(t, i)?.dispatchReport ?? '' },
  ];
  // The client's own sheet carries a KM column for stops 1–3 but NOT for stop 4
  // (it runs Dispatch Report -> TOTAL VEHICLE MANUAL KM). Emitting one anyway
  // shifted their last four columns, so stop 4's KM is folded into the manual-KM
  // total below instead. Match their file exactly — 54 columns.
  if (n < 4) cols.push({ label: 'KM', get: (t) => stopAt(t, i)?.km ?? '' });
  return cols;
}

/** Stop 4 has no KM column in the client's sheet, so its reading would be lost.
 *  Fold it into the manual-KM total rather than dropping the number. */
function totalManualKm(t: Tour): string {
  const stop4 = stopAt(t, 3)?.km?.trim();
  if (!stop4) return t.totalManualKm;
  const total = Number(t.totalManualKm);
  const extra = Number(stop4);
  if (!Number.isFinite(total) || !Number.isFinite(extra)) return t.totalManualKm;
  return String(total + extra);
}

const COLUMNS: Col[] = [
  { label: 'DATE', get: (t) => t.date },
  { label: 'Tour ID', get: (t) => t.tourId },
  { label: 'vr id', get: (t) => (t.vrIds && t.vrIds.length ? t.vrIds.join(', ') : t.vrId) },
  { label: 'SE Tracker In This Line', get: (t) => t.seTracker },
  { label: 'Facility Sequence', get: (t) => t.stops.map((s) => s.name).filter(Boolean).join(' -> ') },
  { label: 'Toll', get: (t) => t.toll },
  { label: 'AMZ Equipment Type', get: (t) => t.amzEquipmentType },
  { label: 'SE Equipment Type', get: (t) => t.seEquipmentType },
  { label: 'AMZ Status', red: true, get: (t) => t.amzStatus },
  { label: 'Sarva Status', red: true, get: (t) => t.sarvaStatus },
  { label: 'PRESENT / Absent', red: true, get: (t) => t.present },
  { label: 'SCHEDULE\\ ADHOC', get: (t) => t.scheduleAdhoc },
  { label: 'No Load\\ Load', red: true, get: (t) => t.noLoadLoad },
  { label: 'Advance / Adhoc Amount', red: true, get: (t) => t.advanceAmount },
  { label: 'Paid / Pending', red: true, get: (t) => t.paidPending },
  { label: 'Driver', get: (t) => t.driver },
  { label: 'Vehicle ID', get: (t) => t.vehicleId },
  { label: 'Driver Number', get: (t) => t.driverNumber },
  { label: "VENDOR'S NAME", get: (t) => t.vendorName },
  ...stopCols(1), ...stopCols(2), ...stopCols(3), ...stopCols(4),
  { label: 'TOTAL VEHICLE\nMANUAL KM', get: totalManualKm },
  { label: 'AMAZON\nRELY KM', yellow: true, get: (t) => t.amazonRelyKm },
  { label: 'GPS KM', get: (t) => t.gpsKm },
  { label: 'Remarks', get: (t) => t.remarks },
];

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const dtShort = (dt?: string) => {
  if (!dt) return '';
  const d = new Date(dt);
  return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};

/** Tours built with VRID legs store stops per-leg — flatten them (up to 4) and
 *  join the VRIDs so the existing sheet columns keep working. */
function normalize(t: Tour): Tour {
  if (!t.legs || t.legs.length === 0) return t;
  const flat: TourStop[] = t.legs.flatMap((l) => l.stops).slice(0, 4).map((s) => ({
    name: s.name, amzArrival: dtShort(s.arrivalAt), amzDeparture: dtShort(s.departureAt),
    kmPhoto: !!t.kmPhotoImg, invoicePhoto: !!t.invoicePhotoImg, arrivalReport: '', dispatchReport: '', km: '',
  }));
  return { ...t, stops: flat, vrIds: t.legs.map((l) => l.vrid).filter(Boolean) };
}

export function exportTourSheet(input: Tour[]): void {
  const tours = input.map(normalize);
  const thBase = 'font-weight:bold;text-align:center;vertical-align:middle;border:1px solid #808080;padding:4px 6px;font-size:10pt;background:#FFFFFF;';
  const head = COLUMNS.map((c) => {
    const style = thBase + (c.yellow ? 'background:#FFFF00;' : '') + (c.red ? 'color:#FF0000;' : 'color:#000000;');
    return `<th style="${style}">${esc(c.label).replace(/\n/g, '<br/>')}</th>`;
  }).join('');

  const body = tours.map((t) => {
    const tds = COLUMNS.map((c) => {
      const style = 'border:1px solid #C0C0C0;padding:3px 6px;font-size:10pt;text-align:center;' + (c.red ? 'color:#C00000;' : '');
      return `<td style="${style}">${esc(c.get(t))}</td>`;
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
