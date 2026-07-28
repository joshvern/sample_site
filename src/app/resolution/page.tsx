import { getResolutionQueue } from "@/db/queries/resolution";
import { PageHeader } from "@/components/page-header";
import { ReviewQueue } from "@/components/resolution/review-queue";
import { CheckCircle2, Scale, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResolutionPage() {
  const items = await getResolutionQueue();
  return (
    <>
      <PageHeader
        eyebrow="Human review"
        title="Resolution queue"
        description="Resolve ambiguous source records with interpretable evidence. Every decision is retained and affected metrics are rebuilt transactionally."
      />
      <section className="surface-grid relative mb-5 overflow-hidden rounded-2xl bg-[#0b1525] px-5 py-5 text-white sm:px-6">
        <div className="absolute -top-20 right-8 size-52 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
              <Scale className="size-3.5" /> Evidence-first resolution
            </div>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">
              Similarity alone never overrides a contradiction. Missing
              qualifiers and same-title collisions stay with a human reviewer.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <p className="text-xl font-bold">{items.length}</p>
            <p className="text-[8px] font-bold tracking-wider text-slate-500 uppercase">
              Waiting
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06] px-4 py-3 text-[10px] font-bold text-emerald-300">
            <ShieldCheck className="size-4" />
            History protected
            <CheckCircle2 className="size-3.5" />
          </div>
        </div>
      </section>
      <ReviewQueue initialItems={items} />
    </>
  );
}
