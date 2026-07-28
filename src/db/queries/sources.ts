import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { demoSources } from "@/db/demo-data";
import { hasDatabase } from "@/lib/env";
import { getCurrentWorkspace } from "@/lib/workspace";
import type { SourceSummary } from "@/types/domain";

type Row = Record<string, unknown>;

export async function getSources(): Promise<SourceSummary[]> {
  if (!hasDatabase()) return demoSources;
  const workspace = await getCurrentWorkspace();
  const result = await getDb().execute<Row>(sql`
    select s.id, s.name, coalesce(p.name, 'Unassigned') as platform,
      replace(s.source_type::text, '_', ' ') as source_type, s.is_active,
      latest.completed_at, latest.status::text as last_status,
      count(distinct se.id)::int as record_count,
      count(distinct cm.source_entity_id)::int as matched_count,
      max(metric.metric_date)::text as latest_metric_date
    from ingest.source_system s
    left join catalog.platform p on p.id = s.platform_id
    left join ingest.source_entity se on se.source_system_id = s.id
    left join resolution.content_mapping cm
      on cm.source_entity_id = se.id and cm.decision_status = 'accepted'
      and cm.valid_to is null
    left join analytics.source_content_metric_daily metric
      on metric.source_system_id = s.id
    left join lateral (
      select r.completed_at, r.status
      from ingest.ingestion_run r where r.source_system_id = s.id
      order by r.started_at desc limit 1
    ) latest on true
    where s.workspace_id = ${workspace.id}
    group by s.id, s.name, p.name, latest.completed_at, latest.status
    order by s.name
  `);

  return result.rows.map((row) => {
    const records = Number(row.record_count ?? 0);
    return {
      id: String(row.id),
      name: String(row.name),
      platform: String(row.platform),
      sourceType: String(row.source_type),
      active: Boolean(row.is_active),
      lastIngestion: String(row.completed_at ?? ""),
      lastStatus: String(row.last_status ?? "No runs").replaceAll("_", " "),
      recordCount: records,
      matchRate: records ? (Number(row.matched_count ?? 0) / records) * 100 : 0,
      latestMetricDate: String(row.latest_metric_date ?? "No data"),
    };
  });
}
