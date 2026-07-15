import { useState } from 'react';
import { Plus, Fuel, AlertTriangle, CheckCircle2, Receipt, Inbox, Check, X, Clock, HandCoins } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { Donut } from '../../components/ui/Charts.js';
import { rupees, todayFullLabel } from '../../lib/format.js';
import { useStore, todayLabel } from '../../lib/store.js';
import { roleLabel } from '../../lib/roles.js';
import { useAuth } from '../../lib/auth.js';
import { useNotify } from '../../lib/notify.js';

const TABS = ['Expenses', 'Fuel log'] as const;
const MILEAGE_KMPL = 4; // typical loaded truck; used for the expected-fuel calc
const KNOWN_SEGMENTS = ['Toll', 'RTO/Police', 'Loading', 'Repairs', 'Misc'];

const OTHER = '__other__';
type Scope = 'Trip' | 'Office' | 'General';
// Dates default to today but are pickable — an expense or a fuel bill is often
// entered a day or two after it was actually incurred.
const EXP_EMPTY = { date: '', scope: 'Trip' as Scope, tripLr: '', category: 'Toll', newCat: '', amount: '', note: '' };
const FUEL_EMPTY = { date: '', reg: '', km: '', litres: '', rate: '92' };
const REQ_EMPTY = { kind: 'expense' as 'expense' | 'advance' | 'trip' | 'other', title: '', amount: '', tripLr: '', note: '' };

