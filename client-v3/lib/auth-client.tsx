"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { parseHeritageEmail } from "@/lib/heritage-parser";

const SESSION_KEY = "hult_v3_session";

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
  if (typeof window === "undefined") return null;
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
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // storage may be blocked
  }
}

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