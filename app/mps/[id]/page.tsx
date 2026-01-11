import React from "react";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { 
  User, Calendar, MessageSquare, HelpCircle, 
  TrendingUp, Users, MapPin, Award, 
  ChevronRight, Clock, ShieldCheck
} from "lucide-react";
import { getRecentlyMetOrganizations } from "@/lib/eduskunta/activity-engine";

export default async function MPProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch MP data
  const { data: mp } = await supabase
    .from("mps")
    .select(`
      *,
      mp_profiles (*),
      mp_ai_profiles (*)
    `)
    .eq("id", parseInt(id))
    .single();

  if (!mp) return <div>Edustajaa ei löydy.</div>;

  // 2. Fetch Activity Stream
  const { data: activities } = await supabase
    .from("mp_activity_stream")
    .select("*")
    .eq("mp_id", id)
    .order("date", { ascending: false })
    .limit(10);

  // 3. Fetch Lobbying Data (Simulated)
  const lobbying = await getRecentlyMetOrganizations(id);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
          
          {/* Header Card */}
          <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-purple-500 shadow-2xl shrink-0">
                <User size={64} className="text-slate-400" />
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                    {mp.first_name} <span className="text-purple-500">{mp.last_name}</span>
                  </h1>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">
                    {mp.party} | {mp.parliament_group || "Kansanedustaja"}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Aktiivisuusindeksi: {mp.mp_profiles?.[0]?.activity_index || 0}
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                    <MapPin size={14} className="text-rose-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Vaalipiiri: {mp.vaalipiiri || "Suomi"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Activity Stream (Timeline) */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Clock className="text-purple-500" size={24} />
                Aktiivisuusvirta
              </h2>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-px before:bg-white/5">
                {activities && activities.length > 0 ? activities.map((act) => (
                  <div key={act.id} className="relative pl-12">
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-slate-900 z-10 ${
                      act.activity_type === 'speech' ? 'text-blue-400' : 'text-orange-400'
                    }`}>
                      {act.activity_type === 'speech' ? <MessageSquare size={14} /> : <HelpCircle size={14} />}
                    </div>
                    
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {act.activity_type === 'speech' ? 'Täysistuntopuhe' : 'Kirjallinen kysymys'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-600">
                          {new Date(act.date).toLocaleDateString('fi-FI')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                        {act.content_summary}
                      </h3>
                      {act.metadata?.location && (
                        <div className="mt-3 flex items-center gap-2 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg w-fit">
                          <MapPin size={10} className="text-rose-400" />
                          <span className="text-[8px] font-black uppercase text-rose-400">Local Interest: {act.metadata.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest pl-12">Ei uusia aktiviteetteja.</p>
                )}
              </div>
            </div>

            {/* Right: Lobbying & Stats */}
            <div className="space-y-12">
              {/* Recently Met */}
              <section className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Users className="text-emerald-500" size={24} />
                  Avoimuusrekisteri
                </h2>
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Viimeksi tavatut etujärjestöt</p>
                  <div className="space-y-3">
                    {lobbying.map((org, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                        <p className="text-xs font-bold text-white">{org.name}</p>
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                          <span>{org.topic}</span>
                          <span>{new Date(org.date).toLocaleDateString('fi-FI')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[8px] font-black uppercase text-slate-600 border-t border-white/5">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Data: Avoimuusrekisteri.fi
                  </div>
                </div>
              </section>

              {/* DNA Preview */}
              <section className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Award className="text-orange-500" size={24} />
                  Poliittinen DNA
                </h2>
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6">
                  {/* Mock Radar Chart or List */}
                  <div className="space-y-3">
                    {['Talous', 'Arvot', 'Ympäristö', 'Alueet', 'KV', 'Turva'].map((axis, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black uppercase">
                          <span className="text-slate-500">{axis}</span>
                          <span className="text-white">65%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: '65%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}

