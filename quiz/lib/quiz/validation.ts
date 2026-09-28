import { z } from "zod";

export const codeSchema = z.string().regex(/^\d{6}$/, "Code must be 6 digits");
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
/** Team document ids: MongoDB ObjectIds from sync (other ids in the emulator seed). */
const teamIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Invalid team id");
/** Firestore auto-ids (20 chars) for questions. */
export const questionIdSchema = z.string().regex(/^[A-Za-z0-9]{1,40}$/, "Invalid question id");
const deviceIdSchema = z.string().min(8).max(64);
const emailSchema = z.string().trim().toLowerCase().email();

export const questionInputSchema = z
  .object({
    text: z.string().trim().min(1).max(300),
    options: z.array(z.string().trim().min(1).max(120)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    points: z.number().int().min(1).max(1000).default(100),
    timeLimitSec: z.number().int().min(5).max(120).default(20),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: "correctIndex out of range",
    path: ["correctIndex"],
  });
export type QuestionInput = z.infer<typeof questionInputSchema>;

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  eventId: objectIdSchema,
  requireSubmitted: z.boolean().default(true),
});

export const updateSessionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  requireSubmitted: z.boolean().optional(),
});

export const controlSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open_lobby") }),
  z.object({ type: z.literal("toggle_checkin") }),
  z.object({ type: z.literal("start") }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("close_now") }),
  z.object({ type: z.literal("extend"), seconds: z.number().int().min(5).max(60) }),
  z.object({ type: z.literal("restart_question") }),
  z.object({ type: z.literal("publish_question"), index: z.number().int().min(0) }),
  z.object({ type: z.literal("show_results") }),
  z.object({ type: z.literal("end") }),
  z.object({ type: z.literal("reset_event"), confirm: z.literal("RESET") }),
]);
export type ControlInput = z.infer<typeof controlSchema>;

/** claim: take a free seat or move your own seat to this device ("Play here"). */
export const joinSchema = z.object({ deviceId: deviceIdSchema, claim: z.boolean().default(false) });

export const answerSchema = z.object({
  questionId: questionIdSchema,
  optionIndex: z.number().int().min(0).max(5),
  deviceId: deviceIdSchema,
});
export type AnswerInput = z.infer<typeof answerSchema>;

export const teamAdminSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reassign_taker"), teamId: teamIdSchema, email: emailSchema }),
  z.object({ action: z.literal("free_seat"), teamId: teamIdSchema }),
]);
export type TeamAdminInput = z.infer<typeof teamAdminSchema>;

export const importSchema = z.object({
  csv: z.string().max(300_000, "File too large"),
  mode: z.enum(["append", "replace"]).default("append"),
  dryRun: z.boolean().default(true),
});

export const reorderSchema = z.object({ ids: z.array(questionIdSchema).min(1) });

/** Bulk edit from the Questions tab: apply the same time and/or points to every question. */
export const bulkQuestionSchema = z
  .object({
    points: z.number().int().min(1).max(1000).optional(),
    timeLimitSec: z.number().int().min(5).max(120).optional(),
  })
  .refine((b) => b.points !== undefined || b.timeLimitSec !== undefined, { message: "Nothing to change" });
