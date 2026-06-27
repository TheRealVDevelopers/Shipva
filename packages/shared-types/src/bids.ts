import type { AuditableBase, Paise } from './primitives.js';

export type BidStatus = 'active' | 'withdrawn' | 'won' | 'lost';
export type BidderType = 'driver' | 'transporter';

export interface Bid extends AuditableBase {
  bidId: string;
  /** A bid targets either an auction booking or a transporter load post. */
  bookingId?: string;
  loadPostId?: string;
  bidderId: string;
  bidderType: BidderType;
  bidderSnapshot: { name: string; ratingAvg?: number };
  amountPaise: Paise;
  status: BidStatus;
}
