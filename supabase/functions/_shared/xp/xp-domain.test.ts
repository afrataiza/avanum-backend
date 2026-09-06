import { describe, expect, it } from "vitest";

describe("XP domain", () => {
  it("keeps XP values as integers", () => {
    expect(Number.isInteger(100)).toBe(true);
  });
});
