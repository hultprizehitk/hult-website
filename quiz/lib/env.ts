export function isDevLoginEnabled(): boolean {
  return process.env.QUIZ_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";
}

export function adminEmailsFromEnv(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isHeritageEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith("@heritageit.edu.in");
}
