import type { BookingStatus } from '@shipva/shared-types';

const MAP: Record<BookingStatus, { label: string; cls: string }> = {
  requested: { label: 'Requested', cls: 'bg-neutral-100 text-neutral-600' },
  searching: { label: 'Finding driver', cls: 'bg-amber-100 text-amber-700' },
  bidding: { label: 'Bidding open', cls: 'bg-orange-100 text-orange-700' },
  awarded: { label: 'Awarded', cls: 'bg-sky-100 text-sky-700' },
  assigned: { label: 'Driver assigned', cls: 'bg-sky-100 text-sky-700' },
  arrived: { label: 'At pickup', cls: 'bg-primary-50 text-primary-700' },
  picked_up: { label: 'Picked up', cls: 'bg-primary-50 text-primary-700' },
  in_transit: { label: 'On the way', cls: 'bg-primary-50 text-primary-700' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700' },
  expired: { label: 'Expired', cls: 'bg-rose-100 text-rose-700' },
  closed: { label: 'Closed', cls: 'bg-neutral-100 text-neutral-600' },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const m = MAP[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}
