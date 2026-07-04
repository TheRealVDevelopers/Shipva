import type { BookingStatus, BookingType } from '@shipva/shared-types';

/**
 * The booking finite-state machine. This is the ONLY definition of which
 * status transitions are legal — both the server (callable guards) and the
 * client (button enabling) import it so they never disagree.
 */
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  requested: ['searching', 'bidding', 'cancelled', 'expired'],
  searching: ['assigned', 'cancelled', 'expired'],
  bidding: ['awarded', 'cancelled', 'expired'],
  awarded: ['assigned', 'cancelled', 'expired'],
  assigned: ['arrived', 'cancelled'],
  arrived: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['closed'],
  cancelled: [],
  expired: [],
  closed: [],
};

export function isLegalBookingTransition(
  from: BookingStatus,
  to: BookingStatus,
  type: BookingType,
): boolean {
  if (!(NEXT[from] ?? []).includes(to)) return false;
  // Instant bookings never enter the auction path, and vice-versa.
  if (type === 'instant' && (to === 'bidding' || to === 'awarded')) return false;
  if (type === 'auction' && to === 'searching') return false;
  return true;
}

/** Statuses where the booking is still live (for "active" filters). */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'requested', 'searching', 'bidding', 'awarded',
  'assigned', 'arrived', 'picked_up', 'in_transit',
];

export function isActiveBooking(status: BookingStatus): boolean {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}
