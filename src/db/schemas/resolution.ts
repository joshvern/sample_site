import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "./app";
import { content } from "./catalog";
import { sourceEntity } from "./ingest";

export const resolutionSchema = pgSchema("resolution");
export const candidateStatus = resolutionSchema.enum("candidate_status", [
  "pending",
  "accepted",
  "rejected",
  "superseded",
]);
export const candidateMethod = resolutionSchema.enum("candidate_method", [
  "external_id",
  "exact_title_year_type",
  "exact_normalized_title",
  "trigram",
  "manual",
]);
export const decisionMethod = resolutionSchema.enum("decision_method", [
  "automatic",
  "manual",
  "external_id",
  "seed",
]);
export const decisionStatus = resolutionSchema.enum("decision_status", [
  "accepted",
  "rejected",
  "superseded",
]);

export const matchCandidate = resolutionSchema.table(
  "match_candidate",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id),
    sourceEntityId: uuid("source_entity_id")
      .notNull()
      .references(() => sourceEntity.id),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id),
    score: numeric("score", { precision: 5, scale: 4 }).notNull(),
    method: candidateMethod("method").notNull(),
    modelVersion: text("model_version").notNull(),
    normalizationVersion: text("normalization_version").notNull(),
    features: jsonb("features").$type<Record<string, unknown>>().notNull(),
    status: candidateStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("match_candidate_entity_content_model_uidx").on(
      table.sourceEntityId,
      table.contentId,
      table.modelVersion,
    ),
    index("match_candidate_review_idx").on(
      table.workspaceId,
      table.status,
      table.score,
    ),
  ],
);

export const contentMapping = resolutionSchema.table(
  "content_mapping",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id),
    sourceEntityId: uuid("source_entity_id")
      .notNull()
      .references(() => sourceEntity.id),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id),
    decisionMethod: decisionMethod("decision_method").notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
    decisionStatus: decisionStatus("decision_status").notNull(),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true })
      .defaultNow()
      .notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_mapping_one_active_accepted_uidx")
      .on(table.sourceEntityId)
      .where(
        sql`${table.decisionStatus} = 'accepted' and ${table.validTo} is null`,
      ),
    index("content_mapping_workspace_status_confidence_idx").on(
      table.workspaceId,
      table.decisionStatus,
      table.confidence,
    ),
    index("content_mapping_source_active_idx").on(
      table.sourceEntityId,
      table.validTo,
    ),
  ],
);

export type MatchCandidate = typeof matchCandidate.$inferSelect;
export type ContentMapping = typeof contentMapping.$inferSelect;
