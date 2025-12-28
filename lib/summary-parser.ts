/**
 * Parser for AI-generated citizen summaries
 * Extracts structured data from the plain text summary format
 */

export interface ParsedSummary {
  topic: string;
  changes: string[];
  impact: string;
}

/**
 * Parses the AI summary text into structured format
 * Expected format:
 * - "Mistä on kyse? [topic]"
 * - "Mikä muuttuu?\n- [change1]\n- [change2]..."
 * - "Vaikutus lompakkoon/arkeen: [impact]"
 */
export function parseSummary(summaryText: string): ParsedSummary {
  const lines = summaryText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  let topic = "";
  const changes: string[] = [];
  let impact = "";

  let currentSection: "topic" | "changes" | "impact" | null = null;

  for (const line of lines) {
    // Detect section headers
    if (line.toLowerCase().startsWith("mistä on kyse?")) {
      currentSection = "topic";
      topic = line.replace(/^mistä on kyse\?/i, "").trim();
      continue;
    }

    if (line.toLowerCase().startsWith("mikä muuttuu?")) {
      currentSection = "changes";
      continue;
    }

    if (line.toLowerCase().includes("vaikutus")) {
      currentSection = "impact";
      impact = line.replace(/^vaikutus[^:]*:\s*/i, "").trim();
      continue;
    }

    // Process content based on current section
    if (currentSection === "topic" && !topic) {
      topic = line;
    } else if (currentSection === "changes") {
      // Remove bullet points and dashes
      const cleanLine = line.replace(/^[-•]\s*/, "").trim();
      if (cleanLine) {
        changes.push(cleanLine);
      }
    } else if (currentSection === "impact" && !impact) {
      impact = line.replace(/^vaikutus[^:]*:\s*/i, "").trim();
    }
  }

  // Fallback: if parsing failed, try to extract from raw text
  if (!topic && !changes.length && !impact) {
    const topicMatch = summaryText.match(/mistä on kyse\?\s*(.+?)(?:\n|$)/i);
    if (topicMatch) {
      topic = topicMatch[1].trim();
    }

    const changesMatch = summaryText.match(/mikä muuttuu\?\s*([\s\S]+?)(?:\nvaikutus|$)/i);
    if (changesMatch) {
      const changesText = changesMatch[1];
      changes.push(
        ...changesText
          .split("\n")
          .map((line) => line.replace(/^[-•]\s*/, "").trim())
          .filter((line) => line.length > 0)
      );
    }

    const impactMatch = summaryText.match(/vaikutus[^:]*:\s*(.+?)(?:\n|$)/i);
    if (impactMatch) {
      impact = impactMatch[1].trim();
    }
  }

  // Ensure we have at least some data
  if (!topic) {
    topic = "Lakiesitys";
  }
  if (changes.length === 0) {
    changes.push("Muutokset käsitellään eduskunnassa.");
  }
  if (!impact) {
    impact = "Vaikutukset riippuvat lain sisällöstä.";
  }

  return { topic, changes, impact };
}

