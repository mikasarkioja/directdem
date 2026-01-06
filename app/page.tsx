import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import FirstTimeGDPR from "@/components/FirstTimeGDPR";
import AuthErrorToast from "@/components/AuthErrorToast";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const view = (resolvedSearchParams.view as string) || "overview";
  const error = resolvedSearchParams.error as string;
  const auth = resolvedSearchParams.auth as string;

  // Server-side user fetch using Next.js 15 cookies()
  let user = null;
  try {
    user = await getUser();
  } catch (err) {
    console.error("[Home] Failed to get user:", err);
  }
  
  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      {user && <FirstTimeGDPR userId={user.id} />}
      
      {/* 
        DEBUG STATUS BAR - Only visible if there are parameters 
      */}
      {(error || auth) && (
        <div className="bg-slate-900 text-white text-[8px] font-mono py-1 px-4 flex gap-4 uppercase tracking-tighter opacity-50 sticky top-16 z-50">
          <span>Debug Mode:</span>
          {error && <span className="text-rose-400">Error: {error}</span>}
          {auth && <span className="text-emerald-400">Auth: {auth}</span>}
          <span>User: {user ? 'Logged In' : 'Guest'}</span>
          <span>Cookies: {user ? 'Active' : 'Missing/Rejected'}</span>
        </div>
      )}

      {/* Auth State Display */}
      <AuthErrorToast error={error} />
      
      {auth === 'success' && !user && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
          <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-2xl border border-amber-400 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <span className="text-2xl animate-spin inline-block">🔄</span>
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-black uppercase text-[10px] tracking-widest">Istuntoa alustetaan</p>
                <p className="font-bold text-sm">Kirjautuminen onnistui! Odotetaan evästeiden vahvistusta...</p>
                <p className="text-[10px] opacity-80">Jos sivu ei päivity 5 sekunnissa, paina alla olevaa nappia.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/10"
            >
              Päivitä sivu manuaalisesti
            </button>
          </div>
          
          <script dangerouslySetInnerHTML={{ __html: `
            // Only reload if we haven't tried recently to avoid infinite loops
            const lastReload = sessionStorage.getItem('auth_reload_time');
            const now = Date.now();
            if (!lastReload || (now - parseInt(lastReload)) > 10000) {
              sessionStorage.setItem('auth_reload_time', now.toString());
              setTimeout(() => {
                console.log("Auto-refreshing to activate session...");
                window.location.href = '/';
              }, 3000);
            }
          `}} />
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
