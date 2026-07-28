# Architecture

## Boundaries

Signal Studio is one Next.js application with one Postgres database. It is
intentionally not split into microservices. React Server Components call typed
query modules; Server Actions and ingestion Route Handlers call domain services.
Only the server imports the database client.

```text
App Router UI
  ├── typed query layer ───────────────┐
  ├── mapping Server Actions ─────┐    │
  └── ingestion Route Handlers ───┼────┼── Postgres
                                  │    │
Domain services                   │    │
  normalization → matching → mapping → aggregation
```

## Database schemas

- `app`: workspaces and future configuration/membership.
- `catalog`: canonical content, types, titles, identifiers, and platforms.
- `ingest`: source systems, runs, stable entities, and immutable observations.
- `resolution`: scored candidates and effective-dated mapping decisions.
- `analytics`: authoritative source facts and derived canonical facts.

Canonical content is globally modeled in this first version; operational
records, decisions, and metrics are workspace-scoped. The central workspace
helper is the future authentication seam.

## Important invariants

1. Titles are attributes, never identifiers.
2. A source entity is unique inside its source system.
3. Payload versions are unique by stable SHA-256 checksum.
4. One source entity may have only one active accepted mapping.
5. Reassignment closes the old validity period and inserts a new row.
6. Source facts never join to canonical facts by title.
7. Canonical metrics are fully reproducible from source facts plus active maps.
8. Mapping and affected aggregate refresh happen in one transaction.

## Query and transaction strategy

The Neon WebSocket/Pool driver supports multi-statement transactions needed by
mapping changes. Dashboard and catalog queries aggregate in SQL rather than
loading raw facts into application memory. Catalog queries pre-group platforms,
mappings, aliases, and metrics to prevent N+1 reads.

The application supplies coherent read-only demo results when `DATABASE_URL` is
absent, allowing UI evaluation and production builds without secrets. Mutation
routes fail safely and explicitly in that mode.

## Performance

Indexes cover title search, source identity, active mapping lookup, review
queues, and the main workspace/date/content/platform metric access patterns.
`pg_trgm` supplies fuzzy candidate retrieval.

Partitioning is deliberately absent. Introduce monthly metric-date partitions
when data volume, retention operations, and measured query plans justify the
additional operational complexity—not simply because facts are time-series.
