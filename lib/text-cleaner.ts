/**
 * Utility functions for cleaning and extracting text from HTML/XML documents
 */

/**
 * Strips HTML/XML tags and extracts plain text
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";

  // Remove XML/HTML tags
  let text = html.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Clean up whitespace
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  return text;
}

/**
 * Extracts specific sections from bill text
 * Looks for common Finnish bill sections like 'sisältö', 'perustelut', 'pääasiallinen sisältö'
 */
export function extractBillSections(text: string): {
  mainContent?: string;
  rationale?: string;
  fullText: string;
} {
  if (!text) return { fullText: "" };

  const lowerText = text.toLowerCase();

  // Try to find "Esityksen pääasiallinen sisältö" or similar sections
  const mainContentPatterns = [
    /esityksen\s+pääasiallinen\s+sisältö[:\s]*([\s\S]*?)(?=esityksen\s+perustelut|esityksen\s+vaikutukset|$)/i,
    /pääasiallinen\s+sisältö[:\s]*([\s\S]*?)(?=perustelut|vaikutukset|$)/i,
    /sisältö[:\s]*([\s\S]*?)(?=perustelut|vaikutukset|$)/i,
  ];

  let mainContent: string | undefined;
  for (const pattern of mainContentPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      mainContent = stripHtmlTags(match[1]).trim();
      if (mainContent.length > 500) {
        // Found substantial content
        break;
      }
    }
  }

  // Try to find "Perustelut" section
  const rationalePatterns = [
    /esityksen\s+perustelut[:\s]*([\s\S]*?)(?=esityksen\s+vaikutukset|$)/i,
    /perustelut[:\s]*([\s\S]*?)(?=vaikutukset|$)/i,
  ];

  let rationale: string | undefined;
  for (const pattern of rationalePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      rationale = stripHtmlTags(match[1]).trim();
      break;
    }
  }

  return {
    mainContent,
    rationale,
    fullText: stripHtmlTags(text),
  };
}

/**
 * Truncates text to a maximum length, trying to preserve sentence boundaries
 */
export function truncateText(text: string, maxLength: number = 20000): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Try to cut at a sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");

  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxLength * 0.8) {
    // Good cut point found (not too early)
    return truncated.substring(0, cutPoint + 1) + "\n\n[... teksti lyhennetty ...]";
  }

  // Fallback: just cut and add ellipsis
  return truncated + "\n\n[... teksti lyhennetty ...]";
}

/**
 * Prepares bill text for AI processing
 * Extracts main content, truncates if needed, and cleans the text
 */
export function prepareBillTextForAI(rawText: string): string {
  if (!rawText) return "";

  // Extract sections
  const sections = extractBillSections(rawText);

  // Prefer main content section if available and substantial
  let textToProcess = sections.mainContent || sections.fullText;

  // If main content is too short, use full text
  if (textToProcess.length < 500 && sections.fullText.length > textToProcess.length) {
    textToProcess = sections.fullText;
  }

  // If we still have very little text, try to extract more from the raw text
  // This handles cases where section extraction didn't work well
  if (textToProcess.length < 200) {
    // Try a more aggressive cleaning of the raw text
    const aggressiveClean = stripHtmlTags(rawText)
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
    
    if (aggressiveClean.length > textToProcess.length) {
      textToProcess = aggressiveClean;
    }
  }

  // Truncate if too long (to save on AI tokens)
  textToProcess = truncateText(textToProcess, 20000);

  return textToProcess;
}

