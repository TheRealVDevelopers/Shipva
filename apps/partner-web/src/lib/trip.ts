/**
 * Trip timeline helpers — turn a trip's stops into an ordered list of live
 * status steps that the in-charge worker advances one at a time, and map that
 * progress back to the coarse `TripStatus` used elsewhere (badges, LR, KPIs).
 */
import type { Trip, TripPoint, TripStatus } from './mocks.js';

export interface TimelineStep {
  key: string;
  label: string;
  /** Sub-label (e.g. the point name). */
  place?: string;
  /** Index into trip.points this step corresponds to, if any. */
  pointIndex?: number;
}

/** The ordered stops for a trip — from explicit points, else derived from from/to. */
export function tripPoints(t: Trip): TripPoint[] {
  if (t.points && t.points.length >= 2) return t.points;
  return [{ label: t.from }, { label: t.to }];
}

/**
 * Full status timeline for a trip:
 *   Driver assigned → Heading to pickup → At pickup → [each point] → Trip finished
 */
export function tripSteps(t: Trip): TimelineStep[] {
  const pts = tripPoints(t);
  const steps: TimelineStep[] = [
    { key: 'assigned', label: 'Driver assigned' },
    { key: 'to_pickup', label: 'Heading to pickup', place: pts[0]!.label },
  ];
  pts.forEach((p, i) => {
    const label = i === 0 ? 'At pickup' : i === pts.length - 1 ? 'At drop' : `Point ${i}`;
    steps.push({ key: `p${i}`, label, place: p.label, pointIndex: i });
  });
  steps.push({ key: 'finished', label: 'Trip finished' });
  return steps;
}

/** Clamp helper — a trip's current step, defaulting to 0 (just assigned). */
export function currentStep(t: Trip): number {
  const max = tripSteps(t).length - 1;
  return Math.min(Math.max(t.stepIndex ?? 0, 0), max);
}

/** Map a timeline position onto the coarse TripStatus used across the app. */
export function statusFromStep(steps: TimelineStep[], idx: number): TripStatus {
  const key = steps[idx]?.key;
  if (key === 'assigned') return 'assigned';
  if (key === 'finished') return 'closed';
  if (key === 'to_pickup' || key === 'p0') return 'loading';
  if (idx >= steps.length - 2) return 'at_drop';
  return 'in_transit';
}

/** 0–100 progress for the little bars / moving truck. */
export function progressPct(steps: TimelineStep[], idx: number): number {
  if (steps.length <= 1) return 0;
  return Math.round((idx / (steps.length - 1)) * 100);
}

const VR_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
/** Amazon-relay-style run id, e.g. "204KJ7HB9" (3 digits + 6 alphanumerics). */
export function genVrId(): string {
  const d = () => String(Math.floor(Math.random() * 10));
  const c = () => {
    const pool = VR_ALPHA + '0123456789';
    return pool[Math.floor(Math.random() * pool.length)];
  };
  return `${d()}${d()}${d()}${c()}${c()}${c()}${c()}${c()}${c()}`;
}
