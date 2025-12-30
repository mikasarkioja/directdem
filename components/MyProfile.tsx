"use client";

import { useState, useEffect } from "react";
import { Download, Trash2, MapPin, Loader2, CheckCircle, AlertTriangle, Save, ToggleLeft, ToggleRight } from "lucide-react";
import PartyMatchCard from "./PartyMatchCard";
import { getUserDataForExport, updateVaalipiiri, updateReportListParticipation } from "@/app/actions/profile-data";
import { deleteUserAccount } from "@/app/actions/user-management";
import { getUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { FINNISH_DISTRICTS } from "@/lib/finnish-districts-geo";
import type { UserProfile } from "@/lib/types";

export default function MyProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedVaalipiiri, setSelectedVaalipiiri] = useState<string>("");
  const [savingVaalipiiri, setSavingVaalipiiri] = useState(false);
  const [joinReportList, setJoinReportList] = useState(false);
  const [savingReportList, setSavingReportList] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const userData = await getUser();
      setUser(userData);
      setSelectedVaalipiiri(userData?.vaalipiiri || "");
      setJoinReportList(userData?.join_report_list || false);
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleDownloadData = async () => {
    setDownloading(true);
    setError(null);

    try {
      const result = await getUserDataForExport();

      if (!result.success || !result.data) {
        setError(result.error || "Tietojen lataus epäonnistui");
        setDownloading(false);
        return;
      }

      // Create JSON blob
      const jsonData = JSON.stringify(result.data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `eduskuntavahti-tietoni-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("Tietosi on ladattu onnistuneesti!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Tietojen lataus epäonnistui");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveVaalipiiri = async () => {
    if (!selectedVaalipiiri) {
      setError("Valitse vaalipiiri");
      return;
    }

    setSavingVaalipiiri(true);
    setError(null);

    try {
      const result = await updateVaalipiiri(selectedVaalipiiri);

      if (result.success && user) {
        setSuccess("Vaalipiiri tallennettu!");
        setUser({ ...user, vaalipiiri: selectedVaalipiiri });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Vaalipiirin tallennus epäonnistui");
      }
    } catch (err: any) {
      setError(err.message || "Tuntematon virhe");
    } finally {
      setSavingVaalipiiri(false);
    }
  };

  const handleToggleReportList = async () => {
    const newValue = !joinReportList;
    setSavingReportList(true);
    setError(null);

    try {
      const result = await updateReportListParticipation(newValue);

      if (result.success && user) {
        setJoinReportList(newValue);
        setSuccess(
          newValue
            ? "Olet nyt osallistumassa viikoittaiseen raportointiin!"
            : "Olet poistunut viikoittaisesta raportoinnista."
        );
        setUser({ ...user, join_report_list: newValue });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Raportointiasetuksen päivitys epäonnistui");
      }
    } catch (err: any) {
      setError(err.message || "Tuntematon virhe");
    } finally {
      setSavingReportList(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "POISTA") {
      setError("Kirjoita 'POISTA' vahvistaaksesi");
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteUserAccount();

      if (result.success) {
        // Redirect to home after successful deletion
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Tilin poistaminen epäonnistui");
        setDeleting(false);
      }
    } catch (err: any) {
      setError(err.message || "Tuntematon virhe");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-nordic-blue" size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-nordic-dark">
            Sinun täytyy olla kirjautunut nähdäksesi profiilisi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-nordic-darker mb-6">Oma profiili</h2>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-600" size={20} />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Party Match Card */}
        <div className="mb-8">
          <PartyMatchCard />
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-nordic-gray mb-8">
          <h3 className="text-xl font-semibold text-nordic-darker mb-6">Profiiliasetukset</h3>

          <div className="space-y-6">
            {/* User Info */}
            <div>
              <label className="block text-sm font-medium text-nordic-darker mb-2">
                Sähköposti
              </label>
              <p className="text-nordic-dark">{user.email || "Ei sähköpostia"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-nordic-darker mb-2">
                Nimi
              </label>
              <p className="text-nordic-dark">{user.full_name || "Ei nimeä"}</p>
            </div>

            {/* Vaalipiiri Selection */}
            <div>
              <label
                htmlFor="vaalipiiri"
                className="block text-sm font-medium text-nordic-darker mb-2"
              >
                Vaalipiiri
              </label>
              <div className="flex gap-3">
                <select
                  id="vaalipiiri"
                  value={selectedVaalipiiri}
                  onChange={(e) => setSelectedVaalipiiri(e.target.value)}
                  className="flex-1 px-4 py-2 border border-nordic-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-nordic-blue text-nordic-darker bg-white"
                >
                  <option value="">-- Valitse vaalipiiri --</option>
                  {FINNISH_DISTRICTS.map((district) => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveVaalipiiri}
                  disabled={savingVaalipiiri || !selectedVaalipiiri || selectedVaalipiiri === user.vaalipiiri}
                  className="px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingVaalipiiri ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Tallennetaan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Tallenna</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-nordic-dark mt-1">
                Vaalipiiriäsi käytetään vaalipiirikartassa
              </p>
            </div>

            {/* Report List Participation Toggle */}
            <div className="border-t border-nordic-gray pt-6 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label
                    htmlFor="report-list-toggle"
                    className="block text-sm font-medium text-nordic-darker mb-2 cursor-pointer"
                  >
                    Osallistu viikoittaiseen raportointiin
                  </label>
                  <p className="text-sm text-nordic-dark">
                    Vaikuta suoraan: salli anonyymin äänestysdatasi käyttö viikoittaisessa raportissa, joka toimitetaan kansanedustajille.
                  </p>
                  <p className="text-xs text-nordic-dark mt-1">
                    Äänesi pysyy anonyyminä, mutta autat luomaan selkeän kuvan kansalaisten mielipiteistä.
                  </p>
                </div>
                <button
                  id="report-list-toggle"
                  onClick={handleToggleReportList}
                  disabled={savingReportList}
                  className="ml-4 flex-shrink-0"
                  aria-label={joinReportList ? "Poista raportointilistalta" : "Liity raportointilistalle"}
                >
                  {joinReportList ? (
                    <ToggleRight size={48} className="text-nordic-blue" />
                  ) : (
                    <ToggleLeft size={48} className="text-nordic-gray" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Download Data */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-nordic-gray mb-8">
          <h3 className="text-xl font-semibold text-nordic-darker mb-4">Tietojen lataus</h3>
          <p className="text-sm text-nordic-dark mb-4">
            Lataa kaikki profiilitietosi ja äänestyksesi JSON-muodossa.
          </p>
          <button
            onClick={handleDownloadData}
            disabled={downloading}
            className="px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Ladataan...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Lataa tietoni</span>
              </>
            )}
          </button>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-lg border-2 border-red-200 shadow-sm">
          <div className="p-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-nordic-darker mb-2">
                  Poista tili
                </h3>
                <p className="text-sm text-nordic-dark mb-4">
                  Tilin poistaminen poistaa pysyvästi profiilitietosi. Äänestyksesi
                  anonymisoidaan (säilyvät tilastoissa, mutta henkilötietosi poistetaan).
                </p>
                <p className="text-sm text-red-600 font-medium mb-4">
                  Tätä toimintoa ei voi peruuttaa.
                </p>
              </div>
            </div>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Trash2 size={18} />
                <span>Poista tili</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-3 font-medium">
                    Vahvista tilin poistaminen kirjoittamalla <strong>POISTA</strong> alla
                    olevaan kenttään:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Kirjoita POISTA"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteConfirmText("");
                      setError(null);
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-nordic-gray text-nordic-dark rounded-lg hover:bg-nordic-light transition-colors disabled:opacity-50"
                  >
                    Peruuta
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "POISTA"}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    {deleting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Poistetaan...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        <span>Poista tili pysyvästi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
