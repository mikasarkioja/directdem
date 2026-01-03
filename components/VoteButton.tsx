"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Minus, Loader2, Sparkles, Zap } from "lucide-react";
import { submitVote, getUserVote } from "@/app/actions/votes";
import { createClient } from "@/lib/supabase/client";

interface VoteButtonProps {
  billId: string;
  isMunicipal?: boolean;
  onVoteChange?: () => void;
}

export default function VoteButton({ billId, isMunicipal = false, onVoteChange }: VoteButtonProps) {
  const [userVote, setUserVote] = useState<"for" | "against" | "neutral" | null>(null);
  const [prediction, setPrediction] = useState<"passed" | "rejected" | null>(null);
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
        
        // Load prediction if exists
        const { data: predData } = await supabase
          .from("predictions")
          .select("predicted_outcome")
          .eq("user_id", currentUser.id)
          .eq(isMunicipal ? "municipal_case_id" : "bill_id", billId)
          .single();
        
        if (predData) setPrediction(predData.predicted_outcome as any);
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

  if (loading) return <Loader2 className="animate-spin text-command-neon" />;

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {showImpactAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: [1, 2, 0], opacity: [0, 1, 0], y: -100 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-command-neon p-4 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.8)]">
              <Zap size={32} className="text-command-bg" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-command-gray">The Arena — Sinun äänesi</p>
        <div className="flex gap-2">
          {[
            { id: "for", icon: ThumbsUp, label: "Puolesta", color: "emerald" },
            { id: "neutral", icon: Minus, label: "EOS", color: "gray" },
            { id: "against", icon: ThumbsDown, label: "Vastaan", color: "rose" }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleVote(btn.id as any)}
              disabled={submitting}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                userVote === btn.id
                  ? `bg-command-${btn.color} border-command-${btn.color} text-white shadow-lg shadow-command-${btn.color}/20`
                  : "bg-command-bg border-white/5 text-command-gray hover:border-command-neon/30"
              }`}
            >
              <btn.icon size={20} />
              <span className="text-[10px] font-black uppercase">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-command-rose" />
          <p className="text-[10px] font-black uppercase tracking-widest text-command-gray">Ennustus — Miten uskot päätöksenteon etenevän?</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePredict("passed")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
              prediction === "passed"
                ? "bg-command-emerald/20 border-command-emerald text-command-emerald"
                : "bg-command-bg border-white/5 text-command-gray hover:border-command-emerald/30"
            }`}
          >
            Menee läpi
          </button>
          <button
            onClick={() => handlePredict("rejected")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
              prediction === "rejected"
                ? "bg-command-rose/20 border-command-rose text-command-rose"
                : "bg-command-bg border-white/5 text-command-gray hover:border-command-rose/30"
            }`}
          >
            Hylätään
          </button>
        </div>
      </div>
    </div>
  );
}
