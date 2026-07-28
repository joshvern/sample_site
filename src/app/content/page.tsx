import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Film,
  Filter,
  Layers3,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getContentCatalog } from "@/db/queries/content";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  type?: string;
  platform?: string;
  country?: string;
  quality?: string;
  sort?: "views" | "title" | "year" | "confidence";
  page?: string;
}

const platformOptions = [
  "Peacock",
  "Netflix",
  "Hulu",
  "Prime Video",
  "Max",
  "Disney+",
  "Apple TV+",
  "Linear NBC",
].map((item) => [item, item] as [string, string]);

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const result = await getContentCatalog({
    search: params.q,
    contentType: params.type,
    platform: params.platform,
    country: params.country,
    quality: params.quality,
    sort: params.sort,
    page: Number(params.page ?? 1),
    pageSize: 12,
  });
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const activeFilterCount = [
    params.q,
    params.type,
    params.platform,
    params.country,
    params.quality,
  ].filter(Boolean).length;

  function pageHref(page: number) {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page") next.set(key, value);
    });
    next.set("page", String(page));
    return `/content?${next}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="Canonical catalog"
        title="Content library"
        description="Search trusted identities and inspect the source records, aliases, external IDs, and performance that roll up beneath each title."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Film,
            label: "Visible titles",
            value: result.total,
            detail: "Canonical records",
            tone: "bg-blue-50 text-blue-600",
          },
          {
            icon: Layers3,
            label: "Source coverage",
            value: result.items.reduce(
              (sum, item) => sum + item.sourceRecords,
              0,
            ),
            detail: "On this page",
            tone: "bg-violet-50 text-violet-600",
          },
          {
            icon: Sparkles,
            label: "High confidence",
            value: result.items.filter((item) => (item.confidence ?? 0) >= 0.95)
              .length,
            detail: `${result.items.length} titles on this page`,
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
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-950">
                {stat.value}
                <span className="ml-2 text-[10px] font-medium text-slate-400">
                  {stat.detail}
                </span>
              </p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="mb-5 overflow-hidden">
        <form action="/content">
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <label className="relative min-w-60 flex-1">
              <span className="sr-only">Search content</span>
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Search titles and aliases…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-3 pl-10 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:bg-white"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                name="type"
                label="All types"
                value={params.type}
                options={[
                  ["series", "Series"],
                  ["movie", "Movie"],
                ]}
              />
              <FilterSelect
                name="platform"
                label="All platforms"
                value={params.platform}
                options={platformOptions}
              />
              <FilterSelect
                name="country"
                label="All countries"
                value={params.country}
                options={[
                  ["US", "United States"],
                  ["GB", "United Kingdom"],
                  ["KR", "South Korea"],
                  ["AU", "Australia"],
                ]}
              />
              <FilterSelect
                name="quality"
                label="All quality"
                value={params.quality}
                options={[
                  ["high", "High confidence"],
                  ["review", "Needs review"],
                ]}
              />
              <FilterSelect
                name="sort"
                label="Most viewed"
                value={params.sort}
                options={[
                  ["title", "Title A–Z"],
                  ["year", "Newest first"],
                  ["confidence", "Best matched"],
                ]}
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800"
              >
                <SlidersHorizontal className="size-3.5" /> Apply
              </button>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <Filter className="size-3.5 text-[#335cff]" />
              <p className="text-[10px] font-bold text-slate-500">
                {activeFilterCount} active{" "}
                {activeFilterCount === 1 ? "filter" : "filters"}
              </p>
              <Link
                href="/content"
                className="ml-auto text-[10px] font-bold text-[#335cff]"
              >
                Clear all
              </Link>
            </div>
          )}
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {result.total} canonical{" "}
              {result.total === 1 ? "record" : "records"}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Stable identities ordered by{" "}
              {params.sort === "title"
                ? "title"
                : params.sort === "year"
                  ? "release year"
                  : params.sort === "confidence"
                    ? "match confidence"
                    : "total views"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
            <ArrowDownUp className="size-3.5" />
            Server sorted
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[1120px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="px-6 py-3">Canonical identity</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Markets</th>
                <th className="px-4 py-3">Platforms</th>
                <th className="px-4 py-3">Coverage</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-6 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="poster-grain flex h-12 w-9 shrink-0 items-end rounded-lg p-1.5 text-[7px] leading-tight font-black tracking-wide text-white uppercase shadow-sm"
                        style={{ backgroundColor: item.accent }}
                        aria-hidden="true"
                      >
                        {item.title.slice(0, 10)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/content/${item.id}`}
                          className="block max-w-64 truncate font-bold text-slate-900 hover:text-[#335cff]"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-1 flex max-w-72 gap-1.5 overflow-hidden">
                          {item.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="text-[9px] font-semibold whitespace-nowrap text-slate-400"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className="border-slate-200 bg-white text-slate-600">
                      {item.contentType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-slate-700">
                      {item.releaseYear ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                      {item.country ?? "Global"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex -space-x-1.5">
                      {item.platforms.slice(0, 4).map((platform) => (
                        <span
                          key={platform}
                          title={platform}
                          className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[8px] font-black text-slate-500"
                        >
                          {platform.slice(0, 2).toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-slate-700">
                      {item.sourceRecords}{" "}
                      <span className="font-medium text-slate-400">
                        sources
                      </span>
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400">
                      {item.aliases} known aliases
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-slate-800">
                      {formatCompactNumber(item.views)}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400">
                      {formatCompactNumber(item.watchSeconds / 3600)} hrs
                    </p>
                  </td>
                  <td className="px-6 py-3.5">
                    {item.confidence == null ? (
                      <Badge className="bg-amber-50 text-amber-700">
                        Unmapped
                      </Badge>
                    ) : (
                      <div className="w-28">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700">
                            {(item.confidence * 100).toFixed(1)}%
                          </span>
                          <span
                            className={`size-1.5 rounded-full ${
                              item.confidence >= 0.95
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              item.confidence >= 0.95
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.items.length === 0 && (
            <div className="px-6 py-20 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Filter className="size-5" />
              </span>
              <p className="mt-4 font-bold text-slate-800">
                No content matches these filters
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a broader title or remove a filter.
              </p>
              <Link
                href="/content"
                className="mt-4 inline-flex text-xs font-bold text-[#335cff]"
              >
                Reset the catalog
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-semibold text-slate-500">
            Page {result.page} of {pageCount} · {result.pageSize} rows per page
          </p>
          <div className="flex gap-2">
            <PaginationLink
              href={pageHref(Math.max(1, result.page - 1))}
              disabled={result.page === 1}
            >
              <ChevronLeft className="size-3.5" /> Previous
            </PaginationLink>
            <PaginationLink
              href={pageHref(Math.min(pageCount, result.page + 1))}
              disabled={result.page >= pageCount}
            >
              Next <ChevronRight className="size-3.5" />
            </PaginationLink>
          </div>
        </div>
      </Card>
    </>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: Array<[string, string]>;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-10 min-w-32 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
      >
        <option value="">{label}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={`inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[10px] font-bold ${
        disabled
          ? "pointer-events-none text-slate-300"
          : "text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}
