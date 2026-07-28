import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  RadioTower,
} from "lucide-react";
import Link from "next/link";
import { getSources } from "@/db/queries/sources";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await getSources();
  return (
    <>
      <PageHeader
        eyebrow="Data operations"
        title="Source systems"
        description="Monitor the feeds that preserve source identity, provenance, ingestion history, and raw-grain performance."
        actions={
          <Link
            href="/ingest"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New ingestion <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <RadioTower className="size-4.5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">
                Active systems
              </p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">
                {sources.filter((source) => source.active).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Database className="size-4.5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">
                Source records
              </p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">
                {sources.reduce((sum, source) => sum + source.recordCount, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="size-4.5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">
                Average match rate
              </p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">
                {(
                  sources.reduce((sum, source) => sum + source.matchRate, 0) /
                  Math.max(sources.length, 1)
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="px-5 py-3">Source system</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Last ingestion</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Match rate</th>
                <th className="px-5 py-3">Freshness</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                        {source.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {source.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <span
                            className={`size-1.5 rounded-full ${
                              source.active ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          {source.active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{source.platform}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600 capitalize">
                    {source.sourceType}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
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
                    <p className="mt-1 text-[11px] text-slate-400 capitalize">
                      {source.lastStatus}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {source.recordCount}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${source.matchRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {source.matchRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
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
      </Card>
    </>
  );
}
