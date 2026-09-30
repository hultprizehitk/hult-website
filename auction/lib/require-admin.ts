import { NextResponse } from "next/server";
import {
  getSessionFromRawRequest,
  isAuthorizedAdminRole,
  AdminSessionPayload,
} from "@/lib/auth";

export type AdminGuard =
  | { ok: true; session: AdminSessionPayload }
  | { ok: false; response: NextResponse };

/**
 * Server-side authorization for every auction mutation.
 *
 * Middleware only checks that a cookie is *present*, so on its own it accepts
 * any forged value. Every route that writes to the auction must call this and
 * return `guard.response` when `ok` is false, otherwise the write is
 * unauthenticated.
 */
export function requireAdmin(req: Request): AdminGuard {
  const session = getSessionFromRawRequest(req);

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Admin session missing or invalid." },
        { status: 401 }
      ),
    };
  }

  if (!isAuthorizedAdminRole(session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: `Forbidden. Role '${session.role}' cannot modify the auction.` },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session };
}
