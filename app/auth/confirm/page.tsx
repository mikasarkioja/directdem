'use client';

import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Suspense, useState, useEffect } from 'react';
import { verifyOtpAction } from '@/app/actions/auth';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'magiclink';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-handle confirmation on mount
    if (token_hash && status === 'idle') {
      const runVerification = async () => {
        setStatus('loading');
        try {
          const result = await verifyOtpAction(token_hash, type);
          if (result.success) {
            setStatus('success');
            // Hard redirect to home to pick up new cookies
            window.location.href = '/?auth=success';
          }
        } catch (err: any) {
          console.error("[ConfirmPage] Error:", err);
          setStatus('error');
          setError(err.message || "Vahvistus epäonnistui. Linkki on ehkä jo käytetty tai se on avattu väärässä selaimessa.");
        }
      };
      runVerification();
    }
  }, [token_hash, status, type]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
      <div className="w-full max-w-md p-10 bg-slate-900 border border-slate-800 shadow-2xl rounded-[3rem] text-center">
        <div className="mb-8 flex justify-center">
          {status === 'error' ? (
            <div className="p-4 bg-rose-500/20 rounded-full text-rose-500 border border-rose-500/30">
              <AlertCircle size={40} />
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-500 border border-emerald-500/30">
              <ShieldCheck size={40} />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">
          {status === 'error' ? 'Vahvistus epäonnistui' : 'Vahvistetaan istuntoa'}
        </h1>
        
        <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
          {status === 'error' 
            ? 'Tämä johtuu useimmiten siitä, että linkki avattiin eri selaimessa kuin mistä se tilattiin. Kopioi linkki suoraan alkuperäiseen ikkunaan.'
            : 'Viimeistellään kirjautumista ja varmistetaan turvallinen yhteys DirectDem-palvelimeen...'}
        </p>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Käsitellään koodia...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] text-rose-400 font-bold leading-relaxed">
              {error}
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all shadow-xl"
            >
              Palaa etusivulle
            </button>
          </div>
        )}

        {status === 'success' && (
          <p className="text-emerald-400 font-bold animate-pulse uppercase tracking-widest text-xs">Ohjataan etusivulle...</p>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="animate-spin text-white opacity-20" size={40} />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
