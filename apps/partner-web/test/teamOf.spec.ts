import { describe, it, expect } from 'vitest';
import { teamOf, leaderHasStaleLine, type Member } from '../src/lib/members.js';

/**
 * The real cause of "the team leader can't see the lines assigned to them".
 *
 * Nandhini.V is a Team Leader whose record still said "Reports to Asha.AM".
 * teamOf() only looked at `leaderUid`, so every run assigned to her was filed
 * under ASHA's team. She queried her own team and found nothing — and the
 * earlier repair reported nothing to fix, because the runs genuinely matched
 * the (wrong) org chart.
 *
 * Role now decides: a leader always leads their own team, so a leftover
 * reporting line cannot misfile their work.
 */
const m = (p: Partial<Member>): Member => ({
  uid: 'u', email: '', name: '', role: 'supervisor', pages: [], status: 'active', ...p,
});

const ASHA = 'asha';
const NANDHINI = 'nandhini';

describe('teamOf', () => {
  it('files a POC’s run under their team leader', () => {
    expect(teamOf(m({ uid: 'poc', role: 'supervisor', leaderUid: ASHA }))).toBe(ASHA);
  });

  it('files a POC with no leader under their own uid', () => {
    expect(teamOf(m({ uid: 'poc', role: 'supervisor' }))).toBe('poc');
  });

  it('gives a Team Leader their OWN team even with a leftover reporting line', () => {
    // The exact reported case.
    expect(teamOf(m({ uid: NANDHINI, role: 'team_leader', leaderUid: ASHA }))).toBe(NANDHINI);
  });

  it('gives a Team Leader with a clean record their own team', () => {
    expect(teamOf(m({ uid: NANDHINI, role: 'team_leader' }))).toBe(NANDHINI);
  });

  it('never files an owner or manager under someone else', () => {
    expect(teamOf(m({ uid: 'o', role: 'owner', leaderUid: ASHA }))).toBe('o');
    expect(teamOf(m({ uid: 'mg', role: 'manager', leaderUid: ASHA }))).toBe('mg');
  });

  it('falls back to leaderUid when role is unknown, as before', () => {
    expect(teamOf({ uid: 'x', leaderUid: ASHA })).toBe(ASHA);
  });

  it('treats an accountant like any other POC', () => {
    expect(teamOf(m({ uid: 'acc', role: 'accountant', leaderUid: ASHA }))).toBe(ASHA);
  });
});

describe('leaderHasStaleLine', () => {
  it('flags a Team Leader reporting to another leader', () => {
    expect(leaderHasStaleLine(m({ uid: NANDHINI, role: 'team_leader', leaderUid: ASHA }))).toBe(true);
  });

  it('does not flag a clean Team Leader', () => {
    expect(leaderHasStaleLine(m({ uid: NANDHINI, role: 'team_leader' }))).toBe(false);
    expect(leaderHasStaleLine(m({ uid: NANDHINI, role: 'team_leader', leaderUid: '  ' }))).toBe(false);
  });

  it('does not flag a POC — reporting to a leader is correct for them', () => {
    expect(leaderHasStaleLine(m({ uid: 'poc', role: 'supervisor', leaderUid: ASHA }))).toBe(false);
  });
});
