CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE SCHEMA "analytics";
--> statement-breakpoint
CREATE SCHEMA "app";
--> statement-breakpoint
CREATE SCHEMA "catalog";
--> statement-breakpoint
CREATE SCHEMA "ingest";
--> statement-breakpoint
CREATE SCHEMA "resolution";
--> statement-breakpoint
CREATE TYPE "catalog"."title_type" AS ENUM('official', 'alias', 'localized', 'source', 'working');--> statement-breakpoint
CREATE TYPE "ingest"."ingestion_status" AS ENUM('pending', 'processing', 'completed', 'completed_with_errors', 'failed');--> statement-breakpoint
CREATE TYPE "ingest"."source_type" AS ENUM('csv_upload', 'api', 'database', 'manual', 'partner_feed');--> statement-breakpoint
CREATE TYPE "resolution"."candidate_method" AS ENUM('external_id', 'exact_title_year_type', 'exact_normalized_title', 'trigram', 'manual');--> statement-breakpoint
CREATE TYPE "resolution"."candidate_status" AS ENUM('pending', 'accepted', 'rejected', 'superseded');--> statement-breakpoint
CREATE TYPE "resolution"."decision_method" AS ENUM('automatic', 'manual', 'external_id', 'seed');--> statement-breakpoint
CREATE TYPE "resolution"."decision_status" AS ENUM('accepted', 'rejected', 'superseded');--> statement-breakpoint
CREATE TABLE "analytics"."content_metric_daily" (
	"workspace_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"views" bigint DEFAULT 0 NOT NULL,
	"watch_seconds" bigint DEFAULT 0 NOT NULL,
	"unique_viewers" bigint DEFAULT 0 NOT NULL,
	"starts" bigint DEFAULT 0 NOT NULL,
	"completions" bigint DEFAULT 0 NOT NULL,
	"revenue_cents" bigint DEFAULT 0 NOT NULL,
	"mapping_version" text,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_metric_daily_pk" PRIMARY KEY("workspace_id","content_id","platform_id","metric_date")
);
--> statement-breakpoint
CREATE TABLE "analytics"."source_content_metric_daily" (
	"workspace_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"views" bigint DEFAULT 0 NOT NULL,
	"watch_seconds" bigint DEFAULT 0 NOT NULL,
	"unique_viewers" bigint DEFAULT 0 NOT NULL,
	"starts" bigint DEFAULT 0 NOT NULL,
	"completions" bigint DEFAULT 0 NOT NULL,
	"revenue_cents" bigint DEFAULT 0 NOT NULL,
	"source_system_id" uuid NOT NULL,
	"ingestion_run_id" uuid,
	"observed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_content_metric_daily_pk" PRIMARY KEY("workspace_id","source_entity_id","platform_id","metric_date","source_system_id")
);
--> statement-breakpoint
CREATE TABLE "app"."workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type_id" uuid NOT NULL,
	"parent_content_id" uuid,
	"display_title" text NOT NULL,
	"original_title" text,
	"release_year" integer,
	"original_language" text,
	"origin_country" text,
	"runtime_seconds" integer,
	"status" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."content_title" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"title" text NOT NULL,
	"normalized_title" text NOT NULL,
	"normalization_version" text NOT NULL,
	"title_type" "catalog"."title_type" NOT NULL,
	"language_code" text,
	"country_code" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."content_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."external_identifier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"namespace" text NOT NULL,
	"external_id" text NOT NULL,
	"external_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."platform" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"platform_type" text NOT NULL,
	"website_url" text,
	"logo_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest"."ingestion_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system_id" uuid NOT NULL,
	"status" "ingest"."ingestion_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"records_received" integer DEFAULT 0 NOT NULL,
	"records_inserted" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"error_summary" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest"."source_entity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_system_id" uuid NOT NULL,
	"source_native_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"raw_title" text NOT NULL,
	"normalized_title" text NOT NULL,
	"release_year" integer,
	"country_code" text,
	"language_code" text,
	"external_identifiers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest"."source_entity_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"ingestion_run_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_checksum" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest"."source_system" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"source_type" "ingest"."source_type" NOT NULL,
	"platform_id" uuid,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resolution"."content_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"decision_method" "resolution"."decision_method" NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"decision_status" "resolution"."decision_status" NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resolution"."match_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"score" numeric(5, 4) NOT NULL,
	"method" "resolution"."candidate_method" NOT NULL,
	"model_version" text NOT NULL,
	"normalization_version" text NOT NULL,
	"features" jsonb NOT NULL,
	"status" "resolution"."candidate_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evaluated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "analytics"."content_metric_daily" ADD CONSTRAINT "content_metric_daily_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "app"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."content_metric_daily" ADD CONSTRAINT "content_metric_daily_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "catalog"."content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."content_metric_daily" ADD CONSTRAINT "content_metric_daily_platform_id_platform_id_fk" FOREIGN KEY ("platform_id") REFERENCES "catalog"."platform"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."source_content_metric_daily" ADD CONSTRAINT "source_content_metric_daily_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "app"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."source_content_metric_daily" ADD CONSTRAINT "source_content_metric_daily_source_entity_id_source_entity_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "ingest"."source_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."source_content_metric_daily" ADD CONSTRAINT "source_content_metric_daily_platform_id_platform_id_fk" FOREIGN KEY ("platform_id") REFERENCES "catalog"."platform"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."source_content_metric_daily" ADD CONSTRAINT "source_content_metric_daily_source_system_id_source_system_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "ingest"."source_system"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."source_content_metric_daily" ADD CONSTRAINT "source_content_metric_daily_ingestion_run_id_ingestion_run_id_fk" FOREIGN KEY ("ingestion_run_id") REFERENCES "ingest"."ingestion_run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog"."content" ADD CONSTRAINT "content_content_type_id_content_type_id_fk" FOREIGN KEY ("content_type_id") REFERENCES "catalog"."content_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog"."content" ADD CONSTRAINT "content_parent_content_id_content_id_fk" FOREIGN KEY ("parent_content_id") REFERENCES "catalog"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog"."content_title" ADD CONSTRAINT "content_title_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "catalog"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog"."external_identifier" ADD CONSTRAINT "external_identifier_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "catalog"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."ingestion_run" ADD CONSTRAINT "ingestion_run_source_system_id_source_system_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "ingest"."source_system"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."source_entity" ADD CONSTRAINT "source_entity_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "app"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."source_entity" ADD CONSTRAINT "source_entity_source_system_id_source_system_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "ingest"."source_system"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."source_entity_version" ADD CONSTRAINT "source_entity_version_source_entity_id_source_entity_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "ingest"."source_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."source_entity_version" ADD CONSTRAINT "source_entity_version_ingestion_run_id_ingestion_run_id_fk" FOREIGN KEY ("ingestion_run_id") REFERENCES "ingest"."ingestion_run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."source_system" ADD CONSTRAINT "source_system_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "app"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest"."source_system" ADD CONSTRAINT "source_system_platform_id_platform_id_fk" FOREIGN KEY ("platform_id") REFERENCES "catalog"."platform"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution"."content_mapping" ADD CONSTRAINT "content_mapping_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "app"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution"."content_mapping" ADD CONSTRAINT "content_mapping_source_entity_id_source_entity_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "ingest"."source_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution"."content_mapping" ADD CONSTRAINT "content_mapping_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "catalog"."content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution"."match_candidate" ADD CONSTRAINT "match_candidate_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "app"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution"."match_candidate" ADD CONSTRAINT "match_candidate_source_entity_id_source_entity_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "ingest"."source_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution"."match_candidate" ADD CONSTRAINT "match_candidate_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "catalog"."content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_metric_workspace_content_date_idx" ON "analytics"."content_metric_daily" USING btree ("workspace_id","content_id","metric_date");--> statement-breakpoint
