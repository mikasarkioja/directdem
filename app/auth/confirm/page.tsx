'use client';

import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'magiclink';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl text-center">
        <ShieldCheck className="mx-auto text-blue-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">Vahvista kirjautuminen</h1>
        <p className="text-slate-600 mb-8">
          Paina painiketta viimeistelläksesi kirjautumisen. 
          Tämä vaihe varmistaa, että istuntosi aktivoituu tässä välilehdessä.
        </p>

        <form action="/auth/callback" method="GET">
          <input type="hidden" name="token_hash" value={token_hash || ''} />
          <input type="hidden" name="type" value={type} />
          <button 
            type="submit"
            className="w-full px-4 py-3 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors font-medium h-12 text-lg shadow-md"
          >
            Viimeistele kirjautuminen
          </button>
        </form>
      </div>
    </div>
  );
}
