import { clsx, type ClassValue } from "clsx";

export type { ClassValue };

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
