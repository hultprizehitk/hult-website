"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "destructive-outline" | "emerald";
type Size = "default" | "sm" | "lg" | "xs" | "icon" | "icon-sm";

export function ConfirmButton({
  label,
  title,
  description,
  onConfirm,
  variant = "default",
  size = "default",
  disabled = false,
  icon,
  iconOnly = false,
  className,
}: {
  label: string;
  title: string;
  description?: string;
  onConfirm: () => unknown | Promise<unknown>;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const danger = variant === "destructive" || variant === "destructive-outline";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={variant} size={size} disabled={disabled} aria-label={label} className={className} onClick={() => setOpen(true)}>
        {icon}
        {!iconOnly && label}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={danger ? "destructive" : "default"}
            onClick={async () => {
              setOpen(false);
              await onConfirm();
            }}
          >
            {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
