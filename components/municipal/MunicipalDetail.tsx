"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Zap, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Wind,
  Database
} from "lucide-react";
import ExpertSummary from "../committee/ExpertSummary";
import ShadowPowerMeter from "../dashboard/ShadowPowerMeter";
import { generateMunicipalAiSummary, startDeepAnalysis, fetchEnhancedMunicipalProfile } from "@/app/actions/municipal-ai";
import toast from "react-hot-toast";
import LocalWeather from "../dashboard/LocalWeather";
import { UserProfile, LensMode } from "@/lib/types";

interface MunicipalDetailProps {
  item: any;
  onClose: () => void;
  user?: UserProfile | null;
}

export default function MunicipalDetail({ item, onClose, user }: MunicipalDetailProps) {
  const [localItem, setLocalItem] = useState(item);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);

  // Määritetään linssitila kaupungin nimen perusteella
  const lensMode: LensMode = (item.municipality?.toLowerCase() || "national") as LensMode;

  useEffect(() => {
    async function loadEnhanced() {
      const data = await fetchEnhancedMunicipalProfile(item.id, item.municipality);
      if (data) setEnhancedData(data);
    }
    loadEnhanced();
  }, [item.id, item.municipality]);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await generateMunicipalAiSummary(item.id);
      if (res.success) {
        setLocalItem({ ...localItem, ai_summary: res.analysis });
        toast.success("AI-analyysi päivitetty!");
      } else {
        toast.error("Analyysin luonti epäonnistui.");
      }
    } catch (err) {
      toast.error("Järjestelmävirhe.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeepAnalysis = async () => {
    setDeepLoading(true);
    try {
      const res = await startDeepAnalysis(item.id);
      if (res.success) {
        // Päivitetään tehostettu data visualisointeja varten
        setEnhancedData({ analysis_data: { analysis_depth: res.analysis } });
        
        // TÄRKEÄÄ: Päivitetään paikallinen esitys uudella laajalla tiivistelmällä ja argumenteilla
        setLocalItem((prev: any) => ({
          ...prev,
          ai_summary: {
            ...prev.ai_summary,
            summary: res.analysis.summary,
            pro_arguments: res.analysis.pro_arguments,
            con_arguments: res.analysis.con_arguments,
            attachment_notes: res.analysis.attachment_notes,
            friction_index: res.analysis.friction_index
          }
        }));
        
        toast.success("Syväanalyysi valmistui ja näkymä päivitetty!");
      } else {
        toast.error(res.error || "Syväanalyysi epäonnistui.");
      }
    } catch (err) {
      console.error("Deep analysis error:", err);
      toast.error("Järjestelmävirhe syväanalyysissä.");
    } finally {
      setDeepLoading(false);
    }
  };

  const hasSummary = localItem.ai_summary?.summary || localItem.content_summary;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] relative custom-scrollbar"
      >
        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">{localItem.meeting_title || localItem.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">{localItem.municipality}</p>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em]">City Lens Active</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-12 space-y-12">
          {/* City Lens Context Sector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user && (
              <LocalWeather lens={lensMode} user={user} />
            )}
            <div className="bg-blue-600/5 border border-blue-500/20 rounded-[2rem] p-6 flex flex-col justify-center space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-blue-400">
                <Wind size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">City Lens Analyysi</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tämä näkymä on optimoitu kaupungin <span className="text-blue-400 font-bold">{localItem.municipality}</span> päätöksenteon seurantaan. City Lens suodattaa datasta juuri sinun DNA-profiiliisi vaikuttavat paikalliset tekijät.
              </p>
            </div>
          </div>

          {/* Friction Index & Shadow Power */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(localItem.ai_summary?.friction_index !== undefined || localItem.friction_index !== undefined) && (
              <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner h-full">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Poliittinen Riskikerroin</span>
                    <span className={`text-sm font-black ${
                      (localItem.ai_summary?.friction_index || localItem.friction_index) > 70 ? "text-rose-500" : 
                      (localItem.ai_summary?.friction_index || localItem.friction_index) > 40 ? "text-orange-500" : "text-emerald-500"
                    }`}>
                      {localItem.ai_summary?.friction_index || localItem.friction_index}/100
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-1 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${localItem.ai_summary?.friction_index || localItem.friction_index}%` }}
                      className={`h-full rounded-full ${
                        (localItem.ai_summary?.friction_index || localItem.friction_index) > 70 ? "bg-gradient-to-r from-orange-600 to-rose-600" : 
                        (localItem.ai_summary?.friction_index || localItem.friction_index) > 40 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-emerald-600 to-teal-600"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center p-5 bg-white/5 rounded-3xl border border-white/10 mt-4">
                    <Zap size={24} className={(localItem.ai_summary?.friction_index || localItem.friction_index) > 60 ? "text-orange-500 animate-pulse" : "text-slate-500"} />
                    <span className="text-[9px] font-black uppercase mt-3 text-slate-400 text-center">
                      {(localItem.ai_summary?.friction_index || localItem.friction_index) > 70 ? "KORKEA KITKA" : 
                       (localItem.ai_summary?.friction_index || localItem.friction_index) > 40 ? "KOHTALAINEN" : "MATALA KITKA"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <ShadowPowerMeter
              billId={localItem.id}
              realFor={43} // Mock for municipal (Helsinki has 85 members, 43 is simple majority)
              realAgainst={42}
              context="municipal"
            />
          </div>

          {/* Deep Analysis Results (if exist) */}
          {enhancedData?.analysis_data?.analysis_depth && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-950/50 border border-purple-500/20 rounded-[2.5rem] shadow-inner"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400">
                  <Zap size={14} />
                  Taloudellinen vaikutus
                </div>
                
                <div className="space-y-4">
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Database size={40} className="text-purple-400" />
                    </div>
                    
                    <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">Kustannusarvio (Paikallinen)</p>
                    <p className="text-2xl font-black text-white mb-1">
                      {enhancedData.analysis_data.analysis_depth.economic_impact.total_cost_estimate > 0 
                        ? new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(enhancedData.analysis_data.analysis_depth.economic_impact.total_cost_estimate)
                        : "Selvitetään..."}
                    </p>

                    {/* Per Citizen Calculation (Municipal) */}
                    {enhancedData.analysis_data.analysis_depth.economic_impact.total_cost_estimate > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[9px] font-bold text-blue-400 border border-blue-500/20">
                          {(() => {
                            const pops: any = { "Helsinki": 670000, "Espoo": 310000, "Vantaa": 250000 };
                            const pop = pops[localItem.municipality] || 500000;
                            return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(enhancedData.analysis_data.analysis_depth.economic_impact.total_cost_estimate / pop);
                          })()} / asukas
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium italic">Paikallinen talousvaikutus</p>
                      </div>
                    )}

                    {/* Magnitude Meter - Adapted for Municipal Scale (100k - 100M) */}
                    {enhancedData.analysis_data.analysis_depth.economic_impact.total_cost_estimate > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-600">
                          <span>100k</span>
                          <span>100M</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/5">
                          {[...Array(10)].map((_, i) => {
                            const cost = enhancedData.analysis_data.analysis_depth.economic_impact.total_cost_estimate;
                            const logValue = Math.log10(cost || 1);
                            const threshold = 5 + i * 0.3; // From 100k (10^5) to 100M (10^8) roughly
                            const isActive = logValue >= threshold;
                            return (
                              <div 
                                key={i} 
                                className={`h-full flex-1 rounded-sm transition-all duration-500 ${
                                  isActive 
                                    ? (i > 7 ? 'bg-rose-500' : i > 4 ? 'bg-orange-500' : 'bg-emerald-500') 
                                    : 'bg-white/5'
                                }`} 
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Rahoituslähde</p>
                      <p className="text-[10px] font-bold text-slate-300">{enhancedData.analysis_data.analysis_depth.economic_impact.funding_source}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Budjetti-osuma</p>
                      <p className="text-[10px] font-bold text-slate-300">{enhancedData.analysis_data.analysis_depth.economic_impact.budget_alignment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <Sparkles size={14} />
                  Strateginen analyysi
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Pääasiallinen ajuri</p>
                    <p className="text-xs font-bold text-slate-200">{enhancedData.analysis_data.analysis_depth.strategic_analysis.primary_driver}</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black uppercase text-slate-500">Strategia-yhteensopivuus</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${enhancedData.analysis_data.analysis_depth.strategic_analysis.strategy_match_score}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-blue-400">{enhancedData.analysis_data.analysis_depth.strategic_analysis.strategy_match_score}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                 <div className="space-y-3">
                    <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Voittajat</p>
                    <div className="flex flex-wrap gap-2">
                      {enhancedData.analysis_data.analysis_depth.social_equity.winners.map((w: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-full border border-emerald-500/20">{w}</span>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[8px] font-black uppercase text-rose-500 tracking-widest">Häviäjät</p>
                    <div className="flex flex-wrap gap-2">
                      {enhancedData.analysis_data.analysis_depth.social_equity.losers.map((l: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-bold rounded-full border border-rose-500/20">{l}</span>
                      ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* AI Status / Regenerate */}
          {!localItem.ai_summary?.summary && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[2rem] flex flex-col items-center text-center space-y-4">
              <Sparkles className="text-blue-400 animate-pulse" size={32} />
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-widest text-white">AI-Analyysi puuttuu</h4>
                <p className="text-xs text-slate-400 max-w-xs">Tätä esitystä ei ole vielä analysoitu. Haluatko generoida tekoäly-yhteenvedon nyt?</p>
              </div>
              <button 
                onClick={handleRegenerate}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Analysoidaan..." : "Generoi Analyysi"}
              </button>
            </div>
          )}

          {/* Expert Summary */}
          {hasSummary && (
            <ExpertSummary 
              bill={{
                id: localItem.id,
                title: localItem.meeting_title || localItem.title,
                summary: localItem.ai_summary?.summary || localItem.content_summary,
                status: "decided",
                citizenPulse: { for: 0, against: 0 },
                politicalReality: [],
                ...(localItem.ai_summary || localItem)
              } as any}
              onGiveStatement={() => {}}
            />
          )}

          {/* Additional Info / Attachment Notes */}
          {localItem.ai_summary?.attachment_notes && (
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Info size={14} className="text-blue-400" />
                Huomioita liitteistä
              </h4>
              <p className="text-xs text-slate-400 italic">"{localItem.ai_summary.attachment_notes}"</p>
            </div>
          )}

          {/* External Link */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={handleDeepAnalysis}
              disabled={deepLoading}
              className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-purple-600/20 active:scale-95 disabled:opacity-50"
            >
              {deepLoading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
              {deepLoading ? "Analysoidaan syvältä..." : "Käynnistä Syväanalyysi (Liitteet + Talous)"}
            </button>

            <a 
              href={localItem.external_url || localItem.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all group"
            >
              Lue koko asiakirja
              <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
            
            {localItem.ai_summary?.summary && (
              <button 
                onClick={handleRegenerate}
                disabled={loading}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-400 transition-colors px-4 py-2"
              >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Päivitä analyysi
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

