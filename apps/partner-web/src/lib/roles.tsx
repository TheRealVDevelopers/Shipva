/**
 * Roles & default access. The signed-in user's role now comes from their
 * `orgMembers` record (see lib/auth + lib/members); this module just defines the
 * role vocabulary and the default page set each role gets. Per-member overrides
 * live on the member doc (`pages`).
 */
import type { FeatureId } from './features.js';

export type Role = 'owner' | 'manager' | 'supervisor' | 'accountant';

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: 'owner', label: 'Owner', blurb: 'Full access to everything' },
  { id: 'manager', label: 'Manager', blurb: 'All operations & money, manage staff' },
  { id: 'supervisor', label: 'Supervisor', blurb: 'Trips, tours, fleet & chat only' },
  { id: 'accountant', label: 'Accountant', blurb: 'Invoicing, payroll, ledgers & reports' },
];

const OPS: FeatureId[] = ['overview', 'trips', 'tours', 'fleet', 'messages', 'chat'];
const MONEY: FeatureId[] = ['overview', 'customers', 'invoices', 'expenses', 'payables', 'payroll', 'reports', 'export', 'messages', 'chat'];

/** Default sections each role gets when inviting them. 'all' = everything enabled. */
export const ROLE_ACCESS: Record<Role, FeatureId[] | 'all'> = {
  owner: 'all',
  manager: 'all',
  supervisor: OPS,
  accountant: MONEY,
};

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
