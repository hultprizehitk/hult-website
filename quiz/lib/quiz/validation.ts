import { z } from "zod";

export const codeSchema = z.string().regex(/^\d{6}$/, "Code must be 6 digits");
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
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
  z.object({ type: z.literal("reveal") }),
  z.object({ type: z.literal("show_leaderboard") }),
  z.object({ type: z.literal("end") }),
]);
export type ControlInput = z.infer<typeof controlSchema>;

export const joinSchema = z.object({ deviceId: deviceIdSchema });
export const takerSchema = z.object({ email: emailSchema });

export const answerSchema = z.object({
  questionId: objectIdSchema,
  optionIndex: z.number().int().min(0).max(5),
  deviceId: deviceIdSchema,
});
export type AnswerInput = z.infer<typeof answerSchema>;

export const teamAdminSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("checkin"), teamId: objectIdSchema }),
  z.object({ action: z.literal("reassign_taker"), teamId: objectIdSchema, email: emailSchema }),
  z.object({ action: z.literal("reset_device"), teamId: objectIdSchema }),
]);
export type TeamAdminInput = z.infer<typeof teamAdminSchema>;

export const reorderSchema = z.object({ ids: z.array(objectIdSchema).min(1) });
