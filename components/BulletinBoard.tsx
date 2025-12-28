"use client";

import { Share2, Mail, Download } from "lucide-react";
import { ParsedSummary } from "@/lib/summary-parser";

interface BulletinBoardProps {
  summary: ParsedSummary;
  billId: string;
  billTitle?: string;
}

export default function BulletinBoard({
  summary,
  billId,
  billTitle,
}: BulletinBoardProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lakitiivistelmä: ${billTitle || billId}`,
          text: `${summary.topic}\n\n${summary.changes.join("\n")}\n\n${summary.impact}`,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${billTitle || billId}\n\n${summary.topic}\n\n${summary.changes.join("\n")}\n\n${summary.impact}`;
      navigator.clipboard.writeText(text);
      alert("Tiivistelmä kopioitu leikepöydälle!");
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Lakitiivistelmä: ${billTitle || billId}`);
    const body = encodeURIComponent(
      `${summary.topic}\n\n${summary.changes.map((c) => `• ${c}`).join("\n")}\n\n${summary.impact}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownload = () => {
    // Create a simple text file
    const content = `LAKITIIVISTELMÄ • ${billId}\n\n${billTitle || ""}\n\n${summary.topic}\n\nMikä muuttuu?\n${summary.changes.map((c) => `• ${c}`).join("\n")}\n\nVaikutus arkeen:\n${summary.impact}\n\nLähde: Eduskunta Open Data`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lakitiivistelma-${billId.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md border-2 border-nordic-blue bg-white shadow-xl overflow-hidden rounded-lg">
      {/* Header */}
      <div className="bg-nordic-blue p-2 text-white text-center text-xs font-bold uppercase tracking-widest">
        Viikon Lakitiivistelmä • {billId}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Topic */}
        <div>
          <h3 className="text-xl font-black leading-tight text-nordic-darker">
            {summary.topic}
          </h3>
        </div>

        {/* Changes */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-nordic-dark uppercase tracking-tight">
            Mitä tapahtuu?
          </p>
          <ul className="space-y-1.5">
            {summary.changes.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-nordic-darker">
                <span className="text-nordic-blue font-bold flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Impact */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-nordic-blue">
          <p className="text-xs font-bold text-nordic-blue uppercase mb-1">
            Vaikutus Arkeen:
          </p>
          <p className="text-sm font-medium text-nordic-darker">{summary.impact}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-nordic-gray">
          <span className="text-[10px] text-nordic-dark opacity-70">
            Lähde: Eduskunta Open Data
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="hover:text-nordic-blue transition-colors text-nordic-dark"
              title="Jaa"
              aria-label="Jaa tiivistelmä"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleEmail}
              className="hover:text-nordic-blue transition-colors text-nordic-dark"
              title="Lähetä sähköpostilla"
              aria-label="Lähetä sähköpostilla"
            >
              <Mail size={18} />
            </button>
            <button
              onClick={handleDownload}
              className="hover:text-nordic-blue transition-colors text-nordic-dark"
              title="Lataa"
              aria-label="Lataa tiivistelmä"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

