import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/auth";
import { isDevLoginEnabled } from "@/lib/env";
import { QuizShell } from "@/components/quiz/QuizShell";
import { GateCard } from "@/components/quiz/GateCard";
import { GoogleIcon } from "@/components/quiz/GoogleIcon";
import { AuthErrorDialog } from "@/components/quiz/AuthErrorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safePath(p: string | undefined): string {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safePath(callbackUrl);

  return (
    <QuizShell>
      <AuthErrorDialog overrideCode={error} />
      <GateCard badge="College account" title="Sign in" subtitle="@heritageit.edu.in accounts only">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-left text-xs text-rose-300">
            <div className="mb-1 font-bold text-rose-200">
              {error === "not_checked_in"
                ? "Venue Check-In Required"
                : error === "domain"
                ? "College Account Required"
                : error === "not_registered"
                ? "Registration Not Found"
                : error === "not_eligible"
                ? "Team Registration Incomplete"
                : error === "team_already_active"
                ? "Team Device Limit Reached"
                : error === "admin_must_use_admin_portal"
                ? "Admin Portal Required"
                : error === "AccessDenied"
                ? "Access Not Authorized"
                : "Sign-In Verification Notice"}
            </div>
            <p className="leading-relaxed text-rose-300/90">
              {error === "not_checked_in"
                ? "You have not checked in at the venue yet. Please visit the registration desk at the SV Auditorium entrance to scan your digital QR entry pass."
                : error === "domain"
                ? "Please use your official @heritageit.edu.in college Google account."
                : error === "not_registered"
                ? "Your account is not registered on a verified team for Hult Ascend. Only confirmed team participants can play."
                : error === "not_eligible"
                ? "Your team roster has not been finalized or confirmed. Only confirmed teams can access the live quiz."
                : error === "team_already_active"
                ? "A teammate is already active on another device for your team. Only one device per team can play. Please ask your active teammate to click Sign Out to hand over the device."
                : error === "admin_must_use_admin_portal"
                ? "Your account has administrator privileges. Event organizers and admins must sign in through the Admin Console at /admin."
                : error === "AccessDenied"
                ? "Only registered and venue checked-in participants can access the live quiz."
                : "Authentication could not be completed. Please ensure you select your official @heritageit.edu.in account and try again."}
            </p>
            {(error === "not_registered" || error === "not_eligible") && (
              <div className="mt-2.5 border-t border-rose-500/20 pt-2 text-[11px]">
                <a
                  href="https://www.hultprizehitk.live/events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white underline hover:text-rose-200"
                >
                  Visit Team Registration Portal &rarr;
                </a>
              </div>
            )}
            {error === "not_checked_in" && (
              <div className="mt-2.5 border-t border-rose-500/20 pt-2 text-[11px] font-medium text-amber-200/90">
                Registration desk is located at the SV Auditorium entrance.
              </div>
            )}
            {error === "admin_must_use_admin_portal" && (
              <div className="mt-2.5 border-t border-rose-500/20 pt-2 text-[11px]">
                <Link
                  href="/admin"
                  className="font-medium text-purple-300 underline hover:text-white"
                >
                  Go to Admin Console &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
        <form
          action={async () => {
            "use server";
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            cookieStore.set("quiz_portal", "participant", { path: "/", maxAge: 600, httpOnly: true });
            await signIn("google", { redirectTo });
          }}
        >
          <Button type="submit" size="xl" className="w-full rounded-2xl font-bold">
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
          <span>Organizer or Host?</span>
          <Link href="/admin" className="font-medium text-pink-400 hover:text-pink-300 hover:underline">
            Admin Console &rarr;
          </Link>
        </div>

        {isDevLoginEnabled() && (
          <form
            action={async (fd: FormData) => {
              "use server";
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              cookieStore.set("quiz_portal", "participant", { path: "/", maxAge: 600, httpOnly: true });
              try {
                await signIn("dev", { email: String(fd.get("email") ?? ""), redirectTo });
              } catch (err) {
                // Auth.js throws (instead of redirecting) on bad credentials; the success path throws
                // Next's redirect, which must propagate, so only AuthError is handled here.
                if (err instanceof AuthError) {
                  redirect(`/signin?error=${err.type}&callbackUrl=${encodeURIComponent(redirectTo)}`);
                }
                throw err;
              }
            }}
            className="mt-6 flex flex-col gap-2 rounded-xl border border-dashed border-amber-500/30 bg-black/60 p-3 text-left"
          >
            <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
              Dev login
            </Label>
            <Input id="email" name="email" type="email" placeholder="dev.t01.lead@heritageit.edu.in" required />
            <Button type="submit" variant="secondary">
              Sign in
            </Button>
          </form>
        )}
      </GateCard>
    </QuizShell>
  );
}
