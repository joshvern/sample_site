import {
  ArrowRight,
  ChartSpline,
  Check,
  CircleDotDashed,
  DatabaseZap,
  Fingerprint,
  GitMerge,
  Layers3,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Fingerprint,
    eyebrow: "Identity",
    title: "One title. Every source.",
    description:
      "Resolve aliases, remakes, localizations, and platform-native records into a durable canonical catalog.",
    tone: "bg-blue-50 text-blue-600",
  },
  {
    icon: GitMerge,
    eyebrow: "Resolution",
    title: "Decisions people can trust.",
    description:
      "Review scored candidates with interpretable evidence and preserve every mapping decision as history.",
    tone: "bg-violet-50 text-violet-600",
  },
  {
    icon: ChartSpline,
    eyebrow: "Analytics",
    title: "Performance that reconciles.",
    description:
      "Roll source-grain facts into canonical daily metrics only after identity has been safely resolved.",
    tone: "bg-emerald-50 text-emerald-600",
  },
];

const pipeline = [
  ["01", "Preserve", "Raw records + versions"],
  ["02", "Resolve", "Candidates + evidence"],
  ["03", "Unify", "Canonical identity"],
  ["04", "Measure", "Trusted performance"],
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-white">
      <section className="relative min-h-[780px] overflow-hidden bg-[#08111f] pt-20 text-white">
        <div className="surface-grid absolute inset-0 opacity-70" />
        <div className="absolute -top-48 left-1/2 h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute right-[-12rem] bottom-[-18rem] size-[560px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[11px] font-bold tracking-wide text-blue-200 uppercase">
              <Sparkles className="size-3.5" />
              Content operations, reconciled
            </div>
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-[68px]">
              Every title,
              <span className="block bg-gradient-to-r from-[#7895ff] via-[#9cb1ff] to-[#7ee7d1] bg-clip-text text-transparent">
                finally in focus.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
              Signal Studio gives content teams one trusted operating layer for
              catalog identity, source resolution, and cross-platform
              performance.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#335cff] px-5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(51,92,255,.28)] transition hover:bg-[#466bff]"
              >
                Explore the workspace <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/resolution"
                className="inline-flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.05] px-5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                Review a live match
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
              {[
                "Immutable source history",
                "Explainable matching",
                "Canonical metrics",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex size-4 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-5">
            <div className="absolute -inset-8 rounded-[40px] bg-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0e1929] shadow-2xl shadow-black/40">
              <div className="flex h-12 items-center border-b border-white/8 px-4">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-400/70" />
                  <span className="size-2.5 rounded-full bg-amber-300/70" />
                  <span className="size-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <p className="mx-auto text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  Signal Studio · Resolution
                </p>
                <span className="size-7" />
              </div>
              <div className="grid min-h-[470px] grid-cols-[76px_1fr]">
                <div className="border-r border-white/8 bg-[#0a1422] p-3">
                  <span className="mx-auto flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Layers3 className="size-4" />
                  </span>
                  <div className="mt-7 space-y-3">
                    {[
                      RadioTower,
                      Fingerprint,
                      CircleDotDashed,
                      DatabaseZap,
                    ].map((Icon, index) => (
                      <span
                        key={index}
                        className={`mx-auto flex size-9 items-center justify-center rounded-lg ${
                          index === 2
                            ? "bg-white/10 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.16em] text-blue-400 uppercase">
                        Human review · 02 of 03
                      </p>
                      <h2 className="mt-2 text-xl font-bold">Dune</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Prime Video Catalog · year missing
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                      Ambiguous
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        year: "2021",
                        subtitle: "Movie · US",
                        score: "80%",
                        accent: "#b77837",
                      },
                      {
                        year: "1984",
                        subtitle: "Movie · US",
                        score: "80%",
                        accent: "#826145",
                      },
                    ].map((candidate) => (
                      <div
                        key={candidate.year}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="poster-grain flex h-14 w-10 shrink-0 items-end rounded-lg p-2 text-[8px] font-black tracking-widest"
                            style={{ backgroundColor: candidate.accent }}
                          >
                            DUNE
                          </span>
                          <div>
                            <p className="text-sm font-bold">Dune</p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {candidate.subtitle.replace(
                                "Movie",
                                `${candidate.year} · Movie`,
                              )}
                            </p>
                          </div>
                          <span className="ml-auto text-xs font-bold text-blue-300">
                            {candidate.score}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          {[
                            ["Title", "Match"],
                            ["Type", "Match"],
                            ["Year", "Missing"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-lg bg-black/15 px-2 py-2"
                            >
                              <p className="text-[7px] font-bold tracking-wider text-slate-600 uppercase">
                                {label}
                              </p>
                              <p
                                className={`mt-1 text-[9px] font-bold ${
                                  value === "Match"
                                    ? "text-emerald-300"
                                    : "text-amber-300"
                                }`}
                              >
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <button className="mt-3 h-8 w-full rounded-lg bg-white/8 text-[10px] font-bold text-white">
                          Accept match
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <ShieldCheck className="size-3.5 text-emerald-300" />
                      Decision history retained
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">
                      No auto-accept
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 border-t border-white/8 px-5 sm:grid-cols-4 sm:px-6">
          {[
            ["24", "Canonical titles"],
            ["39", "Source identities"],
            ["8", "Connected systems"],
            ["90 days", "Daily source facts"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-white/8 px-4 py-7 first:border-l sm:border-r"
            >
              <p className="text-xl font-bold tracking-tight text-white">
                {value}
              </p>
              <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#335cff] uppercase">
              Built for durable truth
            </p>
            <h2 className="mt-4 text-4xl leading-tight font-bold tracking-[-0.045em] text-slate-950">
              Stop joining analytics on title strings.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-500 lg:ml-auto">
            Signal Studio keeps source facts authoritative, makes identity
            decisions explicit, and rebuilds aggregates from accepted mapping
            history. The result is a catalog your operators and analysts can
            both trust.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,.08)]"
            >
              <div
                className={`flex size-11 items-center justify-center rounded-xl ${feature.tone}`}
              >
                <feature.icon className="size-5" />
              </div>
              <p className="mt-7 text-[9px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                {feature.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#335cff] uppercase">
                The durable path
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                From source record to trusted metric.
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#335cff]"
            >
              Explore the full flow <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-4">
            {pipeline.map(([number, title, detail], index) => (
              <div
                key={number}
                className="relative border-b border-slate-200 p-6 last:border-0 md:border-r md:border-b-0"
              >
                <span className="text-[10px] font-black text-[#335cff]">
                  {number}
                </span>
                <p className="mt-8 text-base font-bold text-slate-900">
                  {title}
                </p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
                {index < pipeline.length - 1 && (
                  <ArrowRight className="absolute top-6 right-5 hidden size-4 text-slate-300 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-semibold text-slate-700">Signal Studio</p>
          <p>Canonical identity · Explainable resolution · Trusted metrics</p>
        </div>
      </footer>
    </main>
  );
}
