export type Role =
  | 'super_admin'
  | 'admin'
  | 'dispatcher'
  | 'support'
  | 'driver'
  | 'customer'
  | 'transporter';

export interface RoleScopes {
  /** Dispatcher/support scope — restricts to specific launch zones. */
  zoneIds?: string[];
  /** Transporter scope — restricts to one transporter company document. */
  transporterId?: string;
}

/**
 * Shape of the Firebase Auth custom claim.
 * The `role` field on the user document is a read-only mirror — never trust it.
 */
export interface AuthClaims {
  role: Role;
  scopes: RoleScopes;
  /** Bumped when claims change so old tokens force-refresh. */
  claimVersion: number;
}

/** Roles that operate the admin/dispatch console. */
export const STAFF_ROLES: Role[] = ['super_admin', 'admin', 'dispatcher', 'support'];
