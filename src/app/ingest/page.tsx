import { getSources } from "@/db/queries/sources";
import { PageHeader } from "@/components/page-header";
import { CsvIngest } from "@/components/ingest/csv-ingest";
import { FileCheck2, Fingerprint, ShieldCheck } from "lucide-react";

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
      <section className="surface-grid relative mb-5 overflow-hidden rounded-2xl bg-[#0b1525] px-5 py-4 text-white sm:px-6">
        <div className="relative grid gap-4 sm:grid-cols-3">
          {[
            [FileCheck2, "Validate first", "Every row checked before write"],
            [Fingerprint, "Stable identity", "Native source IDs preserved"],
            [ShieldCheck, "Safe replay", "Normalized checksum idempotency"],
          ].map(([Icon, title, detail]) => {
            const StepIcon = Icon as typeof FileCheck2;
            return (
              <div key={String(title)} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-blue-300">
                  <StepIcon className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold">{String(title)}</p>
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    {String(detail)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <CsvIngest initialSources={sources} />
    </>
  );
}
