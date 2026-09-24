export function isDevLoginEnabled(): boolean {
  if (process.env.QUIZ_DEV_LOGIN !== "true") return false;
  // Production builds refuse dev identity unless this deliberately scary flag is set in the shell for a
  // local load test against `next start`. Never set it on a deployed server (docs/quiz-runbook.md).
  return process.env.NODE_ENV !== "production" || process.env.QUIZ_UNSAFE_LOADTEST_DEV_LOGIN === "true";
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
