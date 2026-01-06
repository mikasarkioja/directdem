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
      <AuthErrorToast error={error} />

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view || "overview"} />
      </Suspense>
    </div>
  );
}

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view || "overview"} />
      </Suspense>
    </div>
  );
}


