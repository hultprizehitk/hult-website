import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizError } from "@/lib/quiz/errors";

const { requireActor, mintFirebaseToken } = vi.hoisted(() => ({
  requireActor: vi.fn(),
  mintFirebaseToken: vi.fn(),
}));

vi.mock("@/lib/actor", () => ({ requireActor }));
vi.mock("@/lib/firebase/token", () => ({ mintFirebaseToken }));

import { GET } from "@/app/api/firebase-token/route";

describe("GET /api/firebase-token", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when there is no NextAuth user", async () => {
    requireActor.mockRejectedValue(new QuizError("unauthenticated"));
    const response = await GET(new Request("http://localhost/api/firebase-token"));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: "unauthenticated" });
    expect(mintFirebaseToken).not.toHaveBeenCalled();
  });

  it("mints a Firebase token for the authenticated email", async () => {
    requireActor.mockResolvedValue({ email: "admin@heritageit.edu.in", name: "Admin" });
    mintFirebaseToken.mockResolvedValue({ token: "firebase-token", email: "admin@heritageit.edu.in", admin: true });
    const response = await GET(new Request("http://localhost/api/firebase-token"));
    expect(response.status).toBe(200);
    expect(mintFirebaseToken).toHaveBeenCalledWith("admin@heritageit.edu.in");
    expect(await response.json()).toMatchObject({ token: "firebase-token", admin: true });
  });
});
