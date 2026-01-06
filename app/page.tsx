import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await params as required by Next.js 15
  const searchParams = await props.searchParams;
  const view = (searchParams.view as string) || "overview";
  const auth = searchParams.auth as string;
  
  // Minimalistic user fetch
  let user = null;
  try {
    user = await getUser();
  } catch (e) {
    // Silently fail to keep the page alive
  }

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      
      {/* Basic success indicator */}
      {auth === 'success' && !user && (
        <div className="bg-amber-500 text-white p-4 text-center text-xs font-black uppercase tracking-widest shadow-lg">
          Kirjautuminen onnistui! Päivitä sivu (F5) aktivoitaksesi istunnon.
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
