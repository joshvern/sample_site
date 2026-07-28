import {
  pendingSampleEntities,
  sampleEntities,
  samplePlatformByKey,
  samplePlatforms,
  sampleSourceByKey,
  sampleSources,
  sampleTitleByKey,
  sampleTitles,
  unresolvedSampleEntity,
} from "@/db/sample-catalog";
import type {
  CatalogItem,
  ContentDetail,
  DashboardData,
  ResolutionItem,
  SourceSummary,
} from "@/types/domain";

const DAY_COUNT = 90;
const metricDates = Array.from({ length: DAY_COUNT }, (_, index) => {
  const date = new Date(Date.UTC(2026, 3, 30 + index));
  return date.toISOString().slice(0, 10);
});

function dailyViewsForEntity(
  entity: (typeof sampleEntities)[number],
  entityIndex: number,
  dayIndex: number,
) {
  const weekday = dayIndex % 7;
  const wave = Math.round(
    Math.sin((dayIndex + entityIndex * 2) / 6) * entity.metricBase * 0.08,
  );
  const trend = Math.round(entity.metricBase * dayIndex * 0.0018);
  const weekend = weekday >= 5 ? entity.metricBase * 0.13 : 0;
  return Math.max(100, Math.round(entity.metricBase + wave + trend + weekend));
}

function viewsForEntity(
  entity: (typeof sampleEntities)[number],
  entityIndex: number,
) {
  return metricDates.reduce(
    (total, _, dayIndex) =>
      total + dailyViewsForEntity(entity, entityIndex, dayIndex),
    0,
  );
}

export const contentIds = Object.fromEntries(
  sampleTitles.map((item) => [item.key, item.id]),
) as Record<(typeof sampleTitles)[number]["key"], string>;

export const demoCatalog: CatalogItem[] = sampleTitles
  .map((title) => {
    const mapped = sampleEntities
      .map((entity, index) => ({ entity, index }))
      .filter(({ entity }) => entity.contentKey === title.key);
    const views = mapped.reduce(
      (sum, { entity, index }) => sum + viewsForEntity(entity, index),
      0,
    );
    const averageWatchSeconds =
      title.type === "movie"
        ? Math.round((title.runtimeMinutes ?? 110) * 60 * 0.44)
        : 1_620;
    return {
      id: title.id,
      title: title.title,
      contentType: title.type === "movie" ? "Movie" : "Series",
      releaseYear: title.releaseYear,
      country: title.country,
      platforms: [
        ...new Set(
          mapped.map(
            ({ entity }) => samplePlatformByKey[entity.sourceKey].name,
          ),
        ),
      ],
      sourceRecords: mapped.length,
      aliases: title.aliases.length,
      views,
      watchSeconds: views * averageWatchSeconds,
      confidence: mapped.length
        ? mapped.reduce((sum, { entity }) => sum + entity.confidence, 0) /
          mapped.length
        : null,
      genres: title.genres,
      accent: title.accent,
    };
  })
  .sort((a, b) => b.views - a.views);

const totalViews = demoCatalog.reduce((sum, item) => sum + item.views, 0);
const totalWatchSeconds = demoCatalog.reduce(
  (sum, item) => sum + item.watchSeconds,
  0,
);
const dailyViews = metricDates.map((date, dayIndex) => ({
  date,
  views: sampleEntities.reduce(
    (sum, entity, entityIndex) =>
      sum + dailyViewsForEntity(entity, entityIndex, dayIndex),
    0,
  ),
}));
const platformPerformance = samplePlatforms
  .map((platform) => {
    const mapped = sampleEntities
      .map((entity, index) => ({ entity, index }))
      .filter(({ entity }) => entity.sourceKey === platform.key);
    const views = mapped.reduce(
      (sum, { entity, index }) => sum + viewsForEntity(entity, index),
      0,
    );
    return {
      platform: platform.name,
      views,
      watchSeconds: mapped.reduce((sum, { entity, index }) => {
        const title = sampleTitleByKey[entity.contentKey];
        const average =
          title.type === "movie"
            ? Math.round((title.runtimeMinutes ?? 110) * 60 * 0.44)
            : 1_620;
        return sum + viewsForEntity(entity, index) * average;
      }, 0),
      color: platform.color,
    };
  })
  .filter((item) => item.views > 0)
  .sort((a, b) => b.views - a.views);

