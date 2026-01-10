// lib/analysis/promise-monitor.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Vaalilupaus-vahti (Promise Watch)
 * Vertaa yksittäistä äänestystapahtumaa kansanedustajien vaalikonevastauksiin.
 */
export async function checkVoteIntegrity(eventId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae äänestystapahtuman tiedot (kategoria ja painotus)
  const { data: event } = await supabase
    .from('voting_events')
    .select('id, category, summary_ai, title_fi')
    .eq('id', eventId)
    .single();

  if (!event || !event.category || event.category === 'Muu') return;

  const parts = event.summary_ai?.split(': ');
  const aiWeight = parts?.length > 1 ? parseFloat(parts[1]) : 0;
  if (Math.abs(aiWeight) < 0.2) return; // Ohitetaan heikot painotukset

  // 2. Hae kaikki äänet tähän tapahtumaan
  const { data: votes } = await supabase
    .from('mp_votes')
    .select('mp_id, vote_type')
    .eq('event_id', eventId);

  if (!votes) return;

  // 3. Hae edustajien vaalikonevastaukset tässä kategoriassa
  const { data: responses } = await supabase
    .from('mp_candidate_responses')
    .select('mp_id, response_value, weight, question')
    .eq('category', event.category);

  if (!responses) return;

  // Ryhmittele vastaukset MP-kohtaisesti
  const mpResponses: Record<number, any[]> = {};
  responses.forEach(r => {
    if (!mpResponses[r.mp_id]) mpResponses[r.mp_id] = [];
    mpResponses[r.mp_id].push(r);
  });

  const alerts: any[] = [];

  for (const vote of votes) {
    const respList = mpResponses[vote.mp_id];
    if (!respList || respList.length === 0) continue;

    // Laske keskimääräinen lupaus (-1 ... 1)
    const avgPromise = respList.reduce((sum, r) => {
      const normalized = (3 - r.response_value) / 2; // 1->1, 3->0, 5->-1
      return sum + (normalized * r.weight);
    }, 0) / respList.length;

    // Todellinen ääni suunta
    const voteVal = vote.vote_type === 'jaa' ? 1 : vote.vote_type === 'ei' ? -1 : 0;
    if (voteVal === 0) continue;

    // Poikkeama: Jos lupaus ja ääni ovat eri suuntaisia
    // Esim: Lupaus 0.8 (Oikeisto) vs Ääni -1 (Vasen) -> Diff = 1.8
    const diff = Math.abs(avgPromise - voteVal);

    if (diff > 1.2) { // Merkittävä poikkeama
      const severity = diff > 1.6 ? 'high' : 'medium';
      
      alerts.push({
        mp_id: vote.mp_id,
        event_id: eventId,
        category: event.category,
        promise_value: Math.round(avgPromise * 100), // Tallennetaan prosenttina
        vote_type: vote.vote_type,
        deviation_score: diff,
        severity: severity
      });

      // 4. Lähetä ilmoitukset seuraajille (taustaprosessina oikeassa sovelluksessa)
      await triggerNotifications(vote.mp_id, event, vote.vote_type, severity);
    }
  }

  // Tallenna hälytykset
  if (alerts.length > 0) {
    await supabase.from('integrity_alerts').upsert(alerts, { onConflict: 'mp_id,event_id' });
  }
}

async function triggerNotifications(mpId: number, event: any, voteType: string, severity: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Hae edustajan nimi
  const { data: mp } = await supabase.from('mps').select('first_name, last_name').eq('id', mpId).single();
  if (!mp) return;

  // Hae seuraajat
  const { data: followers } = await supabase.from('user_follows').select('user_id').eq('mp_id', mpId);
  if (!followers) return;

  const notifications = followers.map(f => ({
    user_id: f.user_id,
    title: `🚨 Vaalilupaus-vahti: ${mp.first_name} ${mp.last_name}`,
    message: `Seuraamasi edustaja äänesti juuri vastoin vaalilupaustaan aiheessa "${event.title_fi}". Luokitus: ${severity === 'high' ? 'Takinkääntö' : 'Poikkeama'}.`,
    type: 'alert',
    link: `/eduskuntavahti/alert/${mpId}/${event.id}`
  }));

  if (notifications.length > 0) {
    await supabase.from('user_notifications').insert(notifications);
  }
}


