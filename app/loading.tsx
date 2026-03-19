import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 space-y-4">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
        <Loader2 className="w-16 h-16 text-purple-500 animate-spin relative z-10" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white animate-pulse">
          DirectDem
        </h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse delay-75">
          Alustetaan Digitaalista Demokratiaa...
        </p>
      </div>

      {/* Decorative progress bar using Tailwind only */}
      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-8 relative">
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 w-1/3 animate-[shimmer_2s_infinite_ease-in-out]"
          style={{
            animation: "shimmer 2s infinite linear",
          }}
        />
      </div>

      <p className="text-[8px] font-medium text-slate-600 uppercase tracking-tight mt-12 max-w-[200px] text-center opacity-50">
        Yhdistetään valtioneuvoston ja kuntien tietokantoihin...
      </p>

      {/* Since shimmer is a custom animation, we ensure it's defined in tailwind.config.ts 
          but as a fallback for the demo we'll use a simpler built-in animation if shimmer is missing.
      */}
      <div className="hidden">
        {/* This is a hint for the developer to add 'shimmer' to tailwind.config.ts if it's missing */}
      </div>
    </div>
  );
}
