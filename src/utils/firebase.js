import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, onSnapshot, getDoc, enableNetwork
} from 'firebase/firestore';

const FIREBASE_CONFIG_STORAGE_KEY = 'sn_firebase_config';

export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading firebase config from storage:', e);
    return null;
  }
}

export function saveStoredFirebaseConfig(config) {
  try {
    if (!config) {
      localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    } else {
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Error saving firebase config to storage:', e);
  }
}

let firebaseApp = null;
let firestoreDb = null;

export function getFirebaseInstance(overrideConfig = null) {
  const config = overrideConfig || getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    if (!firestoreDb) {
      firestoreDb = getFirestore(firebaseApp);
    }
    return { app: firebaseApp, db: firestoreDb };
  } catch (err) {
    console.error('Failed to initialize Firebase instance:', err);
    return { app: null, db: null };
  }
}

export function isFirebaseReady() {
  const config = getStoredFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

// Push local state update to Firestore
export async function pushToFirestore(accountId, payload) {
  const { db } = getFirebaseInstance();
  if (!db || !accountId) return false;

  try {
    const sanitizedId = accountId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const docRef = doc(db, 'routines', sanitizedId);
    await setDoc(docRef, {
      ...payload,
      lastUpdatedClient: Date.now(),
      accountId: accountId.trim(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore push failed:', err);
    return false;
  }
}

// Real-time listener for remote changes from other devices (Phone <-> Laptop)
export function listenToFirestore(accountId, onDataReceived) {
  const { db } = getFirebaseInstance();
  if (!db || !accountId) return () => {};

  try {
    const sanitizedId = accountId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const docRef = doc(db, 'routines', sanitizedId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        onDataReceived(remoteData);
      }
    }, (error) => {
      console.warn('Firestore snapshot listener error:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error setting up Firestore listener:', err);
    return () => {};
  }
}

// Helper to parse Firebase config copied from Firebase console (JSON or JS object string)
export function parseFirebaseConfigInput(inputStr) {
  if (typeof inputStr === 'object' && inputStr !== null) return inputStr;
  const str = inputStr.trim();

  // Try standard JSON first
  try {
    return JSON.parse(str);
  } catch (e) {
    // If user copied "const firebaseConfig = { ... };"
    try {
      const match = str.match(/\{[\s\S]*\}/);
      if (match) {
        // Convert JS object properties to valid JSON
        const jsonLike = match[0]
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"');
        return JSON.parse(jsonLike);
      }
    } catch (innerErr) {
      throw new Error('Could not parse Firebase config. Please provide valid JSON or the copied snippet.');
    }
  }
  throw new Error('Invalid Firebase configuration format.');
}

