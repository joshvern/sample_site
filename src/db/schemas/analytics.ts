import {
  bigint,
  date,
  index,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "./app";
import { content, platform } from "./catalog";
import { ingestionRun, sourceEntity, sourceSystem } from "./ingest";

export const analyticsSchema = pgSchema("analytics");

const metrics = {
  views: bigint("views", { mode: "number" }).default(0).notNull(),
  watchSeconds: bigint("watch_seconds", { mode: "number" })
    .default(0)
    .notNull(),
  uniqueViewers: bigint("unique_viewers", { mode: "number" })
    .default(0)
    .notNull(),
  starts: bigint("starts", { mode: "number" }).default(0).notNull(),
  completions: bigint("completions", { mode: "number" }).default(0).notNull(),
  revenueCents: bigint("revenue_cents", { mode: "number" })
    .default(0)
    .notNull(),
};

export const sourceContentMetricDaily = analyticsSchema.table(
  "source_content_metric_daily",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id),
    sourceEntityId: uuid("source_entity_id")
      .notNull()
      .references(() => sourceEntity.id),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platform.id),
    metricDate: date("metric_date", { mode: "string" }).notNull(),
    ...metrics,
    sourceSystemId: uuid("source_system_id")
      .notNull()
      .references(() => sourceSystem.id),
    ingestionRunId: uuid("ingestion_run_id").references(() => ingestionRun.id),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "source_content_metric_daily_pk",
      columns: [
        table.workspaceId,
        table.sourceEntityId,
        table.platformId,
        table.metricDate,
        table.sourceSystemId,
      ],
    }),
    index("source_metric_workspace_date_content_idx").on(
      table.workspaceId,
      table.metricDate,
      table.sourceEntityId,
    ),
    index("source_metric_workspace_platform_date_idx").on(
      table.workspaceId,
      table.platformId,
      table.metricDate,
    ),
  ],
);

export const contentMetricDaily = analyticsSchema.table(
  "content_metric_daily",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platform.id),
    metricDate: date("metric_date", { mode: "string" }).notNull(),
    ...metrics,
    mappingVersion: text("mapping_version"),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "content_metric_daily_pk",
      columns: [
        table.workspaceId,
        table.contentId,
        table.platformId,
        table.metricDate,
      ],
    }),
    index("content_metric_workspace_content_date_idx").on(
      table.workspaceId,
      table.contentId,
      table.metricDate,
    ),
    index("content_metric_workspace_date_content_idx").on(
      table.workspaceId,
      table.metricDate,
      table.contentId,
    ),
    index("content_metric_workspace_platform_date_idx").on(
      table.workspaceId,
      table.platformId,
      table.metricDate,
    ),
  ],
);

export type ContentMetricDaily = typeof contentMetricDaily.$inferSelect;
