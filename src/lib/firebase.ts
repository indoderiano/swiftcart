/**
 * Firebase Configuration and Initialization
 * This file sets up the connection between our React app and the Firebase backend.
 * It initializes Authentication (for users) and Firestore (for our database).
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the core Firebase App instance using the config file
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it for use in other components
export const auth = getAuth(app);

// Initialize Cloud Firestore (NoSQL Database)
// We specify the firestoreDatabaseId from our config to ensure we connect to the right database instance
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Set up the Google Auth Provider for "Sign in with Google"
export const googleProvider = new GoogleAuthProvider();

// Custom parameters ensure that the user is always prompted to select an account,
// which is helpful if they have multiple Google accounts logged in.
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * OperationType Enum
 * Helps us categorize what kind of database action failed when an error occurs.
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * FirestoreErrorInfo Interface
 * Defines a structured way to report errors, including user authentication state.
 * This is crucial for debugging security rule issues.
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

/**
 * handleFirestoreError
 * A centralized function to handle and log database errors.
 * It captures the current user's state so we can see if they were logged in
 * when the error (like "Permission Denied") happened.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  // Logging as a JSON string makes it easier for automated tools to parse the error
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * testConnection
 * A simple check that runs on app startup to verify we can talk to the database.
 * If the client is "offline", it usually means the Firebase config is wrong.
 */
async function testConnection() {
  try {
    // We try to fetch a dummy document directly from the server (bypassing local cache)
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

// Run the connection test immediately
testConnection();
