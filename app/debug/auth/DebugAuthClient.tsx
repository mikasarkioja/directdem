'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuthClient() {
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
        browser: typeof navigator !== 'undefined' ? navigator.navigator.userAgent : 'Unknown'
      });
      
      setLoading(false);
    }
    checkAuth();
  }, []);

  const hasActualAuthToken = cookies.split(';').some(c => {
    const name = c.trim().split('=')[0];
    return name.includes('auth-token') && !name.includes('code-verifier');
  });

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
      <div className={`p-4 rounded-xl border ${session ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300' : 'bg-rose-900/20 border-rose-500/50 text-rose-300'}`}>
        {session ? (
          <pre className="overflow-auto max-h-40 text-[10px]">
            {JSON.stringify({ 
              user: session.user.email,
              expires: new Date(session.expires_at * 1000).toLocaleString()
            }, null, 2)}
          </pre>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="font-bold uppercase tracking-widest">Ei istuntoa selaimessa</span>
          </div>
        )}
      </div>

      <div className="bg-black/40 p-3 rounded-lg overflow-y-auto max-h-40 font-mono text-[9px] text-slate-400">
        <p className="mb-1 text-slate-500 font-bold uppercase">Selaimen evästeet:</p>
        {cookies ? (
          <ul className="space-y-1">
            {cookies.split(';').map((c, i) => {
              const isToken = c.includes('auth-token') && !c.includes('code-verifier');
              return (
                <li key={i} className={isToken ? 'text-emerald-400 font-bold' : 'opacity-50'}>
                  {c.trim().substring(0, 50)}...
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="text-rose-500 italic">Ei evästeitä.</span>
        )}
      </div>

      <div className="pt-4 flex flex-wrap gap-2">
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
        >
          Etusivu
        </button>
        <button 
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
        >
          Nollaa
        </button>
      </div>
    </div>
  );
}

