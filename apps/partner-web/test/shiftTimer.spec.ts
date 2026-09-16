import { describe, it, expect } from 'vitest';
import {
  shiftElapsedMs, shiftProgress, isOvertime, fmtShiftClock, fmtShiftRemaining,
  SHIFT_TARGET_MS, type Activity,
} from '../src/lib/activity.js';

/**
 * The dashboard's 9-hour shift clock: a continuous, real-time timer showing
 * how far into (or past) a 9-hour shift each employee is.
 */

const H = 3600_000;
const act = (p: Partial<Activity>): Activity => ({
  uid: 'u', name: 'X', date: '2026-09-16', firstAtMs: 0, lastAtMs: 0, activeMs: 0, onBreak: false, ...p,
});

describe('shiftElapsedMs', () => {
  it('is the wall-clock time since clock-in', () => {
    const a = act({ firstAtMs: 1000, lastAtMs: 1000 + 2 * H });
    expect(shiftElapsedMs(a, 1000 + 2 * H)).toBe(2 * H);
  });

  it('keeps running through a break — a shift is not only active time', () => {
    const a = act({ firstAtMs: 1000, lastAtMs: 1000 + 1 * H, onBreak: true });
    // Still "present" (break is not offline), so it ticks to now.
    expect(shiftElapsedMs(a, 1000 + 3 * H)).toBe(3 * H);
  });

  it('freezes once presence reads offline — a forgotten tab can’t inflate the shift', () => {
    // lastAtMs far behind real Date.now() means presence() reads offline
    // regardless of the fabricated nowMs passed in.
    const a = act({ firstAtMs: 1000, lastAtMs: 1000 + 2 * H });
    expect(shiftElapsedMs(a, 1000 + 20 * H)).toBe(2 * H);
  });

  it('is zero with no activity yet today (firstAtMs 0 is the "not started" sentinel)', () => {
    expect(shiftElapsedMs(null, Date.now())).toBe(0);
    expect(shiftElapsedMs(act({ firstAtMs: 0 }), Date.now())).toBe(0);
  });

  it('never goes negative', () => {
    const a = act({ firstAtMs: 5000, lastAtMs: 5000 });
    expect(shiftElapsedMs(a, 1000)).toBe(0);
  });
});

describe('shiftProgress / isOvertime', () => {
  it('is 0 at clock-in and 1 at exactly the target', () => {
    expect(shiftProgress(0)).toBe(0);
    expect(shiftProgress(SHIFT_TARGET_MS)).toBe(1);
  });

  it('caps at 1 past the target, for a progress bar that never overflows', () => {
    expect(shiftProgress(SHIFT_TARGET_MS + 5 * H)).toBe(1);
  });

  it('flags overtime only strictly past 9 hours', () => {
    expect(isOvertime(SHIFT_TARGET_MS)).toBe(false);
    expect(isOvertime(SHIFT_TARGET_MS + 1)).toBe(true);
    expect(isOvertime(8 * H)).toBe(false);
  });
});

describe('fmtShiftClock', () => {
  it('formats as H:MM:SS', () => {
    expect(fmtShiftClock(0)).toBe('0:00:00');
    expect(fmtShiftClock(90_000)).toBe('0:01:30');
    expect(fmtShiftClock(6 * H + 32 * 60_000 + 5_000)).toBe('6:32:05');
  });

  it('keeps counting past 9 hours rather than wrapping', () => {
    expect(fmtShiftClock(10 * H)).toBe('10:00:00');
  });
});

describe('fmtShiftRemaining', () => {
  it('counts down while short of the target', () => {
    expect(fmtShiftRemaining(7 * H)).toBe('2h 0m left');
  });

  it('switches to "over" once past the target', () => {
    expect(fmtShiftRemaining(SHIFT_TARGET_MS + 65 * 60_000)).toBe('+1h 5m over');
  });

  it('drops the hour when under 60 minutes either side', () => {
    expect(fmtShiftRemaining(SHIFT_TARGET_MS - 20 * 60_000)).toBe('20m left');
    expect(fmtShiftRemaining(SHIFT_TARGET_MS + 10 * 60_000)).toBe('+10m over');
  });
});
