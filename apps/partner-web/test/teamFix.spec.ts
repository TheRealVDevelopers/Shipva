import { describe, it, expect } from 'vitest';
import { teamFix } from '../src/lib/board.js';

/**
 * The month-old fault: a team leader cannot see runs assigned to their own POCs.
 *
 * `leaderUid` is copied onto a run when it is assigned and never refreshes, so a
 * run given to a POC BEFORE that POC was placed under a leader keeps pointing at
 * the team they were in then. This is not merely a filtered row — the Firestore
 * rules serve a run only when its ownerUid or leaderUid is the reader's, so the
 * leader is denied it outright. No query can recover it; the pointer must be
 * corrected. teamFix decides which runs need correcting, and to what.
 */

const TL = 'leader1';
const POC = 'poc1';
// Current org chart: POC reports to TL; the TL reports to the owner.
const teamOfOwner = (uid: string) =>
  uid === POC ? TL : uid === TL ? TL : undefined;

describe('teamFix', () => {
  it('re-files a POC’s run that still points at their old team', () => {
    // The reported case: assigned when the POC had no leader, so it carried
    // their own uid and the leader was denied it.
    expect(teamFix({ id: 'r1', ownerUid: POC, leaderUid: POC }, teamOfOwner)).toBe(TL);
  });

  it('re-files a run pointing at a completely different leader', () => {
    expect(teamFix({ id: 'r1', ownerUid: POC, leaderUid: 'someOtherLeader' }, teamOfOwner)).toBe(TL);
  });

  it('re-files a run that has no team pointer at all', () => {
    expect(teamFix({ id: 'r1', ownerUid: POC }, teamOfOwner)).toBe(TL);
  });

  it('leaves a correctly filed run alone', () => {
    expect(teamFix({ id: 'r1', ownerUid: POC, leaderUid: TL }, teamOfOwner)).toBeNull();
  });

  it("leaves a leader's own run alone — it already points at their own team", () => {
    expect(teamFix({ id: 'r1', ownerUid: TL, leaderUid: TL }, teamOfOwner)).toBeNull();
  });

  it('does not guess when the owner is no longer on the team', () => {
    expect(teamFix({ id: 'r1', ownerUid: 'departed', leaderUid: 'old' }, teamOfOwner)).toBeNull();
  });

  it('skips archived and unsaved runs', () => {
    expect(teamFix({ id: 'r1', ownerUid: POC, leaderUid: POC, archived: true }, teamOfOwner)).toBeNull();
    expect(teamFix({ ownerUid: POC, leaderUid: POC }, teamOfOwner)).toBeNull();
  });

  it('skips a run with no owner', () => {
    expect(teamFix({ id: 'r1', leaderUid: POC }, teamOfOwner)).toBeNull();
  });

  it('fixes a whole backlog in one sweep', () => {
    const runs = [
      { id: 'a', ownerUid: POC, leaderUid: POC },
      { id: 'b', ownerUid: POC, leaderUid: TL },
      { id: 'c', ownerUid: POC },
      { id: 'd', ownerUid: TL, leaderUid: TL },
    ];
    expect(runs.map((r) => teamFix(r, teamOfOwner))).toEqual([TL, null, TL, null]);
  });
});
