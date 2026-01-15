import { getUser } from "@/app/actions/auth";
import { getEspooDecisions } from "@/app/actions/espoo-actions";
import Navbar from "@/components/Navbar";
import { Loader2, MapPin, Info, FileText, ExternalLink, AlertCircle } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

export default async function EspooWatchPage() {
  const user = await getUser();
  const decisions = await getEspooDecisions();

  // Käyttäjän asuinalue profiilista
  const userNeighborhood = user?.municipality === "Espoo" ? "Matinkylä" : null; // Simuloitu haku profiilista

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <MapPin size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Espoo-päätöksentekovahti</h1>
              <p className="text-slate-500 font-serif italic">Seuraa kotikuntasi päätöksiä reaaliajassa. AI tiivistää monimutkaiset pykälät selkokielelle.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {decisions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center space-y-6 shadow-sm">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Päivitetään päätösvirtaa...</p>
            </div>
          ) : (
            decisions.map((decision: any) => {
              const isRelevant = userNeighborhood && 
                (decision.neighborhoods?.some((n: string) => n.toLowerCase().includes(userNeighborhood.toLowerCase())) ||
                 decision.summary.toLowerCase().includes(userNeighborhood.toLowerCase()));

              return (
                <div 
                  key={decision.id || decision.external_id}
                  className={`group bg-white border ${isRelevant ? 'border-yellow-400 ring-4 ring-yellow-400/10' : 'border-slate-200'} rounded-[2.5rem] overflow-hidden transition-all hover:shadow-xl shadow-sm`}
                >
                  <div className="p-8 md:p-12 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          decision.category === 'SÄÄSTÖ' ? 'bg-rose-100 text-rose-600' :
                          decision.category === 'INVESTOINTI' ? 'bg-emerald-100 text-emerald-600' :
                          decision.category === 'KAAVAMUUTOS' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {decision.category || 'MUU'}
                        </span>
                        {isRelevant && (
                          <span className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                            <AlertCircle size={12} />
                            Oma asuinalueesi
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(decision.decision_date).toLocaleDateString('fi-FI')}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                      {decision.title}
                    </h2>

                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Info size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">AI-Tiivistelmä</span>
                        </div>
                        <p className="text-lg text-slate-700 font-serif leading-relaxed italic">
                          "{decision.summary}"
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Info size={120} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vaikutus asukkaaseen</p>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          {decision.analysis_data?.impactOnResident || "Ei tarkennettu."}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alueet</p>
                        <div className="flex flex-wrap gap-2">
                          {decision.neighborhoods?.map((n: string) => (
                            <span key={n} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                              {n}
                            </span>
                          )) || <span className="text-xs text-slate-400 italic">Koko Espoo</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
                      {decision.pdf_url && (
                        <a 
                          href={decision.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                          <FileText size={16} />
                          Lue PDF-pöytäkirja
                        </a>
                      )}
                      <a 
                        href={decision.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        <ExternalLink size={16} />
                        Alkuperäinen lähde (Dynasty)
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

