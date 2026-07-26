/**
 * Diesel Requests — the accountant's settlement queue.
 *
 * The client's points 11–13:
 *  11. Accounts must see the complete detail of a request (vendor, driver,
 *      vehicle, VRID, Tour ID, amount…) or jump straight to the linked tour.
 *  12. Search plus a calendar/date filter.
 *  13. Pending and Paid tabs, and an export carrying the complete information.
 *
 * The detail is snapshotted onto the request when it's raised (see
 * MoneyRequest), so a settled advance still shows what it was paid against
 * even if the route is edited afterwards. Requests raised before that existed
 * fall back to the live tour, and to the free-text note beneath it.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Fuel, Search, CalendarRange, Download, Check, X, ExternalLink, Truck, User,
  Phone, Hash, IndianRupee, Clock,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { useStore, requestStatusLabel, type MoneyRequest, type Tour } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { roleLabel, canExportData } from '../../lib/roles.js';
import { useNotify } from '../../lib/notify.js';
import { exportRows, type Cell } from '../../lib/exportExcel.js';
import { brandSlug } from '../../lib/brand.js';

const TABS = ['Pending', 'Paid', 'Rejected', 'All'] as const;
type Tab = (typeof TABS)[number];

/** The YYYY-MM-DD a request belongs to, for the calendar filter. */
function dayKey(r: MoneyRequest): string {
  if (r.serviceAt) return r.serviceAt.slice(0, 10);
  if (r.createdAtMs) return new Date(r.createdAtMs).toISOString().slice(0, 10);
  const d = new Date(r.createdOn);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Detail off the request, falling back to the live tour for older records. */
function detailOf(r: MoneyRequest, tour: Tour | undefined) {
  return {
    vendorName: r.vendorName || tour?.vendorName || '',
    driver: r.driver || tour?.driver || '',
    driverNumber: r.driverNumber || tour?.driverNumber || '',
    vehicleId: r.vehicleId || tour?.vehicleId || '',
    gpayName: r.gpayName || tour?.gpayName || '',
    gpayNumber: r.gpayNumber || tour?.gpayNumber || '',
    tourCode: r.tourCode || tour?.tourId || '',
    vrids: r.vrids?.length
      ? r.vrids
      : (tour?.legs?.map((l) => l.vrid).filter(Boolean) ?? tour?.vrIds ?? []),
  };
}

export function Diesel() {
  const { requests, tours, resolveRequest } = useStore();
  const { member } = useAuth();
  const { push } = useNotify();

  const [tab, setTab] = useState<Tab>('Pending');
  const [q, setQ] = useState('');
  const [dateF, setDateF] = useState('');
  const [detail, setDetail] = useState<MoneyRequest | null>(null);
  const [payFor, setPayFor] = useState<MoneyRequest | null>(null);
  const [utr, setUtr] = useState('');

  const diesel = useMemo(() => requests.filter((r) => r.kind === 'diesel'), [requests]);
  const tourFor = (r: MoneyRequest) => tours.find((t) => t.id === r.tourId);

  const shown = useMemo(() => diesel.filter((r) => {
    if (tab === 'Pending' && r.status !== 'pending') return false;
    if (tab === 'Paid' && r.status !== 'approved') return false;
    if (tab === 'Rejected' && r.status !== 'rejected') return false;
    if (dateF && dayKey(r) !== dateF) return false;
    if (!q.trim()) return true;
    const d = detailOf(r, tourFor(r));
    const hay = [r.title, r.raisedBy, r.note, r.utr, d.vendorName, d.driver, d.driverNumber,
      d.vehicleId, d.gpayName, d.gpayNumber, d.tourCode, ...d.vrids].join(' ').toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  }), [diesel, tab, q, dateF, tours]);

  const sum = (list: MoneyRequest[]) => list.reduce((s, r) => s + (r.amountPaise ?? 0), 0);
  const pending = diesel.filter((r) => r.status === 'pending');
  const paid = diesel.filter((r) => r.status === 'approved');

  function settle(r: MoneyRequest, status: 'approved' | 'rejected', ref?: string) {
    const by = member ? `${member.name} · ${roleLabel(member.role)}` : 'Accounts';
    resolveRequest(r.id, status, { by, ...(ref ? { utr: ref } : {}) });
    push({
      title: status === 'approved' ? 'Marked paid' : 'Request rejected',
      body: `${r.tourCode || r.title}${r.amountPaise ? ` · ${rupees(r.amountPaise)}` : ''}`,
      tone: status === 'approved' ? 'success' : 'info',
    });
    setPayFor(null); setUtr(''); setDetail(null);
  }

  /** Point 13: "Export should include complete diesel request information." */
  function exportAll() {
    exportRows(`${brandSlug}-diesel-requests-${new Date().toISOString().slice(0, 10)}`,
      ['Raised on', 'Service date', 'Status', 'Tour ID', 'VRIDs', 'Vendor', 'Driver', 'Driver number',
        'Vehicle', 'G-pay name', 'G-pay number', 'Amount (₹)', 'Raised by', 'Note', 'Settled by', 'Settled on', 'UTR / reference'],
      shown.map((r): Cell[] => {
        const d = detailOf(r, tourFor(r));
        return [
          r.createdOn, r.serviceAt ? r.serviceAt.slice(0, 10) : '', requestStatusLabel(r),
          d.tourCode, d.vrids.join(', '), d.vendorName, d.driver, d.driverNumber,
          d.vehicleId, d.gpayName, d.gpayNumber,
          r.amountPaise ? Math.round(r.amountPaise / 100) : '',
          r.raisedBy, r.note ?? '', r.resolvedBy ?? '',
          r.resolvedAtMs ? new Date(r.resolvedAtMs).toLocaleString('en-IN') : '', r.utr ?? '',
        ];
      }));
  }

  return (
    <PartnerLayout title="Diesel Requests" subtitle="Advance requests raised on Amazon routes — settle and track">
      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Pending" value={String(pending.length)} hint="awaiting payment" tone="danger" icon={<Clock size={14} />} />
          <KpiCard label="Pending value" value={rupees(sum(pending))} hint="to pay out" tone="accent" icon={<IndianRupee size={14} />} />
          <KpiCard label="Paid" value={String(paid.length)} hint="settled" tone="success" icon={<Check size={14} />} />
          <KpiCard label="Paid value" value={rupees(sum(paid))} hint="released" tone="primary" icon={<Fuel size={14} />} />
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 ring-1 ring-inset ring-neutral-200">
                <Search size={14} className="text-neutral-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tour ID, VRID, vendor, driver, vehicle…"
                  className="w-60 bg-transparent text-xs font-semibold text-neutral-700 outline-none placeholder:text-neutral-400" />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 ring-1 ring-inset ring-neutral-200">
                <CalendarRange size={14} className="text-neutral-400" />
                <input type="date" value={dateF} onChange={(e) => setDateF(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-700 outline-none" />
                {dateF && <button onClick={() => setDateF('')} className="text-neutral-400 hover:text-neutral-700" title="Clear date"><X size={13} /></button>}
              </div>
            </div>
            {canExportData(member?.role) && (
              <Button size="sm" variant="secondary" onClick={exportAll}><Download size={13} /> Export</Button>
            )}
          </div>

          {/* Pending / Paid tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-100 px-3">
            {TABS.map((t) => {
              const n = t === 'Pending' ? pending.length : t === 'Paid' ? paid.length
                : t === 'Rejected' ? diesel.filter((r) => r.status === 'rejected').length : diesel.length;
              const on = tab === t;
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`relative whitespace-nowrap px-3 py-2.5 text-[13px] font-bold transition ${on ? 'text-primary-700' : 'text-neutral-500 hover:text-neutral-800'}`}>
                  {t}
                  {n > 0 && <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-extrabold text-neutral-600">{n}</span>}
                  {on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t bg-primary-500" />}
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-neutral-100">
            {shown.map((r) => {
              const d = detailOf(r, tourFor(r));
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <button onClick={() => setDetail(r)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-neutral-900">{d.tourCode || '—'}</span>
                      {d.vrids.slice(0, 3).map((v) => (
                        <span key={v} className="rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold" style={{ background: '#EAF1F8', color: '#0F5C9E' }}>{v}</span>
                      ))}
                      {d.vrids.length > 3 && <span className="text-[10px] font-bold text-neutral-400">+{d.vrids.length - 3}</span>}
                      <Badge tone={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>{requestStatusLabel(r)}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-neutral-500">
                      {[d.vendorName, d.driver, d.vehicleId, d.gpayName].filter(Boolean).join(' · ') || r.note}
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-400">Raised {r.createdOn} by {r.raisedBy}{r.utr ? ` · UTR ${r.utr}` : ''}</div>
                  </button>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-neutral-900">{r.amountPaise ? rupees(r.amountPaise) : '—'}</div>
                    {r.serviceAt && <div className="text-[10px] text-neutral-400">svc {r.serviceAt.slice(0, 10)}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button onClick={() => setDetail(r)} className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50">Details</button>
                    {r.tourId && (
                      <Link to={`/p/trips?q=${encodeURIComponent(d.tourCode)}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-primary-600 ring-1 ring-inset ring-primary-100 hover:bg-primary-50" title="Open the linked tour">
                        <ExternalLink size={11} /> Tour
                      </Link>
                    )}
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => settle(r, 'rejected')}><X size={13} /> Reject</Button>
                        <Button size="sm" onClick={() => { setPayFor(r); setUtr(''); }}><Check size={13} /> Mark paid</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="py-12 text-center text-sm text-neutral-400">
                {diesel.length === 0
                  ? 'No diesel requests yet — they are raised from the Diesel button on an Amazon route.'
                  : 'Nothing matches this view.'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Full detail */}
      {detail && (() => {
        const d = detailOf(detail, tourFor(detail));
        const rows: [string, string, React.ReactNode][] = [
          ['Tour ID', d.tourCode || '—', <Hash key="h" size={12} />],
          ['VRIDs', d.vrids.join(', ') || '—', <Hash key="v" size={12} />],
          ['Vendor', d.vendorName || '—', <Truck key="ve" size={12} />],
          ['Driver', d.driver || '—', <User key="dr" size={12} />],
          ['Driver number', d.driverNumber || '—', <Phone key="dn" size={12} />],
          ['Vehicle', d.vehicleId || '—', <Truck key="vh" size={12} />],
          ['G-pay name', d.gpayName || '—', <User key="gn" size={12} />],
          ['G-pay number', d.gpayNumber || '—', <Phone key="gp" size={12} />],
          ['Service date', detail.serviceAt ? detail.serviceAt.replace('T', ' ') : '—', <CalendarRange key="sd" size={12} />],
          ['Amount', detail.amountPaise ? rupees(detail.amountPaise) : '—', <IndianRupee key="am" size={12} />],
          ['Raised by', `${detail.raisedBy} · ${detail.createdOn}`, <User key="rb" size={12} />],
          ['Note', detail.note || '—', <Hash key="nt" size={12} />],
          ...(detail.status !== 'pending'
            ? ([
              ['Settled by', detail.resolvedBy || '—', <User key="sb" size={12} />],
              ['Settled on', detail.resolvedAtMs ? new Date(detail.resolvedAtMs).toLocaleString('en-IN') : '—', <Clock key="so" size={12} />],
              ['UTR / reference', detail.utr || '—', <Hash key="ut" size={12} />],
            ] as [string, string, React.ReactNode][])
            : []),
        ];
        return (
          <Modal open onClose={() => setDetail(null)} title="Diesel request"
            subtitle={`${d.tourCode || detail.title} · ${requestStatusLabel(detail)}`}
            submitLabel="Close" onSubmit={() => setDetail(null)} wide>
            <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-neutral-200">
              {rows.map(([k, v, icon], i) => (
                <div key={k} className={`flex items-start gap-3 px-3 py-2 ${i % 2 ? 'bg-white' : 'bg-neutral-50'}`}>
                  <span className="mt-0.5 text-neutral-400">{icon}</span>
                  <span className="w-32 shrink-0 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{k}</span>
                  <span className="min-w-0 flex-1 break-words text-sm font-semibold text-neutral-800">{v}</span>
                </div>
              ))}
            </div>
            {detail.status === 'pending' && (
              <div className="mt-3 flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => settle(detail, 'rejected')}><X size={13} /> Reject</Button>
                <Button size="sm" onClick={() => { setPayFor(detail); setUtr(''); setDetail(null); }}><Check size={13} /> Mark paid</Button>
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Mark paid — records the transfer reference alongside */}
      {payFor && (
        <Modal open onClose={() => setPayFor(null)} title="Mark paid"
          subtitle={`${payFor.tourCode || payFor.title}${payFor.amountPaise ? ` · ${rupees(payFor.amountPaise)}` : ''}`}
          onSubmit={() => settle(payFor, 'approved', utr)} submitLabel="Mark paid">
          <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-100">
            Paying <b>{payFor.gpayName || payFor.title}</b>
            {payFor.gpayNumber ? <> on <b>{payFor.gpayNumber}</b></> : null}. The POC sees it as Paid on the route straight away.
          </p>
          <Field label="UTR / reference" hint="Optional — the bank or UPI reference, so the payout can be traced later">
            <TextInput value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 428815503366" />
          </Field>
        </Modal>
      )}
    </PartnerLayout>
  );
}
