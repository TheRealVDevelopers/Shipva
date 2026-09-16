import { describe, it, expect } from 'vitest';
import { applyDocChanges, type DocChangeLike } from '../src/lib/docSync.js';

/**
 * The real fix behind "the Amazon Tours board is completely slow": Firestore's
 * onSnapshot hands back the FULL result set on every single write to any
 * matching document, and watchToursFs/watchTrips used to re-parse every one of
 * them every time. applyDocChanges instead applies only what docChanges()
 * reports actually changed, onto a persistent Map -- so an unrelated write
 * doesn't force-reparse (and force React to reconcile) hundreds of unrelated
 * documents.
 */

type Rec = { id: string; n: number };
const fromSnap = (id: string, d: Record<string, unknown>): Rec => ({ id, n: d.n as number });
const change = (type: DocChangeLike['type'], id: string, n?: number): DocChangeLike => ({
  type, doc: { id, data: () => ({ n }) },
});

describe('applyDocChanges', () => {
  it('treats the first snapshot (all "added") as the initial load', () => {
    const byId = new Map<string, Rec>();
    const out = applyDocChanges(byId, [change('added', 'a', 1), change('added', 'b', 2)], fromSnap);
    expect(out.sort((x, y) => x.id.localeCompare(y.id))).toEqual([{ id: 'a', n: 1 }, { id: 'b', n: 2 }]);
  });

  it('only re-parses documents that actually changed', () => {
    const byId = new Map<string, Rec>([['a', { id: 'a', n: 1 }], ['b', { id: 'b', n: 2 }]]);
    let calls = 0;
    const counting = (id: string, d: Record<string, unknown>) => { calls++; return fromSnap(id, d); };
    applyDocChanges(byId, [change('modified', 'b', 99)], counting);
    expect(calls).toBe(1);
  });

  it('leaves an unrelated, unchanged document with the exact same object reference', () => {
    // This is what lets a React.memo'd row skip re-rendering even though the
    // outer array returned each time is a new array.
    const untouched: Rec = { id: 'a', n: 1 };
    const byId = new Map<string, Rec>([['a', untouched], ['b', { id: 'b', n: 2 }]]);
    const out = applyDocChanges(byId, [change('modified', 'b', 99)], fromSnap);
    const a = out.find((r) => r.id === 'a');
    expect(a).toBe(untouched); // reference equality, not just deep equality
  });

  it('applies a modification in place', () => {
    const byId = new Map<string, Rec>([['a', { id: 'a', n: 1 }]]);
    const out = applyDocChanges(byId, [change('modified', 'a', 42)], fromSnap);
    expect(out).toEqual([{ id: 'a', n: 42 }]);
  });

  it('removes a document that was deleted or fell out of the query', () => {
    const byId = new Map<string, Rec>([['a', { id: 'a', n: 1 }], ['b', { id: 'b', n: 2 }]]);
    const out = applyDocChanges(byId, [change('removed', 'a')], fromSnap);
    expect(out).toEqual([{ id: 'b', n: 2 }]);
  });

  it('accumulates across multiple calls, matching how snapshots actually arrive over time', () => {
    const byId = new Map<string, Rec>();
    applyDocChanges(byId, [change('added', 'a', 1)], fromSnap);
    applyDocChanges(byId, [change('added', 'b', 2)], fromSnap);
    const out = applyDocChanges(byId, [change('modified', 'a', 10), change('removed', 'b')], fromSnap);
    expect(out).toEqual([{ id: 'a', n: 10 }]);
  });

  it('mutates the same Map it was given, not a copy', () => {
    const byId = new Map<string, Rec>();
    applyDocChanges(byId, [change('added', 'a', 1)], fromSnap);
    expect(byId.has('a')).toBe(true);
    expect(byId.get('a')).toEqual({ id: 'a', n: 1 });
  });

  it('handles an empty change list (a metadata-only snapshot) as a no-op', () => {
    const byId = new Map<string, Rec>([['a', { id: 'a', n: 1 }]]);
    const out = applyDocChanges(byId, [], fromSnap);
    expect(out).toEqual([{ id: 'a', n: 1 }]);
  });
});
