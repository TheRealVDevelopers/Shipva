/** Vehicle categories a customer can book and a driver/transporter can serve. */
export type VehicleType =
  | 'bike'
  | 'auto'
  | 'mini_truck'
  | 'tempo'
  | 'pickup'
  | 'truck'
  | 'reefer';

export interface VehicleTypeInfo {
  type: VehicleType;
  label: string;
  capacityKg: number;
}

export const VEHICLE_TYPES: VehicleTypeInfo[] = [
  { type: 'bike', label: 'Bike', capacityKg: 20 },
  { type: 'auto', label: 'Auto', capacityKg: 500 },
  { type: 'mini_truck', label: 'Mini truck', capacityKg: 850 },
  { type: 'tempo', label: 'Tempo', capacityKg: 1500 },
  { type: 'pickup', label: 'Pickup', capacityKg: 2500 },
  { type: 'truck', label: 'Truck', capacityKg: 7000 },
  { type: 'reefer', label: 'Reefer', capacityKg: 6000 },
];
