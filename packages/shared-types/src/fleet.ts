import type { AuditableBase } from './primitives.js';
import type { VehicleType } from './vehicles.js';

export interface FleetVehicle extends AuditableBase {
  vehicleId: string;
  transporterId: string;
  type: VehicleType;
  capacityKg: number;
  regNo: string;
  status: 'available' | 'on_trip' | 'maintenance';
}

export interface FleetDriver extends AuditableBase {
  fleetDriverId: string;
  transporterId: string;
  name: string;
  licenceNo: string;
  phone: string;
  status: 'available' | 'on_trip' | 'off';
}
