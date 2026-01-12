import { getUser } from "@/app/actions/auth";
import DashboardClient from "./DashboardClient";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function DashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const user = await getUser();
  const isResearcher = searchParams.view === "researcher";

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <main className={`${isResearcher ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500`}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
              Ladataan Digitaalista Työhuonetta...
            </p>
          </div>
        }>
          <DashboardClient initialUser={user} />
        </Suspense>
      </main>
    </div>
  );
}

