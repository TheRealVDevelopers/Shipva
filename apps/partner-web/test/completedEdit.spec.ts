import { describe, it, expect } from 'vitest';
import { canEditCompleted, canEditRecords } from '../src/lib/roles.js';

/**
 * The client: "Add an Edit option for trips under the Completed tab, and
 * configure role permissions so Managers and Owners can edit completed trips or
 * grant edit access to specific employees."
 *
 * A completed run is the record of what happened, so re-opening one is a
 * stronger permission than editing a live trip — deliberately NOT the same as
 * canEditRecords, which also covers team leaders.
 */
describe('canEditCompleted', () => {
  it('always allows an owner and a manager', () => {
    expect(canEditCompleted({ role: 'owner' })).toBe(true);
    expect(canEditCompleted({ role: 'manager' })).toBe(true);
  });

  it('does NOT include a team leader by default', () => {
    expect(canEditCompleted({ role: 'team_leader' })).toBe(false);
  });

  it('allows a named employee an admin has granted it', () => {
    expect(canEditCompleted({ role: 'supervisor', canEditCompleted: true })).toBe(true);
    expect(canEditCompleted({ role: 'accountant', canEditCompleted: true })).toBe(true);
    expect(canEditCompleted({ role: 'team_leader', canEditCompleted: true })).toBe(true);
  });

  it('refuses an employee without the grant', () => {
    expect(canEditCompleted({ role: 'supervisor' })).toBe(false);
    expect(canEditCompleted({ role: 'supervisor', canEditCompleted: false })).toBe(false);
  });

  it('refuses when there is no member', () => {
    expect(canEditCompleted(null)).toBe(false);
    expect(canEditCompleted(undefined)).toBe(false);
  });

  it('is stricter than ordinary record editing', () => {
    // A team leader may edit live records but not a completed run.
    expect(canEditRecords('team_leader')).toBe(true);
    expect(canEditCompleted({ role: 'team_leader' })).toBe(false);
  });
});
