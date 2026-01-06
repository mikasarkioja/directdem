import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import DebugAuthClient from './DebugAuthClient';

export const dynamic = 'force-dynamic';

export default async function DebugAuthPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const serverData = {
    session: session ? 'Löytyy' : 'Ei löydy',
    user: user ? user.email : 'Ei löydy',
    sessionError: sessionError?.message || null,
    userError: userError?.message || null,
    cookieCount: allCookies.length,
    authCookies: allCookies
      .filter(c => c.name.includes('auth-token'))
      .map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
  };

  return (
    <div className="p-10 font-mono text-xs bg-slate-950 text-emerald-400 min-h-screen">
      <h1 className="text-xl font-black mb-6 text-white uppercase tracking-widest">Auth Diagnostiikka v3 (Full Stack)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">1. Palvelimen tila (Server Side)</h2>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
            <pre className="text-emerald-300">
              {JSON.stringify(serverData, null, 2)}
            </pre>
            <div className="p-3 bg-black/40 rounded-lg text-[10px]">
              <p className="text-slate-500 mb-1">Palvelimen näkemät evästeet:</p>
              {serverData.authCookies.length > 0 ? (
                <ul className="space-y-1">
                  {serverData.authCookies.map((c, i) => (
                    <li key={i} className="text-emerald-500">✅ {c.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-rose-500">❌ Palvelin ei näe yhtään auth-evästettä.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-amber-400 font-bold mb-2 uppercase tracking-tight">2. Selaimen tila (Client Side)</h2>
          <DebugAuthClient />
        </section>
      </div>

      <div className="mt-10 p-6 bg-slate-900 rounded-2xl border border-slate-800">
        <h3 className="text-white font-bold mb-4">Vianetsintä-matriisi</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="pb-2">Skenaario</th>
              <th className="pb-2">Syy</th>
              <th className="pb-2">Ratkaisu</th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            <tr className="border-b border-slate-800/50">
              <td className="py-3 pr-4">Selain ✅ / Palvelin ❌</td>
              <td className="py-3 pr-4 text-rose-400">Middleware ei välitä evästeitä</td>
              <td className="py-3">Tarkista middleware.ts</td>
            </tr>
            <tr className="border-b border-slate-800/50">
              <td className="py-3 pr-4">Selain ❌ / Palvelin ❌</td>
              <td className="py-3 pr-4 text-rose-400">Evästeet eivät tallennu selaimen muistiin</td>
              <td className="py-3">Domain/Secure/SameSite ongelma</td>
            </tr>
            <tr>
              <td className="py-3 pr-4">Molemmat ✅ muttei toimi</td>
              <td className="py-3 pr-4 text-rose-400">Next.js reititysvälimuisti (Cache)</td>
              <td className="py-3 text-emerald-400">Paina CTRL + F5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
