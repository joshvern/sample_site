import { describe, expect, it } from "vitest";
import {
  NORMALIZATION_VERSION,
  normalizeTitle,
} from "@/lib/title-normalization";

describe("normalizeTitle", () => {
  it.each([
    ["The Office", "the office"],
    ["The Office (U.S.)", "the office"],
    ["Office, The", "the office"],
    ["The Office (2005)", "the office"],
    ["THE   OFFICE", "the office"],
    ["The Office (UK)", "the office"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeTitle(input)).toMatchObject({
      original: input,
      normalized: expected,
      normalizationVersion: NORMALIZATION_VERSION,
    });
  });

  it("extracts a trailing release year", () => {
    expect(normalizeTitle("The Office (2005)").extractedYear).toBe(2005);
  });

  it.each([
    ["The Office (U.S.)", "US"],
    ["The Office (US)", "US"],
    ["The Office (U.K.)", "GB"],
    ["The Office (UK)", "GB"],
  ] as const)("extracts region from %s", (input, expected) => {
    expect(normalizeTitle(input).extractedRegion).toBe(expected);
  });

  it("normalizes Unicode, punctuation, and whitespace", () => {
    expect(normalizeTitle("  Amélie — Director’s Cut  ").normalized).toBe(
      "amélie directors cut",
    );
  });
});