export const demoDashboard: DashboardData = {
  kpis: {
    canonicalContent: sampleTitles.length,
    sourceEntities: sampleEntities.length + pendingSampleEntities.length + 1,
    matchRate:
      (sampleEntities.length /
        (sampleEntities.length + pendingSampleEntities.length + 1)) *
      100,
    pendingReview: pendingSampleEntities.length,
    activeSources: sampleSources.length,
    latestMetricDate: metricDates.at(-1) ?? "—",
    totalViews,
    watchSeconds: totalWatchSeconds,
  },
  dailyViews,
  platformPerformance,
  topContent: demoCatalog.slice(0, 7).map((item) => ({
    id: item.id,
    title: item.title,
    descriptor: `${item.contentType} · ${item.releaseYear} · ${item.country}`,
    views: item.views,
    share: totalViews ? (item.views / totalViews) * 100 : 0,
  })),
  recentRuns: sampleSources.slice(0, 6).map((source, index) => ({
    id: source.runId,
    source: source.name,
    status: source.key === "hulu" ? "Completed with errors" : "Completed",
    completedAt: new Date(Date.UTC(2026, 6, 28, 8, -index * 19)).toISOString(),
    records:
      sampleEntities.filter((entity) => entity.sourceKey === source.key)
        .length +
      pendingSampleEntities.filter((entity) => entity.sourceKey === source.key)
        .length +
      (unresolvedSampleEntity.sourceKey === source.key ? 1 : 0),
  })),
  matchQuality: [
    {
      label: "High confidence",
      count: sampleEntities.filter((item) => item.confidence >= 0.95).length,
      color: "#2563eb",
    },
    {
      label: "Needs review",
      count: pendingSampleEntities.length,
      color: "#f59e0b",
    },
    { label: "Unresolved", count: 1, color: "#cbd5e1" },
  ],
  freshness: sampleSources.map((source, index) => ({
    source: source.name,
    platform: samplePlatformByKey[source.platformKey].name,
    latestDate: metricDates.at(-(index % 3) - 1) ?? "No data",
    status: index % 5 === 4 ? "Watch" : "Fresh",
  })),
  overlapPlatforms: platformPerformance
    .slice(0, 6)
    .map((item) => item.platform),
  overlap: demoCatalog
    .filter((item) => item.platforms.length > 1)
    .slice(0, 8)
    .map((item) => ({
      title: `${item.title} · ${item.releaseYear}`,
      platforms: item.platforms,
    })),
};

export const demoResolution: ResolutionItem[] = pendingSampleEntities.map(
  (entity, reviewIndex) => ({
    id: `review-${reviewIndex + 1}`,
    sourceEntityId: entity.id,
    rawTitle: entity.title,
    sourceSystem: sampleSourceByKey[entity.sourceKey].name,
    platform: samplePlatformByKey[entity.sourceKey].name,
    releaseYear: entity.year,
    country: entity.country,
    contentType: entity.type,
    candidates: entity.candidateKeys.map((key, index) => {
      const candidate = sampleTitleByKey[key];
      const candidateId =
        reviewIndex === 0
          ? index + 1
          : reviewIndex === 1
            ? index + 4
            : index + 6;
      return {
        id: `00000004-0000-4000-8000-${String(candidateId).padStart(12, "0")}`,
        contentId: candidate.id,
        title: candidate.title,
        descriptor: `${candidate.type === "movie" ? "Movie" : "Series"} · ${candidate.releaseYear} · ${candidate.country}`,
        score: entity.scores[index] ?? 0.75,
        method: "Exact normalized title",
        features: {
          titleSimilarity: 1,
          yearMatch: null,
          typeMatch:
            entity.type === "title" ? null : entity.type === candidate.type,
          countryMatch: entity.country
            ? entity.country === candidate.country
            : null,
          externalIdMatch: false,
        },
      };
    }),
  }),
);

