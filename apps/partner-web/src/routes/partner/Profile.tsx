import { Building2, Phone, MapPin, Star, FileCheck2, Pencil } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { VerifyBadge } from '../../components/ui/StatusBadge.js';
import { partner } from '../../lib/mocks.js';

export function Profile() {
  return (
    <PartnerLayout title="Profile" subtitle="Your identity on the platform">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700"><Building2 size={28} /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-neutral-900">{partner.company}</h2>
                <VerifyBadge status={partner.verifyStatus} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1"><MapPin size={12} /> {partner.region}</span>
                <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {partner.ratingAvg} ({partner.ratingCount})</span>
              </div>
            </div>
            <Button size="sm" variant="secondary"><Pencil size={12} /> Edit</Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Company details" />
          <CardBody className="grid gap-4 sm:grid-cols-2 text-sm">
            <Field label="Contact person" value={partner.contact} />
            <Field label="Phone" value={partner.phone} icon={<Phone size={12} />} />
            <Field label="Region / corridor" value={partner.region} />
            <Field label="GSTIN" value={partner.gstin} mono />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="KYC & documents" subtitle="Platform-level verification" />
          <CardBody className="space-y-2">
            {['GST certificate', 'Transport permit', 'PAN'].map((doc) => (
              <div key={doc} className="flex items-center justify-between rounded-lg ring-1 ring-inset ring-neutral-200 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-neutral-700"><FileCheck2 size={14} className="text-emerald-500" /> {doc}</span>
                <span className="text-xs font-bold text-emerald-700">Verified</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </PartnerLayout>
  );
}

function Field({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`mt-0.5 flex items-center gap-1.5 text-neutral-900 ${mono ? 'font-mono text-sm' : 'font-semibold'}`}>{icon} {value}</div>
    </div>
  );
}
