import type {
  CatalogItem,
  ContentDetail,
  DashboardData,
  ResolutionItem,
  SourceSummary,
} from "@/types/domain";

export const contentIds = {
  officeUs: "00000000-0000-4000-8000-000000000301",
  officeUk: "00000000-0000-4000-8000-000000000302",
  parks: "00000000-0000-4000-8000-000000000303",
  oppenheimer: "00000000-0000-4000-8000-000000000304",
};

const dates = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 5, 29 + index));
  return date.toISOString().slice(0, 10);
});

export const demoCatalog: CatalogItem[] = [
  {
    id: contentIds.officeUs,
    title: "The Office",
    contentType: "Series",
    releaseYear: 2005,
    country: "US",
    platforms: ["Peacock", "Netflix"],
    sourceRecords: 2,
    aliases: 4,
    views: 7_812_400,
    watchSeconds: 10_312_368_000,
    confidence: 0.985,
  },
  {
    id: contentIds.oppenheimer,
    title: "Oppenheimer",
    contentType: "Movie",
    releaseYear: 2023,
    country: "US",
    platforms: ["Netflix"],
    sourceRecords: 1,
    aliases: 1,
    views: 2_931_800,
    watchSeconds: 21_108_960_000,
    confidence: 1,
  },
  {
    id: contentIds.parks,
    title: "Parks and Recreation",
    contentType: "Series",
    releaseYear: 2009,
    country: "US",
    platforms: ["Peacock"],
    sourceRecords: 1,
    aliases: 2,
    views: 2_421_700,
    watchSeconds: 3_196_644_000,
    confidence: 0.98,
  },
  {
    id: contentIds.officeUk,
    title: "The Office",
    contentType: "Series",
    releaseYear: 2001,
    country: "GB",
    platforms: ["Hulu"],
    sourceRecords: 1,
    aliases: 3,
    views: 1_602_600,
    watchSeconds: 2_115_432_000,
    confidence: 0.99,
  },
];

const dailyViews = dates.map((date, index) => ({
  date,
  views: 382_000 + index * 7_400 + (index % 7) * 12_300,
}));

export const demoDashboard: DashboardData = {
  kpis: {
    canonicalContent: 4,
    sourceEntities: 7,
    matchRate: 71.4,
    pendingReview: 2,
    activeSources: 3,
    latestMetricDate: "2026-07-28",
    totalViews: 14_768_500,
    watchSeconds: 36_733_404_000,
  },
  dailyViews,
  platformPerformance: [
    {
      platform: "Peacock",
      views: 6_818_600,
      watchSeconds: 9_000_552_000,
      color: "#2563eb",
    },
    {
      platform: "Netflix",
      views: 6_347_300,
      watchSeconds: 25_617_420_000,
      color: "#7c3aed",
    },
    {
      platform: "Hulu",
      views: 1_602_600,
      watchSeconds: 2_115_432_000,
      color: "#0d9488",
    },
  ],
  topContent: demoCatalog.map((item) => ({
    id: item.id,
    title: item.title,
    descriptor: `${item.contentType} · ${item.releaseYear} · ${item.country}`,
    views: item.views,
    share: (item.views / 14_768_500) * 100,
  })),
  recentRuns: [
    {
      id: "run-1",
      source: "Peacock Internal Feed",
      status: "Completed",
      completedAt: "2026-07-28T08:00:00.000Z",
      records: 2,
    },
    {
      id: "run-2",
      source: "Netflix Partner Export",
      status: "Completed",
      completedAt: "2026-07-28T07:42:00.000Z",
      records: 2,
    },
    {
      id: "run-3",
      source: "Hulu CSV Upload",
      status: "Completed with errors",
      completedAt: "2026-07-28T07:14:00.000Z",
      records: 3,
    },
  ],
  matchQuality: [
    { label: "High confidence", count: 5, color: "#2563eb" },
    { label: "Needs review", count: 1, color: "#f59e0b" },
    { label: "Unresolved", count: 1, color: "#cbd5e1" },
  ],
  freshness: [
    {
      source: "Peacock Internal Feed",
      platform: "Peacock",
      latestDate: "2026-07-28",
      status: "Fresh",
    },
    {
      source: "Netflix Partner Export",
      platform: "Netflix",
      latestDate: "2026-07-28",
      status: "Fresh",
    },
    {
      source: "Hulu CSV Upload",
      platform: "Hulu",
      latestDate: "2026-07-27",
      status: "Watch",
    },
  ],
  overlap: [
    { title: "The Office · US", Peacock: true, Netflix: true, Hulu: false },
    { title: "The Office · UK", Peacock: false, Netflix: false, Hulu: true },
    {
      title: "Parks and Recreation",
      Peacock: true,
      Netflix: false,
      Hulu: false,
    },
    { title: "Oppenheimer", Peacock: false, Netflix: true, Hulu: false },
  ],
};

