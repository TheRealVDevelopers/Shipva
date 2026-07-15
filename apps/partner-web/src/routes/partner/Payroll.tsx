import { Wallet, Plus, CheckCircle2, Clock } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { rupees } from '../../lib/format.js';
import { payouts } from '../../lib/mocks.js';
import { useStore } from '../../lib/store.js';

export function Payroll() {
  const { payroll, runPayroll } = useStore();
  const netTotal = payroll.reduce((s, p) => s + p.netPaise, 0);
  const dueTotal = payroll.filter((p) => p.status === 'due').reduce((s, p) => s + p.netPaise, 0);
  const bhattaTotal = payroll.reduce((s, p) => s + p.bhattaPaise, 0);

  return (
    <PartnerLayout title="Payroll" subtitle="Drivers & staff salaries, bhatta and deductions">
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl bg-primary-50 px-5 py-4 text-sm text-primary-900 ring-1 ring-inset ring-primary-100">
          <Wallet size={18} className="mt-0.5 shrink-0 text-primary-600" />
          <div><b>How payroll works:</b> each cycle lists every driver &amp; staff member — their <b>base salary</b> + <b>bhatta</b> (trip allowance) − <b>deductions</b> = <b>net pay</b>. Press <b>Run payroll</b> to mark the cycle paid (it's idempotent — running twice never double-pays). Settled cycles show under "Recent payouts".</div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Payroll · this cycle" value={rupees(netTotal)} hint={`${payroll.length} people`} tone="primary" />
          <KpiCard label="Pending payout" value={rupees(dueTotal)} hint="to settle" tone="danger" />
          <KpiCard label="Bhatta (allowance)" value={rupees(bhattaTotal)} hint="trip allowances" tone="accent" />
          <KpiCard label="Last settled" value={payouts[0] ? rupees(payouts[0].amountPaise) : '—'} hint={payouts[0]?.on ?? 'nothing settled yet'} tone="success" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Current payroll run"
              subtitle="16–30 Jun 2026"
              action={<Button size="sm" onClick={runPayroll}><Plus size={13} /> Run payroll</Button>}
            />
            <Table>
              <THead>
                <Tr>
                  <Th>Name · Role</Th>
                  <Th className="text-right">Base</Th><Th className="text-right">Bhatta</Th>
                  <Th className="text-right">Deductions</Th><Th className="text-right">Net pay</Th><Th>Status</Th>
                </Tr>
              </THead>
              <TBody>
                {payroll.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="font-semibold text-neutral-900">{p.name}</div>
                      <div className="text-[11px] text-neutral-400">{p.role}</div>
                    </Td>
                    <Td className="text-right text-neutral-600">{rupees(p.basePaise)}</Td>
                    <Td className="text-right text-neutral-600">{p.bhattaPaise ? rupees(p.bhattaPaise) : '—'}</Td>
                    <Td className="text-right text-rose-600">−{rupees(p.deductionsPaise)}</Td>
                    <Td className="text-right font-extrabold text-neutral-900">{rupees(p.netPaise)}</Td>
                    <Td>
                      {p.status === 'paid'
                        ? <Badge tone="success"><CheckCircle2 size={11} /> Paid</Badge>
                        : <Badge tone="warning"><Clock size={11} /> Due</Badge>}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card>
            <CardHeader title="Recent payouts" subtitle="Settled cycles" action={<Wallet size={15} className="text-primary-500" />} />
            <CardBody className="space-y-2.5">
              {payouts.length === 0 && (
                <p className="py-6 text-center text-xs text-neutral-400">No settled cycles yet — run payroll and they'll appear here.</p>
              )}
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5 ring-1 ring-inset ring-neutral-100">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">{rupees(p.amountPaise)}</div>
                    <div className="text-[11px] text-neutral-500">{p.period}</div>
                  </div>
                  <div className="text-right">
                    <Badge tone="success">Settled</Badge>
                    <div className="mt-1 text-[10px] text-neutral-400">{p.on}</div>
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-neutral-500">Payroll is idempotent — running a cycle twice never double-pays.</p>
            </CardBody>
          </Card>
        </section>
      </div>
    </PartnerLayout>
  );
}
