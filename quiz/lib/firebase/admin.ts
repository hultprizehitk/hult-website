import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/** Emulator-only project id; `demo-` projects can never touch real Firebase resources. */
export const DEMO_PROJECT_ID = "demo-hult-quiz";

export function usingEmulators(): boolean {
  return !!process.env.FIRESTORE_EMULATOR_HOST;
}

type Cache = { app: App | null; db: Firestore | null };
declare global {
  var quizFirebaseAdmin: Cache | undefined;
}
const cache: Cache = (globalThis.quizFirebaseAdmin ??= { app: null, db: null });

/** Lazy init so `next build` works without secrets; throws only when first used. */
function adminApp(): App {
  if (cache.app) return cache.app;
  if (getApps().length) return (cache.app = getApp());
  if (usingEmulators()) {
    cache.app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || DEMO_PROJECT_ID });
    return cache.app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set (base64 or raw service-account JSON)");
  const json = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  cache.app = initializeApp({
    credential: cert({ projectId: json.project_id, clientEmail: json.client_email, privateKey: json.private_key }),
    projectId: json.project_id,
  });
  return cache.app;
}

export function adminDb(): Firestore {
  if (!cache.db) {
    cache.db = getFirestore(adminApp());
    cache.db.settings({ ignoreUndefinedProperties: true });
  }
  return cache.db;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
