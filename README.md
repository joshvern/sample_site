# Signal Studio — Unified Content Intelligence

Signal Studio is a production-oriented seed application for resolving content
records from multiple systems into canonical identities and reporting unified
performance. It preserves source provenance and mapping history so analytics
never depend on raw title-string joins.

The core backbone is:

```text
source_entity → match_candidate → content_mapping
              → canonical content → canonical daily metrics → dashboard
```

The app includes a coherent read-only demo when no database is configured. Real
ingestion and resolution mutations require Postgres.

The deterministic seed includes 24 recognizable movies and series, 39
cross-platform source identities, eight source systems, three deliberately
ambiguous review cases, authority links for IMDb and TMDB identifiers, and 90
days of formula-generated metrics. See
[Sample data and provenance](docs/SAMPLE_DATA.md) for licensing boundaries and
fixture design.

## Architecture

```mermaid
flowchart LR
  Source[Source system] --> Run[Ingestion run]
  Run --> Entity[Source entity]
  Entity --> Version[Immutable versions]
  Entity --> Candidate[Match candidates]
  Candidate --> Decision[Historical mapping]
  Decision --> Content[Canonical content]
  Entity --> Raw[Source daily facts]
  Raw --> Aggregate[Canonical daily facts]
  Decision --> Aggregate
  Aggregate --> Dashboard[Dashboard and catalog]
```

```mermaid
erDiagram
  WORKSPACE ||--o{ SOURCE_SYSTEM : owns
  SOURCE_SYSTEM ||--o{ INGESTION_RUN : executes
  SOURCE_SYSTEM ||--o{ SOURCE_ENTITY : identifies
  SOURCE_ENTITY ||--o{ SOURCE_ENTITY_VERSION : versions
  CONTENT_TYPE ||--o{ CONTENT : classifies
  CONTENT ||--o{ CONTENT_TITLE : has
  CONTENT ||--o{ EXTERNAL_IDENTIFIER : has
  CONTENT ||--o{ CONTENT : contains
  SOURCE_ENTITY ||--o{ MATCH_CANDIDATE : proposes
  CONTENT ||--o{ MATCH_CANDIDATE : candidate
  SOURCE_ENTITY ||--o{ CONTENT_MAPPING : history
  CONTENT ||--o{ CONTENT_MAPPING : target
  SOURCE_ENTITY ||--o{ SOURCE_CONTENT_METRIC_DAILY : measures
  PLATFORM ||--o{ SOURCE_CONTENT_METRIC_DAILY : attributes
  CONTENT ||--o{ CONTENT_METRIC_DAILY : aggregates
```

The database uses logical `app`, `catalog`, `ingest`, `resolution`, and
`analytics` schemas. Complex SQL lives in a typed server query layer, domain
mutations live in transaction-aware services, and React components never access
the database directly.

More detail is in [Architecture](docs/ARCHITECTURE.md),
[Entity Resolution](docs/ENTITY_RESOLUTION.md), and
[Ingestion](docs/INGESTION.md).

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4 and shadcn/ui conventions
- Neon Postgres, `@neondatabase/serverless`, Drizzle ORM/migrations
- Zod and `csv-parse`
- Recharts
- Vitest, PostgreSQL integration tests, Playwright, and axe
- pnpm

## Local setup

Requirements: Node.js 22+, pnpm 10+, and either a Neon development branch or
Docker.

```bash
pnpm install
cp .env.example .env.local
```

### Neon development database

1. Create a Neon project and a development branch.
2. Copy its pooled connection string to `DATABASE_URL` in `.env.local`.
3. Apply and seed:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Local PostgreSQL

Docker is provided for migration and integration work:

```bash
docker compose up -d postgres
export DATABASE_URL=postgresql://content:content@127.0.0.1:54329/content_intelligence
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The application runtime is optimized for Neon. The integration suite uses the
standard PostgreSQL driver so the same migrations can be verified locally.

## Environment variables

| Variable              | Required | Purpose                                       |
| --------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`        | Mutating | Server-only pooled Postgres connection        |
| `NEXT_PUBLIC_APP_URL` | No       | Public origin; defaults to localhost          |
| `TEST_DATABASE_URL`   | Tests    | Isolated disposable integration-test database |

Never expose `DATABASE_URL` through a `NEXT_PUBLIC_` variable.

## Database workflow

```bash
pnpm db:generate   # generate SQL after schema changes
pnpm db:migrate    # apply committed migrations
pnpm db:seed       # repeatable deterministic demo data
pnpm db:push       # development-only schema synchronization
pnpm db:studio
```

Migrations are explicit release operations. They do not run during imports,
builds, page rendering, or serverless requests.

## CSV ingestion

Download [the example CSV](public/examples/content-metrics-example.csv) or use
the `/ingest` flow. Files are limited to 2 MiB and 5,000 rows. Each row may
contain:

```text
source_native_id, title, content_type, release_year, country_code,
language_code, platform, metric_date, views, watch_seconds, unique_viewers,
starts, completions, revenue_cents, external_id, external_id_namespace
```

Rows are validated independently. Valid rows are committed while failures are
recorded in ingestion-run metadata. Source entities upsert by
`source_system_id + source_native_id`; immutable versions are created only when
the stable payload checksum changes. Source facts upsert at:

```text
workspace + source entity + platform + date + source system
```

Large files should move to object storage and asynchronous workers rather than
expanding this synchronous route.

## Entity-resolution rules

Title normalization extracts—but does not forget—years and region qualifiers.
Candidate order is external identifier, exact title/year/type, compatible exact
title, then trigram similarity. Automatic acceptance requires a score of at
least `0.95`, no contradiction, a unique `0.05` lead, and no missing-year
same-title ambiguity.

Source records and canonical content have deliberately different lifecycles:
source entities preserve partner identity and payload history; canonical content
represents the product’s stable identity. Raw measurements remain authoritative.
Canonical facts are derived serving rows rebuilt through the current accepted
mapping.

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
TEST_DATABASE_URL=postgresql://... pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

## Vercel and Neon

See [Deployment](docs/DEPLOYMENT.md). In short:

- Production points to a production Neon branch.
- Vercel previews use isolated Neon preview branches.
- Migrate a branch explicitly before deploying code that requires the schema.
- Seed only development and preview branches.

## Current limitations

- One demo workspace and no sign-in UI.
- Small synchronous CSV ingestion only.
- Deterministic string/metadata matching; no enrichment or embeddings.
- Typed fixed metric set; no custom metric-expression builder.
- No background schedules, queues, exports, or row-level security.
- No table partitioning. Consider monthly metric-date partitions only after fact
  volume and query plans show sustained benefit (typically hundreds of millions
  of rows or operationally expensive retention).

## Roadmap

The next milestone is authenticated workspace membership and a production
ingestion worker. Later extensions can add entertainment metadata enrichment,
reviewed alias learning, embeddings, additional content relationships, sports
and live programming, geographic availability, scheduled feeds, exports, saved
dashboards, source data-quality policies, and resolution-accuracy monitoring.
