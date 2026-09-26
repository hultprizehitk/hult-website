"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-hult-quiz",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cached: { app: FirebaseApp; db: Firestore; auth: Auth } | null = null;

/** One client app per tab. Persistent cache (PRD 9.2.8) so refreshes/reconnects re-read only changed docs. */
export function firebaseClient() {
  if (cached) return cached;
  const app = getApps().length ? getApp() : initializeApp(config);
  let db: Firestore;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = getFirestore(app); // already initialised (HMR) or IndexedDB unavailable
  }
  const auth = getAuth(app);
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    // Same host the page came from, so phones on the LAN reach the emulators on the dev laptop.
    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
    try {
      connectFirestoreEmulator(db, host, 8080);
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    } catch {
      // already connected (HMR)
    }
  }
  cached = { app, db, auth };
  return cached;
}
