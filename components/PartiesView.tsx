"use client";

import { useState, useEffect } from "react";
import { getPartiesWithMatches, createParty, joinParty } from "@/app/actions/parties";
import type { VirtualParty, UserProfile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Target, TrendingUp, Shield, Zap, Search, MessageSquare, Loader2, Info } from "lucide-react";
import PartyIcon from "./PartyIcon";

interface PartiesViewProps {
  user: UserProfile | null;
}

export default function PartiesView({ user }: PartiesViewProps) {
  const [parties, setParties] = useState<VirtualParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getPartiesWithMatches();
      setParties(data as any);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setSubmitting(true);
    try {
      await createParty(newName);
      const data = await getPartiesWithMatches();
      setParties(data as any);
      setIsCreating(false);
      setNewName("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (partyId: string) => {
    try {
      await joinParty(partyId);
      const data = await getPartiesWithMatches();
      setParties(data as any);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-command-neon" size={32} /></div>;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-command-dark">Virtual Factions</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Löydä heimosi ja kasvata yhteistä vaikutusvaltaa</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-command-neon text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
        >
          <Plus size={16} />
          Perusta Puolue
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl"
          >
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Puolueen Nimi</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Esim. Faktantarkistajien Liitto"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:border-command-neon outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={submitting} className="flex-1 bg-command-dark text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest">
                  {submitting ? "Analysoidaan..." : "Luo Manifesti AI:lla"}
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">Peruuta</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {parties.map((party, index) => (
          <motion.div 
            key={party.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-blue-50 text-command-neon px-3 py-1 rounded-full text-[10px] font-black border border-blue-100">
                Match: {party.matchScore}%
              </div>
            </div>

            <div className="flex items-center gap-6 mb-8">
              <PartyIcon dnaProfile={party.dna_profile_avg} level={party.level} size="lg" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-command-dark">{party.name}</h3>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  <span className="text-command-neon">Level {party.level}</span>
                  <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                  <span>{party.memberCount} Citizens</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {party.manifesto?.split("\n").map((line, i) => (
                <p key={i} className={`text-xs ${line.startsWith("-") ? "text-slate-600 font-bold ml-2" : "text-slate-500 font-medium"} leading-relaxed`}>
                  {line}
                </p>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] font-black uppercase text-slate-400">Puolueen Vaikuttavuus (Team XP)</span>
                <span className="text-[9px] font-black text-command-dark">{party.total_xp} XP</span>
              </div>
              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-command-neon" style={{ width: `${(party.total_xp % 100)}%` }} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex gap-4">
              <button 
                onClick={() => handleJoin(party.id)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-command-dark transition-all"
              >
                Liity Liittoumaan
              </button>
              <button className="bg-command-dark text-white px-4 py-3 rounded-xl">
                <MessageSquare size={16} />
              </button>
            </div>
            
            {party.level >= 5 && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <TrendingUp size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Varjoraportit Avattu</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-command-neon shrink-0 shadow-sm">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-command-dark mb-1">Miksi liittyä puolueeseen?</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Virtuaalipuolueet antavat äänellesi enemmän painoarvoa. Kun saavutatte tason 5, puolueenne voi lähettää virallisia 'Varjoraportteja' suoraan eduskunnan valiokunnille ja kaupunginhallitukselle.
          </p>
        </div>
      </div>
    </div>
  );
}

