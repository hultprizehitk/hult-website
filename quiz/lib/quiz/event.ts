/** The one live session on event day (Hult Ascend). Client-safe: no server imports. */
export const HULT_ASCEND_FIXED_CODE = "470009";

/** Phone URL for a session: the event session lives at /quiz (the projector QR points there). */
export function playPath(code: string): string {
  return code === HULT_ASCEND_FIXED_CODE ? "/quiz" : `/s/${code}`;
}
