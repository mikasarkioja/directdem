"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { deleteUserAccount } from "@/app/actions/user-management";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const userData = await getUser();
      setUser(userData);
      setLoading(false);
    }
    loadUser();
  }, []);

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
        setSuccess(true);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
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
      <div className="min-h-screen bg-nordic-white">
        <Navbar user={null} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-nordic-blue" size={32} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-nordic-white">
        <Navbar user={null} />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-nordic-dark">
            Sinun täytyy olla kirjautunut nähdäksesi asetukset.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-nordic-darker mb-8">Asetukset</h1>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-600" size={20} />
            <div>
              <p className="text-green-800 font-medium">Tili poistettu onnistuneesti</p>
              <p className="text-green-700 text-sm">Ohjaamme sinut etusivulle...</p>
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <div className="bg-white rounded-lg border-2 border-red-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-nordic-darker mb-2">
                  Poista tili
                </h2>
                <p className="text-sm text-nordic-dark mb-4">
                  Tilin poistaminen poistaa pysyvästi kaikki tietosi, mukaan lukien:
                </p>
                <ul className="list-disc list-inside text-sm text-nordic-dark space-y-1 mb-4">
                  <li>Profiilitietosi</li>
                  <li>Kaikki äänestyksesi</li>
                  <li>Käyttäjätunnuksesi</li>
                </ul>
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
                    Vahvista tilin poistaminen kirjoittamalla <strong>POISTA</strong> alla olevaan kenttään:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Kirjoita POISTA"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {error}
                  </div>
                )}

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

