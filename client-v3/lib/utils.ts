import { clsx, type ClassValue } from "clsx";

export type { ClassValue };

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
