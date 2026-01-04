'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { verifyOtpAction } from '@/app/actions/auth';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'magiclink';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!token_hash) {
      setError("Virheellinen vahvistuslinkki.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[ConfirmPage] Verifying OTP via Server Action...");
      const result = await verifyOtpAction(token_hash, type);
      
      if (result.success) {
        console.log("[ConfirmPage] Verification success, redirecting home...");
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error("[ConfirmPage] Error:", err);
      setError(err.message || "Kirjautuminen epäonnistui. Linkki saattaa olla vanhentunut.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl text-center">
        <ShieldCheck className="mx-auto text-blue-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">Vahvista kirjautuminen</h1>
        <p className="text-slate-600 mb-8">
          Paina painiketta viimeistelläksesi kirjautumisen. 
          Tämä vaihe varmistaa, että istuntosi aktivoituu turvallisesti.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <button 
          onClick={handleConfirm}
          disabled={loading || !token_hash}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors font-black uppercase tracking-widest h-14 text-sm shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Käsitellään...
            </>
          ) : (
            "Viimeistele kirjautuminen"
          )}
        </button>
        
        {!token_hash && !loading && (
          <p className="mt-4 text-xs text-amber-600 font-bold">
            Huom: Linkki näyttää puutteelliselta. Varmista että kopioit koko osoitteen sähköpostista.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nordic-blue"></div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
