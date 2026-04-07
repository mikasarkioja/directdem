"use client";

import { generateWeeklyBulletin } from "@/app/actions/weekly-bulletin-editor";
import type { WeeklyBulletinPayload } from "@/app/actions/weekly-bulletin-editor";
import WeeklyBulletinEditorFeed from "@/components/dashboard/bulletin/WeeklyBulletinEditorFeed";
import { Button } from "@/components/ui/button";
import { Playfair_Display } from "next/font/google";
import { Loader2, Newspaper, Share2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import toast from "react-hot-toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
});

export default function BulletinEditorClient({
  initialStart,
  initialEnd,
}: {
  initialStart: string;
  initialEnd: string;
}) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [bulletin, setBulletin] = useState<WeeklyBulletinPayload | null>(null);
  const [isPending, startTransition] = useTransition();

  const onGenerate = useCallback(() => {
    startTransition(async () => {
      const res = await generateWeeklyBulletin(start, end);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBulletin(res.bulletin);
      toast.success("Viikkolehti generoitu.");
    });
  }, [start, end]);

  const placeholderShare = () => {
    toast(
      "PDF / uutiskirje -jako: tulossa (placeholder). Voit kopioida sisällön tai tulostaa sivun.",
      { icon: "📎" },
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[var(--accent-primary)]">
              <Newspaper className="h-4 w-4" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Toimitus
              </span>
            </div>
            <h1
              className={`${playfair.className} text-2xl font-bold text-white sm:text-3xl`}
            >
              Viikkobulletiini
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Ammattimainen viikkokatsaus: päätökset, media, Avoimuusrekisterin
              vaikuttajat ja Espoon pulssi. Generointi Gemini 3 Flash + Google
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
              Jaa PDF / uutiskirje
            </Button>
          </div>
        </div>

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
            disabled={isPending}
            onClick={onGenerate}
            className="bg-[var(--accent-primary)] text-slate-950 hover:opacity-90"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generoi viikkolehti
          </Button>
        </div>

        {bulletin ? (
          <WeeklyBulletinEditorFeed
            bulletin={bulletin}
            serifClassName={playfair.className}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            Valitse aikaväli ja generoi. GEMINI_API_KEY vaaditaan.
          </p>
        )}
      </div>
    </div>
  );
}
