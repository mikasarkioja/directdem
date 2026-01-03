"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, BrainCircuit, Loader2, Sparkles, 
  CheckCircle2, AlertTriangle, ChevronRight 
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ManifestoDiff from "@/components/ManifestoDiff";
import PartyEvolution from "@/components/PartyEvolution";
import { createClient } from "@/lib/supabase/client";
import { triggerManifestoLearning, voteOnManifestoUpdate, getManifestoHistory } from "@/app/actions/manifesto-engine";
import type { UserProfile, VirtualParty } from "@/lib/types";

export default function PartyUpdatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [party, setParty] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
        setUser(profile as any);
      }

      const { data: partyData } = await supabase
        .from("virtual_parties")
        .select("*")
        .eq("id", id)
        .single();
      
      setParty(partyData);
      
      const historyData = await getManifestoHistory(id as string);
      setHistory(historyData);
      
      setLoading(false);
    }
    load();
  }, [id]);

  const handleTriggerLearning = async () => {
    setIsUpdating(true);
    try {
      const res = await triggerManifestoLearning(id as string);
      setMessage({ type: 'success', text: res.message });
      // Refresh party data
      const supabase = createClient();
      const { data } = await supabase.from("virtual_parties").select("*").eq("id", id).single();
      setParty(data);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVote = async (approve: boolean) => {
    setIsVoting(true);
    try {
      await voteOnManifestoUpdate(id as string, approve);
      setMessage({ type: 'success', text: "Äänesi on rekisteröity!" });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-command-neon" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-command-dark overflow-hidden">
      <Sidebar activeView="parties" setActiveView={() => {}} user={user} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 md:p-10 pb-32">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-command-dark transition-colors font-bold uppercase text-[10px] tracking-widest"
            >
              <ArrowLeft size={14} />
              Takaisin
            </button>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <BrainCircuit size={14} className="text-command-neon" />
              Manifesto Learning Engine v1.0
            </div>
          </div>

          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-black uppercase tracking-tighter text-command-dark">
                {party?.name} <span className="text-command-neon">Evoluutio</span>
              </h1>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Virtuaalipuolueen jatkuva oppiminen ja sopeutuminen</p>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl border-2 flex items-center gap-4 ${
                  message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                <p className="text-sm font-black uppercase tracking-tight">{message.text}</p>
              </motion.div>
            )}

            {/* Current Status */}
            {party?.pending_update_text ? (
              <ManifestoDiff 
                oldManifesto={party.manifesto}
                newManifesto={party.pending_update_text}
                reasoning={party.pending_update_reasoning}
                onApprove={() => handleVote(true)}
                onReject={() => handleVote(false)}
                isVoting={isVoting}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center space-y-8 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Sparkles size={40} />
                </div>
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Kaikki ajan tasalla</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Puolueen manifesti vastaa tällä hetkellä jäsenten äänestyskäyttäytymistä ja uutisvirtaa. Voit manuaalisesti käynnistää analyysin alta.
                  </p>
                </div>
                <button
                  onClick={handleTriggerLearning}
                  disabled={isUpdating}
                  className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all mx-auto shadow-xl disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                  Käynnistä AI-Analyysi
                </button>
              </div>
            )}

            <PartyEvolution history={history} />
          </div>
        </div>
      </main>
      <BottomNav activeView="parties" onViewChange={() => {}} />
    </div>
  );
}

