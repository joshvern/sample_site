"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import type { SourceSummary } from "@/types/domain";
import { EXPECTED_CSV_FIELDS } from "@/lib/ingestion/validation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSourceSystemAction } from "@/actions/sources";

interface Preview {
  filename: string;
  headers: string[];
  columnMap: Record<string, string>;
  preview: Array<Record<string, string>>;
  rowCount: number;
  validCount: number;
  failures: Array<{ row: number; issues: string[] }>;
}

interface Summary {
  runId: string;
  status: string;
  received: number;
  inserted: number;
  updated: number;
  failed: number;
  versionsCreated: number;
  metricsUpserted: number;
}

export function CsvIngest({
  initialSources,
}: {
  initialSources: SourceSummary[];
}) {
  const [sources, setSources] = useState(initialSources);
  const [sourceId, setSourceId] = useState(initialSources[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [creating, startCreating] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function requestPreview(
    selectedFile: File,
    columnMap?: Record<string, string>,
  ) {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("file", selectedFile);
    if (columnMap) form.set("columnMap", JSON.stringify(columnMap));
    try {
      const response = await fetch("/api/ingest/preview", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as Preview & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Preview failed.");
      setPreview(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Preview failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function chooseFile(selectedFile: File | null) {
    if (!selectedFile) return;
    setFile(selectedFile);
    setSummary(null);
    void requestPreview(selectedFile);
  }

  function updateMapping(expected: string, header: string) {
    if (!preview || !file) return;
    const nextMap = { ...preview.columnMap, [expected]: header };
    setPreview({ ...preview, columnMap: nextMap });
  }

  async function refreshValidation() {
    if (file && preview) await requestPreview(file, preview.columnMap);
  }

  async function beginIngestion() {
    if (!file || !preview || !sourceId) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("sourceSystemId", sourceId);
    form.set("columnMap", JSON.stringify(preview.columnMap));
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as Summary & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Ingestion failed.");
      setSummary(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ingestion failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function createSource() {
    startCreating(async () => {
      const result = await createSourceSystemAction(newSource);
      if (result.ok) {
        const created: SourceSummary = {
          id: result.data.id,
          name: result.data.name,
          platform: "Unassigned",
          sourceType: "CSV upload",
          active: true,
          lastIngestion: "",
          lastStatus: "No runs",
          recordCount: 0,
          matchRate: 0,
          latestMetricDate: "No data",
        };
        setSources((current) => [...current, created]);
        setSourceId(created.id);
        setNewSource("");
        setShowCreate(false);
      } else setError(result.error.message);
    });
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setSummary(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (summary) {
    return (
      <Card className="py-16 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-950">
          Ingestion {summary.status.replaceAll("_", " ")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Run {summary.runId.slice(0, 8)} preserved the source records and
          generated new match candidates.
        </p>
        <div className="mx-auto mt-7 grid max-w-2xl grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            ["Received", summary.received],
            ["Inserted", summary.inserted],
            ["Updated", summary.updated],
            ["Failed", summary.failed],
            ["Versions", summary.versionsCreated],
            ["Metrics", summary.metricsUpserted],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
        <Button className="mt-7" onClick={reset}>
          <RotateCcw className="size-4" /> Ingest another file
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_24px_rgba(16,24,40,.025)]">
        {[
          ["1", "Select source", Boolean(sourceId)],
          ["2", "Map & preview", Boolean(preview)],
          ["3", "Ingest", false],
        ].map(([number, label, complete], index) => (
          <li
            key={String(label)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${
              (index === 0 && !preview) || (index === 1 && preview)
                ? "bg-blue-50 text-[#335cff]"
                : "text-slate-400"
            }`}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-lg text-[10px] ${
                complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"
              }`}
            >
              {complete ? <Check className="size-3.5" /> : number}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <XCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-bold text-slate-900">1. Source system</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose the system whose stable native IDs are represented by this
              file.
            </p>
            <label className="mt-4 block">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Source
              </span>
              <div className="relative mt-1.5">
                <select
                  value={sourceId}
                  onChange={(event) => setSourceId(event.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm font-medium text-slate-700"
                >
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
            {showCreate ? (
              <div className="mt-3 flex gap-2">
                <input
                  value={newSource}
                  onChange={(event) => setNewSource(event.target.value)}
                  placeholder="Source name"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <Button
                  size="sm"
                  onClick={createSource}
                  disabled={creating || newSource.trim().length < 2}
                >
                  Save
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                <Plus className="size-3.5" /> Create source system
              </button>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-bold text-slate-900">2. CSV file</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Maximum 2 MiB and 5,000 data rows.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              className="sr-only"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
            >
              {loading ? (
                <LoaderCircle className="size-7 animate-spin text-blue-600" />
              ) : (
                <UploadCloud className="size-7 text-slate-400" />
              )}
              <span className="mt-2 text-sm font-semibold text-slate-700">
                {file ? file.name : "Choose a CSV file"}
              </span>
              <span className="mt-1 text-[11px] text-slate-400">
                Click to browse
              </span>
            </label>
            <a
              href="/examples/content-metrics-example.csv"
              download
              className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600"
            >
              <Download className="size-3.5" /> Download example CSV
            </a>
          </Card>
        </div>

        <Card className="min-h-[540px] overflow-hidden">
          {!preview ? (
            <div className="flex h-full min-h-[540px] flex-col items-center justify-center px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <FileSpreadsheet className="size-6" />
              </span>
              <h2 className="mt-4 font-bold text-slate-800">
                Upload a file to begin
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                We’ll infer the field mapping, validate every row, and show the
                first 20 records before anything is written.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">Map CSV columns</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {preview.rowCount} rows · {preview.validCount} valid ·{" "}
                    {preview.failures.length} failed
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={refreshValidation}
                    disabled={loading}
                  >
                    Validate mapping
                  </Button>
                  <Button
                    size="sm"
                    onClick={beginIngestion}
                    disabled={
                      loading ||
                      !sourceId ||
                      !preview.columnMap.source_native_id ||
                      !preview.columnMap.title
                    }
                  >
                    {loading ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="size-3.5" />
                    )}
                    Start ingestion
                  </Button>
                </div>
              </div>

              <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto border-b border-slate-100 bg-slate-50/50 p-4 lg:grid-cols-3">
                {EXPECTED_CSV_FIELDS.map((field) => (
                  <label key={field}>
                    <span className="text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                      {field.replaceAll("_", " ")}
                    </span>
                    <select
                      value={preview.columnMap[field] ?? ""}
                      onChange={(event) =>
                        updateMapping(field, event.target.value)
                      }
                      className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      <option value="">Not mapped</option>
                      {preview.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Row preview
                  </h3>
                  {preview.failures.length > 0 ? (
                    <Badge className="bg-amber-50 text-amber-700">
                      {preview.failures.length} row errors
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700">
                      All rows valid
                    </Badge>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="data-table w-full min-w-[720px] text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        {[
                          "source_native_id",
                          "title",
                          "content_type",
                          "release_year",
                          "platform",
                          "metric_date",
                        ].map((field) => (
                          <th key={field} className="px-3 py-2.5">
                            {field.replaceAll("_", " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 8).map((row, index) => (
                        <tr key={index}>
                          {[
                            "source_native_id",
                            "title",
                            "content_type",
                            "release_year",
                            "platform",
                            "metric_date",
                          ].map((field) => (
                            <td
                              key={field}
                              className="px-3 py-2.5 text-slate-600"
                            >
                              {row[field] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
