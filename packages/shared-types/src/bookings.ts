import type { AuditableBase, GeoPoint, Paise } from './primitives.js';
import type { VehicleType } from './vehicles.js';

export type BookingType = 'instant' | 'auction';
export type BookingSource = 'app' | 'whatsapp';
export type TripType = 'intercity' | 'outstation';

/**
 * Booking lifecycle. Instant bookings go requested → searching → assigned …;
 * auctions go requested → bidding → awarded → assigned …. The legal-transition
 * map lives in `@ground/shared-logic` (`isLegalBookingTransition`).
 */
export type BookingStatus =
  | 'requested'
  | 'searching'
  | 'bidding'
  | 'awarded'
  | 'assigned'
  | 'arrived'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'expired'
  | 'closed';

export interface BookingPlace {
  address: string;
  geo: GeoPoint;
  contactName?: string;
  contactPhone?: string;
}

export interface PartySnapshot {
  id: string;
  name: string;
  phone: string;
  ratingAvg?: number;
}

export interface Booking extends AuditableBase {
  bookingId: string;
  type: BookingType;
  source: BookingSource;
  tripType: TripType;
  customerId: string;
  customerSnapshot: PartySnapshot;
  pickup: BookingPlace;
  drop: BookingPlace;
  vehicleType: VehicleType;
  zone: string;
  distanceKm?: number;
  status: BookingStatus;
  // instant
  farePaise?: Paise;
  // auction
  basePricePaise?: Paise;
  auctionClosesAt?: string;
  winningBidId?: string;
  bidCount?: number;
  // assignment
  assignedDriverId?: string;
  driverSnapshot?: PartySnapshot;
  /** Signed tracking token for the public no-auth tracking page. */
  trackingToken?: string;
}
