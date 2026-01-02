'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginStatusMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  // Virheiden kääntäminen selkokielelle
  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'link_expired':
        return 'Sähköpostilinkki on vanhentunut tai sitä on jo käytetty. Tilaa uusi linkki alta.';
      case 'auth_failed':
        return 'Kirjautuminen epäonnistui teknisen virheen vuoksi. Yritä uudelleen.';
      case 'access_denied':
        return 'Pääsy evätty. Varmista, että käytit oikeaa linkkiä.';
      default:
        return 'Jokin meni pieleen. Yritä kirjautua uudelleen.';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      {/* Virheilmoitukset */}
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">Huomio</AlertTitle>
          <AlertDescription className="text-red-700">
            {getErrorMessage(error)}
          </AlertDescription>
        </Alert>
      )}

      {/* Onnistumisilmoitukset (esim. kun linkki on lähetetty) */}
      {message === 'link_sent' && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 font-bold">Linkki lähetetty!</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Tarkista sähköpostisi ja klikkaa kirjautumislinkkiä.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}import { requireAdmin } from "@/app/actions/admin";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  // Check admin access - redirects if not admin
  await requireAdmin();

  return <AdminDashboard />;
}

