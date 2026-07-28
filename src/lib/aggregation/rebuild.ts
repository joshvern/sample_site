import { sql } from "drizzle-orm";
import type { Database } from "@/db/client";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Executor = Database | Transaction;

export interface RebuildOptions {
  workspaceId: string;
  contentIds: string[];
  dateFrom?: string;
  dateTo?: string;
}

export async function rebuildCanonicalMetrics(
  db: Executor,
  { workspaceId, contentIds, dateFrom, dateTo }: RebuildOptions,
) {
  const uniqueContentIds = [...new Set(contentIds)];
  if (uniqueContentIds.length === 0) return;

  const contentList = sql.join(
    uniqueContentIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const dateFilter = sql`
    ${dateFrom ? sql`and sm.metric_date >= ${dateFrom}::date` : sql``}
    ${dateTo ? sql`and sm.metric_date <= ${dateTo}::date` : sql``}
  `;

  await db.execute(sql`
    delete from analytics.content_metric_daily
    where workspace_id = ${workspaceId}::uuid
      and content_id in (${contentList})
      ${dateFrom ? sql`and metric_date >= ${dateFrom}::date` : sql``}
      ${dateTo ? sql`and metric_date <= ${dateTo}::date` : sql``}
  `);

  await db.execute(sql`
    insert into analytics.content_metric_daily (
      workspace_id, content_id, platform_id, metric_date,
      views, watch_seconds, unique_viewers, starts, completions, revenue_cents,
      mapping_version, refreshed_at
    )
    select
      sm.workspace_id,
      cm.content_id,
      sm.platform_id,
      sm.metric_date,
      sum(sm.views),
      sum(sm.watch_seconds),
      sum(sm.unique_viewers),
      sum(sm.starts),
      sum(sm.completions),
      sum(sm.revenue_cents),
      md5(string_agg(distinct cm.id::text, ',' order by cm.id::text)),
      now()
    from analytics.source_content_metric_daily sm
    join resolution.content_mapping cm
      on cm.source_entity_id = sm.source_entity_id
      and cm.workspace_id = sm.workspace_id
      and cm.decision_status = 'accepted'
      and cm.valid_to is null
    where sm.workspace_id = ${workspaceId}::uuid
      and cm.content_id in (${contentList})
      ${dateFilter}
    group by sm.workspace_id, cm.content_id, sm.platform_id, sm.metric_date
    on conflict (workspace_id, content_id, platform_id, metric_date)
    do update set
      views = excluded.views,
      watch_seconds = excluded.watch_seconds,
      unique_viewers = excluded.unique_viewers,
      starts = excluded.starts,
      completions = excluded.completions,
      revenue_cents = excluded.revenue_cents,
      mapping_version = excluded.mapping_version,
      refreshed_at = excluded.refreshed_at
  `);
}
