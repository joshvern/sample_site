export const MATCH_MODEL_VERSION = "deterministic-v1";

export interface MatchFeatures {
  titleSimilarity: number;
  yearMatch: boolean | null;
  yearDifference: number | null;
  typeMatch: boolean | null;
  countryMatch: boolean | null;
  languageMatch: boolean | null;
  externalIdMatch: boolean;
}

export interface ScoredCandidate {
  score: number;
  contradictions: Array<"year" | "type" | "country">;
  eligibleForAutomaticAcceptance: boolean;
}

const weights = {
  title: 0.65,
  year: 0.15,
  type: 0.1,
  country: 0.05,
  language: 0.05,
} as const;

const penalties = {
  year: 0.25,
  type: 0.3,
  country: 0.2,
} as const;

export function scoreCandidate(features: MatchFeatures): ScoredCandidate {
  if (features.externalIdMatch) {
    return {
      score: 1,
      contradictions: [],
      eligibleForAutomaticAcceptance: true,
    };
  }

  const contradictions: ScoredCandidate["contradictions"] = [];
  let score =
    Math.max(0, Math.min(1, features.titleSimilarity)) * weights.title;

  if (features.yearMatch === true) score += weights.year;
  if (features.yearMatch === false) {
    score -= penalties.year;
    contradictions.push("year");
  }
  if (features.typeMatch === true) score += weights.type;
  if (features.typeMatch === false) {
    score -= penalties.type;
    contradictions.push("type");
  }
  if (features.countryMatch === true) score += weights.country;
  if (features.countryMatch === false) {
    score -= penalties.country;
    contradictions.push("country");
  }
  if (features.languageMatch === true) score += weights.language;

  const rounded = Math.round(Math.max(0, Math.min(1, score)) * 10_000) / 10_000;
  return {
    score: rounded,
    contradictions,
    eligibleForAutomaticAcceptance:
      rounded >= 0.95 && contradictions.length === 0,
  };
}

export function canAutomaticallyAccept(
  candidate: ScoredCandidate,
  nextBestScore: number | undefined,
  hasMissingYearAmbiguity: boolean,
) {
  return (
    candidate.eligibleForAutomaticAcceptance &&
    !hasMissingYearAmbiguity &&
    (nextBestScore === undefined || candidate.score - nextBestScore >= 0.05)
  );
}
