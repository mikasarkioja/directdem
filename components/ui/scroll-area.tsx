import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string;
}

/**
 * Kevyt scroll-alue ilman Radix-riippuvuutta (sama rooli kuin shadcn ScrollArea).
 */
export function ScrollArea({
  className,
  maxHeight = "min(60vh, 28rem)",
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      className={cn("overflow-y-auto overflow-x-hidden pr-1", className)}
      style={{ maxHeight }}
      {...props}
    >
      {children}
    </div>
  );
}
