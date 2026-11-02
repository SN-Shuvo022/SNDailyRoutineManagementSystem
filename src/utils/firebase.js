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

// Helper to parse Firebase config copied from Firebase console (JSON, JS object snippet, script tag, or full import block)
export function parseFirebaseConfigInput(inputStr) {
  if (typeof inputStr === 'object' && inputStr !== null) return inputStr;
  const str = inputStr.trim();

  // 1. Try standard JSON first
  try {
    return JSON.parse(str);
  } catch (e) {}

  // 2. Extract individual fields via regex (works regardless of comments, imports, script tags, quotes)
  const extractField = (fieldName) => {
    const regex = new RegExp(`['"]?${fieldName}['"]?\\s*:\\s*['"\`]([^'"\`]+)['"\`]`, 'i');
    const match = str.match(regex);
    return match ? match[1].trim() : '';
  };

  const apiKey = extractField('apiKey');
  const projectId = extractField('projectId');
  const authDomain = extractField('authDomain');
  const storageBucket = extractField('storageBucket');
  const messagingSenderId = extractField('messagingSenderId');
  const appId = extractField('appId');

  if (apiKey && projectId) {
    return {
      apiKey,
      projectId,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId: messagingSenderId || '',
      appId: appId || ''
    };
  }

  // 3. Fallback: try finding object block { ... }
  try {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) {
      const jsonLike = match[0]
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"');
      const parsed = JSON.parse(jsonLike);
      if (parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (innerErr) {}

  throw new Error('Firebase config-এ apiKey এবং projectId পাওয়া যায়নি। দয়া করে সম্পূর্ণ কোডটি কপি করে পেস্ট করুন।');
}