export const demoResolution: ResolutionItem[] = [
  {
    id: "review-1",
    sourceEntityId: "00000000-0000-4000-8000-000000000603",
    rawTitle: "The Office",
    sourceSystem: "Hulu CSV Upload",
    platform: "Hulu",
    releaseYear: null,
    country: null,
    contentType: "series",
    candidates: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        contentId: contentIds.officeUs,
        title: "The Office",
        descriptor: "Series · 2005 · US",
        score: 0.85,
        method: "Exact normalized title",
        features: {
          titleSimilarity: 1,
          yearMatch: null,
          typeMatch: true,
          countryMatch: null,
          externalIdMatch: false,
        },
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        contentId: contentIds.officeUk,
        title: "The Office",
        descriptor: "Series · 2001 · GB",
        score: 0.85,
        method: "Exact normalized title",
        features: {
          titleSimilarity: 1,
          yearMatch: null,
          typeMatch: true,
          countryMatch: null,
          externalIdMatch: false,
        },
      },
    ],
  },
];

export const demoSources: SourceSummary[] = [
  {
    id: "00000000-0000-4000-8000-000000000401",
    name: "Peacock Internal Feed",
    platform: "Peacock",
    sourceType: "API",
    active: true,
    lastIngestion: "2026-07-28T08:00:00.000Z",
    lastStatus: "Completed",
    recordCount: 2,
    matchRate: 100,
    latestMetricDate: "2026-07-28",
  },
  {
    id: "00000000-0000-4000-8000-000000000402",
    name: "Netflix Partner Export",
    platform: "Netflix",
    sourceType: "Partner feed",
    active: true,
    lastIngestion: "2026-07-28T07:42:00.000Z",
    lastStatus: "Completed",
    recordCount: 2,
    matchRate: 100,
    latestMetricDate: "2026-07-28",
  },
  {
    id: "00000000-0000-4000-8000-000000000403",
    name: "Hulu CSV Upload",
    platform: "Hulu",
    sourceType: "CSV upload",
    active: true,
    lastIngestion: "2026-07-28T07:14:00.000Z",
    lastStatus: "Completed with errors",
    recordCount: 3,
    matchRate: 33.3,
    latestMetricDate: "2026-07-27",
  },
];

export function getDemoContentDetail(id: string): ContentDetail | null {
  const item = demoCatalog.find((candidate) => candidate.id === id);
  if (!item) return null;
  const officeUs = id === contentIds.officeUs;
  const officeUk = id === contentIds.officeUk;

  return {
    ...item,
    originalTitle: null,
    language: "en",
    status: item.contentType === "Movie" ? "released" : "ended",
    aliasesList: officeUs
      ? [
          {
            title: "The Office",
            type: "official",
            country: "US",
            primary: true,
          },
          {
            title: "The Office (U.S.)",
            type: "alias",
            country: "US",
            primary: false,
          },
          {
            title: "Office, The",
            type: "alias",
            country: "US",
            primary: false,
          },
          {
            title: "The Office (2005)",
            type: "alias",
            country: "US",
            primary: false,
          },
        ]
      : officeUk
        ? [
            {
              title: "The Office",
              type: "official",
              country: "GB",
              primary: true,
            },
            {
              title: "The Office (UK)",
              type: "alias",
              country: "GB",
              primary: false,
            },
            {
              title: "The Office UK",
              type: "alias",
              country: "GB",
              primary: false,
            },
          ]
        : [
            {
              title: item.title,
              type: "official",
              country: item.country,
              primary: true,
            },
          ],
    sources: officeUs
      ? [
          {
            id: "source-1",
            rawTitle: "The Office (2005)",
            system: "Peacock Internal Feed",
            confidence: 0.99,
            method: "Seed",
          },
          {
            id: "source-2",
            rawTitle: "Office, The",
            system: "Netflix Partner Export",
            confidence: 0.98,
            method: "Seed",
          },
        ]
      : [
          {
            id: "source-3",
            rawTitle: item.title,
            system: officeUk ? "Hulu CSV Upload" : "Seed source",
            confidence: item.confidence ?? 1,
            method: "Seed",
          },
        ],
    mappingHistory: [
      {
        id: "history-1",
        source: officeUs ? "Peacock Internal Feed" : "Seed source",
        contentTitle: item.title,
        status: "Accepted",
        validFrom: "2026-06-29T08:00:00.000Z",
        validTo: null,
      },
    ],
    dailyViews: dailyViews.map((entry, index) => ({
      date: entry.date,
      views: Math.round(
        entry.views *
          (item.views / demoDashboard.kpis.totalViews) *
          (0.9 + (index % 5) * 0.025),
      ),
    })),
    platformMetrics: item.platforms.map((platform, index) => ({
      platform,
      views: Math.round(item.views / item.platforms.length + index * 12_000),
    })),
    parent: null,
    children: [],
    identifiers: [],
  };
}
