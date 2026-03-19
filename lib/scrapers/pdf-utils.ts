import pdfParse from "pdf-parse";

function cleanExtractedText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .trim();
}

/**
 * Hakee PDF-tiedoston URL:sta ja purkaa tekstisisällön.
 *
 * Integraatioesimerkki:
 * - `lib/scrapers/espoo-lobby-check.ts` voi kutsua tätä lausunto-PDF:ille:
 *   `const statementText = await extractTextFromPdf(pdfUrl);`
 * - Vertaa palautettua tekstiä esityslistan/päätöksen tekstiin similarity-logiikalla.
 */
export async function extractTextFromPdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return `Virhe PDF-haussa: HTTP ${response.status}`;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await pdfParse(buffer);
    const cleanedText = cleanExtractedText(parsed.text || "");
    const pages = Math.max(1, parsed.numpages || 1);

    // Heuristiikka: jos tekstiä on hyvin vähän per sivu, kyse on usein skannatusta kuva-PDF:stä.
    const charsPerPage = cleanedText.length / pages;
    if (!cleanedText || charsPerPage < 40) {
      return "Skannattu PDF - vaatii OCR-käsittelyn";
    }

    return cleanedText;
  } catch (error: any) {
    const message = String(error?.message || "");
    if (/password|encrypted|cipher|decrypt/i.test(message)) {
      return "Virhe: PDF on suojattu salasanalla eikä tekstiä voitu purkaa.";
    }
    if (/invalid|corrupt|malformed|format|xref/i.test(message)) {
      return "Virhe: PDF on korruptoitunut tai rakenteeltaan virheellinen.";
    }
    return `Virhe PDF-tekstin purussa: ${message || "Tuntematon virhe"}`;
  }
}
