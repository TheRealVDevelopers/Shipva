/**
 * Incremental Firestore listener sync.
 *
 * `onSnapshot` on a query delivers the FULL current result set on every single
 * change to ANY matching document -- not a diff. `watchToursFs`/`watchTrips`
 * used to re-run their per-document parse (`fromSnap`) over every doc in the
 * snapshot every time, and hand the page a brand-new array every time too. On
 * a shared, company-wide board with hundreds of runs, that meant one person
 * checking in at a stop caused every OTHER viewer watching the board to
 * re-parse the entire dataset and re-render the entire list, on every single
 * write anyone made anywhere in it. That is the real, structural reason the
 * Amazon Tours board (800+ tours once leadership sees the whole company) kept
 * feeling "completely slow" even after the per-render memoisation pass.
 *
 * `applyDocChanges` uses Firestore's `snapshot.docChanges()` instead, which
 * lists only the documents that were actually added, modified or removed
 * since the last snapshot (the FIRST snapshot reports every matching document
 * as "added", so this also correctly handles the initial load -- no special
 * case needed). It updates a persistent `Map<id, T>` in place of re-parsing
 * everything, so:
 *  - `fromSnap` runs once per CHANGED document, not once per document that
 *    merely still exists.
 *  - Every document that did NOT change keeps the exact same object reference
 *    across snapshots, which is what lets a memoised/React.memo'd row skip
 *    re-rendering even though the outer list array is (necessarily) a new
 *    reference each time.
 */

export interface DocChangeLike {
  type: 'added' | 'modified' | 'removed';
  doc: { id: string; data: () => Record<string, unknown> };
}

/**
 * Mutates `byId` in place (the whole point -- a fresh Map every call would
 * throw away the reference-stability this exists to provide) and returns the
 * current values as an array, ready to hand to a React state setter.
 */
export function applyDocChanges<T>(
  byId: Map<string, T>,
  changes: DocChangeLike[],
  fromSnap: (id: string, data: Record<string, unknown>) => T,
): T[] {
  for (const change of changes) {
    if (change.type === 'removed') byId.delete(change.doc.id);
    else byId.set(change.doc.id, fromSnap(change.doc.id, change.doc.data()));
  }
  return [...byId.values()];
}
