"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { generateGDPRSummary } from "@/lib/gdpr-summary";
import Link from "next/link";

interface GDPRRegistrationProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function GDPRRegistration({ onAccept, onDecline }: GDPRRegistrationProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-nordic-deep rounded-2xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-nordic-deep border-b border-nordic-gray dark:border-nordic-darker p-6 z-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-nordic-blue" size={32} />
            <h2 className="text-2xl font-bold text-nordic-darker dark:text-nordic-white">
              Tietosuoja ja käyttöehdot
            </h2>
          </div>
          <p className="text-sm text-nordic-dark dark:text-nordic-gray">
            Tämä on ensimmäinen kirjautumisesi. Lue tietosuojaseloste ennen jatkamista.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI-Generated Summary */}
          <div className="bg-nordic-light dark:bg-nordic-darker rounded-lg p-4 border border-nordic-gray dark:border-nordic-darker">
            <h3 className="text-lg font-semibold text-nordic-darker dark:text-nordic-white mb-3">
              Selkokielinen tiivistelmä
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-nordic-dark dark:text-nordic-gray">
                <Loader2 size={18} className="animate-spin" />
                <span>Luetaan tietosuojaselostetta...</span>
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none text-nordic-dark dark:text-nordic-gray whitespace-pre-line">
                {summary}
              </div>
            ) : (
              <p className="text-nordic-dark dark:text-nordic-gray">
                Tietosuojaseloste saatavilla alla olevasta linkistä.
              </p>
            )}
          </div>

          {/* Full Privacy Policy Link */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-medium hover:underline"
              >
                Lue täydellinen tietosuojaseloste ja käyttöehdot →
              </Link>
            </p>
          </div>

          {/* Mandatory Checkbox */}
          <div className="border-2 border-nordic-gray dark:border-nordic-darker rounded-lg p-4 bg-nordic-light dark:bg-nordic-darker">
            <div className="flex items-start gap-3">
              <input
                id="gdpr-accept"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                required
                className="mt-1 w-5 h-5 text-nordic-blue border-nordic-gray rounded focus:ring-nordic-blue"
              />
              <label
                htmlFor="gdpr-accept"
                className="flex-1 text-sm text-nordic-darker dark:text-nordic-white"
              >
                <span className="font-semibold">Hyväksyn käyttöehdot ja tietosuojaselosteen</span>
                <span className="text-red-600 ml-1">*</span>
                <p className="text-xs text-nordic-dark dark:text-nordic-gray mt-1">
                  Ymmärrän, että tietojani käsitellään edellä kuvatulla tavalla ja että voin
                  milloin tahansa poistaa tilini asetuksista.
                </p>
              </label>
            </div>
          </div>

          {/* Warning if not accepted */}
          {!accepted && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Sinun täytyy hyväksyä käyttöehdot jatkaaksesi palvelun käyttöä.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-nordic-deep border-t border-nordic-gray dark:border-nordic-darker p-6 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 border border-nordic-gray dark:border-nordic-darker text-nordic-dark dark:text-nordic-gray rounded-lg hover:bg-nordic-light dark:hover:bg-nordic-darker transition-colors font-medium"
          >
            Hylkää
          </button>
          <button
            onClick={onAccept}
            disabled={!accepted}
            className="flex-1 px-4 py-3 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {accepted ? (
              <>
                <CheckCircle size={18} />
                <span>Hyväksy ja jatka</span>
              </>
            ) : (
              <span>Hyväksy jatkaaksesi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



