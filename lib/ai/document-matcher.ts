import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * lib/ai/document-matcher.ts
 * Advanced textual comparison for academic research.
 */

interface DocumentMatchResult {
  similarity: number; // 0-1
  influence_points: string[];
  divergence_score: number;
}

/**
 * Compares two texts (e.g., Bill vs Expert Opinion) to identify influence.
 */
export async function compareDocuments(
  originalText: string,
  comparisonText: string
): Promise<DocumentMatchResult> {
  // In a real academic tool, we would use embeddings and cosine similarity.
  // Here we use GPT-4o to perform a structured semantic comparison.
  
  const response = await generateText({
    model: openai("gpt-4o"),
    system: `Olet akateeminen tekstianalyytikko. Vertaa kahta poliittista tekstiä (Laki vs Asiantuntijalausunto).
    Analysoi:
    1. Semanttinen samankaltaisuus (0.0 - 1.0).
    2. Kohdat, joissa lausunto on selkeästi vaikuttanut lain sanamuotoon tai sisältöön.
    3. Kohdat, joissa tekstit eroavat toisistaan merkittävästi.
    
    Palauta JSON-muodossa:
    {
      "similarity": number,
      "influence_points": string[],
      "divergence_score": number
    }`,
    prompt: `TEKSTI 1 (Laki): ${originalText.substring(0, 5000)}\n\nTEKSTI 2 (Lausunto): ${comparisonText.substring(0, 5000)}`,
  } as any);

  try {
    const result = JSON.parse(response.text.replace(/```json|```/g, ""));
    return result;
  } catch (e) {
    console.error("Failed to parse document match result", e);
    return { similarity: 0, influence_points: [], divergence_score: 0 };
  }
}

/**
 * Calculates a 'Loyalty Score' for an MP based on their votes vs party majority.
 */
export function calculateLoyaltyScore(
  mpVotes: { bill_id: string; position: string }[],
  partyMajorityVotes: Record<string, string> // bill_id -> 'for'|'against'
): number {
  if (mpVotes.length === 0) return 100;

  let matches = 0;
  mpVotes.forEach(vote => {
    if (partyMajorityVotes[vote.bill_id] === vote.position) {
      matches++;
    }
  });

  return Math.round((matches / mpVotes.length) * 100);
}

