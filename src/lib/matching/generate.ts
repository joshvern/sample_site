import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  content,
  contentType,
  matchCandidate,
  sourceEntity,
} from "@/db/schemas";
import { AppError } from "@/lib/errors";
import {
  MATCH_MODEL_VERSION,
  type MatchFeatures,
  scoreCandidate,
} from "./scoring";
import { NORMALIZATION_VERSION } from "@/lib/title-normalization";

interface CandidateRow extends Record<string, unknown> {
  content_id: string;
  content_type: string;
  release_year: number | null;
  origin_country: string | null;
  original_language: string | null;
  title_similarity: number;
}

export async function generateCandidatesForSource(sourceEntityId: string) {
  const db = getDb();
  const [source] = await db
    .select()
    .from(sourceEntity)
    .where(eq(sourceEntity.id, sourceEntityId))
    .limit(1);

  if (!source) throw new AppError("not_found", "Source entity not found.");

  const result = await db.execute<CandidateRow>(sql`
    select distinct on (c.id)
      c.id as content_id,
      ct.key as content_type,
      c.release_year,
      c.origin_country,
      c.original_language,
      similarity(t.normalized_title, ${source.normalizedTitle})::float as title_similarity
    from catalog.content c
    join catalog.content_type ct on ct.id = c.content_type_id
    join catalog.content_title t on t.content_id = c.id
    where similarity(t.normalized_title, ${source.normalizedTitle}) >= 0.40
    order by c.id, title_similarity desc
  `);

  const scored = result.rows
    .map((candidate) => {
      const features: MatchFeatures = {
        titleSimilarity: candidate.title_similarity,
        yearMatch:
          source.releaseYear == null || candidate.release_year == null
            ? null
            : source.releaseYear === candidate.release_year,
        yearDifference:
          source.releaseYear == null || candidate.release_year == null
            ? null
            : Math.abs(source.releaseYear - candidate.release_year),
        typeMatch:
          source.entityType == null
            ? null
            : source.entityType === candidate.content_type,
        countryMatch:
          source.countryCode == null || candidate.origin_country == null
            ? null
            : source.countryCode === candidate.origin_country,
        languageMatch:
          source.languageCode == null || candidate.original_language == null
            ? null
            : source.languageCode === candidate.original_language,
        externalIdMatch: false,
      };
      return {
        candidate,
        features,
        result: scoreCandidate(features),
      };
    })
    .filter(({ result: score }) => score.score >= 0.5)
    .sort((left, right) => right.result.score - left.result.score)
    .slice(0, 5);

  for (const item of scored) {
    const exactTitle = item.features.titleSimilarity === 1;
    const exactMetadata =
      exactTitle &&
      item.features.yearMatch === true &&
      item.features.typeMatch === true;

    await db
      .insert(matchCandidate)
      .values({
        workspaceId: source.workspaceId,
        sourceEntityId: source.id,
        contentId: item.candidate.content_id,
        score: item.result.score.toFixed(4),
        method: exactMetadata
          ? "exact_title_year_type"
          : exactTitle
            ? "exact_normalized_title"
            : "trigram",
        modelVersion: MATCH_MODEL_VERSION,
        normalizationVersion: NORMALIZATION_VERSION,
        features: {
          ...item.features,
          contradictions: item.result.contradictions,
        },
      })
      .onConflictDoUpdate({
        target: [
          matchCandidate.sourceEntityId,
          matchCandidate.contentId,
          matchCandidate.modelVersion,
        ],
        set: {
          score: item.result.score.toFixed(4),
          features: {
            ...item.features,
            contradictions: item.result.contradictions,
          },
        },
      });
  }

  return scored;
}

export async function findContentTypeId(key: string) {
  const [type] = await getDb()
    .select({ id: contentType.id })
    .from(contentType)
    .where(eq(contentType.key, key))
    .limit(1);
  return type?.id;
}

export async function assertContentExists(contentId: string) {
  const [record] = await getDb()
    .select({ id: content.id })
    .from(content)
    .where(and(eq(content.id, contentId)))
    .limit(1);
  if (!record) throw new AppError("not_found", "Canonical content not found.");
}
