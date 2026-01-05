import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getShadowMinutes } from "@/lib/actions/minutes-actions";
import { ChevronRight, Download, Mail, Shield, Building2, Users, Scale, FileText } from "lucide-react";
import Link from "next/link";
import ClauseDiffView from "@/components/ClauseDiffView";

export default async function ShadowMinutesPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  const supabase = await createClient();

  const { data: bill } = await supabase.from('bills').select('*').eq('id', billId).single();
  const { data: sections } = await supabase.from('bill_sections').select('*').eq('bill_id', billId).order('order_index');
  const minutes = await getShadowMinutes(billId);

  if (!bill || !sections) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-800">Pöytäkirjaa ei löytynyt</h1>
          <Link href="/workspace" className="text-purple-600 hover:underline">Palaa työhuoneeseen</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-slate-900 font-serif selection:bg-purple-100 pb-24">
      {/* Header - Official Style */}
      <header className="max-w-6xl mx-auto pt-20 px-8 border-b-2 border-slate-200 pb-12 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-500 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-lg">DD</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Kansan Varjoeduskunta</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digitaalinen Kaksonen</p>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Varjopöytäkirja
            </h1>
            <p className="text-xl text-slate-600 italic">Lopullinen loppuraportti ja eroavaisuusanalyysi</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pöytäkirja nro</p>
            <p className="text-2xl font-black text-slate-900">VPK-{bill.parliamentId?.split('/')[0] || "2026"}-{(bill.id.substring(0, 4)).toUpperCase()}</p>
            <p className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString('fi-FI')}</p>
          </div>
        </div>

        <div className="bg-slate-100 p-8 border border-slate-200 rounded-sm space-y-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl" />
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
            <Scale size={20} className="text-purple-600" />
            Lakiesityksen tiedot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Otsikko</p>
              <p className="text-xl font-bold leading-tight">{bill.title}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Demokratia-vaje</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-purple-600 leading-none">{minutes?.democracy_gap_score || 0}%</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pb-1">Vastaavuusaste</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Analysis Section */}
      <main className="max-w-6xl mx-auto px-8 pt-16 space-y-24">
        {/* The 'Why' Engine Results */}
        <section className="space-y-10">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <FileText size={24} className="text-purple-600" />
            <h2 className="text-2xl font-black uppercase tracking-widest">Kansan perustelumuistio</h2>
          </div>
          <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed italic border-l-4 border-purple-200 pl-8">
            {minutes?.summary_memo || "Ladataan analyysia..."}
          </div>
        </section>

        {/* Triple-Column Comparison */}
        <section className="space-y-12">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <Users size={24} className="text-purple-600" />
            <h2 className="text-2xl font-black uppercase tracking-widest">Pykäläkohtainen vertailu</h2>
          </div>

          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black bg-slate-200 px-3 py-1 rounded-sm">{section.section_number}</span>
                  <h3 className="text-xl font-bold">{section.title}</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-2 border-slate-200 divide-x-2 divide-slate-200">
                  {/* Pillar 1: Government */}
                  <div className="p-6 bg-white space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Building2 size={12} /> Hallitus
                    </p>
                    <div className="text-sm leading-relaxed text-slate-600">
                      {section.content}
                    </div>
                  </div>

                  {/* Pillar 2: Shadow Parliament */}
                  <div className="p-6 bg-purple-50 space-y-4">
                    <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest flex items-center gap-2">
                      <Shield size={12} /> Varjoeduskunta
                    </p>
                    <div className="text-sm leading-relaxed">
                      <ClauseDiffView 
                        original={section.content} 
                        modified={section.current_shadow_text || null} 
                      />
                    </div>
                  </div>

                  {/* Pillar 3: Real Parliament */}
                  <div className="p-6 bg-slate-50 space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                      <Scale size={12} /> Todellisuus
                    </p>
                    <div className="text-sm leading-relaxed text-slate-700">
                      {section.real_final_text || section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ideological Divergence Analysis */}
        <section className="space-y-10 bg-slate-900 text-white p-12 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" />
          <div className="flex items-center gap-4 pb-4">
            <Users size={24} className="text-purple-400" />
            <h2 className="text-2xl font-black uppercase tracking-widest">Eroavaisuusanalyysi</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="prose prose-invert prose-lg max-w-none text-slate-300">
              {minutes?.ideological_divergence || "Ladataan ideologista analyysia..."}
            </div>
            <div className="flex flex-col justify-center items-center p-8 bg-white/5 border border-white/10 rounded-xl space-y-4 text-center">
              <div className="text-6xl font-black text-purple-400">{100 - (minutes?.democracy_gap_score || 0)}%</div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Kansalaisten ohitusaste</p>
              <p className="text-sm text-slate-400 italic">
                Tämä luku kuvaa, kuinka suuri osa Varjoeduskunnan parannusehdotuksista sivuutettiin lopullisessa päätöksenteossa.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t-2 border-slate-200 p-4 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status: Valmis</p>
              <p className="text-xs font-bold text-slate-700">Varjopöytäkirja on arkistoitu.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-sm font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">
              <Download size={16} />
              Lataa PDF
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-purple-600 text-white rounded-sm font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all">
              <Mail size={16} />
              Lähetä kansanedustajalle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

