"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  BookOpen, 
  Newspaper, 
  ShieldCheck, 
  Target, 
  Search,
  ChevronRight,
  Zap,
  BarChart2,
  Users,
  Database,
  CheckCircle2
} from "lucide-react";

interface ResearcherProfilingProps {
  onComplete: (data: { type: string; focus: string[] }) => void;
}

const RESEARCHER_TYPES = [
  {
    id: "academic",
    title: "Akateeminen Tutkija",
    desc: "Keskityt pitkän aikavälin trendeihin, data-analyysiin ja systeemisiin vaikutuksiin.",
    icon: BookOpen,
    color: "from-cyan-500 to-blue-600"
  },
  {
    id: "journalist",
    title: "Tutkiva Toimittaja",
    desc: "Painotat läpinäkyvyyttä, lobbaus-yhteyksiä ja takinkääntö-ilmiöitä.",
    icon: Newspaper,
    color: "from-emerald-500 to-teal-600"
  },
  {
    id: "policy_expert",
    title: "Politiikan Asiantuntija",
    desc: "Analysoit lakitekstiä, kustannusvaikutuksia ja säädösten toteutettavuutta.",
    icon: ShieldCheck,
    color: "from-purple-500 to-indigo-600"
  },
  {
    id: "strategist",
    title: "Strateginen Neuvonantaja",
    desc: "Seuraat puoluekuria, ideologisia siirtymiä ja poliittista peliä.",
    icon: Target,
    color: "from-amber-500 to-orange-600"
  }
];

const FOCUS_AREAS = [
  { id: "lobbying", label: "Lobbaus ja vaikutteet", icon: Users },
  { id: "discipline", label: "Puoluekuri ja lojaalius", icon: BarChart2 },
  { id: "economics", label: "Kustannusvaikutukset", icon: Database },
  { id: "integrity", label: "Lupaukset vs. teot", icon: Search },
  { id: "legal", label: "Lakitekstin analyysi", icon: Terminal },
  { id: "behavior", label: "Äänestyskäyttäytyminen", icon: Zap }
];

export default function ResearcherProfiling({ onComplete }: ResearcherProfilingProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  const handleTypeSelect = (id: string) => {
    setSelectedType(id);
    setStep(2);
  };

  const toggleFocus = (id: string) => {
    if (selectedFocus.includes(id)) {
      setSelectedFocus(prev => prev.filter(f => f !== id));
    } else if (selectedFocus.length < 3) {
      setSelectedFocus(prev => [...prev, id]);
    }
  };

  const handleFinish = () => {
    if (selectedType && selectedFocus.length > 0) {
      onComplete({ type: selectedType, focus: selectedFocus });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,0.02),transparent)] pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <BookOpen className="text-slate-900" />
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">Researcher_Protocol_Init</h2>
        </div>
        <div className="flex gap-1">
          {[1, 2].map(i => (
            <div key={i} className={`w-12 h-1 ${step >= i ? "bg-slate-900" : "bg-slate-100"} rounded-full transition-all`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 flex-1 flex flex-col justify-center"
          >
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic">Määritä asiantuntija-profiilisi</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto font-serif">Valitse rooli, joka parhaiten vastaa tutkimuksellista lähestymistapaasi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RESEARCHER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`group relative p-8 rounded-2xl border transition-all text-left ${
                    selectedType === type.id ? "bg-slate-50 border-slate-900 shadow-inner" : "bg-white border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="relative z-10 flex gap-6">
                    <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl`}>
                      <type.icon size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase text-slate-900 tracking-tight italic">{type.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight font-serif">{type.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 flex-1 flex flex-col justify-center"
          >
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic">Analyyttiset painopisteet</h3>
              <p className="text-slate-500 text-sm font-serif italic">Valitse 3 osa-aluetta, joita haluat seurata. (Valittu: {selectedFocus.length}/3)</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FOCUS_AREAS.map((focus) => (
                <button
                  key={focus.id}
                  onClick={() => toggleFocus(focus.id)}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-4 text-center ${
                    selectedFocus.includes(focus.id) 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                      : "bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <focus.icon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{focus.label}</span>
                  {selectedFocus.includes(focus.id) && <CheckCircle2 size={14} className="text-emerald-400 mt-1" />}
                </button>
              ))}
            </div>

            <div className="pt-12 flex justify-between items-center">
              <button 
                onClick={() => setStep(1)}
                className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest"
              >
                &lt; Palaa roolivalintaan
              </button>
              <button
                onClick={handleFinish}
                disabled={selectedFocus.length === 0}
                className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-30 italic"
              >
                Aktivoi asiantuntija-terminaali
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

