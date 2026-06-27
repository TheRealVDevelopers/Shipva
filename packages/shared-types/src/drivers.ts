import type { AuditableBase, GeoPointWithAccuracy } from './primitives.js';
import type { VehicleType } from './vehicles.js';

export type DutyStatus = 'offline' | 'online' | 'on_job';
export type KycStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface Driver extends AuditableBase {
  uid: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleReg?: string;
  /** Launch zone the driver primarily serves (dispatch matches on this in v1). */
  zone: string;
  dutyStatus: DutyStatus;
  /** Last known location — mirrored from RTDB for list views. */
  lastLocation?: GeoPointWithAccuracy;
  ratingAvg: number;
  ratingCount: number;
  kycStatus: KycStatus;
  docsVerified: boolean;
}
