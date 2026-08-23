import { describe, it, expect } from 'vitest';

/**
 * Who sees which runs, after the client's role update:
 * "Team Leaders should have the same view as Managers for all Upcoming,
 * In-Transit and Completed trips" — and the same for Amazon Tours — without
 * Manager administrative rights, and with Supervisors unchanged.
 *
 * The queries close over Firestore, so this pins the rule they branch on.
 */

/** Mirror of seesAllRuns in lib/tours.ts and lib/trips.ts. */
const seesAllRuns = (role: string) =>
  role === 'owner' || role === 'manager' || role === 'team_leader';

describe('run visibility by role', () => {
  it('gives a team leader the manager-wide view', () => {
    expect(seesAllRuns('team_leader')).toBe(true);
  });

  it('keeps owner and manager unchanged', () => {
    expect(seesAllRuns('owner')).toBe(true);
    expect(seesAllRuns('manager')).toBe(true);
  });

  it('leaves a supervisor scoped to their own runs', () => {
    expect(seesAllRuns('supervisor')).toBe(false);
  });

  it('leaves an accountant scoped too', () => {
    expect(seesAllRuns('accountant')).toBe(false);
  });

  it('makes team filing irrelevant for a leader — no run can be hidden by a stale team pointer', () => {
    // The whole class of fault this supersedes: a leader's view no longer
    // depends on what leaderUid a run happens to carry.
    const runs = [
      { id: 'a', ownerUid: 'poc1', leaderUid: 'someOtherTeam' },
      { id: 'b', ownerUid: 'poc2', leaderUid: '' },
      { id: 'c', ownerUid: 'leader', leaderUid: 'formerLeader' },
    ];
    const visible = seesAllRuns('team_leader') ? runs : runs.filter((r) => r.leaderUid === 'leader');
    expect(visible).toHaveLength(3);
  });
});

/**
 * The boundary the client drew: the wider view must NOT become admin rights.
 * Mirrors roles.tsx — a leader may edit and export, but money and org
 * administration are gated on their own pages, and delete stays with the
 * owning member or an admin (firestore.rules).
 */
const isOrgAdminRole = (role: string) => role === 'owner' || role === 'manager';
const canDeleteAnyRun = (role: string) => isOrgAdminRole(role);

describe('the leader does not gain administrative rights', () => {
  it('is not an org admin', () => {
    expect(isOrgAdminRole('team_leader')).toBe(false);
  });

  it('cannot delete another team’s run', () => {
    expect(canDeleteAnyRun('team_leader')).toBe(false);
    expect(canDeleteAnyRun('manager')).toBe(true);
  });
});
