"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 sm:text-sm",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-3.5 sm:h-8.5",
        icon: "size-9 sm:size-8",
        "icon-lg": "size-10 sm:size-9",
        "icon-sm": "size-8 sm:size-7",
        "icon-xl":
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-7 rounded-md sm:size-6 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-4 sm:h-9.5",
        sm: "h-8 gap-1.5 px-2.5 sm:h-7.5",
        xl: "h-11 px-5 text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 rounded-md px-2 text-sm sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "border-white/20 bg-white text-neutral-900 shadow-sm hover:bg-neutral-100 hover:text-black active:bg-neutral-200",
        destructive:
          "border-rose-500/40 bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:bg-rose-700",
        "destructive-outline":
          "border-rose-500/30 bg-rose-950/20 text-rose-300 shadow-sm hover:border-rose-500/50 hover:bg-rose-900/30 active:bg-rose-900/40",
        ghost:
          "border-transparent text-white/80 hover:bg-white/10 hover:text-white active:bg-white/15",
        link: "border-transparent text-white/90 underline-offset-4 hover:underline active:underline",
        outline:
          "border-white/15 bg-white/[0.05] text-white shadow-sm hover:bg-white/10 hover:border-white/25 active:bg-white/15",
        secondary:
          "border-white/10 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 active:bg-neutral-600",
        emerald:
          "border-emerald-500/40 bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700",
      },
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled: disabledProp,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = Boolean(loading || disabledProp);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={loading || undefined}
        data-loading={loading ? "" : undefined}
        data-slot="button"
        type={asChild ? undefined : "button"}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <span className="invisible inline-flex items-center gap-2">{children}</span>
            ) : (
              children
            )}
            {loading && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Loader2
                  className="size-4 animate-spin"
                  data-slot="button-loading-indicator"
                  aria-label="Loading"
                />
              </span>
            )}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";
