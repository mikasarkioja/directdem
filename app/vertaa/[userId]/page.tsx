"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicProfile } from "@/lib/actions/user-profile-actions";
import { getUser } from "@/app/actions/auth";
import IdentityCard from "@/components/IdentityCard";
import ComparisonRadarChart from "@/components/ComparisonRadarChart";
import { BrainCircuit, Loader2, Users, Zap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function CompareProfilesPage() {
  const { userId } = useParams() as { userId: string };
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [target, current] = await Promise.all([
        getPublicProfile(userId),
        getUser()
      ]);
      setTargetProfile(target);
      setCurrentUser(current);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-xl font-black uppercase text-slate-400">Profiilia ei löytynyt</p>
      </div>
    );
  }

  // Calculate compatibility if current user exists
  let compatibility = 0;
  if (currentUser) {
    const dEco = (currentUser.economic_score || 0) - (targetProfile.economic_score || 0);
    const dLib = (currentUser.liberal_conservative_score || 0) - (targetProfile.liberal_conservative_score || 0);
    const dEnv = (currentUser.environmental_score || 0) - (targetProfile.environmental_score || 0);
    const dUrb = (currentUser.urban_rural_score || 0) - (targetProfile.urban_rural_score || 0);
    const dGlo = (currentUser.international_national_score || 0) - (targetProfile.international_national_score || 0);
    const dSec = (currentUser.security_score || 0) - (targetProfile.security_score || 0);

    const distance = Math.sqrt(
      Math.pow(dEco, 2) + Math.pow(dLib, 2) + Math.pow(dEnv, 2) +
      Math.pow(dUrb, 2) + Math.pow(dGlo, 2) + Math.pow(dSec, 2)
    );

    // Max distance in 6 dimensions is ~4.9 (sqrt(6 * 2^2))
    compatibility = Math.max(0, Math.round((1 - (distance / 4.9)) * 100));
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={currentUser} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full w-fit mx-auto">
              <Users size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">DNA Vertailu</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
              Vertaat <span className="text-purple-600">Poliittista DNA:tasi</span>
            </h1>
            {currentUser && (
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                Yhteensopivuus: <span className="text-purple-600">{compatibility}%</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Target Identity Card */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">Kohdeprofiili</h3>
              <IdentityCard userProfile={targetProfile} />
            </div>

            {/* Comparison Logic */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-10">
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" />
                  Miten sijoitutte spektrillä?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tutkakuvaaja näyttää molempien profiilit päällekkäin.
                </p>
              </div>

              <div className="h-[400px] w-full bg-slate-50 rounded-[2rem] p-8">
                {currentUser ? (
                  <ComparisonRadarChart 
                    harkimo={{
                      economic: currentUser.economic_score || 0,
                      liberal: currentUser.liberal_conservative_score || 0,
                      env: currentUser.environmental_score || 0,
                      urban: currentUser.urban_rural_score || 0,
                      global: currentUser.international_national_score || 0,
                      security: currentUser.security_score || 0
                    }}
                    target={{
                      name: "Kohde",
                      economic: targetProfile.economic_score || 0,
                      liberal: targetProfile.liberal_conservative_score || 0,
                      env: targetProfile.environmental_score || 0,
                      urban: targetProfile.urban_rural_score || 0,
                      global: targetProfile.international_national_score || 0,
                      security: targetProfile.security_score || 0
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed">
                      Kirjaudu sisään vertaaksesi<br />omaa DNA:tasi tähän profiiliin.
                    </p>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Kirjaudu sisään</button>
                  </div>
                )}
              </div>

              {currentUser && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analyysi</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                    {compatibility > 80 
                      ? "Olette lähes identtisiä monissa kysymyksissä. Arvomaailmanne kohtaa erityisesti keskeisimmissä poliittisissa valinnoissa." 
                      : compatibility > 50 
                      ? "Teillä on vahva yhteinen perusta, mutta yksittäisissä painotuksissa löytyy mielenkiintoisia eroavaisuuksia."
                      : "Poliittiset näkemyksenne poikkeavat toisistaan merkittävästi. Edustatte erilaisia lähestymistapoja yhteiskunnalliseen päätöksentekoon."}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}

