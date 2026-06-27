/**
 * Cross-cutting primitives used by every collection.
 * Timestamp shape is intentionally minimal — both `Date` (server) and
 * Firestore `Timestamp` satisfy `{ toMillis(): number }` at runtime, and
 * we never compare them directly in shared code.
 */

export type ISODateString = string;
export type YearMonth = `${number}-${number}`;
export type DateOnly = `${number}-${number}-${number}`;

export type IndianStateCode =
  | 'KA' | 'TN' | 'MH' | 'DL' | 'KL' | 'AP' | 'TS' | 'GJ' | 'RJ' | 'UP'
  | 'WB' | 'BR' | 'PB' | 'HR' | 'MP' | 'OD' | 'JH' | 'CT' | 'AS' | 'GA'
  | 'HP' | 'JK' | 'UK' | 'ML' | 'MN' | 'TR' | 'NL' | 'AR' | 'MZ' | 'SK'
  | 'AN' | 'CH' | 'DN' | 'LD' | 'PY' | 'LA';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoPointWithAccuracy extends GeoPoint {
  accuracy?: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: IndianStateCode;
  pincode: string;
  landmark?: string;
}

export interface StorageRef {
  bucket?: string;
  path: string;
}

export interface ServerTimestamp {
  /** Server-side `serverTimestamp()` — replaced by FieldValue sentinel on write. */
  __server: true;
}

/** Generic auditable base — every top-level collection extends this. */
export interface AuditableBase {
  createdAt: ISODateString;
  createdBy: string; // uid or 'system'
  updatedAt: ISODateString;
  updatedBy: string;
  deletedAt?: ISODateString;
  deletedBy?: string;
}

/** Money is always integer paise to avoid float drift. */
export type Paise = number;

export interface MoneyINR {
  amountPaise: Paise;
  currency: 'INR';
}
