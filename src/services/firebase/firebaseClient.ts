import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, terminate, clearIndexedDbPersistence } from 'firebase/firestore';

// 1. Read directly from the environment variables instead of a JSON import
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

// 2. Initialize Firebase with the config object
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Check if developer requested to disable persistent cache
const disableCache = localStorage.getItem('disable_firestore_cache') === 'true';

// Enable persistent offline cache with multi-tab manager unless disabled
export const db = initializeFirestore(app, disableCache ? {} : {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

export const purgeFirestoreCache = async () => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (e) {
    console.warn('Error purging Firestore cache:', e);
  }
};