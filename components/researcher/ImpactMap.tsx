"use client";

import { useState, useEffect } from "react";
import { 
  Network, 
  ChevronRight, 
  ArrowRight, 
  Users, 
  FileText, 
  Target,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImpactAnalysis {
  id: string;
  organization_name: string;
  impact_score: number;
  analysis_summary: string;
  matched_segments: Array<{
    statement_text: string;
    matched_text: string;
    similarity: number;
  }>;
}

interface ImpactMapProps {
  billId: string;
}

export default function ImpactMap({ billId }: ImpactMapProps) {
  const [analyses, setAnalyses] = useState<ImpactAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from database
    // Simulated data for demo
    setTimeout(() => {
      setAnalyses([
        {
          id: "1",
          organization_name: "Elinkeinoelämän keskusliitto EK",
          impact_score: 15.4,
          analysis_summary: "EK onnistui saamaan verovähennysoikeuden pykälään 15, jota ei ollut alkuperäisessä HE:ssä.",
          matched_segments: [
            {
              statement_text: "Vaadimme että yritykset saavat vähentää nämä kulut verotuksessa.",
              matched_text: "Yrityksillä on oikeus vähentää edellä mainitut kulut verovuoden tulosta.",
              similarity: 92
            }
          ]
        },
        {
          id: "2",
          organization_name: "Suomen Ammattiliittojen Keskusjärjestö SAK",
          impact_score: 2.1,
          analysis_summary: "SAK:n vaikutus rajoittui pääasiassa sanamuotojen tarkennuksiin koskien työntekijöiden kuulemista.",
          matched_segments: [
            {
              statement_text: "Työntekijöitä on kuultava aina ennen päätöstä.",
              matched_text: "Työnantajan on varattava työntekijöille tilaisuus tulla kuulluksi.",
              similarity: 78
            }
          ]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [billId]);

  if (loading) {
    return <div className="animate-pulse bg-white/5 h-64 rounded-[2rem]" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Influence Ranking */}
        <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Target className="text-cyan-400" size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Vaikutusvalta-sijoitus</h3>
          </div>

          <div className="space-y-4">
            {analyses.sort((a, b) => b.impact_score - a.impact_score).map((analysis, i) => (
              <div 
                key={analysis.id}
                onClick={() => setSelectedAnalysis(analysis)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedAnalysis?.id === analysis.id 
                    ? "bg-cyan-600/20 border-cyan-500/50 shadow-lg shadow-cyan-600/10" 
                    : "bg-white/5 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-white uppercase">{analysis.organization_name}</span>
                  <span className="text-lg font-black text-cyan-400">{analysis.impact_score}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.impact_score}%` }}
                    className="h-full bg-cyan-500" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-700/20 border border-cyan-500/30 rounded-[2.5rem] p-8 flex flex-col justify-center text-center space-y-4">
          <Network className="text-cyan-400 mx-auto" size={48} />
          <div>
            <h4 className="text-xl font-black uppercase text-white tracking-tighter">Lobbaus-sormenjälki</h4>
            <p className="text-sm text-cyan-100/70 font-medium">Tekoäly on tunnistanut {analyses.length} eri järjestön suoraa vaikutusta tähän lakiin.</p>
          </div>
          <div className="pt-4 flex justify-center gap-4">
            <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
              {analyses.reduce((acc, curr) => acc + curr.matched_segments.length, 0)} Osumaa
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
              High Similarity
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <AnimatePresence mode="wait">
        {selectedAnalysis ? (
          <motion.div
            key={selectedAnalysis.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/80 border border-white/10 rounded-[3rem] p-10 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase text-white tracking-tighter">
                  {selectedAnalysis.organization_name}
                </h3>
                <p className="text-sm text-slate-400 font-medium">{selectedAnalysis.analysis_summary}</p>
              </div>
              <button 
                onClick={() => setSelectedAnalysis(null)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
              >
                Sulje
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2">
                  <FileText size={14} /> Asiantuntijalausunto
                </h4>
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Sparkles size={16} className="text-cyan-500 opacity-50" />
                  </div>
                  {selectedAnalysis.matched_segments.map((seg, i) => (
                    <p key={i} className="text-sm text-slate-300 leading-relaxed italic bg-cyan-500/10 border-l-2 border-cyan-500 p-4 rounded-r-xl">
                      "{seg.statement_text}"
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 flex items-center gap-2">
                  <Target size={14} /> Lopullinen Mietintö
                </h4>
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                  {selectedAnalysis.matched_segments.map((seg, i) => (
                    <div key={i} className="space-y-4">
                      <p className="text-sm text-slate-300 leading-relaxed font-medium bg-purple-500/10 border-l-2 border-purple-500 p-4 rounded-r-xl">
                        "{seg.matched_text}"
                      </p>
                      <div className="flex items-center gap-2 px-4">
                        <span className="text-[9px] font-black text-cyan-400 uppercase">Samankaltaisuus: {seg.similarity}%</span>
                        <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${seg.similarity}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-20 text-center">
            <Users className="text-slate-700 mx-auto mb-4" size={48} />
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Valitse järjestö nähdäksesi tekstivertailun</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

