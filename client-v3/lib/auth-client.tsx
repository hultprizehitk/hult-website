"use client";

/**
 * Frontend-only auth stub for the Kolkata client v3.
 *
 * The live `client/` app signs students in via NextAuth + Google OAuth backed by
 * MongoDB. This folder ships without any backend, so the same component API
 * (`useSession`, `signIn`, `signOut`) is re-implemented here against a
 * localStorage session.
 *
 * SWAP POINT: when the backend lands, delete this file and restore
 * `next-auth/react` imports (`@/components/providers/SessionProvider`).
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { parseHeritageEmail } from "@/lib/heritage-parser";

const SESSION_KEY = "hult_v3_session";
const SESSION_COOKIE = "hult_v3_session";

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

type Status = "loading" | "authenticated" | "unauthenticated";

const NO_SESSION: Session | null = null;

function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null) {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // Mirror to a cookie so the frontend-only /api stubs can read the active
      // student's email server-side (same swap point as a real session cookie).
      document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
        session.user.email || ""
      )};path=/;max-age=604800;samesite=lax`;
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      document.cookie = `${SESSION_COOKIE}=;path=/;max-age=0`;
    }
  } catch {
    // storage may be blocked
  }
}

// Session store backed by localStorage, exposed through useSyncExternalStore so
// components re-render when the session changes without manual hydration state.
let cachedSession: Session | null =
  typeof window !== "undefined" ? readStoredSession() : null;
const sessionListeners = new Set<() => void>();

function emitSessionChange() {
  for (const listener of sessionListeners) listener();
}

function updateSession(session: Session | null) {
  cachedSession = session;
  writeStoredSession(session);
  emitSessionChange();
}

function getSessionSnapshot(): Session | null {
  return cachedSession;
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  const onStorage = () => {
    cachedSession = readStoredSession();
    emitSessionChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

interface AuthContextValue {
  data: Session | null;
  status: Status;
}

const AuthContext = createContext<AuthContextValue>({
  data: NO_SESSION,
  status: "unauthenticated",
});

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      data: session,
      status: session ? "authenticated" : "unauthenticated",
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): { data: Session | null; status: Status } {
  return useContext(AuthContext);
}

interface SignInOptions {
  email?: string;
  callbackUrl?: string;
}

export async function signIn(
  _provider?: string,
  options?: SignInOptions
): Promise<void> {
  const email = options?.email?.trim();
  if (!email) {
    // No explicit email (e.g. legacy "google" button). Route to /register so the
    // student can provide their heritage email.
    window.location.assign(options?.callbackUrl || "/register");
    return;
  }

  const info = parseHeritageEmail(email);
  const session: Session = {
    user: {
      name: info.fullName || email.split("@")[0],
      email,
      image: null,
      role: "student",
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  updateSession(session);
  window.location.assign(options?.callbackUrl || "/profile");
}

export async function signOut(options?: { callbackUrl?: string }): Promise<void> {
  updateSession(null);
  window.location.assign(options?.callbackUrl || "/");
}