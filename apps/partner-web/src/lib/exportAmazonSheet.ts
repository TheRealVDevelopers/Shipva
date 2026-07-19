/**
 * Amazon export — matches the client's "Export file Amazon.xlsx" exactly.
 *
 * 67 columns, ONE ROW PER VR ID (leg), six stops. Each stop is a block of
 * name / yard-arrival / arrival-time-per-POC / Sarva-POC-updated-time / feedback,
 * then the same for departure. Two of those per-stop fields — "Sarva POC Updated
 * Time" and "Feedback" — have no home in the data model yet, so they export
 * blank, exactly as they are blank in the client's own sample.
 *
 * Deliberate quirk, replicated from their file: **Stop 3 has no departure
 * time / POC / feedback columns** (6 columns where every other stop has 9). It's
 * almost certainly an oversight in their template, but "ensure the export matches
 * it exactly" means we reproduce it — an extra column here shifts every trailing
 * column and files data under the wrong header when they paste into their sheet.
 * Flagged to the client separately (see the defects note).
 */
import type { Tour, TourLeg } from './store.js';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDT = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** Scheduled datetime-local string → "YYYY-MM-DD HH:MM:SS". */
const schedDT = (s?: string): string => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : fmtDT(d);
};
/** Actual check-in/out epoch ms → "YYYY-MM-DD HH:MM:SS". */
const actualDT = (ms?: number): string => (ms ? fmtDT(new Date(ms)) : '');

/** Date column — the run's service date at midnight, matching the sample. */
function dateCell(t: Tour): string {
  const src = t.serviceAt || t.date;
  const d = new Date(src);
  if (isNaN(d.getTime())) return t.date ?? '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`;
}

/** The 67 headers, in the client's exact order (incl. the Stop-3 quirk). */
function headers(): string[] {
  const h: string[] = [
    'Date', 'Tour ID', 'VR ID', 'Facility Sequence', 'Trip Type SCHEDULE\\ ADHOC',
    'Sarva Express Equipment Type', 'Amazon Relay Equipment Type', 'Driver', 'Vehicle ID', 'Driver Number', "VENDOR'S NAME",
  ];
  for (let n = 1; n <= 6; n++) {
    h.push(`Stop ${n}`, `Stop ${n} Yard Arrival`, `Stop ${n} Arrival Time, Accordingly, POC In Website`, 'Sarva POC Updated Time', 'Feedback', `Stop ${n} Yard Departure`);
    if (n === 3) continue; // Stop 3: no departure time / POC / feedback in their sheet
    h.push(`Stop ${n} Departure Time, Accordingly, POC In Website`, 'Sarva POC Updated Time', 'Feedback');
  }
  h.push('Sarva Status', 'PRESENT / Absent', 'No Load\\ Load', 'Advance / Adhoc Amount', 'Paid / Pending');
  return h;
}

/** One row per VR ID leg. Cell count must equal the 67 headers exactly. */
function legRow(t: Tour, leg: TourLeg): string[] {
  const stops = leg.stops ?? [];
  const facility = stops.map((s) => s.name).filter(Boolean).join('->');
  const row: string[] = [
    dateCell(t), t.tourId, leg.vrid, facility, t.scheduleAdhoc,
    t.seEquipmentType, t.amzEquipmentType, t.driver, t.vehicleId, t.driverNumber, t.vendorName,
  ];
  for (let n = 0; n < 6; n++) {
    const s = stops[n];
    row.push(
      s?.name ?? '',                 // Stop N
      schedDT(s?.arrivalAt),         // Yard Arrival (scheduled)
      actualDT(s?.actualArrival),    // Arrival Time, per the POC's check-in
      '',                            // Sarva POC Updated Time — no field yet
      '',                            // Feedback — no field yet
      schedDT(s?.departureAt),       // Yard Departure (scheduled)
    );
    if (n === 2) continue;           // Stop 3 (index 2) stops here — their quirk
    row.push(
      actualDT(s?.actualDeparture),  // Departure Time, per the POC's check-out
      '',                            // Sarva POC Updated Time
      '',                            // Feedback
    );
  }
  row.push(
    t.sarvaStatus || t.amzStatus,    // Sarva Status
    t.present,                       // PRESENT / Absent
    leg.loadType || '',              // No Load\ Load (per leg)
    t.advanceAmount,                 // Advance / Adhoc Amount
    t.paidPending,                   // Paid / Pending
  );
  return row;
}

/** Legs for a tour — the new per-VRID model, or a single synthetic leg for an
 *  older record that only has flat stops. */
function legsOf(t: Tour): TourLeg[] {
  if (t.legs && t.legs.length) return t.legs;
  const vrids = t.vrIds?.length ? t.vrIds : t.vrId ? [t.vrId] : [''];
  return vrids.map((v) => ({ vrid: v, stops: [] }));
}

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function exportAmazonSheet(tours: Tour[]): void {
  const HEAD = headers();
  const rows = tours.flatMap((t) => legsOf(t).map((leg) => legRow(t, leg)));

  const thStyle = 'font-weight:bold;text-align:center;vertical-align:middle;border:1px solid #808080;padding:4px 6px;font-size:10pt;background:#FFFFFF;color:#000;';
  const head = HEAD.map((c) => `<th style="${thStyle}">${esc(c)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #C0C0C0;padding:3px 6px;font-size:10pt;">${esc(c)}</td>`).join('')}</tr>`).join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table border="1" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Export file Amazon - ${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
