import { describe, expect, it } from "vitest";
import {
  canAutomaticallyAccept,
  scoreCandidate,
  type MatchFeatures,
} from "@/lib/matching/scoring";

const exact: MatchFeatures = {
  titleSimilarity: 1,
  yearMatch: true,
  yearDifference: 0,
  typeMatch: true,
  countryMatch: true,
  languageMatch: true,
  externalIdMatch: false,
};

describe("candidate scoring", () => {
  it("scores a complete metadata match at 1", () => {
    expect(scoreCandidate(exact)).toEqual({
      score: 1,
      contradictions: [],
      eligibleForAutomaticAcceptance: true,
    });
  });

  it("gives external identifiers deterministic priority", () => {
    expect(
      scoreCandidate({
        ...exact,
        titleSimilarity: 0,
        yearMatch: false,
        externalIdMatch: true,
      }).score,
    ).toBe(1);
  });

  it("penalizes contradictory years, types, and countries", () => {
    const result = scoreCandidate({
      ...exact,
      yearMatch: false,
      yearDifference: 4,
      typeMatch: false,
      countryMatch: false,
    });
    expect(result.score).toBeLessThan(0.7);
    expect(result.contradictions).toEqual(["year", "type", "country"]);
    expect(result.eligibleForAutomaticAcceptance).toBe(false);
  });

  it("does not auto-accept when metadata is missing", () => {
    const result = scoreCandidate({
      ...exact,
      yearMatch: null,
      yearDifference: null,
      countryMatch: null,
    });
    expect(result.score).toBe(0.8);
    expect(result.eligibleForAutomaticAcceptance).toBe(false);
  });

  it("requires a unique margin and no missing-year ambiguity", () => {
    const result = scoreCandidate(exact);
    expect(canAutomaticallyAccept(result, 0.9, false)).toBe(true);
    expect(canAutomaticallyAccept(result, 0.97, false)).toBe(false);
    expect(canAutomaticallyAccept(result, undefined, true)).toBe(false);
  });
});
