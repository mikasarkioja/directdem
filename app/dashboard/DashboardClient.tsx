"use client";

import React, { useState, useEffect } from "react";
import {
  getUserProfile,
  createUserProfile,
  addImpactPoints,
  initializeResearcherProfile,
  switchUserRole,
} from "@/app/actions/user-profiles";
import { upsertUserProfile } from "@/app/actions/auth";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { UserProfile, Bill } from "@/lib/types";
import {
  Loader2,
  PlusCircle,
  ShieldAlert,
  Briefcase,
  UserCircle,
  Calendar,
  ChevronRight,
  Zap,
  Sparkles,
  Newspaper,
  Bell,
  Home,
  LayoutGrid,
  Terminal,
  Activity,
  MapPin,
  User,
  Radar,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ShadowIDCard from "@/components/auth/ShadowIDCard";
import ExpertSummary from "@/components/committee/ExpertSummary";
import DNAActivation from "@/components/dashboard/DNAActivation";
import ResearcherProfiling from "@/components/researcher/ResearcherProfiling";
import MunicipalWatchFeed from "@/components/municipal/MunicipalWatchFeed";
import MediaWatchPanel from "@/components/dashboard/MediaWatchPanel";
import CitizenRealmBar from "@/components/dashboard/CitizenRealmBar";
import CitizenBillMediaStrip from "@/components/dashboard/CitizenBillMediaStrip";
import QuickPulse from "@/components/dashboard/QuickPulse";
import LensSwitcher from "@/components/dashboard/LensSwitcher";
import LocalWeather from "@/components/dashboard/LocalWeather";
import MunicipalDetail from "@/components/municipal/MunicipalDetail";
import TransactionFeed from "@/components/dashboard/TransactionFeed";
import ResearcherWorkspace from "@/components/researcher/ResearcherWorkspace";
import PricingTable from "@/components/billing/PricingTable";
import InfluenceStats from "@/components/dashboard/InfluenceStats";
import { fetchMunicipalDecisions } from "@/app/actions/municipal";
import toast, { Toaster } from "react-hot-toast";
import { getCombinedNews, NewsItem } from "@/app/actions/news";
import { logUserActivity } from "@/app/actions/logUserActivity";
import { useSearchParams } from "next/navigation";
import { LensMode } from "@/lib/types";
import { FEATURES, isFeatureEnabled } from "@/lib/config/features";

interface DashboardClientProps {
  initialUser: UserProfile | null;
  prefetchedBills?: Bill[];
  prefetchedMunicipalTasks?: any[];
  prefetchedStats?: any;
  /** `researcher` = vain DNA / tutkija-työtila (erillinen reitti) */
  pageVariant?: "dashboard" | "researcher";
}

export default function DashboardClient({
  initialUser,
  prefetchedBills = [],
  prefetchedMunicipalTasks = [],
  prefetchedStats = null,
  pageVariant = "dashboard",
}: DashboardClientProps) {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(
    initialUser || {
      active_role: "citizen",
      is_guest: true,
      full_name: "Vieraileva Kansalainen",
      xp: 0,
      level: 1,
      impact_points: 0,
    },
  );
  const [bills, setBills] = useState<Bill[]>(prefetchedBills);
  const [municipalTasks, setMunicipalTasks] = useState<any[]>(
    prefetchedMunicipalTasks,
  );
  const [selectedBill, setSelectedBill] = useState<Bill | null>(
    prefetchedBills[0] || null,
  );
  const [selectedMunicipalTask, setSelectedMunicipalTask] = useState<any>(
    prefetchedMunicipalTasks[0] || null,
  );
  const [loading, setLoading] = useState(false); // Default to false since we have prefetched data
  const [creating, setCreating] = useState(false);
  /** Kansalainen = kevyt selaus; committee = edustajan työtila (analyysit, media, talous). */
  const [workspace, setWorkspace] = useState<
    "citizen" | "committee" | "researcher"
  >(() => (pageVariant === "researcher" ? "researcher" : "citizen"));
  const [citizenRealm, setCitizenRealm] = useState<"parliament" | "municipal">(
    "parliament",
  );
  const [committeePanel, setCommitteePanel] = useState<
    "desk" | "media_watch" | "economy"
  >("desk");
  const [lens, setLens] = useState<LensMode>("national");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [newName, setNewName] = useState("");

  const hasDna =
    profile?.economic_score !== undefined && profile?.economic_score !== null;

  const getBillSignals = (bill: Bill) => {
    const totalSeats =
      bill.politicalReality?.reduce((sum, p) => sum + p.seats, 0) || 0;
    const forSeats =
      bill.politicalReality
        ?.filter((p) => p.position === "for")
        .reduce((sum, p) => sum + p.seats, 0) || 0;
    const politicalPassPercent =
      totalSeats > 0 ? Math.round((forSeats / totalSeats) * 100) : 50;
    const passProbability = Math.max(5, Math.min(95, politicalPassPercent));
    const lobbyIndex = Math.max(
      0,
      Math.min(100, Math.round(100 - Math.abs(50 - passProbability) * 1.5)),
    );
    return { passProbability, lobbyIndex };
  };

  const getCitizenImpactText = (bill: Bill) => {
    const category = (bill.category || "").toLowerCase();
    if (category.includes("tax") || category.includes("vero")) {
      return "Tama laki voi vaikuttaa verotukseesi ja kotitaloutesi kuukausikuluihin.";
    }
    if (
      category.includes("social") ||
      category.includes("sosiaali") ||
      category.includes("health")
    ) {
      return "Tama laki voi vaikuttaa arjen palveluihin, kuten hyvinvointiin ja tukeen.";
    }
    return "Tama laki voi vaikuttaa arkeesi, palveluihin tai kustannuksiin tulevina kuukausina.";
  };

  useEffect(() => {
    // Show name prompt if user is logged in but name is just email or default
    if (initialUser && !initialUser.is_guest) {
      const currentName = profile?.full_name || initialUser.full_name;
      const isDefaultName =
        !currentName ||
        currentName.includes("@") ||
        currentName === "Uusi käyttäjä";

      if (isDefaultName && !localStorage.getItem("name_prompt_dismissed")) {
        setShowNamePrompt(true);
        setNewName(initialUser.email?.split("@")[0] || "");
      }
    }
  }, [initialUser, profile]);

  useEffect(() => {
    if (pageVariant === "researcher") {
      return;
    }
    const view = searchParams.get("view");
    if (view === "kuntavahti") {
      setWorkspace("citizen");
      setCitizenRealm("municipal");
      return;
    }
    if (view === "media_watch") {
      setWorkspace("committee");
      setCommitteePanel("media_watch");
      return;
    }
    if (view === "economy") {
      setWorkspace("committee");
      setCommitteePanel("economy");
      return;
    }
    if (view === "committee" || view === "edustaja" || view === "shadow") {
      setWorkspace("committee");
      setCommitteePanel("desk");
      return;
    }
    setWorkspace("citizen");
    setCitizenRealm("parliament");
  }, [searchParams, pageVariant]);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    async function loadNews() {
      const feedLens =
        workspace === "citizen" && citizenRealm === "parliament"
          ? "national"
          : lens;
      const newsData = await getCombinedNews(feedLens);
      setNews(newsData);
    }
    loadNews();
  }, [lens, workspace, citizenRealm]);

  useEffect(() => {
    // Check if DNA was just completed (fallback for slow DB sync)
    async function syncLocalDna() {
      if (!hasDna) {
        const saved = localStorage.getItem("dna_test_results");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            console.log("[Dashboard] Found local DNA results, updating UI...");
            setProfile((prev: any) => ({
              ...prev,
              ...parsed,
            }));

            // Jos ollaan kirjautuneita, yritetään tallentaa DB:hen jos sieltä puuttui
            if (initialUser && !initialUser.is_guest) {
              console.log("[Dashboard] Syncing local DNA to database...");
              const { saveDNATestResults } = await import("@/app/actions/dna");
              await saveDNATestResults(parsed);
              toast.success("DNA-profiili synkronoitu tilillesi!");
            }
          } catch (e) {
            console.error("Failed to parse local DNA results", e);
          }
        }
      }
    }
    syncLocalDna();
  }, [hasDna, initialUser]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        console.log(
          `[Dashboard] Loading lens: ${lens}, workspace: ${workspace}, realm: ${citizenRealm}, panel: ${committeePanel}`,
        );
        if (initialUser) {
          const profileData = await getUserProfile();
          setProfile(profileData);
        }

        const needsNationalBills =
          (workspace === "citizen" && citizenRealm === "parliament") ||
          (workspace === "committee" &&
            committeePanel === "desk" &&
            lens === "national");

        const needsMunicipalGrid =
          workspace === "committee" &&
          committeePanel === "desk" &&
          lens !== "national";

        if (needsNationalBills) {
          const billsData = await fetchBillsFromSupabase();
          console.log(`[Dashboard] Fetched ${billsData.length} national bills`);
          setBills(billsData);
          if (billsData.length > 0 && !selectedBill) {
            setSelectedBill(billsData[0]);
          }
        }

        if (needsMunicipalGrid) {
          const muniName = lens.charAt(0).toUpperCase() + lens.slice(1);
          const tasks = await fetchMunicipalDecisions(muniName);
          console.log(
            `[Dashboard] Fetched ${tasks.length} local decisions for ${muniName}`,
          );
          setMunicipalTasks(tasks);
          if (tasks.length > 0 && !selectedMunicipalTask) {
            setSelectedMunicipalTask(tasks[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [initialUser, lens, workspace, citizenRealm, committeePanel]);

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
    const currentTask =
      lens === "national" ? selectedBill : selectedMunicipalTask;
    if (!currentTask) return;

    // Add points gamification via XP system
    try {
      const res = await logUserActivity("STATEMENT", {
        billId: selectedBill?.id,
        title: currentTask.title,
        political_vector: (currentTask as any).political_vector,
      });

      if (res.success && "totalXp" in res) {
        // Update local state for immediate feedback
        setProfile((prev: any) => ({
          ...prev,
          xp: res.totalXp,
          level: res.level,
        }));

        toast.custom(
          (t) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border-2 border-purple-500 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-purple-400 leading-none mb-1">
                  {res.leveledUp ? "Level Up!" : "Vaikutusvaltaa ansaittu!"}
                </p>
                <p className="text-xl font-black text-white">
                  +{res.xpEarned} XP
                </p>
                {res.leveledUp && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Uusi taso: {res.level}
                  </p>
                )}
              </div>
            </motion.div>
          ),
          { duration: 4000 },
        );
      }
    } catch (err) {
      toast.error("Vaikutusvallan päivitys epäonnistui.");
    }
  };

  const handleResearcherProfileComplete = async (data: {
    type: string;
    focus: string[];
  }) => {
    try {
      const res = await initializeResearcherProfile(data);
      if (res.success) {
        // Päivitetään paikallinen tila välittömästi, jotta UI ei hyppää takaisin
        setProfile((prev: any) => ({
          ...(prev || {}),
          researcher_initialized: true,
          researcher_type: data.type,
          researcher_focus: data.focus,
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

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !initialUser) return;

    setLoading(true);
    try {
      await upsertUserProfile({ full_name: newName.trim() });
      setProfile((prev: any) => ({ ...prev, full_name: newName.trim() }));
      setShowNamePrompt(false);
      localStorage.setItem("name_prompt_dismissed", "true");
      toast.success("Nimesi on päivitetty!");
    } catch (err) {
      toast.error("Nimen päivitys epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSwitch = (
    next: "citizen" | "committee" | "researcher",
  ) => {
    if ((next === "committee" || next === "researcher") && !initialUser) {
      toast.error("Tämä toiminto vaatii kirjautumisen.");
      window.location.href =
        "/login?callback=" +
        encodeURIComponent(
          next === "committee"
            ? "/dashboard?view=committee"
            : "/dashboard/researcher",
        );
      return;
    }
    setWorkspace(next);
    if (next === "citizen") {
      setCommitteePanel("desk");
    }
    if (next === "researcher") {
      return;
    }
  };

  const handleCitizenRealmChange = (realm: "parliament" | "municipal") => {
    setCitizenRealm(realm);
    if (realm === "parliament") {
      setLens("national");
    } else if (lens === "national") {
      setLens("espoo");
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

  // Jos ollaan committee-näkymässä (Shadow MP) mutta profiilia ei ole alustettu
  if (!profile?.shadow_id_number && workspace === "committee" && initialUser) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-12 bg-slate-900 rounded-[3rem] border border-white/10 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
            <PlusCircle className="text-purple-400 w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Aktivoi Shadow MP -oikeudet
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Varjokansanedustajan Työhuone vaatii profiilin alustamisen. Tämä
              sijoittaa sinut oikeaan valiokuntaan DNA-profiilisi perusteella.
            </p>
          </div>
          <button
            onClick={handleCreateProfile}
            disabled={creating}
            className="px-10 py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/30 flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Zap size={20} />
            )}
            {creating ? "Aktivoidaan..." : "Aktivoi Digitaalinen ID"}
          </button>
        </div>
      </div>
    );
  }

  const mergedUser: UserProfile = {
    ...(initialUser || {
      id: "guest",
      email: "guest@directdem.fi",
      full_name: "Vieraileva Käyttäjä",
    }),
    ...profile,
    id: initialUser?.id || profile?.id || "guest",
    email: initialUser?.email || profile?.email || "guest@directdem.fi",
    full_name:
      profile?.full_name ||
      initialUser?.full_name ||
      initialUser?.email?.split("@")[0] ||
      "Vieraileva Käyttäjä",
  };

  return (
    <div className="space-y-8">
      <Toaster position="bottom-center" />

      {/* Name Prompt Modal */}
      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <User size={32} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                  Tervetuloa DirectDemiin!
                </h2>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                  Millä nimellä haluat esiintyä?
                </p>
              </div>

              <form onSubmit={handleUpdateName} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                    Käyttäjänimi / Oikea nimi
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Esim. Matti Meikäläinen"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNamePrompt(false);
                      localStorage.setItem("name_prompt_dismissed", "true");
                    }}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                  >
                    Ohita
                  </button>
                  <button
                    type="submit"
                    className="flex-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Tallenna
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Työhuoneen navigointi: ensin kansalainen vs edustaja, sitten edustajan alipaneelit */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-slate-900/50 border border-white/5 p-2 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-1 shrink-0">
          {pageVariant === "researcher" ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-300 hover:text-white hover:bg-cyan-900/30 rounded-xl transition-all"
            >
              ← Kansalaissyöte
            </Link>
          ) : null}
          <Link
            href="/"
            className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Home size={14} />
            Etusivu
          </Link>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Link
            href="/?view=bills"
            className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LayoutGrid size={14} />
            Moduulit
          </Link>
        </div>

        <div className="flex flex-col items-stretch gap-2 flex-1 min-w-0 max-w-3xl mx-auto">
          {pageVariant === "researcher" ? (
            <div className="flex flex-wrap justify-center items-center gap-2 py-2">
              <Terminal size={16} className="text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Tutkijatila — syväanalyysi ja käytöspoikkeamat
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center bg-white/5 rounded-xl p-1 gap-1">
              <>
                <button
                  type="button"
                  onClick={() => handleWorkspaceSwitch("citizen")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${workspace === "citizen" ? "bg-white/15 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
                >
                  <UserCircle size={14} />
                  Kansalainen
                </button>
                <button
                  type="button"
                  onClick={() => handleWorkspaceSwitch("committee")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${workspace === "committee" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Briefcase size={14} />
                  Edustaja
                </button>
                {workspace === "committee" && (
                  <div className="hidden sm:flex items-center gap-1 pl-1 ml-1 border-l border-white/10">
                    <button
                      type="button"
                      onClick={() => setCommitteePanel("desk")}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${committeePanel === "desk" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Työpöytä
                    </button>
                    {isFeatureEnabled("MEDIA_WATCH_ENABLED") && (
                      <button
                        type="button"
                        onClick={() => setCommitteePanel("media_watch")}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${committeePanel === "media_watch" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                      >
                        Media Watch
                      </button>
                    )}
                    {isFeatureEnabled("ECONOMY_ENABLED") && (
                      <button
                        type="button"
                        onClick={() => setCommitteePanel("economy")}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${committeePanel === "economy" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                      >
                        Talous
                      </button>
                    )}
                  </div>
                )}
              </>
              {isFeatureEnabled("RESEARCHER_ENABLED") &&
                (initialUser ? (
                  <Link
                    href="/dashboard/researcher"
                    className="px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    Tutkija
                  </Link>
                ) : (
                  <Link
                    href={
                      "/login?callback=" +
                      encodeURIComponent("/dashboard/researcher")
                    }
                    className="px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    Tutkija
                  </Link>
                ))}
            </div>
          )}
          {pageVariant !== "researcher" && workspace === "committee" && (
            <div className="flex sm:hidden flex-wrap justify-center gap-1 px-1">
              <button
                type="button"
                onClick={() => setCommitteePanel("desk")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${committeePanel === "desk" ? "bg-white/15 text-white" : "text-slate-500"}`}
              >
                Työpöytä
              </button>
              {isFeatureEnabled("MEDIA_WATCH_ENABLED") && (
                <button
                  type="button"
                  onClick={() => setCommitteePanel("media_watch")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${committeePanel === "media_watch" ? "bg-white/15 text-white" : "text-slate-500"}`}
                >
                  Media
                </button>
              )}
              {isFeatureEnabled("ECONOMY_ENABLED") && (
                <button
                  type="button"
                  onClick={() => setCommitteePanel("economy")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${committeePanel === "economy" ? "bg-white/15 text-white" : "text-slate-500"}`}
                >
                  Talous
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end flex-wrap shrink-0">
          {!initialUser && (
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2 transition-all"
            >
              <LogIn size={14} />
              Kirjaudu
            </Link>
          )}
          {workspace === "citizen" && citizenRealm === "parliament" ? (
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-2 whitespace-nowrap">
              Eduskunta
            </span>
          ) : (workspace === "citizen" && citizenRealm === "municipal") ||
            (workspace === "committee" && committeePanel === "desk") ? (
            <LensSwitcher currentLens={lens} onLensChange={setLens} />
          ) : null}
          <div className="flex items-center gap-2 pr-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 hidden sm:inline">
              {lens === "national" ? "Valtakunnallinen" : "Kunnallinen"} online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Sidebar: ID Card & Agenda */}
        <aside className="lg:col-span-3 space-y-8">
          {workspace === "researcher" ? null : workspace === "citizen" ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Kansalaisnäkymä
                </p>
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  Uusimmat lakiluonnokset ja uutisnostot. Syvälliset työkalut
                  (media vs. päätös, varjoäänestys, lobbausindeksi) ovat
                  edustajan työhuoneessa. Palaute ja kansalaiskanava:{" "}
                  <Link
                    href="/ranking"
                    className="text-purple-300 underline-offset-2 hover:underline"
                  >
                    edustajaprofiilit
                  </Link>
                  .
                </p>
                {initialUser ? (
                  <button
                    type="button"
                    onClick={() => handleWorkspaceSwitch("committee")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-purple-500/35 bg-purple-600/15 text-[10px] font-black uppercase tracking-widest text-purple-200 hover:bg-purple-600/25 transition-colors"
                  >
                    <Briefcase size={14} />
                    Siirry edustajan työhuoneeseen
                  </button>
                ) : (
                  <Link
                    href="/login?callback=/dashboard?view=committee"
                    className="flex w-full items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <LogIn size={14} />
                    Kirjaudu edustajan työtilaan
                  </Link>
                )}
              </div>
              {citizenRealm === "municipal" && (
                <LocalWeather lens={lens} user={mergedUser} />
              )}
            </div>
          ) : (
            <>
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                  Kirjautunut sisään
                </p>
                <p className="text-[10px] font-bold text-white truncate">
                  {mergedUser.email || "Vieraana"}
                </p>
              </div>
              <ShadowIDCard user={mergedUser} lens={lens} />
              {initialUser && isFeatureEnabled("XP_SYSTEM_ENABLED") && (
                <InfluenceStats
                  xp={mergedUser.xp || 0}
                  level={mergedUser.level || 1}
                />
              )}
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
                    { time: "14:00", task: "Lausunnon valmistelu" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-[9px] font-black text-purple-400 w-8">
                        {item.time}
                      </span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                        {item.task}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {workspace === "researcher" ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Terminal size={48} className="text-slate-900" />
                </div>
                <div className="space-y-1 relative z-10">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 italic">
                    {profile?.researcher_type
                      ? {
                          academic: "Akateeminen_Terminaali",
                          journalist: "Toimittaja_Konsoli",
                          policy_expert: "Politiikka_Analyysi",
                          strategist: "Strategia_Seuranta",
                        }[profile.researcher_type as string]
                      : "Tutkija_ID"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {profile?.researcher_type === "academic"
                        ? "Vahvistettu Akateeminen Tili"
                        : profile?.researcher_type === "journalist"
                          ? "Lehdistöprotokolla Aktiivinen"
                          : "Ammattilaistason Pääsy"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.researcher_focus?.map((f: string) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase border border-slate-100 italic"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                        Analyysit
                      </span>
                      <p className="text-base font-black text-slate-900 leading-none">
                        1,402
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                        Havainnot
                      </span>
                      <p className="text-base font-black text-emerald-600 leading-none">
                        84
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-6 shadow-inner">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <Activity size={14} className="text-slate-900" />
                  Käyttäytymispoikkeamat
                </h4>
                <div className="space-y-4">
                  {[
                    {
                      type: "Puoluekuri",
                      desc: "KOK ryhmäkurin poikkeava tiivistyminen (Q1)",
                      status: "Korkea",
                    },
                    {
                      type: "Divergenssi",
                      desc: "SDP:n äänestyskäyttäytyminen vs. vaalilupaukset",
                      status: "Hälytys",
                    },
                    {
                      type: "Lobbaus",
                      desc: "EK:n intensiivinen asiantuntijakuulemisjakso",
                      status: "Aktiivinen",
                    },
                  ].map((alert, i) => (
                    <div
                      key={i}
                      className="space-y-1 border-l-2 border-slate-200 pl-3 py-0.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase italic">
                          {alert.type}
                        </span>
                        <span
                          className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                            alert.status === "Hälytys"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight leading-tight">
                        {alert.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        {/* Center: Task Stream (Committee Bills) or DNA Activation or Municipal Watch */}
        <main
          className={`${
            workspace === "researcher" ? "lg:col-span-9" : "lg:col-span-6"
          } space-y-8`}
        >
          {workspace === "researcher" && !profile?.researcher_initialized ? (
            <ResearcherProfiling onComplete={handleResearcherProfileComplete} />
          ) : !hasDna &&
            workspace === "committee" &&
            committeePanel === "desk" ? (
            <DNAActivation />
          ) : (
            <>
              {workspace === "committee" &&
                committeePanel === "desk" &&
                isFeatureEnabled("PULSE_ENABLED") && <QuickPulse lens={lens} />}

              {workspace === "researcher" ? (
                <ResearcherWorkspace
                  userPlan={mergedUser.plan_type || "free"}
                  researcherProfile={profile}
                />
              ) : workspace === "committee" && committeePanel === "economy" ? (
                <PricingTable
                  userId={mergedUser.id}
                  hasStripeId={!!mergedUser.stripe_customer_id}
                />
              ) : workspace === "committee" &&
                committeePanel === "media_watch" ? (
                <MediaWatchPanel user={mergedUser} />
              ) : workspace === "citizen" && citizenRealm === "municipal" ? (
                <div className="space-y-6">
                  <CitizenRealmBar
                    realm={citizenRealm}
                    onChange={handleCitizenRealmChange}
                  />
                  <MunicipalWatchFeed user={mergedUser} />
                </div>
              ) : (workspace === "citizen" && citizenRealm === "parliament") ||
                (workspace === "committee" &&
                  committeePanel === "desk" &&
                  lens === "national") ? (
                <>
                  {workspace === "citizen" && citizenRealm === "parliament" && (
                    <CitizenRealmBar
                      realm={citizenRealm}
                      onChange={handleCitizenRealmChange}
                    />
                  )}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white leading-none">
                        {workspace === "citizen" &&
                        citizenRealm === "parliament"
                          ? "Uusimmat lakiesitykset"
                          : "Viikkokatsaus"}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-md leading-relaxed">
                        {workspace === "citizen" &&
                        citizenRealm === "parliament"
                          ? "Selkea lista ja uutisnosto oikealla. Syvemmät mittarit ja lausunnot: edustajan työhuone."
                          : "Ymmarra nopeasti, mita kasittelyssa olevat lait tarkoittavat sinulle"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!(
                        workspace === "citizen" && citizenRealm === "parliament"
                      ) && (
                        <Link
                          href="/dashboard?view=kuntavahti&lens=espoo"
                          className="px-4 py-2 rounded-xl border border-blue-500/30 bg-blue-600/10 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:bg-blue-600/20 transition-all"
                        >
                          Dynasty-skanneri
                        </Link>
                      )}
                      <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-black uppercase text-purple-400">
                        {bills.length} lakia
                      </div>
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
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Päivitetty tänään
                            </span>
                          </div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                            {selectedBill.title}
                          </h3>
                        </div>

                        <section
                          aria-label="Selkokielinen tiivistelma"
                          className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-7 md:p-8 space-y-4"
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                            Selkokielella sinulle
                          </p>
                          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
                            {selectedBill.summary?.slice(0, 320) ||
                              "Tiivistelma paivittyy pian. Voit avata lain tiedot tarkempaa analyysia varten."}
                          </p>
                          <p className="text-sm text-blue-100/90 font-medium leading-relaxed">
                            {getCitizenImpactText(selectedBill)}
                          </p>
                        </section>

                        {workspace === "citizen" &&
                          citizenRealm === "parliament" && (
                            <CitizenBillMediaStrip
                              billId={selectedBill.id}
                              parliamentId={selectedBill.parliamentId}
                            />
                          )}

                        {!(
                          workspace === "citizen" &&
                          citizenRealm === "parliament"
                        ) && (
                          <>
                            <section
                              aria-label="Nopeat vaikutusmittarit"
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                              {(() => {
                                const { passProbability, lobbyIndex } =
                                  getBillSignals(selectedBill);
                                return (
                                  <>
                                    <div className="bg-slate-950/50 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex flex-wrap items-center gap-2">
                                        Predictive influence
                                        <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-200">
                                          Arvio
                                        </span>
                                      </p>
                                      <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className={`h-full ${passProbability >= 55 ? "bg-emerald-500" : "bg-rose-500"}`}
                                          style={{
                                            width: `${passProbability}%`,
                                          }}
                                        />
                                      </div>
                                      <p className="text-xs font-bold text-slate-200">
                                        Lapimenon todennakoisyys:{" "}
                                        {passProbability}%
                                      </p>
                                    </div>
                                    <div className="bg-slate-950/50 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex flex-wrap items-center gap-2">
                                        Lobbyist traceability
                                        <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-200">
                                          Arvio
                                        </span>
                                      </p>
                                      <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className={`h-full ${lobbyIndex >= 70 ? "bg-orange-500" : lobbyIndex >= 45 ? "bg-amber-500" : "bg-emerald-500"}`}
                                          style={{ width: `${lobbyIndex}%` }}
                                        />
                                      </div>
                                      <p className="text-xs font-bold text-slate-200">
                                        Lobbausindeksi: {lobbyIndex}/100
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </section>

                            <div className="flex justify-end">
                              <Link
                                href={`/arena?billId=${selectedBill.id}`}
                                className="px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-[10px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/20 transition-all"
                              >
                                Varjo-aanestys
                              </Link>
                            </div>

                            <ExpertSummary
                              bill={selectedBill}
                              onGiveStatement={handleGiveStatement}
                            />
                          </>
                        )}
                        {workspace === "citizen" &&
                          citizenRealm === "parliament" && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              Edustajan työhuoneessa: ennusteet, lobbausindeksi,
                              varjoäänestys ja lausunnot.
                            </p>
                          )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bills
                      .filter((b) => b.id !== selectedBill?.id)
                      .slice(0, 4)
                      .map((bill) => (
                        <div
                          key={bill.id}
                          onClick={() => setSelectedBill(bill)}
                          className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-purple-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[120px]"
                        >
                          {(() => {
                            const { passProbability, lobbyIndex } =
                              getBillSignals(bill);
                            return (
                              <>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-slate-600 mb-2">
                                    {bill.parliamentId}
                                  </p>
                                  <h4 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                    {bill.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-300 mt-3 line-clamp-2">
                                    {bill.summary?.slice(0, 110) ||
                                      "Tiivistelma paivittyy..."}
                                  </p>
                                </div>
                                {!(
                                  workspace === "citizen" &&
                                  citizenRealm === "parliament"
                                ) && (
                                  <div className="space-y-2 mt-4">
                                    <div>
                                      <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                                        <span>Lapimeno</span>
                                        <span
                                          className={
                                            passProbability >= 55
                                              ? "text-emerald-400"
                                              : "text-rose-400"
                                          }
                                        >
                                          {passProbability}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className={`${passProbability >= 55 ? "bg-emerald-500" : "bg-rose-500"} h-full`}
                                          style={{
                                            width: `${passProbability}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                                        <span>Lobbausindeksi</span>
                                        <span
                                          className={
                                            lobbyIndex >= 70
                                              ? "text-orange-400"
                                              : lobbyIndex >= 45
                                                ? "text-amber-400"
                                                : "text-emerald-400"
                                          }
                                        >
                                          {lobbyIndex}/100
                                        </span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className={`${lobbyIndex >= 70 ? "bg-orange-500" : lobbyIndex >= 45 ? "bg-amber-500" : "bg-emerald-500"} h-full`}
                                          style={{ width: `${lobbyIndex}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 mt-4 text-[7px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">
                                  <ChevronRight size={10} />
                                  {workspace === "citizen" &&
                                  citizenRealm === "parliament"
                                    ? "Lue tiivistelmä"
                                    : "Avaa analyysi"}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ))}
                  </div>
                </>
              ) : workspace === "committee" && committeePanel === "desk" ? (
                <>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                        Paikalliset Päätökset
                      </h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Kaupunki: {lens.charAt(0).toUpperCase() + lens.slice(1)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {lens === "espoo" && (
                        <Link
                          href="/dashboard/espoo"
                          className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white hover:bg-blue-500 transition-all flex items-center gap-2"
                        >
                          <MapPin size={12} />
                          Avaa Espoo-vahti
                        </Link>
                      )}
                      <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-black uppercase text-blue-400">
                        {municipalTasks.length} Asiaa
                      </div>
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
                    {municipalTasks
                      .filter((t) => t.id !== selectedMunicipalTask?.id)
                      .slice(0, 4)
                      .map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedMunicipalTask(task)}
                          className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[120px]"
                        >
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-600 mb-2">
                              {task.proposer || "Kaupunginhallitus"}
                            </p>
                            <h4 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                              {task.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 mt-4 text-[7px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">
                            <ChevronRight size={10} />
                            Avaa analyysi
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </main>

        {/* Right: kansalaisella pelkkä uutislista; edustajalla myös transaktiot ja hälytykset */}
        {workspace !== "researcher" && (
          <aside className="lg:col-span-3 space-y-6 h-full flex flex-col">
            {workspace === "committee" && (
              <div className="flex-1 min-h-0">
                <TransactionFeed />
              </div>
            )}

            <div
              className={`border border-white/10 backdrop-blur-md space-y-6 flex flex-col ${
                workspace === "citizen"
                  ? "rounded-2xl bg-slate-950/70 p-6"
                  : "rounded-[2.5rem] bg-slate-900/80 p-8 space-y-8"
              }`}
            >
              <h4 className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Newspaper size={16} className="text-purple-500" />
                {workspace === "citizen" && citizenRealm === "parliament"
                  ? "Uutiset ja poiminnat"
                  : lens === "national"
                    ? "Valtakunnallinen feed"
                    : `${lens.charAt(0).toUpperCase() + lens.slice(1)} feed`}
              </h4>
              {workspace === "citizen" && citizenRealm === "parliament" && (
                <p className="text-[10px] text-slate-500 leading-relaxed -mt-2">
                  Yle ja havaitut sidonnaisuus-/tutka­signaalit. Valitun lain
                  automaattiset mediaosuumat näkyvät lain kortissa; koko Media
                  Watch on edustajan työhuoneessa.
                </p>
              )}

              <div className="space-y-6">
                {news.length > 0 ? (
                  news.map((item) => (
                    <div
                      key={item.id}
                      className={`space-y-2 relative pl-5 border-l-2 ${
                        item.type === "radar"
                          ? "border-orange-500"
                          : item.type === "alert"
                            ? "border-rose-500"
                            : "border-purple-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.type === "radar" && (
                          <Radar
                            size={12}
                            className="text-orange-500 animate-pulse"
                          />
                        )}
                        {item.type === "alert" && (
                          <AlertTriangle size={12} className="text-rose-500" />
                        )}
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                            item.type === "radar"
                              ? "text-orange-500"
                              : item.type === "alert"
                                ? "text-rose-500"
                                : "text-purple-400"
                          }`}
                        >
                          {item.time}
                        </p>
                      </div>
                      <p
                        className={`text-xs font-bold tracking-tight leading-snug ${
                          item.type === "radar" || item.type === "alert"
                            ? "text-white"
                            : "text-slate-300"
                        }`}
                      >
                        {item.title}
                      </p>
                      {(item.type === "radar" || item.type === "alert") && (
                        <Link
                          href={
                            item.type === "radar"
                              ? `/arena?billId=${item.meta?.bill_id}`
                              : `/dashboard`
                          }
                          className="text-[8px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          Tutki tapausta <ChevronRight size={8} />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-bold text-slate-500 uppercase text-center py-10 italic">
                    Ei uusia ilmoituksia
                  </p>
                )}
              </div>

              <button
                type="button"
                className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all"
              >
                Lataa lisää (tulossa)
              </button>
            </div>

            {workspace === "committee" && (
              <div className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-[2rem] p-6 text-white space-y-3 shadow-xl">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-tight">
                    Edustajan hälytykset
                  </h4>
                  <p className="text-[11px] font-medium text-white/85 leading-relaxed">
                    Istunto- ja valiokuntamuistutukset näytetään tässä
                    työtilassa.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
