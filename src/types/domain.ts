export interface DashboardData {
  kpis: {
    canonicalContent: number;
    sourceEntities: number;
    matchRate: number;
    pendingReview: number;
    activeSources: number;
    latestMetricDate: string;
    totalViews: number;
    watchSeconds: number;
  };
  dailyViews: Array<{ date: string; views: number }>;
  platformPerformance: Array<{
    platform: string;
    views: number;
    watchSeconds: number;
    color: string;
  }>;
  topContent: Array<{
    id: string;
    title: string;
    descriptor: string;
    views: number;
    share: number;
  }>;
  recentRuns: Array<{
    id: string;
    source: string;
    status: string;
    completedAt: string;
    records: number;
  }>;
  matchQuality: Array<{ label: string; count: number; color: string }>;
  freshness: Array<{
    source: string;
    platform: string;
    latestDate: string;
    status: "Fresh" | "Watch" | "Stale";
  }>;
  overlap: Array<{
    title: string;
    Peacock: boolean;
    Netflix: boolean;
    Hulu: boolean;
  }>;
}

export interface CatalogItem {
  id: string;
  title: string;
  contentType: string;
  releaseYear: number | null;
  country: string | null;
  platforms: string[];
  sourceRecords: number;
  aliases: number;
  views: number;
  watchSeconds: number;
  confidence: number | null;
}

export interface CatalogResult {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContentDetail extends CatalogItem {
  originalTitle: string | null;
  language: string | null;
  status: string | null;
  aliasesList: Array<{
    title: string;
    type: string;
    country: string | null;
    primary: boolean;
  }>;
  sources: Array<{
    id: string;
    rawTitle: string;
    system: string;
    confidence: number;
    method: string;
  }>;
  mappingHistory: Array<{
    id: string;
    source: string;
    contentTitle: string;
    status: string;
    validFrom: string;
    validTo: string | null;
  }>;
  dailyViews: Array<{ date: string; views: number }>;
  platformMetrics: Array<{ platform: string; views: number }>;
  parent: { id: string; title: string } | null;
  children: Array<{ id: string; title: string; type: string }>;
  identifiers: Array<{ namespace: string; value: string; url: string | null }>;
}

export interface ResolutionItem {
  id: string;
  sourceEntityId: string;
  rawTitle: string;
  sourceSystem: string;
  platform: string;
  releaseYear: number | null;
  country: string | null;
  contentType: string;
  candidates: Array<{
    id: string;
    contentId: string;
    title: string;
    descriptor: string;
    score: number;
    method: string;
    features: {
      titleSimilarity: number;
      yearMatch: boolean | null;
      typeMatch: boolean | null;
      countryMatch: boolean | null;
      externalIdMatch: boolean;
    };
  }>;
}

export interface SourceSummary {
  id: string;
  name: string;
  platform: string;
  sourceType: string;
  active: boolean;
  lastIngestion: string;
  lastStatus: string;
  recordCount: number;
  matchRate: number;
  latestMetricDate: string;
}
