/**
 * Firebase Storage upload for document images. Stores the file in the cloud and
 * returns its download URL (which is what we keep in the record).
 *
 * Storage rules require an authenticated user. Until the real login lands we
 * sign in anonymously — so this needs the "Anonymous" (or Email/Password) sign-in
 * provider enabled in the Firebase console. If auth/upload fails, the caller
 * falls back to a local (compressed) copy so the app keeps working.
 */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { auth, storage } from '../firebase.js';

async function ensureAuth(): Promise<void> {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

/** Upload a JPEG/PNG blob to `documents/…` and return its download URL. Throws
 *  if auth or upload fails (caller should fall back to local storage). */
export async function uploadDocImage(blob: Blob, path: string): Promise<string> {
  await ensureAuth();
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(r);
}

export const cloudStorageReady = typeof storage !== 'undefined';
