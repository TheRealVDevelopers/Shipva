import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import type { Role, RoleScopes } from '@shipva/shared-types';

/**
 * Authn/authz guards for callable functions.
 *
 * Role + scopes live in the Firebase Auth custom claims (set only by
 * `setUserRole`). They ride on the verified ID token, so they are trustworthy
 * here — unlike the `users.role` mirror field, which is for display only.
 */

export interface AuthContext {
  uid: string;
  role: Role;
  scopes: RoleScopes;
  claimVersion: number;
}

/** Throws `unauthenticated` if the caller has no verified Auth token. */
export function requireAuth(req: CallableRequest): AuthContext {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Sign-in required.');
  }
  const token = req.auth.token as { role?: Role; scopes?: RoleScopes; claimVersion?: number };
  return {
    uid: req.auth.uid,
    role: token.role ?? ('customer' as Role),
    scopes: token.scopes ?? {},
    claimVersion: token.claimVersion ?? 0,
  };
}

/**
 * Throws `permission-denied` unless the caller's role is in `allowed`.
 * Returns the same context as `requireAuth` on success.
 */
export function requireRole(req: CallableRequest, allowed: Role[]): AuthContext {
  const ctx = requireAuth(req);
  if (!allowed.includes(ctx.role)) {
    throw new HttpsError('permission-denied', `Requires one of: ${allowed.join(', ')}.`);
  }
  return ctx;
}
