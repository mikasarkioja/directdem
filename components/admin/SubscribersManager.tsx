"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Trash2, MailPlus, Send } from "lucide-react";
import toast from "react-hot-toast";
import {
  addNewsletterSubscriber,
  deleteNewsletterSubscriber,
  sendTestBulletin,
  type NewsletterSubscriber,
} from "@/app/actions/newsletter-subscribers";

type Props = {
  initialSubscribers: NewsletterSubscriber[];
  defaultTestEmail: string;
};

export default function SubscribersManager({
  initialSubscribers,
  defaultTestEmail,
}: Props) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [email, setEmail] = useState("");
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [isAdding, startAdding] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isSendingTest, startSendingTest] = useTransition();

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.is_active).length,
    [subscribers],
  );

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setFeedback(null);
    startAdding(async () => {
      const result = await addNewsletterSubscriber(email);
      setFeedback({
        type: result.success ? "ok" : "error",
        text: result.message,
      });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      if (result.success) {
        const refreshed = [...subscribers];
        refreshed.unshift({
          id: `tmp-${Date.now()}`,
          email: email.trim().toLowerCase(),
          created_at: new Date().toISOString(),
          is_active: true,
        });
        setSubscribers(refreshed);
        setEmail("");
      }
    });
  };

  const handleDelete = (subscriberId: string) => {
    setFeedback(null);
    startDeleting(async () => {
      const result = await deleteNewsletterSubscriber(subscriberId);
      setFeedback({
        type: result.success ? "ok" : "error",
        text: result.message,
      });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      if (result.success) {
        setSubscribers((prev) =>
          prev.filter((subscriber) => subscriber.id !== subscriberId),
        );
      }
    });
  };

  const handleSendTest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!testEmail.trim()) return;

    startSendingTest(async () => {
      const result = await sendTestBulletin(testEmail);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <p className="text-xs uppercase tracking-widest text-cyan-400">
            Admin / Subscribers
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Viikkokirjeen tilaajien hallinta
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Hallitse tilaajia turvallisesti selaimesta ilman suoraa
            tietokantamuokkausta.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300">
            Tilaajia yhteensä: {subscribers.length} (aktiivisia: {activeCount})
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Muistutus: varmista, että `app/api/cron/weekly-bulletin/route.ts`
          hakee vastaanottajat `newsletter_subscribers`-taulusta.
        </div>

        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg"
        >
          <label
            htmlFor="subscriber-email"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Lisää uusi tilaaja
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="subscriber-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tilaaja@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-500/40 transition focus:ring"
            />
            <button
              type="submit"
              disabled={isAdding}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailPlus className="h-4 w-4" />
              )}
              Lisää tilaaja
            </button>
          </div>

          {feedback && (
            <p
              className={`mt-3 text-sm ${
                feedback.type === "ok" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {feedback.text}
            </p>
          )}
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="border-b border-slate-800 px-6 py-4 text-sm font-semibold text-slate-300">
            Tilaajalista
          </div>

          {subscribers.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-400">
              Ei tilaajia vielä.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {subscribers.map((subscriber) => (
                <li
                  key={subscriber.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {subscriber.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lisätty{" "}
                      {new Date(subscriber.created_at).toLocaleString("fi-FI")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(subscriber.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Poista
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSendTest}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg"
        >
          <div className="mb-3">
            <h2 className="text-lg font-extrabold tracking-tight text-cyan-300">
              Viikkokatsauksen esikatselu
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Lähetä testiversio viikkokatsauksesta valittuun sähköpostiin.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="test-bulletin-email"
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-500/40 transition focus:ring"
            />
            <button
              type="submit"
              disabled={isSendingTest}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Lähetä testiviesti
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
