"use client";

import React, { useState, useMemo } from 'react';
import { IntelligenceFeed, IntelligenceFeedSkeleton } from './IntelligenceFeed';
import { Filter, Sparkles } from 'lucide-react';

export default function IntelligenceFeedWrapper({ initialItems, userDna }: { initialItems: any[], userDna: any }) {
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);

  const filteredItems = useMemo(() => {
    if (!showOnlyRelevant) return initialItems;
    
    // Sort by relevance score if available, or filter out low relevance
    return [...initialItems]
      .filter(item => (item.relevanceScore || 0) > 0.3)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }, [initialItems, showOnlyRelevant]);

  return (
    <section className="space-y-6 pt-10 border-t border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Intelligence Feed</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Live Analysis active
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowOnlyRelevant(!showOnlyRelevant)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            showOnlyRelevant 
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {showOnlyRelevant ? <Sparkles size={14} /> : <Filter size={14} />}
          {showOnlyRelevant ? "Vain relevanteimmat" : "Kaikki uutiset"}
        </button>
      </div>

      <IntelligenceFeed items={filteredItems} userDna={userDna} />
    </section>
  );
}


