"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Edit3, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  History,
  CheckCircle2,
  XCircle,
  Wand2
} from "lucide-react";
import type { Bill, BillSection, BillAmendment, UserProfile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatLegalLanguage, proposeSectionEdit, voteSectionAmendment, ensureBillSections } from "@/lib/actions/clause-actions";
import ClauseDiffView from "./ClauseDiffView";

interface ClauseEditorProps {
  bill: Bill;
  user: UserProfile;
}

export default function ClauseEditor({ bill, user }: ClauseEditorProps) {
  const [sections, setSections] = useState<BillSection[]>([]);
  const [amendments, setAmendments] = useState<BillAmendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<BillSection | null>(null);
  const [proposal, setProposal] = useState({ text: "", justification: "" });
  const [isFormatting, setIsFormatting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    init();
    
    const sectionSub = supabase.channel('sections-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_sections' }, () => fetchSections())
      .subscribe();
      
    const amendmentSub = supabase.channel('amendments-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_amendments' }, () => fetchAmendments())
      .subscribe();

    return () => {
      supabase.removeChannel(sectionSub);
      supabase.removeChannel(amendmentSub);
    };
  }, [bill.id]);

  const init = async () => {
    setLoading(true);
    await ensureBillSections(bill.id, bill.summary || "Lain teksti puuttuu.");
    await Promise.all([fetchSections(), fetchAmendments()]);
    setLoading(false);
  };

  const fetchSections = async () => {
    const { data } = await supabase.from('bill_sections').select('*').eq('bill_id', bill.id).order('order_index');
    if (data) setSections(data);
  };

  const fetchAmendments = async () => {
    const { data } = await supabase.from('bill_amendments').select('*').eq('bill_id', bill.id).order('created_at', { ascending: false });
    if (data) setAmendments(data);
  };

  const handleFormat = async () => {
    setIsFormatting(true);
    const formatted = await formatLegalLanguage(proposal.text);
    setProposal({ ...proposal, text: formatted });
    setIsFormatting(false);
  };

  const handleSubmit = async () => {
    if (!editingSection) return;
    await proposeSectionEdit(
      editingSection.id, 
      bill.id, 
      proposal.text, 
      proposal.justification, 
      user.id, 
      editingSection.section_number
    );
    setEditingSection(null);
    setProposal({ text: "", justification: "" });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Lain Pykälä-editori</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yhteisöllinen muokkaus ja katselmointi</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5">
          <History size={14} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase text-slate-400">Versio 1.4 (Draft)</span>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-900 border border-white/5 rounded-3xl animate-pulse" />)
        ) : (
          sections.map((section) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group"
            >
              <div className="p-8 flex flex-col md:flex-row gap-8">
                {/* Section Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase rounded-xl">
                        {section.section_number}
                      </span>
                      <h4 className="text-sm font-black uppercase text-white tracking-tight">{section.title}</h4>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingSection(section);
                        setProposal({ text: section.content, justification: "" });
                      }}
                      className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-purple-400 hover:border-purple-500/30 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>

                  <ClauseDiffView original={section.content} modified={section.current_shadow_text || null} />
                </div>

                {/* Amendments Sidebar */}
                <div className="w-full md:w-80 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Ehdotukset ({amendments.filter(a => a.section_id === section.id).length})</span>
                    <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
                      {expandedSection === section.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {amendments.filter(a => a.section_id === section.id).slice(0, expandedSection === section.id ? 10 : 2).map((am) => (
                      <div key={am.id} className="p-4 bg-black/20 border border-white/5 rounded-2xl space-y-3 group/am">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] text-slate-400 italic line-clamp-2">"{am.proposed_text}"</p>
                          {am.status === 'accepted' ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> : <Clock size={12} className="text-slate-600 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => voteSectionAmendment(am.id, user.id, 'pro')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/20 border border-emerald-500/10 rounded-lg text-emerald-400 text-[8px] font-black"
                          >
                            <ThumbsUp size={10} /> {am.votes_for}
                          </button>
                          <button 
                            onClick={() => voteSectionAmendment(am.id, user.id, 'con')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-500/5 hover:bg-rose-500/20 border border-rose-500/10 rounded-lg text-rose-400 text-[8px] font-black"
                          >
                            <ThumbsDown size={10} /> {am.votes_against}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Proposal Modal */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-[8px] font-black uppercase">Muokkaus: {editingSection.section_number}</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Ehdota Muutosta</h3>
                  </div>
                  <button onClick={() => setEditingSection(null)} className="p-2 text-slate-500 hover:text-white">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ehdotettu teksti</label>
                      <button 
                        onClick={handleFormat}
                        disabled={isFormatting}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all disabled:opacity-50"
                      >
                        {isFormatting ? <Wand2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                        Muotoile lakikielellä (AI)
                      </button>
                    </div>
                    <textarea 
                      value={proposal.text}
                      onChange={e => setProposal({ ...proposal, text: e.target.value })}
                      className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-xs text-white focus:border-purple-500 outline-none font-serif leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Perustelut muutokselle</label>
                    <textarea 
                      value={proposal.justification}
                      onChange={e => setProposal({ ...proposal, justification: e.target.value })}
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-6 text-xs text-white focus:border-purple-500 outline-none"
                      placeholder="Miksi tämä muutos on tarpeellinen?"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingSection(null)}
                    className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-white/10 transition-all"
                  >
                    Peruuta
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-500 shadow-xl shadow-purple-600/20 transition-all"
                  >
                    Lähetä Ehdotus
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

