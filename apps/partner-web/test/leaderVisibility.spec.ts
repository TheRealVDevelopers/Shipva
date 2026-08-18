/**
 * What a Team Leader can see.
 *
 * A leader's view used to match `leaderUid` only. A run carries the team it was
 * created in, so a POC promoted to Team Leader kept runs pointing at their
 * FORMER leader — and as a leader they could no longer see their own routes at
 * all. Nandhini.V opened Trips to an empty board while the runs plainly existed.
 *
 * The query is now the union of "my team's work" and "work I hold myself".
 * These pin that rule, and the dedupe that a two-listener union needs.
 */
import { describe, it, expect } from 'vitest';

type Run = { id: string; ownerUid?: string; leaderUid?: string };

/** Mirror of the union a team leader now subscribes to. */
const leaderSees = (runs: Run[], uid: string): Run[] => {
  const byTeam = runs.filter((r) => r.leaderUid === uid);
  const byOwn = runs.filter((r) => r.ownerUid === uid);
  return [...new Map([...byTeam, ...byOwn].map((r) => [r.id, r])).values()];
};

/** Mirror of a supervisor's query — unchanged. */
const pocSees = (runs: Run[], uid: string) => runs.filter((r) => r.ownerUid === uid);

const TL = 'nandhini';
const OLD_TL = 'formerLeader';
const POC = 'poc1';

describe('team leader visibility', () => {
  it('sees runs belonging to their team', () => {
    const runs = [{ id: 'a', ownerUid: POC, leaderUid: TL }];
    expect(leaderSees(runs, TL).map((r) => r.id)).toEqual(['a']);
  });

  it('sees a run they own even when it still points at their former team', () => {
    // The exact reported case: promoted to leader, runs still filed under the
    // leader they used to report to.
    const runs = [{ id: 'a', ownerUid: TL, leaderUid: OLD_TL }];
    expect(leaderSees(runs, TL).map((r) => r.id)).toEqual(['a']);
  });

  it('is not empty for a promoted leader holding three routes', () => {
    const runs = [
      { id: 'T-34FPN2436', ownerUid: TL, leaderUid: OLD_TL },
      { id: 'T-34FPN1526', ownerUid: TL, leaderUid: OLD_TL },
      { id: 'T-34FPC0967', ownerUid: TL, leaderUid: OLD_TL },
    ];
    expect(leaderSees(runs, TL)).toHaveLength(3);
  });

  it('counts a run once when it is both theirs and their team’s', () => {
    const runs = [{ id: 'a', ownerUid: TL, leaderUid: TL }];
    expect(leaderSees(runs, TL)).toHaveLength(1);
  });

  it("never shows another team's work", () => {
    const runs = [{ id: 'a', ownerUid: 'someoneElse', leaderUid: 'otherTeam' }];
    expect(leaderSees(runs, TL)).toHaveLength(0);
  });

  it('leaves a supervisor seeing only what they own', () => {
    const runs = [
      { id: 'a', ownerUid: POC, leaderUid: TL },
      { id: 'b', ownerUid: TL, leaderUid: TL },
    ];
    expect(pocSees(runs, POC).map((r) => r.id)).toEqual(['a']);
  });
});
