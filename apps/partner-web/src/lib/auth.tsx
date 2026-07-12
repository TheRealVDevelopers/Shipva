/**
 * Auth state for the Transporter OS. Wraps Firebase Auth (Email/Password) and
 * resolves the signed-in user to their `orgMembers` record, which carries their
 * role and page permissions. Exposes a small status machine the UI renders from.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential, type User,
} from 'firebase/auth';
import { auth } from '../firebase.js';
import {
  getMember, bootstrapOwner, updateMember, BOOTSTRAP_OWNER_EMAIL, type Member,
} from './members.js';

export type AuthStatus = 'loading' | 'signed-out' | 'no-access' | 'must-set-password' | 'ready';

interface AuthApi {
  status: AuthStatus;
  user: User | null;
  member: Member | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  /** Set a new password (first-login flow); clears the mustSetPassword flag. */
  setInitialPassword: (newPassword: string) => Promise<void>;
  /** Change password with re-authentication (from Profile). */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Re-read the current user's member doc (after a profile edit). */
  refreshMember: () => Promise<void>;
}

const Ctx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const resolveMember = useCallback(async (u: User) => {
    let m = await getMember(u.uid);
    if (!m && u.email && u.email.toLowerCase() === BOOTSTRAP_OWNER_EMAIL.toLowerCase()) {
      m = await bootstrapOwner(u.uid, u.email);
    }
    setMember(m);
    if (!m) setStatus('no-access');
    else if (m.mustSetPassword) setStatus('must-set-password');
    else setStatus('ready');
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (!u) { setMember(null); setStatus('signed-out'); return; }
    if (u.isAnonymous) return; // storage-only anonymous session — ignore
    setStatus('loading');
    try { await resolveMember(u); } catch { setStatus('no-access'); }
  }), [resolveMember]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => { await signOut(auth); }, []);

  const setInitialPassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser || !member) throw new Error('not signed in');
    await updatePassword(auth.currentUser, newPassword);
    await updateMember(member.uid, { mustSetPassword: false });
    setMember({ ...member, mustSetPassword: false });
    setStatus('ready');
  }, [member]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const u = auth.currentUser;
    if (!u || !u.email) throw new Error('not signed in');
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
    await updatePassword(u, newPassword);
  }, []);

  const refreshMember = useCallback(async () => {
    if (!auth.currentUser) return;
    const m = await getMember(auth.currentUser.uid);
    setMember(m);
    setStatus(m ? (m.mustSetPassword ? 'must-set-password' : 'ready') : 'no-access');
  }, []);

  const value = useMemo<AuthApi>(() => ({
    status, user, member, signIn, signOutUser, setInitialPassword, changePassword, refreshMember,
  }), [status, user, member, signIn, signOutUser, setInitialPassword, changePassword, refreshMember]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
