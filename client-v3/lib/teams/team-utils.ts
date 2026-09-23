import crypto from "crypto";

/**
 * Shared utility functions for team management, validation, and generation.
 */

/**
 * Generates an 8-character human-friendly team invite code (e.g., HULT-7K9M).
 * Excludes easily confusable characters (I, 1, O, 0).
 * Uses cryptographically secure random number generator.
 */
export function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HULT-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

/**
 * Strips all non-digit characters from an input value, optionally limiting length.
 */
export function sanitizeNumeric(value: unknown, maxLength?: number): string {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "").trim();
  return maxLength ? digits.slice(0, maxLength) : digits;
}

/**
 * Validates that a contact phone number is exactly 10 digits.
 */
export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

/**
 * Validates that a college roll number contains numbers only.
 */
export function isValidRoll(roll: string): boolean {
  return /^\d+$/.test(roll);
}
