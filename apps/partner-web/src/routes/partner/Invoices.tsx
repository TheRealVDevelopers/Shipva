import { useState } from 'react';
import { Plus, Download, Send, IndianRupee } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { HBar } from '../../components/ui/Charts.js';
import { rupees, isoToLabel, todayFullLabel } from '../../lib/format.js';
import { type InvoiceStatus, type Invoice } from '../../lib/mocks.js';
import { useStore, todayLabel, activeRateCards } from '../../lib/store.js';
import { useNotify } from '../../lib/notify.js';
import { useAuth } from '../../lib/auth.js';
import { roleLabel } from '../../lib/roles.js';
import { printInvoice } from '../../lib/print.js';

const INV_BADGE: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

const EMPTY = {
  client: '', base: '', gstRate: '18', date: '', dueDate: '',
  // Point 9: the rate card the row is priced on, and the MIS fields through
  // to the UTR. Invoice date stays manual, per the client.
  rateCardId: '', runKm: '', extraKm: '', paidOn: '', paidAmount: '', utr: '',
  paymentMode: 'NEFT', tds: '', misNote: '',
};
/** Default credit period — 15 days out, but the user can pick any date. */
const defaultDue = () => isoToLabel(new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10));

export function Invoices() {
  const { invoices, customers, addInvoice, markInvoicePaid } = useStore();
  const { push } = useNotify();
  const { member } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [payUtr, setPayUtr] = useState('');

  /** Mark paid, recording the UTR — "MIS fields up to UTR" — and logging the
   *  change so the MIS row carries its own history. */
  function payInvoice(inv: Invoice, ref: string) {
    const by = member ? `${member.name} · ${roleLabel(member.role)}` : 'Accounts';
    const now = Date.now();
    markInvoicePaid(inv.no, {
      paidOn: todayFullLabel(),
      paidAmountPaise: inv.totalPaise,
      ...(ref.trim() ? { utr: ref.trim() } : {}),
      misUpdates: [
        ...(inv.misUpdates ?? []),
        { atMs: now, by, field: 'Status', from: inv.status, to: 'paid' },
        ...(ref.trim() ? [{ atMs: now, by, field: 'UTR', from: inv.utr ?? '—', to: ref.trim() }] : []),
      ],
    });
    push({ title: 'Payment received', body: `${inv.client} paid ${rupees(inv.totalPaise)} against ${inv.no}.`, tone: 'success' });
    setPayFor(null); setPayUtr('');
  }

  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.totalPaise, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.totalPaise, 0);
  const pending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.totalPaise, 0);
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.totalPaise, 0);
  const gstMtd = invoices.reduce((s, i) => s + i.gstPaise, 0);
  const valid = f.client && Number(f.base) > 0;

  // ── Point 9: selecting a vendor pulls its registered rate-card details ─────
  const vendor = customers.find((c) => c.name === f.client);
  const cards = vendor ? activeRateCards(vendor) : [];
  const card = cards.find((c) => c.id === f.rateCardId) ?? cards[0];

  /**
   * What the chosen card says this month costs: the monthly figure plus any
   * kilometres beyond the card's allowance. Only a suggestion — the base
   * amount stays editable, because a real month has adjustments the card
   * doesn't know about.
   */
  const suggested = (() => {
    if (!card?.monthlyCostPaise) return null;
    const run = Number(f.runKm);
    const allowance = card.avgMonthlyKm ?? 0;
    const over = Number.isFinite(run) && f.runKm && allowance ? Math.max(0, run - allowance) : 0;
    const extra = over * (card.extraKmPaise ?? 0);
    return { base: card.monthlyCostPaise + extra, over };
  })();

  function sendReminder(no: string, client: string, total: number, due: string) {
    const phone = customers.find((c) => c.name === client)?.phone ?? '';
    const digits = phone.replace(/\D/g, '');
    const wa = digits.length === 10 ? `91${digits}` : digits;
    const text = `Dear ${client}, a gentle reminder that invoice ${no} for ${rupees(total)} is due on ${due}. Kindly arrange payment. Thank you.`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    push({ title: 'Reminder sent', body: `WhatsApp reminder opened for ${client} · ${no}.`, tone: 'info' });
  }

  function submit() {
    if (!valid) return;
    const n = (v: string) => (Number(v) > 0 ? Number(v) : undefined);
    const p = (v: string) => (Number(v) > 0 ? Math.round(Number(v) * 100) : undefined);
    addInvoice({
      client: f.client, date: f.date || todayFullLabel(), dueDate: f.dueDate || defaultDue(),
      basePaise: Math.round(Number(f.base) * 100), status: 'pending', gstRate: Number(f.gstRate),
      // Snapshot the rate card the row was priced on — the card may be retired
      // or re-negotiated later, and the invoice must still say what it billed.
      ...(card ? { rateCardId: card.id, rateCardLabel: card.label } : {}),
      ...(card?.vehicleType ? { vehicleType: card.vehicleType } : {}),
      ...(card?.monthlyCostPaise ? { monthlyCostPaise: card.monthlyCostPaise } : {}),
      ...(card?.extraKmPaise ? { extraKmPaise: card.extraKmPaise } : {}),
      ...(n(f.runKm) !== undefined ? { runKm: n(f.runKm)! } : {}),
      ...(suggested?.over ? { extraKm: suggested.over } : {}),
      ...(f.paidOn.trim() ? { paidOn: f.paidOn.trim() } : {}),
      ...(p(f.paidAmount) !== undefined ? { paidAmountPaise: p(f.paidAmount)! } : {}),
      ...(f.utr.trim() ? { utr: f.utr.trim() } : {}),
      ...(f.paymentMode ? { paymentMode: f.paymentMode } : {}),
      ...(p(f.tds) !== undefined ? { tdsPaise: p(f.tds)! } : {}),
      ...(f.misNote.trim() ? { misNote: f.misNote.trim() } : {}),
    });
    setF(EMPTY); setOpen(false);
  }

  return (
    <PartnerLayout title="Vendor Payments" subtitle="GST billing & receivables">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Outstanding" value={rupees(outstanding)} hint="to collect" tone="danger" />
          <KpiCard label="Collected" value={rupees(paid)} hint="received" tone="success" />
          <KpiCard label="Overdue" value={rupees(overdue)} hint="past due date" tone="accent" />
          <KpiCard label="GST · output" value={rupees(gstMtd)} hint="on invoices" tone="primary" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Vendor Payments" subtitle="GST-compliant, per trip/client" action={<Button size="sm" onClick={() => { setF({ ...EMPTY, date: todayFullLabel(), dueDate: defaultDue() }); setOpen(true); }}><Plus size={13} /> Add MIS</Button>} />
            <Table>
              <THead>
                <Tr>
                  <Th>Invoice</Th><Th>Client</Th><Th>Dates</Th>
                  <Th className="text-right">Base</Th><Th className="text-right">GST</Th><Th className="text-right">Total</Th>
                  <Th>Status</Th><Th></Th>
                </Tr>
              </THead>
              <TBody>
                {invoices.map((i) => (
                  <Tr key={i.no}>
                    <Td className="font-mono text-xs font-bold text-neutral-900">
                      {i.no}
                      {i.utr && <div className="font-sans text-[10px] font-semibold text-emerald-600" title="UTR">UTR {i.utr}</div>}
                    </Td>
                    <Td className="font-semibold text-neutral-800">
                      {i.client}
                      {i.rateCardLabel && <div className="text-[10px] font-medium text-neutral-400">{i.rateCardLabel}{i.extraKm ? ` · +${i.extraKm} km` : ''}</div>}
                    </Td>
                    <Td className="text-[11px] text-neutral-500">{i.date}<div className="text-neutral-400">due {i.dueDate}</div></Td>
                    <Td className="text-right text-neutral-600">{rupees(i.basePaise)}</Td>
                    <Td className="text-right text-neutral-600">{rupees(i.gstPaise)}</Td>
                    <Td className="text-right font-bold text-neutral-900">{rupees(i.totalPaise)}</Td>
                    <Td><Badge tone={INV_BADGE[i.status].tone}>{INV_BADGE[i.status].label}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <button onClick={() => printInvoice(i)} className="hover:text-primary-600" title="Download PDF"><Download size={14} /></button>
                        {i.status !== 'paid' && (
                          <>
                            <button onClick={() => sendReminder(i.no, i.client, i.totalPaise, i.dueDate)} className="hover:text-primary-600" title="Send WhatsApp reminder"><Send size={14} /></button>
                            <button onClick={() => { setPayFor(i); setPayUtr(i.utr ?? ''); }} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">Mark paid</button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card>
            <CardHeader title="Receivables" subtitle="Outstanding by status" />
            <CardBody className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700">Not yet due</span>
                  <span className="font-bold text-neutral-900">{rupees(pending)}</span>
                </div>
                <div className="mt-1"><HBar value={pending} max={outstanding || 1} color="#f59e0b" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700">Overdue</span>
                  <span className="font-bold text-neutral-900">{rupees(overdue)}</span>
                </div>
                <div className="mt-1"><HBar value={overdue} max={outstanding || 1} color="#f43f5e" /></div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                <span className="font-semibold text-neutral-700">Total outstanding</span>
                <span className="font-extrabold text-neutral-900">{rupees(outstanding)}</span>
              </div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-inset ring-emerald-100">
                Collected so far: {rupees(paid)}. Send reminders on overdue invoices to speed up collection.
              </div>
            </CardBody>
          </Card>
        </section>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add MIS" subtitle="GST is auto-calculated" onSubmit={submit} submitLabel="Add MIS" submitDisabled={!valid}>
        <Field label="Transporter" required hint="Their registered rate card is pulled in automatically">
          <Select value={f.client} onChange={(e) => setF({ ...f, client: e.target.value, rateCardId: '' })}>
            <option value="">Select transporter</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>

        {/* Point 9: the vendor's registered rate cards, and what they imply. */}
        {vendor && (
          <>
            <Field label="Rate card" hint={cards.length > 1 ? `${cards.length} cards on record — pick the one this month is billed on` : 'From the transporter’s record'}>
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
                {!card.signedImg && (
                  <p className="mt-1 font-bold text-amber-700">No signed copy of this card on file — chase it in the transporter's documents.</p>
                )}
              </div>
            )}
            <Row>
              <Field label="KM run this month" hint="Drives the extra-km charge">
                <TextInput type="number" value={f.runKm} onChange={(e) => setF({ ...f, runKm: e.target.value })} placeholder={card?.avgMonthlyKm ? String(card.avgMonthlyKm) : '6000'} />
              </Field>
              <Field label="Extra km" hint="auto">
                <TextInput value={suggested ? String(suggested.over) : '—'} disabled />
              </Field>
            </Row>
            {suggested && suggested.base > 0 && Math.round(Number(f.base) * 100) !== suggested.base && (
              <button type="button" onClick={() => setF({ ...f, base: String(suggested.base / 100) })}
                className="w-full rounded-lg bg-primary-50 px-3 py-2 text-left text-[11px] font-bold text-primary-800 ring-1 ring-inset ring-primary-100 hover:bg-primary-100">
                Rate card says <b>{rupees(suggested.base)}</b>{suggested.over ? ` (incl. ${suggested.over} extra km)` : ''} — tap to use it
              </button>
            )}
          </>
        )}
        <Row>
          <Field label="Invoice date" required><DateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} /></Field>
          <Field label="Due date" required hint="Defaults to 15 days"><DateInput value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} /></Field>
        </Row>
        <Row>
          <Field label="Base amount (₹)"><TextInput type="number" value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} placeholder="52000" /></Field>
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

        {/* Settlement — "MIS fields up to UTR". Left blank until it's paid. */}
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

      {/* Mark paid — captures the UTR and logs the change onto the MIS row */}
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
              <div className="space-y-1">
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
