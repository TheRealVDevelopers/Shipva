import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
// Optional fields are written as `undefined` in several callables; let the
// SDK drop them instead of throwing "Unsupported field value: undefined".
db.settings({ ignoreUndefinedProperties: true });

export const auth = getAuth();
export const storage = getStorage();
