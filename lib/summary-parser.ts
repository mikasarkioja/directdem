/**
 * Parser for AI-generated citizen summaries
 * Extracts structured data from the plain text summary format
 */

export interface ParsedSummary {
  topic: string;
  changes: string[];
  impact: string;
  socialImpact?: string;
  economicImpact?: string;
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
      // Try to clean up header prefixes like "### 4. Vaikutus lompakkoon ja arkeen"
      impact = line.replace(/^[#\s\d.]*vaikutus[^:]*:\s*/i, "").trim();
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
    } else if (currentSection === "impact") {
      const cleanLine = line.replace(/^[#\s\d.]*vaikutus[^:]*:\s*/i, "").trim();
      if (cleanLine) {
        if (!impact) {
          impact = cleanLine;
        } else {
          impact += " " + cleanLine;
        }
      }
    }
  }

  // Final cleanup and sentence splitting for social/economic impact
  let socialImpact = "";
  let economicImpact = "";

  if (impact) {
    // Try to split by common markers or just take first two sentences
    const sentences = impact.split(/[.!?]\s+/).filter(s => s.length > 0);
    
    // Look for keywords
    const socialKeywords = ["yhteiskun", "kansala", "ihmis", "arjen", "palvelu"];
    const economicKeywords = ["lompakko", "euro", "raha", "talou", "kustan", "hinta", "vero"];

    socialImpact = sentences.find(s => socialKeywords.some(k => s.toLowerCase().includes(k))) || sentences[0] || "";
    economicImpact = sentences.find(s => economicKeywords.some(k => s.toLowerCase().includes(k))) || sentences[1] || "";
    
    // Fallback if we couldn't find distinct ones
    if (socialImpact === economicImpact && sentences.length > 1) {
      economicImpact = sentences[1];
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

  return { 
    topic, 
    changes, 
    impact,
    socialImpact: socialImpact.trim() + (socialImpact.endsWith(".") ? "" : "."),
    economicImpact: economicImpact.trim() + (economicImpact.endsWith(".") ? "" : ".")
  };
}

