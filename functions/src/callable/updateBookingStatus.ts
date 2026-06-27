import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { Booking, BookingStatus } from '@ground/shared-types';
import { isLegalBookingTransition } from '@ground/shared-logic';
import { db } from '../admin.js';
import { requireAuth } from '../lib/authz.js';

/**
 * The only path that mutates `booking.status` post-assignment (arrived,
 * picked_up, in_transit, delivered, closed, cancelled). Validated against the
 * shared FSM so client and server never disagree.
 */
export const updateBookingStatus = onCall<{
  bookingId: string;
  toStatus: BookingStatus;
}>(async (req) => {
  const { uid } = requireAuth(req);
  const { bookingId, toStatus } = req.data;
  if (!bookingId || !toStatus) {
    throw new HttpsError('invalid-argument', 'bookingId and toStatus are required.');
  }

  const ref = db.collection('bookings').doc(bookingId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Booking does not exist.');
    const b = snap.data() as Booking;
    if (!isLegalBookingTransition(b.status, toStatus, b.type)) {
      throw new HttpsError(
        'failed-precondition',
        `Illegal transition ${b.status} → ${toStatus} for ${b.type}.`,
      );
    }
    tx.update(ref, { status: toStatus, updatedAt: new Date().toISOString(), updatedBy: uid });
  });

  return { ok: true };
});
