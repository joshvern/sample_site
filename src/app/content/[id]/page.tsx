import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Eye,
  Flag,
  GitBranch,
  Languages,
  Link2,
  Tags,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentDetail } from "@/db/queries/content";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ViewsChart } from "@/components/dashboard/charts";
import { formatCompactNumber } from "@/lib/utils";

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
        className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" /> Content library
      </Link>

      <section className="surface-grid relative mb-5 overflow-hidden rounded-[22px] bg-[#0b1525] text-white shadow-[0_18px_50px_rgba(15,23,42,.14)]">
        <div
          className="absolute inset-y-0 right-0 w-2/3 opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle at 70% 30%, ${item.accent}, transparent 55%)`,
          }}
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          <div
            className="poster-grain flex h-48 w-32 shrink-0 flex-col justify-between rounded-2xl p-4 text-white shadow-2xl shadow-black/30"
            style={{ backgroundColor: item.accent }}
          >
            <p className="text-[8px] font-bold tracking-[0.2em] text-white/60 uppercase">
              Signal canonical
            </p>
            <div>
              <p className="text-lg leading-tight font-black tracking-[-0.04em] uppercase">
                {item.title}
              </p>
              <p className="mt-2 text-[9px] font-bold text-white/60">
                {item.releaseYear}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-blue-400/20 bg-blue-400/10 text-blue-200">
                  {item.contentType}
                </Badge>
                <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  <CheckCircle2 className="mr-1 size-3" /> Canonical identity
                </Badge>
                {item.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-[10px] font-semibold text-slate-500"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                {item.title}
              </h1>
              {item.originalTitle && (
                <p className="mt-1 text-sm font-medium text-slate-400">
                  {item.originalTitle}
                </p>
              )}
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                {item.synopsis ??
                  "Canonical title with accepted source mappings and daily performance facts."}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />{" "}
                {item.releaseYear ?? "Unknown year"}
              </span>
              <span className="flex items-center gap-1.5">
                <Flag className="size-3.5" />{" "}
                {item.country ?? "Unknown country"}
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="size-3.5" />{" "}
                {item.language?.toUpperCase() ?? "—"}
              </span>
              {item.runtimeSeconds && (
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />{" "}
                  {Math.round(item.runtimeSeconds / 60)} min
                </span>
              )}
            </div>
          </div>

          <div className="grid min-w-52 grid-cols-2 gap-2 self-start sm:grid-cols-1">
            {[
              [Eye, "Total views", formatCompactNumber(item.views)],
              [
                Timer,
                "Watch hours",
                formatCompactNumber(item.watchSeconds / 3600),
              ],
              [Database, "Source records", item.sourceRecords.toString()],
            ].map(([Icon, label, value]) => {
              const StatIcon = Icon as typeof Eye;
              return (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-bold tracking-wider text-slate-500 uppercase">
                        {String(label)}
                      </p>
                      <p className="mt-1 text-base font-bold">
                        {String(value)}
                      </p>
                    </div>
                    <StatIcon className="size-4 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 text-[11px] font-bold text-slate-500">
        {["Performance", "Source records", "Mapping history", "Metadata"].map(
          (label, index) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(" ", "-")}`}
              className={`rounded-lg px-3 py-2 whitespace-nowrap ${
                index === 0
                  ? "bg-slate-950 text-white"
                  : "hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {label}
            </a>
          ),
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card id="performance">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <h2 className="font-bold tracking-tight text-slate-950">
                  Canonical performance
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  All accepted source mappings, rolled up daily
                </p>
              </div>
              <Badge className="border-blue-100 bg-blue-50 text-blue-700">
                90 days
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <ViewsChart data={item.dailyViews} />
            </CardContent>
          </Card>

          <Card id="source-records" className="overflow-hidden">
            <CardHeader>
              <h2 className="font-bold tracking-tight text-slate-950">
                Connected source records
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Active mappings currently contributing to this identity
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50/70">
                    <th className="px-6 py-3">Source title</th>
                    <th className="px-4 py-3">Source system</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-6 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {item.sources.map((source) => (
                    <tr key={source.id}>
                      <td className="px-6 py-3.5 font-bold text-slate-800">
                        {source.rawTitle}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {source.system}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className="border-slate-200 bg-white text-slate-600 capitalize">
                          {source.method.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-emerald-700">
                            {(source.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card id="mapping-history" className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <h2 className="font-bold tracking-tight text-slate-950">
                  Mapping history
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Immutable decisions and validity periods
                </p>
              </div>
              <GitBranch className="size-4.5 text-slate-300" />
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50/70">
                    <th className="px-6 py-3">Source</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3">Valid from</th>
                    <th className="px-6 py-3">Valid to</th>
                  </tr>
                </thead>
                <tbody>
                  {item.mappingHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-800">
                        {history.source}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className="bg-emerald-50 text-emerald-700 capitalize">
                          <CheckCircle2 className="mr-1 size-3" />
                          {history.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(history.validFrom).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-500">
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

        <aside id="metadata" className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-bold tracking-tight text-slate-950">
                Canonical metadata
              </h2>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-4">
              {[
                [Tags, "Content type", item.contentType],
                [Calendar, "Release year", item.releaseYear ?? "—"],
                [Flag, "Origin country", item.country ?? "—"],
                [Languages, "Language", item.language ?? "—"],
                [Clock3, "Status", item.status ?? "—"],
                [Database, "Source records", item.sourceRecords],
              ].map(([Icon, label, value]) => {
                const MetadataIcon = Icon as typeof Tags;
                return (
                  <div
                    key={String(label)}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <MetadataIcon className="size-3.5 text-slate-400" />
                    <p className="mt-3 text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                      {String(label)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-700 capitalize">
                      {String(value).replaceAll("_", " ")}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-bold tracking-tight text-slate-950">
                Titles & aliases
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {item.aliasesList.length} normalized title variants
              </p>
            </CardHeader>
            <CardContent className="max-h-72 scrollbar-thin space-y-2 overflow-y-auto pt-4">
              {item.aliasesList.map((alias) => (
                <div
                  key={`${alias.title}-${alias.country}`}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800">
                      {alias.title}
                    </p>
                    {alias.primary && (
                      <Badge className="bg-blue-50 text-blue-700">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[9px] font-semibold text-slate-400 capitalize">
                    {alias.type} · {alias.country ?? "Global"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-bold tracking-tight text-slate-950">
                Platform totals
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {item.platformMetrics.map((metric) => (
                <div key={metric.platform}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-600">
                      {metric.platform}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatCompactNumber(metric.views)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#335cff] to-[#7895ff]"
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
                <h2 className="font-bold tracking-tight text-slate-950">
                  External identifiers
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Stable authority links used during resolution
                </p>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {item.identifiers.map((identifier) => {
                  const content = (
                    <>
                      <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Link2 className="size-3.5" />
                      </span>
                      <div>
                        <p className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                          {identifier.namespace}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-slate-700">
                          {identifier.value}
                        </p>
                      </div>
                      {identifier.url && (
                        <ExternalLink className="ml-auto size-3.5 text-slate-300" />
                      )}
                    </>
                  );
                  return identifier.url ? (
                    <a
                      key={`${identifier.namespace}-${identifier.value}`}
                      href={identifier.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50/30"
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      key={`${identifier.namespace}-${identifier.value}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      {content}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
