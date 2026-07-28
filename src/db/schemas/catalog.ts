import { sql } from "drizzle-orm";
import {
  AnyPgColumn,
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

export const catalogSchema = pgSchema("catalog");
export const titleType = catalogSchema.enum("title_type", [
  "official",
  "alias",
  "localized",
  "source",
  "working",
]);

export const contentType = catalogSchema.table(
  "content_type",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("content_type_key_uidx").on(table.key)],
);

export const content = catalogSchema.table(
  "content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentTypeId: uuid("content_type_id")
      .notNull()
      .references(() => contentType.id),
    parentContentId: uuid("parent_content_id").references(
      (): AnyPgColumn => content.id,
      { onDelete: "set null" },
    ),
    displayTitle: text("display_title").notNull(),
    originalTitle: text("original_title"),
    releaseYear: integer("release_year"),
    originalLanguage: text("original_language"),
    originCountry: text("origin_country"),
    runtimeSeconds: integer("runtime_seconds"),
    status: text("status"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("content_type_idx").on(table.contentTypeId),
    index("content_parent_idx").on(table.parentContentId),
    index("content_release_year_idx").on(table.releaseYear),
    index("content_display_title_idx").on(table.displayTitle),
  ],
);

export const contentTitle = catalogSchema.table(
  "content_title",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    normalizedTitle: text("normalized_title").notNull(),
    normalizationVersion: text("normalization_version").notNull(),
    titleType: titleType("title_type").notNull(),
    languageCode: text("language_code"),
    countryCode: text("country_code"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("content_title_normalized_idx").on(table.normalizedTitle),
    index("content_title_trgm_idx").using(
      "gin",
      table.normalizedTitle.op("gin_trgm_ops"),
    ),
    uniqueIndex("content_title_primary_locale_uidx")
      .on(
        table.contentId,
        sql`coalesce(${table.languageCode}, '')`,
        sql`coalesce(${table.countryCode}, '')`,
      )
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const externalIdentifier = catalogSchema.table(
  "external_identifier",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    namespace: text("namespace").notNull(),
    externalId: text("external_id").notNull(),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("external_identifier_namespace_id_uidx").on(
      table.namespace,
      table.externalId,
    ),
    index("external_identifier_content_idx").on(table.contentId),
  ],
);

export const platform = catalogSchema.table(
  "platform",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    platformType: text("platform_type").notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("platform_slug_uidx").on(table.slug)],
);

export type Content = typeof content.$inferSelect;
export type ContentTitle = typeof contentTitle.$inferSelect;
export type Platform = typeof platform.$inferSelect;
