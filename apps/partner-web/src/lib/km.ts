/**
 * Odometer arithmetic. Total KM is derived from the two readings, never typed.
 *
 * Rounded to two decimals: plain subtraction gave 39.3 - 10 = 29.299999999999997,
 * which was stored and shown in the Manual KM box exactly like that.
 * Returns null when either reading is blank or not a number.
 */
export function odometerSpan(startKm: string, endKm: string): number | null {
  if (!startKm.trim() || !endKm.trim()) return null;
  const a = Number(startKm), b = Number(endKm);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) * 100) / 100;
}
