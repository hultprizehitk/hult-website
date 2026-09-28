import { describe, it, expect } from "vitest";
import { bulkQuestionSchema, codeSchema, controlSchema, joinSchema, questionInputSchema, reorderSchema, teamAdminSchema } from "@/lib/quiz/validation";

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
  it("has no out-of-order publish, and reset needs the typed confirmation", () => {
    expect(controlSchema.safeParse({ type: "publish_question", index: 0 }).success).toBe(false);
    expect(controlSchema.safeParse({ type: "reveal" }).success).toBe(false);
    expect(controlSchema.safeParse({ type: "show_results" }).success).toBe(true);
    expect(controlSchema.safeParse({ type: "reset_event" }).success).toBe(false);
    expect(controlSchema.safeParse({ type: "reset_event", confirm: "reset" }).success).toBe(false);
    expect(controlSchema.safeParse({ type: "reset_event", confirm: "RESET" }).success).toBe(true);
  });
  it("accepts Firestore question ids for reorder (not MongoDB ids)", () => {
    expect(reorderSchema.safeParse({ ids: ["Xk3pQ9aLm2Rt7Bv0Nc4e", "a1B2c3D4e5F6g7H8i9J0"] }).success).toBe(true);
    expect(reorderSchema.safeParse({ ids: ["bad/id"] }).success).toBe(false);
  });
  it("bulk edit needs at least one field in range", () => {
    expect(bulkQuestionSchema.safeParse({}).success).toBe(false);
    expect(bulkQuestionSchema.safeParse({ timeLimitSec: 4 }).success).toBe(false);
    expect(bulkQuestionSchema.safeParse({ points: 50 }).success).toBe(true);
  });
  it("team actions accept MongoDB ids and seeded ids, nothing path-like", () => {
    expect(teamAdminSchema.safeParse({ action: "free_seat", teamId: "6ab408ecabbcbb77e95c6d98" }).success).toBe(true);
    expect(teamAdminSchema.safeParse({ action: "free_seat", teamId: "dev-team-01" }).success).toBe(true);
    expect(teamAdminSchema.safeParse({ action: "free_seat", teamId: "../x" }).success).toBe(false);
  });
  it("join defaults claim to false", () => {
    expect(joinSchema.parse({ deviceId: "device-aaaaaaaa" })).toEqual({ deviceId: "device-aaaaaaaa", claim: false });
  });
  it("accepts only 6-digit codes", () => {
    expect(codeSchema.safeParse("123456").success).toBe(true);
    expect(codeSchema.safeParse("12345a").success).toBe(false);
  });
});
