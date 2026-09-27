"use client";

import { useCallback, useEffect, useState } from "react";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { api, ApiError } from "@/lib/client/api";
import { firebaseClient } from "@/lib/firebase/client";

export type FirebaseUserStatus = "loading" | "signed-in" | "anonymous" | "error";

export interface FirebaseUser {
  status: FirebaseUserStatus;
  email: string | null;
  admin: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * NextAuth -> Firebase bridge: asks the server for a custom token for the NextAuth user and signs the
 * Firebase SDK in with it (Firestore rules read token.email / token.admin). No NextAuth session -> anonymous.
 */
export function useFirebaseUser(): FirebaseUser {
  const [state, setState] = useState<Omit<FirebaseUser, "retry">>({ status: "loading", email: null, admin: false, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const { auth } = firebaseClient();
    (async () => {
      try {
        const res = await api<{ token: string; email: string; admin: boolean }>("/api/firebase-token");
        const current = auth.currentUser;
        const claims = current ? (await current.getIdTokenResult()).claims : null;
        if (!current || current.uid !== res.email || Boolean(claims?.admin) !== res.admin) {
          await signInWithCustomToken(auth, res.token);
        }
        if (!cancelled) setState({ status: "signed-in", email: res.email, admin: res.admin, error: null });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          if (auth.currentUser) await signOut(auth).catch(() => {});
          setState({ status: "anonymous", email: null, admin: false, error: e.status === 403 ? e.message : null });
        } else {
          setState({ status: "error", email: null, admin: false, error: e instanceof Error ? e.message : "Sign-in failed" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
