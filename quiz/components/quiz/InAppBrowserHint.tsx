"use client";

import { useSyncExternalStore } from "react";
import { ExternalLink } from "lucide-react";

const subscribe = () => () => {};
// Google blocks sign-in inside embedded browsers (Instagram, WhatsApp, Google app/Lens, Facebook, LINE).
const IN_APP = /\b(FBAN|FBAV|Instagram|WhatsApp|Line\/|GSA\/|; wv\))/i;

/** Shown when the QR opened inside another app's browser, where Google sign-in fails. */
export function InAppBrowserHint() {
  const inApp = useSyncExternalStore(subscribe, () => IN_APP.test(navigator.userAgent), () => false);
  if (!inApp) return null;
  return (
    <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-left text-xs text-amber-200">
      <ExternalLink className="size-4 shrink-0" />
      Open this page in Chrome or Safari to sign in
    </div>
  );
}
