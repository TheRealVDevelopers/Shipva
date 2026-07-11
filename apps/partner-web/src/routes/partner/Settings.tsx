import { useState } from 'react';
import { Building2, Fuel, BadgeCheck, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Field, TextInput } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { rupees } from '../../lib/format.js';
import { partner, subscription } from '../../lib/mocks.js';
import { useStore } from '../../lib/store.js';
import { BRAND } from '../../lib/brand.js';

export function Settings() {
  const { reset } = useStore();
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <PartnerLayout title="Settings" subtitle="Company, billing and preferences">
      <div className="max-w-3xl space-y-6">
        {/* Company */}
        <Card>
          <CardHeader title="Company profile" subtitle="Appears on invoices & LRs" action={<Building2 size={16} className="text-primary-500" />} />
          <CardBody>
            <form onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 1800); }} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Company name"><TextInput defaultValue={partner.company} /></Field>
                <Field label="Contact person"><TextInput defaultValue={partner.contact} /></Field>
                <Field label="GSTIN"><TextInput defaultValue={partner.gstin} /></Field>
                <Field label="Phone"><TextInput defaultValue={partner.phone} /></Field>
                <Field label="Operating region"><TextInput defaultValue={partner.region} /></Field>
                <Field label="Base city"><TextInput defaultValue="Bengaluru" /></Field>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" size="sm"><Save size={13} /> Save changes</Button>
                {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Fuel config */}
        <Card>
          <CardHeader title="Fuel & mileage" subtitle="Used for the leakage calculation" action={<Fuel size={16} className="text-accent-500" />} />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Default mileage (km/L)" hint="Expected fuel = distance ÷ mileage × rate"><TextInput type="number" defaultValue="4" /></Field>
              <Field label="Current diesel rate (₹/L)"><TextInput type="number" defaultValue="92" /></Field>
            </div>
          </CardBody>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader title="Subscription" subtitle={`Your ${BRAND.name} plan`} action={<BadgeCheck size={16} className="text-emerald-500" />} />
          <CardBody className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-neutral-600">Plan</span><span className="font-extrabold">{subscription.tier} · {rupees(subscription.pricePaise)}/mo</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-600">Driver slots</span><span className="font-semibold">{subscription.driversUsed}/{subscription.driverSlots}</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-600">Renews</span><span className="font-semibold">{subscription.renewalOn}</span></div>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-bold text-emerald-700"><ShieldCheck size={13} /> No commission — you keep 100% of freight</div>
          </CardBody>
        </Card>

        {/* Danger zone */}
        <Card className="ring-rose-200">
          <CardHeader title="Reset demo data" subtitle="Clears anything you created and restores the sample dataset" action={<RotateCcw size={16} className="text-rose-500" />} />
          <CardBody>
            {!confirm ? (
              <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>Reset demo data</Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-600">Are you sure? This can't be undone.</span>
                <Button variant="danger" size="sm" onClick={() => { reset(); setConfirm(false); }}>Yes, reset</Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-neutral-400">Demo data lives in your browser. Real per-transporter data lands with the backend (Phase B).</p>
          </CardBody>
        </Card>

        <p className="pb-4 text-center text-xs text-neutral-400">{BRAND.name} · {BRAND.tagline} — preview build</p>
      </div>
    </PartnerLayout>
  );
}
