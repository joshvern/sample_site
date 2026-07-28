import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  Database,
  Flag,
  Languages,
  Link2,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentDetail } from "@/db/queries/content";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ViewsChart } from "@/components/dashboard/charts";
import { formatCompactNumber, formatHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentDetail(id);
  if (!item) notFound();

  return (
    <>
      <Link
        href="/content"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" /> Back to catalog
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-blue-50 text-blue-700">
              {item.contentType}
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 size-3" /> Canonical
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {item.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />{" "}
              {item.releaseYear ?? "Unknown year"}
            </span>
            <span className="flex items-center gap-1.5">
              <Flag className="size-3.5" /> {item.country ?? "Unknown country"}
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="size-3.5" />{" "}
              {item.language?.toUpperCase() ?? "—"}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="min-w-32 px-4 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase">
              Total views
            </p>
            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatCompactNumber(item.views)}
            </p>
          </Card>
          <Card className="min-w-32 px-4 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase">
              Watch hours
            </p>
            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatCompactNumber(Number(formatHours(item.watchSeconds)))}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-950">Views over time</h2>
              <p className="mt-1 text-xs text-slate-500">
                All accepted source mappings, rolled up daily
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <ViewsChart data={item.dailyViews} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <h2 className="font-bold text-slate-950">
                Connected source records
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Active mappings contributing metrics to this identity
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-left text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3">Source title</th>
                    <th className="px-4 py-3">Source system</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-5 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {item.sources.map((source) => (
                    <tr key={source.id}>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {source.rawTitle}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {source.system}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 capitalize">
                        {source.method}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-emerald-700">
                          {(source.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <h2 className="font-bold text-slate-950">Mapping history</h2>
              <p className="mt-1 text-xs text-slate-500">
                Immutable decision history and validity periods
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-left text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3">Source</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3">Valid from</th>
                    <th className="px-5 py-3">Valid to</th>
                  </tr>
                </thead>
                <tbody>
                  {item.mappingHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {history.source}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className="bg-emerald-50 text-emerald-700">
                          {history.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(history.validFrom).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {history.validTo
                          ? new Date(history.validTo).toLocaleDateString()
                          : "Active"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-950">Canonical metadata</h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                [Tags, "Content type", item.contentType],
                [Calendar, "Release year", item.releaseYear ?? "—"],
                [Flag, "Origin country", item.country ?? "—"],
                [Languages, "Original language", item.language ?? "—"],
                [Clock3, "Status", item.status ?? "—"],
                [Database, "Source records", item.sourceRecords],
              ].map(([Icon, label, value]) => {
                const MetadataIcon = Icon as typeof Tags;
                return (
                  <div key={String(label)} className="flex items-center gap-3">
                    <MetadataIcon className="size-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                        {String(label)}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700 capitalize">
                        {String(value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-950">Titles & aliases</h2>
              <p className="mt-1 text-xs text-slate-500">
                {item.aliasesList.length} known title variants
              </p>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {item.aliasesList.map((alias) => (
                <div
                  key={`${alias.title}-${alias.country}`}
                  className="rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {alias.title}
                    </p>
                    {alias.primary && (
                      <Badge className="bg-blue-50 text-blue-700">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 capitalize">
                    {alias.type} · {alias.country ?? "Global"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-950">Platform totals</h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {item.platformMetrics.map((metric) => (
                <div key={metric.platform}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      {metric.platform}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatCompactNumber(metric.views)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.max(8, (metric.views / item.views) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {item.identifiers.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-bold text-slate-950">
                  External identifiers
                </h2>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {item.identifiers.map((identifier) => (
                  <div key={`${identifier.namespace}-${identifier.value}`}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">
                      {identifier.namespace}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                      <Link2 className="size-3.5" /> {identifier.value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
