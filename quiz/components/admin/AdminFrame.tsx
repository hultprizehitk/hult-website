import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";

/** Server component: admin layout + header, mirroring client-v3/app/admin/layout.tsx and DashboardNav. */
export function AdminFrame({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-black text-white selection:bg-white/25 selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <DotPattern width={32} height={32} cx={1} cy={1} cr={0.8} className="fill-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#08080a] px-4 py-3.5 shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image src="/Hult-Prize.png" alt="Hult Prize" fill sizes="48px" className="object-contain drop-shadow" priority />
          </Link>
          <div className="h-5 w-px bg-white/20" />
          <span className="text-xs font-extrabold tracking-wider sm:text-sm">
            QUIZ <span className="text-neutral-400">ADMIN</span>
          </span>
          <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300 sm:inline-block">
            Live control
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-white/60 md:inline-block">
            Logged in as <span className="font-medium text-white">{email}</span>
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="destructive-outline" size="sm" className="rounded-full text-xs">
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
