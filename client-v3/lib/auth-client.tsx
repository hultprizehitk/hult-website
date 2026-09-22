"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { parseHeritageEmail } from "@/lib/heritage-parser";

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

// In-memory session store (no localStorage persistence)
let currentSession: Session | null = null;
const sessionListeners = new Set<() => void>();

function emitSessionChange() {
  for (const listener of sessionListeners) listener();
}

function updateSession(session: Session | null) {
  currentSession = session;
  emitSessionChange();
}

function getSessionSnapshot(): Session | null {
  return currentSession;
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
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