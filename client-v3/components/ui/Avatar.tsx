import { cn, getInitials } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-pink-500/20 text-pink-200",
  "bg-amber-500/20 text-amber-200",
  "bg-emerald-500/20 text-emerald-200",
  "bg-sky-500/20 text-sky-200",
  "bg-violet-500/20 text-violet-200",
  "bg-orange-500/20 text-orange-200",
];

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  lg: "h-14 w-14 text-lg",
};

/** Initials avatar; the hue is derived from the name so a person keeps the same color everywhere. */
export default function Avatar({ name, size = "sm" }: { name: string; size?: keyof typeof SIZES }) {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size],
        AVATAR_TONES[hash % AVATAR_TONES.length]
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
