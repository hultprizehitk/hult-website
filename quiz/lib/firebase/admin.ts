import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/** Emulator-only project id; `demo-` projects can never touch real Firebase resources. */
export const DEMO_PROJECT_ID = "demo-hult-quiz";

export function usingEmulators(): boolean {
  return !!process.env.FIRESTORE_EMULATOR_HOST;
}

/** Lazy init so `next build` works without secrets; throws only when first used. */
function adminApp(): App {
  if (getApps().length) return getApp();
  if (usingEmulators()) return initializeApp({ projectId: process.env.GCLOUD_PROJECT || DEMO_PROJECT_ID });
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set (base64 or raw service-account JSON)");
  const json = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  return initializeApp({
    credential: cert({ projectId: json.project_id, clientEmail: json.client_email, privateKey: json.private_key }),
    projectId: json.project_id,
  });
}

let db: Firestore | null = null;

export function adminDb(): Firestore {
  if (db) return db;
  db = getFirestore(adminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // already configured (dev hot reload re-imports this module but reuses the Firestore instance)
  }
  return db;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
