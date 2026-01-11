"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudRain, CloudLightning, Sun, Cloud, Wind, AlertTriangle, Sparkles } from "lucide-react";
import { UserProfile, LensMode } from "@/lib/types";

interface LocalWeatherProps {
  lens: LensMode;
  user: UserProfile;
}

export default function LocalWeather({ lens, user }: LocalWeatherProps) {
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    // Simuloitu sääennuste DNA-analyysin perusteella
    const generateForecast = () => {
      const city = lens === "national" ? "Suomi" : lens.charAt(0).toUpperCase() + lens.slice(1);
      
      // Esimerkkilogiikka: Jos käyttäjä on vahvasti ympäristöpainotteinen, 
      // varoitetaan "myrskystä" jos kaupungissa on rakennushankkeita.
      const envScore = user.environmental_score || 0;
      const econScore = user.economic_score || 0;

      if (lens === "helsinki") {
        if (envScore > 0.5) {
          return {
            status: "Myrsky varoitus",
            icon: CloudLightning,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            text: `Helsingin valtuustossa kuohuu Malmin lentokentän kaavoituksesta. DNA-profiilisi mukaan vastustaisit tätä jyrkästi.`
          };
        }
        return {
          status: "Selkeää",
          icon: Sun,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          text: `Budjettiraami on hyväksytty sovussa. Talousprofiilisi vastaa nykyistä linjaa.`
        };
      }

      if (lens === "espoo") {
        if (econScore < -0.3) {
          return {
            status: "Sadekuuroja",
            icon: CloudRain,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            text: `Espoon uusi investointiohjelma aiheuttaa kitkaa. DNA-profiilisi suosisi enemmän säästöjä tällä hetkellä.`
          };
        }
        return {
          status: "Puolipilvistä",
          icon: Cloud,
          color: "text-slate-400",
          bg: "bg-slate-400/10",
          text: `Länsiradan jatkorahoitus puhuttaa. Odotettavissa vilkasta keskustelua seuraavassa kokouksessa.`
        };
      }

      return {
        status: "Vakaa",
        icon: Wind,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        text: `Poliittinen sää on vakaa kaupungissasi. Ei suuria DNA-ristiriitoja tiedossa.`
      };
    };

    setForecast(generateForecast());
  }, [lens, user]);

  if (!forecast) return null;

  const Icon = forecast.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${forecast.bg} border border-white/5 rounded-[2rem] p-6 space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Poliittinen Sää</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${forecast.color}`}>
          <Icon size={14} />
          {forecast.status}
        </div>
      </div>

      <p className="text-xs font-bold text-white leading-relaxed italic">
        "{forecast.text}"
      </p>

      <div className="pt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
        Perustuu DNA-analyysiin ja dynaamiseen louhintaan
      </div>
    </motion.div>
  );
}

