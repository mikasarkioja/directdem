"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Send, 
  ChevronLeft, 
  CheckCircle, 
  Quote, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Loader2
} from "lucide-react";
import type { Bill, VoteStats, UserProfile } from "@/lib/types";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { getVoteStats } from "@/app/actions/votes";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ShadowStatementForm from "@/components/ShadowStatementForm";
import { generateShadowParliamentStatement } from "@/lib/actions/generate-statement";
import { createClient } from "@/lib/supabase/client";

export default function StatementPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.billId as string;
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [stats, setVoteStats] = useState<VoteStats | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSent, setIsSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
          if (profile) setUser(profile as any);
        }

        const allBills = await fetchBillsFromSupabase();
        const currentBill = allBills.find(b => b.id === billId);
        if (currentBill) {
          setBill(currentBill);
          const voteStats = await getVoteStats(billId);
          setVoteStats(voteStats);

          // Fetch AI summary and real comments
          const statementData = await generateShadowParliamentStatement(billId);
          setAiSummary(statementData.summary);
          setComments(statementData.submissions);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [billId]);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setIsSent(true);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-serif">
        <Loader2 className="animate-spin text-slate-400 mr-2" />
        <span className="uppercase tracking-[0.2em] text-xs font-bold text-slate-400">Valmistellaan virallista lausuntoa...</span>
      </div>
    );
  }

  if (!bill) return <div>Esitystä ei löytynyt.</div>;

  return (
    <div className="flex h-screen bg-[#F1F1F1] text-slate-900 overflow-hidden font-serif">
      <Sidebar activeView="bills" setActiveView={() => {}} user={user} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar p-4 md:p-12">
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors group font-sans text-xs font-black uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Takaisin Työhuoneeseen
          </button>

          {/* Shadow MP Form Section */}
          {user && (
            <div className="font-sans mb-12">
              <ShadowStatementForm 
                billId={billId} 
                userId={user.id} 
                onSuccess={async () => {
                  // Reload data to show updated stats and summary
                  const voteStats = await getVoteStats(billId);
                  setVoteStats(voteStats);
                  const statementData = await generateShadowParliamentStatement(billId);
                  setAiSummary(statementData.summary);
                  setComments(statementData.submissions);
                }}
              />
            </div>
          )}

          {/* Paper Document */}
          <div className="bg-[#FCFCF9] shadow-[0_0_50px_rgba(0,0,0,0.1)] border border-slate-200 min-h-[140vh] p-12 md:p-20 relative overflow-hidden">
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-35deg] select-none">
              <span className="text-9xl font-black whitespace-nowrap">DIGITAALINEN KAKSONEN</span>
            </div>

            {/* Official Stamp */}
            <div className="absolute top-12 right-12 border-4 border-rose-900/30 p-4 rounded-xl rotate-[15deg] flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-900/60">Kansan Varjoeduskunta</span>
              <span className="text-lg font-black text-rose-900/80">LAUSUNTO</span>
              <span className="text-[10px] font-bold text-rose-900/60">nro {bill.parliamentId?.split(' ')[1] || '001'}/2026</span>
            </div>

            {/* Document Header */}
            <div className="space-y-12 border-b border-slate-200 pb-12">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest font-black text-slate-400 font-sans">Vastaanottaja: Eduskunta / Valiokuntasihteeristö</p>
                <p className="text-xs uppercase tracking-widest font-black text-slate-400 font-sans">Päiväys: {new Date().toLocaleDateString('fi-FI')}</p>
              </div>

              <h1 className="text-4xl font-black leading-tight text-slate-900 uppercase">
                Lausunto koskien asiaa: <br/>
                <span className="text-2xl mt-4 block normal-case italic font-medium">"{bill.title}"</span>
              </h1>
            </div>

            {/* Summary Section */}
            <div className="py-12 space-y-6 leading-relaxed text-lg text-slate-800 whitespace-pre-wrap">
              <h2 className="text-xl font-black uppercase tracking-tight border-l-4 border-rose-900 pl-4 font-sans mb-8">Varjoeduskunnan analyysi kansan tahdosta</h2>
              {aiSummary || "Analysoidaan kansalaisten vastauksia..."}
            </div>

            {/* Data Visualization */}
            <div className="py-12 space-y-8 bg-slate-50/50 -mx-12 px-12 border-y border-slate-100">
              <h2 className="text-xl font-black uppercase tracking-tight border-l-4 border-rose-900 pl-4 font-sans">Äänten jakautuminen</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Varjoeduskunta (Kansa)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold font-sans">
                      <span>KYLLÄ ({stats?.for_percent || 0}%)</span>
                      <span>EI ({stats?.against_percent || 0}%)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-emerald-600" style={{ width: `${stats?.for_percent || 0}%` }} />
                      <div className="h-full bg-rose-600" style={{ width: `${stats?.against_percent || 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 opacity-60 grayscale">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Oikea Eduskunta (Virallinen)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold font-sans">
                      <span>KYLLÄ (51%)</span>
                      <span>EI (49%)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-800" style={{ width: `51%` }} />
                      <div className="h-full bg-slate-400" style={{ width: `49%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Wall */}
            {comments && comments.length > 0 && (
              <div className="py-12 space-y-8">
                <h2 className="text-xl font-black uppercase tracking-tight border-l-4 border-rose-900 pl-4 font-sans">Asiantuntijalausunnot ja huomiot</h2>
                <div className="grid gap-6">
                  {comments.slice(0, 5).map((c, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm italic text-slate-600 relative group">
                      <Quote className="absolute -top-2 -left-2 text-slate-100 group-hover:text-rose-900/10 transition-colors" size={48} />
                      <p className="relative z-10">"{c.text}"</p>
                      <div className="mt-4 flex items-center gap-2 not-italic font-sans">
                        <div className={`w-1.5 h-1.5 rounded-full ${c.sentiment === 'jaa' ? 'bg-emerald-500' : c.sentiment === 'ei' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anonyymi Kansalainen</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Section */}
            <div className="mt-20 pt-12 border-t border-slate-200 flex flex-col items-center text-center space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 font-sans uppercase tracking-widest">Allekirjoitus: DirectDem Varjoeduskunta</p>
                <p className="text-xs text-slate-400 font-sans">Digitaalisesti varmennettu lausunto</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-sans">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Osallistuminen</p>
                <p className="text-lg font-black text-slate-900">{comments && comments.length > 0 ? comments.length : '12 450'} VARJOKANSANEDUSTAJAA</p>
              </div>
            </div>
          </div>

          {/* Action Button Section (Floating or Bottom) */}
          <div className="flex flex-col items-center pb-20">
            <AnimatePresence mode="wait">
              {!isSent ? (
                <motion.button
                  key="send-btn"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full md:w-auto px-12 py-6 bg-rose-900 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-rose-900/20 hover:bg-rose-800 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-4 group font-sans"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 transition-transform" />}
                  <span>Toimita asiantuntijaryhmälle</span>
                </motion.button>
              ) : (
                <motion.div
                  key="success-msg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500 text-white p-8 rounded-[2.5rem] flex flex-col items-center gap-4 text-center shadow-2xl shadow-emerald-500/20 font-sans"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Lausunto toimitettu</h3>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Siirretty talousvaliokunnan sähköiseen arkistoon</p>
                  </div>
                  <button 
                    onClick={() => router.push('/?view=workspace')}
                    className="mt-4 px-6 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
                  >
                    Palaa työhuoneeseen
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <BottomNav activeView="bills" onViewChange={() => {}} />
    </div>
  );
}
