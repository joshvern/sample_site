import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { getContentCatalog } from "@/db/queries/content";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  type?: string;
  platform?: string;
  country?: string;
  quality?: string;
  page?: string;
}

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
    page: Number(params.page ?? 1),
    pageSize: 10,
  });
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));

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
        title="Content"
        description="Search canonical identities and understand which source records, platforms, and metrics roll up beneath each one."
      />

      <Card className="mb-5 p-4">
        <form className="flex flex-col gap-3 xl:flex-row" action="/content">
          <label className="relative min-w-60 flex-1">
            <span className="sr-only">Search content</span>
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search titles and aliases…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-800 placeholder:text-slate-400"
            />
          </label>
          <FilterSelect
            name="type"
            label="All types"
            value={params.type}
            options={[
              ["series", "Series"],
              ["movie", "Movie"],
              ["season", "Season"],
              ["episode", "Episode"],
            ]}
          />
          <FilterSelect
            name="platform"
            label="All platforms"
            value={params.platform}
            options={[
              ["Peacock", "Peacock"],
              ["Netflix", "Netflix"],
              ["Hulu", "Hulu"],
            ]}
          />
          <FilterSelect
            name="country"
            label="All countries"
            value={params.country}
            options={[
              ["US", "United States"],
              ["GB", "United Kingdom"],
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
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <SlidersHorizontal className="size-4" /> Apply
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            {result.total} canonical {result.total === 1 ? "record" : "records"}
          </p>
          {(params.q ||
            params.type ||
            params.platform ||
            params.country ||
            params.quality) && (
            <Link
              href="/content"
              className="text-xs font-semibold text-blue-600"
            >
              Clear filters
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="px-5 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Platforms</th>
                <th className="px-4 py-3">Sources</th>
                <th className="px-4 py-3">Aliases</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Watch hours</th>
                <th className="px-5 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/content/${item.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.contentType}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.releaseYear ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.country ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {item.platforms.map((platform) => (
                        <Badge key={platform}>{platform}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {item.sourceRecords}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.aliases}</td>
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {formatCompactNumber(item.views)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatCompactNumber(
                      Number(formatHours(item.watchSeconds)),
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {item.confidence == null ? (
                      <Badge className="bg-amber-50 text-amber-700">
                        Unmapped
                      </Badge>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            item.confidence >= 0.95
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="font-semibold text-slate-700">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.items.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Filter className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                No content matches these filters
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a broader title or remove a filter.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            Page {result.page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Link
              href={pageHref(Math.max(1, result.page - 1))}
              aria-disabled={result.page === 1}
              className={`inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-semibold ${
                result.page === 1
                  ? "pointer-events-none text-slate-300"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ChevronLeft className="size-3.5" /> Previous
            </Link>
            <Link
              href={pageHref(Math.min(pageCount, result.page + 1))}
              aria-disabled={result.page >= pageCount}
              className={`inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-semibold ${
                result.page >= pageCount
                  ? "pointer-events-none text-slate-300"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Next <ChevronRight className="size-3.5" />
            </Link>
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
        className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
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
