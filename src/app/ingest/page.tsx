import { getSources } from "@/db/queries/sources";
import { PageHeader } from "@/components/page-header";
import { CsvIngest } from "@/components/ingest/csv-ingest";

export const dynamic = "force-dynamic";

export default async function IngestPage() {
  const sources = await getSources();
  return (
    <>
      <PageHeader
        eyebrow="CSV ingestion"
        title="Bring in source records"
        description="Preview, validate, and ingest a small CSV while preserving stable source identity, immutable payload versions, and row-level failures."
      />
      <CsvIngest initialSources={sources} />
    </>
  );
}
