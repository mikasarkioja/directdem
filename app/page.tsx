import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams as required by Next.js 15
  const resolvedParams = await searchParams;
  const view = typeof resolvedParams.view === 'string' ? resolvedParams.view : "overview";
  const error = typeof resolvedParams.error === 'string' ? resolvedParams.error : null;
  const auth = typeof resolvedParams.auth === 'string' ? resolvedParams.auth : null;

  // Attempt to get user, but don't let it crash the page
  let user = null;
  try {
    user = await getUser();
  } catch (e) {
    console.error("Auth fetch failed:", e);
  }
  
  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      
      {/* Simple status indicator if needed, but safe */}
      {auth === 'success' && !user && (
        <div className="bg-amber-500 text-white p-4 text-center text-xs font-bold">
          Kirjautuminen onnistui! Päivitä sivu (F5) jos istunto ei näy.
        </div>
      )}

      {error && (
        <div className="bg-rose-500 text-white p-4 text-center text-xs font-bold">
          Virhe: {error}
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
