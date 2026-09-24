import Image from "next/image";
import Link from "next/link";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

/** Page frame shared by every quiz screen; mirrors the admin dashboard layout + header (client-v3/app/admin). */
export function QuizShell({
  code,
  right,
  wide = false,
  children,
}: {
  code?: string;
  right?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <DotPattern
          width={32}
          height={32}
          cx={1}
          cy={1}
          cr={0.8}
          className="fill-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#08080a] px-4 py-3 shadow-md sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image src="/Hult-Prize.png" alt="Hult Prize" fill sizes="48px" className="object-contain drop-shadow" priority />
          </span>
          <span className="h-5 w-px bg-white/20" />
          <span className="text-xs font-extrabold tracking-wider sm:text-sm">
            QUIZ <span className="text-neutral-400">LIVE</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {code && (
            <span className="rounded-full border border-white/15 bg-[#16161d] px-3 py-1 font-mono text-xs font-bold tracking-widest text-white">
              #{code}
            </span>
          )}
          {right}
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto flex w-full flex-1 flex-col px-4 pt-6 pb-10 sm:px-6",
          wide ? "max-w-7xl lg:px-8" : "max-w-xl",
        )}
      >
        {children}
      </main>
    </div>
  );
}
