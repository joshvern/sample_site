"use client";

import {
  ChartNoAxesCombined,
  CircleDotDashed,
  DatabaseZap,
  LayoutDashboard,
  LibraryBig,
  Menu,
  RadioTower,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: LibraryBig },
  { href: "/resolution", label: "Resolution", icon: CircleDotDashed },
  { href: "/sources", label: "Sources", icon: DatabaseZap },
  { href: "/ingest", label: "Ingest", icon: Upload },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const landing = pathname === "/";

  if (landing) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-slate-100">
          <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
            <Logo />
            <Link
              href="/dashboard"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open dashboard
            </Link>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[232px] border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-18 items-center justify-between border-b border-slate-100 px-5">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Primary">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                <item.icon className="size-[18px]" strokeWidth={1.8} />
                {item.label}
                {item.href === "/resolution" && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    2
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <RadioTower className="size-3.5 text-emerald-600" />
            Demo workspace
          </div>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            Read-only sample data until Neon is connected.
          </p>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-18 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mr-3 rounded-md p-1.5 text-slate-600 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-900">
                Demo workspace
              </p>
              <p className="text-[11px] text-slate-500">Content operations</p>
            </div>
            <div
              className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
              aria-hidden="true"
            >
              CI
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-200">
        <ChartNoAxesCombined className="size-4.5" strokeWidth={2.2} />
      </span>
      <span className="text-sm font-bold tracking-tight text-slate-950">
        Signal Studio
      </span>
    </Link>
  );
}
