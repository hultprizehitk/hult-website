"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AdminErrorBannerInner({ overrideError }: { overrideError?: string }) {
  const searchParams = useSearchParams();
  const error = overrideError ?? searchParams.get("error");
  if (!error) return null;

  return (
    <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-left text-xs text-rose-300">
      <div className="mb-1 font-bold text-rose-200">
        {error === "admin_only"
          ? "Admin Privileges Required"
          : error === "domain"
          ? "College Account Required"
          : "Sign-In Verification Notice"}
      </div>
      <p className="leading-relaxed text-rose-300/90">
        {error === "admin_only"
          ? "This console is strictly reserved for event organizers and administrators. Participants must sign in from the main quiz portal."
          : error === "domain"
          ? "Please sign in using your official @heritageit.edu.in organizer account."
          : "Authentication could not be completed. Please ensure you select your authorized administrator account and try again."}
      </p>
      {error === "admin_only" && (
        <div className="mt-2.5 border-t border-rose-500/20 pt-2 text-[11px]">
          <Link
            href="/signin"
            className="font-medium text-white underline hover:text-rose-200"
          >
            Go to Participant Quiz Portal &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export function AdminErrorBanner(props: { overrideError?: string }) {
  return (
    <Suspense fallback={null}>
      <AdminErrorBannerInner {...props} />
    </Suspense>
  );
}
