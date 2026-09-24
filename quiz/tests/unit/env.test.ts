import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevLoginEnabled } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("isDevLoginEnabled", () => {
  it("is off unless QUIZ_DEV_LOGIN=true", () => {
    vi.stubEnv("QUIZ_DEV_LOGIN", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevLoginEnabled()).toBe(false);
  });

  it("is on in development when requested", () => {
    vi.stubEnv("QUIZ_DEV_LOGIN", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevLoginEnabled()).toBe(true);
  });

  it("is refused in production without the explicit load-test override", () => {
    vi.stubEnv("QUIZ_DEV_LOGIN", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("QUIZ_UNSAFE_LOADTEST_DEV_LOGIN", "");
    expect(isDevLoginEnabled()).toBe(false);
    vi.stubEnv("QUIZ_UNSAFE_LOADTEST_DEV_LOGIN", "true");
    expect(isDevLoginEnabled()).toBe(true);
  });
});
