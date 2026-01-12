"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ManageSubscriptionButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePortalRequest = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/portal", {
          method: "POST",
        });
        
        const data = await response.json();
        
        if (data.url) {
          window.location.assign(data.url);
        } else {
          setError(data.error || "Portaalin avaaminen epäonnistui.");
        }
      } catch (err) {
        setError("Yhteysvirhe. Yritä uudelleen.");
      }
    });
  };

  return (
    <div className="space-y-3 w-full">
      <button
        onClick={handlePortalRequest}
        disabled={isPending}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nordic-blue/10 rounded-xl flex items-center justify-center border border-nordic-blue/20">
            <CreditCard className="text-nordic-blue" size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Hallitse tilausta</h4>
            <p className="text-[10px] text-nordic-gray font-bold uppercase tracking-widest">Päivitä kortti tai peruuta tilaus</p>
          </div>
        </div>

        {isPending ? (
          <Loader2 className="animate-spin text-nordic-blue" size={20} />
        ) : (
          <ExternalLink className="text-nordic-gray group-hover:text-white transition-colors" size={18} />
        )}
      </button>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-4"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence } from "framer-motion";

