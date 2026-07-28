import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { demoResolution } from "@/db/demo-data";
import { hasDatabase } from "@/lib/env";
import { getCurrentWorkspace } from "@/lib/workspace";
import type { ResolutionItem } from "@/types/domain";

type Row = Record<string, unknown>;

export async function getResolutionQueue(): Promise<ResolutionItem[]> {
  if (!hasDatabase()) return demoResolution;
  const workspace = await getCurrentWorkspace();
  const result = await getDb().execute<Row>(sql`
    select
      se.id as source_entity_id, se.raw_title, ss.name as source_system,
      coalesce(p.name, 'Unassigned') as platform, se.release_year,
      se.country_code, se.entity_type,
      json_agg(json_build_object(
        'id', mc.id,
        'contentId', c.id,
        'title', c.display_title,
        'descriptor', concat(ct.name, ' · ', c.release_year, ' · ', c.origin_country),
        'score', mc.score::float,
        'method', replace(mc.method::text, '_', ' '),
        'features', mc.features
      ) order by mc.score desc) as candidates
    from ingest.source_entity se
    join ingest.source_system ss on ss.id = se.source_system_id
    left join catalog.platform p on p.id = ss.platform_id
    join resolution.match_candidate mc
      on mc.source_entity_id = se.id and mc.status = 'pending'
    join catalog.content c on c.id = mc.content_id
    join catalog.content_type ct on ct.id = c.content_type_id
    where se.workspace_id = ${workspace.id}
    group by se.id, se.raw_title, ss.name, p.name, se.release_year,
      se.country_code, se.entity_type
    order by max(mc.score) desc
  `);

  return result.rows.map((row, index) => ({
    id: `review-${index}`,
    sourceEntityId: String(row.source_entity_id),
    rawTitle: String(row.raw_title),
    sourceSystem: String(row.source_system),
    platform: String(row.platform),
    releaseYear: row.release_year == null ? null : Number(row.release_year),
    country: row.country_code == null ? null : String(row.country_code),
    contentType: String(row.entity_type),
    candidates: (Array.isArray(row.candidates) ? row.candidates : []).map(
      (candidate) => {
        const item = candidate as Record<string, unknown>;
        const features = (item.features ?? {}) as Record<string, unknown>;
        return {
          id: String(item.id),
          contentId: String(item.contentId),
          title: String(item.title),
          descriptor: String(item.descriptor),
          score: Number(item.score),
          method: String(item.method),
          features: {
            titleSimilarity: Number(features.titleSimilarity ?? 0),
            yearMatch:
              features.yearMatch == null ? null : Boolean(features.yearMatch),
            typeMatch:
              features.typeMatch == null ? null : Boolean(features.typeMatch),
            countryMatch:
              features.countryMatch == null
                ? null
                : Boolean(features.countryMatch),
            externalIdMatch: Boolean(features.externalIdMatch),
          },
        };
      },
    ),
  }));
}
