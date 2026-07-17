/**
 * Roles & default access. The signed-in user's role now comes from their
 * `orgMembers` record (see lib/auth + lib/members); this module just defines the
 * role vocabulary and the default page set each role gets. Per-member overrides
 * live on the member doc (`pages`).
 */
import type { FeatureId } from './features.js';

export type Role = 'owner' | 'manager' | 'team_leader' | 'supervisor' | 'accountant';

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: 'owner', label: 'Owner', blurb: 'Full access to everything' },
  { id: 'manager', label: 'Manager', blurb: 'All operations & money, manage staff' },
  { id: 'team_leader', label: 'Team Leader', blurb: 'Runs a sub-team of POCs; assigns & watches their routes' },
  { id: 'supervisor', label: 'Supervisor', blurb: 'Trips, tours, fleet & chat only' },
  { id: 'accountant', label: 'Accountant', blurb: 'Invoicing, payroll, ledgers & reports' },
];

const OPS: FeatureId[] = ['overview', 'trips', 'tours', 'fleet', 'messages', 'chat'];
const MONEY: FeatureId[] = ['overview', 'customers', 'invoices', 'expenses', 'payables', 'payroll', 'reports', 'export', 'messages', 'chat'];
const LEAD: FeatureId[] = ['overview', 'trips', 'tours', 'fleet', 'messages', 'chat', 'team', 'export'];

/** Default sections each role gets when inviting them. 'all' = everything enabled. */
export const ROLE_ACCESS: Record<Role, FeatureId[] | 'all'> = {
  owner: 'all',
  manager: 'all',
  team_leader: LEAD,
  supervisor: OPS,
  accountant: MONEY,
};

/** Owner & manager see & manage the whole org. */
export const isOrgAdminRole = (role: Role): boolean => role === 'owner' || role === 'manager';

/**
 * Who may edit or delete records — trips, tours, drivers, trucks, transporters
 * and truck owners. The client's rule: leadership only, not every supervisor.
 * A manager is included because they outrank a team leader and already hold
 * org-wide access; excluding them would let a TL delete what their own manager
 * couldn't. Supervisors and accountants can still do their jobs (updating trip
 * status, POC tour updation) — they just can't rewrite or destroy a record.
 */
export const canEditRecords = (role: Role | undefined): boolean =>
  !!role && (isOrgAdminRole(role) || role === 'team_leader');

/**
 * Who may download data. The change request says "that export could only be
 * downloaded by ADMIN & TL(Team Leader)" — the accountant is a DELIBERATE
 * addition on the user's instruction, because their job is the ledgers and the
 * reports and the export is how they do it. Don't "fix" this back to the PDF.
 * Supervisors remain the ones who can't take data out.
 *
 * This is deliberately a ROLE check rather than a page permission. A member's
 * stored `pages` predates the rule, so gating on defaults alone would only
 * affect who gets invited next. Kept separate from canEditRecords on purpose:
 * "may rewrite a record" and "may take the data out of the building" are
 * different questions and shouldn't drift together by accident.
 */
export const canExportData = (role: Role | undefined): boolean =>
  !!role && (isOrgAdminRole(role) || role === 'team_leader' || role === 'accountant');

/** Default explicit page list to pre-tick when inviting a non-admin role. */
export function defaultPages(role: Role): FeatureId[] {
  const a = ROLE_ACCESS[role];
  return a === 'all' ? [] : a.filter((p) => p !== 'overview');
}

export function canAccess(role: Role, id: FeatureId): boolean {
  const a = ROLE_ACCESS[role];
  return a === 'all' ? true : a.includes(id);
}

export const roleLabel = (role: Role): string => ROLES.find((r) => r.id === role)?.label ?? role;
