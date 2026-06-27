import type { AuditableBase, Paise } from './primitives.js';
import type { VehicleType } from './vehicles.js';

export type PostStatus = 'open' | 'claimed' | 'connected' | 'expired' | 'cancelled';

/** A transporter posting a load that needs a truck. */
export interface LoadPost extends AuditableBase {
  loadPostId: string;
  transporterId: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  date: string;
  basePricePaise: Paise;
  status: PostStatus;
  claimedBy?: string;
  /** True when this is an empty return leg offered cheap. */
  isBackhaul: boolean;
}

/** A transporter posting an available truck looking for a load. */
export interface TruckPost extends AuditableBase {
  truckPostId: string;
  transporterId: string;
  vehicleId: string;
  vehicleType: VehicleType;
  location: string;
  availableDate: string;
  returnRoute?: string;
  status: PostStatus;
  claimedBy?: string;
}
