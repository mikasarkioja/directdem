"use client";

import React, { useState, useEffect } from "react";
import { getUserProfile, createUserProfile } from "@/app/actions/user-profiles";
import ShadowDashboard from "@/components/ShadowDashboard";
import { UserProfile } from "@/lib/types";
import { Loader2, PlusCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardClientProps {
  initialUser: UserProfile | null;
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Profiilin lataus epäonnistui.");
      } finally {
        setLoading(false);
      }
    }

    if (initialUser) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [initialUser]);

  const handleCreateProfile = async () => {
    setCreating(true);
    try {
      const newProfile = await createUserProfile();
      setProfile(newProfile);
    } catch (err) {
      console.error("Failed to create profile", err);
      alert("Profiilin luonti epäonnistui.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
          Noudetaan Varjokansanedustajan tietoja...
        </p>
      </div>
    );
  }

  if (!initialUser) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-3xl border border-white/5 text-center space-y-6">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Pääsy evätty</h2>
        <p className="text-slate-400 text-sm">Sinun on kirjauduttava sisään nähdäksesi työhuoneesi.</p>
        <a href="/login" className="block w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all">
          Kirjaudu sisään
        </a>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-12 bg-slate-900 rounded-[3rem] border border-white/10 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
                <PlusCircle className="text-purple-400 w-10 h-10" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Tervetuloa uusi Varjokansanedustaja</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Sinulla ei ole vielä aktiivista Varjokansanedustajan profiilia. Luo profiili aloittaaksesi vaikuttamisen.
                </p>
            </div>
            <button 
                onClick={handleCreateProfile}
                disabled={creating}
                className="px-10 py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/30 flex items-center gap-3 mx-auto disabled:opacity-50"
            >
                {creating ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
                {creating ? "Luodaan..." : "Luo Varjokansanedustajan profiili"}
            </button>
        </div>
      </div>
    );
  }

  // Merge profile data into initialUser for components
  const mergedUser: UserProfile = {
    ...initialUser,
    shadow_id_number: profile.shadow_id_number,
    committee_assignment: profile.committee_assignment,
    impact_points: profile.impact_points,
  };

  return <ShadowDashboard user={mergedUser} />;
}

