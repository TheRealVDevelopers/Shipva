import { describe, it, expect } from 'vitest';
import { stopControls } from '../src/lib/board.js';

/**
 * The client's ask: "give Check IN option to each stop separately, for HKA3,
 * for TBN8 and so on."
 *
 * The old build gated check-in to ONE cursor stop — the first undeparted stop
 * across every VRID — so HKA3 had a button and TBN8/TBQ9/TBR8 showed a dash.
 * These tests pin the new rule: each stop's controls depend only on that stop.
 */

const NONE = {};
const ARRIVED = { actualArrival: 1_700_000_000_000 };
const DONE = { actualArrival: 1_700_000_000_000, actualDeparture: 1_700_000_900_000 };

describe('stopControls — every stop checks in on its own', () => {
  it('offers Check in on a stop nobody has touched', () => {
    expect(stopControls(NONE).canCheckIn).toBe(true);
  });

  it('offers Check in on a LATER stop even though the first is untouched', () => {
    // The exact regression: HKA3 (stop 1) not checked in must NOT stop the POC
    // from checking in at TBN8 / TBQ9 / TBR8.
    const stops = [NONE, NONE, NONE, NONE];
    expect(stops.map((s) => stopControls(s).canCheckIn)).toEqual([true, true, true, true]);
  });

  it('lets stops be worked out of order — stop 3 in, stops 1 and 2 still open', () => {
    const stops = [NONE, NONE, ARRIVED, NONE];
    expect(stops.map((s) => stopControls(s).canCheckIn)).toEqual([true, true, false, true]);
    expect(stops.map((s) => stopControls(s).canCheckOut)).toEqual([false, false, true, false]);
  });

  it('hides Check in once that stop is checked in, and offers Check out instead', () => {
    expect(stopControls(ARRIVED)).toEqual({ canCheckIn: false, canCheckOut: true });
  });

  it('offers neither once the stop is checked out', () => {
    expect(stopControls(DONE)).toEqual({ canCheckIn: false, canCheckOut: false });
  });

  it('never offers Check out before Check in — a departure with no arrival is meaningless', () => {
    expect(stopControls(NONE).canCheckOut).toBe(false);
  });

  it('a fully finished stop does not re-open for check-in', () => {
    const stops = [DONE, DONE, NONE];
    expect(stops.map((s) => stopControls(s).canCheckIn)).toEqual([false, false, true]);
  });
});
