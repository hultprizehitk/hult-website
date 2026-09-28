import { toast } from "sonner";
import { api, type ApiError } from "./api";
import type { ControlAction } from "@/lib/quiz/types";

/**
 * Sends one host action with the console's stateVersion. A 409 conflict means another click or another admin
 * already moved the quiz on; the live listener shows the new state, so it is not reported as an error.
 */
export async function sendControl(code: string, action: ControlAction & { confirm?: string }, expectedVersion: number): Promise<boolean> {
  try {
    await api(`/api/admin/sessions/${code}/control`, { body: { ...action, expectedVersion } });
    return true;
  } catch (e) {
    const err = e as ApiError;
    if (err.code !== "conflict") toast.error(err.message);
    return false;
  }
}
