import { getUser } from "@/app/actions/auth";
import BulletinEditorClient from "@/components/dashboard/bulletin/BulletinEditorClient";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viikkobulletiini | Omatase",
  description:
    "Toimituksen viikkolehti: Eduskunta, vaikuttajat ja Espoon pulssi",
};

function defaultUtcDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function BulletinDashboardPage() {
  const user = await getUser();
  const { start, end } = defaultUtcDateRange();

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />
      <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[var(--accent-primary)]"
        >
          ← Työpöytä
        </Link>
      </div>
      <BulletinEditorClient initialStart={start} initialEnd={end} />
    </div>
  );
}
