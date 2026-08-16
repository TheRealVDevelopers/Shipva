import { describe, it, expect } from 'vitest';
import { freightOf, podAwaited, inLane, type BoardItem, type Lane } from '../src/lib/board.js';

/**
 * The client's report: "In trips module, active trips shows zero, but trips
 * exist." Their board is entirely Amazon tours; the tiles counted only ordinary
 * trips, so every one read zero while the list underneath showed the runs.
 *
 * These pin the two helpers the tiles now count with, across BOTH kinds.
 */

const item = (p: Partial<BoardItem> & { lane: Lane; kind: 'tour' | 'trip' }): BoardItem => ({
  id: 'x', code: 'T-1', vrids: [], startMs: 0, dateLabel: '', driver: '', driverNumber: '',
  vehicle: '', vehicleType: '', stops: [], legs: [], distanceLabel: '', ownerUid: 'u1',
  ownerName: 'POC', source: {} as never, ...p,
});

describe('freightOf', () => {
  it('reads a trip’s freight', () => {
    expect(freightOf(item({ kind: 'trip', lane: 'In Transit', source: { freightPaise: 250000 } as never }))).toBe(250000);
  });
  it('is zero for a tour — an Amazon run is priced through the vendor MIS, not per run', () => {
    expect(freightOf(item({ kind: 'tour', lane: 'In Transit', source: { legs: [] } as never }))).toBe(0);
  });
  it('is zero when a trip carries no freight figure', () => {
    expect(freightOf(item({ kind: 'trip', lane: 'Upcoming', source: {} as never }))).toBe(0);
  });
});

describe('podAwaited', () => {
  it('follows a trip’s status', () => {
    expect(podAwaited(item({ kind: 'trip', lane: 'In Transit', source: { status: 'pod_pending' } as never }))).toBe(true);
    expect(podAwaited(item({ kind: 'trip', lane: 'Completed', source: { status: 'closed' } as never }))).toBe(false);
  });
  it('counts a tour whose VR ID has no POD once it has started', () => {
    const src = { legs: [{ ops: { podGiven: true } }, { ops: { podGiven: false } }] } as never;
    expect(podAwaited(item({ kind: 'tour', lane: 'In Transit', source: src }))).toBe(true);
  });
  it('does not count a tour that has not started — it has not happened yet', () => {
    const src = { legs: [{ ops: {} }] } as never;
    expect(podAwaited(item({ kind: 'tour', lane: 'Upcoming', source: src }))).toBe(false);
  });
  it('clears once every VR ID has its POD', () => {
    const src = { legs: [{ ops: { podGiven: true } }, { ops: { podGiven: true } }] } as never;
    expect(podAwaited(item({ kind: 'tour', lane: 'Completed', source: src }))).toBe(false);
  });
});

describe('the Active tile counts tours as well as trips', () => {
  // The exact reported case: three upcoming Amazon runs, no ordinary trips.
  const board = [
    item({ kind: 'tour', lane: 'Upcoming', code: 'T-34FPN2436' }),
    item({ kind: 'tour', lane: 'Upcoming', code: 'T-34FPN1526' }),
    item({ kind: 'tour', lane: 'Upcoming', code: 'T-34FPC0967' }),
  ];
  it('reports 3 active, not 0', () => {
    expect(board.filter((i) => !inLane(i, 'Completed')).length).toBe(3);
  });
  it('excludes completed runs', () => {
    const withDone = [...board, item({ kind: 'tour', lane: 'Completed' })];
    expect(withDone.filter((i) => !inLane(i, 'Completed')).length).toBe(3);
  });
});
