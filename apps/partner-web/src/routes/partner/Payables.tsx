import { useState } from 'react';
import { Truck as TruckIcon, Phone, HandCoins, FileText, FileWarning, Download } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Row } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { useStore, todayLabel, type AttachedTruck } from '../../lib/store.js';
import { printAgreement } from '../../lib/agreement.js';

const AG_EMPTY = { effectiveFrom: '', durationMonths: '24', commission: '', notes: '' };

export function Payables() {
  const { attached, setAttachedAgreement } = useStore();
  const [agFor, setAgFor] = useState<AttachedTruck | null>(null);
  const [ag, setAg] = useState(AG_EMPTY);

  const totalDue = attached.reduce((s, a) => s + a.balancePaise, 0);
  const owing = attached.filter((a) => a.balancePaise > 0).length;
  const noAgreement = attached.filter((a) => !a.agreement).length;

  function openAgreement(a: AttachedTruck) {
    setAg({ effectiveFrom: todayLabel(), durationMonths: '24', commission: a.agreement?.commissionPct ? String(a.agreement.commissionPct) : '', notes: '' });
    setAgFor(a);
  }
  function saveAgreement(download: boolean) {
    if (!agFor) return;
    const agreement = {
      createdOn: todayLabel(), effectiveFrom: ag.effectiveFrom || todayLabel(),
      durationMonths: Number(ag.durationMonths) || 24,
      ...(ag.commission ? { commissionPct: Number(ag.commission) } : {}),
      ...(ag.notes ? { notes: ag.notes } : {}),
    };
    setAttachedAgreement(agFor.id, agreement);
    if (download) printAgreement('truck-owner', { name: agFor.owner, phone: agFor.phone }, agreement);
    setAgFor(null);
  }

  return (
    <PartnerLayout title="Payables" subtitle="Attached / market trucks, agreements & balances">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Attached trucks" value={String(attached.length)} hint="market vehicles" tone="primary" icon={<TruckIcon size={14} />} />
          <KpiCard label="Agreements pending" value={String(noAgreement)} hint="not created yet" tone="danger" icon={<FileWarning size={14} />} />
          <KpiCard label="Total payable" value={rupees(totalDue)} hint={`${owing} owed`} tone="accent" icon={<HandCoins size={14} />} />
          <KpiCard label="Trips (market)" value={String(attached.reduce((s, a) => s + a.trips, 0))} hint="via attached" tone="success" />
        </section>

        <Card>
          <CardHeader title="Truck-owner ledger" subtitle="Balances owed to attached vehicles"
            action={<Button size="sm"><HandCoins size={13} /> Record payment</Button>} />
          <Table>
            <THead>
              <Tr><Th>Owner</Th><Th>Vehicle</Th><Th className="text-right">Trips</Th><Th className="text-right">Balance</Th><Th>Agreement</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {attached.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <div className="font-semibold text-neutral-900">{a.owner}</div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400"><Phone size={10} /> {a.phone}</div>
                  </Td>
                  <Td className="font-mono text-xs text-neutral-700">{a.reg}</Td>
                  <Td className="text-right text-neutral-600">{a.trips}</Td>
                  <Td className="text-right">
                    {a.balancePaise > 0 ? <span className="font-bold text-neutral-900">{rupees(a.balancePaise)}</span> : <Badge tone="success">Settled</Badge>}
                  </Td>
                  <Td>
                    {a.agreement
                      ? <Badge tone="success"><FileText size={11} /> Active · {a.agreement.createdOn}</Badge>
                      : <Badge tone="danger"><FileWarning size={11} /> Not created</Badge>}
                  </Td>
                  <Td>
                    {a.agreement
                      ? <button onClick={() => printAgreement('truck-owner', { name: a.owner, phone: a.phone }, a.agreement!)} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><Download size={12} /> Download</button>
                      : <Button size="sm" onClick={() => openAgreement(a)}>Create agreement</Button>}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <div className="flex items-start gap-3 px-5 py-4 text-sm text-neutral-600">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><TruckIcon size={16} /></span>
            <p>Every attached (market) truck should have a signed <b className="text-neutral-800">attachment agreement</b> covering commission, payment cycle and duration. Vehicles without one are flagged above — create and download the agreement in one step.</p>
          </div>
        </Card>
      </div>

      {/* Create agreement */}
      <Modal open={!!agFor} onClose={() => setAgFor(null)} title={`Agreement · ${agFor?.owner ?? ''}`} subtitle="Vehicle attachment terms"
        onSubmit={() => saveAgreement(true)} submitLabel="Create & download">
        <Row>
          <Field label="Effective from"><TextInput value={ag.effectiveFrom} onChange={(e) => setAg({ ...ag, effectiveFrom: e.target.value })} placeholder="01 Jul 2026" /></Field>
          <Field label="Duration (months)"><TextInput type="number" value={ag.durationMonths} onChange={(e) => setAg({ ...ag, durationMonths: e.target.value })} placeholder="24" /></Field>
        </Row>
        <Field label="Commission (%)" hint="Your margin retained per trip"><TextInput type="number" value={ag.commission} onChange={(e) => setAg({ ...ag, commission: e.target.value })} placeholder="8" /></Field>
        <Field label="Special terms" hint="Optional"><TextInput value={ag.notes} onChange={(e) => setAg({ ...ag, notes: e.target.value })} placeholder="Weekly settlement, diesel on actuals" /></Field>
        <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-[11px] text-primary-800 ring-1 ring-inset ring-primary-100">
          <span>Generates a PDF you can print &amp; sign.</span>
          <button type="button" onClick={() => saveAgreement(false)} className="font-bold text-primary-700 hover:underline">Save without download</button>
        </div>
      </Modal>
    </PartnerLayout>
  );
}