export const demoSources: SourceSummary[] = sampleSources.map(
  (source, index) => {
    const mapped = sampleEntities.filter(
      (entity) => entity.sourceKey === source.key,
    ).length;
    const pending = pendingSampleEntities.filter(
      (entity) => entity.sourceKey === source.key,
    ).length;
    const unresolved = unresolvedSampleEntity.sourceKey === source.key ? 1 : 0;
    const records = mapped + pending + unresolved;
    return {
      id: source.id,
      name: source.name,
      platform: samplePlatformByKey[source.platformKey].name,
      sourceType: source.type.replaceAll("_", " "),
      active: true,
      lastIngestion: new Date(
        Date.UTC(2026, 6, 28, 8, -index * 19),
      ).toISOString(),
      lastStatus: source.key === "hulu" ? "Completed with errors" : "Completed",
      recordCount: records,
      matchRate: records ? (mapped / records) * 100 : 0,
      latestMetricDate: metricDates.at(-(index % 3) - 1) ?? "No data",
    };
  },
);

export function getDemoContentDetail(id: string): ContentDetail | null {
  const item = demoCatalog.find((candidate) => candidate.id === id);
  const title = sampleTitles.find((candidate) => candidate.id === id);
  if (!item || !title) return null;
  const mapped = sampleEntities
    .map((entity, index) => ({ entity, index }))
    .filter(({ entity }) => entity.contentKey === title.key);
  const platformMetrics = Object.entries(
    mapped.reduce<Record<string, number>>((totals, { entity, index }) => {
      const platform = samplePlatformByKey[entity.sourceKey].name;
      totals[platform] =
        (totals[platform] ?? 0) + viewsForEntity(entity, index);
      return totals;
    }, {}),
  )
    .map(([platformName, views]) => ({ platform: platformName, views }))
    .sort((a, b) => b.views - a.views);

  return {
    ...item,
    originalTitle: title.originalTitle ?? null,
    language: title.language,
    status: title.status,
    synopsis: title.synopsis,
    runtimeSeconds: title.runtimeMinutes ? title.runtimeMinutes * 60 : null,
    aliasesList: title.aliases.map((alias) => ({
      title: alias.title,
      type: alias.type,
      country: alias.country,
      primary: alias.primary ?? false,
    })),
    sources: mapped.map(({ entity }) => ({
      id: entity.id,
      rawTitle: entity.title,
      system: sampleSourceByKey[entity.sourceKey].name,
      confidence: entity.confidence,
      method: entity.method.replaceAll("_", " "),
    })),
    mappingHistory: mapped.map(({ entity }, index) => ({
      id: `history-${entity.id}`,
      source: sampleSourceByKey[entity.sourceKey].name,
      contentTitle: title.title,
      status: "Accepted",
      validFrom: new Date(Date.UTC(2026, 3, 30, 8, index * 3)).toISOString(),
      validTo: null,
    })),
    dailyViews: metricDates.map((date, dayIndex) => ({
      date,
      views: mapped.reduce(
        (sum, { entity, index }) =>
          sum + dailyViewsForEntity(entity, index, dayIndex),
        0,
      ),
    })),
    platformMetrics,
    parent: null,
    children: [],
    identifiers: [
      {
        namespace: "IMDb",
        value: title.imdb,
        url: `https://www.imdb.com/title/${title.imdb}/`,
      },
      {
        namespace: "TMDB",
        value: title.tmdb,
        url: `https://www.themoviedb.org/${title.tmdbType}/${title.tmdb}`,
      },
    ],
  };
}
