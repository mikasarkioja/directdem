"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, ShieldCheck, PenTool } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  isCompleted: boolean;
  type: "vote" | "verify" | "prediction";
}

export default function QuestLog() {
  const quests: Quest[] = [
    {
      id: "1",
      title: "Paikallinen vaikuttaja",
      description: "Äänestä 3 paikallista asiaa Kuntavahdissa.",
      xpReward: 200,
      isCompleted: false,
      type: "vote",
    },
    {
      id: "2",
      title: "Siviili-identiteetti",
      description: "Vahvista henkilöllisyytesi luotettavuuden parantamiseksi.",
      xpReward: 500,
      isCompleted: false,
      type: "verify",
    },
    {
      id: "3",
      title: "Viikon ennustaja",
      description: "Luo viikon ensimmäinen ennustus eduskunnan päätöksestä.",
      xpReward: 150,
      isCompleted: true,
      type: "prediction",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "vote": return <PenTool size={18} className="text-command-neon" />;
      case "verify": return <ShieldCheck size={18} className="text-command-emerald" />;
      case "prediction": return <Sparkles size={18} className="text-command-rose" />;
      default: return <Circle size={18} />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Sparkles size={20} className="text-command-neon" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-command-dark">Mission Log</h3>
      </div>

      <div className="space-y-4">
        {quests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              quest.isCompleted 
                ? "bg-slate-50 border-slate-100 opacity-60" 
                : "bg-white border-slate-100 hover:border-command-neon/30 cursor-pointer shadow-sm hover:shadow-md"
            }`}
          >
            <div className="flex-shrink-0">
              {quest.isCompleted ? (
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-command-emerald" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                  {getIcon(quest.type)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${quest.isCompleted ? "text-slate-400" : "text-command-dark"}`}>
                {quest.title}
              </h4>
              <p className="text-[10px] text-command-gray font-medium uppercase tracking-tight">{quest.description}</p>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-black uppercase ${quest.isCompleted ? "text-command-emerald" : "text-command-neon"}`}>
                +{quest.xpReward} XP
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
