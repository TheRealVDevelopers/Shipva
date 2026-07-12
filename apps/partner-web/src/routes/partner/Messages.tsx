import { useMemo, useState } from 'react';
import { Send, Copy, Check, Search, Truck, Package, BellRing } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { rupees } from '../../lib/format.js';
import { useStore } from '../../lib/store.js';
import { tripPoints } from '../../lib/trip.js';
import { BRAND } from '../../lib/brand.js';
import type { Trip } from '../../lib/mocks.js';

function waDigits(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
}

export function Messages() {
  const { trips, drivers, customers } = useStore();
  const [q, setQ] = useState('');
  const [tripLr, setTripLr] = useState(trips[0]?.lr ?? '');

  const filtered = useMemo(() => trips.filter((t) => {
    if (!q) return true;
    const hay = `${t.lr} ${t.vrId ?? ''} ${t.from} ${t.to} ${t.driver} ${t.customer ?? ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [trips, q]);

  const trip = filtered.find((t) => t.lr === tripLr) ?? filtered[0] ?? null;

  const driverPhone = trip ? drivers.find((d) => d.name === trip.driver)?.phone ?? '' : '';
  const customer = trip?.customer ? customers.find((c) => c.name === trip.customer) : undefined;
  const customerPhone = customer?.phone ?? '';

  const messages = trip ? buildMessages(trip, customer?.outstandingPaise) : null;

  return (
    <PartnerLayout title="WhatsApp Messages" subtitle="Pick a trip — all three messages are ready to send">
      <div className="space-y-6">
        {/* Trip picker + search */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 ring-1 ring-inset ring-neutral-200">
              <Search size={15} className="text-neutral-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trip by VR / LR / route / driver / customer"
                className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400" />
            </div>
            <select value={trip?.lr ?? ''} onChange={(e) => setTripLr(e.target.value)}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-neutral-900 outline-none ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-primary-400">
              {filtered.length === 0 && <option value="">No trips match</option>}
              {filtered.map((t) => <option key={t.lr} value={t.lr}>{t.vrId ?? t.lr} · {t.from}→{t.to}</option>)}
            </select>
          </div>
          {trip && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">
              <span><span className="font-bold text-neutral-700">VR:</span> {trip.vrId ?? '—'}</span>
              <span><span className="font-bold text-neutral-700">LR:</span> {trip.lr}</span>
              <span><span className="font-bold text-neutral-700">Driver:</span> {trip.driver}</span>
              <span><span className="font-bold text-neutral-700">Vehicle:</span> {trip.vehicleReg}</span>
              {trip.customer && <span><span className="font-bold text-neutral-700">Customer:</span> {trip.customer}</span>}
            </div>
          )}
        </Card>

        {trip && messages ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <WaCard
              icon={<Truck size={15} />} accent="#0F3D72"
              title="Trip → driver" to={trip.driver} phone={driverPhone}
              msg={messages.driver}
              note="Includes tappable Google Maps links for each point." />
            <WaCard
              icon={<Package size={15} />} accent="#D86C0E"
              title="Dispatch / LR → customer" to={trip.customer ?? 'Customer'} phone={customerPhone}
              msg={messages.dispatch}
              note={trip.customer ? undefined : 'No customer on this trip — add one to auto-fill the number.'} />
            <WaCard
              icon={<BellRing size={15} />} accent="#0e9f6e"
              title="Payment reminder → customer" to={trip.customer ?? 'Customer'} phone={customerPhone}
              msg={messages.reminder} />
          </div>
        ) : (
          <Card><div className="p-10 text-center text-sm text-neutral-400">No trip selected.</div></Card>
        )}
      </div>
    </PartnerLayout>
  );
}

interface BuiltMessages { driver: string; dispatch: string; reminder: string }

function buildMessages(trip: Trip, outstandingPaise?: number): BuiltMessages {
  const pts = tripPoints(trip);
  const routeLines = pts.map((p, i) => {
    const tag = i === 0 ? '📍 Pickup' : i === pts.length - 1 ? '🏁 Drop' : `➡️ Point ${i}`;
    return `${tag}: ${p.label}${p.mapUrl ? `\n   ${p.mapUrl}` : ''}`;
  }).join('\n');

  const driver = `🚚 *New trip assigned*\nVR: ${trip.vrId ?? '—'}  |  LR: ${trip.lr}\n\n`
    + `Vehicle: ${trip.vehicleReg}\nMaterial: ${trip.material} (${trip.weightKg.toLocaleString('en-IN')} kg)\nFreight: ${rupees(trip.freightPaise)}\n\n`
    + `*Route*\n${routeLines}\n\n`
    + `Please tap the map links above and confirm pickup. — ${BRAND.company}`;

  const dispatch = `Dear ${trip.customer ?? 'Customer'},\n\n`
    + `Your consignment *${trip.lr}* (VR ${trip.vrId ?? '—'}) has been dispatched. 🚚\n`
    + `${trip.from} → ${trip.to}\nMaterial: ${trip.material} (${trip.weightKg.toLocaleString('en-IN')} kg)\n\n`
    + `We will share live updates as it moves. Thank you for choosing ${BRAND.company}.`;

  const due = outstandingPaise && outstandingPaise > 0 ? outstandingPaise : trip.freightPaise;
  const reminder = `Dear ${trip.customer ?? 'Customer'},\n\n`
    + `This is a gentle reminder that an amount of *${rupees(due)}* is pending against your account (ref trip ${trip.lr}).\n\n`
    + `Kindly arrange payment at your earliest convenience. Thank you.\n— ${BRAND.company} Accounts`;

  return { driver, dispatch, reminder };
}

function WaCard({ icon, accent, title, to, phone, msg, note }: {
  icon: React.ReactNode; accent: string; title: string; to: string; phone: string; msg: string; note?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const link = `https://wa.me/${phone ? waDigits(phone) : ''}?text=${encodeURIComponent(msg)}`;
  async function copy() {
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* no clipboard */ }
  }
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: accent }}>{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-neutral-900">{title}</div>
          <div className="truncate text-[11px] text-neutral-500">To: {to}{phone ? ` · ${phone}` : ' · no number'}</div>
        </div>
      </div>
      <div className="flex-1 p-3">
        <div className="h-full rounded-2xl bg-[#E5DDD5] p-3">
          <div className="max-w-full rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
            <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-neutral-800">{msg}</p>
            <div className="mt-1 text-right text-[10px] text-neutral-400">now</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 pb-3">
        <a href={link} target="_blank" rel="noopener noreferrer"
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-white shadow-sm transition ${phone ? 'bg-[#25D366] hover:bg-[#1fbd5a]' : 'bg-[#25D366]/70 hover:bg-[#25D366]'}`}>
          <Send size={14} /> Open in WhatsApp
        </a>
        <button onClick={copy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50">
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
      {note && <p className="px-4 pb-3 text-[11px] text-neutral-400">{note}</p>}
    </Card>
  );
}
