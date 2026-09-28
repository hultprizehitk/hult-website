import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signIn } from "@/auth";
import { isDevLoginEnabled } from "@/lib/env";
import { QuizShell } from "@/components/quiz/QuizShell";
import { GateCard } from "@/components/quiz/GateCard";
import { GoogleIcon } from "@/components/quiz/GoogleIcon";
import { AuthErrorDialog } from "@/components/quiz/AuthErrorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";

export function AdminSignIn({ error }: { error?: string }) {
  return (
    <QuizShell>
      <AuthErrorDialog overrideCode={error} />
      <GateCard badge="ADMIN CONSOLE" title="Organizer Sign In" subtitle="Restricted to authorized event administrators">
        <AdminErrorBanner overrideError={error} />

        <form
          action={async () => {
            "use server";
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            cookieStore.set("quiz_portal", "admin", { path: "/", maxAge: 600, httpOnly: true });
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <Button type="submit" size="xl" className="w-full rounded-2xl font-bold bg-white text-black hover:bg-neutral-200">
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
          <span>Participant?</span>
          <Link href="/signin" className="inline-flex items-center gap-0.5 font-medium text-pink-400 hover:text-pink-300 hover:underline">
            <span>Sign in to play quiz</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {isDevLoginEnabled() && (
          <form
            action={async (fd: FormData) => {
              "use server";
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              cookieStore.set("quiz_portal", "admin", { path: "/", maxAge: 600, httpOnly: true });
              const email = String(fd.get("email") ?? "").toLowerCase().trim();
              try {
                await signIn("dev", { email, redirectTo: "/admin" });
              } catch (err) {
                if (err instanceof AuthError) {
                  redirect(`/admin?error=${err.type}`);
                }
                throw err;
              }
            }}
            className="mt-6 flex flex-col gap-2 rounded-xl border border-dashed border-amber-500/30 bg-black/60 p-3 text-left"
          >
            <Label htmlFor="admin-dev-email" className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
              Admin Dev login
            </Label>
            <Input
              id="admin-dev-email"
              name="email"
              type="email"
              placeholder="harsh.raj.iotcs28@heritageit.edu.in"
              required
            />
            <Button type="submit" variant="secondary">
              Sign in as Admin
            </Button>
          </form>
        )}
      </GateCard>
    </QuizShell>
  );
}
