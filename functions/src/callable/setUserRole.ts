import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { Role, RoleScopes } from '@shipva/shared-types';
import { auth, db } from '../admin.js';
import { requireRole } from '../lib/authz.js';

/**
 * Set a user's role + scopes via custom claims.
 * Only super_admin and admin can call this. Claims are the source of truth;
 * the `users.role` field is a read-only mirror updated here so list views
 * can sort by role without decoding a token.
 */
export const setUserRole = onCall<{
  targetUid: string;
  role: Role;
  scopes?: RoleScopes;
}>(async (req) => {
  const { uid: actorUid } = requireRole(req, ['super_admin', 'admin']);
  const { targetUid, role, scopes } = req.data;

  if (!targetUid || !role) {
    throw new HttpsError('invalid-argument', 'targetUid and role are required.');
  }
  if (targetUid === actorUid) {
    throw new HttpsError('failed-precondition', 'Cannot set your own role.');
  }

  const existing = await auth.getUser(targetUid);
  const prevClaims = (existing.customClaims ?? {}) as { claimVersion?: number };
  const nextClaimVersion = (prevClaims.claimVersion ?? 0) + 1;

  await auth.setCustomUserClaims(targetUid, {
    role,
    scopes: scopes ?? {},
    claimVersion: nextClaimVersion,
  });

  await db.collection('users').doc(targetUid).set(
    { role, updatedAt: new Date().toISOString(), updatedBy: actorUid },
    { merge: true },
  );

  await db.collection('auditLogs').add({
    at: new Date().toISOString(),
    actor: actorUid,
    action: 'user.role_set',
    subject: { collection: 'users', id: targetUid },
    after: { role, scopes: scopes ?? {} },
  });

  return { ok: true, claimVersion: nextClaimVersion };
});
