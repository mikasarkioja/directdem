import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const view = (searchParams.view as string) || "overview";
  const auth = searchParams.auth as string;
  
  let user = null;
  try {
    user = await getUser();
  } catch (e) {}

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      
      {auth === 'success' && !user && (
        <div className="bg-amber-500 text-white p-4 flex flex-col items-center gap-2 shadow-lg">
          <p className="text-xs font-black uppercase tracking-widest">
            Kirjautuminen onnistui! Istuntoa aktivoidaan...
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Päivitä sivu (Hard Reload)
          </button>
        </div>
      )}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
