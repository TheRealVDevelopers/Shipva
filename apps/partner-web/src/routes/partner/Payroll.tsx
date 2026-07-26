/**
 * Payroll & HR — the client's point 16: "Accounts should manage salary and
 * incentives. Automatically generate joining letters after employee
 * registration. Generate downloadable payslips for employees."
 *
 * The page was switched off earlier at the client's request because nothing in
 * the app ever created a payroll line — it was always an empty table. It's back
 * because they've now asked for it, and it builds its lines from the real team
 * (orgMembers) and the salary Accounts set on each employee.
 *
 * Joining letters live on the employee record and are issued at activation
 * (Team & Roles); this page reprints them and produces the payslips.
 */
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Wallet, Plus, CheckCircle2, Clock, FileText, Users, Download, Pencil, Trash2 } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { useStore } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { useNotify } from '../../lib/notify.js';
import { watchMembers, isActivated, type Member } from '../../lib/members.js';
import { roleLabel, canExportData } from '../../lib/roles.js';
import { printPayslip, printEmployeeJoiningLetter } from '../../lib/hrDocs.js';
import { exportRows, type Cell } from '../../lib/exportExcel.js';
import { brandSlug } from '../../lib/brand.js';

/** "August 2026" — the cycle label lines are grouped by. */
const monthLabel = (d = new Date()) => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/** The last six cycles, newest first, for the period picker. */
function recentPeriods(): string[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => monthLabel(new Date(now.getFullYear(), now.getMonth() - i, 1)));
}

const BLANK = { uid: '', base: '', incentive: '', deductions: '', note: '' };

