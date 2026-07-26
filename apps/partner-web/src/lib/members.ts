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
  collection, deleteDoc, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, firebaseConfig } from '../firebase.js';
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
  { id: 'diesel', label: 'Diesel Requests' },
  { id: 'locations', label: 'Locations' },
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

  /**
   * HR profile — the client's point 15: an employee must complete their
   * details and upload Aadhaar, PAN and bank proof before activation. All
   * optional on the type because a brand-new invite has none of it yet;
   * `profileComplete()` is what decides whether they're done.
   */
  dob?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  aadhaar?: string;
  pan?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  aadhaarImg?: string;
  panImg?: string;
  cancelledChequeImg?: string;
  /** Signed-off by an admin once the papers check out. */
  profileApprovedOn?: string;
  profileApprovedBy?: string;
  /** Employment terms — set by Accounts, used by payroll and the joining letter. */
  designation?: string;
  joinedOn?: string;
  monthlySalaryPaise?: number;
  /** Generated once the employee is activated. */
  joiningLetterIssuedOn?: string;
}

/** The profile fields the client requires before an employee is activated. */
export const REQUIRED_PROFILE: { key: keyof Member; label: string }[] = [
  { key: 'phone', label: 'Phone number' },
  { key: 'dob', label: 'Date of birth' },
  { key: 'address', label: 'Address' },
  { key: 'emergencyPhone', label: 'Emergency contact' },
  { key: 'aadhaar', label: 'Aadhaar number' },
  { key: 'pan', label: 'PAN number' },
  { key: 'bankAccountNo', label: 'Bank account number' },
  { key: 'bankIfsc', label: 'IFSC code' },
  { key: 'aadhaarImg', label: 'Aadhaar document' },
  { key: 'panImg', label: 'PAN document' },
  { key: 'cancelledChequeImg', label: 'Cancelled cheque / passbook' },
];

/** What's still missing from an employee's profile. Empty = ready to activate. */
export function missingProfile(m: Member): string[] {
  return REQUIRED_PROFILE.filter(({ key }) => {
    const v = m[key];
    return !(typeof v === 'string' ? v.trim() : v);
  }).map(({ label }) => label);
}

export const profileComplete = (m: Member): boolean => missingProfile(m).length === 0;

/**
 * Whether this person may actually use the app.
 *
 * The owner and the admins are exempt — the owner bootstraps the org before
 * any HR process exists, and locking the only account that can approve
 * profiles out of the app behind a profile approval would be a deadlock.
 */
export function isActivated(m: Member): boolean {
  if (m.status === 'disabled') return false;
  if (m.role === 'owner' || m.role === 'manager') return true;
  return !!m.profileApprovedOn;
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

/**
 * Can `me` delete `target`? The client's rule is admin-only, and on top of that
 * two guards that matter: nobody deletes themselves (you'd lock yourself out
 * mid-click), and nobody deletes the owner — that's the bootstrap account the
 * whole org hangs off, and firestore.rules would let it happen.
 */
export function canDeleteMember(me: Member | null, target: Member): boolean {
  if (!me) return false;
  if (me.role !== 'owner' && me.role !== 'manager') return false;
  if (me.uid === target.uid) return false;
  if (target.role === 'owner') return false;
  return true;
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

/**
 * Read a member out of Firestore. Spreads the document and then pins the
 * fields the app treats as always-present — a whitelist here would silently
 * drop every new profile field, which is exactly how tour POD photos went
 * missing before (see fromSnap in lib/tours).
 */
function memberFromSnap(uid: string, data: Record<string, unknown>): Member {
  return {
    ...(data as Partial<Member>),
    uid,
    email: (data.email as string) ?? '',
    name: (data.name as string) ?? '',
    role: (data.role as Role) ?? 'supervisor',
    pages: (data.pages as FeatureId[] | 'all') ?? [],
    status: (data.status as Member['status']) ?? 'active',
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

/** Patch a member. `uid` is the doc id, never a stored field; anything else on
 *  the patch is written through, so new profile fields need no change here. */
export async function updateMember(uid: string, patch: Partial<Member>): Promise<void> {
  const data: Record<string, unknown> = { ...patch };
  delete data.uid;
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  await updateDoc(doc(db, 'orgMembers', uid), data);
}

/**
 * Remove an employee — member record AND login.
 *
 * This used to delete only the `orgMembers` document, because the client SDK
 * can delete just the *currently signed-in* user. Access was revoked, but the
 * Firebase Auth account survived, so re-inviting that same email later failed
 * with "email already in use" and the person could never be added back — the
 * client's point 14. The `removeOrgMember` callable does both with the Admin
 * SDK; if it's unreachable we still delete the member doc so the person loses
 * access immediately, and report that the login is stranded.
 */
export async function deleteMember(uid: string): Promise<{ authDeleted: boolean }> {
  try {
    const call = httpsCallable<{ targetUid: string }, { ok: boolean; authDeleted: boolean }>(functions, 'removeOrgMember');
    const res = await call({ targetUid: uid });
    return { authDeleted: !!res.data?.authDeleted };
  } catch {
    // Fall back to the old behaviour rather than leaving them with access.
    await deleteDoc(doc(db, 'orgMembers', uid));
    return { authDeleted: false };
  }
}

/**
 * Delete a Firebase Auth account that has no member record behind it. Used to
 * recover from an employee removed under the old flow: their login still
 * squats on the email, so inviting them again fails. Returns false when there
 * was nothing to release; throws if the email belongs to a live employee.
 */
export async function releaseOrphanLogin(email: string): Promise<boolean> {
  const call = httpsCallable<{ email: string }, { ok: boolean; released: boolean }>(functions, 'releaseOrphanLogin');
  const res = await call({ email });
  return !!res.data?.released;
}
