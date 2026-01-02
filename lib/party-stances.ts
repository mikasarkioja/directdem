import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Finnish political parties and their colors/logos
 */
export const PARTY_INFO: Record<string, { name: string; color: string; shortName: string }> = {
  KOK: { name: "Kansallinen Kokoomus", color: "#0066CC", shortName: "KOK" },
  SDP: { name: "Suomen Sosialidemokraattinen Puolue", color: "#E31E24", shortName: "SDP" },
  PS: { name: "Perussuomalaiset", color: "#FFD700", shortName: "PS" },
  KESK: { name: "Suomen Keskusta", color: "#00AA44", shortName: "KESK" },
  VIH: { name: "Vihreät", color: "#61B64A", shortName: "VIH" },
  VAS: { name: "Vasemmistoliitto", color: "#C41E3A", shortName: "VAS" },
  RKP: { name: "Ruotsalainen kansanpuolue", color: "#FFD700", shortName: "RKP" },
  KD: { name: "Kristillisdemokraatit", color: "#0066CC", shortName: "KD" },
  LIIK: { name: "Liike Nyt", color: "#000000", shortName: "LIIK" },
};

/**
 * Government parties (as of 2025) - generally support government proposals
 */
const GOVERNMENT_PARTIES = ["KOK", "PS", "RKP", "KD"];

/**
 * Opposition parties - may have reservations
 */
const OPPOSITION_PARTIES = ["SDP", "KESK", "VIH", "VAS"];

export type PartyStance = "PRO" | "AGAINST" | "ABSTAIN" | "UNKNOWN";

export interface PartyStanceData {
  party: string;
  stance: PartyStance;
  confidence: number; // 0-1
  source?: string; // e.g., "mietintö", "vastalause", "default"
}

export interface PartyStanceResult {
  billId: string;
  parliamentId: string;
  parties: PartyStanceData[];
  hasMietinto: boolean;
  hasVastalause: boolean;
  mietintoUrl?: string;
}

/**
 * Fetches mietintö (Committee Report) documents for a bill
 */
async function fetchMietinto(parliamentId: string): Promise<{ url?: string; content?: string } | null> {
  try {
    // Eduskunta API endpoint for documents
    // Format: https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?filter=Mietintö
    const apiUrl = `https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=50&page=0&languageCode=fi&filter=Mietintö`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[PartyStanceEngine] Failed to fetch mietintö: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const columnNames = data.columnNames || [];
    const rowData = data.rowData || [];

    // Find column indices
    const tunnusIndex = columnNames.indexOf("EduskuntaTunnus");
    const urlIndex = columnNames.indexOf("Url");
    const titleIndex = columnNames.indexOf("NimekeTeksti");

    // Search for mietintö related to this bill
    // Mietintö usually has format like "PeVM 1/2025 vp" for bill "HE 187/2025 vp"
    const billNumber = parliamentId.match(/\d+/)?.[0]; // Extract number from "HE 187/2025 vp"
    
    for (const row of rowData) {
      if (!Array.isArray(row)) continue;
      
      const tunnus = row[tunnusIndex] || "";
      const urlXml = row[urlIndex] || "";
      const titleXml = row[titleIndex] || "";
      
      // Extract URL
      const urlMatch = urlXml.match(/href=["']([^"']+)["']/) || (urlXml.startsWith("http") ? [urlXml] : null);
      const url = urlMatch ? (urlMatch[1] || urlMatch[0]) : null;
      
      // Check if this mietintö is related to our bill
      // Mietintö often references the bill number
      if (tunnus.includes(billNumber || "") || titleXml.includes(billNumber || "")) {
        console.log(`[PartyStanceEngine] Found mietintö for ${parliamentId}: ${tunnus}`);
        
        // Try to fetch the content
        let content: string | undefined;
        if (url) {
          try {
            const contentResponse = await fetch(url, { cache: 'no-store' });
            if (contentResponse.ok) {
              content = await contentResponse.text();
              // Limit content size for AI processing
              if (content.length > 50000) {
                content = content.substring(0, 50000);
              }
            }
          } catch (err) {
            console.warn(`[PartyStanceEngine] Failed to fetch mietintö content:`, err);
          }
        }
        
        return { url: url || undefined, content };
      }
    }

    return null;
  } catch (error) {
    console.error(`[PartyStanceEngine] Error fetching mietintö:`, error);
    return null;
  }
}

/**
 * Uses AI to identify which parties signed reservations (Vastalause) in the mietintö
 */
