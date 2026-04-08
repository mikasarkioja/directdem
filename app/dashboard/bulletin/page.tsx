import { getUser } from "@/app/actions/auth";
import BulletinEditorClient from "@/components/dashboard/bulletin/BulletinEditorClient";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

const bulletinSerif = Playfair_Display({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viikkobulletiini | Omatase",
  description:
    "Toimituksen viikkolehti: Eduskunta, vaikuttajat ja Espoon pulssi",
};

function defaultUtcDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function bulletinEnvFlags() {
  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const initialLobbyTraceDemo = process.env.LOBBY_TRACE_USE_MOCK === "true";
  return { hasGeminiKey, hasServiceRole, initialLobbyTraceDemo };
}

export default async function BulletinDashboardPage() {
  const user = await getUser();
  const { start, end } = defaultUtcDateRange();
  const { hasGeminiKey, hasServiceRole, initialLobbyTraceDemo } =
    bulletinEnvFlags();

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />
      <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[var(--accent-primary)]"
          >
            ← Työpöytä
          </Link>
          <Link
            href="/dashboard/lobby-map"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[var(--accent-primary)]"
          >
            Lobbyist Connection Map →
          </Link>
        </div>
      </div>
      <BulletinEditorClient
        initialStart={start}
        initialEnd={end}
        user={user}
        hasGeminiKey={hasGeminiKey}
        hasServiceRoleKey={hasServiceRole}
        serifClassName={bulletinSerif.className}
        initialLobbyTraceDemo={initialLobbyTraceDemo}
      />
    </div>
  );
}
