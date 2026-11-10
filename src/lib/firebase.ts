/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDoc,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from "firebase/firestore";

import firebaseConfigImport from "../../firebase-applet-config.json";

// Silence internal non-fatal connection state warnings in sandbox/iframe environments
try {
  setLogLevel("silent");
} catch (e) {
  // Ignore if setLogLevel fails
}

// Dynamic configuration mapping to support build-time or runtime environment overrides on Vercel/Vite
const env: Record<string, string | undefined> = (typeof import.meta !== "undefined" && import.meta && (import.meta as any).env) ? (import.meta as any).env : {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigImport.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigImport.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigImport.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigImport.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigImport.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigImport.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigImport.measurementId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfigImport.firestoreDatabaseId || "(default)"
};

import { getAnalytics, isSupported } from "firebase/analytics";

// Initialize Firebase modularly
const app = initializeApp(firebaseConfig);

// Initialize Analytics in browser runtime if measurement ID present
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(app);
      } catch (e) {
        // Analytics non-blocking
      }
    }
  });
}

// Initialize Firestore with long polling optimizations for proxy/iframe resilience
const customDbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let dbInstance;
try {
  dbInstance = customDbId
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      }, customDbId)
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
} catch (e) {
  dbInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

import { getStorage } from "firebase/storage";

export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);

// Explicitly set browser local persistence for resilient user authentication sessions
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Firebase auth robust persistence selection failure:", err);
});

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Logged: ", JSON.stringify(errInfo));
  if (operationType === OperationType.LIST || operationType === OperationType.GET) {
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}

// Non-blocking initial connection probe utilizing local cache / lazy online sync
async function testConnection() {
  try {
    await getDoc(doc(db, "test", "connection"));
  } catch (error) {
    // Non-fatal fallback for offline or cold start
  }
}
testConnection();
