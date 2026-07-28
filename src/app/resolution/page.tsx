import { getResolutionQueue } from "@/db/queries/resolution";
import { PageHeader } from "@/components/page-header";
import { ReviewQueue } from "@/components/resolution/review-queue";

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
      <ReviewQueue initialItems={items} />
    </>
  );
}