export function Expenses() {
  const { expenses, fuelLogs, trucks, trips, expenseCategories, requests, addExpense, addFuelLog, addExpenseCategory, addRequest, resolveRequest } = useStore();
  const { member } = useAuth();
  const { push } = useNotify();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Expenses');
  const [open, setOpen] = useState<null | 'expense' | 'fuel' | 'request'>(null);
  const [e, setE] = useState(EXP_EMPTY);
  const [g, setG] = useState(FUEL_EMPTY);
  const [r, setR] = useState(REQ_EMPTY);

  const expTotal = expenses.reduce((s, x) => s + x.amountPaise, 0);
  const fuelActual = fuelLogs.reduce((s, f) => s + f.costPaise, 0);
  const fuelExpected = fuelLogs.reduce((s, f) => s + f.expectedPaise, 0);
  const fuelLeak = Math.max(0, fuelActual - fuelExpected);
  const catTotal = (labels: string[]) => expenses.filter((x) => labels.includes(x.category)).reduce((s, x) => s + x.amountPaise, 0);
  const otherTotal = expenses.filter((x) => !KNOWN_SEGMENTS.includes(x.category)).reduce((s, x) => s + x.amountPaise, 0);
  const expenseSegments = [
    { label: 'Fuel', value: fuelActual, color: 'var(--sx-accent-500)' },
    { label: 'Toll & RTO', value: catTotal(['Toll', 'RTO/Police']), color: '#0ea5e9' },
    { label: 'Loading', value: catTotal(['Loading']), color: 'var(--sx-primary-500)' },
    { label: 'Repairs', value: catTotal(['Repairs']), color: '#8b5cf6' },
    { label: 'Misc & other', value: catTotal(['Misc']) + otherTotal, color: 'var(--sx-neutral-400)' },
  ].filter((s) => s.value > 0);
  const pendingReqs = requests.filter((x) => x.status === 'pending');

  const expValid = Number(e.amount) > 0 && (e.category !== OTHER || e.newCat.trim().length > 0);
  const fuelValid = g.reg && Number(g.km) > 0 && Number(g.litres) > 0;
  const reqValid = r.title.trim().length > 0;

  function submitExpense() {
    if (!expValid) return;
    let category = e.category;
    if (e.category === OTHER) { category = e.newCat.trim(); addExpenseCategory(category); }
    const tripLr = e.scope === 'Trip' ? (e.tripLr || '—') : e.scope; // "Office" / "General" for non-trip
    addExpense({ date: e.date || todayFullLabel(), tripLr, category, amountPaise: Math.round(Number(e.amount) * 100), note: e.note });
    push({ title: 'Expense added', body: `${category} · ${rupees(Math.round(Number(e.amount) * 100))} (${e.scope.toLowerCase()})`, tone: 'success' });
    setE(EXP_EMPTY); setOpen(null);
  }

  function submitFuel() {
    if (!fuelValid) return;
    const km = Number(g.km), litres = Number(g.litres), ratePaise = Math.round(Number(g.rate) * 100);
    const costPaise = Math.round(litres * ratePaise);
    const expectedPaise = Math.round((km / MILEAGE_KMPL) * ratePaise);
    addFuelLog({ date: g.date || todayFullLabel(), reg: g.reg, km, litres, ratePaise, costPaise, expectedPaise, ok: costPaise <= expectedPaise * 1.08 });
    setG(FUEL_EMPTY); setOpen(null);
  }

  function submitRequest() {
    if (!reqValid) return;
    const raisedBy = member ? `${member.name} · ${roleLabel(member.role)}` : 'Staff';
    addRequest({
      raisedBy, kind: r.kind, title: r.title.trim(),
      ...(r.note.trim() ? { note: r.note.trim() } : {}),
      ...(Number(r.amount) > 0 ? { amountPaise: Math.round(Number(r.amount) * 100) } : {}),
      ...(r.tripLr ? { tripLr: r.tripLr } : {}),
    });
    push({ title: 'Request raised', body: 'Sent to the accountant for approval.', tone: 'success' });
    setR(REQ_EMPTY); setOpen(null);
  }

  const kindTone: Record<string, 'accent' | 'primary' | 'info' | 'neutral'> = { expense: 'accent', advance: 'primary', trip: 'info', other: 'neutral' };

  return (
    <PartnerLayout title="Expenses & Fuel" subtitle="Trip costs, fuel, leakage & requests">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Expenses" value={rupees(expTotal + fuelActual)} hint="all categories" tone="primary" />
          <KpiCard label="Fuel" value={rupees(fuelActual)} hint="diesel" tone="accent" />
          <KpiCard label="Fuel leakage" value={rupees(fuelLeak)} hint="actual − expected" tone="danger" />
          <KpiCard label="Pending requests" value={String(pendingReqs.length)} hint="to accountant" tone="neutral" icon={<Inbox size={14} />} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
              <div className="flex items-center gap-1">
                {TABS.map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${tab === t ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                    {t}
                  </button>
                ))}
              </div>
              {tab === 'Fuel log'
                ? <Button size="sm" onClick={() => { setG({ ...FUEL_EMPTY, date: todayFullLabel() }); setOpen('fuel'); }}><Fuel size={13} /> Log fuel</Button>
                : <Button size="sm" onClick={() => { setE({ ...EXP_EMPTY, date: todayFullLabel() }); setOpen('expense'); }}><Plus size={13} /> Add expense</Button>}
            </div>

            {tab === 'Expenses' ? (
              <Table>
                <THead><Tr><Th>Date</Th><Th>Trip / Scope</Th><Th>Category</Th><Th>Note</Th><Th className="text-right">Amount</Th></Tr></THead>
                <TBody>
                  {expenses.map((x, idx) => (
                    <Tr key={idx}>
                      <Td className="text-neutral-500">{x.date}</Td>
                      <Td className="font-mono text-xs text-neutral-700">
                        {x.tripLr === 'Office' || x.tripLr === 'General'
                          ? <Badge tone="neutral">{x.tripLr}</Badge>
                          : x.tripLr}
                      </Td>
                      <Td><Badge tone={KNOWN_SEGMENTS.includes(x.category) ? 'neutral' : 'primary'}>{x.category}</Badge></Td>
                      <Td className="text-neutral-600">{x.note}</Td>
                      <Td className="text-right font-bold text-neutral-900">{rupees(x.amountPaise)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <Table>
                <THead><Tr><Th>Date</Th><Th>Vehicle</Th><Th className="text-right">Km</Th><Th className="text-right">Litres</Th><Th className="text-right">Actual</Th><Th className="text-right">Expected</Th><Th>Check</Th></Tr></THead>
                <TBody>
                  {fuelLogs.map((x, idx) => (
                    <Tr key={idx}>
                      <Td className="text-neutral-500">{x.date}</Td>
                      <Td className="font-mono text-xs text-neutral-800">{x.reg}</Td>
                      <Td className="text-right text-neutral-600">{x.km}</Td>
                      <Td className="text-right text-neutral-600">{x.litres} L</Td>
                      <Td className="text-right font-bold text-neutral-900">{rupees(x.costPaise)}</Td>
                      <Td className="text-right text-neutral-500">{rupees(x.expectedPaise)}</Td>
                      <Td>
                        {x.ok
                          ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={13} /> OK</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><AlertTriangle size={13} /> Flag</span>}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Expense mix" subtitle="This month" />
              <CardBody><Donut segments={expenseSegments} centerMain={rupees(expTotal + fuelActual)} centerSub="this month" /></CardBody>
            </Card>
            <Card>
              <CardHeader title="Fuel leakage" subtitle="How it's computed" action={<Receipt size={15} className="text-accent-500" />} />
              <CardBody className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-600">Actual diesel</span><span className="font-bold">{rupees(fuelActual)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-600">Expected</span><span className="font-bold">{rupees(fuelExpected)}</span></div>
                <div className="flex justify-between rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-inset ring-rose-100"><span className="font-bold text-rose-700">Leakage</span><span className="font-extrabold text-rose-700">{rupees(fuelLeak)}</span></div>
                <p className="text-[11px] text-neutral-500">Expected = (distance ÷ vehicle mileage) × diesel rate. A persistent gap signals pilferage or a mileage that needs updating.</p>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Requests to accountant */}
        <Card>
          <CardHeader title="Requests to accountant" subtitle="Advances & expense approvals raised by the team"
            action={<Button size="sm" onClick={() => setOpen('request')}><HandCoins size={13} /> Raise request</Button>} />
          <CardBody className="space-y-2.5">
            {requests.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">No requests yet.</p>}
            {requests.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-inset ring-neutral-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={kindTone[x.kind] ?? 'neutral'}>{x.kind}</Badge>
                    <span className="font-bold text-neutral-900">{x.title}</span>
                    {x.amountPaise != null && <span className="font-extrabold text-neutral-900">{rupees(x.amountPaise)}</span>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">
                    {x.raisedBy} · {x.createdOn}{x.tripLr ? ` · ${x.tripLr}` : ''}{x.note ? ` · ${x.note}` : ''}
                  </div>
                </div>
                {x.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => resolveRequest(x.id, 'rejected')}><X size={13} /> Reject</Button>
                    <Button size="sm" onClick={() => resolveRequest(x.id, 'approved')}><Check size={13} /> Approve</Button>
                  </div>
                ) : (
                  <Badge tone={x.status === 'approved' ? 'success' : 'danger'}>
                    {x.status === 'approved' ? <><Check size={11} /> Approved</> : <><X size={11} /> Rejected</>}
                  </Badge>
                )}
              </div>
            ))}
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-neutral-400"><Clock size={12} /> Anyone on the team can raise a request; the accountant approves or rejects it here.</p>
          </CardBody>
        </Card>
      </div>

      {/* Add expense */}
      <Modal open={open === 'expense'} onClose={() => setOpen(null)} title="Add expense" subtitle="Trip cost, office or general spend" onSubmit={submitExpense} submitLabel="Add expense" submitDisabled={!expValid}>
        <Field label="Expense date" required hint="When it was actually spent">
          <DateInput value={e.date} onChange={(v) => setE({ ...e, date: v })} />
        </Field>
        <Field label="This expense is for">
          <div className="grid grid-cols-3 gap-2">
            {(['Trip', 'Office', 'General'] as Scope[]).map((sc) => (
              <button key={sc} type="button" onClick={() => setE({ ...e, scope: sc })}
                className={`rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-inset transition ${e.scope === sc ? 'bg-primary-500 text-white ring-primary-500' : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50'}`}>
                {sc === 'Trip' ? 'A trip' : sc === 'Office' ? 'Office' : 'General'}
              </button>
            ))}
          </div>
        </Field>
        <Row>
          {e.scope === 'Trip' ? (
            <Field label="Trip (LR)">
              <Select value={e.tripLr} onChange={(ev) => setE({ ...e, tripLr: ev.target.value })}>
                <option value="">— select trip —</option>
                {trips.map((t) => <option key={t.lr} value={t.lr}>{t.lr} · {t.from}→{t.to}</option>)}
              </Select>
            </Field>
          ) : (
            <Field label="Scope"><TextInput value={e.scope} disabled /></Field>
          )}
          <Field label="Category">
            <Select value={e.category} onChange={(ev) => setE({ ...e, category: ev.target.value })}>
              {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER}>➕ Other — add new…</option>
            </Select>
          </Field>
        </Row>
        {e.category === OTHER && (
          <Field label="New category name" hint="Saved for next time">
            <TextInput value={e.newCat} onChange={(ev) => setE({ ...e, newCat: ev.target.value })} placeholder="e.g. Parking, Detention, Rent" autoFocus />
          </Field>
        )}
        <Field label="Amount (₹)"><TextInput type="number" value={e.amount} onChange={(ev) => setE({ ...e, amount: ev.target.value })} placeholder="4200" /></Field>
        <Field label="Note"><TextInput value={e.note} onChange={(ev) => setE({ ...e, note: ev.target.value })} placeholder="NICE Road toll" /></Field>
      </Modal>

      {/* Log fuel */}
      <Modal open={open === 'fuel'} onClose={() => setOpen(null)} title="Log fuel" subtitle="Leakage is auto-flagged" onSubmit={submitFuel} submitLabel="Save fuel entry" submitDisabled={!fuelValid}>
        <Field label="Fuel date" required hint="When it was filled">
          <DateInput value={g.date} onChange={(v) => setG({ ...g, date: v })} />
        </Field>
        <Field label="Vehicle">
          <Select value={g.reg} onChange={(ev) => setG({ ...g, reg: ev.target.value })}>
            <option value="">Select vehicle</option>
            {trucks.map((t) => <option key={t.id} value={t.reg}>{t.reg}</option>)}
          </Select>
        </Field>
        <Row>
          <Field label="Distance (km)"><TextInput type="number" value={g.km} onChange={(ev) => setG({ ...g, km: ev.target.value })} placeholder="96" /></Field>
          <Field label="Litres filled"><TextInput type="number" value={g.litres} onChange={(ev) => setG({ ...g, litres: ev.target.value })} placeholder="34" /></Field>
        </Row>
        <Field label="Diesel rate (₹/L)" hint={`Expected fuel is computed at ${MILEAGE_KMPL} km/L.`}>
          <TextInput type="number" value={g.rate} onChange={(ev) => setG({ ...g, rate: ev.target.value })} placeholder="92" />
        </Field>
      </Modal>

      {/* Raise request */}
      <Modal open={open === 'request'} onClose={() => setOpen(null)} title="Raise a request" subtitle="Goes to the accountant for approval" onSubmit={submitRequest} submitLabel="Send request" submitDisabled={!reqValid}>
        <Row>
          <Field label="Type">
            <Select value={r.kind} onChange={(ev) => setR({ ...r, kind: ev.target.value as typeof r.kind })}>
              <option value="expense">Expense reimbursement</option>
              <option value="advance">Driver / trip advance</option>
              <option value="trip">Trip-related</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Amount (₹)" hint="Optional"><TextInput type="number" value={r.amount} onChange={(ev) => setR({ ...r, amount: ev.target.value })} placeholder="3000" /></Field>
        </Row>
        <Field label="What is it for?"><TextInput value={r.title} onChange={(ev) => setR({ ...r, title: ev.target.value })} placeholder="Diesel advance for Hosur trip" /></Field>
        <Field label="Link to trip" hint="Optional">
          <Select value={r.tripLr} onChange={(ev) => setR({ ...r, tripLr: ev.target.value })}>
            <option value="">— none —</option>
            {trips.map((t) => <option key={t.lr} value={t.lr}>{t.lr} · {t.from}→{t.to}</option>)}
          </Select>
        </Field>
        <Field label="Note"><TextInput value={r.note} onChange={(ev) => setR({ ...r, note: ev.target.value })} placeholder="Any detail for the accountant" /></Field>
      </Modal>
    </PartnerLayout>
  );
}
