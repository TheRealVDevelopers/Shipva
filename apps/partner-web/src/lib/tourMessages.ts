/**
 * WhatsApp message builders for an Amazon tour — two formats the team uses:
 *  • vendor  → payment / advance details (G-pay + VRIDs)
 *  • driver  → the full route, per VRID, with each stop's times and map link
 * Reproduces the exact layout the client shares today.
 */
import type { Tour, TourLeg } from './store.js';

export function waDigits(phone: string): string {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return '';
  return d.length === 10 ? `91${d}` : d;
}

function legsOf(t: Tour): TourLeg[] {
  if (t.legs && t.legs.length) return t.legs;
  // Legacy fallback: one leg from the flat stops + first VRID.
  const vrids = t.vrIds && t.vrIds.length ? t.vrIds : t.vrId ? [t.vrId] : [];
  return vrids.map((v) => ({ vrid: v, stops: [] }));
}

/** "2026-07-15T01:00" → "15 Jul, 01:00 IST" (or the raw string if unparseable). */
function fmtTime(dt?: string): string {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day}, ${time} IST`;
}
/** "…T…" or "14 Jul 2026" → "14/07/2026". */
export function fmtServiceDate(t: Tour): string {
  const raw = t.serviceAt || t.date;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Vendor payment message. */
export function vendorMessage(t: Tour): string {
  const vrids = legsOf(t).map((l) => l.vrid).filter(Boolean);
  const lines = [
    `Service Date : ${fmtServiceDate(t)}`,
    `G pay Name : ${t.gpayName || '—'}`,
    `G/pay no : ${t.gpayNumber || '—'}`,
    `Advance Amount : ${t.advanceAmount || '0'}`,
    `Vehicle number: ${t.vehicleId || '—'}`,
    ...vrids.map((v, i) => `VRID ${i + 1}: ${v}`),
  ];
  return lines.join('\n');
}

/** Driver route message — one block per VRID with per-stop times + map links. */
export function driverMessage(t: Tour): string {
  const head = [
    `Service Date: ${fmtServiceDate(t)}`,
    `Vehicle Number: ${t.vehicleId || '—'}`,
    `Driver Number: ${t.driverNumber || '—'}`,
    `Driver Name : ${t.driver || '—'}`,
    `Trip Type : ${t.scheduleAdhoc === 'ADHOC' ? 'Ad-hoc' : 'Scheduled'}`,
    `Vehicle Type: ${t.amzEquipmentType || '—'}`,
    `TRIP ID : ${t.tourId || '—'}`,
  ].join('\n');

  const blocks = legsOf(t).map((leg, i) => {
    const route = leg.stops.map((s) => s.name).filter(Boolean).join(' -> ');
    const stopLines = leg.stops.map((s) => {
      const parts: string[] = [];
      if (s.arrivalAt) parts.push(`Arrival time: ${fmtTime(s.arrivalAt)}`);
      parts.push(`${s.name}:- ${s.mapUrl || ''}`.trimEnd());
      if (s.departureAt) parts.push(`Departure time: ${fmtTime(s.departureAt)}`);
      return parts.join('\n');
    }).join('\n');
    return `${i + 1}) VR Id-${leg.vrid}\nRoute : ${route}\n${stopLines}`;
  }).join('\n\n');

  return `${head}\n\n${blocks}`;
}

export function waLink(phone: string, text: string): string {
  const num = waDigits(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
