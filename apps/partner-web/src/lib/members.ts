/**
 * Team members — real accounts backed by Firebase Auth + Firestore.
 *
 * Each teammate has an `orgMembers/{uid}` document that is the single source of
 * truth for their role, which pages they may access, and their profile. The
 * owner bootstraps their own document on first sign-in; everyone else is
 * created by an admin via `inviteMember`, which provisions the auth account
 * (secondary Firebase app, so the admin stays signed in) and the member doc.
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase.js';
import type { Role } from './roles.js';
import type { FeatureId } from './features.js';

/** Pages an admin can grant/revoke per member. `overview` is always granted. */
export const ASSIGNABLE_PAGES: { id: FeatureId; label: string }[] = [
  { id: 'trips', label: 'Trips & Routes' },
  { id: 'tours', label: 'Amazon Tours' },
  { id: 'fleet', label: 'Trucks & Drivers' },
  { id: 'customers', label: 'Customers' },
  { id: 'payables', label: 'Truck Owners' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'expenses', label: 'Expenses & Fuel' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'reports', label: 'Reports' },
  { id: 'messages', label: 'WhatsApp' },
  { id: 'chat', label: 'Team Chat' },
  { id: 'export', label: 'Data Export' },
  { id: 'team', label: 'Team & Roles' },
];

export interface Member {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  /** Explicit allowed pages, or 'all' for owner/manager. `overview` is implicit. */
  pages: FeatureId[] | 'all';
  photoUrl?: string;
  status: 'active' | 'disabled';
  /** The Team Leader this member reports to (a POC's TL). Empty for owner/
   *  manager/team-leader who report to the owner. */
  leaderUid?: string;
  /** Forces the "set your own password" screen on first sign-in. */
  mustSetPassword?: boolean;
}

/** The "team" a member belongs to for trip/tour scoping: their Team Leader's
 *  uid, or their own uid if they lead a team (TL) or run the org (owner). */
export function teamOf(m: { uid: string; leaderUid?: string }): string {
  return m.leaderUid && m.leaderUid.trim() ? m.leaderUid : m.uid;
}

/** Can `me` manage `target` (edit / assign tasks / see in Team)?  Owner &
 *  manager manage everyone; a Team Leader manages only their own POCs. */
export function canManageMember(me: Member | null, target: Member): boolean {
  if (!me) return false;
  if (me.role === 'owner' || me.role === 'manager') return true;
  if (me.role === 'team_leader') return target.leaderUid === me.uid;
  return false;
}

/** The one email allowed to bootstrap itself as owner (matches firestore.rules). */
export const BOOTSTRAP_OWNER_EMAIL = 'admin@sarvaexpress.in';

/** Whether a member may open a given page. `overview` is always allowed. */
export function memberCanAccess(member: Member | null, id: FeatureId): boolean {
  if (!member) return false;
  if (id === 'overview' || id === 'profile') return true;
  if (member.pages === 'all') return true;
  return member.pages.includes(id);
}

/** Owner/manager get everything; others get exactly what's toggled on. */
export function pagesForRole(role: Role, explicit: FeatureId[]): FeatureId[] | 'all' {
  return role === 'owner' || role === 'manager' ? 'all' : explicit;
}

function memberFromSnap(uid: string, data: Record<string, unknown>): Member {
  return {
    uid,
    email: (data.email as string) ?? '',
    name: (data.name as string) ?? '',
    role: (data.role as Role) ?? 'supervisor',
    pages: (data.pages as FeatureId[] | 'all') ?? [],
    status: (data.status as Member['status']) ?? 'active',
    ...(data.phone ? { phone: data.phone as string } : {}),
    ...(data.photoUrl ? { photoUrl: data.photoUrl as string } : {}),
    ...(data.leaderUid ? { leaderUid: data.leaderUid as string } : {}),
    ...(data.mustSetPassword ? { mustSetPassword: true } : {}),
  };
}

export async function getMember(uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'orgMembers', uid));
  return snap.exists() ? memberFromSnap(uid, snap.data()) : null;
}

/** Create the owner's own member doc on first sign-in (allowed by rules for the bootstrap email). */
export async function bootstrapOwner(uid: string, email: string): Promise<Member> {
  const m = {
    email, name: 'Owner', role: 'owner' as Role, pages: 'all' as const,
    status: 'active' as const, mustSetPassword: true, createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'orgMembers', uid), m);
  return { uid, email, name: 'Owner', role: 'owner', pages: 'all', status: 'active', mustSetPassword: true };
}

/** Live subscription to the whole team (for the Team page). */
export function watchMembers(cb: (members: Member[]) => void): () => void {
  return onSnapshot(collection(db, 'orgMembers'), (qs) => {
    cb(qs.docs.map((d) => memberFromSnap(d.id, d.data())));
  });
}

export interface InviteInput {
  email: string; name: string; phone?: string; role: Role; pages: FeatureId[]; leaderUid?: string;
}

function genTempPassword(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Sarva@${n}`;
}

/**
 * Provision a teammate: create the auth account on a throwaway secondary app
 * (so the current admin session is untouched), then write their member doc from
 * the admin session. Returns the temp password for the admin to share.
 */
export async function inviteMember(input: InviteInput): Promise<{ uid: string; tempPassword: string }> {
  const tempPassword = genTempPassword();
  const secondary = initializeApp(firebaseConfig, `invite-${Date.now()}`);
  try {
    const secAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secAuth, input.email.trim(), tempPassword);
    const uid = cred.user.uid;
    await signOut(secAuth);
    await setDoc(doc(db, 'orgMembers', uid), {
      email: input.email.trim(), name: input.name.trim(), role: input.role,
      pages: pagesForRole(input.role, input.pages),
      status: 'active', mustSetPassword: true, createdAt: serverTimestamp(),
      ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
      ...(input.leaderUid ? { leaderUid: input.leaderUid } : {}),
    });
    return { uid, tempPassword };
  } finally {
    await deleteApp(secondary);
  }
}

export async function updateMember(uid: string, patch: Partial<Member>): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.phone !== undefined) data.phone = patch.phone;
  if (patch.role !== undefined) data.role = patch.role;
  if (patch.pages !== undefined) data.pages = patch.pages;
  if (patch.photoUrl !== undefined) data.photoUrl = patch.photoUrl;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.leaderUid !== undefined) data.leaderUid = patch.leaderUid;
  if (patch.mustSetPassword !== undefined) data.mustSetPassword = patch.mustSetPassword;
  await updateDoc(doc(db, 'orgMembers', uid), data);
}