async function identifyReservations(mietintoText: string): Promise<Record<string, PartyStance>> {
  if (!mietintoText || mietintoText.length < 100) {
    return {};
  }

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[PartyStanceEngine] OPENAI_API_KEY not configured, skipping AI analysis");
      return {};
    }

    const systemPrompt = `Olet asiantuntija, joka analysoi eduskunnan mietintöasiakirjoja. 
Tehtäväsi on tunnistaa, mitkä puolueet ovat allekirjoittaneet vastalauseen (reservation) mietinnössä.

Puolueiden lyhenteet:
- KOK = Kansallinen Kokoomus
- SDP = Suomen Sosialidemokraattinen Puolue  
- PS = Perussuomalaiset
- KESK = Suomen Keskusta
- VIH = Vihreät
- VAS = Vasemmistoliitto
- RKP = Ruotsalainen kansanpuolue
- KD = Kristillisdemokraatit

Vastaa JSON-muodossa:
{
  "parties_with_reservation": ["SDP", "VAS"],
  "reservation_type": "AGAINST" tai "ABSTAIN"
}

Jos et löydä vastalauseita, palauta tyhjä lista.`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini") as any,
      system: systemPrompt,
      prompt: `Analysoi tämä mietintöteksti ja etsi vastalauseet (Vastalause). Kerro mitkä puolueet allekirjoittivat vastalauseen:\n\n${mietintoText.substring(0, 20000)}`,
      temperature: 0.3,
      maxTokens: 500,
    });

    // Parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result: Record<string, PartyStance> = {};
        
        if (parsed.parties_with_reservation && Array.isArray(parsed.parties_with_reservation)) {
          const stance = parsed.reservation_type === "AGAINST" ? "AGAINST" : "ABSTAIN";
          parsed.parties_with_reservation.forEach((party: string) => {
            result[party.toUpperCase()] = stance;
          });
        }
        
        return result;
      }
    } catch (parseError) {
      console.warn("[PartyStanceEngine] Failed to parse AI response:", parseError);
    }

    return {};
  } catch (error) {
    console.error("[PartyStanceEngine] Error identifying reservations:", error);
    return {};
  }
}

/**
 * Main PartyStanceEngine - analyzes party stances for a bill
 */
export async function analyzePartyStances(
  billId: string,
  parliamentId: string
): Promise<PartyStanceResult> {
  console.log(`[PartyStanceEngine] Analyzing stances for ${parliamentId}`);

  // Initialize result with default stances
  const result: PartyStanceResult = {
    billId,
    parliamentId,
    parties: [],
    hasMietinto: false,
    hasVastalause: false,
  };

  // 1. Fetch mietintö
  const mietinto = await fetchMietinto(parliamentId);
  
  if (mietinto) {
    result.hasMietinto = true;
    result.mietintoUrl = mietinto.url;
    
    // 2. Check for reservations if we have content
    let reservations: Record<string, PartyStance> = {};
    if (mietinto.content) {
      // Check if text contains "Vastalause" or "vastalause"
      const hasVastalause = /vastalause/i.test(mietinto.content);
      result.hasVastalause = hasVastalause;
      
      if (hasVastalause) {
        console.log(`[PartyStanceEngine] Found Vastalause in mietintö, analyzing with AI...`);
        reservations = await identifyReservations(mietinto.content);
      }
    }

    // 3. Build party stance data
    const allParties = [...GOVERNMENT_PARTIES, ...OPPOSITION_PARTIES];
    
    for (const party of allParties) {
      let stance: PartyStance = "UNKNOWN";
      let confidence = 0.5;
      let source = "default";

      // Government parties are generally PRO (unless they have a reservation)
      if (GOVERNMENT_PARTIES.includes(party)) {
        if (reservations[party] === "AGAINST") {
          stance = "AGAINST";
          confidence = 0.9;
          source = "vastalause";
        } else {
          stance = "PRO";
          confidence = 0.8;
          source = "mietintö";
        }
      } else {
        // Opposition parties - check for reservations
        if (reservations[party] === "AGAINST") {
          stance = "AGAINST";
          confidence = 0.9;
          source = "vastalause";
        } else if (reservations[party] === "ABSTAIN") {
          stance = "ABSTAIN";
          confidence = 0.8;
          source = "vastalause";
        } else {
          // Opposition without explicit reservation - default to ABSTAIN
          stance = "ABSTAIN";
          confidence = 0.6;
          source = "default";
        }
      }

      result.parties.push({
        party,
        stance,
        confidence,
        source,
      });
    }
  } else {
    // No mietintö found - use default stances
    console.log(`[PartyStanceEngine] No mietintö found for ${parliamentId}, using defaults`);
    
    const allParties = [...GOVERNMENT_PARTIES, ...OPPOSITION_PARTIES];
    for (const party of allParties) {
      result.parties.push({
        party,
        stance: GOVERNMENT_PARTIES.includes(party) ? "PRO" : "ABSTAIN",
        confidence: 0.5,
        source: "default",
      });
    }
  }

  return result;
}


