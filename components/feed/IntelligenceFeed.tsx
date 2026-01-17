"use client";

import React from 'react';
import { Newspaper, MapPin, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { PoliticalVector } from '@/lib/ai/tagger';
import { calculateFeedRelevance } from '@/lib/feed/relevance';
import { logUserActivity } from '@/app/actions/logUserActivity';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  type: 'news' | 'local';
  link: string;
  tags: string[];
  category?: string;
  political_vector?: PoliticalVector;
}

export function IntelligenceFeed({ items, userDna }: { items: FeedItem[], userDna?: any }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Tänään ${date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
        <p className="text-slate-400 font-bold italic uppercase tracking-widest text-sm">
          Syöte on tyhjä. Ei uusia päivityksiä.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {items.map((item) => {
        const relevance = userDna && item.political_vector 
          ? calculateFeedRelevance(userDna, item.political_vector)
          : null;

        return (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              logUserActivity(item.type === 'news' ? 'NEWS_INTERACTION' : 'READ_LOCAL', {
                id: item.id,
                title: item.title,
                political_vector: item.political_vector
              });
            }}
            className="group block bg-white border border-slate-200 p-6 rounded-2xl hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
          >
            <div className="flex gap-4">
              <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                item.type === 'news' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {item.type === 'news' ? <Newspaper size={20} /> : <MapPin size={20} />}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {item.source}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">•</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  
                  {relevance && (relevance.alignments.length > 0 || relevance.conflicts.length > 0) && (
                    <div className="flex items-center gap-3">
                      {relevance.alignments.length > 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <ShieldCheck size={10} />
                          Sopii profiiliisi: {relevance.alignments[0]}
                        </div>
                      )}
                      {relevance.conflicts.length > 0 && relevance.alignments.length === 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                          <AlertCircle size={10} />
                          Haastaa profiilisi: {relevance.conflicts[0]}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black leading-tight text-slate-900 group-hover:text-purple-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.political_vector && (
                  <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    {Object.entries(item.political_vector).map(([key, val]) => (
                      <div 
                        key={key} 
                        className={`h-full flex-1 ${
                          (val as number) > 0.2 ? 'bg-blue-400' : (val as number) < -0.2 ? 'bg-rose-400' : 'bg-slate-200'
                        }`}
                        title={`${key}: ${val}`}
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {item.category === 'INVESTOINTI' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase tracking-widest">
                      Investointi
                    </span>
                  )}
                  {item.category === 'SÄÄSTÖ' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-black uppercase tracking-widest">
                      Säästö
                    </span>
                  )}
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-tight">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function IntelligenceFeedSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl animate-pulse flex gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
