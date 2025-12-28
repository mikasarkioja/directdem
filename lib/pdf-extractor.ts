/**
 * PDF Text Extraction Utility
 * 
 * Note: pdf-parse requires Node.js and cannot run in the browser.
 * This should only be used in server-side code (API routes, server actions).
 */

/**
 * Extracts text from a PDF buffer
 * @param pdfBuffer - The PDF file as a Buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid bundling in client code
    const pdfParse = await import("pdf-parse");
    const data = await pdfParse.default(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error("Failed to extract text from PDF:", error);
    throw new Error("PDF text extraction failed");
  }
}

/**
 * Fetches a PDF from a URL and extracts its text
 * @param pdfUrl - URL to the PDF file
 * @returns Extracted text content
 */
export async function fetchAndExtractPDF(pdfUrl: string): Promise<string> {
  try {
    const response = await fetch(pdfUrl, {
      cache: 'no-store', // Don't cache large PDFs (Next.js can't cache > 2MB)
      headers: {
        "User-Agent": "DirectDem/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Verify it's actually a PDF by checking magic bytes
    const firstBytes = new Uint8Array(buffer.slice(0, 4));
    const pdfMagic = [0x25, 0x50, 0x44, 0x46]; // %PDF
    const isPdf = firstBytes[0] === pdfMagic[0] && 
                  firstBytes[1] === pdfMagic[1] && 
                  firstBytes[2] === pdfMagic[2] && 
                  firstBytes[3] === pdfMagic[3];
    
    if (!isPdf) {
      throw new Error("File does not appear to be a valid PDF (missing PDF magic bytes)");
    }
    
    console.log(`[fetchAndExtractPDF] Extracting text from PDF (${buffer.length} bytes, ${Math.round(buffer.length / 1024 / 1024)}MB)`);
    
    try {
      const extractedText = await extractTextFromPDF(buffer);
      console.log(`[fetchAndExtractPDF] Successfully extracted ${extractedText.length} characters from PDF`);
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error(`Extracted text is too short: ${extractedText?.length || 0} characters. The PDF might be image-based or corrupted.`);
      }
      
      return extractedText;
    } catch (error: any) {
      console.error(`[fetchAndExtractPDF] PDF extraction failed:`, error);
      throw new Error(`Failed to extract text from PDF: ${error.message || "Unknown error"}. The PDF might be too large, corrupted, or image-based.`);
    }
  } catch (error) {
    console.error(`Failed to fetch and extract PDF from ${pdfUrl}:`, error);
    throw error;
  }
}

