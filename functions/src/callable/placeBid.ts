import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { Booking, Driver } from '@ground/shared-types';
import { db } from '../admin.js';
import { requireAuth } from '../lib/authz.js';

/** Place a bid on an open auction booking. */
export const placeBid = onCall<{ bookingId: string; amountPaise: number }>(async (req) => {
  const { uid } = requireAuth(req);
  const { bookingId, amountPaise } = req.data;
  if (!bookingId || !(amountPaise > 0)) {
    throw new HttpsError('invalid-argument', 'bookingId and a positive amountPaise are required.');
  }

  const bidRef = db.collection('bids').doc();
  const bookingRef = db.collection('bookings').doc(bookingId);

  await db.runTransaction(async (tx) => {
    const bSnap = await tx.get(bookingRef);
    if (!bSnap.exists) throw new HttpsError('not-found', 'Booking does not exist.');
    const b = bSnap.data() as Booking;
    if (b.type !== 'auction' || b.status !== 'bidding') {
      throw new HttpsError('failed-precondition', 'Auction is not open for bids.');
    }
    if (b.auctionClosesAt && new Date(b.auctionClosesAt).getTime() < Date.now()) {
      throw new HttpsError('failed-precondition', 'Auction window has closed.');
    }

    const drvSnap = await tx.get(db.collection('drivers').doc(uid));
    const drv = drvSnap.exists ? (drvSnap.data() as Driver) : undefined;
    const nowIso = new Date().toISOString();

    tx.set(bidRef, {
      bidId: bidRef.id,
      bookingId,
      bidderId: uid,
      bidderType: 'driver',
      bidderSnapshot: { name: drv?.name ?? 'Bidder', ratingAvg: drv?.ratingAvg },
      amountPaise,
      status: 'active',
      createdAt: nowIso,
      createdBy: uid,
      updatedAt: nowIso,
      updatedBy: uid,
    });
    tx.update(bookingRef, { bidCount: (b.bidCount ?? 0) + 1, updatedAt: nowIso, updatedBy: uid });
  });

  return { ok: true, bidId: bidRef.id };
});
