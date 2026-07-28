export const NORMALIZATION_VERSION = "title-normalizer-v1";

export interface NormalizedTitleResult {
  original: string;
  normalized: string;
  extractedYear?: number;
  extractedRegion?: "US" | "GB";
  normalizationVersion: typeof NORMALIZATION_VERSION;
}

const REGION_PATTERN = /\s*[\[(]\s*(u\.?\s*s\.?|u\.?\s*k\.?)\s*[\])]\s*$/i;
const YEAR_PATTERN = /\s*[\[(]\s*((?:18|19|20)\d{2})\s*[\])]\s*$/;
const TRAILING_ARTICLE_PATTERN = /^(.+),\s*(the|a|an)$/i;

export function normalizeTitle(title: string): NormalizedTitleResult {
  const original = title;
  let working = title.normalize("NFKC").trim();

  const yearMatch = working.match(YEAR_PATTERN);
  const extractedYear = yearMatch ? Number(yearMatch[1]) : undefined;
  if (yearMatch) working = working.slice(0, yearMatch.index).trim();

  const regionMatch = working.match(REGION_PATTERN);
  let extractedRegion: "US" | "GB" | undefined;
  if (regionMatch) {
    const compactRegion = regionMatch[1]?.replace(/[\s.]/g, "").toUpperCase();
    extractedRegion = compactRegion === "UK" ? "GB" : "US";
    working = working.slice(0, regionMatch.index).trim();
  }

  const articleMatch = working.match(TRAILING_ARTICLE_PATTERN);
  if (articleMatch) {
    working = `${articleMatch[2]} ${articleMatch[1]}`;
  }

  const normalized = working
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    original,
    normalized,
    ...(extractedYear ? { extractedYear } : {}),
    ...(extractedRegion ? { extractedRegion } : {}),
    normalizationVersion: NORMALIZATION_VERSION,
  };
}
