import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { demoDashboard } from "@/db/demo-data";
import { hasDatabase } from "@/lib/env";
import { getCurrentWorkspace } from "@/lib/workspace";
import type { DashboardData } from "@/types/domain";

type Row = Record<string, unknown>;

const number = (value: unknown) => Number(value ?? 0);
const string = (value: unknown) => String(value ?? "");

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasDatabase()) return demoDashboard;

  const db = getDb();
  const workspace = await getCurrentWorkspace();
  const workspaceId = workspace.id;

  const [kpi, daily, platforms, top, runs, quality, freshness, overlap] =
    await Promise.all([
      db.execute<Row>(sql`
        select
          (select count(*) from catalog.content)::int as canonical_content,
          (select count(*) from ingest.source_entity where workspace_id = ${workspaceId})::int as source_entities,
          (select count(*) from ingest.source_system where workspace_id = ${workspaceId} and is_active)::int as active_sources,
          (select count(distinct source_entity_id) from resolution.content_mapping where workspace_id = ${workspaceId} and decision_status = 'accepted' and valid_to is null)::int as matched_entities,
          (select count(distinct source_entity_id) from resolution.match_candidate where workspace_id = ${workspaceId} and status = 'pending')::int as pending_review,
          (select max(metric_date)::text from analytics.content_metric_daily where workspace_id = ${workspaceId}) as latest_metric_date,
          (select coalesce(sum(views), 0) from analytics.content_metric_daily where workspace_id = ${workspaceId}) as total_views,
          (select coalesce(sum(watch_seconds), 0) from analytics.content_metric_daily where workspace_id = ${workspaceId}) as watch_seconds
      `),
      db.execute<Row>(sql`
        select metric_date::text as date, sum(views) as views
        from analytics.content_metric_daily
        where workspace_id = ${workspaceId}
        group by metric_date order by metric_date
      `),
      db.execute<Row>(sql`
        select p.name as platform, sum(m.views) as views, sum(m.watch_seconds) as watch_seconds
        from analytics.content_metric_daily m
        join catalog.platform p on p.id = m.platform_id
        where m.workspace_id = ${workspaceId}
        group by p.id, p.name order by views desc
      `),
      db.execute<Row>(sql`
        select c.id, c.display_title as title, ct.name as content_type,
          c.release_year, c.origin_country, sum(m.views) as views
        from analytics.content_metric_daily m
        join catalog.content c on c.id = m.content_id
        join catalog.content_type ct on ct.id = c.content_type_id
        where m.workspace_id = ${workspaceId}
        group by c.id, c.display_title, ct.name, c.release_year, c.origin_country
        order by views desc limit 5
      `),
      db.execute<Row>(sql`
        select r.id, s.name as source, r.status::text, r.completed_at,
          r.records_received as records
        from ingest.ingestion_run r
        join ingest.source_system s on s.id = r.source_system_id
        where s.workspace_id = ${workspaceId}
        order by r.started_at desc limit 5
      `),
      db.execute<Row>(sql`
        select
          count(*) filter (where confidence::numeric >= .95 and valid_to is null)::int as high,
          count(*) filter (where confidence::numeric >= .70 and confidence::numeric < .95 and valid_to is null)::int as review,
          greatest(
            (select count(*) from ingest.source_entity where workspace_id = ${workspaceId}) -
            count(*) filter (where decision_status = 'accepted' and valid_to is null),
            0
          )::int as unresolved
        from resolution.content_mapping where workspace_id = ${workspaceId}
      `),
      db.execute<Row>(sql`
        select s.name as source, coalesce(p.name, 'Unassigned') as platform,
          max(m.metric_date)::text as latest_date
        from ingest.source_system s
        left join catalog.platform p on p.id = s.platform_id
        left join analytics.source_content_metric_daily m on m.source_system_id = s.id
        where s.workspace_id = ${workspaceId}
        group by s.id, s.name, p.name order by s.name
      `),
      db.execute<Row>(sql`
        select c.display_title as title, c.release_year, c.origin_country,
          array_agg(distinct p.name) as platforms
        from analytics.content_metric_daily m
        join catalog.content c on c.id = m.content_id
        join catalog.platform p on p.id = m.platform_id
        where m.workspace_id = ${workspaceId}
        group by c.id, c.display_title, c.release_year, c.origin_country
        order by c.display_title
      `),
    ]);

  const summary = kpi.rows[0] ?? {};
  const totalViews = number(summary.total_views);
  const sourceCount = number(summary.source_entities);
  const matchedCount = number(summary.matched_entities);
  const colors = ["#2563eb", "#7c3aed", "#0d9488", "#f59e0b", "#64748b"];
  const qualityRow = quality.rows[0] ?? {};

  return {
    kpis: {
      canonicalContent: number(summary.canonical_content),
      sourceEntities: sourceCount,
      matchRate: sourceCount ? (matchedCount / sourceCount) * 100 : 0,
      pendingReview: number(summary.pending_review),
      activeSources: number(summary.active_sources),
      latestMetricDate: string(summary.latest_metric_date) || "—",
      totalViews,
      watchSeconds: number(summary.watch_seconds),
    },
    dailyViews: daily.rows.map((row) => ({
      date: string(row.date),
      views: number(row.views),
    })),
    platformPerformance: platforms.rows.map((row, index) => ({
      platform: string(row.platform),
      views: number(row.views),
      watchSeconds: number(row.watch_seconds),
      color: colors[index % colors.length] ?? "#64748b",
    })),
    topContent: top.rows.map((row) => {
      const views = number(row.views);
      return {
        id: string(row.id),
        title: string(row.title),
        descriptor: `${string(row.content_type)} · ${string(row.release_year)} · ${string(row.origin_country)}`,
        views,
        share: totalViews ? (views / totalViews) * 100 : 0,
      };
    }),
    recentRuns: runs.rows.map((row) => ({
      id: string(row.id),
      source: string(row.source),
      status: string(row.status).replaceAll("_", " "),
      completedAt: string(row.completed_at),
      records: number(row.records),
    })),
    matchQuality: [
      {
        label: "High confidence",
        count: number(qualityRow.high),
        color: "#2563eb",
      },
      {
        label: "Needs review",
        count: number(qualityRow.review),
        color: "#f59e0b",
      },
      {
        label: "Unresolved",
        count: number(qualityRow.unresolved),
        color: "#cbd5e1",
      },
    ],
    freshness: freshness.rows.map((row) => {
      const latestDate = string(row.latest_date);
      const age = latestDate
        ? Math.floor(
            (Date.now() - new Date(`${latestDate}T00:00:00Z`).getTime()) /
              86_400_000,
          )
        : 999;
      return {
        source: string(row.source),
        platform: string(row.platform),
        latestDate: latestDate || "No data",
        status: age <= 1 ? "Fresh" : age <= 3 ? "Watch" : "Stale",
      };
    }),
    overlap: overlap.rows.map((row) => {
      const names = Array.isArray(row.platforms)
        ? row.platforms.map(String)
        : [];
      return {
        title: `${string(row.title)} · ${string(row.origin_country)}`,
        Peacock: names.includes("Peacock"),
        Netflix: names.includes("Netflix"),
        Hulu: names.includes("Hulu"),
      };
    }),
  };
}
