'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function AuthStatusBanner({ user, auth }: { user: any, auth: string | null }) {
  const router = useRouter();

  if (auth !== 'success' || user) return null;

  return (
    <div className="bg-amber-500 text-white p-4 flex flex-col items-center gap-3 shadow-lg sticky top-16 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3">
        <RefreshCw size={18} className="animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest">
          Kirjautuminen onnistui! Istuntoa aktivoidaan...
        </p>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={() => {
            // Force a hard reload to clear Next.js route cache and pick up cookies
            window.location.href = '/?auth=done';
          }}
          className="px-6 py-2 bg-white text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          Päivitä sivu nyt
        </button>
      </div>
      <p className="text-[9px] opacity-80 font-bold max-w-md text-center leading-relaxed">
        Jos olet edelleen "Vieras" päivityksen jälkeen, selaimesi saattaa estää evästeiden tallentamisen. 
        Kokeile toista selainta tai kytke mainostenesto (uBlock/AdBlock) pois päältä.
      </p>
    </div>
  );
}

