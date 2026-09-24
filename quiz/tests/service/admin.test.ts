import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { startDb, clearDb, stopDb } from "../helpers/db";
import { isAdminEmail } from "@/lib/admin";
import { User } from "@/models/mirror";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  process.env.ADMIN_EMAILS = "boss@heritageit.edu.in";
});

describe("isAdminEmail", () => {
  it("accepts env admins case-insensitively", async () => {
    expect(await isAdminEmail("Boss@heritageit.edu.in")).toBe(true);
  });

  it("accepts db admin roles and rejects plain users", async () => {
    await User.create({ name: "L", email: "lead@heritageit.edu.in", role: "lead_admin" });
    await User.create({ name: "U", email: "user@heritageit.edu.in", role: "user" });
    expect(await isAdminEmail("lead@heritageit.edu.in")).toBe(true);
    expect(await isAdminEmail("user@heritageit.edu.in")).toBe(false);
    expect(await isAdminEmail("nobody@heritageit.edu.in")).toBe(false);
  });
});
