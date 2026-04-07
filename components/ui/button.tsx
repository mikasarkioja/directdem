import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" &&
            "bg-blue-600 text-white hover:bg-blue-500 px-4 py-2",
          variant === "outline" &&
            "border border-slate-700 bg-transparent hover:bg-slate-900 px-4 py-2",
          variant === "ghost" && "hover:bg-slate-900 px-3 py-1.5",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
