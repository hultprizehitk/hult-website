"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ExternalLink, QrCode, RefreshCw, ShieldAlert, Smartphone, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type AuthErrorCode = "not_checked_in" | "not_registered" | "not_eligible" | "team_already_active" | "domain" | null;

interface ErrorMeta {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "amber" | "rose" | "purple";
  primaryCta?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

// One-line copy (repo rule: no text walls).
const ERROR_MAP: Record<string, ErrorMeta> = {
  not_checked_in: {
    title: "Scan your pass at the desk",
    badge: "Desk check-in",
    description: "Then sign in again.",
    icon: QrCode,
    color: "amber",
    primaryCta: { label: "Try again", icon: RefreshCw },
  },
  not_registered: {
    title: "No team found",
    badge: "Not registered",
    description: "This account is not on a registered Hult Ascend team.",
    icon: UserX,
    color: "rose",
    primaryCta: { label: "Team portal", href: "https://www.hultprizehitk.live/events", icon: ExternalLink },
  },
  not_eligible: {
    title: "Team not eligible",
    badge: "Submission required",
    description: "Only confirmed, submitted teams can play.",
    icon: ShieldAlert,
    color: "rose",
    primaryCta: { label: "Team portal", href: "https://www.hultprizehitk.live/events", icon: ExternalLink },
  },
  team_already_active: {
    title: "Your team is already playing",
    badge: "One device per team",
    description: "Follow along on the screen.",
    icon: Smartphone,
    color: "purple",
  },
  domain: {
    title: "College account required",
    badge: "Wrong account",
    description: "Use your @heritageit.edu.in Google account.",
    icon: AlertTriangle,
    color: "amber",
  },
  AccessDenied: {
    title: "Access not allowed",
    badge: "Not authorized",
    description: "Registered, desk-scanned players only.",
    icon: ShieldAlert,
    color: "amber",
    primaryCta: { label: "Try again", icon: RefreshCw },
  },
  CallbackRouteError: {
    title: "Could not verify sign-in",
    badge: "Try again",
    description: "Use your college Google account.",
    icon: AlertTriangle,
    color: "rose",
  },
  OAuthCallbackError: {
    title: "Google sign-in failed",
    badge: "Try again",
    description: "Use your college Google account.",
    icon: AlertTriangle,
    color: "rose",
  },
  admin_only: {
    title: "Organizers only",
    badge: "Admin console",
    description: "Players sign in from the quiz page.",
    icon: ShieldAlert,
    color: "rose",
    primaryCta: { label: "Go to quiz", href: "/quiz", icon: ExternalLink },
  },
};

function AuthErrorDialogInner({
  overrideCode,
  onDismiss,
}: {
  overrideCode?: string | null;
  onDismiss?: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = overrideCode ?? searchParams.get("error");
  const [dismissed, setDismissed] = useState<string | null>(null);
  const open = !!errorCode && !!ERROR_MAP[errorCode] && dismissed !== errorCode;

  if (!errorCode || !ERROR_MAP[errorCode]) return null;

  const meta = ERROR_MAP[errorCode];
  const Icon = meta.icon;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDismissed(errorCode);
      if (onDismiss) onDismiss();
      // Remove error from URL cleanly without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""));
    }
  };

  const handlePrimaryClick = () => {
    if (!meta.primaryCta?.href) {
      handleClose(false); // back to the sign-in button
      return;
    }
    if (meta.primaryCta?.href) {
      if (meta.primaryCta.href.startsWith("/")) {
        window.location.href = meta.primaryCta.href;
      } else {
        window.open(meta.primaryCta.href, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden border border-white/15 bg-[#0f0f14] p-6 text-center text-white sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-3">
          <div
            className={`flex size-14 items-center justify-center rounded-2xl border ${
              meta.color === "amber"
                ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                : meta.color === "purple"
                ? "border-purple-500/30 bg-purple-500/15 text-purple-300"
                : "border-rose-500/30 bg-rose-500/15 text-rose-300"
            }`}
          >
            <Icon className="size-7" />
          </div>

          <div
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${
              meta.color === "amber"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : meta.color === "purple"
                ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
            }`}
          >
            {meta.badge}
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-white">{meta.title}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-neutral-300 sm:text-sm">
            {meta.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex w-full flex-col gap-2.5 sm:flex-col sm:justify-stretch">
          {meta.primaryCta && (
            <Button
              type="button"
              onClick={handlePrimaryClick}
              className={`w-full rounded-xl py-2.5 font-bold ${
                meta.color === "amber"
                  ? "bg-amber-400 text-black hover:bg-amber-300"
                  : meta.color === "purple"
                  ? "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                  : "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              }`}
            >
              {meta.primaryCta.icon && <meta.primaryCta.icon className="size-4" />}
              {meta.primaryCta.label}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            className="w-full rounded-xl border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AuthErrorDialog(props: {
  overrideCode?: string | null;
  onDismiss?: () => void;
}) {
  return (
    <Suspense fallback={null}>
      <AuthErrorDialogInner {...props} />
    </Suspense>
  );
}
