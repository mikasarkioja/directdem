"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetchRelevantNews } from "@/lib/news-fetcher";
import { addDNAPoints } from "./dna";
import type { ArchetypePoints } from "@/lib/types";

/**
 * Analyzes party member activity and news to see if a manifesto update is needed.
 */
export async function triggerManifestoLearning(partyId: string) {
  const supabase = await createClient();

  // 1. Get current party data
  const { data: party, error: partyError } = await supabase
    .from("virtual_parties")
    .select("*")
    .eq("id", partyId)
    .single();

  if (partyError || !party) throw new Error("Puoluetta ei löytynyt");

  // 2. Get member voting trends (Last 30 days)
  // We query votes from members of this party
  const { data: memberVotes, error: voteError } = await supabase
    .from("votes")
    .select(`
      position,
      bill_id,
      bills(title, summary)
    `)
    .in("user_id", 
      (await supabase.from("party_members").select("user_id").eq("party_id", partyId)).data?.map(m => m.user_id) || []
    )
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (voteError) console.error("Error fetching member votes:", voteError);

  // 3. Get latest news context
  const news = await fetchRelevantNews(party.name);

  // 4. AI Analysis: Does the manifesto reflect current member trends?
  const memberTrends = memberVotes?.reduce((acc: any, vote: any) => {
    const billTitle = vote.bills?.title || "Unknown";
    if (!acc[billTitle]) acc[billTitle] = { for: 0, against: 0 };
    if (vote.position === 'for') acc[billTitle].for++;
    if (vote.position === 'against') acc[billTitle].against++;
    return acc;
  }, {});

  const { text: proposal, reasoning } = await generateManifestoProposal(
    party.name,
    party.manifesto || "",
    memberTrends,
    news
  );

  // 5. Store pending update
  const { error: updateError } = await supabase
    .from("virtual_parties")
    .update({
      pending_update_text: proposal,
      pending_update_reasoning: reasoning,
      pending_update_created_at: new Date().toISOString()
    })
    .eq("id", partyId);

  if (updateError) throw new Error("Päivityksen tallennus epäonnistui");

  return { success: true, message: "Uusi manifestiehdotus on luotu jäsenten arvioitavaksi." };
}

async function generateManifestoProposal(
  partyName: string, 
  currentManifesto: string, 
  trends: any, 
  news: any[]
) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Olet 'Dynamic Manifesto Learning Engine'. Tehtäväsi on päivittää virtuaalipuolueen manifesti vastaamaan jäsenten TODELLISTA toimintaa ja tuoretta uutisvirtaa.
      
      Analysoi:
      1. Nykyinen manifesti.
      2. Jäsenten äänestystrendit (mitä he oikeasti haluavat?).
      3. Tuoreet uutiset (miten maailma on muuttunut?).
      
      PALAUTA JSON-MUODOSSA:
      {
        "proposal": "Uusi 3-osainen manifesti suomeksi (Arvot, Tavoitteet, Miksi olemme olemassa)",
        "reasoning": "Lyhyt selitys miksi päivitys on tarpeen (esim. 'Jäsenet äänestivät vahvasti X:n puolesta, vaikka manifesti sanoi Y')"
      }`,
      prompt: `Puolue: ${partyName}
      Nykyinen manifesti: ${currentManifesto}
      Jäsenten äänestysdata: ${JSON.stringify(trends)}
      Tuoreet uutiset: ${JSON.stringify(news)}`,
    } as any);

    const data = JSON.parse(text);
    return data;
  } catch (e) {
    console.error("Proposal generation failed", e);
    return { 
      proposal: currentManifesto, 
      reasoning: "AI ei pystynyt generoimaan päivitystä juuri nyt." 
    };
  }
}

export async function voteOnManifestoUpdate(partyId: string, approve: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ei kirjautuneena");

  const { error } = await supabase
    .from("manifesto_update_votes")
    .upsert({
      party_id: partyId,
      user_id: user.id,
      approve
    }, { onConflict: "party_id,user_id" });

  if (error) throw new Error("Äänestys epäonnistui");

  // Reward Reformer XP
  await addDNAPoints("reformer", 2);

  // Trigger check for consensus (could be done in background too)
  await checkConsensusAndFinalize(partyId);

  return { success: true };
}

async function checkConsensusAndFinalize(partyId: string) {
  const supabase = await createClient();

  // 1. Get votes
  const { data: votes } = await supabase
    .from("manifesto_update_votes")
    .select("approve")
    .eq("party_id", partyId);

  if (!votes || votes.length === 0) return;

  // 2. Get total member count
  const { count: memberCount } = await supabase
    .from("party_members")
    .select("*", { count: 'exact', head: true })
    .eq("party_id", partyId);

  const approveCount = votes.filter(v => v.approve).length;
  
  // Simple consensus: > 50% of members or some threshold
  // For demo: > 1 vote and > 50% approval
  if (approveCount > 0 && approveCount > (votes.length / 2)) {
    const { data: party } = await supabase
      .from("virtual_parties")
      .select("*")
      .eq("id", partyId)
      .single();

    if (party && party.pending_update_text) {
      // a. Archive current manifesto
      const { data: latestVersion } = await supabase
        .from("manifesto_versions")
        .select("version_number")
        .eq("party_id", partyId)
        .order("version_number", { ascending: false })
        .limit(1);
      
      const newVersionNum = (latestVersion?.[0]?.version_number || 0) + 1;

      await supabase
        .from("manifesto_versions")
        .insert({
          party_id: partyId,
          manifesto_text: party.manifesto,
          reasoning: "Arkistoitu päivityksen tieltä",
          version_number: latestVersion?.[0]?.version_number || 0,
          is_active: false
        });

      // b. Update to new manifesto
      await supabase
        .from("virtual_parties")
        .update({
          manifesto: party.pending_update_text,
          pending_update_text: null,
          pending_update_reasoning: null,
          pending_update_created_at: null
        })
        .eq("id", partyId);

      // c. Clear votes for this update
      await supabase
        .from("manifesto_update_votes")
        .delete()
        .eq("party_id", partyId);
    }
  }
}

export async function getManifestoHistory(partyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manifesto_versions")
    .select("*")
    .eq("party_id", partyId)
    .order("version_number", { ascending: false });

  return data || [];
}

