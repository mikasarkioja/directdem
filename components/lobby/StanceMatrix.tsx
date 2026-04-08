"use client";

/**
 * Puolesta / vastaan -matriisi: tiivis, datanäköinen.
 */
export function StanceMatrix({
  proLead,
  conLead,
  proArguments,
  conArguments,
}: {
  proLead: string | null;
  conLead: string | null;
  proArguments: string[];
  conArguments: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border border-neutral-200 rounded-lg overflow-hidden md:grid-cols-2">
      <div className="border-b border-neutral-100 bg-emerald-50/40 p-3 md:border-b-0 md:border-r md:border-neutral-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
          Puoltavat
        </p>
        {proLead ? (
          <p className="mt-2 text-xs leading-relaxed text-neutral-800">
            {proLead}
          </p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">
            Tiivistelmää ei voitu tuottaa (Gemini tai aineisto puuttuu).
          </p>
        )}
        {proArguments.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-emerald-200/50 pt-3">
            {proArguments.slice(0, 8).map((a) => (
              <li
                key={a.slice(0, 48)}
                className="text-[12px] leading-snug text-neutral-700 pl-2 border-l-2 border-emerald-500/60"
              >
                {a}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="bg-amber-50/35 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
          Vastustavat
        </p>
        {conLead ? (
          <p className="mt-2 text-xs leading-relaxed text-neutral-800">
            {conLead}
          </p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">
            Tiivistelmää ei voitu tuottaa (Gemini tai aineisto puuttuu).
          </p>
        )}
        {conArguments.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-amber-200/50 pt-3">
            {conArguments.slice(0, 8).map((a) => (
              <li
                key={a.slice(0, 48)}
                className="text-[12px] leading-snug text-neutral-700 pl-2 border-l-2 border-amber-500/70"
              >
                {a}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
