import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
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
  
  // Safe param extraction
  const viewParam = resolvedSearchParams.view;
  const view = (Array.isArray(viewParam) ? viewParam[0] : viewParam) || "overview";
  
  const errorParam = resolvedSearchParams.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  
  const authParam = resolvedSearchParams.auth;
  const auth = Array.isArray(authParam) ? authParam[0] : authParam;

  // Server-side user fetch
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
        Simplified Debug Info - No complex logic here to avoid crashes
      */}
      {(error || auth) && (
        <div className="bg-slate-900 text-white text-[8px] font-mono py-1 px-4 flex gap-4 uppercase tracking-tighter opacity-50">
          <span>Tila:</span>
          {error && <span className="text-rose-400">Virhe: {error}</span>}
          {auth && <span className="text-emerald-400">Auth: {auth}</span>}
          <span>Käyttäjä: {user ? 'Kirjautunut' : 'Vieras'}</span>
        </div>
      )}

      {/* Auth Error Display */}
      <AuthErrorToast error={error || ""} />
      
      {auth === 'success' && !user && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
          <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-2xl border border-amber-400 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <span className="text-2xl animate-pulse inline-block">🔄</span>
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-black uppercase text-[10px] tracking-widest text-white">Istuntoa alustetaan</p>
                <p className="font-bold text-sm">Kirjautuminen onnistui! Jos sivu ei päivity automaattisesti, paina nappia alta.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-white text-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-sm"
            >
              Päivitä sivu nyt
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
