import { describe, it, expect } from "vitest";
import { questionInputSchema, controlSchema, codeSchema } from "@/lib/quiz/validation";

describe("validation", () => {
  it("applies question defaults", () => {
    const q = questionInputSchema.parse({ text: " Q ", options: ["a", "b"], correctIndex: 1 });
    expect(q).toEqual({ text: "Q", options: ["a", "b"], correctIndex: 1, points: 100, timeLimitSec: 20 });
  });
  it("rejects correctIndex outside options", () => {
    expect(questionInputSchema.safeParse({ text: "Q", options: ["a", "b"], correctIndex: 2 }).success).toBe(false);
  });
  it("rejects 1 or 7 options", () => {
    expect(questionInputSchema.safeParse({ text: "Q", options: ["a"], correctIndex: 0 }).success).toBe(false);
    expect(
      questionInputSchema.safeParse({ text: "Q", options: ["a", "b", "c", "d", "e", "f", "g"], correctIndex: 0 }).success,
    ).toBe(false);
  });
  it("bounds extend seconds", () => {
    expect(controlSchema.safeParse({ type: "extend", seconds: 4 }).success).toBe(false);
    expect(controlSchema.safeParse({ type: "extend", seconds: 15 }).success).toBe(true);
  });
  it("accepts only 6-digit codes", () => {
    expect(codeSchema.safeParse("123456").success).toBe(true);
    expect(codeSchema.safeParse("12345a").success).toBe(false);
  });
});
