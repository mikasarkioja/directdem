import type { WeeklyBulletinPayload } from "@/app/actions/weekly-bulletin-editor";
import { ReferenceRichText } from "@/components/dashboard/bulletin/reference-rich-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Radio, Scale, Sparkles } from "lucide-react";

function stanceLabel(s: "pro" | "contra" | "mixed"): string {
  if (s === "pro") return "Myötävaikutus";
  if (s === "contra") return "Vastainen";
  return "Kiertävä / ehdollinen";
}

export default function WeeklyBulletinEditorFeed({
  bulletin,
  serifClassName,
}: {
  bulletin: WeeklyBulletinPayload;
  serifClassName: string;
}) {
  const src = bulletin.sources;

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      <header className="space-y-2 border-b border-slate-800 pb-8">
        {bulletin.groundingUsed ? (
          <Badge
            variant="outline"
            className="mb-2 gap-1 border-sky-500/35 bg-sky-950/30 text-sky-200"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            Google-haku (grounding)
          </Badge>
        ) : null}
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Eduskuntavahti · Viikkolehti
        </p>
        <p className="text-sm text-slate-400">
          Jaksot:{" "}
          <time dateTime={bulletin.periodStart}>
            {new Date(bulletin.periodStart).toLocaleDateString("fi-FI")}
          </time>{" "}
          –{" "}
          <time dateTime={bulletin.periodEnd}>
            {new Date(bulletin.periodEnd).toLocaleDateString("fi-FI")}
          </time>
        </p>
      </header>

      {/* Hero / Main story */}
      <Card className="overflow-hidden border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Pääjuttu
            </span>
          </div>
          <h1
            className={`${serifClassName} text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl`}
          >
            {bulletin.mainStory.headline}
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            {bulletin.mainStory.dek}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-base leading-relaxed text-slate-200">
          <div className="whitespace-pre-wrap">
            <ReferenceRichText text={bulletin.mainStory.body} sources={src} />
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              Miksi tämä merkitsee
            </h2>
            <p className="leading-relaxed text-slate-200">
              <ReferenceRichText
                text={bulletin.mainStory.whyItMatters}
                sources={src}
              />
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impact strip */}
      {bulletin.impactScores.length > 0 ? (
        <section aria-labelledby="impact-heading">
          <h2
            id="impact-heading"
            className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500"
          >
            <Scale className="h-4 w-4 text-[var(--accent-primary)]" />
            Vaikutusarviot (AI)
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {bulletin.impactScores.slice(0, 8).map((row) => (
              <li
                key={row.decisionId}
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-black tabular-nums text-[var(--accent-primary)]">
                    {row.score}
                  </span>
                  <span className="truncate text-[10px] text-slate-500">
                    {row.decisionId.slice(0, 8)}…
                  </span>
                </div>
                <p className="mt-2 text-sm leading-snug text-slate-300">
                  {row.rationale}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Separator className="bg-slate-800" />

      {/* Lobby radar */}
      <section aria-labelledby="lobby-heading" className="space-y-4">
        <h2
          id="lobby-heading"
          className={`${serifClassName} text-2xl font-semibold text-slate-50`}
        >
          Vaikuttajien viikko
        </h2>
        {bulletin.lobbyistWeek.sectionEyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {bulletin.lobbyistWeek.sectionEyebrow}
          </p>
        ) : null}
        <Card className="border-slate-800 bg-slate-900/35">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <p className="text-sm font-medium text-[var(--accent-primary)]">
              {bulletin.lobbyistWeek.leadOrganization} →{" "}
              {bulletin.lobbyistWeek.targetBillLabel}
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              <ReferenceRichText
                text={bulletin.lobbyistWeek.narrative}
                sources={src}
              />
            </div>
            <Separator className="bg-slate-800" />
            <ul className="space-y-4">
              {bulletin.lobbyistWeek.topLobbyists.map((row, idx) => (
                <li
                  key={`${row.organization}-${idx}`}
                  className="rounded-md border border-slate-800/80 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-100">
                      {row.organization}
                    </span>
                    <Badge
                      variant={
                        row.stance === "contra"
                          ? "destructive"
                          : row.stance === "pro"
                            ? "success"
                            : "outline"
                      }
                    >
                      {stanceLabel(row.stance)}
                    </Badge>
                    {row.proposalAdoptedIntoBill ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/50 text-amber-200"
                      >
                        Mahdollinen omaksuminen / konflikti
                      </Badge>
                    ) : null}
                  </div>
                  {row.metWith ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Kohtaa / konteksti: {row.metWith}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Kohde: {row.targetBillOrTopic}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    <ReferenceRichText text={row.summary} sources={src} />
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Pulse / Espoo */}
      <section aria-labelledby="pulse-heading">
        <h2
          id="pulse-heading"
          className={`${serifClassName} mb-4 flex items-center gap-2 text-2xl font-semibold text-slate-50`}
        >
          <Radio className="h-6 w-6 text-[var(--accent-primary)]" />
          Pulssi · Espoo ja valtakunnan rytmi
        </h2>
        <Card className="border-slate-800 bg-slate-900/30">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <p className="leading-relaxed text-slate-200">
              <ReferenceRichText text={bulletin.pulse.summary} sources={src} />
            </p>
            <ul className="space-y-3">
              {bulletin.pulse.highlights.map((h, i) => (
                <li
                  key={i}
                  className="border-l-2 border-[var(--accent-primary)]/40 pl-4"
                >
                  <p className="font-medium text-slate-100">
                    {h.municipalTitle}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    <ReferenceRichText text={h.nationalTieIn} sources={src} />
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Sources */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          Lähteet (bulletiinin viitteet)
        </h2>
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
            <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-slate-500">
              Lisälähteet (Google-haku)
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {bulletin.groundingSources.map((s, i) => (
                <li key={`g-${s.url}-${i}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent-primary)] hover:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </div>
  );
}
