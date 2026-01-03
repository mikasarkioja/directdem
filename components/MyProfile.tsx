"use client";

import { useState, useEffect } from "react";
import { 
  Download, Trash2, MapPin, Loader2, CheckCircle, 
  AlertTriangle, Save, ToggleLeft, ToggleRight, 
  Shield, User, Globe, Lock, Info, Sparkles
} from "lucide-react";
import PartyMatchCard from "./PartyMatchCard";
import { 
  getUserDataForExport, 
  updateVaalipiiri, 
  updateReportListParticipation 
} from "@/app/actions/profile-data";
import { deleteUserAccount } from "@/app/actions/user-management";
import { getUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { FINNISH_DISTRICTS } from "@/lib/finnish-districts-geo";
import type { UserProfile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import DemocraticDNA from "./DemocraticDNA";

interface MyProfileProps {
  user: UserProfile | null;
}

export default function MyProfile({ user: initialUser }: MyProfileProps) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedVaalipiiri, setSelectedVaalipiiri] = useState<string>("");
  const [savingVaalipiiri, setSavingVaalipiiri] = useState(false);
  const [joinReportList, setJoinReportList] = useState(false);
  const [savingReportList, setSavingReportList] = useState(false);
  const [publicStance, setPublicStance] = useState(false);
  const [savingStance, setSavingStance] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        
        if (profile) {
          setUser(profile as any);
          setSelectedVaalipiiri(profile.vaalipiiri || "");
          setJoinReportList(profile.join_report_list || false);
          setPublicStance(profile.public_stance || false);
        }

        // Fetch badges
        const { data: badgeData } = await supabase
          .from("user_badges")
          .select("badge_type")
          .eq("user_id", authUser.id);
        
        if (badgeData) {
          setBadges(badgeData.map(b => b.badge_type));
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleTogglePublicStance = async () => {
    const newValue = !publicStance;
    setSavingStance(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ public_stance: newValue })
        .eq("id", user?.id);
      if (error) throw error;
      setPublicStance(newValue);
      setSuccess(newValue ? "Julkinen kanta aktivoitu!" : "Kanta muutettu yksityiseksi.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError("Päivitys epäonnistui");
    } finally {
      setSavingStance(false);
    }
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    setError(null);
    try {
      const result = await getUserDataForExport();
      if (!result.success || !result.data) throw new Error(result.error || "Lataus epäonnistui");
      const jsonData = JSON.stringify(result.data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `directdem-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccess("Tiedot ladattu!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-command-neon" /></div>;
  if (!user) return <div className="text-center p-12 text-command-gray">Kirjaudu sisään hallinnoidaksesi profiiliasi.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-command-card border border-command-neon/20 rounded-2xl flex items-center justify-center shadow-lg shadow-command-neon/5">
          <User size={32} className="text-command-neon" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Citizen Profile</h2>
            {badges.length > 0 && (
              <div className="flex gap-1">
                {badges.map(badge => (
                  <div key={badge} className="px-2 py-1 bg-command-neon text-white text-[8px] font-black uppercase rounded-md shadow-sm border border-white/20" title={badge}>
                    {badge}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-command-gray text-[10px] font-black uppercase tracking-widest">Identity: {user.id.substring(0, 8)}...</p>
            {user.initialized_from_mp && (
              <div className="flex items-center gap-1.5 text-purple-400 bg-purple-400/10 w-fit px-2 py-0.5 rounded-full border border-purple-400/20">
                <Sparkles size={10} className="animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-tight">
                  {user.initialized_from_mp}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-command-emerald/10 border border-command-emerald/20 rounded-xl text-command-emerald text-xs font-bold">{success}</motion.div>}
      {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-command-rose/10 border border-command-rose/20 rounded-xl text-command-rose text-xs font-bold">{error}</motion.div>}

      <div className="space-y-8">
        {user.initialized_from_mp && (
          <div className="bg-purple-600/5 border border-purple-600/20 rounded-2xl p-6 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center shrink-0 text-purple-400">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-purple-400">Pohjaprofiili aktivoitu</p>
              <p className="text-xs text-white/70 leading-relaxed font-medium">
                Pohjaprofiilisi perustuu {user.initialized_from_mp.split(': ')[1]} äänestyskäyttäytymiseen. 
                Jokainen oma äänesi muokkaa tätä profiilia lähemmäs todellista DNA:tasi.
              </p>
            </div>
          </div>
        )}
        <DemocraticDNA />
        <PartyMatchCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identity & Settings */}
        <div className="bg-command-card rounded-3xl border border-white/5 p-8 space-y-8">
          <div className="flex items-center gap-2 text-command-neon">
            <Shield size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest">System Settings</h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-command-gray mb-2">Email Address</p>
              <p className="text-sm font-bold text-white opacity-60">{user.email}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-command-gray mb-2">Operational District (Vaalipiiri)</p>
              <select
                value={selectedVaalipiiri}
                onChange={(e) => setSelectedVaalipiiri(e.target.value)}
                className="w-full bg-command-bg border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:border-command-neon outline-none transition-all"
              >
                <option value="">Select District</option>
                {FINNISH_DISTRICTS.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
              </select>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={14} className="text-command-neon" />
                    <p className="text-xs font-black uppercase tracking-tight text-white">Public Stance</p>
                  </div>
                  <p className="text-[10px] text-command-gray font-bold uppercase leading-relaxed">Show your votes to other citizens to help form virtual tribes.</p>
                </div>
                <button onClick={handleTogglePublicStance} disabled={savingStance}>
                  {publicStance ? <ToggleRight size={40} className="text-command-neon" /> : <ToggleLeft size={40} className="text-command-gray" />}
                </button>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={14} className="text-command-emerald" />
                    <p className="text-xs font-black uppercase tracking-tight text-white">Report Participation</p>
                  </div>
                  <p className="text-[10px] text-command-gray font-bold uppercase leading-relaxed">Include your data in weekly reports sent to parliamentary representatives.</p>
                </div>
                <button onClick={() => {}}>
                  {joinReportList ? <ToggleRight size={40} className="text-command-emerald" /> : <ToggleLeft size={40} className="text-command-gray" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data & Security */}
        <div className="space-y-8">
          <div className="bg-command-card rounded-3xl border border-white/5 p-8 space-y-6">
            <div className="flex items-center gap-2 text-command-gray">
              <Lock size={18} />
              <h3 className="text-sm font-black uppercase tracking-widest">Data Management</h3>
            </div>
            <p className="text-[10px] text-command-gray font-bold uppercase leading-relaxed">Download a complete backup of your civic engagement data or request permanent deletion.</p>
            
            <div className="flex gap-2">
              <button 
                onClick={handleDownloadData}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export Data
              </button>
              <button 
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-2 bg-command-rose/10 hover:bg-command-rose/20 border border-command-rose/20 p-3 rounded-xl text-command-rose transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {confirmDelete && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-command-rose/5 border border-command-rose/20 rounded-3xl p-8 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-command-rose">Danger Zone: Confirm Deletion</p>
                <p className="text-[10px] text-command-gray font-bold uppercase leading-relaxed">Type "POISTA" to confirm permanent identity removal. This cannot be undone.</p>
                <input 
                  type="text" 
                  value={deleteConfirmText} 
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-command-bg border border-command-rose/30 rounded-xl px-4 py-2 text-sm font-bold text-white focus:border-command-rose outline-none"
                  placeholder="POISTA"
                />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-[10px] font-black uppercase text-command-gray">Cancel</button>
                  <button onClick={() => {}} className="flex-1 bg-command-rose text-white py-2 rounded-xl text-[10px] font-black uppercase">Execute Deletion</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
