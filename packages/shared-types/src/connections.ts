import type { AuditableBase } from './primitives.js';

export type ConnectionStatus = 'proposed' | 'accepted' | 'completed' | 'cancelled';

/** Links a load post and/or a truck post between two parties on the exchange. */
export interface Connection extends AuditableBase {
  connectionId: string;
  loadPostId?: string;
  truckPostId?: string;
  partyA: string;
  partyB: string;
  status: ConnectionStatus;
  ratingA?: number;
  ratingB?: number;
}
