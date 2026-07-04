import { useState } from 'react';
import { Plus, Fuel, AlertTriangle, CheckCircle2, Receipt } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Donut } from '../../components/ui/Charts.js';
import { rupees } from '../../lib/format.js';
import { expenses, fuelLogs, fuel, expenseBreakdown, osCounters } from '../../lib/mocks.js';

const TABS = ['Expenses', 'Fuel log'] as const;

export function Expenses() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Expenses');
  const expTotal = expenses.reduce((s, e) => s + e.amountPaise, 0);

  return (
    <PartnerLayout title="Expenses & Fuel" subtitle="Trip costs, fuel and leakage control">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Expense · MTD" value={rupees(osCounters.expenseMtdPaise)} hint="all categories" tone="primary" />
          <KpiCard label="Fuel · MTD" value={rupees(fuel.mtdCostPaise)} hint="diesel" tone="accent" />
          <KpiCard label="Fuel leakage" value={rupees(fuel.leakagePaise)} hint="actual − expected" tone="danger" />
          <KpiCard label="Logged trips" value={String(expenses.length)} hint="recent entries" tone="neutral" />
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
              <Button size="sm">{tab === 'Fuel log' ? <><Fuel size={13} /> Log fuel</> : <><Plus size={13} /> Add expense</>}</Button>
            </div>

            {tab === 'Expenses' ? (
              <Table>
                <THead><Tr><Th>Date</Th><Th>Trip</Th><Th>Category</Th><Th>Note</Th><Th className="text-right">Amount</Th></Tr></THead>
                <TBody>
                  {expenses.map((e, idx) => (
                    <Tr key={idx}>
                      <Td className="text-neutral-500">{e.date}</Td>
                      <Td className="font-mono text-xs text-neutral-700">{e.tripLr}</Td>
                      <Td><Badge tone="neutral">{e.category}</Badge></Td>
                      <Td className="text-neutral-600">{e.note}</Td>
                      <Td className="text-right font-bold text-neutral-900">{rupees(e.amountPaise)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <Table>
                <THead><Tr><Th>Date</Th><Th>Vehicle</Th><Th className="text-right">Km</Th><Th className="text-right">Litres</Th><Th className="text-right">Actual</Th><Th className="text-right">Expected</Th><Th>Check</Th></Tr></THead>
                <TBody>
                  {fuelLogs.map((f, idx) => (
                    <Tr key={idx}>
                      <Td className="text-neutral-500">{f.date}</Td>
                      <Td className="font-mono text-xs text-neutral-800">{f.reg}</Td>
                      <Td className="text-right text-neutral-600">{f.km}</Td>
                      <Td className="text-right text-neutral-600">{f.litres} L</Td>
                      <Td className="text-right font-bold text-neutral-900">{rupees(f.costPaise)}</Td>
                      <Td className="text-right text-neutral-500">{rupees(f.expectedPaise)}</Td>
                      <Td>
                        {f.ok
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
    </PartnerLayout>
  );
}
