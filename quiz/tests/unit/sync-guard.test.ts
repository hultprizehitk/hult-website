import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The Mongo key used for team sync may have write rights (lead decision F12). The reader must stay read-only.
const WRITE_METHODS =
  /\.(create|insertMany|insertOne|updateOne|updateMany|replaceOne|findOneAndUpdate|findByIdAndUpdate|findOneAndReplace|findOneAndDelete|findByIdAndDelete|deleteOne|deleteMany|bulkWrite|save|remove|drop|dropCollection)\s*\(/;

describe("lib/sync/mongo-read.ts", () => {
  it("contains no MongoDB write calls", () => {
    const src = readFileSync("lib/sync/mongo-read.ts", "utf8");
    expect(src.match(WRITE_METHODS)?.[0] ?? null).toBeNull();
  });

  it("is the only runtime module importing the Mongo models or connection", () => {
    const hits = execSync('git -c safe.directory=* grep --untracked -l -E "@/models/mirror|@/lib/db\\"" -- app components hooks lib', { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => p.replace(/^quiz\//, ""));
    expect(hits.sort()).toEqual(["lib/sync/mongo-read.ts"]);
  });
});
