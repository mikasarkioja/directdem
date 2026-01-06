import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import FirstTimeGDPR from "@/components/FirstTimeGDPR";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view as any;
  const error = resolvedSearchParams.error as string;

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
      
      {/* Auth Error Display */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-2xl border border-rose-500 flex items-start gap-3 animate-bounce">
            <div className="bg-white/20 p-2 rounded-xl">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="font-black uppercase text-[10px] tracking-widest opacity-70">Kirjautumisvirhe</p>
              <p className="font-bold text-sm">{decodeURIComponent(error)}</p>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view || "overview"} />
      </Suspense>
    </div>
  );
}


