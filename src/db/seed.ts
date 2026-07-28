import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import {
  content,
  contentMapping,
  contentTitle,
  contentType,
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
import { payloadChecksum } from "@/lib/ingestion/checksum";
import { normalizeTitle } from "@/lib/title-normalization";
import { rebuildCanonicalMetrics } from "@/lib/aggregation/rebuild";

const ids = {
  workspace: "00000000-0000-4000-8000-000000000001",
  types: {
    franchise: "00000000-0000-4000-8000-000000000101",
    series: "00000000-0000-4000-8000-000000000102",
    season: "00000000-0000-4000-8000-000000000103",
    episode: "00000000-0000-4000-8000-000000000104",
    movie: "00000000-0000-4000-8000-000000000105",
    special: "00000000-0000-4000-8000-000000000106",
    live_event: "00000000-0000-4000-8000-000000000107",
    sports_event: "00000000-0000-4000-8000-000000000108",
  },
  platforms: {
    peacock: "00000000-0000-4000-8000-000000000201",
    netflix: "00000000-0000-4000-8000-000000000202",
    hulu: "00000000-0000-4000-8000-000000000203",
    prime: "00000000-0000-4000-8000-000000000204",
    nbc: "00000000-0000-4000-8000-000000000205",
  },
  content: {
    officeUs: "00000000-0000-4000-8000-000000000301",
    officeUk: "00000000-0000-4000-8000-000000000302",
    parks: "00000000-0000-4000-8000-000000000303",
    oppenheimer: "00000000-0000-4000-8000-000000000304",
  },
  sources: {
    peacock: "00000000-0000-4000-8000-000000000401",
    netflix: "00000000-0000-4000-8000-000000000402",
    hulu: "00000000-0000-4000-8000-000000000403",
  },
  runs: {
    peacock: "00000000-0000-4000-8000-000000000501",
    netflix: "00000000-0000-4000-8000-000000000502",
    hulu: "00000000-0000-4000-8000-000000000503",
  },
  entities: {
    officeUs: "00000000-0000-4000-8000-000000000601",
    officeAlias: "00000000-0000-4000-8000-000000000602",
    officeAmbiguous: "00000000-0000-4000-8000-000000000603",
    officeUk: "00000000-0000-4000-8000-000000000604",
    parks: "00000000-0000-4000-8000-000000000605",
    oppenheimer: "00000000-0000-4000-8000-000000000606",
    unresolved: "00000000-0000-4000-8000-000000000607",
  },
} as const;

const typeNames: Record<keyof typeof ids.types, string> = {
  franchise: "Franchise",
  series: "Series",
  season: "Season",
  episode: "Episode",
  movie: "Movie",
  special: "Special",
  live_event: "Live event",
  sports_event: "Sports event",
};

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  await db
    .insert(workspace)
    .values({
      id: ids.workspace,
      name: "Content Intelligence Demo",
      slug: "demo",
    })
    .onConflictDoUpdate({
      target: workspace.slug,
      set: { name: "Content Intelligence Demo", updatedAt: new Date() },
    });

  await db
    .insert(contentType)
    .values(
      Object.entries(ids.types).map(([key, id]) => ({
        id,
        key,
        name: typeNames[key as keyof typeof ids.types],
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(platform)
    .values([
      {
        id: ids.platforms.peacock,
        name: "Peacock",
        slug: "peacock",
        platformType: "streaming",
      },
      {
        id: ids.platforms.netflix,
        name: "Netflix",
        slug: "netflix",
        platformType: "streaming",
      },
      {
        id: ids.platforms.hulu,
        name: "Hulu",
        slug: "hulu",
        platformType: "streaming",
      },
      {
        id: ids.platforms.prime,
        name: "Prime Video",
        slug: "prime-video",
        platformType: "streaming",
      },
      {
        id: ids.platforms.nbc,
        name: "Linear NBC",
        slug: "linear-nbc",
        platformType: "linear",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(content)
    .values([
      {
        id: ids.content.officeUs,
        contentTypeId: ids.types.series,
        displayTitle: "The Office",
        releaseYear: 2005,
        originCountry: "US",
        originalLanguage: "en",
        status: "ended",
        metadata: { edition: "US" },
      },
      {
        id: ids.content.officeUk,
        contentTypeId: ids.types.series,
        displayTitle: "The Office",
        releaseYear: 2001,
        originCountry: "GB",
        originalLanguage: "en",
        status: "ended",
        metadata: { edition: "UK" },
      },
      {
        id: ids.content.parks,
        contentTypeId: ids.types.series,
        displayTitle: "Parks and Recreation",
        releaseYear: 2009,
        originCountry: "US",
        originalLanguage: "en",
        status: "ended",
      },
      {
        id: ids.content.oppenheimer,
        contentTypeId: ids.types.movie,
        displayTitle: "Oppenheimer",
        releaseYear: 2023,
        originCountry: "US",
        originalLanguage: "en",
        runtimeSeconds: 10800,
        status: "released",
      },
    ])
    .onConflictDoNothing();

  const aliases = [
    [ids.content.officeUs, "The Office", "official", true, "US"],
    [ids.content.officeUs, "The Office (U.S.)", "alias", false, "US"],
    [ids.content.officeUs, "Office, The", "alias", false, "US"],
    [ids.content.officeUs, "The Office (2005)", "alias", false, "US"],
    [ids.content.officeUk, "The Office", "official", true, "GB"],
    [ids.content.officeUk, "The Office (UK)", "alias", false, "GB"],
    [ids.content.officeUk, "The Office UK", "alias", false, "GB"],
    [ids.content.parks, "Parks and Recreation", "official", true, "US"],
    [ids.content.parks, "Parks & Rec", "alias", false, "US"],
    [ids.content.oppenheimer, "Oppenheimer", "official", true, "US"],
  ] as const;

  await db
    .insert(contentTitle)
    .values(
      aliases.map(([contentId, title, kind, isPrimary, countryCode], index) => {
        const normalized = normalizeTitle(title);
        return {
          id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          contentId,
          title,
          normalizedTitle: normalized.normalized,
          normalizationVersion: normalized.normalizationVersion,
          titleType: kind,
          languageCode: "en",
          countryCode,
          isPrimary,
        };
      }),
    )
    .onConflictDoNothing();

  await db
    .insert(sourceSystem)
    .values([
      {
        id: ids.sources.peacock,
        workspaceId: ids.workspace,
        name: "Peacock Internal Feed",
        sourceType: "api",
        platformId: ids.platforms.peacock,
      },
      {
        id: ids.sources.netflix,
        workspaceId: ids.workspace,
        name: "Netflix Partner Export",
        sourceType: "partner_feed",
        platformId: ids.platforms.netflix,
      },
      {
        id: ids.sources.hulu,
        workspaceId: ids.workspace,
        name: "Hulu CSV Upload",
        sourceType: "csv_upload",
        platformId: ids.platforms.hulu,
      },
    ])
    .onConflictDoNothing();

  const completedAt = new Date("2026-07-28T08:00:00.000Z");
  await db
    .insert(ingestionRun)
    .values([
      {
        id: ids.runs.peacock,
        sourceSystemId: ids.sources.peacock,
        status: "completed",
        completedAt,
        recordsReceived: 2,
        recordsInserted: 2,
      },
      {
        id: ids.runs.netflix,
        sourceSystemId: ids.sources.netflix,
        status: "completed",
        completedAt,
        recordsReceived: 2,
        recordsInserted: 2,
      },
      {
        id: ids.runs.hulu,
        sourceSystemId: ids.sources.hulu,
        status: "completed_with_errors",
        completedAt,
        recordsReceived: 3,
        recordsInserted: 3,
        recordsFailed: 1,
        metadata: {
          failures: [{ row: 8, issues: ["release_year: Invalid year"] }],
        },
      },
    ])
    .onConflictDoNothing();

  const entityRows = [
    {
      id: ids.entities.officeUs,
      sourceSystemId: ids.sources.peacock,
      native: "pk-office-us",
      title: "The Office (2005)",
      type: "series",
      year: 2005,
      country: "US",
      runId: ids.runs.peacock,
    },
    {
      id: ids.entities.officeAlias,
      sourceSystemId: ids.sources.netflix,
      native: "nf-44821",
      title: "Office, The",
      type: "series",
      year: 2005,
      country: "US",
      runId: ids.runs.netflix,
    },
    {
      id: ids.entities.officeAmbiguous,
      sourceSystemId: ids.sources.hulu,
      native: "hu-office",
      title: "The Office",
      type: "series",
      year: null,
      country: null,
      runId: ids.runs.hulu,
    },
    {
      id: ids.entities.officeUk,
      sourceSystemId: ids.sources.hulu,
      native: "hu-office-uk",
      title: "The Office (UK)",
      type: "series",
      year: 2001,
      country: "GB",
      runId: ids.runs.hulu,
    },
    {
      id: ids.entities.parks,
      sourceSystemId: ids.sources.peacock,
      native: "pk-parks",
      title: "Parks & Rec",
      type: "series",
      year: 2009,
      country: "US",
      runId: ids.runs.peacock,
    },
    {
      id: ids.entities.oppenheimer,
      sourceSystemId: ids.sources.netflix,
      native: "nf-oppenheimer",
      title: "Oppenheimer",
      type: "movie",
      year: 2023,
      country: "US",
      runId: ids.runs.netflix,
    },
    {
      id: ids.entities.unresolved,
      sourceSystemId: ids.sources.hulu,
      native: "hu-office-hours",
      title: "Office Hours",
      type: "movie",
      year: 2024,
      country: "US",
      runId: ids.runs.hulu,
    },
  ] as const;

  for (const entity of entityRows) {
    const normalized = normalizeTitle(entity.title);
    const payload = {
      source_native_id: entity.native,
      title: entity.title,
      content_type: entity.type,
      release_year: entity.year,
      country_code: entity.country,
    };
    await db
      .insert(sourceEntity)
      .values({
        id: entity.id,
        workspaceId: ids.workspace,
        sourceSystemId: entity.sourceSystemId,
        sourceNativeId: entity.native,
        entityType: entity.type,
        rawTitle: entity.title,
        normalizedTitle: normalized.normalized,
        releaseYear: entity.year,
        countryCode: entity.country,
        languageCode: "en",
        currentPayload: payload,
      })
      .onConflictDoNothing();
    await db
      .insert(sourceEntityVersion)
      .values({
        id: `20000000-0000-4000-8000-${entity.id.slice(-12)}`,
        sourceEntityId: entity.id,
        ingestionRunId: entity.runId,
        payload,
        payloadChecksum: payloadChecksum(payload),
        observedAt: completedAt,
      })
      .onConflictDoNothing();
  }

  const activeMappings = [
    [ids.entities.officeUs, ids.content.officeUs, 0.99],
    [ids.entities.officeAlias, ids.content.officeUs, 0.98],
    [ids.entities.officeUk, ids.content.officeUk, 0.99],
    [ids.entities.parks, ids.content.parks, 0.98],
    [ids.entities.oppenheimer, ids.content.oppenheimer, 1],
  ] as const;
  await db
    .insert(contentMapping)
    .values(
      activeMappings.map(([sourceEntityId, contentId, confidence], index) => ({
        id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        workspaceId: ids.workspace,
        sourceEntityId,
        contentId,
        decisionMethod: "seed" as const,
        confidence: confidence.toFixed(4),
        decisionStatus: "accepted" as const,
        notes: "Deterministic demo seed",
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(matchCandidate)
    .values([
      {
        id: "40000000-0000-4000-8000-000000000001",
        workspaceId: ids.workspace,
        sourceEntityId: ids.entities.officeAmbiguous,
        contentId: ids.content.officeUs,
        score: "0.8500",
        method: "exact_normalized_title",
        modelVersion: "deterministic-v1",
        normalizationVersion: "title-normalizer-v1",
        features: {
          titleSimilarity: 1,
          yearMatch: null,
          typeMatch: true,
          countryMatch: null,
          languageMatch: true,
          externalIdMatch: false,
          contradictions: [],
        },
        status: "pending",
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        workspaceId: ids.workspace,
        sourceEntityId: ids.entities.officeAmbiguous,
        contentId: ids.content.officeUk,
        score: "0.8500",
        method: "exact_normalized_title",
        modelVersion: "deterministic-v1",
        normalizationVersion: "title-normalizer-v1",
        features: {
          titleSimilarity: 1,
          yearMatch: null,
          typeMatch: true,
          countryMatch: null,
          languageMatch: true,
          externalIdMatch: false,
          contradictions: [],
        },
        status: "pending",
      },
      {
        id: "40000000-0000-4000-8000-000000000003",
        workspaceId: ids.workspace,
        sourceEntityId: ids.entities.unresolved,
        contentId: ids.content.officeUs,
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
      },
    ])
    .onConflictDoNothing();

  const metricSources = [
    {
      entityId: ids.entities.officeUs,
      sourceSystemId: ids.sources.peacock,
      platformId: ids.platforms.peacock,
      runId: ids.runs.peacock,
      base: 118_000,
    },
    {
      entityId: ids.entities.officeAlias,
      sourceSystemId: ids.sources.netflix,
      platformId: ids.platforms.netflix,
      runId: ids.runs.netflix,
      base: 94_000,
    },
    {
      entityId: ids.entities.officeUk,
      sourceSystemId: ids.sources.hulu,
      platformId: ids.platforms.hulu,
      runId: ids.runs.hulu,
      base: 34_000,
    },
    {
      entityId: ids.entities.parks,
      sourceSystemId: ids.sources.peacock,
      platformId: ids.platforms.peacock,
      runId: ids.runs.peacock,
      base: 61_000,
    },
    {
      entityId: ids.entities.oppenheimer,
      sourceSystemId: ids.sources.netflix,
      platformId: ids.platforms.netflix,
      runId: ids.runs.netflix,
      base: 78_000,
    },
  ];

  const facts = metricSources.flatMap((source, sourceIndex) =>
    Array.from({ length: 30 }, (_, dayIndex) => {
      const date = new Date(Date.UTC(2026, 5, 29 + dayIndex));
      const views =
        source.base + dayIndex * 1370 + ((dayIndex + sourceIndex) % 7) * 4300;
      return {
        workspaceId: ids.workspace,
        sourceEntityId: source.entityId,
        platformId: source.platformId,
        metricDate: date.toISOString().slice(0, 10),
        views,
        watchSeconds: views * (sourceIndex === 4 ? 7200 : 1320),
        uniqueViewers: Math.round(views * 0.72),
        starts: Math.round(views * 1.08),
        completions: Math.round(views * 0.63),
        revenueCents: Math.round(views * 1.8),
        sourceSystemId: source.sourceSystemId,
        ingestionRunId: source.runId,
        observedAt: completedAt,
      };
    }),
  );

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
    workspaceId: ids.workspace,
    contentIds: Object.values(ids.content),
  });

  console.log("Seed complete: demo workspace, catalog, mappings, and metrics.");
  await pool.end();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  });
