import { useId } from "react";
import { cn } from "@/lib/utils";

// Same background pattern as client-v3/components/ui/dot-pattern.tsx (admin dashboard).
export function DotPattern({
  width = 24,
  height = 24,
  cx = 1,
  cy = 0.5,
  cr = 0.5,
  className,
}: {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg aria-hidden="true" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}
