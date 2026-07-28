"use client";

import {
  ArrowRight,
  Check,
  CircleAlert,
  ExternalLink,
  Plus,
  Search,
  SkipForward,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { ResolutionItem } from "@/types/domain";
import {
  acceptCandidateAction,
  createCanonicalFromSourceAction,
  mapSourceEntityAction,
  rejectCandidateAction,
} from "@/actions/mappings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ReviewQueue({
  initialItems,
}: {
  initialItems: ResolutionItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [alternateReviewId, setAlternateReviewId] = useState<string | null>(
    null,
  );
  const [alternateContentId, setAlternateContentId] = useState("");
  const [isPending, startTransition] = useTransition();

  function decide(
    review: ResolutionItem,
    candidateId: string,
    action: "accept" | "reject",
  ) {
    setMessage(null);
    startTransition(async () => {
      const result =
        action === "accept"
          ? await acceptCandidateAction(candidateId)
          : await rejectCandidateAction(candidateId);
      if (result.ok) {
        setItems((current) => current.filter((item) => item.id !== review.id));
        setMessage(
          action === "accept"
            ? "Candidate accepted and canonical aggregates refreshed."
            : "Candidate rejected. The decision was preserved in history.",
        );
      } else setMessage(result.error.message);
    });
  }

  function createNew(review: ResolutionItem) {
    setMessage(null);
    startTransition(async () => {
      const result = await createCanonicalFromSourceAction(
        review.sourceEntityId,
      );
      if (result.ok) {
        setItems((current) => current.filter((item) => item.id !== review.id));
        setMessage("Canonical content created and source record mapped.");
      } else setMessage(result.error.message);
    });
  }

  function mapAnother(review: ResolutionItem) {
    setMessage(null);
    startTransition(async () => {
      const result = await mapSourceEntityAction({
        sourceEntityId: review.sourceEntityId,
        contentId: alternateContentId,
      });
      if (result.ok) {
        setItems((current) => current.filter((item) => item.id !== review.id));
        setAlternateReviewId(null);
        setAlternateContentId("");
        setMessage("Source record mapped to the selected canonical content.");
      } else setMessage(result.error.message);
    });
  }

  if (items.length === 0) {
    return (
      <Card className="py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Check className="size-6" />
        </span>
        <h2 className="mt-4 font-bold text-slate-900">Review queue is clear</h2>
        <p className="mt-1 text-sm text-slate-500">
          New ambiguous records will appear here after ingestion.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {message && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800"
        >
          <CircleAlert className="size-4" /> {message}
        </div>
      )}
      {items.map((review, reviewIndex) => (
        <Card key={review.id} className="overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold tracking-[0.16em] text-[#335cff] uppercase">
                    Review {reviewIndex + 1} of {items.length}
                  </span>
                  <Badge className="border-amber-100 bg-amber-50 text-amber-700">
                    Ambiguous
                  </Badge>
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                  {review.rawTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Source record from {review.sourceSystem}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[
                  ["Platform", review.platform],
                  ["Type", review.contentType],
                  ["Year", review.releaseYear ?? "Missing"],
                  ["Country", review.country ?? "Missing"],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="min-w-24 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5"
                  >
                    <dt className="text-[8px] font-bold tracking-wide text-slate-400 uppercase">
                      {label}
                    </dt>
                    <dd className="mt-1 text-[11px] font-bold text-slate-700 capitalize">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="mb-3 text-[9px] font-bold tracking-[0.14em] text-slate-400 uppercase">
              Candidate matches
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {review.candidates.map((candidate, candidateIndex) => (
                <div
                  key={candidate.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(51,92,255,.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`poster-grain flex h-14 w-10 shrink-0 items-end rounded-lg p-1.5 text-[7px] leading-tight font-black tracking-wide text-white uppercase ${
                          candidateIndex % 2 === 0
                            ? "bg-[#335cff]"
                            : "bg-[#7c3aed]"
                        }`}
                      >
                        {candidate.title.slice(0, 8)}
                      </span>
                      <div>
                        <Link
                          href={`/content/${candidate.contentId}`}
                          className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-[#335cff]"
                        >
                          {candidate.title}
                          <ExternalLink className="size-3" />
                        </Link>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {candidate.descriptor}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                        {(candidate.score * 100).toFixed(0)}%
                      </p>
                      <p className="text-[8px] font-bold tracking-wide text-slate-400 uppercase">
                        Match score
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#335cff] to-[#8ca4ff]"
                      style={{ width: `${candidate.score * 100}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Feature
                      label="Title"
                      value={`${(candidate.features.titleSimilarity * 100).toFixed(0)}%`}
                      state="match"
                    />
                    <Feature
                      label="Year"
                      value={
                        candidate.features.yearMatch == null
                          ? "Missing"
                          : candidate.features.yearMatch
                            ? "Match"
                            : "Conflict"
                      }
                      state={
                        candidate.features.yearMatch == null
                          ? "missing"
                          : candidate.features.yearMatch
                            ? "match"
                            : "conflict"
                      }
                    />
                    <Feature
                      label="Type"
                      value={
                        candidate.features.typeMatch == null
                          ? "Missing"
                          : candidate.features.typeMatch
                            ? "Match"
                            : "Conflict"
                      }
                      state={candidate.features.typeMatch ? "match" : "missing"}
                    />
                    <Feature
                      label="Country"
                      value={
                        candidate.features.countryMatch == null
                          ? "Missing"
                          : candidate.features.countryMatch
                            ? "Match"
                            : "Conflict"
                      }
                      state={
                        candidate.features.countryMatch == null
                          ? "missing"
                          : candidate.features.countryMatch
                            ? "match"
                            : "conflict"
                      }
                    />
                  </div>
                  <p className="mt-3 text-[9px] font-semibold text-slate-400 capitalize">
                    Method: {candidate.method}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => decide(review, candidate.id, "accept")}
                    >
                      <Check className="size-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => decide(review, candidate.id, "reject")}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={`/content?q=${encodeURIComponent(review.rawTitle)}`}
                >
                  <Search className="size-3.5" /> Search catalog
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setAlternateReviewId((current) =>
                    current === review.id ? null : review.id,
                  )
                }
              >
                <ArrowRight className="size-3.5" /> Map another
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending}
                onClick={() => createNew(review)}
              >
                <Plus className="size-3.5" /> Create canonical content
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  setItems((current) =>
                    current.filter((item) => item.id !== review.id),
                  )
                }
              >
                <SkipForward className="size-3.5" /> Skip for later
              </Button>
            </div>
            {alternateReviewId === review.id && (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-end">
                <label className="flex-1">
                  <span className="text-[10px] font-bold tracking-wide text-blue-700 uppercase">
                    Canonical content ID
                  </span>
                  <input
                    value={alternateContentId}
                    onChange={(event) =>
                      setAlternateContentId(event.target.value)
                    }
                    placeholder="Paste a UUID from the catalog"
                    className="mt-1 h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm text-slate-700"
                  />
                </label>
                <Button
                  size="sm"
                  disabled={isPending || alternateContentId.length !== 36}
                  onClick={() => mapAnother(review)}
                >
                  Confirm mapping
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Feature({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: "match" | "missing" | "conflict";
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2.5">
      <p className="text-[8px] font-bold tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-xs font-bold ${
          state === "match"
            ? "text-emerald-700"
            : state === "conflict"
              ? "text-red-700"
              : "text-amber-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
