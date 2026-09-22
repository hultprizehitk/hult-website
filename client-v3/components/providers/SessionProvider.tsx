"use client";

import React from "react";
import { SessionProvider as AuthSessionProvider } from "@/lib/auth-client";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}