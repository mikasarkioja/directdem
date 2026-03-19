import React from "react";
import { Loader2, LayoutGrid } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative">
        {/* Soft pulsing glow */}
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse" />

        <div className="flex items-center justify-center space-x-2 relative z-10">
          <LayoutGrid className="w-10 h-10 text-slate-800 animate-pulse" />
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          Dashboard
        </p>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">
          Alustetaan Digitaalista Työhuonetta...
        </p>
      </div>

      {/* Skeleton-like bar */}
      <div className="w-64 h-[2px] bg-slate-100 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-blue-600 w-1/3 animate-shimmer" />
      </div>
    </div>
  );
}
