import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  ingestionRun,
  platform,
  sourceContentMetricDaily,
  sourceEntity,
  sourceEntityVersion,
  sourceSystem,
} from "@/db/schemas";
import type { CsvRow, RowFailure } from "./validation";
import { payloadChecksum } from "./checksum";
import { normalizeTitle } from "@/lib/title-normalization";
import { AppError } from "@/lib/errors";
import { getCurrentWorkspace } from "@/lib/workspace";
import { generateCandidatesForSource } from "@/lib/matching/generate";

export interface IngestRowsInput {
  sourceSystemId: string;
  rows: CsvRow[];
  receivedCount: number;
  failures: RowFailure[];
  filename: string;
}

export interface IngestionSummary {
  runId: string;
  status: "completed" | "completed_with_errors";
  received: number;
  inserted: number;
  updated: number;
  failed: number;
  versionsCreated: number;
  metricsUpserted: number;
}

export async function ingestRows(
  input: IngestRowsInput,
): Promise<IngestionSummary> {
  const db = getDb();
  const workspace = await getCurrentWorkspace();
  const [system] = await db
    .select()
    .from(sourceSystem)
    .where(
      and(
        eq(sourceSystem.id, input.sourceSystemId),
        eq(sourceSystem.workspaceId, workspace.id),
        eq(sourceSystem.isActive, true),
      ),
    )
    .limit(1);
  if (!system) {
    throw new AppError("not_found", "Active source system was not found.");
  }

  const [run] = await db
    .insert(ingestionRun)
    .values({
      sourceSystemId: system.id,
      status: "processing",
      recordsReceived: input.receivedCount,
      recordsFailed: input.failures.length,
      metadata: {
        filename: input.filename,
        failures: input.failures,
      },
    })
    .returning();
  if (!run)
    throw new AppError("database_failure", "Ingestion run was not created.");

  let inserted = 0;
  let updated = 0;
  let versionsCreated = 0;
  let metricsUpserted = 0;
  const candidateEntityIds = new Set<string>();

  try {
    await db.transaction(async (tx) => {
      for (const row of input.rows) {
        const [existing] = await tx
          .select({ id: sourceEntity.id })
          .from(sourceEntity)
          .where(
            and(
              eq(sourceEntity.sourceSystemId, system.id),
              eq(sourceEntity.sourceNativeId, row.source_native_id),
            ),
          )
          .limit(1);

        const normalized = normalizeTitle(row.title);
        const payload = row as Record<string, unknown>;
        const externalIdentifiers =
          row.external_id && row.external_id_namespace
            ? { [row.external_id_namespace]: row.external_id }
            : {};

        const [entity] = await tx
          .insert(sourceEntity)
          .values({
            workspaceId: workspace.id,
            sourceSystemId: system.id,
            sourceNativeId: row.source_native_id,
            entityType: row.content_type,
            rawTitle: row.title,
            normalizedTitle: normalized.normalized,
            releaseYear: row.release_year ?? normalized.extractedYear,
            countryCode:
              row.country_code || normalized.extractedRegion || undefined,
            languageCode: row.language_code || undefined,
            externalIdentifiers,
            currentPayload: payload,
          })
          .onConflictDoUpdate({
            target: [sourceEntity.sourceSystemId, sourceEntity.sourceNativeId],
            set: {
              entityType: row.content_type,
              rawTitle: row.title,
              normalizedTitle: normalized.normalized,
              releaseYear: row.release_year ?? normalized.extractedYear,
              countryCode:
                row.country_code || normalized.extractedRegion || undefined,
              languageCode: row.language_code || undefined,
              externalIdentifiers,
              currentPayload: payload,
              lastSeenAt: new Date(),
              updatedAt: new Date(),
            },
          })
          .returning();
        if (!entity)
          throw new AppError(
            "database_failure",
            "Source entity upsert failed.",
          );
        if (existing) updated += 1;
        else inserted += 1;

        const versions = await tx
          .insert(sourceEntityVersion)
          .values({
            sourceEntityId: entity.id,
            ingestionRunId: run.id,
            payload,
            payloadChecksum: payloadChecksum(payload),
            observedAt: new Date(),
          })
          .onConflictDoNothing()
          .returning({ id: sourceEntityVersion.id });
        versionsCreated += versions.length;
        candidateEntityIds.add(entity.id);

        if (row.metric_date) {
          let platformId = system.platformId;
          if (row.platform) {
            const [matchedPlatform] = await tx
              .select({ id: platform.id })
              .from(platform)
              .where(sql`lower(${platform.name}) = lower(${row.platform})`)
              .limit(1);
            platformId = matchedPlatform?.id ?? platformId;
          }
          if (!platformId) {
            throw new AppError(
              "validation",
              `No platform could be resolved for ${row.source_native_id}.`,
            );
          }

          await tx
            .insert(sourceContentMetricDaily)
            .values({
              workspaceId: workspace.id,
              sourceEntityId: entity.id,
              platformId,
              metricDate: row.metric_date,
              views: row.views ?? 0,
              watchSeconds: row.watch_seconds ?? 0,
              uniqueViewers: row.unique_viewers ?? 0,
              starts: row.starts ?? 0,
              completions: row.completions ?? 0,
              revenueCents: row.revenue_cents ?? 0,
              sourceSystemId: system.id,
              ingestionRunId: run.id,
              observedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                sourceContentMetricDaily.workspaceId,
                sourceContentMetricDaily.sourceEntityId,
                sourceContentMetricDaily.platformId,
                sourceContentMetricDaily.metricDate,
                sourceContentMetricDaily.sourceSystemId,
              ],
              set: {
                views: row.views ?? 0,
                watchSeconds: row.watch_seconds ?? 0,
                uniqueViewers: row.unique_viewers ?? 0,
                starts: row.starts ?? 0,
                completions: row.completions ?? 0,
                revenueCents: row.revenue_cents ?? 0,
                ingestionRunId: run.id,
                observedAt: new Date(),
                updatedAt: new Date(),
              },
            });
          metricsUpserted += 1;
        }
      }

      await tx
        .update(ingestionRun)
        .set({
          status:
            input.failures.length > 0 ? "completed_with_errors" : "completed",
          completedAt: new Date(),
          recordsInserted: inserted,
          recordsUpdated: updated,
        })
        .where(eq(ingestionRun.id, run.id));
    });

    for (const entityId of candidateEntityIds) {
      await generateCandidatesForSource(entityId);
    }

    return {
      runId: run.id,
      status: input.failures.length > 0 ? "completed_with_errors" : "completed",
      received: input.receivedCount,
      inserted,
      updated,
      failed: input.failures.length,
      versionsCreated,
      metricsUpserted,
    };
  } catch (error) {
    await db
      .update(ingestionRun)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorSummary:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Unknown failure",
      })
      .where(eq(ingestionRun.id, run.id));
    throw error;
  }
}
