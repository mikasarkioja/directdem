"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Minus, Loader2, Sparkles, Zap, Users } from "lucide-react";
import { submitVote, getUserVote } from "@/app/actions/votes";
import { createClient } from "@/lib/supabase/client";
import PartyIcon from "./PartyIcon";

interface VoteButtonProps {
  billId: string;
  isMunicipal?: boolean;
  onVoteChange?: () => void;
}

export default function VoteButton({ billId, isMunicipal = false, onVoteChange }: VoteButtonProps) {
  const [userVote, setUserVote] = useState<"for" | "against" | "neutral" | null>(null);
  const [prediction, setPrediction] = useState<"passed" | "rejected" | null>(null);
  const [partyStance, setPartyStance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showImpactAnim, setShowImpactAnim] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUserAndData() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const vote = await getUserVote(billId);
        setUserVote(vote);
        
        const { data: predData } = await supabase
          .from("predictions")
          .select("predicted_outcome")
          .eq("user_id", currentUser.id)
          .eq(isMunicipal ? "municipal_case_id" : "bill_id", billId)
          .single();
        
        if (predData) setPrediction(predData.predicted_outcome as any);

        // Load party stance
        const { data: membership } = await supabase
          .from("party_members")
          .select("party_id, virtual_parties(name)")
          .eq("user_id", currentUser.id)
          .single();
        
        if (membership) {
          setPartyStance({
            name: (membership.virtual_parties as any).name,
            dna: (membership.virtual_parties as any).dna_profile_avg,
            level: (membership.virtual_parties as any).level,
            position: 'against',
            percent: 72
          });
        }
      }
      setLoading(false);
    }
    loadUserAndData();
  }, [billId, isMunicipal]);

  const handleVote = async (position: "for" | "against" | "neutral") => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitVote(billId, position);
      setUserVote(position);
      setShowImpactAnim(true);
      setTimeout(() => setShowImpactAnim(false), 2000);
      if (onVoteChange) onVoteChange();
    } catch (error: any) {
      alert(error.message || "Äänestys epäonnistui");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePredict = async (outcome: "passed" | "rejected") => {
    if (!user) return;
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("predictions")
        .upsert({
          user_id: user.id,
          [isMunicipal ? "municipal_case_id" : "bill_id"]: billId,
          predicted_outcome: outcome,
          created_at: new Date().toISOString()
        });
      if (error) throw error;
      setPrediction(outcome);
    } catch (error: any) {
      alert("Ennustus epäonnistui");
    }
  };

  if (loading) return <Loader2 className="animate-spin text-command-neon" size={20} />;

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showImpactAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: [1, 1.5, 0], opacity: [0, 1, 0], y: -80 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-command-neon p-4 rounded-full shadow-lg">
              <Zap size={24} className="text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Arena — Your Stance</p>
        <div className="flex gap-3">
          {[
            { id: "for", icon: ThumbsUp, label: "Puolesta", color: "emerald" },
            { id: "neutral", icon: Minus, label: "EOS", color: "gray" },
            { id: "against", icon: ThumbsDown, label: "Vastaan", color: "rose" }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleVote(btn.id as any)}
              disabled={submitting}
              className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all ${
                userVote === btn.id
                  ? `bg-command-${btn.color} border-command-${btn.color} text-white shadow-md`
                  : "bg-white border-slate-100 text-slate-400 hover:border-command-neon/30"
              }`}
            >
              <btn.icon size={22} />
              <span className="text-[10px] font-black uppercase">{btn.label}</span>
            </button>
          ))}
        </div>

        {partyStance && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4"
          >
            <PartyIcon dnaProfile={partyStance.dna} level={partyStance.level} size="sm" />
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400">{partyStance.name} Consensus</p>
              <p className="text-[10px] font-bold text-slate-600">
                Puolueesi enemmistö ({partyStance.percent}%) vastustaa tätä esitystä.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles size={14} />
          <p className="text-[10px] font-black uppercase tracking-widest">Prediction — Strategy Analysis</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handlePredict("passed")}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${
              prediction === "passed"
                ? "bg-emerald-50 border-command-emerald text-command-emerald"
                : "bg-slate-50 border-slate-100 text-slate-400 hover:border-command-emerald/30"
            }`}
          >
            Passed
          </button>
          <button
            onClick={() => handlePredict("rejected")}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${
              prediction === "rejected"
                ? "bg-rose-50 border-command-rose text-command-rose"
                : "bg-slate-50 border-slate-100 text-slate-400 hover:border-command-rose/30"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>
    </div>
  );
}
