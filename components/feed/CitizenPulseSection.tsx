import type { CachedCitizenPulseRow } from "@/lib/feed/citizen-pulse-cache";

/**
 * Päivän pulssi: vain välimuistista (cron). Ei Geminiä tässä pyynnössä.
 */
export default function CitizenPulseSection({
  cachedPulse,
  feedItemCount,
}: {
  cachedPulse: CachedCitizenPulseRow | null;
  feedItemCount: number;
}) {
  if (feedItemCount === 0) {
    return (
      <section
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-8 md:px-8 md:py-10"
        aria-labelledby="citizen-pulse-heading"
      >
        <h2
          id="citizen-pulse-heading"
          className="font-[family-name:var(--font-news-serif)] text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl"
        >
          Päivän pulssi
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">
          Ei uusia päivityksiä juuri nyt. Syötteessä ei ole tuoreita merkintöjä
          lähteistämme (eduskunta, kunta, uutiset). Tarkista myöhemmin
          uudelleen.
        </p>
      </section>
    );
  }

  if (!cachedPulse?.summary?.trim()) {
    return (
      <section
        className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-6 py-8 md:px-8 md:py-10"
        aria-labelledby="citizen-pulse-heading"
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex rounded border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
            Päivän pulssi
          </span>
          <span className="text-[11px] font-medium text-amber-800/90">
            Esilaskenta käynnissä
          </span>
        </div>
        <h2
          id="citizen-pulse-heading"
          className="font-[family-name:var(--font-news-serif)] text-2xl font-semibold tracking-tight text-neutral-900"
        >
          Tiivistelmä tulossa
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700">
          Päivän pulssi generoidaan taustalla noin kerran tunnissa ja
          tallennetaan välimuistiin. Sivu latautuu heti, kun batch on valmis —
          et näe keinotekoisia täyttömerkintöjä.
        </p>
      </section>
    );
  }

  const updated = new Date(cachedPulse.generatedAt).toLocaleString("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm md:px-10 md:py-10 transition-shadow duration-200 hover:shadow-md"
      aria-labelledby="citizen-pulse-heading"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-800">
          Päivän pulssi
        </span>
        <span className="text-[11px] text-neutral-500">
          AI-yhteenveto välimuistista · {updated}
        </span>
      </div>
      <h2
        id="citizen-pulse-heading"
        className="font-[family-name:var(--font-news-serif)] text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl"
      >
        Mitä tapahtuu nyt
      </h2>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-800">
        {cachedPulse.summary}
      </p>
      <p className="mt-6 text-xs text-neutral-500">
        Malli: {cachedPulse.model || "—"}
        {cachedPulse.feedItemCount != null
          ? ` · ${cachedPulse.feedItemCount} syötteen kohdetta erän hetkellä`
          : ""}
        . Tarkista yksityiskohdat alla olevista lähteistä.
      </p>
    </section>
  );
}
