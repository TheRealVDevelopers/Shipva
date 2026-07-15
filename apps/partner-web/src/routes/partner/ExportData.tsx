import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Sheet, Upload, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { exportRows, rupeeCell, type Cell } from '../../lib/exportExcel.js';
import { exportTourSheet } from '../../lib/exportTourSheet.js';
import { parseTourSheet, matchExisting, type ParseResult } from '../../lib/importTourSheet.js';
import { useStore, type Tour } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { useNotify } from '../../lib/notify.js';

/** What the importer found, once the file has been read. */
interface ImportState {
  fileName: string;
  busy: boolean;
  result?: ParseResult;
  /** Per-row: does it match an existing tour (update) or not (create)? */
  plan?: { row: number; tour: Omit<Tour, 'id'>; existing: Tour | null; warnings: string[] }[];
  fatal?: string;
}

export function ExportData() {
  const s = useStore();
  const { member } = useAuth();
  const { push } = useNotify();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imp, setImp] = useState<ImportState | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again
    if (!file) return;
    setImp({ fileName: file.name, busy: true });
    try {
      const result = await parseTourSheet(file);
      const plan = result.rows.map((r) => ({
        row: r.row, tour: r.tour, warnings: r.warnings, existing: matchExisting(r.tour, s.tours),
      }));
      setImp({ fileName: file.name, busy: false, result, plan });
    } catch (ex) {
      setImp({ fileName: file.name, busy: false, fatal: (ex as Error)?.message || "That file couldn't be read as an .xlsx workbook." });
    }
  }

  function applyImport() {
    if (!imp?.plan) return;
    let created = 0; let updated = 0;
    for (const p of imp.plan) {
      if (p.existing?.id) { s.updateTour(p.existing.id, p.tour); updated++; }
      else {
        s.addTour(p.tour, member ? { uid: member.uid, name: member.name, leaderUid: member.leaderUid || member.uid } : undefined);
        created++;
      }
    }
    push({ title: 'Tour sheet imported', body: `${created} created · ${updated} updated from ${imp.fileName}.`, tone: 'success' });
    setImp(null);
  }

  const datasets: { name: string; desc: string; count: number; run: () => void }[] = [
    {
      name: 'Trips', desc: 'LRs, routes, freight, status, handled-by', count: s.trips.length,
      run: () => exportRows('shipva-trips', ['VR ID', 'LR', 'Date', 'From', 'To', 'Driver', 'Vehicle', 'Material', 'Weight (kg)', 'Freight (₹)', 'E-way', 'Status', 'Handled by'],
        s.trips.map((t): Cell[] => [t.vrId ?? '', t.lr, t.date, t.from, t.to, t.driver, t.vehicleReg, t.material, t.weightKg, rupeeCell(t.freightPaise), t.ewayBill ? 'Yes' : 'No', t.status, t.ownerName ?? ''])),
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
        {/* Featured — the client's operational tour-sheet format, styled */}
        <Card className="flex flex-col gap-4 p-5 ring-primary-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white"><Sheet size={18} /></span>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Amazon Tour Sheet <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">styled .xls</span></h3>
              <p className="mt-0.5 max-w-xl text-xs text-neutral-500">Your operational 54-column format — multi-stop, red status/photo columns, yellow Amazon-Rely-KM. Column-for-column identical to your own sheet, so it pastes straight into it. Import reads the same shape back in.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={13} /> Import</Button>
            <Button size="sm" onClick={() => exportTourSheet(s.tours)}><Download size={13} /> Export tour sheet</Button>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={onPick} />
        </Card>

        <TourImportModal
          state={imp}
          onClose={() => setImp(null)}
          onApply={applyImport}
        />

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

/** Preview what an import will do before any of it is written. Nothing touches
 *  Firestore until the user confirms the create/update counts. */
function TourImportModal({ state, onClose, onApply }: {
  state: ImportState | null; onClose: () => void; onApply: () => void;
}) {
  if (!state) return null;

  if (state.busy) {
    return (
      <Modal open onClose={onClose} title="Reading sheet…" subtitle={state.fileName} submitLabel="Please wait" onSubmit={() => {}}>
        <p className="text-sm text-neutral-500">Parsing {state.fileName}…</p>
      </Modal>
    );
  }

  if (state.fatal) {
    return (
      <Modal open onClose={onClose} title="Couldn't read that file" subtitle={state.fileName} submitLabel="Close" onSubmit={onClose}>
        <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">{state.fatal}</p>
        <p className="text-xs text-neutral-500">Export the tour sheet first to see the exact shape the importer expects — it's the same 54-column layout.</p>
      </Modal>
    );
  }

  const plan = state.plan ?? [];
  const creates = plan.filter((p) => !p.existing).length;
  const updates = plan.filter((p) => p.existing).length;
  const errs = state.result?.errors ?? [];
  const unknown = state.result?.unknownHeaders ?? [];

  return (
    <Modal open onClose={onClose} title="Import tour sheet" subtitle={state.fileName}
      onSubmit={onApply} submitLabel={plan.length ? `Import ${plan.length} row${plan.length === 1 ? '' : 's'}` : 'Nothing to import'}
      submitDisabled={plan.length === 0} wide>

      <div className="flex flex-wrap gap-2">
        <Badge tone="success"><Plus size={11} /> {creates} new tour{creates === 1 ? '' : 's'}</Badge>
        <Badge tone="info"><RefreshCw size={11} /> {updates} update{updates === 1 ? '' : 's'}</Badge>
        {errs.length > 0 && <Badge tone="danger"><AlertTriangle size={11} /> {errs.length} skipped</Badge>}
      </div>

      {unknown.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">
          Columns we didn't recognise (ignored): <b>{unknown.join(', ')}</b>. If the sheet has changed shape, check the import before applying.
        </p>
      )}

      <div className="max-h-64 overflow-y-auto rounded-lg ring-1 ring-inset ring-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-500">
            <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Tour ID</th><th className="px-3 py-2">VR ID</th><th className="px-3 py-2">Route</th><th className="px-3 py-2">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {plan.map((p) => (
              <tr key={p.row}>
                <td className="px-3 py-1.5 text-neutral-400">{p.row}</td>
                <td className="px-3 py-1.5 font-mono text-neutral-800">{p.tour.tourId || '—'}</td>
                <td className="px-3 py-1.5 font-mono text-neutral-600">{(p.tour.vrIds ?? []).join(', ') || p.tour.vrId || '—'}</td>
                <td className="px-3 py-1.5 text-neutral-600">{p.tour.stops.map((x) => x.name).join(' → ') || '—'}</td>
                <td className="px-3 py-1.5">
                  {p.existing
                    ? <span className="font-bold text-sky-600">Update</span>
                    : <span className="font-bold text-emerald-600">Create</span>}
                  {p.warnings.length > 0 && <span className="ml-1 text-[10px] text-amber-600">({p.warnings.join(', ')})</span>}
                </td>
              </tr>
            ))}
            {errs.map((e) => (
              <tr key={`e${e.row}`} className="bg-rose-50/50">
                <td className="px-3 py-1.5 text-neutral-400">{e.row}</td>
                <td className="px-3 py-1.5 text-rose-700" colSpan={4}>Skipped — {e.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-neutral-400">
        Rows are matched on <b>Tour ID</b>, falling back to the <b>VR ID</b>. Nothing is written until you press import.
      </p>
    </Modal>
  );
}
