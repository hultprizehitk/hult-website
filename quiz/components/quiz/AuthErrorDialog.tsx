"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ExternalLink, QrCode, RefreshCw, ShieldAlert, Smartphone, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";

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

const ERROR_MAP: Record<string, ErrorMeta> = {
  not_checked_in: {
    title: "Venue Check-In Required",
    badge: "Check-In Pending",
    description:
      "You have not checked in at the venue yet. Please visit the registration desk at the SV Auditorium entrance to scan your digital QR entry pass before entering the quiz.",
    icon: QrCode,
    color: "amber",
    primaryCta: {
      label: "Refresh Check-In Status",
      icon: RefreshCw,
    },
  },
  not_registered: {
    title: "Not Registered for Hult Ascend",
    badge: "Registration Not Found",
    description:
      "Your college account is not registered on a verified team for HULT ASCEND : The Rise Begins. Only confirmed team participants can play.",
    icon: UserX,
    color: "rose",
    primaryCta: {
      label: "Visit Team Portal",
      href: "https://www.hultprizehitk.live/events",
      icon: ExternalLink,
    },
  },
  not_eligible: {
    title: "Team Registration Incomplete",
    badge: "Submission Required",
    description:
      "Your team roster has not been finalized or submitted. Only confirmed and fully submitted teams are eligible to participate in the live quiz.",
    icon: ShieldAlert,
    color: "rose",
    primaryCta: {
      label: "Complete Submission",
      href: "https://www.hultprizehitk.live/events",
      icon: ExternalLink,
    },
  },
  team_already_active: {
    title: "Team Device Limit Reached",
    badge: "1 Player Per Team",
    description:
      "A teammate is already active on another device for your team. Only one device per team can play. Please ask your active teammate to click Sign Out to hand over the device.",
    icon: Smartphone,
    color: "purple",
  },
  domain: {
    title: "College Account Required",
    badge: "Invalid Domain",
    description: "Please sign in using your official @heritageit.edu.in student or organizer Google account.",
    icon: AlertTriangle,
    color: "amber",
  },
  AccessDenied: {
    title: "Access Not Authorized",
    badge: "Authorization Required",
    description:
      "Your college account is not authorized or has not checked in at the venue. Only registered and venue checked-in participants can access the live quiz.",
    icon: ShieldAlert,
    color: "amber",
    primaryCta: {
      label: "Refresh Check-In Status",
      icon: RefreshCw,
    },
  },
  CallbackRouteError: {
    title: "Sign-In Verification Failed",
    badge: "Verification Error",
    description:
      "Could not verify your registration against the live database. Please ensure you are using your official college Google account.",
    icon: AlertTriangle,
    color: "rose",
  },
  OAuthCallbackError: {
    title: "Authentication Failed",
    badge: "OAuth Error",
    description:
      "Google authentication could not be completed. Please ensure you select your official @heritageit.edu.in account and try again.",
    icon: AlertTriangle,
    color: "rose",
  },
  admin_only: {
    title: "Admin Privileges Required",
    badge: "Organizers Only",
    description:
      "This portal is strictly reserved for event organizers and administrators. Participants must sign in from the main quiz portal.",
    icon: ShieldAlert,
    color: "rose",
    primaryCta: {
      label: "Go to Participant Quiz",
      href: "/signin",
      icon: ExternalLink,
    },
  },
  admin_must_use_admin_portal: {
    title: "Admin Portal Required",
    badge: "Organizer Account",
    description:
      "Your account has administrator privileges. Event organizers and admins must sign in through the Admin Console at /admin.",
    icon: ShieldAlert,
    color: "purple",
    primaryCta: {
      label: "Go to Admin Console",
      href: "/admin",
      icon: ExternalLink,
    },
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (errorCode && ERROR_MAP[errorCode]) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [errorCode]);

  if (!errorCode || !ERROR_MAP[errorCode]) return null;

  const meta = ERROR_MAP[errorCode];
  const Icon = meta.icon;

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      if (onDismiss) onDismiss();
      // Remove error from URL cleanly without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""));
    }
  };

  const handlePrimaryClick = () => {
    if (errorCode === "not_checked_in" || errorCode === "AccessDenied") {
      window.location.reload();
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
