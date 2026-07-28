import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDotDashed,
  Clock3,
  Database,
  Eye,
  Film,
  Layers3,
  RadioTower,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/db/queries/dashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  PlatformChart,
  QualityChart,
  ViewsChart,
} from "@/components/dashboard/charts";
import { formatCompactNumber, formatHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const kpis = [
    {
      label: "Canonical titles",
      value: data.kpis.canonicalContent.toLocaleString(),
      detail: `${data.kpis.sourceEntities} source identities`,
      icon: Film,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Resolution rate",
      value: `${data.kpis.matchRate.toFixed(1)}%`,
      detail: `${data.kpis.pendingReview} awaiting review`,
      icon: Layers3,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active sources",
      value: data.kpis.activeSources.toLocaleString(),
      detail: `Fresh through ${data.kpis.latestMetricDate}`,
      icon: RadioTower,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Watch time",
      value: formatCompactNumber(data.kpis.watchSeconds / 3600),
      detail: "Hours across selected period",
      icon: Timer,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Unified performance"
        title="Content intelligence"
        description="A live operating view of catalog identity, resolution quality, and performance across every connected platform."
        actions={
          <Link
            href="/ingest"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#335cff] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(51,92,255,.18)] hover:bg-[#294ee7]"
          >
            Ingest data <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <section className="surface-grid relative mb-5 overflow-hidden rounded-[22px] bg-[#0b1525] text-white shadow-[0_18px_50px_rgba(15,23,42,.16)]">
        <div className="absolute -top-28 right-[-4rem] size-80 rounded-full bg-blue-500/20 blur-[80px]" />
        <div className="relative grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-blue-300 uppercase">
              <Sparkles className="size-3.5" />
              90-day operating brief
            </div>
            <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-2">
              <p className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {formatCompactNumber(data.kpis.totalViews)}
              </p>
              <div className="mb-1.5">
                <p className="text-xs font-bold text-white">Canonical views</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                  <TrendingUp className="size-3" /> source facts reconciled
                  daily
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-slate-400">
              {data.kpis.sourceEntities} source identities now roll into{" "}
              {data.kpis.canonicalContent} canonical titles without losing
              lineage, mapping evidence, or historical validity.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/resolution"
              className="group rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <CircleDotDashed className="size-4.5" />
                </span>
                <ArrowRight className="size-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </div>
              <p className="mt-4 text-2xl font-bold">
                {data.kpis.pendingReview}
              </p>
              <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Decisions waiting
              </p>
            </Link>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <CheckCircle2 className="size-4.5" />
              </span>
              <p className="mt-4 text-2xl font-bold">
                {data.kpis.matchRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Catalog resolved
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Key metrics"
      >
        {kpis.map((metric) => (
          <Card key={metric.label} className="group p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.08em] text-slate-600 uppercase">
                  {metric.label}
                </p>
                <p className="mt-2.5 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {metric.detail}
                </p>
              </div>
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${metric.tone}`}
              >
                <metric.icon className="size-4.5" />
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <h2 className="font-bold tracking-tight text-slate-950">
                Views over time
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Canonicalized daily views across all platforms
              </p>
            </div>
            <Badge className="border-blue-100 bg-blue-50 text-blue-700">
              <CalendarDays className="mr-1 size-3" /> Last 90 days
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <ViewsChart data={data.dailyViews} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-bold tracking-tight text-slate-950">
              Platform contribution
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Views attributed at canonical metric grain
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <PlatformChart data={data.platformPerformance} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <h2 className="font-bold tracking-tight text-slate-950">
                Leading content
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Performance rolled up under canonical identities
              </p>
            </div>
            <Link
              href="/content"
              className="flex items-center gap-1 text-xs font-bold text-[#335cff]"
            >
              Full catalog <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-3">Content</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-6 py-3">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.topContent.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <Link
                            href={`/content/${item.id}`}
                            className="font-bold text-slate-900 hover:text-[#335cff]"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {item.descriptor}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">
                      {formatCompactNumber(item.views)}
                    </td>
                    <td className="w-44 px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#335cff] to-[#7895ff]"
                            style={{ width: `${Math.max(item.share, 5)}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-[11px] font-semibold text-slate-500">
                          {item.share.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-bold tracking-tight text-slate-950">
              Match quality
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current source-identity resolution
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <QualityChart data={data.matchQuality} />
            <div className="space-y-2.5">
              {data.matchQuality.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center rounded-lg bg-slate-50 px-3 py-2.5 text-xs"
                >
                  <span
                    className="mr-2.5 size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-600">
                    {item.label}
                  </span>
                  <span className="ml-auto font-bold text-slate-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <h2 className="font-bold tracking-tight text-slate-950">
                Recent ingestion
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest activity across connected systems
              </p>
            </div>
            <Database className="size-4.5 text-slate-300" />
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {data.recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-lg ${
                    run.status.toLowerCase().includes("error")
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {run.status.toLowerCase().includes("error") ? (
                    <Clock3 className="size-3.5" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {run.source}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500 capitalize">
                    {run.status} · {run.records} records
                  </p>
                </div>
                <time className="text-[10px] font-semibold text-slate-500">
                  {new Date(run.completedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <h2 className="font-bold tracking-tight text-slate-950">
                Source freshness
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest observed metric date by source
              </p>
            </div>
            <RadioTower className="size-4.5 text-slate-300" />
          </CardHeader>
          <CardContent className="grid gap-2 pt-4 sm:grid-cols-2">
            {data.freshness.map((item) => (
              <div
                key={item.source}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600">
                  {item.platform.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-800">
                    {item.source}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    Through {item.latestDate}
                  </p>
                </div>
                <span
                  className={`size-2 rounded-full ${
                    item.status === "Fresh"
                      ? "bg-emerald-500"
                      : item.status === "Watch"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  title={item.status}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-5 overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <h2 className="font-bold tracking-tight text-slate-950">
              Platform overlap
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Canonical titles receiving metrics from more than one platform
            </p>
          </div>
          <Eye className="size-4.5 text-slate-300" />
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3">Canonical content</th>
                {data.overlapPlatforms.map((platform) => (
                  <th key={platform} className="px-4 py-3 text-center">
                    {platform}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.overlap.map((row) => (
                <tr key={row.title}>
                  <td className="px-6 py-3.5 font-bold text-slate-800">
                    {row.title}
                  </td>
                  {data.overlapPlatforms.map((platform) => {
                    const available = row.platforms.includes(platform);
                    return (
                      <td key={platform} className="px-4 py-3.5 text-center">
                        <span
                          role="img"
                          className={`mx-auto flex size-5 items-center justify-center rounded-full ${
                            available
                              ? "bg-blue-50 text-[#335cff]"
                              : "bg-slate-50 text-slate-300"
                          }`}
                          aria-label={
                            available ? "Metrics available" : "No metrics"
                          }
                        >
                          {available ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <span className="size-1 rounded-full bg-current" />
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-5 flex flex-wrap items-center justify-end gap-2 text-[10px] font-semibold text-slate-500">
        <span>{formatCompactNumber(data.kpis.totalViews)} canonical views</span>
        <span className="size-1 rounded-full bg-slate-300" />
        <span>{formatHours(data.kpis.watchSeconds)} watch hours</span>
        <span className="size-1 rounded-full bg-slate-300" />
        <span>{data.kpis.latestMetricDate} latest observation</span>
      </p>
    </>
  );
}
