"use client";

import React, { useState, useEffect } from "react";
import { getUserProfile, createUserProfile, addImpactPoints, initializeResearcherProfile } from "@/app/actions/user-profiles";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { UserProfile, Bill } from "@/lib/types";
import { 
  Loader2, 
  PlusCircle, 
  ShieldAlert, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  Zap, 
  Sparkles,
  Newspaper,
  Bell,
  Home,
  LayoutGrid,
  Terminal,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ShadowIDCard from "@/components/auth/ShadowIDCard";
import ExpertSummary from "@/components/committee/ExpertSummary";
import DNAActivation from "@/components/dashboard/DNAActivation";
import ResearcherProfiling from "@/components/researcher/ResearcherProfiling";
import MunicipalWatchFeed from "@/components/municipal/MunicipalWatchFeed";
import QuickPulse from "@/components/dashboard/QuickPulse";
import LensSwitcher from "@/components/dashboard/LensSwitcher";
import LocalWeather from "@/components/dashboard/LocalWeather";
import MunicipalDetail from "@/components/municipal/MunicipalDetail";
import TransactionFeed from "@/components/dashboard/TransactionFeed";
import ResearcherWorkspace from "@/components/researcher/ResearcherWorkspace";
import PricingTable from "@/components/billing/PricingTable";
import { fetchMunicipalDecisions } from "@/app/actions/municipal";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { LensMode } from "@/lib/types";

interface DashboardClientProps {
  initialUser: UserProfile | null;
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(initialUser);
  const [bills, setBills] = useState<Bill[]>([]);
  const [municipalTasks, setMunicipalTasks] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedMunicipalTask, setSelectedMunicipalTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeView, setActiveView] = useState<"committee" | "kuntavahti" | "economy" | "researcher">("committee");
  const [lens, setLens] = useState<LensMode>("national");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "kuntavahti") {
      setActiveView("kuntavahti");
    } else if (view === "researcher") {
      setActiveView("researcher");
    } else if (view === "economy") {
      setActiveView("economy");
    } else {
      setActiveView("committee");
    }
  }, [searchParams]);
  const [news, setNews] = useState([
    { id: 1, title: "Eduskunta aloitti keskustelun valtion budjetista", time: "10 min sitten" },
    { id: 2, title: "Uusi ympäristölaki herättää vastustusta", time: "45 min sitten" },
    { id: 3, title: "Valiokunnat kokoontuvat tänään kello 12:00", time: "2 tuntia sitten" }
  ]);

  useEffect(() => {
    async function loadData() {
      // Jos meillä on jo profiili ja olemme tutkijanäkymässä, ja profiili on alustettu,
      // voimme ohittaa latauksen jos data on jo olemassa.
      if (profile?.researcher_initialized && activeView === "researcher" && profile.id === initialUser?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);

        if (lens === "national" && activeView !== "researcher") {
          const billsData = await fetchBillsFromSupabase();
          setBills(billsData);
        } else if (lens !== "national") {
          // Map lens to municipality name for query
          const muniName = lens.charAt(0).toUpperCase() + lens.slice(1);
          const tasks = await fetchMunicipalDecisions(muniName);
          setMunicipalTasks(tasks);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    if (initialUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [initialUser, lens, activeView]);

  const handleCreateProfile = async () => {
    setCreating(true);
    try {
      const newProfile = await createUserProfile();
      setProfile(newProfile);
      toast.success("Varjokansanedustajan profiili aktivoitu!");
    } catch (err) {
      console.error("Failed to create profile", err);
      toast.error("Profiilin luonti epäonnistui.");
    } finally {
      setCreating(false);
    }
  };

  const handleGiveStatement = async () => {
    const currentTask = lens === "national" ? selectedBill : selectedMunicipalTask;
    if (!currentTask) return;
    
    // Add points gamification
    try {
      await addImpactPoints(25);
      
      // Update local state for immediate feedback
      setProfile((prev: any) => ({
        ...prev,
        impact_points: (prev.impact_points || 0) + 25
      }));

      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-900 border-2 border-purple-500 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-purple-400 leading-none mb-1">Pisteitä kerätty!</p>
            <p className="text-xl font-black text-white">+25 Vaikuttavuuspistettä</p>
          </div>
        </motion.div>
      ), { duration: 3000 });

    } catch (err) {
      toast.error("Pisteiden päivitys epäonnistui.");
    }
  };

  const handleResearcherProfileComplete = async (data: { type: string; focus: string[] }) => {
    try {
      const res = await initializeResearcherProfile(data);
      if (res.success) {
        // Päivitetään paikallinen tila välittömästi, jotta UI ei hyppää takaisin
        setProfile((prev: any) => ({
          ...(prev || {}),
          researcher_initialized: true,
          researcher_type: data.type,
          researcher_focus: data.focus
        }));
        toast.success("Tutkijaprofiili aktivoitu!");
        
        // Annetaan revalidatePathin vaikuttaa ja haetaan tuore data varmuuden vuoksi
        const freshProfile = await getUserProfile();
        if (freshProfile) setProfile(freshProfile);
      }
    } catch (err) {
      toast.error("Profilointi epäonnistui.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
          Alustetaan Digitaalista Työhuonetta...
        </p>
      </div>
    );
  }

  if (!initialUser) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-3xl border border-white/5 text-center space-y-6 shadow-2xl">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Pääsy evätty</h2>
        <p className="text-slate-400 text-sm">Kirjaudu sisään astuaksesi eduskunnan digitaaliseen kaksoseen.</p>
        <a href="/login" className="block w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all">
          Kirjaudu sisään
        </a>
      </div>
    );
  }

  if (!profile && activeView !== "researcher") {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-12 bg-slate-900 rounded-[3rem] border border-white/10 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
                <PlusCircle className="text-purple-400 w-10 h-10" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Aktivoi Shadow MP -oikeudet</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Varjokansanedustajan Työhuone vaatii profiilin alustamisen. Tämä sijoittaa sinut oikeaan valiokuntaan DNA-profiilisi perusteella.
                </p>
            </div>
            <button 
                onClick={handleCreateProfile}
                disabled={creating}
                className="px-10 py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/30 flex items-center gap-3 mx-auto disabled:opacity-50"
            >
                {creating ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                {creating ? "Aktivoidaan..." : "Aktivoi Digitaalinen ID"}
            </button>
        </div>
      </div>
    );
  }

  const mergedUser: UserProfile = {
    ...initialUser,
    shadow_id_number: profile?.shadow_id_number,
    committee_assignment: profile?.committee_assignment,
    impact_points: profile?.impact_points ?? initialUser.impact_points,
    rank_title: profile?.rank_title ?? initialUser.rank_title,
  };

  const hasDna = (initialUser?.economic_score !== undefined && initialUser?.economic_score !== 0) || 
                 (initialUser?.liberal_conservative_score !== undefined && initialUser?.liberal_conservative_score !== 0);

  return (
    <div className="space-y-8">
      <Toaster position="bottom-center" />
      
      {/* Työhuoneen Navigointipalkki */}
      <div className="flex items-center justify-between bg-slate-900/50 border border-white/5 p-2 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Link href="/" className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <Home size={14} />
            Etusivu
          </Link>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Link href="/?view=bills" className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <LayoutGrid size={14} />
            Moduulit
          </Link>
        </div>
        <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
          {activeView !== "researcher" && (
            <>
              <button 
                onClick={() => setActiveView("committee")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === "committee" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Työhuone
              </button>
              <button 
                onClick={() => setActiveView("kuntavahti")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === "kuntavahti" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Kuntavahti
              </button>
              <button 
                onClick={() => setActiveView("economy")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === "economy" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Talous
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveView("researcher")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === "researcher" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Tutkija
          </button>
        </div>

        <div className="flex items-center gap-4">
          <LensSwitcher currentLens={lens} onLensChange={setLens} />
          <div className="flex items-center gap-2 pr-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              {lens === "national" ? "Valtakunnallinen" : "Kunnallinen"} Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Sidebar: ID Card & Agenda */}
        <aside className="lg:col-span-3 space-y-8">
          {activeView !== "researcher" ? (
            <>
              <ShadowIDCard user={mergedUser} lens={lens} />
              <LocalWeather lens={lens} user={mergedUser} />
              <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Calendar size={14} className="text-purple-500" />
                  Päivän asialista
                </h4>
                <div className="space-y-4">
                  {[
                    { time: "09:00", task: "Valiokunnan istunto" },
                    { time: "12:00", task: "Asiantuntijakuuleminen" },
                    { time: "14:00", task: "Lausunnon valmistelu" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-[9px] font-black text-purple-400 w-8">{item.time}</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{item.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Terminal size={48} className="text-slate-900" />
                </div>
                <div className="space-y-1 relative z-10">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 italic">
                    {profile?.researcher_type ? {
                      academic: "Academic_Terminal",
                      journalist: "Journalist_Console",
                      policy_expert: "Policy_Intelligence",
                      strategist: "Strategy_Monitor"
                    }[profile.researcher_type as string] : "Researcher_ID"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {profile?.researcher_type === 'academic' ? 'Verified Academic Account' : 
                       profile?.researcher_type === 'journalist' ? 'Press Protocol Active' : 'Professional Access'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.researcher_focus?.map((f: string) => (
                      <span key={f} className="px-2 py-0.5 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase border border-slate-100 italic">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Analyses</span>
                      <p className="text-base font-black text-slate-900 leading-none">1,402</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Observations</span>
                      <p className="text-base font-black text-emerald-600 leading-none">84</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-6 shadow-inner">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <Activity size={14} className="text-slate-900" />
                  Behavioral Anomalies
                </h4>
                <div className="space-y-4">
                  {[
                    { type: "Puoluekuri", desc: "KOK ryhmäkurin poikkeava tiivistyminen (Q1)", status: "High" },
                    { type: "Divergenssi", desc: "SDP:n äänestyskäyttäytyminen vs. vaalilupaukset", status: "Alert" },
                    { type: "Lobbaus", desc: "EK:n intensiivinen asiantuntijakuulemisjakso", status: "Active" }
                  ].map((alert, i) => (
                    <div key={i} className="space-y-1 border-l-2 border-slate-200 pl-3 py-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase italic">{alert.type}</span>
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                          alert.status === 'Alert' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                        }`}>{alert.status}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight leading-tight">{alert.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center: Task Stream (Committee Bills) or DNA Activation or Municipal Watch */}
        <main className={`${activeView === "researcher" ? "lg:col-span-9" : "lg:col-span-6"} space-y-8`}>
          {activeView === "researcher" && !profile?.researcher_initialized ? (
            <ResearcherProfiling onComplete={handleResearcherProfileComplete} />
          ) : !hasDna && activeView !== "researcher" ? (
            <DNAActivation />
          ) : (
            <>
              {/* Päivän Pulse - Only visible for non-researchers */}
              {activeView !== "researcher" && <QuickPulse lens={lens} />}

              {activeView === "researcher" ? (
                <ResearcherWorkspace userPlan={mergedUser.plan_type || 'free'} researcherProfile={profile} />
              ) : activeView === "economy" ? (
                <PricingTable userId={mergedUser.id} hasStripeId={!!mergedUser.stripe_customer_id} />
              ) : activeView === "kuntavahti" ? (
                <MunicipalWatchFeed user={mergedUser} />
              ) : lens === "national" ? (
                <>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Tehtävävirta</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valiokunta: {mergedUser.committee_assignment}</p>
                    </div>
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-black uppercase text-purple-400">
                      {bills.length} Esitystä
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedBill && (
                      <motion.div
                        key={selectedBill.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-slate-900/80 border border-white/10 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-2xl backdrop-blur-xl"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[8px] font-black uppercase tracking-widest">
                              {selectedBill.parliamentId || "HE 2024"}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Päivitetty tänään</span>
                          </div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                            {selectedBill.title}
                          </h3>
                        </div>

                        <ExpertSummary bill={selectedBill} onGiveStatement={handleGiveStatement} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bills.filter(b => b.id !== selectedBill?.id).slice(0, 4).map((bill) => (
                      <div 
                        key={bill.id}
                        onClick={() => setSelectedBill(bill)}
                        className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-purple-500/30 transition-all cursor-pointer group"
                      >
                        <p className="text-[8px] font-black uppercase text-slate-600 mb-2">{bill.parliamentId}</p>
                        <h4 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                          {bill.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Paikalliset Päätökset</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kaupunki: {lens.charAt(0).toUpperCase() + lens.slice(1)}</p>
                    </div>
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-black uppercase text-blue-400">
                      {municipalTasks.length} Asiaa
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedMunicipalTask && (
                      <MunicipalDetail 
                        item={selectedMunicipalTask} 
                        onClose={() => setSelectedMunicipalTask(null)} 
                        user={mergedUser}
                      />
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {municipalTasks.filter(t => t.id !== selectedMunicipalTask?.id).slice(0, 4).map((task) => (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedMunicipalTask(task)}
                        className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all cursor-pointer group"
                      >
                        <p className="text-[8px] font-black uppercase text-slate-600 mb-2">{task.proposer || "Kaupunginhallitus"}</p>
                        <h4 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {task.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar: Live News & Notifications */}
        {activeView !== "researcher" && (
          <aside className="lg:col-span-3 space-y-8 h-full flex flex-col">
            <div className="flex-1">
              <TransactionFeed />
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-md">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Newspaper size={16} className="text-purple-500" />
                {lens === "national" ? "Valtakunnallinen Feed" : `${lens.charAt(0).toUpperCase() + lens.slice(1)} Feed`}
              </h4>
              
              <div className="space-y-6">
                {(lens === "national" ? news : [
                  { id: 101, title: `${lens.charAt(0).toUpperCase() + lens.slice(1)}n valtuusto keskusteli kaavoituksesta`, time: "2h sitten" },
                  { id: 102, title: "Paikallinen kouluinvestointi etenee", time: "5h sitten" }
                ]).map((item) => (
                  <div key={item.id} className="space-y-2 relative pl-4 border-l border-purple-500/20">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">{item.time}</p>
                    <p className="text-xs font-bold text-slate-300 tracking-tight leading-snug">{item.title}</p>
                  </div>
                ))}
              </div>

              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">
                Näytä kaikki uutiset
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Bell size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-tight">Pikailmoitus</h4>
                <p className="text-xs font-medium text-white/80 leading-relaxed">Äänestys valiokunnassa alkaa 15 minuutin kuluttua.</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
