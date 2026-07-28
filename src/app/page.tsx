import {
  ArrowRight,
  ChartSpline,
  Fingerprint,
  GitMerge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Fingerprint,
    title: "One identity, every source",
    description:
      "Resolve aliases and platform-specific records into durable canonical content without losing provenance.",
  },
  {
    icon: GitMerge,
    title: "Review with context",
    description:
      "Compare interpretable candidates, preserve every decision, and keep ambiguous remakes safely distinct.",
  },
  {
    icon: ChartSpline,
    title: "Metrics that finally align",
    description:
      "Aggregate daily performance across platforms only after identity is resolved—not by brittle title joins.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#dbeafe_0,transparent_28%),radial-gradient(circle_at_80%_65%,#ede9fe_0,transparent_24%)] opacity-70" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Sparkles className="size-3.5" />
              Unified content intelligence
            </div>
            <h1 className="max-w-3xl text-5xl leading-[1.05] font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl">
              Know what your content is.
              <span className="block text-blue-600">
                Then know how it performs.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Signal Studio turns disconnected platform records into one trusted
              content catalog—with explainable resolution and analytics built on
              canonical identity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Explore the demo <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/resolution"
                className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See entity resolution
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              Source provenance preserved. Mapping history never overwritten.
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/70">
              <div className="rounded-xl bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Canonical identity
                    </p>
                    <h2 className="mt-1 text-xl font-bold">The Office</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    98.5% confidence
                  </span>
                </div>
                <div className="mt-7 grid grid-cols-3 gap-3">
                  {[
                    ["Release", "2005"],
                    ["Country", "US"],
                    ["Type", "Series"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 px-3 py-5">
                {(
                  [
                    ["Peacock", "The Office (2005)", "99%"],
                    ["Netflix", "Office, The", "98%"],
                    ["Hulu", "The Office", "Review"],
                  ] as const
                ).map(([source, title, status]) => (
                  <div
                    key={source}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                      {source.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {title}
                      </p>
                      <p className="text-[11px] text-slate-500">{source}</p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        status === "Review"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            A durable data backbone
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            From messy source records to trusted decisions.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-bold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
