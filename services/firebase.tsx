import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, deleteDoc, setDoc, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import React, { createContext, useContext, useEffect, useState } from 'react';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Silence internal Firestore warning/info logs from being treated as fatal application errors
setLogLevel('silent');

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  // Avoid running test connection on server-side or if the browser reports offline
  if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const isOffline = error?.message?.includes('offline') || error?.message?.includes('Could not reach');
    if (isOffline) {
      console.warn("Firestore client is offline. Cache-first operations enabled.");
    } else {
      console.warn("Firestore test connection error:", error?.message || error);
    }
  }
}
testConnection();

export function signIn() {
  return signInWithPopup(auth, googleProvider);
}

export function logOut() {
  return signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  const isOfflineOrTransient =
    message.toLowerCase().includes('offline') ||
    message.toLowerCase().includes('could not reach') ||
    message.toLowerCase().includes('unavailable') ||
    message.toLowerCase().includes('network');
  if (isOfflineOrTransient) {
    console.warn('Firestore offline/transient state:', JSON.stringify(errInfo));
    return;
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('insufficient')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

interface AuthContextType {
  user: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      // Upsert user profile on login
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDocFromServer(userRef);
          if (!snap.exists()) {
             await setDoc(userRef, {
               uid: currentUser.uid,
               email: (currentUser.email || '').slice(0, 250),
             });
          }
        } catch (error) {
           console.warn("Account provision warning:", error);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
