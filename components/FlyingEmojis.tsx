"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmojiReaction {
  id: string;
  emoji: string;
  x: number;
}

export default function FlyingEmojis() {
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);

  const addReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * 80 + 10; // 10% to 90% width
    setReactions((prev) => [...prev, { id, emoji, x }]);
    
    // Remove after 3s
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }, []);

  // Simulate some social activity
  useEffect(() => {
    const emojis = ["🔥", "👏", "💯", "🤔", "🧐", "👍"];
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addReaction(emojis[Math.floor(Math.random() * emojis.length)]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [addReaction]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: "100%", opacity: 0, scale: 0.5, x: `${r.x}%` }}
            animate={{ 
              y: "-20%", 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.2, 1, 0.8],
              x: `${r.x + (Math.random() * 10 - 5)}%` 
            }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-2xl"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Reaction Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
        {["🔥", "👏", "🤔", "💯"].map(emoji => (
          <button
            key={emoji}
            onClick={() => addReaction(emoji)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}


