import { UserMinus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RosterPerson {
  name?: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
}

interface TeamRosterProps {
  lead: RosterPerson;
  members?: RosterPerson[];
  currentUserEmail?: string;
  canRemove?: boolean;
  disabled?: boolean;
  isRemoving?: (email: string) => boolean;
  onRemove?: (email: string, name: string) => void;
  className?: string;
}

export default function TeamRoster({
  lead,
  members = [],
  currentUserEmail,
  canRemove = false,
  disabled = false,
  isRemoving,
  onRemove,
  className,
}: TeamRosterProps) {
  const viewerEmail = currentUserEmail?.toLowerCase().trim();
  const rows = [{ ...lead, isLead: true }, ...members.map((m) => ({ ...m, isLead: false }))];

  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((m, idx) => {
        const name = m.name || m.email;
        const tags = [m.isLead && "Lead", m.email?.toLowerCase() === viewerEmail && "You"].filter(Boolean);

        return (
          <li key={`${m.email}-${idx}`} className="flex items-center gap-3">
            <Avatar name={name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                {name}
                {tags.length > 0 && <span className="ml-2 text-xs text-pink-300/80">{tags.join(" · ")}</span>}
              </p>
              <p className="truncate text-xs text-white/45">
                {[m.department, m.roll, m.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
            {canRemove && !m.isLead && onRemove && (
              <Button
                variant="ghost"
                size="xs"
                disabled={disabled}
                loading={isRemoving?.(m.email)}
                onClick={() => onRemove(m.email, name)}
                aria-label={`Remove ${name} from team`}
              >
                <UserMinus />
                Remove
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
