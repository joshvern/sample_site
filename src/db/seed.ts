import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import {
  content,
  contentMapping,
  contentTitle,
  contentType,
  externalIdentifier,
  ingestionRun,
  matchCandidate,
  platform,
  sourceContentMetricDaily,
  sourceEntity,
  sourceEntityVersion,
  sourceSystem,
  schema,
  workspace,
} from "./schemas";
import {
  fixtureId,
  pendingSampleEntities,
  sampleEntities,
  sampleIds,
  samplePlatformByKey,
  samplePlatforms,
  sampleSourceByKey,
  sampleSources,
  sampleTitleByKey,
  sampleTitles,
  unresolvedSampleEntity,
} from "./sample-catalog";
import { payloadChecksum } from "@/lib/ingestion/checksum";
import { normalizeTitle } from "@/lib/title-normalization";
import { rebuildCanonicalMetrics } from "@/lib/aggregation/rebuild";

const typeNames: Record<keyof typeof sampleIds.types, string> = {
  franchise: "Franchise",
  series: "Series",
  season: "Season",
  episode: "Episode",
  movie: "Movie",
  special: "Special",
  live_event: "Live event",
  sports_event: "Sports event",
};

const completedAt = new Date("2026-07-28T08:00:00.000Z");

function entityPayload(entity: {
  nativeId: string;
  title: string;
  type: string;
  year: number | null;
  country: string | null;
  imdb?: string;
}) {
  return {
    source_native_id: entity.nativeId,
    title: entity.title,
    content_type: entity.type,
    release_year: entity.year,
    country_code: entity.country,
    language_code: "en",
    external_id: entity.imdb ?? null,
    external_id_type: entity.imdb ? "imdb" : null,
  };
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    await db
      .insert(workspace)
      .values({
        id: sampleIds.workspace,
        name: "Signal Studio Demo",
        slug: "demo",
      })
      .onConflictDoUpdate({
        target: workspace.slug,
        set: { name: "Signal Studio Demo", updatedAt: new Date() },
      });

    await db
      .insert(contentType)
      .values(
        Object.entries(sampleIds.types).map(([key, id]) => ({
          id,
          key,
          name: typeNames[key as keyof typeof sampleIds.types],
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(platform)
      .values(
        samplePlatforms.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          platformType: item.type,
          websiteUrl: null,
          metadata: { brandColor: item.color },
        })),
      )
      .onConflictDoUpdate({
        target: platform.slug,
        set: {
          name: sql`excluded.name`,
          platformType: sql`excluded.platform_type`,
          metadata: sql`excluded.metadata`,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(content)
      .values(
        sampleTitles.map((item) => ({
          id: item.id,
          contentTypeId:
            item.type === "movie"
              ? sampleIds.types.movie
              : sampleIds.types.series,
          displayTitle: item.title,
          originalTitle: item.originalTitle ?? null,
          releaseYear: item.releaseYear,
          originCountry: item.country,
          originalLanguage: item.language,
          runtimeSeconds: item.runtimeMinutes ? item.runtimeMinutes * 60 : null,
          status: item.status,
          metadata: {
            accent: item.accent,
            genres: item.genres,
            synopsis: item.synopsis,
            provenance: ["IMDb", "TMDB"],
          },
        })),
      )
      .onConflictDoUpdate({
        target: content.id,
        set: {
          displayTitle: sql`excluded.display_title`,
          originalTitle: sql`excluded.original_title`,
          releaseYear: sql`excluded.release_year`,
          originCountry: sql`excluded.origin_country`,
          originalLanguage: sql`excluded.original_language`,
          runtimeSeconds: sql`excluded.runtime_seconds`,
          status: sql`excluded.status`,
          metadata: sql`excluded.metadata`,
          updatedAt: new Date(),
        },
      });

    const aliases = sampleTitles.flatMap((item) =>
      item.aliases.map((alias) => ({ item, alias })),
    );
    await db
      .insert(contentTitle)
      .values(
        aliases.map(({ item, alias }, index) => {
          const normalized = normalizeTitle(alias.title);
          return {
            id: fixtureId(1, index + 1),
            contentId: item.id,
            title: alias.title,
            normalizedTitle: normalized.normalized,
            normalizationVersion: normalized.normalizationVersion,
            titleType: alias.type,
            languageCode: alias.language ?? item.language,
            countryCode: alias.country,
            isPrimary: alias.primary ?? false,
          };
        }),
      )
      .onConflictDoNothing();

    const identifiers = sampleTitles.flatMap((item) => [
      {
        contentId: item.id,
        namespace: "imdb",
        externalId: item.imdb,
        externalUrl: `https://www.imdb.com/title/${item.imdb}/`,
      },
      {
        contentId: item.id,
        namespace: "tmdb",
        externalId: item.tmdb,
        externalUrl: `https://www.themoviedb.org/${item.tmdbType}/${item.tmdb}`,
      },
    ]);
    await db
      .insert(externalIdentifier)
      .values(
        identifiers.map((identifier, index) => ({
          id: fixtureId(11, index + 1),
          ...identifier,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(sourceSystem)
      .values(
        sampleSources.map((item) => ({
          id: item.id,
          workspaceId: sampleIds.workspace,
          name: item.name,
          sourceType: item.type,
          platformId: samplePlatformByKey[item.platformKey].id,
          configuration: {
            cadence: item.type === "api" ? "hourly" : "daily",
            fixture: true,
          },
        })),
      )
      .onConflictDoUpdate({
        target: [sourceSystem.workspaceId, sourceSystem.name],
        set: {
          sourceType: sql`excluded.source_type`,
          platformId: sql`excluded.platform_id`,
          configuration: sql`excluded.configuration`,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    const allUnmapped = [...pendingSampleEntities, unresolvedSampleEntity];
    const recordsBySource = Object.fromEntries(
      sampleSources.map((item) => [
        item.key,
        sampleEntities.filter((entity) => entity.sourceKey === item.key)
          .length +
          allUnmapped.filter((entity) => entity.sourceKey === item.key).length,
      ]),
    ) as Record<string, number>;

    await db
      .insert(ingestionRun)
      .values(
        sampleSources.map((item, index) => {
          const failed = item.key === "hulu" ? 1 : 0;
          const received = recordsBySource[item.key] ?? 0;
          const ended = new Date(completedAt.getTime() - index * 19 * 60_000);
          return {
            id: item.runId,
            sourceSystemId: item.id,
            status:
              failed > 0
                ? ("completed_with_errors" as const)
                : ("completed" as const),
            startedAt: new Date(ended.getTime() - 4 * 60_000),
            completedAt: ended,
            recordsReceived: received,
            recordsInserted: received,
            recordsFailed: failed,
            metadata:
              failed > 0
                ? {
                    failures: [
                      { row: 8, issues: ["release_year: Invalid year"] },
                    ],
                  }
                : { fixture: true },
          };
        }),
      )
      .onConflictDoUpdate({
        target: ingestionRun.id,
        set: {
          status: sql`excluded.status`,
          startedAt: sql`excluded.started_at`,
          completedAt: sql`excluded.completed_at`,
          recordsReceived: sql`excluded.records_received`,
          recordsInserted: sql`excluded.records_inserted`,
          recordsFailed: sql`excluded.records_failed`,
          metadata: sql`excluded.metadata`,
        },
      });

    const mappedEntityRows = sampleEntities.map((entity) => {
      const title = sampleTitleByKey[entity.contentKey];
      return {
        id: entity.id,
        sourceKey: entity.sourceKey,
        nativeId: entity.nativeId,
        title: entity.title,
        type: entity.type ?? title.type,
        year: entity.year === undefined ? title.releaseYear : entity.year,
        country: entity.country === undefined ? title.country : entity.country,
        imdb: entity.method === "external_id" ? title.imdb : undefined,
      };
    });
    const unmappedEntityRows = [
      ...pendingSampleEntities.map((entity) => ({
        id: entity.id,
        sourceKey: entity.sourceKey,
        nativeId: entity.nativeId,
        title: entity.title,
        type: entity.type,
        year: entity.year,
        country: entity.country,
        imdb: undefined,
      })),
      {
        id: unresolvedSampleEntity.id,
        sourceKey: unresolvedSampleEntity.sourceKey,
        nativeId: unresolvedSampleEntity.nativeId,
        title: unresolvedSampleEntity.title,
        type: unresolvedSampleEntity.type,
        year: unresolvedSampleEntity.year,
        country: unresolvedSampleEntity.country,
        imdb: undefined,
      },
    ];
    const entityRows = [...mappedEntityRows, ...unmappedEntityRows];

    for (const entity of entityRows) {
      const normalized = normalizeTitle(entity.title);
      const source = sampleSourceByKey[entity.sourceKey];
      const payload = entityPayload(entity);
      await db
        .insert(sourceEntity)
        .values({
          id: entity.id,
          workspaceId: sampleIds.workspace,
          sourceSystemId: source.id,
          sourceNativeId: entity.nativeId,
          entityType: entity.type,
          rawTitle: entity.title,
          normalizedTitle: normalized.normalized,
          releaseYear: entity.year,
          countryCode: entity.country,
          languageCode: "en",
          externalIdentifiers: entity.imdb ? { imdb: entity.imdb } : {},
          currentPayload: payload,
          lastSeenAt: completedAt,
        })
        .onConflictDoUpdate({
          target: [sourceEntity.sourceSystemId, sourceEntity.sourceNativeId],
          set: {
            entityType: sql`excluded.entity_type`,
            rawTitle: sql`excluded.raw_title`,
            normalizedTitle: sql`excluded.normalized_title`,
            releaseYear: sql`excluded.release_year`,
            countryCode: sql`excluded.country_code`,
            languageCode: sql`excluded.language_code`,
            externalIdentifiers: sql`excluded.external_identifiers`,
            currentPayload: sql`excluded.current_payload`,
            lastSeenAt: completedAt,
            updatedAt: new Date(),
          },
        });
      await db
        .insert(sourceEntityVersion)
        .values({
          id: fixtureId(2, Number(entity.id.slice(-12))),
          sourceEntityId: entity.id,
          ingestionRunId: source.runId,
          payload,
          payloadChecksum: payloadChecksum(payload),
          observedAt: completedAt,
        })
        .onConflictDoNothing();
    }

    await db
      .insert(contentMapping)
      .values(
        sampleEntities.map((entity, index) => ({
          id: fixtureId(3, index + 1),
          workspaceId: sampleIds.workspace,
          sourceEntityId: entity.id,
          contentId: sampleTitleByKey[entity.contentKey].id,
          decisionMethod: entity.method,
          confidence: entity.confidence.toFixed(4),
          decisionStatus: "accepted" as const,
          decidedBy: "fixture@signal-studio.demo",
          validFrom: new Date("2026-04-30T08:00:00.000Z"),
          notes:
            entity.method === "external_id"
              ? "Deterministic external identifier match"
              : "Deterministic sample resolution",
        })),
      )
      .onConflictDoNothing();

    const candidateRows = pendingSampleEntities.flatMap((entity, entityIndex) =>
      entity.candidateKeys.map((contentKey, candidateIndex) => {
        const candidateId =
          entityIndex === 0
            ? candidateIndex + 1
            : entityIndex === 1
              ? candidateIndex + 4
              : candidateIndex + 6;
        const candidate = sampleTitleByKey[contentKey];
        const typeMatch =
          entity.type === "title" ? null : entity.type === candidate.type;
        return {
          id: fixtureId(4, candidateId),
          workspaceId: sampleIds.workspace,
          sourceEntityId: entity.id,
          contentId: candidate.id,
          score: (entity.scores[candidateIndex] ?? 0.75).toFixed(4),
          method: "exact_normalized_title" as const,
          modelVersion: "deterministic-v1",
          normalizationVersion: "title-normalizer-v1",
          features: {
            titleSimilarity: 1,
            yearMatch: null,
            typeMatch,
            countryMatch: entity.country
              ? entity.country === candidate.country
              : null,
            languageMatch: true,
            externalIdMatch: false,
            contradictions: [],
          },
          status: "pending" as const,
        };
      }),
    );
    await db.insert(matchCandidate).values(candidateRows).onConflictDoNothing();

    await db
      .insert(matchCandidate)
      .values({
        id: fixtureId(4, 3),
        workspaceId: sampleIds.workspace,
        sourceEntityId: unresolvedSampleEntity.id,
        contentId: sampleTitleByKey.officeUs.id,
        score: "0.2800",
        method: "trigram",
        modelVersion: "deterministic-v1",
        normalizationVersion: "title-normalizer-v1",
        features: {
          titleSimilarity: 0.72,
          yearMatch: false,
          typeMatch: false,
          countryMatch: true,
          languageMatch: true,
          externalIdMatch: false,
          contradictions: ["year", "type"],
        },
        status: "rejected",
        evaluatedAt: completedAt,
      })
      .onConflictDoNothing();

    const facts = sampleEntities.flatMap((entity, sourceIndex) => {
      const source = sampleSourceByKey[entity.sourceKey];
      const title = sampleTitleByKey[entity.contentKey];
      const platformRow = samplePlatformByKey[entity.sourceKey];
      return Array.from({ length: 90 }, (_, dayIndex) => {
        const date = new Date(Date.UTC(2026, 3, 30 + dayIndex));
        const weekday = dayIndex % 7;
        const wave = Math.round(
          Math.sin((dayIndex + sourceIndex * 2) / 6) * entity.metricBase * 0.08,
        );
        const trend = Math.round(entity.metricBase * dayIndex * 0.0018);
        const weekend = weekday >= 5 ? entity.metricBase * 0.13 : 0;
        const views = Math.max(
          100,
          Math.round(entity.metricBase + wave + trend + weekend),
        );
        const averageWatchSeconds =
          title.type === "movie"
            ? Math.round((title.runtimeMinutes ?? 110) * 60 * 0.44)
            : 1_480 + (sourceIndex % 4) * 90;
        return {
          workspaceId: sampleIds.workspace,
          sourceEntityId: entity.id,
          platformId: platformRow.id,
          metricDate: date.toISOString().slice(0, 10),
          views,
          watchSeconds: views * averageWatchSeconds,
          uniqueViewers: Math.round(views * (0.68 + (sourceIndex % 4) * 0.03)),
          starts: Math.round(views * 1.08),
          completions: Math.round(
            views * (title.type === "movie" ? 0.61 : 0.73),
          ),
          revenueCents: Math.round(views * (1.35 + (sourceIndex % 5) * 0.19)),
          sourceSystemId: source.id,
          ingestionRunId: source.runId,
          observedAt: completedAt,
        };
      });
    });

    await db
      .insert(sourceContentMetricDaily)
      .values(facts)
      .onConflictDoUpdate({
        target: [
          sourceContentMetricDaily.workspaceId,
          sourceContentMetricDaily.sourceEntityId,
          sourceContentMetricDaily.platformId,
          sourceContentMetricDaily.metricDate,
          sourceContentMetricDaily.sourceSystemId,
        ],
        set: {
          views: sql`excluded.views`,
          watchSeconds: sql`excluded.watch_seconds`,
          uniqueViewers: sql`excluded.unique_viewers`,
          starts: sql`excluded.starts`,
          completions: sql`excluded.completions`,
          revenueCents: sql`excluded.revenue_cents`,
          observedAt: completedAt,
          updatedAt: new Date(),
        },
      });

    await rebuildCanonicalMetrics(db as unknown as Database, {
      workspaceId: sampleIds.workspace,
      contentIds: sampleTitles.map((item) => item.id),
    });

    console.log(
      `Seed complete: ${sampleTitles.length} canonical titles, ${entityRows.length} source records, ${facts.length} source facts.`,
    );
  } finally {
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  });
