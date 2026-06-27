import { describe, expect, it } from 'vitest';
import { haversineDistanceMeters, isWithinGeofence } from '../geofence.js';

describe('geofence', () => {
  it('returns ~0 for identical points', () => {
    const p = { lat: 12.9716, lng: 77.5946 };
    expect(haversineDistanceMeters(p, p)).toBeLessThan(1);
  });

  it('approximates known distance (Bangalore MG Road to Indiranagar ~5km)', () => {
    const mg = { lat: 12.9756, lng: 77.6087 };
    const ind = { lat: 12.9719, lng: 77.6412 };
    const d = haversineDistanceMeters(mg, ind);
    expect(d).toBeGreaterThan(3_000);
    expect(d).toBeLessThan(5_000);
  });

  it('isWithinGeofence respects radius', () => {
    const center = { lat: 12.9716, lng: 77.5946 };
    const close = { lat: 12.9717, lng: 77.5947 };
    const far = { lat: 13.0, lng: 77.6 };
    expect(isWithinGeofence(close, center, 100)).toBe(true);
    expect(isWithinGeofence(far, center, 100)).toBe(false);
  });
});
