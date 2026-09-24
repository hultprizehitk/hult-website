import Link from "next/link";
import { QuizShell } from "@/components/quiz/QuizShell";
import { GateCard } from "@/components/quiz/GateCard";
import { buttonVariants } from "@/components/ui/button";

export function AdminDenied({ email }: { email: string }) {
  return (
    <QuizShell>
      <GateCard tone="rose" badge="Access denied" title="Admins only" subtitle={email}>
        <Link
          href="/signin?callbackUrl=/admin"
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full rounded-2xl" })}
        >
          Switch account
        </Link>
      </GateCard>
    </QuizShell>
  );
}
