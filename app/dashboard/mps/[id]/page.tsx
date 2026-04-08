import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import MpProfileMain from "@/components/mps/MpProfileMain";
import MpInfluencerArena from "@/components/mps/MpInfluencerArena";
import { getUser } from "@/app/actions/auth";
import { getRecentlyMetOrganizations } from "@/lib/eduskunta/activity-engine";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";

export default async function DashboardMpPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ billId?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const billIdRaw = sp.billId;
  const initialBillId =
    typeof billIdRaw === "string"
      ? billIdRaw
      : Array.isArray(billIdRaw)
        ? billIdRaw[0]
        : null;

  const [user, supabase, bills] = await Promise.all([
    getUser(),
    createClient(),
    fetchBillsFromSupabase(),
  ]);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan_type")
    .eq("id", authUser?.id)
    .single();

  const mpNumericId = parseInt(id, 10);

  const { data: mp } = await supabase
    .from("mps")
    .select(
      `
      *,
      mp_profiles (*),
      mp_ai_profiles (*)
    `,
    )
    .eq("id", mpNumericId)
    .single();

  if (!mp) {
    return (
      <div className="min-h-screen bg-nordic-white">
        <Navbar user={user} />
        <div className="mx-auto max-w-3xl px-4 py-16 text-slate-700">
          Edustajaa ei löydy.
        </div>
      </div>
    );
  }

  const { data: activities } = await supabase
    .from("mp_activity_stream")
    .select("*")
    .eq("mp_id", id)
    .order("date", { ascending: false })
    .limit(10);

  const { data: interestRows } = await supabase
    .from("person_interests")
    .select("interest_organization, declaration_url")
    .eq("mp_id", mpNumericId)
    .limit(12);

  const lobbying = await getRecentlyMetOrganizations(id);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={user} />
      <div className="mx-auto max-w-5xl px-4 pt-4 flex flex-wrap gap-4 text-[11px] font-medium text-slate-400">
        <Link href="/dashboard" className="hover:text-purple-300">
          ← Työpöytä
        </Link>
        <Link href={`/mps/${id}`} className="hover:text-purple-300">
          Klassinen MP-näkymä (sivupalkki) →
        </Link>
      </div>
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <MpProfileMain
          mpId={id}
          mp={mp}
          activities={activities}
          lobbying={lobbying}
          userPlan={profile?.plan_type}
          showDashboardChrome
        />
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <MpInfluencerArena
            mpId={mpNumericId}
            mp={{
              id: mpNumericId,
              first_name: mp.first_name,
              last_name: mp.last_name,
              party: mp.party,
              public_email: (mp as { public_email?: string | null })
                .public_email,
              website_url: (mp as { website_url?: string | null }).website_url,
              social_x_url: (mp as { social_x_url?: string | null })
                .social_x_url,
              social_facebook_url: (
                mp as { social_facebook_url?: string | null }
              ).social_facebook_url,
            }}
            user={user}
            bills={bills.slice(0, 45)}
            initialBillId={initialBillId}
            interests={interestRows ?? []}
            lobbying={lobbying}
          />
        </div>
      </main>
    </div>
  );
}
