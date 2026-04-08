"use client";

import type { EditorialBulletinPayload } from "@/app/actions/bulletin-generator";
import { ReferenceRichText } from "@/components/dashboard/bulletin/reference-rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Eye,
  Link2,
  Mail,
  Newspaper,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { subscribePublicWeeklyBulletin } from "@/app/actions/public-newsletter";

function stanceFi(s: "pro" | "contra" | "mixed"): string {
  if (s === "pro") return "Myötävaikutus";
  if (s === "contra") return "Vastainen";
  return "Ehdollinen / sekava";
}

function alignFi(a: "aligned" | "partially" | "opposed" | "unclear"): string {
  const m = {
    aligned: "Linjassa lopputuloksen kanssa",
    partially: "Osittain linjassa",
    opposed: "Linja tulkittavissa vastakkaiseksi",
    unclear: "Ei yksiselitteistä linjausta",
  };
  return m[a];
}

export default function EditorialBulletinMagazine({
  bulletin,
  serifClassName,
  showDemoBanner,
}: {
  bulletin: EditorialBulletinPayload;
  serifClassName: string;
  /** Näytä kun LOBBY_TRACE_USE_MOCK on päällä tai data on kehitysdemo */
  showDemoBanner: boolean;
}) {
  const src = bulletin.citationSources;
  const highImpact = bulletin.leadStory.aggregateImpactScore >= 71;
  const [email, setEmail] = useState("");
  const [subPending, setSubPending] = useState(false);

  const onSubscribe = async () => {
    setSubPending(true);
    try {
      const res = await subscribePublicWeeklyBulletin(email);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } catch {
      toast.error("Tilaus epäonnistui.");
    } finally {
      setSubPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-24">
      {showDemoBanner ? (
        <div
          className="flex gap-3 rounded-xl border border-amber-500/35 bg-amber-950/25 p-4 text-sm text-amber-100"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Demo-tila: lobbausjäljitys</p>
            <p className="mt-1 text-amber-100/85">
              <code className="text-xs">LOBBY_TRACE_USE_MOCK=true</code> —
              lausuntopalvelu- ja avoimuuskeräin käyttää mock-signaaleja.
              Tuotannossa poista mock käyttääksesi reaalisia tauluja (
              <code className="text-xs">lobbyist_interventions</code>).
            </p>
          </div>
        </div>
      ) : null}

      <header className="space-y-3 border-b border-slate-800 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Newspaper className="h-5 w-5 text-[var(--accent-primary)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Toimituksen viikkolehti
          </span>
          {bulletin.groundingUsed ? (
            <Badge
              variant="outline"
              className="gap-1 border-sky-500/35 bg-sky-950/30 text-sky-200"
            >
              <Link2 className="h-3 w-3" aria-hidden />
              Google Grounding
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-slate-400">
          <time dateTime={bulletin.periodStart}>
            {new Date(bulletin.periodStart).toLocaleDateString("fi-FI")}
          </time>
          {" — "}
          <time dateTime={bulletin.periodEnd}>
            {new Date(bulletin.periodEnd).toLocaleDateString("fi-FI")}
          </time>
        </p>
      </header>

      {/* Hero / Lead */}
      <Card className="overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-xl shadow-black/20">
        <CardHeader className="space-y-4 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200/90">
              Viikon polttopiste
            </span>
            <Badge
              variant="outline"
              className={
                highImpact
                  ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200 gap-1"
                  : "border-slate-600 text-slate-300 gap-1"
              }
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Vaikutus{" "}
              <span className="tabular-nums">
                {bulletin.leadStory.aggregateImpactScore}
              </span>
              /100
            </Badge>
          </div>
          <CardTitle
            className={`${serifClassName} text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl`}
          >
            {bulletin.leadStory.headline}
          </CardTitle>
          <CardDescription className="text-base text-slate-300 sm:text-lg">
            {bulletin.leadStory.dek}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-lg leading-relaxed text-slate-200">
          <div className="whitespace-pre-wrap">
            <ReferenceRichText text={bulletin.leadStory.body} sources={src} />
          </div>
          <p className="text-[10px] text-slate-500">
            <Link2 className="mb-0.5 mr-1 inline h-3 w-3 text-[var(--accent-primary)]" />
            Viitteet: klikkaa yläindeksoituja{" "}
            <span className="text-[var(--accent-primary)]">[1]</span> jne.
          </p>
        </CardContent>
      </Card>

      {/* Lobby radar */}
      <section aria-labelledby="lobby-spotlight-h" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Eye className="h-6 w-6 text-[var(--accent-primary)]" aria-hidden />
          <h2
            id="lobby-spotlight-h"
            className={`${serifClassName} text-2xl font-semibold text-white sm:text-3xl`}
          >
            Vaikuttajien jälki
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Lobbyistitutka: organisaatioiden aktiivisuus ja linja suhteessa
          päätös- ja menettelykulkuun.
        </p>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-xl text-slate-100">
              {bulletin.lobbySpotlight.headline}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-300">
              <ReferenceRichText
                text={bulletin.lobbySpotlight.body}
                sources={src}
              />
            </div>
            <Separator className="bg-slate-800" />
            <ul className="space-y-4">
              {bulletin.lobbySpotlight.topLobbyists.map((row, idx) => (
                <li
                  key={`${row.organization}-${idx}`}
                  className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-100">
                      {row.organization}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {stanceFi(row.stance)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-500 text-slate-200"
                    >
                      {alignFi(row.alignmentWithOutcome)}
                    </Badge>
                    {row.conflictIndicator ? (
                      <Badge className="gap-1 border border-amber-500/40 bg-amber-950/50 text-amber-100">
                        <AlertTriangle className="h-3 w-3" />
                        Sidonnaisuus-signaali
                      </Badge>
                    ) : null}
                  </div>
                  {row.conflictNote ? (
                    <p className="mt-2 text-xs text-amber-200/90">
                      {row.conflictNote}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    <ReferenceRichText text={row.summary} sources={src} />
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Nutshell */}
      <Card className="border-slate-800 bg-slate-900/35">
        <CardHeader>
          <CardTitle
            className={`${serifClassName} text-2xl font-semibold text-slate-50`}
          >
            Päätökset pähkinänkuoressa
          </CardTitle>
          <p className="text-sm text-slate-500">{bulletin.nutshell.headline}</p>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-slate-500 mb-3">
            Selkokieli — tiivis katsaus pienempiin mutta relevantteihin
            tapahtumiin.
          </p>
          <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-300">
            <ReferenceRichText text={bulletin.nutshell.body} sources={src} />
          </div>
        </CardContent>
      </Card>

      {/* Event scores (scannable) */}
      {bulletin.eventScores.length > 0 ? (
        <section aria-labelledby="scores-h">
          <h3
            id="scores-h"
            className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500"
          >
            Viikon tapahtumat — vaikutusarviot
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {bulletin.eventScores.map((ev) => (
              <li
                key={`${ev.eventRef}-${ev.eventType}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <span className="truncate text-slate-300">{ev.label}</span>
                <span
                  className={
                    ev.impactScore >= 71
                      ? "shrink-0 font-black tabular-nums text-emerald-400"
                      : "shrink-0 font-bold tabular-nums text-slate-500"
                  }
                >
                  {ev.impactScore}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Separator className="bg-slate-800" />

      {/* Sources */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link2 className="h-4 w-4 text-[var(--accent-primary)]" />
          Lähteet (klikkaa viitettä tekstissä tai alla)
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300 marker:text-[var(--accent-primary)]">
          {src.map((s, i) => (
            <li key={`${s.url}-${i}`}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--accent-primary)] hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
        {bulletin.groundingSources.length > 0 ? (
          <>
            <h4 className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Grounding (Google-haku)
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {bulletin.groundingSources.map((s, i) => (
                <li key={`g-${s.url}-${i}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {/* Subscribe placeholder — Resend / newsletter_subscribers */}
      <Card className="border-slate-800 border-dashed bg-slate-900/20">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
              <Mail className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Tilaa uutiskirjeenä
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Sähköpostilistalle tulee viikkobulletiini (Resend / cron). Stripe
              käsittelee erikseen tilauspaketit.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sähköposti@example.com"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              autoComplete="email"
            />
          </div>
          <Button
            type="button"
            disabled={subPending || !email.trim()}
            onClick={() => void onSubscribe()}
            className="shrink-0 bg-[var(--accent-primary)] px-5 text-slate-950 hover:opacity-90"
          >
            {subPending ? "Lähetetään…" : "Tilaa"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
