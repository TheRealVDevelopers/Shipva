import type { AuditableBase, Address } from './primitives.js';

export interface Customer extends AuditableBase {
  uid: string;
  name: string;
  phone: string;
  savedAddresses: Address[];
  referralCode: string;
  ratingAvg?: number;
  ratingCount?: number;
}
