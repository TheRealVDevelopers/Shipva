import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth, db } from '../admin.js';

/**
 * Remove a Transporter-OS teammate, login and all.
 *
 * The app used to delete only the `orgMembers/{uid}` document, because the
 * client SDK can delete just the *currently signed-in* user. That revoked
 * access, but left the Firebase Auth account behind — so re-inviting the same
 * email later failed with `auth/email-already-in-use` and the person could
 * never be added back. That's the client's point 14.
 *
 * This runs with the Admin SDK, so it can delete the auth user too. Authorised
 * against the caller's own `orgMembers` record rather than custom claims: the
 * Transporter OS keeps its roles in Firestore (see lib/members.ts), and the
 * mirrored claims used elsewhere in this codebase are never set for it.
 *
 * Guards mirror canDeleteMember on the client: owner/manager only, never
 * yourself, never the owner.
 */
// Region is pinned here rather than relying on index.ts's setGlobalOptions:
// ESM evaluates imported modules before the importing one, so onCall() has
// already captured its options by the time setGlobalOptions runs. The partner
// app calls getFunctions(app, 'asia-south1'), so this has to match.
export const removeOrgMember = onCall<{ targetUid: string }>({ region: 'asia-south1' }, async (req) => {
  const actorUid = req.auth?.uid;
  if (!actorUid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const { targetUid } = req.data ?? {};
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.');
  if (targetUid === actorUid) {
    throw new HttpsError('failed-precondition', 'You cannot remove your own account.');
  }

  const [actorSnap, targetSnap] = await Promise.all([
    db.collection('orgMembers').doc(actorUid).get(),
    db.collection('orgMembers').doc(targetUid).get(),
  ]);

  const actorRole = actorSnap.exists ? (actorSnap.data()?.role as string) : '';
  if (actorRole !== 'owner' && actorRole !== 'manager') {
    throw new HttpsError('permission-denied', 'Only an owner or manager can remove an employee.');
  }
  if (targetSnap.exists && targetSnap.data()?.role === 'owner') {
    throw new HttpsError('failed-precondition', 'The owner account cannot be removed.');
  }

  // Delete the member record first — that's what grants access, so if the auth
  // deletion fails the person is still locked out rather than left signed in.
  if (targetSnap.exists) await targetSnap.ref.delete();

  // The auth account may already be gone (removed under the old client-side
  // flow, or by hand in the console). That's the state we want, not an error.
  let authDeleted = true;
  try {
    await auth.deleteUser(targetUid);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code !== 'auth/user-not-found') throw new HttpsError('internal', 'Could not delete the login.');
    authDeleted = false;
  }

  return { ok: true, authDeleted };
});

/**
 * Free a sign-in email that has an auth account but no `orgMembers` record —
 * the wreckage left by the old delete path. Called by the invite form when it
 * hits `email-already-in-use`, so an employee removed before the fix can still
 * be re-added without anyone visiting the Firebase console.
 *
 * Refuses if the account is a live member: that's a genuine duplicate, and
 * silently deleting a working login would be far worse than the error.
 */
export const releaseOrphanLogin = onCall<{ email: string }>({ region: 'asia-south1' }, async (req) => {
  const actorUid = req.auth?.uid;
  if (!actorUid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const email = (req.data?.email ?? '').trim().toLowerCase();
  if (!email) throw new HttpsError('invalid-argument', 'email is required.');

  const actorSnap = await db.collection('orgMembers').doc(actorUid).get();
  const actorRole = actorSnap.exists ? (actorSnap.data()?.role as string) : '';
  if (actorRole !== 'owner' && actorRole !== 'manager') {
    throw new HttpsError('permission-denied', 'Only an owner or manager can do this.');
  }

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    return { ok: true, released: false, reason: 'no-account' };
  }

  const memberSnap = await db.collection('orgMembers').doc(user.uid).get();
  if (memberSnap.exists) {
    throw new HttpsError('already-exists', 'That email belongs to an active employee.');
  }

  await auth.deleteUser(user.uid);
  return { ok: true, released: true };
});
