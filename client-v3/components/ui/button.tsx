import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-[#f20089] text-white hover:bg-[#d8007a] shadow-md shadow-[#f20089]/20",
      outline: "border border-white/20 bg-white/[0.05] hover:bg-white/10 text-white",
      secondary: "bg-white/10 text-white hover:bg-white/15",
      ghost: "hover:bg-white/10 text-white/80 hover:text-white",
      destructive: "bg-red-600/80 text-white hover:bg-red-600",
      link: "text-[#f20089] underline-offset-4 hover:underline",
    }[variant];

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-xs font-semibold",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-11 rounded-2xl px-6 text-sm",
      icon: "h-9 w-9 p-0",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#f20089]/50",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
