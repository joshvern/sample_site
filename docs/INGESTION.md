# CSV Ingestion

## Flow

1. Select or create a source system.
2. Upload a CSV no larger than 2 MiB or 5,000 data rows.
3. Infer and edit the mapping from CSV headers to supported fields.
4. Preview the first 20 mapped rows and all validation failures.
5. Submit the same file and mapping to the ingestion endpoint.
6. Upsert valid source entities and metrics, insert changed versions, and
   generate candidates.
7. Complete the ingestion run with inserted, updated, and failed counts.

Preview does not write data. Both preview and ingestion parse and validate on
the server, so the client preview cannot bypass enforcement.

## Idempotency

- Stable source identity: `(source_system_id, source_native_id)`.
- Immutable version identity: `(source_entity_id, payload_checksum)`.
- Daily fact grain: `(workspace_id, source_entity_id, platform_id, metric_date,
source_system_id)`.

Re-ingesting the same row updates `last_seen_at` but does not duplicate a source
entity, version, or metric. A changed normalized payload creates one additional
version. Metric upserts replace the observation at their source grain rather
than adding it.

## Failures

Zod validates rows independently. Invalid rows are excluded and their original
input, row number, and issues are saved in ingestion-run metadata. Unexpected
database failures mark the run failed with a bounded diagnostic summary; secret
values are never returned.

## Scaling path

The synchronous MVP is for demonstrations and small operations. Larger files
should be uploaded to object storage, registered as an ingestion run, and
processed in chunked idempotent background jobs. The source entity, version,
metric, and candidate contracts do not need to change for that evolution.
