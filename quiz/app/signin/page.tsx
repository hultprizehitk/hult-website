import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { isDevLoginEnabled } from "@/lib/env";
import { QuizShell } from "@/components/quiz/QuizShell";
import { GateCard } from "@/components/quiz/GateCard";
import { GoogleIcon } from "@/components/quiz/GoogleIcon";
import { AuthErrorDialog } from "@/components/quiz/AuthErrorDialog";
import { InAppBrowserHint } from "@/components/quiz/InAppBrowserHint";
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
      <GateCard badge="Hult Ascend" title="Sign in to play" subtitle="College Google account">
        <InAppBrowserHint />
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
