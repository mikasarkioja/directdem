'use client';

import { RefreshCw, ExternalLink, ShieldAlert } from 'lucide-react';

export default function AuthStatusBanner({ user, auth }: { user: any, auth: string | null }) {
  if (auth !== 'success' || user) return null;

  return (
    <div className="bg-amber-500 text-white p-6 flex flex-col items-center gap-4 shadow-2xl sticky top-16 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3">
        <RefreshCw size={24} className="animate-spin text-white" />
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-widest leading-none">Kirjautuminen tunnistettu!</p>
          <p className="text-[10px] font-bold opacity-90 mt-1 uppercase tracking-tighter">Odotetaan istunnon aktivoitumista...</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
        <button 
          onClick={() => window.location.href = '/?auth=done'}
          className="flex-1 min-w-[140px] px-6 py-3 bg-white text-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          Päivitä sivu
        </button>
        <button 
          onClick={() => window.location.href = '/debug/auth'}
          className="flex-1 min-w-[140px] px-6 py-3 bg-amber-600 text-white border border-amber-400/50 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-700 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <ExternalLink size={14} />
          Diagnostiikka
        </button>
      </div>

      <div className="bg-black/10 p-4 rounded-2xl border border-white/10 max-w-lg">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-200 shrink-0" />
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white uppercase tracking-tight leading-normal">
              HUOM: Jos olet edelleen "Vieras", syy on lähes varmasti Incognito-tilassa.
            </p>
            <p className="text-[9px] text-amber-100 font-medium leading-relaxed">
              Magic Link on <span className="font-black underline">kertakäyttöinen</span>. Jos sähköpostiohjelma avasi linkin tavalliseen ikkunaan, se ei enää toimi Incognitossa. 
              <br/><br/>
              <span className="font-black">RATKAISU:</span> Tilaa uusi linkki, klikkaa sitä hiiren oikealla {"->"} <span className="font-black">Kopioi linkin osoite</span> ja liitä se TÄHÄN ikkunaan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
