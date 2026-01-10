'use client';

import { useState, useMemo } from 'react';
import { Loader2, ShieldCheck, Ghost, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { startGhostSession } from '@/lib/auth/ghost-actions';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'ghost'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [ghostName, setGhostName] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) throw error;
      setStep('otp');
      toast.success('Koodi lähetetty!');
    } catch (error: any) {
      toast.error('Lähetys epäonnistui: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;
    setLoading(true);
    try {
      console.log("[Login] Verifying OTP on client...");
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
      if (data.session) {
        toast.success('Kirjautuminen onnistui!');
        // Pakotetaan sivu latautumaan uudelleen dashboardilla
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || 'Virheellinen koodi.');
      setLoading(false);
    }
  };

  const handleGhostLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghostName) return;
    setLoading(true);
    try {
      await startGhostSession(ghostName);
    } catch (error: any) {
      // Ohitetaan Next.js:n sisäinen redirect-virhe
      if (error.digest?.includes('NEXT_REDIRECT')) return;
      
      console.error("Ghost login error:", error);
      toast.error('Pikakirjautuminen epäonnistui.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <ShieldCheck className="text-blue-500 mb-4" size={48} />
          <h1 className="text-3xl font-black uppercase text-white tracking-tighter">DirectDem</h1>
        </div>
        
        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div key="e" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Sähköpostiosoite</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nimi@esimerkki.fi" className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Lähetä koodi'}
                </button>
              </form>
              
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-4">Tai kokeile heti ilman sähköpostia</p>
                <button 
                  onClick={() => setStep('ghost')}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-blue-500/30 text-blue-400 font-bold uppercase text-[10px] tracking-widest hover:bg-blue-500/10 transition-all"
                >
                  <Ghost size={14} /> Pikasisäänpääsy
                </button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.form key="o" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Vahvistuskoodi</label>
                <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} placeholder="123456" className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 px-6 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Vahvista'}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-center text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest">Takaisin</button>
            </motion.form>
          )}

          {step === 'ghost' && (
            <motion.form key="g" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleGhostLogin} className="space-y-6">
              <div className="text-center mb-4">
                <Ghost className="text-blue-400 mx-auto mb-2" size={32} />
                <h2 className="text-white font-bold uppercase tracking-widest text-sm">Ghost Login</h2>
                <p className="text-slate-500 text-[10px] mt-1">Pääset testaamaan kaikkia ominaisuuksia heti.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nimimerkkisi</label>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  value={ghostName} 
                  onChange={(e) => setGhostName(e.target.value)} 
                  placeholder="Esim. Varjoedustaja" 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <Sparkles size={18} />
                    <span>Astu eduskuntaan</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-center text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest">Takaisin sähköpostiin</button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
