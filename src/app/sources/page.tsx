import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  RadioTower,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getSources } from "@/db/queries/sources";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await getSources();
  const totalRecords = sources.reduce(
    (sum, source) => sum + source.recordCount,
    0,
  );
  const weightedMatchRate = totalRecords
    ? sources.reduce(
        (sum, source) => sum + source.matchRate * source.recordCount,
        0,
      ) / totalRecords
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Data operations"
        title="Source systems"
        description="Monitor the feeds preserving source identity, provenance, ingestion history, and raw-grain performance."
        actions={
          <Link
            href="/ingest"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#335cff] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(51,92,255,.18)] hover:bg-[#294ee7]"
          >
            New ingestion <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: RadioTower,
            label: "Active systems",
            value: sources.filter((source) => source.active).length,
            detail: `${sources.length} configured`,
            tone: "bg-blue-50 text-blue-600",
          },
          {
            icon: Database,
            label: "Source identities",
            value: totalRecords,
            detail: "Versioned records",
            tone: "bg-violet-50 text-violet-600",
          },
          {
            icon: Activity,
            label: "Weighted match rate",
            value: `${weightedMatchRate.toFixed(1)}%`,
            detail: "Across all systems",
            tone: "bg-emerald-50 text-emerald-600",
          },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4 p-4">
            <span
              className={`flex size-10 items-center justify-center rounded-xl ${stat.tone}`}
            >
              <stat.icon className="size-4.5" />
            </span>
            <div>
              <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                {stat.label}
              </p>
              <p className="mt-0.5 text-xl font-bold tracking-tight text-slate-950">
                {stat.value}
              </p>
              <p className="text-[9px] text-slate-400">{stat.detail}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="surface-grid relative mb-5 overflow-hidden rounded-2xl bg-[#0b1525] px-5 py-4 text-white sm:px-6">
        <div className="absolute -top-20 right-0 size-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">
                All source adapters operational
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Source facts remain authoritative · derived metrics are
                rebuildable
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.1)]" />
            Live monitoring
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Connected systems
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Ingestion health, resolution coverage, and data freshness
            </p>
          </div>
          <RefreshCw className="size-4 text-slate-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="px-6 py-3">Source system</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Connector</th>
                <th className="px-4 py-3">Last ingestion</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Resolution</th>
                <th className="px-6 py-3">Freshness</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-10 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-500">
                        {source.platform.slice(0, 2).toUpperCase()}
                        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {source.name}
                        </p>
                        <p className="mt-0.5 text-[9px] font-semibold text-emerald-600">
                          {source.active ? "Operational" : "Paused"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge className="border-slate-200 bg-white text-slate-600">
                      {source.platform}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-semibold text-slate-500 capitalize">
                    {source.sourceType}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                      <Clock className="size-3.5 text-slate-400" />
                      {source.lastIngestion
                        ? new Date(source.lastIngestion).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )
                        : "Never"}
                    </div>
                    <p
                      className={`mt-1 text-[9px] font-semibold capitalize ${
                        source.lastStatus.toLowerCase().includes("error")
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {source.lastStatus}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-700">
                    {source.recordCount}
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700">
                          {source.matchRate.toFixed(1)}%
                        </span>
                        <span className="text-[8px] font-semibold text-slate-400">
                          matched
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#335cff] to-[#7895ff]"
                          style={{ width: `${source.matchRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="mr-1 size-3" />
                      {source.latestMetricDate}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          href="/ingest"
          className="flex items-center justify-center gap-2 border-t border-slate-100 py-3.5 text-[10px] font-bold text-[#335cff] hover:bg-blue-50/30"
        >
          Import another source file <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    </>
  );
}
