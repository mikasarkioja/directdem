"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import ComparisonRadarChart from "./ComparisonRadarChart";
import { generateProfileSummary } from "@/lib/utils/profile-describer";
import { BrainCircuit, Download, Share2, Sparkles, Zap } from "lucide-react";
import * as htmlToImage from "html-to-image";

interface IdentityCardProps {
  userProfile: any;
  harkimoMatch?: number;
}

export default function IdentityCard({ userProfile, harkimoMatch }: IdentityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const scores = {
    economic: userProfile.economic_score || 0,
    liberal: userProfile.liberal_conservative_score || 0,
    env: userProfile.environmental_score || 0,
    urban: userProfile.urban_rural_score || 0,
    global: userProfile.international_national_score || 0,
    security: userProfile.security_score || 0
  };

  const summary = generateProfileSummary(scores);

  const handleDownload = async () => {
    if (cardRef.current) {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#0f172a"
      });
      const link = document.createElement("a");
      link.download = `poliittinen-identiteetti-${userProfile.id.substring(0, 5)}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/vertaa/${userProfile.id}`;
    navigator.clipboard.writeText(url);
    alert("Vertailulinkki kopioitu leikepöydälle!");
  };

  // Dynamic theme based on primary color from summary
  const isPurple = summary.primaryColor === "purple";
  const themeClass = isPurple 
    ? "from-purple-600/20 to-indigo-900/40 border-purple-500/30" 
    : "from-blue-600/20 to-slate-900/40 border-blue-500/30";
  
  const glowClass = isPurple
    ? "shadow-[0_0_30px_rgba(168,85,247,0.15)]"
    : "shadow-[0_0_30px_rgba(59,130,246,0.15)]";

  return (
    <div className="space-y-6">
      <div 
        ref={cardRef}
        className={`relative w-full max-w-md mx-auto aspect-[4/5] bg-slate-900 rounded-[2.5rem] border p-8 overflow-hidden flex flex-col justify-between bg-gradient-to-br ${themeClass} ${glowClass}`}
      >
        {/* Background Decorative elements */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 ${isPurple ? "bg-purple-500" : "bg-blue-500"}`} />
        <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-20 ${isPurple ? "bg-indigo-500" : "bg-cyan-500"}`} />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isPurple ? "bg-purple-500/20 border-purple-400/30" : "bg-blue-500/20 border-blue-400/30"}`}>
                <BrainCircuit size={20} className={isPurple ? "text-purple-400" : "text-blue-400"} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Poliittinen Identiteetti</p>
                <p className="text-xs font-bold text-white/60">DirectDem Civic ID</p>
              </div>
            </div>
            {harkimoMatch !== undefined && (
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Match Harkimoon</p>
                <p className={`text-xl font-black ${isPurple ? "text-purple-400" : "text-blue-400"}`}>{harkimoMatch}%</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-tight">
              {summary.title}
            </h2>
            <div className={`h-1 w-12 rounded-full ${isPurple ? "bg-purple-500" : "bg-blue-500"}`} />
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
            "{summary.description}"
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full h-48 mb-4">
            <ComparisonRadarChart 
              harkimo={scores} 
              target={{ name: "DNA", ...scores }} 
            />
          </div>
          
          <div className="w-full flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">directdem.fi</span>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[10px] font-bold text-white/60">#Demokratia2.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 max-w-md mx-auto">
        <button 
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all border border-white/5"
        >
          <Download size={16} />
          Lataa kuvana
        </button>
        <button 
          onClick={handleShareLink}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
        >
          <Share2 size={16} />
          Jaa vertailu
        </button>
      </div>
    </div>
  );
}


