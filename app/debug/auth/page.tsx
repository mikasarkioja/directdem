'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const [session, setSession] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setCookies(document.cookie);
      
      // Basic env check (safe for client)
      setEnvInfo({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      });
      
      setLoading(false);
    }
    checkAuth();
  }, []);

  return (
    <div className="p-10 font-mono text-xs bg-slate-950 text-emerald-400 min-h-screen">
      <h1 className="text-xl font-black mb-6 text-white uppercase tracking-widest">Auth Diagnostiikka</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">1. Selainpohjainen istunto (Client Side)</h2>
          {loading ? (
            <p>Ladataan...</p>
          ) : (
            <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-auto max-h-40">
              {JSON.stringify(session, null, 2) || 'EI ISTUNTOA (Session is null)'}
            </pre>
          )}
        </section>

        <section>
          <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">2. Evästeet (Raw Cookies)</h2>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 break-all">
            {cookies || 'EI EVÄSTEITÄ (No cookies found)'}
          </div>
        </section>

        <section>
          <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">3. Ympäristömuuttujat (Client Access)</h2>
          <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            {JSON.stringify(envInfo, null, 2)}
          </pre>
        </section>

        <div className="pt-6 border-t border-slate-800">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold"
          >
            Palaa etusivulle
          </button>
          <button 
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="ml-4 px-6 py-2 bg-rose-600 text-white rounded-lg font-bold"
          >
            Nollaa istunto (Sign Out)
          </button>
        </div>
      </div>

      <div className="mt-10 p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/30 text-emerald-300">
        <p className="font-bold mb-2">Vianetsintä-ohje:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Jos "Selainpohjainen istunto" on NULL mutta "Evästeet" sisältää sb-...-auth-tokenin, ongelma on Vercelin ja Supabasen välisessä kättelyssä.</li>
          <li>Jos molemmat ovat tyhjiä, selain hylkäsi evästeet.</li>
          <li>Varmista, että Vercelin asetuksissa SITE_URL on asetettu oikein.</li>
        </ul>
      </div>
    </div>
  );
}
