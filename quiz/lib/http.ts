import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { QuizError } from "@/lib/quiz/errors";

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorJson(code: string, message: string, status: number): NextResponse {
  return json({ error: code, message }, status);
}

/** Wraps a route body: maps QuizError / ZodError / bad JSON to typed JSON errors. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof QuizError) return errorJson(err.code, err.message, err.status);
    if (err instanceof ZodError) return errorJson("invalid_input", err.issues[0]?.message ?? "Invalid input", 400);
    if (err instanceof SyntaxError) return errorJson("invalid_input", "Malformed JSON", 400);
    console.error("[quiz api]", err);
    return errorJson("server_error", "Something went wrong", 500);
  }
}
