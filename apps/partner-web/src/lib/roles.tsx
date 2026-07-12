/**
 * Role-based access. For now the role is chosen locally (a "viewing as" switch)
 * and persisted; sections + routes are gated by it. When the backend lands the
 * role comes from the signed-in user's claim instead of this switch — the
 * gating logic (canAccess) stays the same.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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

/** Sections each role may access. 'all' = everything that's feature-enabled. */
export const ROLE_ACCESS: Record<Role, FeatureId[] | 'all'> = {
  owner: 'all',
  manager: 'all',
  supervisor: OPS,
  accountant: MONEY,
};

export function canAccess(role: Role, id: FeatureId): boolean {
  const a = ROLE_ACCESS[role];
  return a === 'all' ? true : a.includes(id);
}

const KEY = 'shipva-role-v1';

interface RoleApi { role: Role; setRole: (r: Role) => void }
const Ctx = createContext<RoleApi | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const r = localStorage.getItem(KEY) as Role | null;
    return r && ROLES.some((x) => x.id === r) ? r : 'owner';
  });
  const setRole = useCallback((r: Role) => { setRoleState(r); try { localStorage.setItem(KEY, r); } catch { /* */ } }, []);
  const value = useMemo(() => ({ role, setRole }), [role, setRole]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRole(): RoleApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRole must be used within RoleProvider');
  return v;
}