export function Payroll() {
  const { payroll, runPayroll, addPayrollLine, updatePayrollLine, deletePayrollLine } = useStore();
  const { member: me } = useAuth();
  const { push } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [period, setPeriod] = useState(monthLabel());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(BLANK);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => watchMembers((l) => setMembers(l.sort((a, b) => a.name.localeCompare(b.name)))), []);

  // Lines written before periods existed belong to the current cycle, so an
  // existing run doesn't vanish the moment this page ships.
  const lines = useMemo(() => payroll.filter((l) => (l.period ?? period) === period), [payroll, period]);
  const netTotal = lines.reduce((s, p) => s + p.netPaise, 0);
  const dueTotal = lines.filter((p) => p.status === 'due').reduce((s, p) => s + p.netPaise, 0);
  const incentiveTotal = lines.reduce((s, p) => s + p.bhattaPaise, 0);
  const paidCount = lines.filter((p) => p.status === 'paid').length;

  const staff = members.filter((m) => isActivated(m));
  const memberOf = (uid?: string) => members.find((m) => m.uid === uid);
  /** Who hasn't got a line in this cycle yet. */
  const unpaid = staff.filter((m) => !lines.some((l) => l.uid === m.uid));

  const num = (v: string) => (Number(v) > 0 ? Math.round(Number(v) * 100) : 0);
  const preview = num(f.base) + num(f.incentive) - num(f.deductions);
  const valid = !!f.uid && num(f.base) + num(f.incentive) > 0;

  function startAdd(uid = '') {
    const m = memberOf(uid);
    setF({
      ...BLANK, uid,
      // Pre-fill from the salary Accounts recorded on the employee.
      base: m?.monthlySalaryPaise ? String(m.monthlySalaryPaise / 100) : '',
    });
    setEditId(null); setOpen(true);
  }

  function startEdit(id: string) {
    const l = lines.find((x) => x.id === id);
    if (!l) return;
    setF({
      uid: l.uid ?? '', base: String(l.basePaise / 100), incentive: String(l.bhattaPaise / 100),
      deductions: String(l.deductionsPaise / 100), note: l.note ?? '',
    });
    setEditId(id); setOpen(true);
  }

  function save() {
    if (!valid) return;
    const m = memberOf(f.uid);
    const rec = {
      uid: f.uid, period,
      name: m?.name ?? 'Employee', role: m?.designation || (m ? roleLabel(m.role) : ''),
      basePaise: num(f.base), bhattaPaise: num(f.incentive), deductionsPaise: num(f.deductions),
      netPaise: preview, note: f.note.trim(), status: 'due' as const,
    };
    if (editId) { updatePayrollLine(editId, rec); push({ title: 'Pay line updated', body: `${rec.name} · ${period}`, tone: 'success' }); }
    else { addPayrollLine(rec); push({ title: 'Pay line added', body: `${rec.name} · ${rupees(preview)} for ${period}`, tone: 'success' }); }
    setOpen(false); setF(BLANK); setEditId(null);
  }

  /** Build a line for everyone who has a salary but no line yet. */
  function generateAll() {
    const made = unpaid.filter((m) => m.monthlySalaryPaise);
    made.forEach((m) => addPayrollLine({
      uid: m.uid, period, name: m.name, role: m.designation || roleLabel(m.role),
      basePaise: m.monthlySalaryPaise ?? 0, bhattaPaise: 0, deductionsPaise: 0,
      netPaise: m.monthlySalaryPaise ?? 0, status: 'due',
    }));
    push({
      title: made.length ? `${made.length} pay line${made.length === 1 ? '' : 's'} added` : 'Nothing to generate',
      body: made.length
        ? `${period} — add incentives and deductions, then run payroll.`
        : 'Everyone with a salary already has a line this cycle. Set salaries in Team & Roles.',
      tone: made.length ? 'success' : 'info',
    });
  }

  function exportCycle() {
    exportRows(`${brandSlug}-payroll-${period.replace(/\s+/g, '-').toLowerCase()}`,
      ['Employee', 'Designation', 'Period', 'Basic', 'Incentive', 'Deductions', 'Net pay', 'Status', 'Paid on', 'Note'],
      lines.map((l): Cell[] => [
        l.name, l.role, l.period ?? period,
        l.basePaise / 100, l.bhattaPaise / 100, l.deductionsPaise / 100, l.netPaise / 100,
        l.status === 'paid' ? 'Paid' : 'Due', l.paidOn ?? '', l.note ?? '',
      ]));
  }

  return (
    <PartnerLayout title="Payroll & HR" subtitle="Salaries, incentives, payslips & joining letters">
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl bg-primary-50 px-5 py-4 text-sm text-primary-900 ring-1 ring-inset ring-primary-100">
          <Wallet size={18} className="mt-0.5 shrink-0 text-primary-600" />
          <div>
            <b>How this works:</b> each employee's monthly salary is set on their record in <b>Team &amp; Roles</b>.
            Pick a cycle, press <b>Generate lines</b> to pull everyone in, add <b>incentives</b> and <b>deductions</b>,
            then <b>Run payroll</b> to mark the cycle paid (running twice never double-pays). Every line prints a payslip.
          </div>
        </div>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label={`Payroll · ${period}`} value={rupees(netTotal)} hint={`${lines.length} ${lines.length === 1 ? 'person' : 'people'}`} tone="primary" />
          <KpiCard label="Pending payout" value={rupees(dueTotal)} hint="to settle" tone="danger" />
          <KpiCard label="Incentives" value={rupees(incentiveTotal)} hint="this cycle" tone="accent" />
          <KpiCard label="Settled" value={`${paidCount}/${lines.length}`} hint="paid" tone="success" />
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto">
                {recentPeriods().map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
              {unpaid.length > 0 && (
                <Button size="sm" variant="secondary" onClick={generateAll}><Users size={13} /> Generate lines ({unpaid.length})</Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canExportData(me?.role) && <Button size="sm" variant="secondary" onClick={exportCycle} disabled={lines.length === 0}><Download size={13} /> Export</Button>}
              <Button size="sm" variant="secondary" onClick={() => startAdd()}><Plus size={13} /> Add line</Button>
              <Button size="sm" onClick={() => { runPayroll(period); push({ title: 'Payroll run', body: `${period} settled.`, tone: 'success' }); }} disabled={dueTotal === 0}>
                <CheckCircle2 size={13} /> Run payroll
              </Button>
            </div>
          </div>

          <Table>
            <THead>
              <Tr>
                <Th>Name · Designation</Th>
                <Th className="text-right">Basic</Th><Th className="text-right">Incentive</Th>
                <Th className="text-right">Deductions</Th><Th className="text-right">Net pay</Th>
                <Th>Status</Th><Th> </Th>
              </Tr>
            </THead>
            <TBody>
              {lines.map((p) => {
                const m = memberOf(p.uid);
                return (
                  <Tr key={p.id}>
                    <Td>
                      <div className="font-semibold text-neutral-900">{p.name}</div>
                      <div className="text-[11px] text-neutral-400">{p.role}{p.note ? ` · ${p.note}` : ''}</div>
                    </Td>
                    <Td className="text-right text-neutral-600">{rupees(p.basePaise)}</Td>
                    <Td className="text-right text-neutral-600">{p.bhattaPaise ? rupees(p.bhattaPaise) : '—'}</Td>
                    <Td className="text-right text-rose-600">{p.deductionsPaise ? `−${rupees(p.deductionsPaise)}` : '—'}</Td>
                    <Td className="text-right font-extrabold text-neutral-900">{rupees(p.netPaise)}</Td>
                    <Td>
                      {p.status === 'paid'
                        ? <Badge tone="success"><CheckCircle2 size={11} /> Paid{p.paidOn ? ` · ${p.paidOn}` : ''}</Badge>
                        : <Badge tone="warning"><Clock size={11} /> Due</Badge>}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => printPayslip(m ?? ({ name: p.name, email: '', role: 'supervisor', uid: p.uid ?? '', pages: [], status: 'active' } as Member), {
                            period: p.period ?? period, basePaise: p.basePaise, incentivePaise: p.bhattaPaise,
                            deductionsPaise: p.deductionsPaise, netPaise: p.netPaise,
                            ...(p.paidOn ? { paidOn: p.paidOn } : {}), ...(p.note ? { note: p.note } : {}),
                          })}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Payslip">
                          <FileText size={14} />
                        </button>
                        {m && (
                          <button onClick={() => printEmployeeJoiningLetter(m, me?.name)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Joining letter">
                            <Users size={14} />
                          </button>
                        )}
                        {p.status === 'due' && (
                          <>
                            <button onClick={() => p.id && startEdit(p.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => p.id && setConfirmDel(p.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Remove"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
              {lines.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-neutral-400">
                  No pay lines for {period}. Press <b>Generate lines</b> to pull in everyone with a salary set,
                  or add one by hand.
                </td></tr>
              )}
            </TBody>
          </Table>
        </Card>

        {/* Who has no salary on record — the gap that makes payroll incomplete */}
        {staff.some((m) => !m.monthlySalaryPaise) && (
          <Card>
            <CardHeader title="No salary on record" subtitle="Set these in Team & Roles → Details before they can be paid" />
            <CardBody className="flex flex-wrap gap-1.5">
              {staff.filter((m) => !m.monthlySalaryPaise).map((m) => (
                <span key={m.uid} className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-100">{m.name}</span>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      {/* Add / edit a pay line */}
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit pay line' : 'Add pay line'}
        subtitle={period} onSubmit={save} submitLabel={editId ? 'Save line' : 'Add line'} submitDisabled={!valid}>
        <Field label="Employee" required>
          <Select value={f.uid} onChange={(e) => { const m = memberOf(e.target.value); setF({ ...f, uid: e.target.value, base: f.base || (m?.monthlySalaryPaise ? String(m.monthlySalaryPaise / 100) : '') }); }} disabled={!!editId}>
            <option value="">— select employee —</option>
            {staff.map((m) => <option key={m.uid} value={m.uid}>{m.name} · {m.designation || roleLabel(m.role)}</option>)}
          </Select>
        </Field>
        <Row>
          <Field label="Basic salary (₹)" required hint="Pre-filled from their record"><TextInput type="number" value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} placeholder="25000" /></Field>
          <Field label="Incentive (₹)" hint="Bhatta / bonus"><TextInput type="number" value={f.incentive} onChange={(e) => setF({ ...f, incentive: e.target.value })} placeholder="0" /></Field>
        </Row>
        <Row>
          <Field label="Deductions (₹)"><TextInput type="number" value={f.deductions} onChange={(e) => setF({ ...f, deductions: e.target.value })} placeholder="0" /></Field>
          <Field label="Net pay" hint="auto"><TextInput value={preview ? rupees(preview) : '—'} disabled /></Field>
        </Row>
        <Field label="Note" hint="Shown on the payslip"><TextInput value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. 2 days leave without pay" /></Field>
      </Modal>

      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title="Remove pay line?" subtitle="It can be added again"
          onSubmit={() => { deletePayrollLine(confirmDel); setConfirmDel(null); }} submitLabel="Remove">
          <p className="text-sm text-neutral-600">This only removes the line from {period}. Nothing is paid or unpaid by it.</p>
        </Modal>
      )}
    </PartnerLayout>
  );
}
