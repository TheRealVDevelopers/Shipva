import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { Bid, Booking } from '@ground/shared-types';
import { db } from '../admin.js';
import { requireAuth } from '../lib/authz.js';

/** Customer picks a winning bid; booking moves to 'awarded' (driver confirms next). */
export const chooseWinner = onCall<{ bookingId: string; bidId: string }>(async (req) => {
  const { uid } = requireAuth(req);
  const { bookingId, bidId } = req.data;
  if (!bookingId || !bidId) {
    throw new HttpsError('invalid-argument', 'bookingId and bidId are required.');
  }

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bidRef = db.collection('bids').doc(bidId);

  await db.runTransaction(async (tx) => {
    const [bSnap, bidSnap] = await Promise.all([tx.get(bookingRef), tx.get(bidRef)]);
    if (!bSnap.exists) throw new HttpsError('not-found', 'Booking does not exist.');
    if (!bidSnap.exists) throw new HttpsError('not-found', 'Bid does not exist.');

    const b = bSnap.data() as Booking;
    if (b.customerId !== uid) throw new HttpsError('permission-denied', 'Not your booking.');
    if (b.status !== 'bidding') throw new HttpsError('failed-precondition', 'Auction is not open.');

    const bid = bidSnap.data() as Bid;
    const nowIso = new Date().toISOString();
    tx.update(bookingRef, {
      status: 'awarded',
      winningBidId: bidId,
      assignedDriverId: bid.bidderId,
      updatedAt: nowIso,
      updatedBy: uid,
    });
    tx.update(bidRef, { status: 'won', updatedAt: nowIso, updatedBy: uid });
  });

  return { ok: true };
});
