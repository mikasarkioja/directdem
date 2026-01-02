"use client";

import { useState, useEffect } from "react";
import { Shield, FileText, Loader2 } from "lucide-react";
import { generateGDPRSummary } from "@/lib/gdpr-summary";
import Link from "next/link";

interface PrivacySummaryProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function PrivacySummary({ onAccept, onDecline }: PrivacySummaryProps) {
  const [accepted, setAccepted] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const gdprSummary = await generateGDPRSummary();
        setSummary(gdprSummary);
      } catch (error) {
        console.error("Failed to load GDPR summary:", error);
        setSummary("Tietosuojaseloste saatavilla /privacy-policy -sivulla.");
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-nordic-gray dark:border-nordic-darker">
        <Shield className="text-nordic-blue" size={24} />
        <h3 className="text-lg font-bold text-nordic-darker dark:text-nordic-white">
          Tietosuoja ja käyttöehdot
        </h3>
      </div>

      {/* AI-Generated Summary */}
      <div className="bg-nordic-light dark:bg-nordic-darker rounded-lg p-4 border border-nordic-gray dark:border-nordic-darker">
        <h4 className="text-sm font-semibold text-nordic-darker dark:text-nordic-white mb-2">
          Selkokielinen tiivistelmä
        </h4>
        {loading ? (
          <div className="flex items-center gap-2 text-nordic-dark dark:text-nordic-gray">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Luetaan tietosuojaselostetta...</span>
          </div>
        ) : summary ? (
          <div className="prose prose-sm max-w-none text-nordic-dark dark:text-nordic-gray whitespace-pre-line text-sm leading-relaxed">
            {summary}
          </div>
        ) : (
          <p className="text-sm text-nordic-dark dark:text-nordic-gray">
            Tietosuojaseloste saatavilla alla olevasta linkistä.
          </p>
        )}
      </div>

      {/* Full Privacy Policy Link */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <Link
          href="/privacy-policy"
          target="_blank"
          className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200 font-medium hover:underline"
        >
          <FileText size={16} />
          <span>Lue täydellinen tietosuojaseloste ja käyttöehdot (PDF)</span>
        </Link>
      </div>

      {/* Mandatory Checkbox */}
      <div className="border-2 border-nordic-gray dark:border-nordic-darker rounded-lg p-4 bg-nordic-light dark:bg-nordic-darker">
        <div className="flex items-start gap-3">
          <input
            id="gdpr-consent"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            required
            className="mt-1 w-5 h-5 text-nordic-blue border-nordic-gray rounded focus:ring-nordic-blue"
          />
          <label
            htmlFor="gdpr-consent"
            className="flex-1 text-sm text-nordic-darker dark:text-nordic-white"
          >
            <span className="font-semibold">
              Olen lukenut tietosuojaselosteen ja ymmärrän, miten tietojani käsitellään
            </span>
            <span className="text-red-600 ml-1">*</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onDecline}
          className="flex-1 px-4 py-2 border border-nordic-gray dark:border-nordic-darker text-nordic-dark dark:text-nordic-gray rounded-lg hover:bg-nordic-light dark:hover:bg-nordic-darker transition-colors font-medium text-sm"
        >
          Hylkää
        </button>
        <button
          onClick={onAccept}
          disabled={!accepted}
          className="flex-1 px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          Hyväksy ja jatka
        </button>
      </div>
    </div>
  );
}


