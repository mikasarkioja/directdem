"use client";

import { useState, useEffect } from "react";
import { X, Mail, CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PrivacySummary from "./PrivacySummary";

interface LoginModalProps {
  onClose?: () => void;
  onSuccess: () => void;
  isPage?: boolean;
  initialMessage?: { type: "success" | "error"; text: string } | null;
}

export default function LoginModal({ onClose, onSuccess, isPage = false, initialMessage = null }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(initialMessage);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [joinReportList, setJoinReportList] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "bankid">("email");
  const [showPrivacySummary, setShowPrivacySummary] = useState(false);
  const [hasSeenPrivacy, setHasSeenPrivacy] = useState(false);
  const supabase = createClient();

  // Check if user has already accepted GDPR (for returning users)
  useEffect(() => {
    async function checkGDPRConsent() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gdpr_consent")
          .eq("id", user.id)
          .single();
        
        if (profile?.gdpr_consent) {
          setHasSeenPrivacy(true);
        } else {
          setShowPrivacySummary(true);
        }
      } else {
        // First-time user, show privacy summary
        setShowPrivacySummary(true);
      }
    }
    checkGDPRConsent();
  }, [supabase]);

  const handlePrivacyAccept = () => {
    setAcceptedTerms(true);
    setShowPrivacySummary(false);
    setHasSeenPrivacy(true);
  };

  const handlePrivacyDecline = () => {
    onClose();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setMessage({
        type: "error",
        text: "Sinun täytyy hyväksyä käyttöehdot jatkaaksesi",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            gdpr_consent: true,
            gdpr_consent_date: new Date().toISOString(),
            join_report_list: joinReportList, // Include report list preference
          },
        },
      });

      if (error) {
        setMessage({
          type: "error",
          text: `Virhe: ${error.message}`,
        });
      } else {
        setMessage({
          type: "success",
          text: "Tarkista sähköpostisi! Lähetimme sinulle kirjautumislinkin.",
        });
        // Reset form after success
        setTimeout(() => {
          setEmail("");
          setAcceptedTerms(false);
        }, 2000);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: `Odottamaton virhe: ${err.message || "Tarkista konsoli lisätietoja varten"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankIDLogin = async () => {
    if (!acceptedTerms) {
      setMessage({
        type: "error",
        text: "Sinun täytyy hyväksyä käyttöehdot jatkaaksesi",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Import BankID auth function
      const { initiateBankIDAuth } = await import("@/lib/bankid-auth");
      const { redirectUrl } = await initiateBankIDAuth();

      // In development, show mock message
      if (process.env.NODE_ENV === "development" || !process.env.CRIIPTO_CLIENT_ID) {
        setMessage({
          type: "error",
          text: "BankID integraatio on kehitysvaiheessa. Käytä toistaiseksi sähköpostivahvistusta.",
        });
        setLoading(false);
        return;
      }

      // Redirect to Criipto OIDC endpoint
      window.location.href = redirectUrl;
    } catch (err: any) {
      setMessage({
        type: "error",
        text: `BankID-virhe: ${err.message || "Tuntematon virhe"}`,
      });
      setLoading(false);
    }
  };

  const content = (
    <div className={`bg-white dark:bg-nordic-deep rounded-2xl max-w-md w-full ${isPage ? 'mx-auto' : 'shadow-xl overflow-hidden'}`}>
        {/* Header */}
        {!isPage && (
          <div className="flex items-center justify-between p-6 border-b border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-xl font-bold text-nordic-darker dark:text-nordic-white">
              {showPrivacySummary ? "Tietosuoja" : "Kirjaudu sisään"}
            </h2>
            <button
              onClick={onClose}
              className="text-nordic-dark dark:text-nordic-gray hover:text-nordic-darker dark:hover:text-nordic-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {isPage && showPrivacySummary && !hasSeenPrivacy && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-nordic-darker dark:text-nordic-white mb-2">Tietosuoja</h1>
            <p className="text-nordic-dark dark:text-nordic-gray">Lue ja hyväksy ehdot jatkaaksesi.</p>
          </div>
        )}

        {isPage && (!showPrivacySummary || hasSeenPrivacy) && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-nordic-darker dark:text-nordic-white mb-2">Kirjaudu sisään</h1>
            <p className="text-nordic-dark dark:text-nordic-gray">Valitse kirjautumistapa alta.</p>
          </div>
        )}

        {/* Privacy Summary - shown before first login */}
        {showPrivacySummary && !hasSeenPrivacy ? (
          <div className="p-6">
            <PrivacySummary
              onAccept={handlePrivacyAccept}
              onDecline={handlePrivacyDecline}
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Tabs */}
            <div className="flex border-b border-nordic-gray dark:border-nordic-darker">
          <button
            onClick={() => {
              setActiveTab("email");
              setMessage(null);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "email"
                ? "text-nordic-blue border-b-2 border-nordic-blue"
                : "text-nordic-dark dark:text-nordic-gray hover:text-nordic-darker dark:hover:text-nordic-white"
            }`}
          >
            <Mail size={16} className="inline mr-2" />
            Sähköposti
          </button>
          <button
            onClick={() => {
              setActiveTab("bankid");
              setMessage(null);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "bankid"
                ? "text-nordic-blue border-b-2 border-nordic-blue"
                : "text-nordic-dark dark:text-nordic-gray hover:text-nordic-darker dark:hover:text-nordic-white"
            }`}
          >
            <CreditCard size={16} className="inline mr-2" />
            Pankkitunnukset
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-nordic-darker dark:text-nordic-white mb-2"
                >
                  Sähköpostiosoite
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nimi@esimerkki.fi"
                  required
                  className="w-full px-4 py-2 border border-nordic-gray dark:border-nordic-darker rounded-lg focus:outline-none focus:ring-2 focus:ring-nordic-blue text-nordic-darker dark:text-nordic-white bg-white dark:bg-nordic-darker"
                />
              </div>

              {/* GDPR Checkbox - only show if privacy summary was already shown */}
              {hasSeenPrivacy && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <input
                      id="accept-terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      className="mt-1 w-4 h-4 text-nordic-blue border-nordic-gray rounded focus:ring-nordic-blue"
                    />
                    <label
                      htmlFor="accept-terms"
                      className="text-sm text-nordic-dark dark:text-nordic-gray"
                    >
                      Olen lukenut tietosuojaselosteen ja ymmärrän, miten tietojani käsitellään
                      <span className="text-red-600 ml-1">*</span>
                    </label>
                  </div>

                  {/* Optional: Join Report List */}
                  <div className="flex items-start gap-2">
                    <input
                      id="join-report-list"
                      type="checkbox"
                      checked={joinReportList}
                      onChange={(e) => setJoinReportList(e.target.checked)}
                      className="mt-1 w-4 h-4 text-nordic-blue border-nordic-gray rounded focus:ring-nordic-blue"
                    />
                    <label
                      htmlFor="join-report-list"
                      className="text-sm text-nordic-dark dark:text-nordic-gray"
                    >
                      Vaikuta suoraan: salli anonyymin äänestysdatasi käyttö viikoittaisessa raportissa, joka toimitetaan kansanedustajille
                    </label>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!acceptedTerms && hasSeenPrivacy)}
                className="w-full px-4 py-3 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Lähetetään...</span>
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    <span>Lähetä kirjautumislinkki</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-nordic-dark dark:text-nordic-gray">
                Lähetämme sinulle turvallisen kirjautumislinkin sähköpostiin
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              {/* GDPR Checkbox for BankID - only show if privacy summary was already shown */}
              {hasSeenPrivacy && (
                <div className="flex items-start gap-2">
                  <input
                    id="accept-terms-bankid"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 text-nordic-blue border-nordic-gray rounded focus:ring-nordic-blue"
                  />
                  <label
                    htmlFor="accept-terms-bankid"
                    className="text-sm text-nordic-dark dark:text-nordic-gray"
                  >
                    Olen lukenut tietosuojaselosteen ja ymmärrän, miten tietojani käsitellään
                    <span className="text-red-600 ml-1">*</span>
                  </label>
                </div>
              )}

              {process.env.NODE_ENV === "development" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    BankID integraatio on kehitysvaiheessa. Käytä toistaiseksi sähköpostivahvistusta.
                  </p>
                </div>
              )}

              <button
                onClick={handleBankIDLogin}
                disabled={loading || (!acceptedTerms && hasSeenPrivacy) || (process.env.NODE_ENV === "development" && !process.env.CRIIPTO_CLIENT_ID)}
                className="w-full px-4 py-3 bg-nordic-deep text-white rounded-lg hover:bg-nordic-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Yhdistetään...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Vahvista pankkitunnuksilla</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-nordic-dark dark:text-nordic-gray">
                Kirjaudu suoraan pankkitunnuksillasi Criipto OIDC:n kautta
              </p>
            </div>
          )}
        </div>
          </div>
        )}
    </div>
  );

  if (isPage) {
    return <div className="py-12 px-4 bg-nordic-white min-h-screen flex items-center">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
}

