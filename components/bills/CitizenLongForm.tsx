"use client";

import { useMemo } from "react";

type Block =
  | { type: "h"; level: number; text: string }
  | { type: "p"; text: string };

function parseMarkdownish(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const out: Block[] = [];
  let buf: string[] = [];

  function flush() {
    if (buf.length) {
      out.push({ type: "p", text: buf.join("\n") });
      buf = [];
    }
  }

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      flush();
      out.push({ type: "h", level: m[1].length, text: m[2].trim() });
    } else if (line.trim() === "") {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

const headingClass = (level: number) => {
  if (level <= 1)
    return "text-lg md:text-xl font-black text-sky-200 uppercase tracking-tight mt-8 mb-3 first:mt-0";
  if (level === 2)
    return "text-base md:text-lg font-bold text-sky-100/95 mt-6 mb-2";
  return "text-sm md:text-base font-bold text-slate-200 mt-4 mb-2";
};

export default function CitizenLongForm({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdownish(text.trim()), [text]);

  if (!text.trim()) return null;

  return (
    <div className="space-y-1 text-[13px] md:text-sm text-slate-200/95 leading-relaxed font-medium">
      {blocks.map((b, i) =>
        b.type === "h" ? (
          b.level <= 1 ? (
            <h2 key={i} className={headingClass(b.level)}>
              {b.text}
            </h2>
          ) : (
            <h3 key={i} className={headingClass(b.level)}>
              {b.text}
            </h3>
          )
        ) : (
          <p
            key={i}
            className="whitespace-pre-wrap text-slate-300/95 mb-3 last:mb-0"
          >
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}
