import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { demoCatalog, getDemoContentDetail } from "@/db/demo-data";
import { hasDatabase } from "@/lib/env";
import { getCurrentWorkspace } from "@/lib/workspace";
import type { CatalogItem, CatalogResult, ContentDetail } from "@/types/domain";

type Row = Record<string, unknown>;
const number = (value: unknown) => Number(value ?? 0);
const string = (value: unknown) => String(value ?? "");

export interface ContentFilters {
  search?: string;
  contentType?: string;
  platform?: string;
  country?: string;
  quality?: string;
  sort?: "views" | "title" | "year" | "confidence";
  page?: number;
  pageSize?: number;
}

export async function getContentCatalog(
  filters: ContentFilters = {},
): Promise<CatalogResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 10));

  if (!hasDatabase()) {
    let items = demoCatalog.filter((item) => {
      if (
        filters.search &&
        !item.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (
        filters.contentType &&
        item.contentType.toLowerCase() !== filters.contentType.toLowerCase()
      )
        return false;
      if (filters.platform && !item.platforms.includes(filters.platform))
        return false;
      if (filters.country && item.country !== filters.country) return false;
      if (
        filters.quality === "high" &&
        (item.confidence == null || item.confidence < 0.95)
      )
        return false;
      if (
        filters.quality === "review" &&
        (item.confidence == null || item.confidence >= 0.95)
      )
        return false;
      return true;
    });
    items = [...items].sort((a, b) => {
      if (filters.sort === "title") return a.title.localeCompare(b.title);
      if (filters.sort === "year")
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      if (filters.sort === "confidence")
        return (b.confidence ?? 0) - (a.confidence ?? 0);
      return b.views - a.views;
    });
    const total = items.length;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  const db = getDb();
  const workspace = await getCurrentWorkspace();
  const conditions = [
    sql`true`,
    filters.search
      ? sql`c.display_title ilike ${`%${filters.search}%`}`
      : sql`true`,
    filters.contentType ? sql`ct.key = ${filters.contentType}` : sql`true`,
    filters.country ? sql`c.origin_country = ${filters.country}` : sql`true`,
    filters.platform
      ? sql`${filters.platform} = any(platforms.names)`
      : sql`true`,
    filters.quality === "high" ? sql`mappings.confidence >= .95` : sql`true`,
    filters.quality === "review"
      ? sql`mappings.confidence >= .70 and mappings.confidence < .95`
      : sql`true`,
  ];
  const where = sql.join(conditions, sql` and `);
  const offset = (page - 1) * pageSize;
  const orderBy =
    filters.sort === "title"
      ? sql`c.display_title asc, c.release_year desc`
      : filters.sort === "year"
        ? sql`c.release_year desc nulls last, c.display_title`
        : filters.sort === "confidence"
          ? sql`c.confidence desc nulls last, c.display_title`
          : sql`c.views desc, c.display_title`;

  const result = await db.execute<Row>(sql`
    with platforms as (
      select m.content_id, array_agg(distinct p.name) as names,
        sum(m.views) as views, sum(m.watch_seconds) as watch_seconds
      from analytics.content_metric_daily m
      join catalog.platform p on p.id = m.platform_id
      where m.workspace_id = ${workspace.id}
      group by m.content_id
    ), mappings as (
      select content_id, count(distinct source_entity_id)::int as source_records,
        avg(confidence::numeric)::float as confidence
      from resolution.content_mapping
      where workspace_id = ${workspace.id}
        and decision_status = 'accepted' and valid_to is null
      group by content_id
    ), aliases as (
      select content_id, count(*)::int as alias_count
      from catalog.content_title group by content_id
    ), catalog_rows as (
      select c.id, c.display_title, ct.name as content_type, c.release_year,
        c.origin_country, coalesce(platforms.names, array[]::text[]) as platforms,
        coalesce(mappings.source_records, 0) as source_records,
        coalesce(aliases.alias_count, 0) as aliases,
        coalesce(platforms.views, 0) as views,
        coalesce(platforms.watch_seconds, 0) as watch_seconds,
        mappings.confidence,
        coalesce(c.metadata->'genres', '[]'::jsonb) as genres,
        coalesce(c.metadata->>'accent', '#475569') as accent
      from catalog.content c
      join catalog.content_type ct on ct.id = c.content_type_id
      left join platforms on platforms.content_id = c.id
      left join mappings on mappings.content_id = c.id
      left join aliases on aliases.content_id = c.id
    )
    select *, count(*) over()::int as total
    from catalog_rows c
    cross join lateral (select c.platforms as names) platforms
    cross join lateral (select c.confidence) mappings
    where ${where}
    order by ${orderBy}
    limit ${pageSize} offset ${offset}
  `);

  const items: CatalogItem[] = result.rows.map((row) => ({
    id: string(row.id),
    title: string(row.display_title),
    contentType: string(row.content_type),
    releaseYear: row.release_year == null ? null : number(row.release_year),
    country: row.origin_country == null ? null : string(row.origin_country),
    platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
    sourceRecords: number(row.source_records),
    aliases: number(row.aliases),
    views: number(row.views),
    watchSeconds: number(row.watch_seconds),
    confidence: row.confidence == null ? null : number(row.confidence),
    genres: Array.isArray(row.genres) ? row.genres.map(String) : [],
    accent: string(row.accent) || "#475569",
  }));

  return {
    items,
    total: number(result.rows[0]?.total),
    page,
    pageSize,
  };
}

export async function getContentDetail(
  id: string,
): Promise<ContentDetail | null> {
  if (!hasDatabase()) return getDemoContentDetail(id);

  const workspace = await getCurrentWorkspace();
  const db = getDb();
  const [
    base,
    metadata,
    aliases,
    sources,
    history,
    daily,
    platformMetrics,
    identifiers,
  ] = await Promise.all([
    getContentCatalog({ pageSize: 50 }).then((result) =>
      result.items.find((item) => item.id === id),
    ),
    db.execute<Row>(sql`
        select original_title, original_language, status, runtime_seconds,
          metadata->>'synopsis' as synopsis
        from catalog.content where id = ${id}
      `),
    db.execute<Row>(sql`
        select title, title_type::text as type, country_code as country, is_primary
        from catalog.content_title where content_id = ${id} order by is_primary desc, title
      `),
    db.execute<Row>(sql`
        select se.id, se.raw_title, ss.name as system, cm.confidence, cm.decision_method::text as method
        from resolution.content_mapping cm
        join ingest.source_entity se on se.id = cm.source_entity_id
        join ingest.source_system ss on ss.id = se.source_system_id
        where cm.workspace_id = ${workspace.id} and cm.content_id = ${id}
          and cm.decision_status = 'accepted' and cm.valid_to is null
        order by ss.name
      `),
    db.execute<Row>(sql`
        select cm.id, ss.name as source, c.display_title as content_title,
          cm.decision_status::text as status, cm.valid_from, cm.valid_to
        from resolution.content_mapping cm
        join ingest.source_entity se on se.id = cm.source_entity_id
        join ingest.source_system ss on ss.id = se.source_system_id
        join catalog.content c on c.id = cm.content_id
        where cm.workspace_id = ${workspace.id} and cm.content_id = ${id}
        order by cm.valid_from desc
      `),
    db.execute<Row>(sql`
        select metric_date::text as date, sum(views) as views
        from analytics.content_metric_daily
        where workspace_id = ${workspace.id} and content_id = ${id}
        group by metric_date order by metric_date
      `),
    db.execute<Row>(sql`
        select p.name as platform, sum(m.views) as views
        from analytics.content_metric_daily m
        join catalog.platform p on p.id = m.platform_id
        where m.workspace_id = ${workspace.id} and m.content_id = ${id}
        group by p.id, p.name order by views desc
      `),
    db.execute<Row>(sql`
        select namespace, external_id as value, external_url as url
        from catalog.external_identifier where content_id = ${id}
      `),
  ]);

  if (!base) return null;
  const metadataRow = metadata.rows[0] ?? {};
  return {
    ...base,
    originalTitle:
      metadataRow.original_title == null
        ? null
        : string(metadataRow.original_title),
    language:
      metadataRow.original_language == null
        ? null
        : string(metadataRow.original_language),
    status: metadataRow.status == null ? null : string(metadataRow.status),
    synopsis:
      metadataRow.synopsis == null ? null : string(metadataRow.synopsis),
    runtimeSeconds:
      metadataRow.runtime_seconds == null
        ? null
        : number(metadataRow.runtime_seconds),
    aliasesList: aliases.rows.map((row) => ({
      title: string(row.title),
      type: string(row.type),
      country: row.country == null ? null : string(row.country),
      primary: Boolean(row.is_primary),
    })),
    sources: sources.rows.map((row) => ({
      id: string(row.id),
      rawTitle: string(row.raw_title),
      system: string(row.system),
      confidence: number(row.confidence),
      method: string(row.method),
    })),
    mappingHistory: history.rows.map((row) => ({
      id: string(row.id),
      source: string(row.source),
      contentTitle: string(row.content_title),
      status: string(row.status),
      validFrom: string(row.valid_from),
      validTo: row.valid_to == null ? null : string(row.valid_to),
    })),
    dailyViews: daily.rows.map((row) => ({
      date: string(row.date),
      views: number(row.views),
    })),
    platformMetrics: platformMetrics.rows.map((row) => ({
      platform: string(row.platform),
      views: number(row.views),
    })),
    identifiers: identifiers.rows.map((row) => ({
      namespace: string(row.namespace),
      value: string(row.value),
      url: row.url == null ? null : string(row.url),
    })),
    parent: null,
    children: [],
  };
}
