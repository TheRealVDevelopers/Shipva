import { Check, Sparkles, ShieldCheck } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { subscription, PLANS } from '../../lib/mocks.js';
import { rupees } from '../../lib/format.js';

export function Subscription() {
  return (
    <PartnerLayout title="Subscription" subtitle="Flat monthly plan · no commission on any job">
      <div className="space-y-6">
        {/* current plan */}
        <Card>
          <CardHeader title="Current plan" subtitle="Your platform subscription" action={<Badge tone="success">Active</Badge>} />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-4">
              <Stat label="Tier" value={subscription.tier} />
              <Stat label="Price" value={`${rupees(subscription.pricePaise)}/mo`} />
              <Stat label="Driver slots" value={`${subscription.driversUsed} / ${subscription.driverSlots}`} />
              <Stat label="Renews on" value={subscription.renewalOn} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-primary-500" style={{ width: `${(subscription.driversUsed / subscription.driverSlots) * 100}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"><ShieldCheck size={13} /> No commission on any job — you keep 100% of what you earn.</div>
          </CardBody>
        </Card>

        {/* plans */}
        <div>
          <h2 className="mb-3 text-sm font-extrabold text-neutral-900">Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card key={p.tier} className={p.current ? 'ring-2 ring-primary-500' : ''}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-neutral-900">{p.tier}</span>
                    {p.current && <Badge tone="primary">Current</Badge>}
                    {!p.current && p.tier === 'Pro' && <Sparkles size={15} className="text-accent-500" />}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">{rupees(p.pricePaise)}<span className="text-sm font-medium text-neutral-400">/mo</span></div>
                  <div className="text-xs text-neutral-500">{p.blurb}</div>
                  <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Up to {p.drivers} drivers</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Load board + auctions</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Live tracking</li>
                    {p.features?.map((f) => <li key={f} className="flex items-center gap-2"><Check size={14} className="text-accent-500" /> {f}</li>)}
                  </ul>
                  <Button size="sm" variant={p.current ? 'secondary' : 'primary'} className="mt-4 w-full">
                    {p.current ? 'Manage billing' : `Upgrade to ${p.tier}`}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-primary-50 ring-primary-100">
          <CardBody className="flex items-center gap-3 text-sm text-primary-900">
            <Sparkles size={18} className="shrink-0 text-primary-500" />
            <span><span className="font-bold">Free until liquidity.</span> We don't charge into an empty board — your subscription starts only once real loads flow in your corridor.</span>
          </CardBody>
        </Card>
      </div>
    </PartnerLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-200">
      <div className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-0.5 text-base font-extrabold text-neutral-900">{value}</div>
    </div>
  );
}
