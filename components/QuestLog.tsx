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
    <div className="bg-command-card rounded-2xl border border-white/5 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6 text-command-neon neon-text">
        <Sparkles size={20} />
        <h3 className="text-lg font-black uppercase tracking-tighter">Tehtävälista (Quest Log)</h3>
      </div>

      <div className="space-y-4">
        {quests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              quest.isCompleted 
                ? "bg-command-emerald/5 border-command-emerald/20 opacity-60" 
                : "bg-command-bg border-white/5 hover:border-command-neon/30 cursor-pointer group"
            }`}
          >
            <div className="flex-shrink-0">
              {quest.isCompleted ? (
                <CheckCircle2 size={24} className="text-command-emerald" />
              ) : (
                <div className="group-hover:scale-110 transition-transform">
                  {getIcon(quest.type)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${quest.isCompleted ? "line-through text-command-gray" : "text-white"}`}>
                {quest.title}
              </h4>
              <p className="text-[10px] text-command-gray uppercase font-bold tracking-widest">{quest.description}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black ${quest.isCompleted ? "text-command-emerald" : "text-command-neon"}`}>
                +{quest.xpReward} XP
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

