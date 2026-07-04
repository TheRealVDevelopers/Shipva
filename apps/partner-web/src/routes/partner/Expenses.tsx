import { useState } from 'react';
import { Plus, Fuel, AlertTriangle, CheckCircle2, Receipt } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { Donut } from '../../components/ui/Charts.js';
import { rupees } from '../../lib/format.js';
import { fuel, expenseBreakdown, osCounters } from '../../lib/mocks.js';
import { useStore, todayLabel } from '../../lib/store.js';

const TABS = ['Expenses', 'Fuel log'] as const;
const CATEGORIES = ['Toll', 'RTO/Police', 'Loading', 'Repairs', 'Misc'];
const MILEAGE_KMPL = 4; // typical loaded truck; used for the expected-fuel calc

const EXP_EMPTY = { tripLr: '', category: 'Toll', amount: '', note: '' };
const FUEL_EMPTY = { reg: '', km: '', litres: '', rate: '92' };

export function Expenses() {
  const { expenses, fuelLogs, trucks, trips, addExpense, addFuelLog } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Expenses');
  const [open, setOpen] = useState<null | 'expense' | 'fuel'>(null);
  const [e, setE] = useState(EXP_EMPTY);
  const [g, setG] = useState(FUEL_EMPTY);

  const expTotal = expenses.reduce((s, x) => s + x.amountPaise, 0);
  const expValid = Number(e.amount) > 0;
  const fuelValid = g.reg && Number(g.km) > 0 && Number(g.litres) > 0;

  function submitExpense() {
    if (!expValid) return;
    addExpense({ date: todayLabel(), tripLr: e.tripLr || '—', category: e.category, amountPaise: Math.round(Number(e.amount) * 100), note: e.note });
    setE(EXP_EMPTY); setOpen(null);
  }

  function submitFuel() {
    if (!fuelValid) return;
    const km = Number(g.km), litres = Number(g.litres), ratePaise = Math.round(Number(g.rate) * 100);
    const costPaise = Math.round(litres * ratePaise);
    const expectedPaise = Math.round((km / MILEAGE_KMPL) * ratePaise);
    addFuelLog({ date: todayLabel(), reg: g.reg, km, litres, ratePaise, costPaise, expectedPaise, ok: costPaise <= expectedPaise * 1.08 });
    setG(FUEL_EMPTY); setOpen(null);
  }

  return (
    <PartnerLayout title="Expenses & Fuel" subtitle="Trip costs, fuel and leakage control">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Expense · MTD" value={rupees(osCounters.expenseMtdPaise)} hint="all categories" tone="primary" />
          <KpiCard label="Fuel · MTD" value={rupees(fuel.mtdCostPaise)} hint="diesel" tone="accent" />
          <KpiCard label="Fuel leakage" value={rupees(fuel.leakagePaise)} hint="actual − expected" tone="danger" />
          <KpiCard label="Logged entries" value={String(expenses.length + fuelLogs.length)} hint="expense + fuel" tone="neutral" />
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
                ? <Button size="sm" onClick={() => setOpen('fuel')}><Fuel size={13} /> Log fuel</Button>
                : <Button size="sm" onClick={() => setOpen('expense')}><Plus size={13} /> Add expense</Button>}
            </div>

            {tab === 'Expenses' ? (
              <Table>
                <THead><Tr><Th>Date</Th><Th>Trip</Th><Th>Category</Th><Th>Note</Th><Th className="text-right">Amount</Th></Tr></THead>
                <TBody>
                  {expenses.map((x, idx) => (
                    <Tr key={idx}>
                      <Td className="text-neutral-500">{x.date}</Td>
                      <Td className="font-mono text-xs text-neutral-700">{x.tripLr}</Td>
                      <Td><Badge tone="neutral">{x.category}</Badge></Td>
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
              <CardBody><Donut segments={expenseBreakdown} centerMain={rupees(expTotal)} centerSub="recent" /></CardBody>
            </Card>
            <Card>
              <CardHeader title="Fuel leakage" subtitle="How it's computed" action={<Receipt size={15} className="text-accent-500" />} />
              <CardBody className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-600">Actual diesel</span><span className="font-bold">{rupees(fuel.mtdCostPaise)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-600">Expected</span><span className="font-bold">{rupees(fuel.expectedPaise)}</span></div>
                <div className="flex justify-between rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-inset ring-rose-100"><span className="font-bold text-rose-700">Leakage</span><span className="font-extrabold text-rose-700">{rupees(fuel.leakagePaise)}</span></div>
                <p className="text-[11px] text-neutral-500">Expected = (distance ÷ vehicle mileage) × diesel rate. A persistent gap signals pilferage or a mileage that needs updating.</p>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>

      {/* Add expense */}
      <Modal open={open === 'expense'} onClose={() => setOpen(null)} title="Add expense" onSubmit={submitExpense} submitLabel="Add expense" submitDisabled={!expValid}>
        <Row>
          <Field label="Trip (LR)">
            <Select value={e.tripLr} onChange={(ev) => setE({ ...e, tripLr: ev.target.value })}>
              <option value="">— none —</option>
              {trips.map((t) => <option key={t.lr} value={t.lr}>{t.lr}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={e.category} onChange={(ev) => setE({ ...e, category: ev.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Amount (₹)"><TextInput type="number" value={e.amount} onChange={(ev) => setE({ ...e, amount: ev.target.value })} placeholder="4200" /></Field>
        <Field label="Note"><TextInput value={e.note} onChange={(ev) => setE({ ...e, note: ev.target.value })} placeholder="NICE Road toll" /></Field>
      </Modal>

      {/* Log fuel */}
      <Modal open={open === 'fuel'} onClose={() => setOpen(null)} title="Log fuel" subtitle="Leakage is auto-flagged" onSubmit={submitFuel} submitLabel="Save fuel entry" submitDisabled={!fuelValid}>
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
    </PartnerLayout>
  );
}
