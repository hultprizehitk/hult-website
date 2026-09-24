import { describe, it, expect } from "vitest";
import { z } from "zod";
import { handle } from "@/lib/http";
import { QuizError } from "@/lib/quiz/errors";

describe("handle", () => {
  it("maps QuizError to its status and code", async () => {
    const res = await handle(async () => {
      throw new QuizError("not_taker", "Only the taker can answer");
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "not_taker", message: "Only the taker can answer" });
  });

  it("maps ZodError to 400 invalid_input", async () => {
    const res = await handle(async () => {
      z.object({ a: z.string() }).parse({});
      return new Response();
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_input");
  });

  it("maps unknown errors to 500", async () => {
    const res = await handle(async () => {
      throw new Error("boom");
    });
    expect(res.status).toBe(500);
  });
});
