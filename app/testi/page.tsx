"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, 
  Target, Globe, Shield, TreePine, Landmark, Loader2 
} from "lucide-react";
import { saveDNATestResults } from "@/app/actions/dna";

const QUESTIONS = [
  {
    id: "economic",
    axis: "Talous",
    text: "Valtion tulisi leikata julkisia menoja veronkevennysten mahdollistamiseksi.",
    icon: Landmark,
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    id: "liberal",
    axis: "Arvot",
    text: "Yksilönvapauksien puolustaminen on tärkeämpää kuin perinteisten arvojen vaaliminen.",
    icon: Target,
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  {
    id: "env",
    axis: "Ympäristö",
    text: "Luonnon monimuotoisuuden suojelu on asetettava talouskasvun edelle päätöksenteossa.",
    icon: TreePine,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  },
  {
    id: "urban",
    axis: "Alueet",
    text: "Suomea on kehitettävä suurten kaupunkien veturina, vaikka se heikentäisi maaseudun palveluita.",
    icon: Globe,
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  {
    id: "global",
    axis: "Globalismi",
    text: "Suomen tulisi syventää EU-integraatiota ja lisätä kansainvälistä yhteistyötä kaikilla tasoilla.",
    icon: Sparkles,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  {
    id: "security",
    axis: "Turvallisuus",
    text: "Suomen on panostettava merkittävästi enemmän maanpuolustukseen ja liittoutumiseen turvallisuuden takaamiseksi.",
    icon: Shield,
    color: "text-rose-400",
    bg: "bg-rose-400/10"
  }
];

export default function DNATestPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const currentQuestion = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      finishTest(newAnswers);
    }
  };

  const finishTest = async (finalAnswers: Record<string, number>) => {
    setIsAnalyzing(true);
    
    // Calculate scores (-1.0 to 1.0)
    const scores = {
      economic_score: (finalAnswers.economic - 3) / 2,
      liberal_conservative_score: (finalAnswers.liberal - 3) / 2,
      environmental_score: (finalAnswers.env - 3) / 2,
      urban_rural_score: (finalAnswers.urban - 3) / 2,
      international_national_score: (finalAnswers.global - 3) / 2,
      security_score: (finalAnswers.security - 3) / 2,
    };

    // Store in localStorage for temporary use if not logged in
    localStorage.setItem("dna_test_results", JSON.stringify(scores));

    // Try to save to database if logged in
    try {
      await saveDNATestResults(scores);
    } catch (e) {
      console.error("Failed to save DNA results to DB", e);
    }

    // Simulate AI analysis time
    setTimeout(() => {
      router.push("/testi/tulokset");
    }, 2500);
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 mb-8 text-purple-500"
        >
          <BrainCircuit size={96} />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-black uppercase tracking-tighter text-white mb-2"
        >
          Analysoidaan poliittista DNA:tasi...
        </motion.h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
          Verrataan vastauksiasi 200 kansanedustajaan
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-12"
          >
            <div className="space-y-4 text-center">
              <div className={`inline-flex p-4 rounded-3xl ${currentQuestion.bg} ${currentQuestion.color} mb-4`}>
                <currentQuestion.icon size={32} />
              </div>
              <p className={`text-xs font-black uppercase tracking-[0.3em] ${currentQuestion.color}`}>
                Kysymys {step + 1} / {QUESTIONS.length} — {currentQuestion.axis}
              </p>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight">
                {currentQuestion.text}
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Täysin samaa mieltä", value: 5, color: "hover:bg-emerald-500/20 hover:border-emerald-500/50" },
                { label: "Jokseenkin samaa mieltä", value: 4, color: "hover:bg-emerald-500/10 hover:border-emerald-500/30" },
                { label: "En osaa sanoa", value: 3, color: "hover:bg-slate-500/20 hover:border-slate-500/50" },
                { label: "Jokseenkin eri mieltä", value: 2, color: "hover:bg-rose-500/10 hover:border-rose-500/30" },
                { label: "Täysin eri mieltä", value: 1, color: "hover:bg-rose-500/20 hover:border-rose-500/50" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-6 rounded-2xl bg-white/5 border border-white/10 text-left font-black uppercase tracking-widest text-[10px] transition-all flex justify-between items-center group ${option.color}`}
                >
                  <span>{option.label}</span>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="p-4 rounded-full bg-white/5 text-slate-500 hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
      </main>
    </div>
  );
}


