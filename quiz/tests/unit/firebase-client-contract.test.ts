import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const participant = readFileSync(fileURLToPath(new URL("../../components/participant/ParticipantApp.tsx", import.meta.url)), "utf8");

describe("participant Firestore listener budget", () => {
  it("subscribes to the public session and one team document only", () => {
    expect(participant.match(/useDocData</g)).toHaveLength(2);
    expect(participant).not.toMatch(/useCollectionData|collection\(|query\(/);
  });
});
