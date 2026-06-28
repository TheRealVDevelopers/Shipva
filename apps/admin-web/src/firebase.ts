import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

/**
 * Firebase init for the admin/dispatch console.
 * Project: sarvaexpressos (shared with the marketplace apps). The web config
 * is public by design — access is gated by Security Rules + App Check, not by
 * hiding these keys. Env vars override for alternate environments.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCjPwC0ii0EQmyo0FTvU6ydJKVrCp7KuPo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'sarvaexpressos.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'sarvaexpressos',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'sarvaexpressos.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '696510500720',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:696510500720:web:cc97377b5336a7e14149b5',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, 'asia-south1');
export const storage = getStorage(firebaseApp);