CREATE INDEX "content_metric_workspace_date_content_idx" ON "analytics"."content_metric_daily" USING btree ("workspace_id","metric_date","content_id");--> statement-breakpoint
CREATE INDEX "content_metric_workspace_platform_date_idx" ON "analytics"."content_metric_daily" USING btree ("workspace_id","platform_id","metric_date");--> statement-breakpoint
CREATE INDEX "source_metric_workspace_date_content_idx" ON "analytics"."source_content_metric_daily" USING btree ("workspace_id","metric_date","source_entity_id");--> statement-breakpoint
CREATE INDEX "source_metric_workspace_platform_date_idx" ON "analytics"."source_content_metric_daily" USING btree ("workspace_id","platform_id","metric_date");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_uidx" ON "app"."workspace" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_type_idx" ON "catalog"."content" USING btree ("content_type_id");--> statement-breakpoint
CREATE INDEX "content_parent_idx" ON "catalog"."content" USING btree ("parent_content_id");--> statement-breakpoint
CREATE INDEX "content_release_year_idx" ON "catalog"."content" USING btree ("release_year");--> statement-breakpoint
CREATE INDEX "content_display_title_idx" ON "catalog"."content" USING btree ("display_title");--> statement-breakpoint
CREATE INDEX "content_title_normalized_idx" ON "catalog"."content_title" USING btree ("normalized_title");--> statement-breakpoint
CREATE INDEX "content_title_trgm_idx" ON "catalog"."content_title" USING gin ("normalized_title" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "content_title_primary_locale_uidx" ON "catalog"."content_title" USING btree ("content_id",coalesce("language_code", ''),coalesce("country_code", '')) WHERE "catalog"."content_title"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "content_type_key_uidx" ON "catalog"."content_type" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "external_identifier_namespace_id_uidx" ON "catalog"."external_identifier" USING btree ("namespace","external_id");--> statement-breakpoint
CREATE INDEX "external_identifier_content_idx" ON "catalog"."external_identifier" USING btree ("content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_slug_uidx" ON "catalog"."platform" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ingestion_run_source_started_idx" ON "ingest"."ingestion_run" USING btree ("source_system_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "source_entity_system_native_uidx" ON "ingest"."source_entity" USING btree ("source_system_id","source_native_id");--> statement-breakpoint
CREATE INDEX "source_entity_workspace_title_idx" ON "ingest"."source_entity" USING btree ("workspace_id","normalized_title");--> statement-breakpoint
CREATE UNIQUE INDEX "source_entity_version_checksum_uidx" ON "ingest"."source_entity_version" USING btree ("source_entity_id","payload_checksum");--> statement-breakpoint
CREATE INDEX "source_entity_version_entity_idx" ON "ingest"."source_entity_version" USING btree ("source_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_system_workspace_name_uidx" ON "ingest"."source_system" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "source_system_workspace_idx" ON "ingest"."source_system" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_mapping_one_active_accepted_uidx" ON "resolution"."content_mapping" USING btree ("source_entity_id") WHERE "resolution"."content_mapping"."decision_status" = 'accepted' and "resolution"."content_mapping"."valid_to" is null;--> statement-breakpoint
CREATE INDEX "content_mapping_workspace_status_confidence_idx" ON "resolution"."content_mapping" USING btree ("workspace_id","decision_status","confidence");--> statement-breakpoint
CREATE INDEX "content_mapping_source_active_idx" ON "resolution"."content_mapping" USING btree ("source_entity_id","valid_to");--> statement-breakpoint
CREATE UNIQUE INDEX "match_candidate_entity_content_model_uidx" ON "resolution"."match_candidate" USING btree ("source_entity_id","content_id","model_version");--> statement-breakpoint
CREATE INDEX "match_candidate_review_idx" ON "resolution"."match_candidate" USING btree ("workspace_id","status","score");
