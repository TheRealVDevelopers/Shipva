import { Badge, type BadgeTone } from './Badge.js';
import type { BookingStatus, DutyStatus, KycStatus, VerifyStatus } from '@shipva/shared-types';

const BOOKING_MAP: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  requested: { label: 'Requested', tone: 'neutral' },
  searching: { label: 'Searching', tone: 'warning' },
  bidding: { label: 'Bidding', tone: 'accent' },
  awarded: { label: 'Awarded', tone: 'info' },
  assigned: { label: 'Assigned', tone: 'info' },
  arrived: { label: 'At pickup', tone: 'primary' },
  picked_up: { label: 'Picked up', tone: 'primary' },
  in_transit: { label: 'In transit', tone: 'primary' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  expired: { label: 'Expired', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const m = BOOKING_MAP[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

const DUTY_MAP: Record<DutyStatus, { label: string; tone: BadgeTone }> = {
  on_job: { label: 'On job', tone: 'accent' },
  online: { label: 'Online', tone: 'success' },
  offline: { label: 'Offline', tone: 'neutral' },
};

export function DutyBadge({ status }: { status: DutyStatus }) {
  const m = DUTY_MAP[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

const KYC_MAP: Record<KycStatus, { label: string; tone: BadgeTone }> = {
  verified: { label: 'KYC verified', tone: 'success' },
  pending: { label: 'KYC pending', tone: 'warning' },
  rejected: { label: 'KYC rejected', tone: 'danger' },
  expired: { label: 'KYC expired', tone: 'danger' },
};

export function KycBadge({ status }: { status: KycStatus }) {
  const m = KYC_MAP[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

const VERIFY_MAP: Record<VerifyStatus, { label: string; tone: BadgeTone }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export function VerifyBadge({ status }: { status: VerifyStatus }) {
  const m = VERIFY_MAP[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
