/**
 * Handing a WHOLE team from one leader to another — the client's report that
 * "team leader transfer and access still not working: the complete history
 * should be transferred, and all assigned employees and POCs should move
 * automatically".
 *
 * Moving people alone was never enough. Every run carries the team it belongs
 * to in `leaderUid` — which is the POC's leader, or the leader's own uid for
 * work they hold themselves — so both the POCs' runs and the leader's own
 * already carry the outgoing leader's uid. One sweep over `leaderUid` therefore
 * moves the entire team's work; walking POC by POC would silently miss the
 * leader's own runs, leaving the new leader with the people but not the work.
 *
 * As with leaderChange.spec, the store method closes over live Firestore lists,
 * so this proves the selection rules it uses.
 */
import { describe, it, expect } from 'vitest';

type Run = {
  id?: string; ownerUid?: string; leaderUid?: string;
  archived?: boolean; amzStatus?: string; status?: string;
};
type Person = { uid: string; name: string; leaderUid?: string; role?: string };

/** Mirror of the tour filter inside transferTeamWork. */
const tourMoves = (t: Run, from: string) =>
  !!t.id && t.leaderUid === from && !t.archived && t.amzStatus !== 'COMPLETED';

/** Mirror of the trip filter. */
const tripMoves = (t: Run, from: string) =>
  !!t.id && t.leaderUid === from && !t.archived && t.status !== 'closed';

/** Mirror of the member selection inside transferTeam. */
const peopleMoving = (people: Person[], from: string) => people.filter((p) => p.leaderUid === from);

const OLD = 'tlOld';
const NEW = 'tlNew';

describe('which runs move when a team is handed over', () => {
  it('moves an active tour belonging to the team', () => {
    expect(tourMoves({ id: 't1', leaderUid: OLD, amzStatus: 'IN PROGRESS' }, OLD)).toBe(true);
  });

  it('moves an active trip belonging to the team', () => {
    expect(tripMoves({ id: 't1', leaderUid: OLD, status: 'in_transit' }, OLD)).toBe(true);
  });

  it("moves the outgoing leader's OWN run — the case a per-POC sweep misses", () => {
    // A leader reports to the owner, so teamOf(leader) is their own uid, and
    // work they hold themselves carries leaderUid === their uid.
    const ownRun: Run = { id: 'own', ownerUid: OLD, leaderUid: OLD, amzStatus: 'IN PROGRESS' };
    expect(tourMoves(ownRun, OLD)).toBe(true);
  });

  it('moves a POC’s run without needing to know the POC', () => {
    const pocRun: Run = { id: 'p1', ownerUid: 'poc7', leaderUid: OLD, amzStatus: 'IN PROGRESS' };
    expect(tourMoves(pocRun, OLD)).toBe(true);
  });

  it('leaves a COMPLETED tour with the team that ran it', () => {
    expect(tourMoves({ id: 't1', leaderUid: OLD, amzStatus: 'COMPLETED' }, OLD)).toBe(false);
  });

  it('leaves a closed trip alone', () => {
    expect(tripMoves({ id: 't1', leaderUid: OLD, status: 'closed' }, OLD)).toBe(false);
  });

  it('leaves a cancelled/archived run alone', () => {
    expect(tourMoves({ id: 't1', leaderUid: OLD, archived: true, amzStatus: 'IN PROGRESS' }, OLD)).toBe(false);
    expect(tripMoves({ id: 't2', leaderUid: OLD, archived: true, status: 'in_transit' }, OLD)).toBe(false);
  });

  it("never touches another team's runs", () => {
    expect(tourMoves({ id: 't1', leaderUid: 'someoneElse', amzStatus: 'IN PROGRESS' }, OLD)).toBe(false);
  });

  it('ignores a run with no id — it was never saved', () => {
    expect(tourMoves({ leaderUid: OLD, amzStatus: 'IN PROGRESS' }, OLD)).toBe(false);
  });
});

describe('which people move when a team is handed over', () => {
  const people: Person[] = [
    { uid: 'p1', name: 'Nandhini', leaderUid: OLD, role: 'supervisor' },
    { uid: 'p2', name: 'Ravi', leaderUid: OLD, role: 'accountant' },
    { uid: 'p3', name: 'Asha', leaderUid: NEW, role: 'supervisor' },
    { uid: OLD, name: 'Old Leader', role: 'team_leader' },
    { uid: 'owner', name: 'Owner', role: 'owner' },
  ];

  it('moves every employee reporting to the outgoing leader', () => {
    expect(peopleMoving(people, OLD).map((p) => p.name)).toEqual(['Nandhini', 'Ravi']);
  });

  it('moves POCs of any role, not just supervisors', () => {
    expect(peopleMoving(people, OLD).map((p) => p.role)).toEqual(['supervisor', 'accountant']);
  });

  it("leaves another leader's team alone", () => {
    expect(peopleMoving(people, OLD).some((p) => p.name === 'Asha')).toBe(false);
  });

  it('does not move the outgoing leader themselves — their role is changed separately', () => {
    expect(peopleMoving(people, OLD).some((p) => p.uid === OLD)).toBe(false);
  });

  it('moves nobody when the leader has no team, so only their own runs transfer', () => {
    expect(peopleMoving(people, 'tlEmpty')).toHaveLength(0);
  });
});
