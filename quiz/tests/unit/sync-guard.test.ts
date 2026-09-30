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
});

// The reader stays read-only. Publishing the final top 10 to the auction needs one deliberate writer.
describe("MongoDB write surface", () => {
  const MONGO_IMPORTS = '-l -E "@/models/mirror|@/lib/db\\"" -- app components hooks lib';

  const mongoModules = () =>
    execSync(`git -c safe.directory=* grep --untracked ${MONGO_IMPORTS}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => p.replace(/^quiz\//, ""));

  it("touches MongoDB only from the reader and the publisher", () => {
    expect(mongoModules().sort()).toEqual(["lib/sync/mongo-publish.ts", "lib/sync/mongo-read.ts"]);
  });

  it("confines every write call to the publisher", () => {
    const writers = mongoModules().filter((p) => readFileSync(p, "utf8").match(WRITE_METHODS));
    expect(writers).toEqual(["lib/sync/mongo-publish.ts"]);
  });
});
