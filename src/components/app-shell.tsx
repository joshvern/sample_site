"use client";

import {
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDotDashed,
  DatabaseZap,
  HelpCircle,
  LayoutDashboard,
  LibraryBig,
  Menu,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/content", label: "Content library", icon: LibraryBig },
  { href: "/resolution", label: "Resolution", icon: CircleDotDashed },
  { href: "/sources", label: "Source systems", icon: DatabaseZap },
  { href: "/ingest", label: "Ingestion", icon: Upload },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const landing = pathname === "/";
  const current =
    navigation.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href)),
    )?.label ?? "Workspace";

  if (landing) {
    return (
      <div className="min-h-screen bg-white">
        <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
            <Logo dark />
            <div className="flex items-center gap-2">
              <Link
                href="/resolution"
                className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-flex"
              >
                How it works
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 shadow-lg shadow-black/10 transition hover:bg-blue-50"
              >
                Open workspace
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col overflow-hidden border-r border-white/6 bg-[#09111f] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="surface-grid absolute inset-0 opacity-60" />
        <div className="relative flex h-20 shrink-0 items-center justify-between px-5">
          <Logo dark />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative px-3">
          <Link
            href="/ingest"
            onClick={() => setOpen(false)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#335cff] text-sm font-bold text-white shadow-[0_10px_24px_rgba(51,92,255,.26)] transition hover:bg-[#466bff]"
          >
            <Plus className="size-4" /> New ingestion
          </Link>
        </div>

        <nav
          className="relative mt-7 flex-1 space-y-1 px-3"
          aria-label="Primary"
        >
          <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-slate-500 uppercase">
            Workspace
          </p>
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
                  active
                    ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition",
                    active
                      ? "bg-[#335cff] text-white"
                      : "bg-white/[0.04] text-slate-500 group-hover:text-slate-300",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.9} />
                </span>
                {item.label}
                {item.href === "/resolution" && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-400/15 text-[10px] font-bold text-amber-300">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative m-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-3">
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <DatabaseZap className="size-4" />
              <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-[#101827] bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-100">
                Signal Studio Demo
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Neon · Operational
              </p>
            </div>
            <ChevronDown className="size-3.5 text-slate-500" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mr-3 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
              Signal Studio
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-800">{current}</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/content"
              className="hidden h-9 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-400 transition hover:border-slate-300 hover:bg-white md:flex"
            >
              <Search className="size-3.5" />
              Search the catalog…
              <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[9px] font-semibold text-slate-600">
                ⌘ K
              </kbd>
            </Link>
            <button
              type="button"
              aria-label="Product help"
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <HelpCircle className="size-4.5" />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#335cff]" />
            </button>
            <div
              className="ml-1 flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-[10px] font-bold text-white shadow-sm"
              aria-hidden="true"
            >
              CI
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1540px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
    </div>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#5b7cff] to-[#2546da] text-white shadow-lg shadow-blue-950/20">
        <Sparkles className="absolute -top-1 -right-1 size-3 text-blue-200/60" />
        <ChartNoAxesCombined className="size-4.5" strokeWidth={2.2} />
      </span>
      <span
        className={cn(
          "text-[15px] font-bold tracking-[-0.02em]",
          dark ? "text-white" : "text-slate-950",
        )}
      >
        Signal
        <span className={dark ? "text-blue-400" : "text-[#335cff]"}>.</span>
      </span>
    </Link>
  );
}
