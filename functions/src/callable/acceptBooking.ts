import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { Booking, Driver, PartySnapshot } from '@shipva/shared-types';
import { db } from '../admin.js';
import { requireAuth } from '../lib/authz.js';

/**
 * Driver accepts an instant booking. Race-safe: the transaction re-reads the
 * booking and only the FIRST driver whose write commits while status is still
 * 'searching' wins — everyone else gets failed-precondition.
 */
export const acceptBooking = onCall<{ bookingId: string }>(async (req) => {
  const { uid } = requireAuth(req);
  const { bookingId } = req.data;
  if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');

  const bookingRef = db.collection('bookings').doc(bookingId);
  const driverRef = db.collection('drivers').doc(uid);

  await db.runTransaction(async (tx) => {
    const [bSnap, dSnap] = await Promise.all([tx.get(bookingRef), tx.get(driverRef)]);
    if (!bSnap.exists) throw new HttpsError('not-found', 'Booking does not exist.');
    if (!dSnap.exists) throw new HttpsError('permission-denied', 'Not a registered driver.');

    const b = bSnap.data() as Booking;
    if (b.status !== 'searching') {
      throw new HttpsError('failed-precondition', 'Booking is no longer open.');
    }

    const drv = dSnap.data() as Driver;
    const snapshot: PartySnapshot = {
      id: uid, name: drv.name, phone: drv.phone, ratingAvg: drv.ratingAvg,
    };
    const nowIso = new Date().toISOString();
    tx.update(bookingRef, {
      status: 'assigned',
      assignedDriverId: uid,
      driverSnapshot: snapshot,
      updatedAt: nowIso,
      updatedBy: uid,
    });
    tx.update(driverRef, { dutyStatus: 'on_job', updatedAt: nowIso, updatedBy: uid });
  });

  return { ok: true };
});
