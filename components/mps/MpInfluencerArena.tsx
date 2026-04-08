"use client";

import type { Bill, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { draftMpContactMessage } from "@/app/actions/mp-message-assistant";
import {
  getBillReactionStats,
  getRecentArenaComments,
  submitCitizenReaction,
  type ArenaCommentRow,
} from "@/app/actions/citizen-reactions";
import {
  mpPredictedForPercent,
  type CitizenPulseAggregate,
} from "@/lib/citizen-reactions/aggregate";
import {
  Mail,
  Send,
  ShieldAlert,
  Users,
  MessageSquare,
  Loader2,
  Globe,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type InterestRow = {
  interest_organization: string;
  declaration_url: string;
};

type LobbyRow = { name: string; topic?: string; date?: string };

type MpContact = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  party?: string | null;
  public_email?: string | null;
  website_url?: string | null;
  social_x_url?: string | null;
  social_facebook_url?: string | null;
};

export default function MpInfluencerArena({
  mp,
  mpId,
  user,
  bills,
  initialBillId,
  interests,
  lobbying,
}: {
  mp: MpContact;
  mpId: number;
  user: UserProfile | null;
  bills: Bill[];
  initialBillId: string | null;
  interests: InterestRow[];
  lobbying: LobbyRow[];
}) {
  const [billId, setBillId] = useState<string>(
    initialBillId && bills.some((b) => b.id === initialBillId)
      ? initialBillId
      : bills[0]?.id || "",
  );
  const [stats, setStats] = useState<CitizenPulseAggregate | null>(null);
  const [comments, setComments] = useState<ArenaCommentRow[]>([]);
  const [reactionPending, setReactionPending] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [userIntent, setUserIntent] = useState("");
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  const selectedBill = useMemo(
    () => bills.find((b) => b.id === billId) || null,
    [bills, billId],
  );

  const mpPredicted = useMemo(() => {
    if (!selectedBill) return 50;
    return mpPredictedForPercent(mp.party, selectedBill.politicalReality);
  }, [selectedBill, mp.party]);

  const hasCommunityData = (stats?.total ?? 0) > 0;
  const communityFor =
    stats?.forPercent != null && hasCommunityData
      ? Math.round(stats.forPercent)
      : Math.round(selectedBill?.citizenPulse?.for ?? 50);

  const refreshPulse = useCallback(async () => {
    if (!billId) return;
    const [s, c] = await Promise.all([
      getBillReactionStats(billId),
      getRecentArenaComments(billId, mpId, 8),
    ]);
    setStats(s);
    setComments(c);
  }, [billId, mpId]);

  useEffect(() => {
    void refreshPulse();
  }, [refreshPulse]);

  const transparencyNotes = useMemo(() => {
    const bits: string[] = [];
    if (interests.length) {
      bits.push(
        `Sidonnaisuusilmoitukset: ${interests
          .slice(0, 4)
          .map((i) => i.interest_organization)
          .join(", ")}`,
      );
    }
    if (lobbying.length) {
      bits.push(
        `Viimeaikaiset lobbaus-/tapaamisrivit (malli): ${lobbying
          .slice(0, 3)
          .map((l) => l.name)
          .join(", ")}`,
      );
    }
    return bits.join(". ") || null;
  }, [interests, lobbying]);

  const onSubmitReaction = async (
    reactionType: "support" | "oppose" | "neutral",
  ) => {
    if (!user) {
      toast.error("Kirjaudu sisään antaaksesi palautetta.");
      return;
    }
    if (!billId) return;
    setReactionPending(true);
    try {
      const res = await submitCitizenReaction({
        billId,
        mpId,
        reactionType,
        comment: commentText.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error || "Tallennus epäonnistui.");
        return;
      }
      toast.success("Palaute tallennettu.");
      setCommentText("");
      await refreshPulse();
    } finally {
      setReactionPending(false);
    }
  };

  const onDraftMessage = async () => {
    if (!user) {
      toast.error("Kirjaudu sisään käyttääksesi viestiavustajaa.");
      return;
    }
    if (!selectedBill) {
      toast.error("Valitse lakiesitys.");
      return;
    }
    setDraftLoading(true);
    try {
      const res = await draftMpContactMessage({
        mpFirstName: mp.first_name || "",
        mpLastName: mp.last_name || "",
        mpParty: mp.party,
        billTitle: selectedBill.title,
        billSummary: selectedBill.summary || "",
        parliamentId: selectedBill.parliamentId,
        userIntent: userIntent.trim() || null,
        transparencyNotes,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDraft(res.text);
      toast.success("Luonnos valmis — tarkista ja lähetä itse.");
    } finally {
      setDraftLoading(false);
    }
  };

  const eduskuntaProfileUrl = `https://www.eduskunta.fi/FI/kansanedustajat/Sivut/${mp.id}.aspx`;

  return (
    <section className="space-y-10 border-t border-white/10 pt-12 mt-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <MessageSquare className="text-purple-400" size={28} />
          Vaikuttaja-areena
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Kuratoitu kanava yhteydenottoon ja palautteeseen. Kaikki tallennetaan
          palvelimelle hallitusti; viestit lähetät itse sähköpostilla tai
          verkkoformailla.
        </p>
      </div>

      {(interests.length > 0 || lobbying.length > 0) && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-4 flex gap-3">
          <ShieldAlert className="shrink-0 text-amber-400 mt-0.5" size={20} />
          <div className="space-y-2 text-sm text-amber-100/90">
            <p className="font-bold text-amber-200 text-xs uppercase tracking-widest">
              Sidonnaisuus-tutka
            </p>
            <p className="text-slate-300">
              Julkiset sidonnaisuusmerkinnät tai lobbausyhteydet eivät todista
              väärinkäytöstä, mutta voivat olla hyvä mainita viestissä
              varovaisesti.
            </p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
              {interests.slice(0, 5).map((i) => (
                <li key={i.declaration_url + i.interest_organization}>
                  {i.interest_organization}
                  {i.declaration_url ? (
                    <>
                      {" "}
                      <a
                        href={i.declaration_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent-primary)] hover:underline"
                      >
                        lähde
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
              {lobbying.slice(0, 3).map((l) => (
                <li key={l.name}>Avoimuusrekisteri (malli): {l.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card className="bg-slate-900/60 border-white/10 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail size={18} className="text-purple-400" />
            Ota yhteyttä
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {mp.public_email ? (
              <a
                href={`mailto:${mp.public_email}`}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
              >
                <Mail className="h-4 w-4" />
                Sähköposti
              </a>
            ) : (
              <a
                href={eduskuntaProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
              >
                <ExternalLink className="h-4 w-4" />
                Eduskunta / yhteystiedot
              </a>
            )}
            {mp.website_url ? (
              <a
                href={mp.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
              >
                <Globe className="h-4 w-4" />
                Kotisivu
              </a>
            ) : null}
            {mp.social_x_url ? (
              <a
                href={mp.social_x_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
              >
                X / Twitter
              </a>
            ) : null}
            {mp.social_facebook_url ? (
              <a
                href={mp.social_facebook_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
              >
                Facebook
              </a>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-500">
            Yhteystiedot tulevat profiilidatasta tai Eduskunnan julkisista
            linkeistä. Päivitä tietoja tarvittaessa hallinnassa.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-white/10 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send size={18} className="text-sky-400" />
            Viestiavustaja (AI, selkokieli)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Lakiesitys
            <select
              value={billId}
              onChange={(e) => setBillId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.parliamentId ? `${b.parliamentId} — ` : ""}
                  {b.title.slice(0, 80)}
                  {b.title.length > 80 ? "…" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Toive viestille (valinnainen)
            <textarea
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              rows={2}
              placeholder="Esim. pyydän selventämään kantaa sosiaaliturvan indeksikorotukseen."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
          </label>
          <Button
            type="button"
            onClick={() => void onDraftMessage()}
            disabled={draftLoading || !selectedBill}
            className="bg-sky-600 hover:bg-sky-500 text-white"
          >
            {draftLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Luo luonnos (Gemini 3 Flash)
          </Button>
          {draft ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">
                Luonnos (tarkista ennen lähetystä)
              </p>
              <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans">
                {draft}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-white/10 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users size={18} className="text-emerald-400" />
            Kansalais-pulssi vs. edustajan arvioitu linja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedBill ? (
            <p className="text-sm text-slate-500">Ei lakia valittuna.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                {hasCommunityData ? (
                  <Badge variant="success" className="text-[9px]">
                    Yhteisödata (areena)
                  </Badge>
                ) : selectedBill.citizenPulseSource === "community" ? (
                  <Badge variant="success" className="text-[9px]">
                    Yhteisödata (valtakunta)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[9px] text-amber-200 border-amber-500/40"
                  >
                    Arvio (ei riittävästi ääniä)
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Yhteisön suunta (kannattaa)</span>
                  <span className="tabular-nums text-white">
                    {Math.round(communityFor)}%
                  </span>
                </div>
                <Progress value={communityFor} max={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Arvio edustajan linjasta (puolueheuristiikka)</span>
                  <span className="tabular-nums text-white">
                    {Math.round(mpPredicted)}%
                  </span>
                </div>
                <Progress
                  value={mpPredicted}
                  max={100}
                  className="h-2 opacity-90"
                />
              </div>
              <Separator className="bg-slate-800" />
            </>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-200 mb-2">
              Kansalaispalaute — miten edustajan pitäisi äänestää?
            </p>
            {!user ? (
              <p className="text-sm text-slate-500">
                <Link href="/login" className="text-purple-300 underline">
                  Kirjaudu
                </Link>{" "}
                jättääksesi kannanoton.
              </p>
            ) : (
              <>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Lyhyt perustelu (valinnainen, sisäinen palaute)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reactionPending}
                    onClick={() => void onSubmitReaction("support")}
                    className="border-emerald-600/50 text-emerald-200"
                  >
                    Kannatan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reactionPending}
                    onClick={() => void onSubmitReaction("oppose")}
                    className="border-rose-600/50 text-rose-200"
                  >
                    Vastustan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reactionPending}
                    onClick={() => void onSubmitReaction("neutral")}
                    className="border-slate-600 text-slate-300"
                  >
                    Neutraali
                  </Button>
                </div>
              </>
            )}
          </div>

          {comments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Viimeisimmät kommentit (sisäiset)
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                {comments.map((c, i) => (
                  <li key={i} className="border-l border-slate-700 pl-3">
                    <span className="text-slate-500">{c.reaction_type}</span> —{" "}
                    {c.comment}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
