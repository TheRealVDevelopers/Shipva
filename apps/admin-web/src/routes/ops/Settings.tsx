import { MapPin, IndianRupee, MessageCircle, Bell, CheckCircle2, Circle } from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { VEHICLE_TYPES } from '@shipva/shared-types';
import { estimateFarePaise } from '@shipva/shared-logic';
import { ZONES } from '../../lib/mocks.js';
import { rupees } from '../../lib/format.js';

export function Settings() {
  return (
    <OpsLayout title="Settings" subtitle="Zones, fares, and integrations">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Launch zones" subtitle="Density over spread — own these corridors first" />
          <CardBody className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <span key={z} className="inline-flex items-center gap-1.5 rounded-md bg-neutral-50 ring-1 ring-inset ring-neutral-200 px-3 py-1.5 text-sm text-neutral-700">
                <MapPin size={12} className="text-primary-500" /> {z}
              </span>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fare card" subtitle="Base + per-km by vehicle (example: 8 km trip)" action={<span className="flex items-center gap-1 text-xs text-neutral-500"><IndianRupee size={11} /> editable in Phase 1</span>} />
          <CardBody className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VEHICLE_TYPES.map((v) => (
              <div key={v.type} className="rounded-md ring-1 ring-inset ring-neutral-200 p-3">
                <div className="text-sm font-medium text-neutral-900">{v.label}</div>
                <div className="text-xs text-neutral-500">up to {v.capacityKg} kg</div>
                <div className="mt-2 text-lg font-semibold text-primary-700">{rupees(estimateFarePaise(v.type, 8))}</div>
                <div className="text-[10px] text-neutral-400">est. for 8 km</div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Integrations" subtitle="What's wired vs pending" />
          <CardBody className="space-y-2.5">
            <Row label="Firebase Auth (phone OTP)" done={false} note="customer/driver sign-in" />
            <Row label="Cloud Functions — booking & auction loop" done note="createBooking, acceptBooking, placeBid, chooseWinner" />
            <Row label="WhatsApp BSP (CTWA)" done={false} note="needs Meta verification + templates" />
            <Row label="FCM push to drivers" done={false} note="zone+vehicle topics" />
            <Row label="Google Maps / Mappls" done={false} note="Places + Distance Matrix" />
            <Row label="Firestore security rules" done note="deny-by-default, written" icon={<Bell size={12} />} />
          </CardBody>
        </Card>
      </div>
    </OpsLayout>
  );
}

function Row({ label, done, note }: { label: string; done?: boolean; note?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md ring-1 ring-inset ring-neutral-200 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        {done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-neutral-300" />}
        <div>
          <div className="text-sm font-medium text-neutral-900">{label}</div>
          {note && <div className="text-xs text-neutral-500">{note}</div>}
        </div>
      </div>
      <Badge tone={done ? 'success' : 'neutral'}>{done ? 'wired' : 'pending'}</Badge>
    </div>
  );
}
