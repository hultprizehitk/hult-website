import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { startDb, clearDb, stopDb } from "../helpers/db";
import { QuizAnswer, QuizTeam } from "@/models/quiz";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("quiz model indexes", () => {
  it("rejects a second answer for the same team and question", async () => {
    const base = {
      sessionId: new Types.ObjectId(),
      teamId: new Types.ObjectId(),
      questionId: new Types.ObjectId(),
      questionIndex: 0,
      takerEmail: "a@heritageit.edu.in",
      optionIndex: 1,
      isCorrect: true,
      pointsAwarded: 100,
      responseMs: 1000,
      answeredAt: new Date(),
    };
    await QuizAnswer.create(base);
    await expect(QuizAnswer.create({ ...base, optionIndex: 2 })).rejects.toMatchObject({ code: 11000 });
  });

  it("rejects a duplicate team check-in for the same session", async () => {
    const base = { sessionId: new Types.ObjectId(), teamId: new Types.ObjectId(), takerEmail: "x@heritageit.edu.in" };
    await QuizTeam.create(base);
    await expect(QuizTeam.create(base)).rejects.toMatchObject({ code: 11000 });
  });
});
