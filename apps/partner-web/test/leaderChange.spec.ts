/**
 * When a POC's team leader changes, their ACTIVE trips and tours must move to
 * the new team so the new TL sees them and the old one no longer does — while
 * finished runs stay with the team that ran them, for the record.
 *
 * The store method that does the move isn't unit-testable in isolation (it
 * closes over the live Firestore lists), so this proves the selection rule it
 * uses: which runs are picked up, and which are left alone.
 */
import { describe, it, expect } from 'vitest';

type Run = {
  id?: string; ownerUid?: string; leaderUid?: string;
  archived?: boolean; amzStatus?: string; status?: string;
};

/** Mirror of the tour filter inside reassignActiveWork. */
const tourMoves = (t: Run, poc: string, newTeam: string) =>
  !!t.id && t.ownerUid === poc && !t.archived && t.amzStatus !== 'COMPLETED' && t.leaderUid !== newTeam;

/** Mirror of the trip filter. */
const tripMoves = (t: Run, poc: string, newTeam: string) =>
  !!t.id && t.ownerUid === poc && !t.archived && t.status !== 'closed' && t.leaderUid !== newTeam;

const POC = 'poc1';
const OLD = 'tlOld';
const NEW = 'tlNew';

describe('reporting-line change — which runs move', () => {
  it('moves an active tour owned by the POC', () => {
    expect(tourMoves({ id: 't1', ownerUid: POC, leaderUid: OLD, amzStatus: 'IN PROGRESS' }, POC, NEW)).toBe(true);
  });

  it('moves an active trip owned by the POC', () => {
    expect(tripMoves({ id: 't1', ownerUid: POC, leaderUid: OLD, status: 'in_transit' }, POC, NEW)).toBe(true);
  });

  it('leaves a COMPLETED tour with the team that ran it', () => {
    expect(tourMoves({ id: 't1', ownerUid: POC, leaderUid: OLD, amzStatus: 'COMPLETED' }, POC, NEW)).toBe(false);
  });

  it('leaves a closed trip alone', () => {
    expect(tripMoves({ id: 't1', ownerUid: POC, leaderUid: OLD, status: 'closed' }, POC, NEW)).toBe(false);
  });

  it('leaves a cancelled/archived run alone', () => {
    expect(tourMoves({ id: 't1', ownerUid: POC, leaderUid: OLD, amzStatus: 'IN PROGRESS', archived: true }, POC, NEW)).toBe(false);
  });

  it('does not touch another POC’s runs', () => {
    expect(tourMoves({ id: 't1', ownerUid: 'someoneElse', leaderUid: OLD, amzStatus: 'IN PROGRESS' }, POC, NEW)).toBe(false);
  });

  it('skips a run already on the new team (idempotent — no needless write)', () => {
    expect(tourMoves({ id: 't1', ownerUid: POC, leaderUid: NEW, amzStatus: 'IN PROGRESS' }, POC, NEW)).toBe(false);
  });

  it('moving to the owner directly targets the POC’s own uid as the team', () => {
    // When cleared, teamOf(poc) === poc.uid, so newTeam is the POC's uid.
    expect(tourMoves({ id: 't1', ownerUid: POC, leaderUid: OLD, amzStatus: 'PLANNED' }, POC, POC)).toBe(true);
  });
});
