import type { AuditableBase } from './primitives.js';

export type VerifyStatus = 'pending' | 'verified' | 'rejected';

export interface Transporter extends AuditableBase {
  transporterId: string;
  company: string;
  gstin?: string;
  contactPhone: string;
  zone: string;
  verifyStatus: VerifyStatus;
  ratingAvg: number;
  ratingCount: number;
  fleetSize?: number;
}
