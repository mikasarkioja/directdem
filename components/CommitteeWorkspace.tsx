"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trello, 
  CheckCircle2, 
  Circle, 
  Clock, 
  UserPlus, 
  MessageSquare, 
  Newspaper, 
  ThumbsUp, 
  ThumbsDown,
  ChevronRight,
  Plus,
  Zap,
  Layout,
  FileEdit
} from "lucide-react";
import type { Bill, BillTask, BillAmendment, UserProfile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { generateBillTasks, assignTask, submitAmendment, voteAmendment } from "@/lib/actions/committee-actions";

interface CommitteeWorkspaceProps {
  bill: Bill;
  user: UserProfile;
}

export default function CommitteeWorkspace({ bill, user }: CommitteeWorkspaceProps) {
  const [tasks, setTasks] = useState<BillTask[]>([]);
  const [amendments, setAmendments] = useState<BillAmendment[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'amendments' | 'context'>('tasks');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newAmendment, setNewAmendment] = useState({ section: "", text: "" });

  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    fetchAmendments();

    // Set up real-time subscriptions
    const taskSub = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_tasks' }, () => fetchTasks())
      .subscribe();

    const amendmentSub = supabase
      .channel('amendments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_amendments' }, () => fetchAmendments())
      .subscribe();

    return () => {
      supabase.removeChannel(taskSub);
      supabase.removeChannel(amendmentSub);
    };
  }, [bill.id]);

  const fetchTasks = async () => {
    const { data } = await supabase.from('bill_tasks').select('*').eq('bill_id', bill.id);
    if (data) setTasks(data);
  };

  const fetchAmendments = async () => {
    const { data } = await supabase.from('bill_amendments').select('*').eq('bill_id', bill.id).order('created_at', { ascending: false });
    if (data) setAmendments(data);
  };

  const handleGenerateTasks = async () => {
    setLoadingTasks(true);
    await generateBillTasks(bill.id, bill.title, bill.summary);
    await fetchTasks();
    setLoadingTasks(false);
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
      {/* Header Tabs */}
      <div className="flex border-b border-white/5 bg-white/5 p-2">
        {(['tasks', 'amendments', 'context'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-500 hover:text-white"
            }`}
          >
            {tab === 'tasks' && <Trello size={14} />}
            {tab === 'amendments' && <FileEdit size={14} />}
            {tab === 'context' && <Newspaper size={14} />}
            {tab === 'tasks' ? 'Tehtävätaulu' : tab === 'amendments' ? 'Muutosehdotukset' : 'Tietovirta'}
          </button>
        ))}
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Analyysitehtävät</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilkottu AI:n avulla pieniin osiin</p>
                </div>
                {tasks.length === 0 && (
                  <button 
                    onClick={handleGenerateTasks}
                    disabled={loadingTasks}
                    className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {loadingTasks ? <Clock className="animate-spin" size={14} /> : <Zap size={14} />}
                    Luo tehtävät
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['todo', 'in_progress', 'completed'].map((status) => (
                  <div key={status} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {status === 'todo' ? 'Jonossa' : status === 'in_progress' ? 'Työn alla' : 'Valmis'}
                      </span>
                      <span className="text-[10px] font-black text-slate-700 bg-white/5 px-2 py-0.5 rounded-full">
                        {tasks.filter(t => t.status === status).length}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[200px] bg-black/20 rounded-[2rem] p-3 border border-white/5">
                      {tasks.filter(t => t.status === status).map((task) => (
                        <div key={task.id} className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl space-y-3 group hover:border-purple-500/30 transition-all">
                          <h4 className="text-[11px] font-black uppercase text-white leading-tight">{task.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{task.description}</p>
                          {status === 'todo' && (
                            <button 
                              onClick={() => assignTask(task.id, user.id)}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-500 hover:bg-purple-600 hover:text-white transition-all"
                            >
                              <UserPlus size={10} /> Ota tehtävä
                            </button>
                          )}
                          {status === 'in_progress' && task.assigned_to === user.id && (
                            <button className="w-full py-2 bg-emerald-600/20 text-emerald-400 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                              Merkitse valmiiksi
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'amendments' && (
            <motion.div 
              key="amendments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Proposed list */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Aktiiviset Ehdotukset</h3>
                  <div className="space-y-4">
                    {amendments.map((am) => (
                      <div key={am.id} className="bg-slate-800/30 border border-white/5 p-6 rounded-[2rem] space-y-4 relative overflow-hidden group">
                        {am.status === 'accepted' && <div className="absolute top-0 right-0 p-2 bg-emerald-500 text-[8px] font-black text-white uppercase tracking-widest">Hyväksytty lausuntoon</div>}
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[8px] font-black uppercase rounded">{am.section_title}</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Kirjoittanut Varjo-MP</span>
                        </div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{am.proposed_text}"</p>
                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                          <button 
                            onClick={() => voteAmendment(am.id, user.id, 'pro')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            <ThumbsUp size={12} /> {am.votes_for}
                          </button>
                          <button 
                            onClick={() => voteAmendment(am.id, user.id, 'con')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <ThumbsDown size={12} /> {am.votes_against}
                          </button>
                          <div className="flex-1 text-right">
                            <span className="text-[10px] font-black text-slate-600 uppercase">
                              {(am.votes_for + am.votes_against) > 0 ? Math.round((am.votes_for / (am.votes_for + am.votes_against)) * 100) : 0}% kannatus
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New proposal form */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Ehdot uusi pykälämuutos</h3>
                  <div className="bg-purple-600/5 border border-purple-500/20 p-8 rounded-[2.5rem] space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pykälä tai momentti</label>
                      <input 
                        value={newAmendment.section}
                        onChange={e => setNewAmendment({...newAmendment, section: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-purple-500 outline-none"
                        placeholder="esim. 1 §"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ehdotettu sanamuoto</label>
                      <textarea 
                        value={newAmendment.text}
                        onChange={e => setNewAmendment({...newAmendment, text: e.target.value})}
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-purple-500 outline-none"
                        placeholder="Kirjoita uusi sanamuoto tähän..."
                      />
                    </div>
                    <button 
                      onClick={() => {
                        submitAmendment(bill.id, newAmendment.section, newAmendment.text, user.id);
                        setNewAmendment({ section: "", text: "" });
                      }}
                      className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20"
                    >
                      Lähetä ehdotus äänestykseen
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'context' && (
            <motion.div 
              key="context"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 p-6 bg-blue-500/5 border border-blue-500/20 rounded-[2rem]">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Radio size={24} className="text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">Live Context Stream</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Eduskunnan API & uutisvirta</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* News placeholder */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Uutisotsikot</h4>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                      <p className="text-xs font-bold text-white leading-snug">Asiantuntijat varoittavat lain taloudellisista riskeistä...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[8px] font-black text-blue-400 uppercase">Yle Uutiset</span>
                        <span className="text-[8px] text-slate-600 uppercase">2 tuntia sitten</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expert statements placeholder */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Valiokunnan asiantuntijalausunnot</h4>
                  {[1, 2].map(i => (
                    <div key={i} className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">🏛️</div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Professori X, HY</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">"Esitys on perustuslain näkökulmasta ongelmallinen, koska se ei huomioi..."</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

