import { IndianRupee, TrendingUp, Wallet, Percent } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { BarPairChart, Donut, HBar } from '../../components/ui/Charts.js';
import { VehicleArt } from '../../components/art.js';
import { rupees } from '../../lib/format.js';
import { months6, revenueSeries, expenseSeries } from '../../lib/mocks.js';
import { useStore } from '../../lib/store.js';

export function Reports() {
  const { trips, trucks, expenses, fuelLogs, payroll } = useStore();
  const inr = (n: number) => rupees(n);

  const revenue = trips.reduce((s, t) => s + t.freightPaise, 0);
  const fuelActual = fuelLogs.reduce((s, f) => s + f.costPaise, 0);
  const payrollTotal = payroll.reduce((s, p) => s + p.netPaise, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amountPaise, 0) + fuelActual + payrollTotal;
  const profit = revenue - expenseTotal;
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const revSeries = [...revenueSeries.slice(0, 5), revenue];
  const expSeries = [...expenseSeries.slice(0, 5), expenseTotal];
  const catTotal = (labels: string[]) => expenses.filter((e) => labels.includes(e.category)).reduce((s, e) => s + e.amountPaise, 0);
  const costSegments = [
    { label: 'Fuel', value: fuelActual, color: 'var(--sx-accent-500)' },
    { label: 'Salaries', value: payrollTotal, color: 'var(--sx-primary-500)' },
    { label: 'Toll & RTO', value: catTotal(['Toll', 'RTO/Police']), color: '#0ea5e9' },
    { label: 'Repairs', value: catTotal(['Repairs']), color: '#8b5cf6' },
    { label: 'Other', value: catTotal(['Loading', 'Misc']), color: 'var(--sx-neutral-400)' },
  ].filter((s) => s.value > 0);

  const byVehicle = trucks
    .map((t) => {
      const ts = trips.filter((x) => x.vehicleReg === t.reg);
      return { reg: t.reg, type: t.type, revenue: ts.reduce((s, x) => s + x.freightPaise, 0), trips: ts.length };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const maxVeh = Math.max(1, ...byVehicle.map((v) => v.revenue));

  const routeMap = new Map<string, { route: string; revenue: number; trips: number }>();
  trips.forEach((t) => {
    const k = `${t.from} → ${t.to}`;
    const e = routeMap.get(k) ?? { route: k, revenue: 0, trips: 0 };
    e.revenue += t.freightPaise; e.trips += 1; routeMap.set(k, e);
  });
  const byRoute = [...routeMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return (
    <PartnerLayout title="Reports" subtitle="Profit & loss — by month, vehicle and route">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Revenue" value={inr(revenue)} hint="freight billed" tone="primary" icon={<IndianRupee size={14} />} />
          <KpiCard label="Expense" value={inr(expenseTotal)} hint="all costs" tone="accent" icon={<Wallet size={14} />} />
          <KpiCard label="Net profit" value={inr(profit)} hint="revenue − expense" tone="success" icon={<TrendingUp size={14} />} />
          <KpiCard label="Margin" value={`${marginPct}%`} hint="net" tone="primary" icon={<Percent size={14} />} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Profit & loss" subtitle="Trend · current month is live" />
            <CardBody>
              <BarPairChart labels={months6} a={revSeries} b={expSeries} aLabel="Revenue" bLabel="Expense" aColor="var(--sx-primary-500)" bColor="var(--sx-accent-500)" format={inr} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Cost structure" subtitle="Where money goes" />
            <CardBody><Donut segments={costSegments} centerMain={inr(expenseTotal)} centerSub="expense" /></CardBody>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="P&L by vehicle" subtitle="Revenue contribution" />
            <CardBody className="space-y-3">
              {byVehicle.map((v) => (
                <div key={v.reg} className="flex items-center gap-3">
                  <VehicleArt type={v.type} className="h-7 w-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-neutral-800">{v.reg}</span>
                      <span className="font-bold text-neutral-900">{inr(v.revenue)}</span>
                    </div>
                    <div className="mt-1"><HBar value={v.revenue} max={maxVeh} /></div>
                  </div>
                  <span className="w-14 shrink-0 text-right text-[11px] text-neutral-400">{v.trips} trips</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Top routes" subtitle="By revenue" />
            <Table>
              <THead><Tr><Th>Route</Th><Th className="text-right">Trips</Th><Th className="text-right">Revenue</Th></Tr></THead>
              <TBody>
                {byRoute.map((r) => (
                  <Tr key={r.route}>
                    <Td className="font-semibold text-neutral-800">{r.route}</Td>
                    <Td className="text-right text-neutral-600">{r.trips}</Td>
                    <Td className="text-right font-bold text-neutral-900">{inr(r.revenue)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        </section>
      </div>
    </PartnerLayout>
  );
}
