'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck, ArrowRight, Loader2, RefreshCw, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOtpAction, verifyOtpCodeAction } from '@/app/actions/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendOtpAction(email);
      setStep('otp');
      toast.success('Vahvistuskoodi lähetetty sähköpostiisi!');
    } catch (error: any) {
      toast.error(error.message || 'Koodin lähetys epäonnistui.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;

    setLoading(true);
    try {
      await verifyOtpCodeAction(email, otp);
      toast.success('Kirjautuminen onnistui!');
      // Direct redirect to workspace/dashboard as requested
      window.location.href = '/?view=workspace';
    } catch (error: any) {
      toast.error('Virheellinen tai vanhentunut koodi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Direct<span className="text-blue-500">Dem</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
            Turvallinen sisäänkirjautuminen
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.form 
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Sähköpostiosoite
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nimi@esimerkki.fi"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Lähetä koodi
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Vahvistuskoodi (6 numeroa)
                  </label>
                  <button 
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Vaihda sähköposti
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono text-xl tracking-[0.5em] text-center"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Vahvista ja kirjaudu
                      <ShieldCheck size={18} />
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 font-bold uppercase text-[9px] tracking-widest transition-colors py-2"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  En saanut koodia, lähetä uudelleen
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-10 text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
          Kirjautumalla hyväksyt palvelun <br/>käyttöehdot ja tietosuojaselosteen.
        </p>
      </motion.div>
    </div>
  );
}

