'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const [session, setSession] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [envInfo, setEnvInfo] = useState<any>({ url: '', key: '' });

  useEffect(() => {
    async function checkAuth() {
      if (typeof window === 'undefined') return;

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setCookies(document.cookie);
      
      setEnvInfo({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
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
            <p className="animate-pulse">Ladataan...</p>
          ) : (
            <div className={`p-4 rounded-xl border ${session ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300' : 'bg-rose-900/20 border-rose-500/50 text-rose-300'}`}>
              {session ? (
                <pre className="overflow-auto max-h-40">
                  {JSON.stringify({ 
                    user: session.user.email,
                    expires: new Date(session.expires_at * 1000).toLocaleString()
                  }, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg">❌</span>
                  <span className="font-bold uppercase tracking-widest">Ei istuntoa löydetty</span>
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">2. Evästeet (Raw Cookies)</h2>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 break-all overflow-y-auto max-h-40 font-mono text-[10px]">
            {cookies ? (
              <ul className="space-y-1">
                {cookies.split(';').map((c, i) => (
                  <li key={i} className={c.includes('auth-token') ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {c.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-rose-500 italic">Ei evästeitä löytynyt selaimesi muistista.</span>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">3. Järjestelmä</h2>
            <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-[10px]">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">4. Tarkistuslista</h2>
            <ul className="space-y-2 text-[10px]">
              <li className="flex gap-2">
                <span>{cookies.includes('auth-token') ? '✅' : '❌'}</span>
                <span>Auth Token eväste</span>
              </li>
              <li className="flex gap-2">
                <span>{cookies.includes('code-verifier') ? '✅' : '❌'}</span>
                <span>PKCE Code Verifier</span>
              </li>
              <li className="flex gap-2">
                <span>{typeof window !== 'undefined' ? '✅' : '❌'}</span>
                <span>Window Context</span>
              </li>
            </ul>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
          >
            Palaa etusivulle
          </button>
          <button 
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
          >
            Nollaa istunto (Sign Out)
          </button>
        </div>
      </div>

      <div className="mt-10 p-6 bg-blue-900/20 rounded-2xl border border-blue-500/30 text-blue-300">
        <p className="font-black uppercase tracking-widest text-xs mb-3">Mitä seuraavaksi?</p>
        <ol className="list-decimal ml-5 space-y-2 text-[10px] font-bold">
          <li>Jos "Auth Token eväste" on ❌: Kokeile toista selainta (esim. Chrome).</li>
          <li>Jos käytät Incognito-tilaa, Magic Link on avattava SAMASSA Incognito-ikkunassa.</li>
          <li>Varmista, ettei selaimesi estä "First-party cookies" -asetusta.</li>
        </ol>
      </div>
    </div>
  );
}
