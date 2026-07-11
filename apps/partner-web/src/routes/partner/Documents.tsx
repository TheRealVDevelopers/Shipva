import { FileCheck2, AlertTriangle, ShieldAlert, Upload } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { vehicleDocs } from '../../lib/mocks.js';
import { BRAND } from '../../lib/brand.js';

function statusOf(days: number): { label: string; tone: BadgeTone } {
  if (days < 0) return { label: 'Expired', tone: 'danger' };
  if (days <= 7) return { label: `${days}d left`, tone: 'danger' };
  if (days <= 30) return { label: `${days}d left`, tone: 'warning' };
  return { label: `${days}d left`, tone: 'success' };
}

export function Documents() {
  const sorted = [...vehicleDocs].sort((a, b) => a.dueInDays - b.dueInDays);
  const expired = vehicleDocs.filter((d) => d.dueInDays < 0).length;
  const soon = vehicleDocs.filter((d) => d.dueInDays >= 0 && d.dueInDays <= 30).length;
  const ok = vehicleDocs.filter((d) => d.dueInDays > 30).length;

  return (
    <PartnerLayout title="Documents" subtitle="Vehicle document vault & expiry tracking">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Documents" value={String(vehicleDocs.length)} hint="on file" tone="primary" icon={<FileCheck2 size={14} />} />
          <KpiCard label="Expired" value={String(expired)} hint="renew now" tone="danger" icon={<ShieldAlert size={14} />} />
          <KpiCard label="Expiring ≤30d" value={String(soon)} hint="act soon" tone="accent" icon={<AlertTriangle size={14} />} />
          <KpiCard label="Valid" value={String(ok)} hint="all good" tone="success" />
        </section>

        <Card>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">All documents · soonest first</h3>
            <Button size="sm"><Upload size={13} /> Upload document</Button>
          </div>
          <Table>
            <THead>
              <Tr><Th>Vehicle</Th><Th>Document</Th><Th>Expires</Th><Th>Status</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {sorted.map((d, i) => {
                const st = statusOf(d.dueInDays);
                return (
                  <Tr key={i}>
                    <Td className="font-mono text-xs font-bold text-neutral-900">{d.reg}</Td>
                    <Td className="font-semibold text-neutral-800">{d.doc}</Td>
                    <Td className="text-neutral-600">{d.expires}</Td>
                    <Td><Badge tone={st.tone}>{st.label}</Badge></Td>
                    <Td>
                      <button className={`text-xs font-bold ${d.dueInDays <= 30 ? 'text-primary-600 hover:text-primary-700' : 'text-neutral-400 hover:text-neutral-600'}`}>
                        {d.dueInDays <= 30 ? 'Renew' : 'View'}
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>

        <Card>
          <div className="flex items-start gap-3 px-5 py-4 text-sm text-neutral-600">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AlertTriangle size={16} /></span>
            <p>Keep RC, insurance, national permit, fitness, PUC and road-tax for every vehicle here. {BRAND.name} surfaces anything expiring within 30 days on your dashboard so a lapsed document never grounds a truck or invites a fine.</p>
          </div>
        </Card>
      </div>
    </PartnerLayout>
  );
}
