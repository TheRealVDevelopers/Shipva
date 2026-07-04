import type { VehicleType, Paise } from '@shipva/shared-types';

/**
 * v1 fare model: flat base + per-km, by vehicle type, with an optional surge
 * multiplier. Deliberately simple and transparent — the auction's suggested
 * base price is derived from the same numbers so auctions actually fill.
 * All values in paise.
 */
const BASE_FARE_PAISE: Record<VehicleType, Paise> = {
  bike: 2500,
  auto: 4000,
  mini_truck: 9000,
  tempo: 13000,
  pickup: 18000,
  truck: 35000,
  reefer: 45000,
};

const PER_KM_PAISE: Record<VehicleType, Paise> = {
  bike: 800,
  auto: 1200,
  mini_truck: 2200,
  tempo: 2800,
  pickup: 3500,
  truck: 5500,
  reefer: 7000,
};

export function estimateFarePaise(
  vehicleType: VehicleType,
  distanceKm: number,
  surgeMultiplier = 1,
): Paise {
  const base = BASE_FARE_PAISE[vehicleType];
  const perKm = PER_KM_PAISE[vehicleType];
  const km = Math.max(0, distanceKm);
  return Math.round((base + perKm * km) * surgeMultiplier);
}

/** Suggested auction floor — 10% under the instant estimate to invite bids. */
export function suggestedBasePricePaise(
  vehicleType: VehicleType,
  distanceKm: number,
): Paise {
  return Math.round(estimateFarePaise(vehicleType, distanceKm) * 0.9);
}
