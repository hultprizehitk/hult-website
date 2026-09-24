import { describe, it, expect } from "vitest";
import { randomId, getDeviceId } from "@/lib/client/device";

describe("device id", () => {
  it("generates 32 hex chars", () => {
    expect(randomId()).toMatch(/^[0-9a-f]{32}$/);
  });
  it("falls back to a stable in-memory id without localStorage", () => {
    const a = getDeviceId();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(getDeviceId()).toBe(a);
  });
});
