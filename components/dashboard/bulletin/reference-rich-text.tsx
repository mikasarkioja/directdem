import React from "react";

/** Muoto [1], [2] → klikattavat lähdeviitteet (sources[0] = [1]). */
export function ReferenceRichText({
  text,
  sources,
  className,
}: {
  text: string;
  sources: { title: string; url: string }[];
  className?: string;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = parseInt(m[1], 10);
          const src = sources[n - 1];
          if (!src?.url) {
            return (
              <span key={i} className="text-slate-500">
                [{m[1]}]
              </span>
            );
          }
          return (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noreferrer"
              title={src.title}
              className="align-super text-[0.72em] font-semibold text-[var(--accent-primary)] hover:underline"
            >
              [{m[1]}]
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
