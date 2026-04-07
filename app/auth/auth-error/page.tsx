import Link from "next/link";

const MESSAGES: Record<string, string> = {
  missing_code: "Kirjautumiskoodi puuttui. Yritä kirjautua uudelleen.",
  no_user_after_exchange: "Istuntoa ei saatu luotua. Yritä uudelleen.",
  exchange_failed:
    "Kirjautumiskoodi on vanhentunut tai virheellinen. Yritä kirjautua uudelleen.",
  admin_required:
    "Tarvitset ylläpitäjätilin (profiles.is_admin). Pyydä oikeuksia tai päivitä tieto Supabasessa.",
};

type Props = { searchParams: Promise<{ message?: string }> };

export default async function AuthErrorPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.message ?? "";
  const message = MESSAGES[raw] ?? (raw || "Kirjautuminen epäonnistui.");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50/80 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
        <h1 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Kirjautumisvirhe
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Siirry kirjautumiseen
          </Link>
          <Link
            href="/dashboard"
            className="inline-block rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-950/50"
          >
            Etusivu / dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
