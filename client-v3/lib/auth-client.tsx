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
}

export interface Session {
  user: SessionUser;
}

type Status = "loading" | "authenticated" | "unauthenticated";

const NO_SESSION: Session | null = null;

let currentSession: Session | null = null;
const sessionListeners = new Set<() => void>();

function emitSessionChange() {
  for (const listener of sessionListeners) listener();
}

export function setClientSession(session: Session | null) {
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

export function SessionProvider({ children }: { children: React.ReactNode }) {
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

export function signIn(_provider?: string, options?: { email?: string; callbackUrl?: string }): void {
  const email = options?.email?.trim();
  if (!email) {
    if (typeof window !== "undefined") {
      window.location.assign(options?.callbackUrl ? `/register?callbackUrl=${encodeURIComponent(options.callbackUrl)}` : "/register");
    }
    return;
  }

  const info = parseHeritageEmail(email);
  const session: Session = {
    user: {
      name: info.fullName || email.split("@")[0],
      email,
      image: null,
    },
  };
  setClientSession(session);
  if (typeof window !== "undefined") {
    window.location.assign(options?.callbackUrl || "/profile");
  }
}

export function signOut(options?: { callbackUrl?: string }): void {
  setClientSession(null);
  if (typeof window !== "undefined") {
    window.location.assign(options?.callbackUrl || "/");
  }
}