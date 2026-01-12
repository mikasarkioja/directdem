"use client";

import { useState } from "react";
import { Zap, ShieldCheck, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ManageSubscriptionButton from "./ManageSubscriptionButton";

interface PricingTableProps {
  userId: string;
  hasStripeId: boolean;
}

const CREDIT_PACKAGES = [
  { id: "price_credits_100", name: "100 ⚡ Krediittiä", price: "5€", amount: 100 },
  { id: "price_credits_500", name: "500 ⚡ Krediittiä", price: "20€", amount: 500 },
  { id: "price_credits_1000", name: "1000 ⚡ Krediittiä", price: "35€", amount: 1000 },
];

const SUBSCRIPTION_PLANS = [
  { 
    id: "price_sub_premium", 
    name: "Premium Varjoedustaja", 
    price: "15€ / kk", 
    features: ["Rajattomat AI-väittelyt", "Syväanalyysit ilman odotusta", "Prioriteetti-tuki", "Erikois-ID-kortti"] 
  },
  { 
    id: "price_sub_researcher", 
    name: "Tutkija / Akateeminen", 
    price: "24,90€ / kk", 
    features: ["Kaikki Premium-ominaisuudet", "Researcher Workspace (Terminaali)", "Lobbyist Scorecard", "Collaborative Research Notes", "Massadatan vienti (CSV/JSON)"] 
  },
];

export default function PricingTable({ userId, hasStripeId }: PricingTableProps) {
  const [activeTab, setActiveTab] = useState<"credits" | "subscription">("credits");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, mode: "payment" | "subscription") => {
    setLoadingId(priceId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId, mode }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Maksutapahtuman aloitus epäonnistui.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Talouden hallinta</h3>
        <p className="text-sm text-nordic-gray font-medium">Hanki lisää voimaa digitaaliseen vaikuttamiseen.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab("credits")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "credits" ? "bg-nordic-blue text-white shadow-lg" : "text-nordic-gray hover:text-white"
          }`}
        >
          Osta krediittejä
        </button>
        <button
          onClick={() => setActiveTab("subscription")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "subscription" ? "bg-purple-600 text-white shadow-lg" : "text-nordic-gray hover:text-white"
          }`}
        >
          Kuukausitilaus
        </button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === "credits" ? (
          <div className="grid grid-cols-1 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-nordic-blue/50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                    <Zap className="text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{pkg.name}</h4>
                    <p className="text-xs text-nordic-gray">Yksittäisostos</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black text-white">{pkg.price}</span>
                  <button
                    onClick={() => handleCheckout(pkg.id, "payment")}
                    disabled={loadingId !== null}
                    className="px-6 py-2 bg-nordic-blue hover:bg-nordic-deep text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                  >
                    {loadingId === pkg.id ? <Loader2 className="animate-spin" size={16} /> : "Osta"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 shadow-xl space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black uppercase tracking-tight text-white">{plan.name}</h4>
                    <div className="flex items-center gap-2 text-purple-400">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Aktiivinen vaikuttaja</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-white">{plan.price}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-nordic-gray">
                      <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-purple-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id, "subscription")}
                  disabled={loadingId !== null}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {loadingId === plan.id ? <Loader2 className="animate-spin" size={20} /> : "Aloita tilaus"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Portal Button */}
      {hasStripeId && (
        <div className="pt-4 border-t border-white/5">
          <ManageSubscriptionButton />
        </div>
      )}

      <p className="text-[10px] text-center text-nordic-gray uppercase font-bold tracking-widest">
        Maksut käsitellään turvallisesti Stripen kautta.
      </p>
    </div>
  );
}

