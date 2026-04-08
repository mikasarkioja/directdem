"use client";

import { generateEditorialBulletin } from "@/app/actions/bulletin-generator";
import type { EditorialBulletinPayload } from "@/app/actions/bulletin-generator";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Loader2,
  Newspaper,
  Share2,
  BookOpen,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { UserProfile } from "@/lib/types";

const EditorialBulletinMagazine = dynamic(
  () => import("@/components/dashboard/bulletin/EditorialBulletinMagazine"),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
        Ladataan lehden asettelua…
      </p>
    ),
  },
);

export default function BulletinEditorClient({
  initialStart,
  initialEnd,
  user,
  hasGeminiKey,
  hasServiceRoleKey,
  serifClassName,
  initialLobbyTraceDemo,
}: {
  initialStart: string;
  initialEnd: string;
  user: UserProfile | null;
  hasGeminiKey: boolean;
  hasServiceRoleKey: boolean;
  serifClassName: string;
  initialLobbyTraceDemo: boolean;
}) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [bulletin, setBulletin] = useState<EditorialBulletinPayload | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const onGenerate = useCallback(async () => {
    setLastError(null);
    if (!user) {
      const msg =
        "Kirjaudu sisään tai käytä palvelua niin, että istunto on voimassa (esim. /login).";
      setLastError(msg);
      toast.error(msg);
      return;
    }
    if (!hasGeminiKey) {
      const msg =
        "GEMINI_API_KEY tai GOOGLE_GENERATIVE_AI_API_KEY puuttuu .env.local-tiedostosta. Lisää avain ja käynnistä dev-palvelin uudelleen.";
      setLastError(msg);
      toast.error(msg);
      return;
    }
    if (!hasServiceRoleKey) {
      const msg =
        "SUPABASE_SERVICE_ROLE_KEY puuttuu — bulletiinin data haetaan palvelinavaimella. Lisää avain .env.localiin.";
      setLastError(msg);
      toast.error(msg);
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateEditorialBulletin(start, end);
      if (!res.ok) {
        setLastError(res.error);
        toast.error(res.error);
        return;
      }
      setBulletin(res.bulletin);
      toast.success("Toimituksellinen lehti valmis.");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Tuntematon virhe generoinnissa.";
      setLastError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [start, end, user, hasGeminiKey, hasServiceRoleKey]);

  const placeholderShare = () => {
    toast(
      "PDF / Stripe-jako: tulossa. Uutiskirje käyttää Resend + newsletter_subscribers.",
      { icon: "📎" },
    );
  };

  const showDemoBanner =
    initialLobbyTraceDemo || bulletin?.lobbyTraceDemoMode === true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[var(--accent-primary)]">
              <BookOpen className="h-4 w-4" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Toimitus · Magazine
              </span>
            </div>
            <h1
              className={`${serifClassName} text-2xl font-bold text-white sm:text-3xl md:text-4xl`}
            >
              Viikkolehti
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Kuratoitu uutislehti: viikon polttopiste (vaikutus &gt; 70),
              vaikuttajien jälki sidonnaisuuksineen, ja selkokielinen
              pähkinänkuori. Editori: Gemini 3 Flash (
              <code className="text-xs">gemini-3-flash-preview</code>) + Google
              Grounding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 text-slate-200"
              onClick={placeholderShare}
              disabled={!bulletin}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Jaa / laskutus
            </Button>
          </div>
        </div>

        {!user ? (
          <div
            className="mb-6 flex gap-3 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100"
            role="status"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Kirjaudu sisään</p>
              <p className="mt-1 text-amber-100/85">
                Viikkolehden generointi vaatii voimassa olevan istunnon.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent("/dashboard/bulletin")}`}
                className="mt-3 inline-block text-[var(--accent-primary)] underline"
              >
                Siirry kirjautumaan →
              </Link>
            </div>
          </div>
        ) : null}

        {!hasGeminiKey ? (
          <div
            className="mb-6 flex gap-3 rounded-lg border border-rose-500/35 bg-rose-950/25 p-4 text-sm text-rose-100"
            role="status"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Gemini-API-avain puuttuu</p>
              <p className="mt-1 text-rose-100/85">
                Lisää tiedostoon <code className="text-xs">.env.local</code>{" "}
                rivi <code className="text-xs">GEMINI_API_KEY=…</code> (tai{" "}
                <code className="text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code>),
                ja käynnistä <code className="text-xs">npm run dev</code>{" "}
                uudelleen.
              </p>
            </div>
          </div>
        ) : null}

        {user && hasGeminiKey && !hasServiceRoleKey ? (
          <div
            className="mb-6 flex gap-3 rounded-lg border border-rose-500/35 bg-rose-950/25 p-4 text-sm text-rose-100"
            role="status"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">
                Supabase service role -avain puuttuu
              </p>
              <p className="mt-1 text-rose-100/85">
                Aseta <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                .env.localiin (Supabase → Project Settings → API).
              </p>
            </div>
          </div>
        ) : null}

        {showDemoBanner && !bulletin ? (
          <div
            className="mb-6 flex gap-3 rounded-lg border border-amber-500/35 bg-amber-950/20 p-4 text-sm text-amber-100/95"
            role="status"
          >
            <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Lobby-jäljitys: demo</p>
              <p className="mt-1 text-amber-100/80">
                Ympäristömerkintä: mock-keräin käytössä. Aseta{" "}
                <code className="text-xs">LOBBY_TRACE_USE_MOCK=false</code> ja
                synkkaa lausunnot tuotantodataan.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Alku (UTC)
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Loppu (UTC)
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <Button
            type="button"
            disabled={isGenerating}
            onClick={() => void onGenerate()}
            className="bg-[var(--accent-primary)] text-slate-950 hover:opacity-90"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generoi lehti
          </Button>
        </div>

        {lastError ? (
          <div
            className="mb-6 rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-100"
            role="alert"
          >
            <p className="font-semibold">Generointi epäonnistui</p>
            <p className="mt-1 whitespace-pre-wrap">{lastError}</p>
          </div>
        ) : null}

        {bulletin ? (
          <EditorialBulletinMagazine
            bulletin={bulletin}
            serifClassName={serifClassName}
            showDemoBanner={showDemoBanner}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            Valitse viimeiset 7 päivää tai muu aikaväli ja paina Generoi lehti.
            Tarvitset kirjautumisen, palvelinavaimen ja Gemini-avaimen.
          </p>
        )}
      </div>
    </div>
  );
}
