import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const view = typeof resolvedParams.view === 'string' ? resolvedParams.view : "overview";
  const error = typeof resolvedParams.error === 'string' ? resolvedParams.error : null;
  const auth = typeof resolvedParams.auth === 'string' ? resolvedParams.auth : null;

  let user = null;
  try {
    user = await getUser();
  } catch (e) {
    console.error("Auth fetch failed:", e);
  }
  
  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      
      {auth === 'success' && !user && (
        <div className="bg-amber-500 text-white p-4 flex flex-col items-center gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="animate-spin text-xl">🔄</span>
            <p className="text-sm font-black uppercase tracking-widest">
              Kirjautuminen onnistui! Istuntoa aktivoidaan...
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-white text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
            >
              Päivitä sivu (F5)
            </button>
            <Link 
              href="/debug/auth"
              className="px-6 py-2 bg-amber-600 text-white border border-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors"
            >
              Tarkista diagnostiikka
            </Link>
          </div>
          <p className="text-[9px] opacity-80 font-bold">
            Jos istunto ei näy useankaan päivityksen jälkeen, selaimesi saattaa estää evästeiden tallentamisen.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-500 text-white p-4 text-center text-xs font-bold uppercase tracking-widest shadow-lg">
          Kirjautumisvirhe: {error}
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
