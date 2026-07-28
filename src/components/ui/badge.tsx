import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.02em] text-slate-600",
        className,
      )}
      {...props}
    />
  );
}
