"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DebateArena from "@/components/DebateArena";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { DashboardView, UserProfile, DebateParticipant } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function DebatePage() {
  const params = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<DebateParticipant[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setUser(profile as any);
      }

      // Mock participants for now
      // In a real app, you'd fetch based on params.id
      const { data: parties } = await supabase
        .from("virtual_parties")
        .select("*")
        .limit(2);

      if (parties && parties.length >= 2) {
        setParticipants([
          { party: parties[0] as any, representativeName: "AI-Edustaja A" },
          { party: parties[1] as any, representativeName: "AI-Edustaja B" },
        ]);
      } else {
        // Absolute fallback mock
        setParticipants([
          { 
            party: { 
              id: "1", name: "Espoon Datapuolue", manifesto: "Olemme tiedon puolella.", 
              dna_profile_avg: { fact_checker: 80, local_hero: 20 }, level: 5,
              total_xp: 500, created_by: "1", logo_url: null
            } as any, 
            representativeName: "Data-Bot" 
          },
          { 
            party: { 
              id: "2", name: "Uudistajat", manifesto: "Uskallamme haastaa tilanteen.", 
              dna_profile_avg: { reformer: 90, active: 10 }, level: 4,
              total_xp: 400, created_by: "2", logo_url: null
            } as any, 
            representativeName: "Reform-Bot" 
          },
        ]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-command-neon" /></div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-command-dark overflow-hidden">
      <Sidebar activeView="debate" setActiveView={() => {}} user={user} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10">
          <DebateArena 
            topic="Uusi pyörätieverkosto ja sen rahoitus" 
            billTitle="Espoon liikennesuunnitelma 2026"
            participants={participants}
          />
        </div>
      </main>
      <BottomNav activeView="debate" onViewChange={() => {}} />
    </div>
  );
}


