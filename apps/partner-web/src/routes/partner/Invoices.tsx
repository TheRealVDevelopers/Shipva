import { useMemo, useState } from 'react';
import {
  Plus, Download, Send, IndianRupee, Mail, CheckCircle2, AlertTriangle, Pencil, FileUp, Clock,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { DocumentUpload } from '../../components/ui/DocumentUpload.js';
import { HBar } from '../../components/ui/Charts.js';
import { rupees, isoToLabel, todayFullLabel } from '../../lib/format.js';
import { type InvoiceStatus, type Invoice } from '../../lib/mocks.js';
import { useStore, activeRateCards } from '../../lib/store.js';
import {
  countTrips, dieselAdvanced, misSummary, cycleStage, canRaiseInvoice,
  vendorTotals, monthlySummary,
} from '../../lib/vendorMis.js';
import { useNotify } from '../../lib/notify.js';
import { useAuth } from '../../lib/auth.js';
import { roleLabel } from '../../lib/roles.js';
import { printInvoice } from '../../lib/print.js';

const INV_BADGE: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

const EMPTY = {
  client: '', base: '', gstRate: '18', date: '', dueDate: '',
  rateCardId: '', runKm: '', paidOn: '', paidAmount: '', utr: '',
  paymentMode: 'NEFT', tds: '', misNote: '',
  // Billing window, vehicle and the charges a rate card can't know about.
  periodFrom: '', periodTo: '', vehicleReg: '',
  tripCount: '', toll: '', other: '', otherNote: '',
  processedBy: '', invoiceUrl: '' as string | undefined,
};
type Form = typeof EMPTY;

const defaultDue = () => isoToLabel(new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10));
const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export function Invoices() {
  const {
    invoices, customers, trucks, tours, trips, requests,
    addInvoice, markInvoicePaid, updateInvoice,
  } = useStore();
  const { push } = useNotify();
  const { member } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  /** The row being edited — a draft resumed, or a disputed MIS corrected. */
  const [editNo, setEditNo] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [payUtr, setPayUtr] = useState('');
  const [disputeFor, setDisputeFor] = useState<Invoice | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [uploadFor, setUploadFor] = useState<Invoice | null>(null);

  const by = () => (member ? `${member.name} · ${roleLabel(member.role)}` : 'Accounts');

  // ── The MIS figures ────────────────────────────────────────────────────────
  const vendor = customers.find((c) => c.name === f.client);
  const cards = vendor ? activeRateCards(vendor) : [];
  const card = cards.find((c) => c.id === f.rateCardId) ?? cards[0];

  /** Runs this vendor did in the window — tours and trips together. */
  const autoTrips = useMemo(() => {
    if (!f.client) return 0;
    const runs = [
      ...tours.map((t) => ({ vendorName: t.vendorName, date: t.serviceAt || t.date, vehicleId: t.vehicleId })),
      ...trips.map((t) => ({ vendorName: (t as { vendorName?: string }).vendorName, date: (t as { date?: string }).date, vehicleId: (t as { vehicleId?: string }).vehicleId })),
    ];
    return countTrips(runs, f.client, f.periodFrom, f.periodTo, f.vehicleReg);
  }, [tours, trips, f.client, f.periodFrom, f.periodTo, f.vehicleReg]);

  /** Diesel already advanced in the window — deducted from the payable. */
  const advance = useMemo(
    () => dieselAdvanced(requests, f.client, f.periodFrom, f.periodTo, f.vehicleReg),
    [requests, f.client, f.periodFrom, f.periodTo, f.vehicleReg]);

  const paise = (v: string) => (Number(v) > 0 ? Math.round(Number(v) * 100) : 0);
  const summary = misSummary({
    monthlyCostPaise: card?.monthlyCostPaise,
    extraKmPaise: card?.extraKmPaise,
    allowanceKm: card?.avgMonthlyKm,
    runKm: Number(f.runKm) || 0,
    tollPaise: paise(f.toll),
    otherChargesPaise: paise(f.other),
    dieselAdvancePaise: advance,
  });

  /** Trips billed — the auto count unless the accountant has overridden it. */
  const billedTrips = f.tripCount.trim() ? Number(f.tripCount) : autoTrips;
  const valid = !!f.client && Number(f.base) > 0;

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const totals = vendorTotals(invoices);
  const months = monthlySummary(invoices).slice(0, 6);
  const maxMonth = Math.max(1, ...months.map((m) => m.paise));
  const outstanding = totals.pending + totals.processing + totals.overdue;

  function fillFrom(inv: Invoice) {
    setF({
      client: inv.client, base: String(inv.basePaise / 100), gstRate: '18',
      date: inv.date, dueDate: inv.dueDate,
      rateCardId: inv.rateCardId ?? '', runKm: inv.runKm ? String(inv.runKm) : '',
      paidOn: inv.paidOn ?? '', paidAmount: inv.paidAmountPaise ? String(inv.paidAmountPaise / 100) : '',
      utr: inv.utr ?? '', paymentMode: inv.paymentMode ?? 'NEFT',
      tds: inv.tdsPaise ? String(inv.tdsPaise / 100) : '', misNote: inv.misNote ?? '',
      periodFrom: inv.periodFrom ?? '', periodTo: inv.periodTo ?? '', vehicleReg: inv.vehicleReg ?? '',
      tripCount: inv.tripCount ? String(inv.tripCount) : '',
      toll: inv.tollPaise ? String(inv.tollPaise / 100) : '',
      other: inv.otherChargesPaise ? String(inv.otherChargesPaise / 100) : '',
      otherNote: inv.otherChargesNote ?? '',
      processedBy: inv.processedBy ?? '', invoiceUrl: inv.invoiceUrl,
    });
    setEditNo(inv.no);
    setOpen(true);
  }

  /** Everything the form collected, as an Invoice patch. Shared by save-draft,
   *  create and re-save, so the three can never drift apart. */
  function collect(status: InvoiceStatus) {
    const n = (v: string) => (Number(v) > 0 ? Number(v) : undefined);
    const p = (v: string) => (Number(v) > 0 ? Math.round(Number(v) * 100) : undefined);
    return {
      client: f.client,
      date: f.date || todayFullLabel(),
      dueDate: f.dueDate || defaultDue(),
      basePaise: Math.round(Number(f.base) * 100),
      status,
      ...(card ? { rateCardId: card.id, rateCardLabel: card.label } : {}),
      ...(card?.vehicleType ? { vehicleType: card.vehicleType } : {}),
      ...(card?.monthlyCostPaise ? { monthlyCostPaise: card.monthlyCostPaise } : {}),
      ...(card?.extraKmPaise ? { extraKmPaise: card.extraKmPaise } : {}),
      ...(n(f.runKm) !== undefined ? { runKm: n(f.runKm)! } : {}),
      ...(summary.extraKm ? { extraKm: summary.extraKm } : {}),
      ...(f.periodFrom ? { periodFrom: f.periodFrom } : {}),
      ...(f.periodTo ? { periodTo: f.periodTo } : {}),
      ...(f.vehicleReg ? { vehicleReg: f.vehicleReg } : {}),
      ...(billedTrips ? { tripCount: billedTrips } : {}),
      ...(autoTrips ? { tripCountAuto: autoTrips } : {}),
      ...(p(f.toll) !== undefined ? { tollPaise: p(f.toll)! } : {}),
      ...(p(f.other) !== undefined ? { otherChargesPaise: p(f.other)! } : {}),
      ...(f.otherNote.trim() ? { otherChargesNote: f.otherNote.trim() } : {}),
      ...(advance ? { dieselAdvancePaise: advance } : {}),
      ...(f.processedBy.trim() ? { processedBy: f.processedBy.trim() } : {}),
      ...(f.invoiceUrl ? { invoiceUrl: f.invoiceUrl } : {}),
      ...(f.paidOn.trim() ? { paidOn: f.paidOn.trim() } : {}),
      ...(p(f.paidAmount) !== undefined ? { paidAmountPaise: p(f.paidAmount)! } : {}),
      ...(f.utr.trim() ? { utr: f.utr.trim() } : {}),
      ...(f.paymentMode ? { paymentMode: f.paymentMode } : {}),
      ...(p(f.tds) !== undefined ? { tdsPaise: p(f.tds)! } : {}),
      ...(f.misNote.trim() ? { misNote: f.misNote.trim() } : {}),
    };
  }

  function save(status: InvoiceStatus) {
    if (status !== 'draft' && !valid) return;
    if (editNo) {
      // Re-saving a draft or a corrected MIS. A correction after a dispute
      // clears the dispute so it can go back out for agreement.
      updateInvoice(editNo, {
        ...collect(status),
        ...(status !== 'draft' ? { disputeOn: '', disputeNote: '' } : {}),
        misUpdates: [
          ...(invoices.find((i) => i.no === editNo)?.misUpdates ?? []),
          { atMs: Date.now(), by: by(), field: 'MIS', from: 'edited', to: status },
        ],
      });
      push({ title: status === 'draft' ? 'Draft saved' : 'MIS updated', body: `${f.client} · ${editNo}`, tone: 'success' });
    } else {
      addInvoice({ ...collect(status), gstRate: Number(f.gstRate) });
      push({ title: status === 'draft' ? 'Draft saved' : 'MIS created', body: f.client, tone: 'success' });
    }
    setF(EMPTY); setEditNo(null); setOpen(false);
  }

  /** Send the MIS to the vendor by email, and record that it went. */
  function emailVendor(i: Invoice) {
    const v = customers.find((c) => c.name === i.client);
    const period = i.periodFrom || i.periodTo ? `${i.periodFrom || '—'} to ${i.periodTo || '—'}` : i.date;
    const lines = [
      `Dear ${v?.contactName || i.client},`, '',
      `Please find the payment MIS for ${period}.`, '',
      `Vehicle: ${i.vehicleReg || '—'}`,
      `Trips: ${i.tripCount ?? '—'}`,
      `Monthly package: ${rupees(i.monthlyCostPaise ?? 0)}`,
      `Extra km: ${i.extraKm ?? 0}`,
      `Toll: ${rupees(i.tollPaise ?? 0)}`,
      `Other charges: ${rupees(i.otherChargesPaise ?? 0)}`,
      `Less diesel advance: ${rupees(i.dieselAdvancePaise ?? 0)}`,
      `Amount payable: ${rupees(i.totalPaise)}`, '',
      'Kindly confirm within 3 working days. If we do not hear from you we will treat it as agreed and raise the invoice.',
      '', 'Regards,', 'Sarva Express — Accounts',
    ].join('\n');
    const url = `mailto:${encodeURIComponent(v?.email ?? '')}?subject=${encodeURIComponent(`Payment MIS · ${i.client} · ${period}`)}&body=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    updateInvoice(i.no, {
      sentToVendorOn: todayFullLabel(),
      misUpdates: [...(i.misUpdates ?? []), { atMs: Date.now(), by: by(), field: 'Sent to vendor', from: '—', to: todayFullLabel() }],
    });
    push({ title: 'MIS sent', body: `Email opened for ${i.client}.`, tone: 'info' });
  }

  function markNoDispute(i: Invoice) {
    updateInvoice(i.no, {
      noDisputeOn: todayFullLabel(), disputeOn: '', disputeNote: '',
      misUpdates: [...(i.misUpdates ?? []), { atMs: Date.now(), by: by(), field: 'Vendor agreement', from: 'awaiting', to: 'no dispute' }],
    });
    push({ title: 'Marked agreed', body: `${i.client} raised no dispute — you can raise the invoice.`, tone: 'success' });
  }

  function raiseDispute(i: Invoice, note: string) {
    updateInvoice(i.no, {
      disputeOn: todayFullLabel(), disputeNote: note.trim(), noDisputeOn: '',
      misUpdates: [...(i.misUpdates ?? []), { atMs: Date.now(), by: by(), field: 'Dispute', from: '—', to: note.trim() || 'raised' }],
    });
    push({ title: 'Dispute recorded', body: `Edit the MIS and send it again to ${i.client}.`, tone: 'warning' });
    setDisputeFor(null); setDisputeNote('');
  }

  function setStatus(i: Invoice, status: InvoiceStatus) {
    updateInvoice(i.no, {
      status,
      misUpdates: [...(i.misUpdates ?? []), { atMs: Date.now(), by: by(), field: 'Status', from: i.status, to: status }],
    });
    push({ title: `Marked ${status}`, body: `${i.client} · ${i.no}`, tone: 'info' });
  }

  function payInvoice(inv: Invoice, ref: string) {
    const now = Date.now();
    markInvoicePaid(inv.no, {
      paidOn: todayFullLabel(),
      paidAmountPaise: inv.totalPaise,
      ...(ref.trim() ? { utr: ref.trim() } : {}),
      misUpdates: [
        ...(inv.misUpdates ?? []),
        { atMs: now, by: by(), field: 'Status', from: inv.status, to: 'paid' },
        ...(ref.trim() ? [{ atMs: now, by: by(), field: 'UTR', from: inv.utr ?? '—', to: ref.trim() }] : []),
      ],
    });
    push({ title: 'Payment recorded', body: `${rupees(inv.totalPaise)} paid to ${inv.client}.`, tone: 'success' });
    setPayFor(null); setPayUtr('');
  }

  return (
    <PartnerLayout title="Vendor Payments" subtitle="Vendor payment MIS, agreement & settlement">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total vendor expenses" value={rupees(totals.total)} hint="all raised MIS" tone="primary" />
          <KpiCard label="Pending" value={rupees(totals.pending + totals.overdue)} hint="awaiting payment" tone="danger" />
          <KpiCard label="Processing" value={rupees(totals.processing)} hint="payment in progress" tone="accent" />
          <KpiCard label="Paid" value={rupees(totals.paid)} hint="settled" tone="success" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Vendor payment MIS" subtitle="Per transporter, per vehicle, per period"
              action={<Button size="sm" onClick={() => { setEditNo(null); setF({ ...EMPTY, date: todayFullLabel(), dueDate: defaultDue() }); setOpen(true); }}><Plus size={13} /> New MIS</Button>} />
            <Table>
              <THead>
                <Tr>
                  <Th>MIS</Th><Th>Transporter</Th><Th>Period</Th>
                  <Th className="text-right">Trips</Th><Th className="text-right">Payable</Th>
                  <Th>Vendor</Th><Th>Status</Th><Th></Th>
                </Tr>
              </THead>
              <TBody>
                {invoices.map((i) => (
                  <Tr key={i.no}>
                    <Td className="font-mono text-xs font-bold text-neutral-900">
                      {i.no}
                      {i.utr && <div className="font-sans text-[10px] font-semibold text-emerald-600" title="UTR">UTR {i.utr}</div>}
                      {i.invoiceUrl && <a href={i.invoiceUrl} target="_blank" rel="noreferrer" className="block font-sans text-[10px] font-semibold text-primary-600">Invoice ↗</a>}
                    </Td>
                    <Td className="font-semibold text-neutral-800">
                      {i.client}
                      <div className="text-[10px] font-medium text-neutral-400">
                        {[i.vehicleReg, i.rateCardLabel].filter(Boolean).join(' · ') || '—'}
                        {i.extraKm ? ` · +${i.extraKm} km` : ''}
                      </div>
                    </Td>
                    <Td className="text-[11px] text-neutral-500">
                      {i.periodFrom || i.periodTo ? <>{i.periodFrom || '—'}<div className="text-neutral-400">to {i.periodTo || '—'}</div></> : <>{i.date}<div className="text-neutral-400">due {i.dueDate}</div></>}
                    </Td>
                    <Td className="text-right text-neutral-600">
                      {i.tripCount ?? '—'}
                      {i.tripCountAuto !== undefined && i.tripCount !== undefined && i.tripCount !== i.tripCountAuto && (
                        <div className="text-[10px] text-amber-600" title={`System counted ${i.tripCountAuto}`}>overridden</div>
                      )}
                    </Td>
                    <Td className="text-right font-bold text-neutral-900">
                      {rupees(i.totalPaise)}
                      {!!i.dieselAdvancePaise && <div className="text-[10px] font-medium text-neutral-400">less {rupees(i.dieselAdvancePaise)} diesel</div>}
                    </Td>
                    <Td>
                      <span className={`text-[11px] font-bold ${i.disputeOn && !i.noDisputeOn ? 'text-rose-600' : i.noDisputeOn ? 'text-emerald-600' : 'text-neutral-500'}`}>
                        {cycleStage(i)}
                      </span>
                      {i.disputeNote && <div className="text-[10px] text-rose-500">{i.disputeNote}</div>}
                    </Td>
                    <Td><Badge tone={INV_BADGE[i.status].tone}>{INV_BADGE[i.status].label}</Badge></Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-1.5 text-neutral-400">
                        <button onClick={() => fillFrom(i)} className="hover:text-primary-600" title="Edit / resume draft"><Pencil size={14} /></button>
                        <button onClick={() => printInvoice(i)} className="hover:text-primary-600" title="Download PDF"><Download size={14} /></button>
                        <button onClick={() => emailVendor(i)} className="hover:text-primary-600" title="Send MIS to vendor by email"><Mail size={14} /></button>
                        <button onClick={() => setUploadFor(i)} className="hover:text-primary-600" title="Upload the vendor's invoice"><FileUp size={14} /></button>
                        {!i.noDisputeOn && (
                          <>
                            <button onClick={() => markNoDispute(i)} className="text-emerald-600 hover:text-emerald-700" title="Vendor raised no dispute"><CheckCircle2 size={14} /></button>
                            <button onClick={() => { setDisputeFor(i); setDisputeNote(i.disputeNote ?? ''); }} className="text-amber-600 hover:text-amber-700" title="Vendor disputed this MIS"><AlertTriangle size={14} /></button>
                          </>
                        )}
                        {i.status !== 'paid' && i.status !== 'processing' && canRaiseInvoice(i) && (
                          <button onClick={() => setStatus(i, 'processing')} className="text-[11px] font-bold text-sky-600 hover:text-sky-700" title="Payment in progress"><Clock size={12} /></button>
                        )}
                        {i.status !== 'paid' && (
                          <>
                            <button onClick={() => emailVendor(i)} className="hover:text-primary-600" title="Resend"><Send size={14} /></button>
                            <button onClick={() => { setPayFor(i); setPayUtr(i.utr ?? ''); }} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">Mark paid</button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-sm text-neutral-400">No vendor MIS yet — press "New MIS".</td></tr>
                )}
              </TBody>
            </Table>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Payment status" subtitle="What we owe vendors" />
              <CardBody className="space-y-3">
                {([['Pending', totals.pending, '#f59e0b'], ['Processing', totals.processing, '#0ea5e9'], ['Overdue', totals.overdue, '#f43f5e']] as const).map(([label, v, color]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-700">{label}</span>
                      <span className="font-bold text-neutral-900">{rupees(v)}</span>
                    </div>
                    <div className="mt-1"><HBar value={v} max={outstanding || 1} color={color} /></div>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                  <span className="font-semibold text-neutral-700">Total outstanding</span>
                  <span className="font-extrabold text-neutral-900">{rupees(outstanding)}</span>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-inset ring-emerald-100">
                  Paid so far: {rupees(totals.paid)}.
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Monthly summary" subtitle="Vendor spend by month" />
              <CardBody className="space-y-2.5">
                {months.length === 0 && <p className="text-[11px] text-neutral-400">Nothing to summarise yet.</p>}
                {months.map((m) => (
                  <div key={m.month}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-700">{monthLabel(m.month)}<span className="ml-1 text-neutral-400">· {m.count}</span></span>
                      <span className="font-bold text-neutral-900">{rupees(m.paise)}</span>
                    </div>
                    <div className="mt-1"><HBar value={m.paise} max={maxMonth} color="#0F3D72" /></div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </section>
      </div>

      {/* ── The MIS form ─────────────────────────────────────────────────── */}
      <Modal open={open} onClose={() => { setOpen(false); setEditNo(null); }}
        title={editNo ? `Edit MIS · ${editNo}` : 'New vendor payment MIS'}
        subtitle="Figures are pulled from the rate card, the runs and the diesel requests"
        onSubmit={() => save('pending')} submitLabel={editNo ? 'Save MIS' : 'Create MIS'} submitDisabled={!valid}
        secondaryLabel="Save as draft" onSecondary={() => save('draft')} wide>

        <Field label="Transporter" required hint="Their registered rate card is pulled in automatically">
          <Select value={f.client} onChange={(e) => setF({ ...f, client: e.target.value, rateCardId: '' })}>
            <option value="">Select transporter</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>

        <Row>
          <Field label="Period from" hint="Drives trips, km and the diesel pull">
            <DateInput value={f.periodFrom} onChange={(v) => setF({ ...f, periodFrom: v })} />
          </Field>
          <Field label="Period to"><DateInput value={f.periodTo} onChange={(v) => setF({ ...f, periodTo: v })} /></Field>
        </Row>

        <Field label="Vehicle" hint="Leave blank to bill every vehicle this vendor ran">
          <Select value={f.vehicleReg} onChange={(e) => setF({ ...f, vehicleReg: e.target.value })}>
            <option value="">All vehicles</option>
            {trucks.map((t) => <option key={t.id} value={t.reg}>{t.reg}{t.type ? ` · ${t.type}` : ''}</option>)}
          </Select>
        </Field>

        {vendor && (
          <>
            <Field label="Rate card" hint={cards.length > 1 ? `${cards.length} cards on record — pick the one this period is billed on` : 'From the transporter’s record'}>
              <Select value={card?.id ?? ''} onChange={(e) => setF({ ...f, rateCardId: e.target.value })}>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}{c.monthlyCostPaise ? ` · ${rupees(c.monthlyCostPaise)}/mo` : ''}{c.signedImg ? '' : ' · unsigned'}
                  </option>
                ))}
              </Select>
            </Field>
            {card && (
              <div className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11px] ring-1 ring-inset ring-neutral-200">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-500">
                  <span>Monthly <b className="text-neutral-800">{card.monthlyCostPaise ? rupees(card.monthlyCostPaise) : '—'}</b></span>
                  <span>Extra km <b className="text-neutral-800">{card.extraKmPaise ? rupees(card.extraKmPaise) : '—'}</b></span>
                  <span>Allowance <b className="text-neutral-800">{card.avgMonthlyKm ? `${card.avgMonthlyKm} km` : '—'}</b></span>
                  {card.vehicleType && <span>Vehicle <b className="text-neutral-800">{card.vehicleType.replaceAll('_', ' ')}</b></span>}
                </div>
                {!card.signedImg && <p className="mt-1 font-bold text-amber-700">No signed copy of this card on file — chase it in the transporter's documents.</p>}
              </div>
            )}
            <Row>
              <Field label="Trips in period" hint={`System counted ${autoTrips} — type to override`}>
                <TextInput type="number" value={f.tripCount} onChange={(e) => setF({ ...f, tripCount: e.target.value })} placeholder={String(autoTrips)} />
              </Field>
              <Field label="KM run this period" hint="Drives the extra-km charge">
                <TextInput type="number" value={f.runKm} onChange={(e) => setF({ ...f, runKm: e.target.value })} placeholder={card?.avgMonthlyKm ? String(card.avgMonthlyKm) : '6000'} />
              </Field>
            </Row>
            <Row>
              <Field label="Toll (₹)" hint="Keyed in — the card can't know it">
                <TextInput type="number" value={f.toll} onChange={(e) => setF({ ...f, toll: e.target.value })} placeholder="0" />
              </Field>
              <Field label="Other charges (₹)">
                <TextInput type="number" value={f.other} onChange={(e) => setF({ ...f, other: e.target.value })} placeholder="0" />
              </Field>
            </Row>
            {Number(f.other) > 0 && (
              <Field label="What are the other charges for?">
                <TextInput value={f.otherNote} onChange={(e) => setF({ ...f, otherNote: e.target.value })} placeholder="e.g. detention, loading" />
              </Field>
            )}

            {/* Payment summary — auto-calculated, the client's own words. */}
            <div className="rounded-xl bg-neutral-50 p-3 text-[11px] ring-1 ring-inset ring-neutral-200">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Payment summary</div>
              {([
                ['Monthly package', summary.monthlyPaise],
                [`Extra km (${summary.extraKm})`, summary.extraKmPaise],
                ['Toll', summary.tollPaise],
                ['Other charges', summary.otherPaise],
              ] as const).map(([label, v]) => (
                <div key={label} className="flex justify-between py-0.5 text-neutral-600"><span>{label}</span><span>{rupees(v)}</span></div>
              ))}
              <div className="flex justify-between border-t border-neutral-200 py-1 font-bold text-neutral-800"><span>Gross</span><span>{rupees(summary.grossPaise)}</span></div>
              <div className="flex justify-between py-0.5 text-rose-600"><span>Less diesel advance {advance ? '(from fuel requests)' : ''}</span><span>− {rupees(summary.dieselAdvancePaise)}</span></div>
              <div className="flex justify-between border-t border-neutral-200 pt-1 text-sm font-extrabold text-neutral-900"><span>Net payable</span><span>{rupees(summary.netPaise)}</span></div>
              {summary.netPaise > 0 && Math.round(Number(f.base) * 100) !== summary.netPaise && (
                <button type="button" onClick={() => setF({ ...f, base: String(summary.netPaise / 100) })}
                  className="mt-2 w-full rounded-lg bg-primary-50 px-3 py-2 text-left font-bold text-primary-800 ring-1 ring-inset ring-primary-100 hover:bg-primary-100">
                  Use {rupees(summary.netPaise)} as the billed amount
                </button>
              )}
            </div>
          </>
        )}

        <Row>
          <Field label="Invoice date" required><DateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} /></Field>
          <Field label="Payment due date" required hint="Defaults to 15 days — reminders fire from here">
            <DateInput value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} />
          </Field>
        </Row>
        <Row>
          <Field label="Billed amount (₹)" required><TextInput type="number" value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} placeholder="52000" /></Field>
          <Field label="GST rate">
            <Select value={f.gstRate} onChange={(e) => setF({ ...f, gstRate: e.target.value })}>
              <option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
            </Select>
          </Field>
        </Row>
        {Number(f.base) > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm ring-1 ring-inset ring-neutral-200">
            <span className="flex items-center gap-1 text-neutral-600"><IndianRupee size={13} /> Total incl. GST</span>
            <span className="font-extrabold text-neutral-900">{rupees(Math.round(Number(f.base) * 100 * (1 + Number(f.gstRate) / 100)))}</span>
          </div>
        )}

        <Row>
          <Field label="Processed by" hint="Who in Accounts handled it">
            <TextInput value={f.processedBy} onChange={(e) => setF({ ...f, processedBy: e.target.value })} placeholder={member?.name ?? 'Accounts'} />
          </Field>
          <Field label="Vendor's invoice">
            <DocumentUpload value={f.invoiceUrl} onChange={(url) => setF({ ...f, invoiceUrl: url })}
              label="Upload invoice" path={`documents/vendor-invoices/${(f.client || 'vendor').replace(/\W+/g, '-').toLowerCase()}`} />
          </Field>
        </Row>

        <div className="border-t border-neutral-100 pt-3">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Settlement — fill in when it's paid</div>
          <Row>
            <Field label="Paid on"><DateInput value={f.paidOn} onChange={(v) => setF({ ...f, paidOn: v })} /></Field>
            <Field label="Amount paid (₹)"><TextInput type="number" value={f.paidAmount} onChange={(e) => setF({ ...f, paidAmount: e.target.value })} placeholder="52000" /></Field>
          </Row>
          <Row>
            <Field label="Payment mode">
              <Select value={f.paymentMode} onChange={(e) => setF({ ...f, paymentMode: e.target.value })}>
                {['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash'].map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="TDS deducted (₹)"><TextInput type="number" value={f.tds} onChange={(e) => setF({ ...f, tds: e.target.value })} placeholder="0" /></Field>
          </Row>
          <Field label="UTR / transaction reference" hint="The bank reference this payout can be traced by">
            <TextInput value={f.utr} onChange={(e) => setF({ ...f, utr: e.target.value })} placeholder="e.g. CNRB24081512345678" className="font-mono" />
          </Field>
          <Field label="MIS note"><TextInput value={f.misNote} onChange={(e) => setF({ ...f, misNote: e.target.value })} placeholder="Anything the ledger should carry" /></Field>
        </div>
      </Modal>

      {/* Vendor disputed the MIS */}
      {disputeFor && (
        <Modal open onClose={() => setDisputeFor(null)} title={`Dispute · ${disputeFor.client}`}
          subtitle="Record what they disagreed with, then edit the MIS and send it again"
          onSubmit={() => raiseDispute(disputeFor, disputeNote)} submitLabel="Record dispute">
          <Field label="What is disputed?">
            <TextInput value={disputeNote} onChange={(e) => setDisputeNote(e.target.value)} placeholder="e.g. trip count is 22, not 24" autoFocus />
          </Field>
        </Modal>
      )}

      {/* Upload the vendor's invoice against an existing MIS */}
      {uploadFor && (
        <Modal open onClose={() => setUploadFor(null)} title={`Invoice · ${uploadFor.client}`}
          subtitle={uploadFor.no} onSubmit={() => setUploadFor(null)} submitLabel="Done">
          <Field label="Vendor's invoice" hint="PDF or photo">
            <DocumentUpload value={uploadFor.invoiceUrl}
              onChange={(url) => {
                updateInvoice(uploadFor.no, {
                  invoiceUrl: url ?? '',
                  misUpdates: [...(uploadFor.misUpdates ?? []), { atMs: Date.now(), by: by(), field: 'Invoice', from: '—', to: url ? 'uploaded' : 'removed' }],
                });
                setUploadFor({ ...uploadFor, ...(url ? { invoiceUrl: url } : {}) });
              }}
              label="Upload invoice" path={`documents/vendor-invoices/${uploadFor.no}`} />
          </Field>
        </Modal>
      )}

      {/* Mark paid */}
      {payFor && (
        <Modal open onClose={() => setPayFor(null)} title="Mark paid"
          subtitle={`${payFor.client} · ${payFor.no} · ${rupees(payFor.totalPaise)}`}
          onSubmit={() => payInvoice(payFor, payUtr)} submitLabel="Mark paid">
          <Field label="UTR / transaction reference" hint="Optional, but it's how a payout is traced later">
            <TextInput value={payUtr} onChange={(e) => setPayUtr(e.target.value)} placeholder="e.g. CNRB24081512345678" className="font-mono" autoFocus />
          </Field>
          {(payFor.misUpdates?.length ?? 0) > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">MIS history</div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {payFor.misUpdates?.map((u, i) => (
                  <div key={i} className="text-[11px] text-neutral-500">
                    <b className="text-neutral-700">{u.field}</b> {u.from} → {u.to} · {u.by} · {new Date(u.atMs).toLocaleString('en-IN')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </PartnerLayout>
  );
}
