"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "right" | "left";
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-[100]", className)}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Sulje"
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute top-0 flex h-full w-full max-w-lg flex-col border-neutral-200 bg-white shadow-2xl",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight text-neutral-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-xs leading-snug text-neutral-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
