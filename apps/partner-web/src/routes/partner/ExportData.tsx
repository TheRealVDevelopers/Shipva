import { Download, FileSpreadsheet } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { exportRows, rupeeCell, type Cell } from '../../lib/exportExcel.js';
import { useStore } from '../../lib/store.js';

export function ExportData() {
  const s = useStore();

  const datasets: { name: string; desc: string; count: number; run: () => void }[] = [
    {
      name: 'Trips', desc: 'LRs, routes, freight, status', count: s.trips.length,
      run: () => exportRows('shipva-trips', ['LR', 'Date', 'From', 'To', 'Driver', 'Vehicle', 'Material', 'Weight (kg)', 'Freight (₹)', 'E-way', 'Status'],
        s.trips.map((t): Cell[] => [t.lr, t.date, t.from, t.to, t.driver, t.vehicleReg, t.material, t.weightKg, rupeeCell(t.freightPaise), t.ewayBill ? 'Yes' : 'No', t.status])),
    },
    {
      name: 'Invoices', desc: 'GST invoices & totals', count: s.invoices.length,
      run: () => exportRows('shipva-invoices', ['Invoice', 'Client', 'Date', 'Due', 'Base (₹)', 'GST (₹)', 'Total (₹)', 'Status'],
        s.invoices.map((i): Cell[] => [i.no, i.client, i.date, i.dueDate, rupeeCell(i.basePaise), rupeeCell(i.gstPaise), rupeeCell(i.totalPaise), i.status])),
    },
    {
      name: 'Expenses', desc: 'Trip costs by category', count: s.expenses.length,
      run: () => exportRows('shipva-expenses', ['Date', 'Trip', 'Category', 'Note', 'Amount (₹)'],
        s.expenses.map((e): Cell[] => [e.date, e.tripLr, e.category, e.note, rupeeCell(e.amountPaise)])),
    },
    {
      name: 'Fuel logs', desc: 'Diesel & leakage', count: s.fuelLogs.length,
      run: () => exportRows('shipva-fuel', ['Date', 'Vehicle', 'Km', 'Litres', 'Actual (₹)', 'Expected (₹)', 'OK'],
        s.fuelLogs.map((f): Cell[] => [f.date, f.reg, f.km, f.litres, rupeeCell(f.costPaise), rupeeCell(f.expectedPaise), f.ok ? 'Yes' : 'Flag'])),
    },
    {
      name: 'Customers', desc: 'Clients & rate contracts', count: s.customers.length,
      run: () => exportRows('shipva-customers', ['Company', 'GSTIN', 'City', 'Phone', 'Rate/km (₹)', 'Outstanding (₹)'],
        s.customers.map((c): Cell[] => [c.name, c.gstin, c.city, c.phone, rupeeCell(c.ratePerKmPaise), rupeeCell(c.outstandingPaise)])),
    },
    {
      name: 'Payables', desc: 'Truck-owner balances', count: s.attached.length,
      run: () => exportRows('shipva-payables', ['Owner', 'Vehicle', 'Phone', 'Trips', 'Balance (₹)'],
        s.attached.map((a): Cell[] => [a.owner, a.reg, a.phone, a.trips, rupeeCell(a.balancePaise)])),
    },
    {
      name: 'Payroll', desc: 'Salaries, bhatta, net', count: s.payroll.length,
      run: () => exportRows('shipva-payroll', ['Name', 'Role', 'Base (₹)', 'Bhatta (₹)', 'Deductions (₹)', 'Net (₹)', 'Status'],
        s.payroll.map((p): Cell[] => [p.name, p.role, rupeeCell(p.basePaise), rupeeCell(p.bhattaPaise), rupeeCell(p.deductionsPaise), rupeeCell(p.netPaise), p.status])),
    },
    {
      name: 'Drivers', desc: 'Fleet drivers', count: s.drivers.length,
      run: () => exportRows('shipva-drivers', ['Name', 'Phone', 'Vehicle', 'Type', 'Duty', 'KYC', 'Rating'],
        s.drivers.map((d): Cell[] => [d.name, d.phone, d.vehicleReg, d.vehicleType, d.dutyStatus, d.kycStatus, d.ratingAvg])),
    },
    {
      name: 'Trucks', desc: 'Owned vehicles', count: s.trucks.length,
      run: () => exportRows('shipva-trucks', ['Reg', 'Type', 'Capacity (kg)', 'Status', 'Docs OK'],
        s.trucks.map((t): Cell[] => [t.reg, t.type, t.capacityKg, t.status, t.docsOk ? 'Yes' : 'No'])),
    },
  ];

  return (
    <PartnerLayout title="Data Export" subtitle="Download your data as Excel sheets">
      <div className="space-y-6">
        <Card className="flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><FileSpreadsheet size={18} /></span>
          <p className="text-sm text-neutral-600">Each sheet downloads as a <b className="text-neutral-800">.csv</b> that opens directly in Excel or Google Sheets. Money columns are plain numbers so you can total and pivot them.</p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {datasets.map((d) => (
            <Card key={d.name} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-neutral-900">{d.name}</h3>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500">{d.count} rows</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{d.desc}</p>
              </div>
              <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={d.run}><Download size={13} /> Export to Excel</Button>
            </Card>
          ))}
        </div>
      </div>
    </PartnerLayout>
  );
}
