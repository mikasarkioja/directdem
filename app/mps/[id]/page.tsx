import React from "react";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { getRecentlyMetOrganizations } from "@/lib/eduskunta/activity-engine";
import MpProfileMain from "@/components/mps/MpProfileMain";

export default async function MPProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan_type")
    .eq("id", user?.id)
    .single();

  const { data: mp } = await supabase
    .from("mps")
    .select(
      `
      *,
      mp_profiles (*),
      mp_ai_profiles (*)
    `,
    )
    .eq("id", parseInt(id, 10))
    .single();

  if (!mp) return <div>Edustajaa ei löydy.</div>;

  const { data: activities } = await supabase
    .from("mp_activity_stream")
    .select("*")
    .eq("mp_id", id)
    .order("date", { ascending: false })
    .limit(10);

  const lobbying = await getRecentlyMetOrganizations(id);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />

      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <MpProfileMain
          mpId={id}
          mp={mp}
          activities={activities}
          lobbying={lobbying}
          userPlan={profile?.plan_type}
        />
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}
