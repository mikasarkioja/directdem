import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
          "border-transparent bg-slate-800 text-slate-100",
        variant === "destructive" &&
          "border-transparent bg-rose-950/80 text-rose-200 border-rose-500/30",
        variant === "success" &&
          "border-transparent bg-emerald-950/80 text-emerald-200 border-emerald-500/30",
        variant === "outline" &&
          "border-slate-600 bg-transparent text-slate-300",
        className,
      )}
      {...props}
    />
  );
}
