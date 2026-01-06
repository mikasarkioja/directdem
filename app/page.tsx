import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import AuthStatusBanner from "@/components/AuthStatusBanner";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const view = (searchParams.view as string) || "overview";
  const auth = searchParams.auth as string || null;
  
  let user = null;
  try {
    user = await getUser();
  } catch (e) {
    console.error("[Home] Auth failed:", e);
  }

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      
      {/* Safe client-side status banner */}
      <AuthStatusBanner user={user} auth={auth} />

      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">Ladataan keskusta...</div>}>
        <Dashboard user={user} initialView={view as any} />
      </Suspense>
    </div>
  );
}
