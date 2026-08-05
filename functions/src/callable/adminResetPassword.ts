import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth, db } from '../admin.js';

/**
 * Admin password reset — an owner or manager gives a locked-out teammate a
 * fresh temporary password.
 *
 * This must run with the Admin SDK: the client SDK can only change the password
 * of the *currently signed-in* user, so an admin could never reset someone
 * else's. Here `auth.updateUser` sets a new password server-side, and the
 * member is flagged `mustSetPassword` so the very next sign-in forces them to
 * choose their own — the admin never learns their final password.
 *
 * Authorised against the caller's own `orgMembers` record, exactly like
 * removeOrgMember: the Transporter OS keeps roles in Firestore, and the custom
 * claims that authz.ts reads are never set for it.
 */

/** A short, human-friendly one-time password, matching the invite convention
 *  (genTempPassword in the partner app's members.ts). Handed to the admin to
 *  pass on; replaced by the employee on next sign-in. */
function genTempPassword(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Sarva@${n}`;
}

// Region pinned here, not left to index.ts's setGlobalOptions — ESM evaluates
// this module (and captures onCall's options) before index.ts runs. The partner
// app calls getFunctions(app, 'asia-south1'), so this must match.
export const adminResetPassword = onCall<{ targetUid: string }>({ region: 'asia-south1' }, async (req) => {
  const actorUid = req.auth?.uid;
  if (!actorUid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const { targetUid } = req.data ?? {};
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.');

  const [actorSnap, targetSnap] = await Promise.all([
    db.collection('orgMembers').doc(actorUid).get(),
    db.collection('orgMembers').doc(targetUid).get(),
  ]);

  const actorRole = actorSnap.exists ? (actorSnap.data()?.role as string) : '';
  if (actorRole !== 'owner' && actorRole !== 'manager') {
    throw new HttpsError('permission-denied', 'Only an owner or manager can reset a password.');
  }
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', 'That employee no longer exists.');
  }
  // The owner is the bootstrap account the whole org hangs off. A manager must
  // not be able to seize it by resetting its password; the owner recovers their
  // own account through the emailed "forgot password" link instead.
  if (targetSnap.data()?.role === 'owner' && actorUid !== targetUid) {
    throw new HttpsError('permission-denied', 'The owner account can only be reset by the owner, via the email link.');
  }

  const tempPassword = genTempPassword();
  try {
    await auth.updateUser(targetUid, { password: tempPassword });
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/user-not-found') {
      throw new HttpsError('failed-precondition', 'This employee has no sign-in account yet.');
    }
    throw new HttpsError('internal', 'Could not reset the password.');
  }

  // Force the "set your own password" screen on next sign-in, exactly like a
  // fresh invite — so the temporary password the admin holds is single-use.
  await targetSnap.ref.update({ mustSetPassword: true });

  const email = (targetSnap.data()?.email as string) ?? '';
  return { ok: true, tempPassword, email };
});
