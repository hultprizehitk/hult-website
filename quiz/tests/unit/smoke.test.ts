import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("toolchain", () => {
  it("resolves @ alias and merges classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
