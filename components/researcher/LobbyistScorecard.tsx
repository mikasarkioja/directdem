"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart2, 
  Lock, 
  FileText, 
  Zap, 
  MessageSquare,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Leaderboard from "./Leaderboard";
import CommitteeHeatmap from "./CommitteeHeatmap";
import { MeetingTimeline } from "./MeetingTimeline";
import { getLobbyistLeaderboard, generateLobbyistReport } from "@/app/actions/lobbyist-stats";
import { getMeetingTimelineData } from "@/app/actions/researcher";
import { LobbyistStats } from "@/lib/types";

interface LobbyistScorecardProps {
  userPlan: string;
}

export default function LobbyistScorecard({ userPlan }: LobbyistScorecardProps) {
  const [stats, setStats] = useState<LobbyistStats[]>([]);
  const [report, setReport] = useState<string>("");
  const [meetingPoints, setMeetingPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // TEMPORARY: Access suspended for testing
  const isLocked = false; // userPlan !== 'researcher' && userPlan !== 'admin';

  useEffect(() => {
    async function loadData() {
      if (isLocked) {
        setLoading(false);
        return;
      }
      
      const [leaderboardData, timelineData] = await Promise.all([
        getLobbyistLeaderboard(),
        getMeetingTimelineData("latest")
      ]);

      setStats(leaderboardData);
      setMeetingPoints(timelineData);
      
      const rep = await generateLobbyistReport(leaderboardData);
      setReport(rep);
      setLoading(false);
    }
    loadData();
  }, [isLocked]);

  if (loading) {
    return <div className="animate-pulse bg-white/5 h-96 rounded-[3rem]" />;
  }

  if (isLocked) {
    return (
      <div className="relative min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        {/* Blurred Background Preview */}
        <div className="absolute inset-0 filter blur-xl opacity-20 pointer-events-none grayscale">
          <div className="grid grid-cols-2 gap-8 p-12">
            <div className="h-64 bg-white/20 rounded-[2rem]" />
            <div className="h-64 bg-white/20 rounded-[2rem]" />
            <div className="h-64 bg-white/20 rounded-[2rem]" />
            <div className="h-64 bg-white/20 rounded-[2rem]" />
          </div>
        </div>

        <div className="relative z-10 max-w-lg mx-auto bg-slate-900/90 border border-white/10 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 bg-cyan-600/20 rounded-3xl flex items-center justify-center mx-auto border border-cyan-500/30">
            <Lock className="text-cyan-400 w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Lobbyist Scorecard</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Analysoi ja visualisoi etujärjestöjen valtaa Suomen päätöksenteossa. Tämä moduuli laskee reaaliaikaisen Vaikutusindeksin tuhansien dokumenttien perusteella.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              "Valiokuntakohtainen Power Matrix",
              "Järjestöjen Vaikutusindeksi (Ranking)",
              "Automaattiset lobbaus-raportit",
              "Historiallinen vertailu (2024-2025)"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-cyan-400 text-left px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                <Sparkles size={12} /> {feature}
              </div>
            ))}
          </div>

          <button className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-3 group">
            Päivitä Tutkija-tasolle
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Report Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-[2.5rem] p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileText size={120} className="text-white" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-cyan-400" size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Automaattinen Analyysi</h3>
          </div>
          <p className="text-2xl font-black text-white leading-tight max-w-3xl italic">
            "{report}"
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
          <Leaderboard stats={stats} />
          <MeetingTimeline points={meetingPoints} />
        </div>
        <div className="lg:col-span-7">
          <CommitteeHeatmap />
        </div>
      </div>
    </div>
  );
}

