"use client";

import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { subscribePublicWeeklyBulletin } from "@/app/actions/public-newsletter";

export default function WeeklyBulletinSubscribe() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || done) return;
    setPending(true);
    try {
      const res = await subscribePublicWeeklyBulletin(email);
      if (res.ok) {
        setDone(true);
        toast.success(res.message);
        setEmail("");
      } else {
        toast.error(res.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 shadow-sm relative overflow-hidden">
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-[var(--accent-primary)] opacity-[0.05] rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Mail size={16} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Viikkobulletiini
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-command-dark dark:text-white leading-tight">
            Tilaa yhteenveto viikosta
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Eduskunta, vaikutukset ja kunnalliskatsaus sähköpostiisi. Ei
            kirjautumista — voit peruuttaa koska tahansa.
          </p>
        </div>
        {done ? (
          <div className="flex items-center gap-3 py-2 text-emerald-600 dark:text-emerald-400">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Check size={20} />
            </div>
            <p className="text-xs font-bold">Tilaus vastaanotettu!</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="sr-only" htmlFor="bulletin-email">
              Sähköposti
            </label>
            <input
              id="bulletin-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sinä@esimerkki.fi"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 text-sm font-medium text-command-dark dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : null}
              Tilaa
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
