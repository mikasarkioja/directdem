import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";
import { Suspense } from "react";
import type { DashboardView } from "@/lib/types";

// Pakotettu build-päivitys sessio-ongelmien ratkaisemiseksi
export const dynamic = "force-dynamic";

const DASHBOARD_VIEWS = new Set<DashboardView>([
  "overview",
  "bills",
  "municipal",
  "consensus",
  "profile",
  "parties",
  "debate",
  "ranking",
  "analysis",
  "workspace",
  "arena",
  "kuntavahti",
  "researcher",
]);

function parseViewParam(raw: string | string[] | undefined): DashboardView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && DASHBOARD_VIEWS.has(value as DashboardView)) {
    return value as DashboardView;
  }
  return "overview";
}

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const view = parseViewParam(searchParams.view);

  let user = null;
  try {
    user = await getUser();
  } catch (e) {
    // Silently fail to keep the page alive
  }

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />

      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">
            Ladataan...
          </div>
        }
      >
        <Dashboard user={user} initialView={view} />
      </Suspense>
    </div>
  );
}
