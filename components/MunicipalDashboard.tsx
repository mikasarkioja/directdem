"use client";

import { useState, useEffect } from "react";
import { fetchMunicipalCases } from "@/app/actions/municipal";
import type { MunicipalCase, UserProfile } from "@/lib/types";
import MunicipalDecisionCard from "./MunicipalDecisionCard";
import MunicipalCaseDetail from "./MunicipalCaseDetail";
import { Loader2, Info, Building2, MapPin, RefreshCw } from "lucide-react";

interface MunicipalDashboardProps {
  user: UserProfile | null;
  initialMunicipality?: string;
}

export default function MunicipalDashboard({ user, initialMunicipality = "Espoo" }: MunicipalDashboardProps) {
  const [cases, setCases] = useState<MunicipalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MunicipalCase | null>(null);

  const loadCases = async (muni: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchMunicipalCases(muni);
      setCases(data);
    } catch (error) {
      console.error("Failed to load cases:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadCases(initialMunicipality);
  }, [initialMunicipality]);

  const handleManualSync = async () => {
    setSyncing(true);
    await loadCases(initialMunicipality, false);
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-nordic-blue" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="text-nordic-blue" size={24} />
              <h2 className="text-3xl font-black text-nordic-darker uppercase tracking-tighter">Kuntavahti</h2>
            </div>
            <p className="text-sm text-nordic-dark font-medium uppercase tracking-wider flex items-center gap-1">
              <MapPin size={14} /> {initialMunicipality} — Paikallinen päätöksenteko
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-nordic-light hover:bg-nordic-gray/20 text-nordic-darker rounded-xl transition-colors text-sm font-bold uppercase tracking-widest border border-nordic-gray/30"
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Päivitä esityslistat
          </button>
        </div>

        {!user && (
          <div className="mb-6 p-4 bg-nordic-light border-2 border-nordic-blue rounded-xl flex items-center gap-3 shadow-sm">
            <Info className="text-nordic-blue flex-shrink-0" size={24} />
            <p className="text-nordic-darker font-medium">
              Voit selata kunnan esityslistoja. 
              <span className="font-bold"> Kirjaudu sisään</span>, jos haluat ilmaista mielipiteesi asioista.
            </p>
          </div>
        )}

        {cases.length === 0 ? (
          <div className="bg-nordic-light rounded-2xl p-12 border-2 border-dashed border-nordic-gray text-center">
            <p className="text-nordic-dark mb-2 font-bold">Ei päätöksiä saatavilla.</p>
            <p className="text-sm text-nordic-dark">Yritämme hakea tuoreita esityslistoja {initialMunicipality}n rajapinnasta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((item) => (
              <MunicipalDecisionCard
                key={item.id}
                item={item}
                onClick={() => setSelectedCase(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCase && (
        <MunicipalCaseDetail
          item={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
