"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ComparisonRadarChart from "@/components/ComparisonRadarChart";
import IdentityCard from "@/components/IdentityCard";
import { generateProfileSummary } from "@/lib/utils/profile-describer";
import { getHarkimoMatches, findMatchesForScores, type HarkimoMatchResult, type MPMatch } from "@/lib/actions/harkimo-match";
import { 
  Sparkles, BrainCircuit, Share2, Download, 
  ArrowRight, User, Activity, Loader2, Play
} from "lucide-react";
import Link from "next/link";

export default function TestiTulokset() {
  const [scores, setScores] = useState<any>(null);
  const [matchData, setMatchData] = useState<{ topMatches: MPMatch[]; bottomMatches: MPMatch[]; partyAnalysis: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("dna_test_results");
    if (!saved) {
      router.push("/testi");
      return;
    }
    const parsedScores = JSON.parse(saved);
    setScores(parsedScores);

    // Fetch matches for these SPECIFIC scores
    const fetchMatch = async () => {
      try {
        const result = await findMatchesForScores({
          economic: parsedScores.economic_score,
          liberal: parsedScores.liberal_conservative_score,
          env: parsedScores.environmental_score,
          urban: parsedScores.urban_rural_score,
          global: parsedScores.international_national_score,
          security: parsedScores.security_score
        });
        setMatchData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [router]);

  if (loading || !scores) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
        <p className="text-white font-black uppercase tracking-widest text-xs">Valmistellaan profiiliasi...</p>
      </div>
    );
  }

  const mappedScores = {
    economic: scores.economic_score,
    liberal: scores.liberal_conservative_score,
    env: scores.environmental_score,
    urban: scores.urban_rural_score,
    global: scores.international_national_score,
    security: scores.security_score
  };

  const summary = generateProfileSummary(mappedScores);
  const topMatch = matchData?.topMatches?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <div className="max-w-4xl mx-auto p-6 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 pt-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex p-4 rounded-3xl bg-purple-500/10 text-purple-400 mb-4"
          >
            <BrainCircuit size={48} />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
            Poliittinen <span className="text-purple-500">DNA-Profiilisi</span>
          </h1>
          <div className="flex justify-center gap-2">
            <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
              #Demokratia2.0
            </span>
            <span className="px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400">
              {summary.title}
            </span>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart Section */}
          <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
            <div className="flex items-center gap-2 text-purple-400">
              <Activity size={18} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">DNA-Analyysi</h3>
            </div>
            <div className="aspect-square">
              <ComparisonRadarChart 
                harkimo={mappedScores} 
                target={{ name: "Kansalainen", ...mappedScores }} 
              />
            </div>
          </div>

          {/* Archetype & Match Section */}
          <div className="space-y-8">
            <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles size={18} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Poliittinen Arkkityyppi</h3>
              </div>
              <h4 className="text-3xl font-black uppercase tracking-tight text-white">{summary.title}</h4>
              <p className="text-slate-400 font-medium leading-relaxed italic italic">
                "{summary.description}"
              </p>
            </div>

            {topMatch && (
              <div className="bg-gradient-to-br from-purple-600/20 to-indigo-900/20 border border-purple-500/30 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <User size={48} className="text-purple-500/20 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Poliittinen Kaimasi</p>
                  <h4 className="text-2xl font-black uppercase tracking-tight text-white">{topMatch.full_name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase">{topMatch.party}</p>
                </div>
                <div className="flex items-end justify-between pt-4">
                  <div className="text-4xl font-black text-white italic">
                    {topMatch.compatibility}% <span className="text-sm font-bold uppercase tracking-widest text-slate-500 not-italic">Match</span>
                  </div>
                  <Link href="/?view=bills" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Card Section */}
        <div className="relative group max-w-lg mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-slate-900 rounded-[2.5rem] border border-white/5 p-10 space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter">DNA-Passi</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Lataa ja jaa tuloksesi somessa</p>
            </div>
            <IdentityCard userProfile={{ id: 'test-user', ...scores }} />
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-6 pt-12">
          <Link 
            href="/?view=bills"
            className="px-12 py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-purple-600/20 flex items-center gap-3"
          >
            <Play size={16} fill="currentColor" />
            Jatka äänestysareenalle
          </Link>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Jokainen ääni tarkentaa profiiliasi
          </p>
        </div>
      </div>
    </div>
  );
}

