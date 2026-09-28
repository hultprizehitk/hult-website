"use client";

import { useCallback, useEffect, useState } from "react";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { api, ApiError } from "@/lib/client/api";
import { firebaseClient } from "@/lib/firebase/client";

export type FirebaseUserStatus = "loading" | "signed-in" | "anonymous" | "error";

export interface FirebaseUser {
  status: FirebaseUserStatus;
  email: string | null;
  name: string | null;
  admin: boolean;
  error: string | null;
  retry: () => void;
}

type TokenResponse = { token: string; email: string; name?: string; admin: boolean };
type State = Omit<FirebaseUser, "retry">;

// Components mounting together (UserNav + the page) share one in-flight sign-in. Two parallel
// signInWithCustomToken calls swap the auth token under a starting Firestore listener, which is then
// rejected (permission-denied). Only the pending flow is shared: a finished result is never reused.
let flow: { attempt: number; promise: Promise<State> } | null = null;

async function signInFlow(): Promise<State> {
  const { auth } = firebaseClient();
  try {
    const res = await api<TokenResponse>("/api/firebase-token");
    const current = auth.currentUser;
    const claims = current ? (await current.getIdTokenResult()).claims : null;
    if (!current || current.uid !== res.email || Boolean(claims?.admin) !== res.admin) {
      await signInWithCustomToken(auth, res.token);
    }
    return { status: "signed-in", email: res.email, name: res.name || res.email.split("@")[0], admin: res.admin, error: null };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      if (auth.currentUser) await signOut(auth).catch(() => {});
      return { status: "anonymous", email: null, name: null, admin: false, error: e.status === 403 ? e.message : null };
    }
    return { status: "error", email: null, name: null, admin: false, error: e instanceof Error ? e.message : "Sign-in failed" };
  }
}

function sharedSignIn(attempt: number): Promise<State> {
  if (!flow || flow.attempt !== attempt) {
    const promise = signInFlow().finally(() => {
      if (flow?.promise === promise) flow = null;
    });
    flow = { attempt, promise };
  }
  return flow.promise;
}

/**
 * NextAuth -> Firebase bridge: asks the server for a custom token for the NextAuth user and signs the
 * Firebase SDK in with it (Firestore rules read token.email / token.admin). No NextAuth session -> anonymous.
 */
export function useFirebaseUser(): FirebaseUser {
  const [state, setState] = useState<State>({ status: "loading", email: null, name: null, admin: false, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void sharedSignIn(attempt).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
