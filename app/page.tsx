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
      
      {/* Client-side auto-refresh script if auth success but user is null */}
      {auth === 'success' && !user && (
        <script dangerouslySetInnerHTML={{ __html: `
          setTimeout(() => {
            console.log("Auth success detected but no user session. Retrying...");
            window.location.reload();
          }, 2000);
        `}} />
      )}

      {/* 
        DEBUG STATUS BAR - Only visible if there are parameters 
      */}
      {(error || auth) && (
        <div className="bg-slate-900 text-white text-[8px] font-mono py-1 px-4 flex gap-4 uppercase tracking-tighter opacity-50">
          <span>Debug:</span>
          {error && <span className="text-rose-400">Error: {error}</span>}
          {auth && <span className="text-emerald-400">Auth: {auth}</span>}
          <span>User: {user ? 'Logged In' : 'Guest'}</span>
        </div>
      )}

      {/* Auth State Display */}
      <AuthErrorToast error={error} />
      
      {auth === 'success' && !user && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
          <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-2xl border border-amber-400 flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <span className="text-2xl animate-spin inline-block">🔄</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-black uppercase text-[10px] tracking-widest">Istuntoa alustetaan</p>
              <p className="font-bold text-sm">Kirjautuminen onnistui! Viimeistellään asetuksia, sivu päivittyy hetken kuluttua automaattisesti...</p>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
