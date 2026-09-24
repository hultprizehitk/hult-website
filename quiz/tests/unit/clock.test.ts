import { describe, it, expect } from "vitest";
import { computeOffset, OffsetEstimator, secondsLeft } from "@/lib/quiz/clock";

describe("clock", () => {
  it("computes offset from a symmetric round trip", () => {
    expect(computeOffset(1000, 1200, 5100)).toEqual({ offset: 4000, rtt: 200 });
  });
  it("prefers the lowest-rtt sample", () => {
    const e = new OffsetEstimator();
    e.add({ offset: 900, rtt: 400 });
    e.add({ offset: 1000, rtt: 50 });
    e.add({ offset: 1100, rtt: 300 });
    expect(e.offset).toBe(1000);
  });
  it("returns 0 with no samples", () => {
    expect(new OffsetEstimator().offset).toBe(0);
  });
  it("rounds seconds left up and floors at zero", () => {
    expect(secondsLeft(10_001, 0)).toBe(11);
    expect(secondsLeft(0, 5)).toBe(0);
  });
});
