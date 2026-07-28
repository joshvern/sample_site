import {
  ArrowUpRight,
  CalendarDays,
  CircleDotDashed,
  Database,
  Eye,
  Film,
  Layers3,
  RadioTower,
  Timer,
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
      label: "Canonical content",
      value: data.kpis.canonicalContent.toLocaleString(),
      icon: Film,
    },
    {
      label: "Source records",
      value: data.kpis.sourceEntities.toLocaleString(),
      icon: Database,
    },
    {
      label: "Match rate",
      value: `${data.kpis.matchRate.toFixed(1)}%`,
      icon: Layers3,
    },
    {
      label: "Pending review",
      value: data.kpis.pendingReview.toLocaleString(),
      icon: CircleDotDashed,
      accent: true,
    },
    {
      label: "Active sources",
      value: data.kpis.activeSources.toLocaleString(),
      icon: RadioTower,
    },
    {
      label: "Latest metric date",
      value: data.kpis.latestMetricDate,
      icon: CalendarDays,
      small: true,
    },
    {
      label: "Total views",
      value: formatCompactNumber(data.kpis.totalViews),
      icon: Eye,
    },
    {
      label: "Watch hours",
      value: formatCompactNumber(data.kpis.watchSeconds / 3600),
      icon: Timer,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Unified performance"
        title="Content intelligence"
        description="A canonical view of catalog identity, resolution quality, and performance across every connected platform."
        actions={
          <Link
            href="/ingest"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Ingest data <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <section className="metric-grid mb-5 gap-3" aria-label="Key metrics">
        {kpis.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {metric.label}
                </p>
                <p
                  className={`mt-2 font-bold tracking-tight text-slate-950 ${
                    metric.small ? "text-base" : "text-2xl"
                  }`}
                >
                  {metric.value}
                </p>
              </div>
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${
                  metric.accent
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                <metric.icon className="size-4" />
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <h2 className="font-bold text-slate-950">Views over time</h2>
              <p className="mt-1 text-xs text-slate-500">
                Canonicalized daily views across all platforms
              </p>
            </div>
            <Badge>Last 30 days</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <ViewsChart data={data.dailyViews} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-bold text-slate-950">Platform performance</h2>
            <p className="mt-1 text-xs text-slate-500">
              Total views attributed by source platform
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
              <h2 className="font-bold text-slate-950">Most-viewed content</h2>
              <p className="mt-1 text-xs text-slate-500">
                Performance rolled up under canonical identities
              </p>
            </div>
            <Link
              href="/content"
              className="text-xs font-semibold text-blue-600"
            >
              View catalog
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3">Content</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-5 py-3">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.topContent.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/content/${item.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.descriptor}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {formatCompactNumber(item.views)}
                    </td>
                    <td className="w-40 px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.max(item.share, 4)}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs text-slate-500">
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
            <h2 className="font-bold text-slate-950">Match quality</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current source-record resolution
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <QualityChart data={data.matchQuality} />
            <div className="space-y-2.5">
              {data.matchQuality.map((item) => (
                <div key={item.label} className="flex items-center text-xs">
                  <span
                    className="mr-2 size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600">{item.label}</span>
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
          <CardHeader>
            <h2 className="font-bold text-slate-950">Recent ingestion runs</h2>
            <p className="mt-1 text-xs text-slate-500">
              Latest activity from connected source systems
            </p>
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {data.recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-3 rounded-lg px-1 py-3"
              >
                <span
                  className={`size-2 rounded-full ${
                    run.status.toLowerCase().includes("error")
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {run.source}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {run.status} · {run.records} records
                  </p>
                </div>
                <time className="text-[11px] text-slate-600">
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
          <CardHeader>
            <h2 className="font-bold text-slate-950">Data freshness</h2>
            <p className="mt-1 text-xs text-slate-500">
              Latest observed metric date by source
            </p>
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {data.freshness.map((item) => (
              <div
                key={item.source}
                className="flex items-center gap-3 rounded-lg px-1 py-3"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-500">
                  {item.platform.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {item.source}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Through {item.latestDate}
                  </p>
                </div>
                <Badge
                  className={
                    item.status === "Fresh"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "Watch"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-5 overflow-hidden">
        <CardHeader>
          <h2 className="font-bold text-slate-950">Platform overlap</h2>
          <p className="mt-1 text-xs text-slate-500">
            Where canonical content receives metrics across sources
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3">Canonical content</th>
                <th className="px-5 py-3 text-center">Peacock</th>
                <th className="px-5 py-3 text-center">Netflix</th>
                <th className="px-5 py-3 text-center">Hulu</th>
              </tr>
            </thead>
            <tbody>
              {data.overlap.map((row) => (
                <tr key={row.title}>
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {row.title}
                  </td>
                  {(["Peacock", "Netflix", "Hulu"] as const).map((platform) => (
                    <td key={platform} className="px-5 py-3 text-center">
                      <span
                        role="img"
                        className={`mx-auto block size-2.5 rounded-full ${
                          row[platform] ? "bg-blue-500" : "bg-slate-200"
                        }`}
                        aria-label={row[platform] ? "Available" : "No metrics"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-5 text-right text-[11px] text-slate-600">
        {formatCompactNumber(data.kpis.totalViews)} views ·{" "}
        {formatHours(data.kpis.watchSeconds)} watch hours in selected period
      </p>
    </>
  );
}
