import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type {
  Booking, BookingPlace, BookingSource, BookingType, TripType, VehicleType,
} from '@shipva/shared-types';
import { estimateFarePaise, suggestedBasePricePaise } from '@shipva/shared-logic';
import { db } from '../admin.js';
import { requireAuth } from '../lib/authz.js';

/**
 * Create a booking — instant (alert nearby drivers) or auction (open bidding).
 * Server computes the fare/floor; the client never sets price.
 */
export const createBooking = onCall<{
  type: BookingType;
  tripType: TripType;
  source?: BookingSource;
  vehicleType: VehicleType;
  zone: string;
  pickup: BookingPlace;
  drop: BookingPlace;
  distanceKm: number;
  auctionMinutes?: number;
}>(async (req) => {
  const { uid } = requireAuth(req);
  const d = req.data;
  if (!d?.type || !d.vehicleType || !d.zone || !d.pickup || !d.drop) {
    throw new HttpsError('invalid-argument', 'type, vehicleType, zone, pickup and drop are required.');
  }

  const ref = db.collection('bookings').doc();
  const nowIso = new Date().toISOString();
  const token = req.auth!.token as { name?: string; phone_number?: string };
  const km = d.distanceKm ?? 0;
  const isInstant = d.type === 'instant';

  const farePaise = isInstant ? estimateFarePaise(d.vehicleType, km) : undefined;
  const basePricePaise = isInstant ? undefined : suggestedBasePricePaise(d.vehicleType, km);
  const auctionClosesAt = isInstant
    ? undefined
    : new Date(Date.now() + (d.auctionMinutes ?? 180) * 60_000).toISOString();

  const booking: Booking = {
    bookingId: ref.id,
    type: d.type,
    source: d.source ?? 'app',
    tripType: d.tripType ?? 'intercity',
    customerId: uid,
    customerSnapshot: { id: uid, name: token.name ?? 'Customer', phone: token.phone_number ?? '' },
    pickup: d.pickup,
    drop: d.drop,
    vehicleType: d.vehicleType,
    zone: d.zone,
    distanceKm: km,
    status: isInstant ? 'searching' : 'bidding',
    createdAt: nowIso,
    createdBy: uid,
    updatedAt: nowIso,
    updatedBy: uid,
    ...(farePaise !== undefined ? { farePaise } : {}),
    ...(basePricePaise !== undefined ? { basePricePaise } : {}),
    ...(auctionClosesAt !== undefined ? { auctionClosesAt } : {}),
    ...(isInstant ? {} : { bidCount: 0 }),
  };

  await ref.set(booking);
  // TODO: fan-out FCM to topic `zone_${zone}_${vehicleType}` for instant bookings.
  return {
    ok: true,
    bookingId: ref.id,
    farePaise: farePaise ?? null,
    basePricePaise: basePricePaise ?? null,
  };
});
