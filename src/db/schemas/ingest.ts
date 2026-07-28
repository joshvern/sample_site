import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "./app";
import { platform } from "./catalog";

export const ingestSchema = pgSchema("ingest");
export const sourceType = ingestSchema.enum("source_type", [
  "csv_upload",
  "api",
  "database",
  "manual",
  "partner_feed",
]);
export const ingestionStatus = ingestSchema.enum("ingestion_status", [
  "pending",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
]);

export const sourceSystem = ingestSchema.table(
  "source_system",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id),
    name: text("name").notNull(),
    sourceType: sourceType("source_type").notNull(),
    platformId: uuid("platform_id").references(() => platform.id),
    configuration: jsonb("configuration")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("source_system_workspace_name_uidx").on(
      table.workspaceId,
      table.name,
    ),
    index("source_system_workspace_idx").on(table.workspaceId),
  ],
);

export const ingestionRun = ingestSchema.table(
  "ingestion_run",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceSystemId: uuid("source_system_id")
      .notNull()
      .references(() => sourceSystem.id),
    status: ingestionStatus("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    recordsReceived: integer("records_received").default(0).notNull(),
    recordsInserted: integer("records_inserted").default(0).notNull(),
    recordsUpdated: integer("records_updated").default(0).notNull(),
    recordsFailed: integer("records_failed").default(0).notNull(),
    errorSummary: text("error_summary"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ingestion_run_source_started_idx").on(
      table.sourceSystemId,
      table.startedAt,
    ),
  ],
);

export const sourceEntity = ingestSchema.table(
  "source_entity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id),
    sourceSystemId: uuid("source_system_id")
      .notNull()
      .references(() => sourceSystem.id),
    sourceNativeId: text("source_native_id").notNull(),
    entityType: text("entity_type").notNull(),
    rawTitle: text("raw_title").notNull(),
    normalizedTitle: text("normalized_title").notNull(),
    releaseYear: integer("release_year"),
    countryCode: text("country_code"),
    languageCode: text("language_code"),
    externalIdentifiers: jsonb("external_identifiers")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    currentPayload: jsonb("current_payload")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("source_entity_system_native_uidx").on(
      table.sourceSystemId,
      table.sourceNativeId,
    ),
    index("source_entity_workspace_title_idx").on(
      table.workspaceId,
      table.normalizedTitle,
    ),
  ],
);

export const sourceEntityVersion = ingestSchema.table(
  "source_entity_version",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceEntityId: uuid("source_entity_id")
      .notNull()
      .references(() => sourceEntity.id),
    ingestionRunId: uuid("ingestion_run_id")
      .notNull()
      .references(() => ingestionRun.id),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    payloadChecksum: text("payload_checksum").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("source_entity_version_checksum_uidx").on(
      table.sourceEntityId,
      table.payloadChecksum,
    ),
    index("source_entity_version_entity_idx").on(table.sourceEntityId),
  ],
);

export type SourceSystem = typeof sourceSystem.$inferSelect;
export type SourceEntity = typeof sourceEntity.$inferSelect;
export type IngestionRun = typeof ingestionRun.$inferSelect;
