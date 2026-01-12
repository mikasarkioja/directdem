"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap, Trophy } from "lucide-react";

interface CreditDisplayProps {
  credits: number;
  impactPoints: number;
}

export default function CreditDisplay({ credits, impactPoints }: CreditDisplayProps) {
  const [prevCredits, setPrevCredits] = useState(credits);
  const [prevImpact, setPrevImpact] = useState(impactPoints);
  const [showCreditAnim, setShowCreditAnim] = useState(false);
  const [showImpactAnim, setShowImpactAnim] = useState(false);

  useEffect(() => {
    if (credits > prevCredits) {
      setShowCreditAnim(true);
      setTimeout(() => setShowCreditAnim(false), 2000);
    }
    setPrevCredits(credits);
  }, [credits, prevCredits]);

  useEffect(() => {
    if (impactPoints > prevImpact) {
      setShowImpactAnim(true);
      setTimeout(() => setShowImpactAnim(false), 2000);
    }
    setPrevImpact(impactPoints);
  }, [impactPoints, prevImpact]);

  return (
    <div className="flex items-center gap-3">
      {/* Credits Display */}
      <motion.div 
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 group transition-all duration-300 ${showCreditAnim ? 'scale-110 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : ''}`}
        initial={false}
      >
        <Zap size={14} className={`text-yellow-500 transition-transform ${showCreditAnim ? 'animate-bounce' : ''}`} />
        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
          {credits}
        </span>
        
        <AnimatePresence>
          {showCreditAnim && (
            <motion.span
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute -top-2 right-0 text-xs font-bold text-emerald-500"
            >
              +{credits - prevCredits} ⚡
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Impact Points Display */}
      <motion.div 
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 transition-all duration-300 ${showImpactAnim ? 'scale-110 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}`}
      >
        <Trophy size={14} className={`text-purple-500 transition-transform ${showImpactAnim ? 'animate-bounce' : ''}`} />
        <span className="text-sm font-bold text-purple-600 dark:text-purple-400 tabular-nums">
          {impactPoints}
        </span>

        <AnimatePresence>
          {showImpactAnim && (
            <motion.span
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute -top-2 right-0 text-xs font-bold text-emerald-500"
            >
              +{impactPoints - prevImpact} 🏆
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

