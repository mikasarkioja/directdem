import { createClient as createSupabaseJS } from "@supabase/supabase-js";
import { streamText, StreamData } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { processTransaction } from "@/lib/logic/economy";
import { trackFeatureUsage, logAiCost } from "@/lib/analytics/tracker";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, championId, challengerId, billId, userDna } = await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    console.error("Arena Duel - Missing Env Vars");
    return new Response(JSON.stringify({ error: "Palvelimen konfiguraatiovirhe (API keys missing)." }), { status: 500 });
  }

  // --- Credit Check ---
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  // If not logged in via Supabase, check for Ghost user via cookie
  let userId = user?.id;
  if (!userId) {
    const cookies = await import("next/headers").then(h => h.cookies());
    userId = (await cookies).get("guest_user_id")?.value;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Kirjaudu sisään tai käytä pikakirjautumista." }), { status: 401 });
  }

  try {
    await processTransaction(userId, 20, "AI Arena Duel Message", "SPEND");
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: "Ei tarpeeksi krediittejä. Suorita tehtäviä tai osta lisää. (Tarvitset 20 ⚡)" 
    }), { status: 402 });
  }

  console.log("Arena Duel - Starting:", { championId, challengerId, billId, userId });

  // Varmistetaan että ID:t ovat numeroita
  const champIdNum = parseInt(championId);
  const challIdNum = parseInt(challengerId);

  const supabase = createSupabaseJS(supabaseUrl, serviceKey);

  // 1. Fetch both MP profiles by starting from the base 'mps' table
  const { data: mpsData, error: mpsError } = await supabase
    .from("mps")
    .select(`
      id,
      first_name,
      last_name,
      party,
      mp_ai_profiles!inner (
        system_prompt,
        voting_summary,
        rhetoric_style
      ),
      mp_profiles (
        economic_score,
        liberal_conservative_score,
        environmental_score,
        urban_rural_score,
        international_national_score,
        security_score
      )
    `)
    .in("id", [champIdNum, challIdNum]);

  console.log("Arena Duel - MP Data Fetch:", { 
    count: mpsData?.length, 
    error: mpsError?.message,
    foundIds: mpsData?.map(m => m.id)
  });

  if (mpsError || !mpsData || mpsData.length < 2) {
    const foundIds = mpsData?.map(m => m.id.toString()) || [];
    const missing = [championId, challengerId].filter(id => !foundIds.includes(id.toString()));
    
    return new Response(JSON.stringify({ 
      error: `Edustajien AI-profiilit puuttuvat: ${missing.join(", ")}. Profiloi heidät ensin.` 
    }), { status: 400 });
  }

  // Map the data back to the format the rest of the script expects
  const champion = mpsData.find(m => m.id === champIdNum);
  const challenger = mpsData.find(m => m.id === challIdNum);

  if (!champion || !challenger) {
    return new Response(JSON.stringify({ error: "Yksi tai molemmat edustajien AI-profiileista puuttuu." }), { status: 404 });
  }

  // 2. Fetch Bill Profile & Integrity Alerts (Takinkääntö-data)
  const [{ data: billProfile }, { data: alerts }] = await Promise.all([
    supabase
      .from("bill_enhanced_profiles")
      .select("*")
      .eq("bill_id", billId)
      .single(),
    supabase
      .from("integrity_alerts")
      .select("*")
      .eq("event_id", billId)
      .in("mp_id", [champIdNum, challIdNum])
  ]);

  const champAlerts = alerts?.filter(a => a.mp_id === champIdNum) || [];
  const challAlerts = alerts?.filter(a => a.mp_id === challIdNum) || [];

  const champName = `${champion.first_name} ${champion.last_name}`;
  const challName = `${challenger.first_name} ${challenger.last_name}`;
  const champParty = champion.party;
  const challParty = challenger.party;

  const billContext = billProfile ? `
    VÄITTELYN AIHE (LAKI):
    - Otsikko: ${billProfile.title}
    - Hotspotit (Kiistanalaiset kohdat): ${JSON.stringify((billProfile.analysis_data as any).hotspots || (billProfile.analysis_data as any).controversy_hotspots)}
    - Voittajat: ${JSON.stringify((billProfile.analysis_data as any).winners || (billProfile.analysis_data as any).social_equity?.winners)}
    - Häviäjät: ${JSON.stringify((billProfile.analysis_data as any).losers || (billProfile.analysis_data as any).social_equity?.losers)}
    - Kitka-ennuste: ${(billProfile.forecast_metrics as any).friction_index}/100
    - Taloudellinen vaikutus: ${JSON.stringify((billProfile.analysis_data as any).economic_impact || (billProfile.analysis_data as any).economic_impact)}
  ` : "Yleinen poliittinen linjaus.";

  const alertsContext = `
    TAKINKÄÄNTÖ-HÄLYTYKSET (AMMO):
    ${champName} (${champParty}): ${champAlerts.map(a => `- ${a.category}: ${a.reasoning} (Vakavuus: ${a.severity})`).join("\n") || "Ei tunnettuja ristiriitoja tässä esityksessä."}
    ${challName} (${challParty}): ${challAlerts.map(a => `- ${a.category}: ${a.reasoning} (Vakavuus: ${a.severity})`).join("\n") || "Ei tunnettuja ristiriitoja tässä esityksessä."}
  `;

  // 3. Conflict Analysis between the two MPs
  const getDna = (mp: any) => {
    if (!mp.mp_profiles) return null;
    return Array.isArray(mp.mp_profiles) ? mp.mp_profiles[0] : mp.mp_profiles;
  };

  const getAi = (mp: any) => {
    if (!mp.mp_ai_profiles) return null;
    return Array.isArray(mp.mp_ai_profiles) ? mp.mp_ai_profiles[0] : mp.mp_ai_profiles;
  };

  const champDna = getDna(champion);
  const challDna = getDna(challenger);
  const champAi = getAi(champion);
  const challAi = getAi(challenger);
  
  let distance = 0;
  if (champDna && challDna) {
    const diffs = [
      Math.pow((champDna.economic_score || 0) - (challDna.economic_score || 0), 2),
      Math.pow((champDna.liberal_conservative_score || 0) - (challDna.liberal_conservative_score || 0), 2),
      Math.pow((champDna.environmental_score || 0) - (challDna.environmental_score || 0), 2),
      Math.pow((champDna.urban_rural_score || 0) - (challDna.urban_rural_score || 0), 2),
      Math.pow((champDna.international_national_score || 0) - (challDna.international_national_score || 0), 2),
      Math.pow((champDna.security_score || 0) - (challDna.security_score || 0), 2),
    ];
    distance = Math.sqrt(diffs.reduce((a, b) => a + b, 0));
  }

  console.log("Arena Duel - Distance:", distance);

  const provocationLevel = distance > 2.5 ? "KORKEA (Spicy)" : (distance > 1.5 ? "KESKITASO" : "MATALA (Rakentava)");

  const systemPrompt = `
    POLIITTINEN KAKSINTAISTELU - MODERAATTORI-MOODI
    
    Olet kokenut poliittinen moderaattori. Ohjaat kahden AI-agentin välistä väittelyä.
    
    OSAPUOLET:
    1. CHAMPION (Agentti A): ${champName} (${champParty}). 
       - Tyyli: ${champAi?.rhetoric_style} (Hjalliksen tyyli: suora, liikemiesmäinen, populistinen, kriittinen valtavirtaa kohtaan).
       - Perustus: ${champAi?.system_prompt}
       - Äänestykset: ${JSON.stringify(champAi?.voting_summary)}
    
    2. CHALLENGER (Agentti B): ${challName} (${challParty}). 
       - Tyyli: ${challAi?.rhetoric_style}
       - Perustus: ${challAi?.system_prompt}
       - Äänestykset: ${JSON.stringify(challAi?.voting_summary)}
    
    KONTEKSTI (LAKI):
    ${billContext}
    
    ${alertsContext}
    
    IDEOLOGINEN JÄNNITE: ${distance.toFixed(2)} / 5.0 -> Provokaatio-taso: ${provocationLevel}.
    
    VÄITTELYN SÄÄNNÖT JA AGENTTI-KETJU (DUEL MODE 2.0):
    1. PUHUTTELU: ÄLÄ käytä termiä 'Rouva/Herra puhemies'. Tämä ei ole täysistunto. Puhuttele vastustajaa nimellä (esim. '${challName}') tai 'kansanedustaja [Sukunimi]'. Hjallis voi käyttää tuttavallisempaa 'sä'-muotoa.
    2. PROAKTIIVINEN HYÖKKÄYS: Etsi vastustajan "TAKINKÄÄNTÖ-HÄLYTYKSET" ja käytä niitä välittömästi. Jos vastustaja äänestää vastoin lupauksiaan, MP [X] (Hjallis tai haastaja) on huomautettava siitä kärkkäästi.
    2. HOTSPOT-HYÖDYNTÄMINEN: Käytä LAIN HOTSPOT-kohtia väittelyn kärkenä. Esim. "Tämä laki leikkaa eläkeläisiltä, vaikka sä lupasit vappusatasen!"
    3. HJALLIS-TYYLI: Jos Agentti A on Hjallis, hänen on oltava erityisen epäsovinnainen, kyseenalaistettava koko nykyinen poliittinen järjestelmä ja käytettävä "suoraa puhetta" ilman turhia kaunisteluja.
    4. VASTAUSLOGIIKKA: Jos edellinen puhuja oli Agentti A, kirjoita Agentti B:n vastaus. Jos edellinen puhuja oli Agentti B, kirjoita Agentti A:n kuitti.
    5. DATA-VIITTEET: Jokaiseen puheenvuoroon on sisällyttävä vähintään yksi viittaus joko MP:n äänestyshistoriaan, lupaukseen tai lain Hotspottiin.
    
    FORMATOINTI:
    - Aloita viesti: [SPEAKER: CHAMPION|CHALLENGER]
    - Lisää tila: [STATUS: Hyökkää|Puolustautuu|Selittää kompromissia|Kunnioittaa|Haastaa takinkäännöstä]
    - Jos viittaat dataan: [FACTS: {"bill": "Lain nimi", "vote": "Jaa/Ei", "source": "Äänestys/Lupaus"}]
    
    KÄYTTÄJÄN ROOLI:
    Käyttäjä on "Erotuomari". Jos hän heittää väliin kysymyksen, molemmat agentit vastaavat siihen peräkkäin lyhyesti omasta näkökulmastaan.
  `;

  const data = new StreamData();

  // Track feature usage start
  await trackFeatureUsage("Arena Duel", "GENERATE", userId);

  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    onFinish(completion: any) {
      // Log AI Cost
      logAiCost(
        "Arena Duel", 
        "gpt-4o", 
        completion.usage.promptTokens, 
        completion.usage.completionTokens, 
        userId
      );
      data.close();
    },
  } as any);

  return result.toDataStreamResponse({ data });
}
