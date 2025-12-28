"use server";

import { getBillContent } from "@/lib/eduskunta-api";

/**
 * Constructs S3 URL for testing (same logic as in eduskunta-api.ts)
 */
function constructS3Url(parliamentId: string): string {
  let cleanId = parliamentId.trim();
  cleanId = cleanId.replace(/\s+/g, "-");
  cleanId = cleanId.replace(/\//g, "%2B");
  const s3Url = `https://s3-eu-west-1.amazonaws.com/eduskunta-avoindata-documents-prod/vaski%2F${cleanId}.pdf`;
  return s3Url;
}

/**
 * Test bill content fetching
 * Returns detailed information about the fetch process
 */
export async function testBillContentFetch(parliamentId: string) {
  const debug: any = {
    input: parliamentId,
    steps: [],
  };

  try {
    // Step 1: Construct S3 URL
    const s3Url = constructS3Url(parliamentId);
    debug.steps.push({
      step: "S3 URL Construction",
      input: parliamentId,
      output: s3Url,
      success: true,
    });

    // Step 2: Try to fetch from S3
    let httpStatus: number | null = null;
    let contentType: string | null = null;
    let isPdf = false;
    let extractedText: string | null = null;
    let fetchError: string | null = null;

    try {
      const response = await fetch(s3Url, {
        headers: {
          "Accept": "application/pdf, text/html, application/xml",
          "User-Agent": "DirectDem/1.0",
        },
      });

      httpStatus = response.status;
      contentType = response.headers.get("content-type");
      isPdf = contentType?.includes("pdf") || false;

      debug.steps.push({
        step: "S3 Fetch",
        url: s3Url,
        status: httpStatus,
        contentType: contentType,
        isPdf: isPdf,
        success: response.ok,
      });

      if (!response.ok) {
        fetchError = `HTTP ${httpStatus}: ${response.statusText}`;
        debug.steps[debug.steps.length - 1].error = fetchError;
      } else {
        // Check if it's actually a PDF by magic bytes (even if content-type says otherwise)
        const arrayBuffer = await response.arrayBuffer();
        const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
        const pdfMagic = [0x25, 0x50, 0x44, 0x46]; // %PDF
        const isActuallyPdf = firstBytes[0] === pdfMagic[0] && 
                              firstBytes[1] === pdfMagic[1] && 
                              firstBytes[2] === pdfMagic[2] && 
                              firstBytes[3] === pdfMagic[3];
        
        if (isActuallyPdf) {
          isPdf = true;
          debug.steps[debug.steps.length - 1].isPdf = true;
          debug.steps[debug.steps.length - 1].note = "Detected as PDF by magic bytes";
          
          // Step 3: Extract text from PDF
          try {
            const { fetchAndExtractPDF } = await import("@/lib/pdf-extractor");
            extractedText = await fetchAndExtractPDF(s3Url);
            
            debug.steps.push({
              step: "PDF Text Extraction",
              textLength: extractedText.length,
              success: true,
            });
          } catch (pdfError: any) {
            fetchError = `PDF extraction failed: ${pdfError.message}`;
            debug.steps.push({
              step: "PDF Text Extraction",
              success: false,
              error: fetchError,
              stack: pdfError.stack,
            });
          }
        } else {
          // Not a PDF, try to get as text
          extractedText = Buffer.from(arrayBuffer).toString("utf-8");
          debug.steps.push({
            step: "Text Extraction",
            textLength: extractedText.length,
            success: true,
          });
        }
      }
    } catch (fetchErr: any) {
      fetchError = `Fetch error: ${fetchErr.message}`;
      debug.steps.push({
        step: "S3 Fetch",
        url: s3Url,
        success: false,
        error: fetchError,
      });
    }

    // Step 4: Try the actual getBillContent function
    let getBillContentResult: string | null = null;
    let getBillContentError: string | null = null;

    try {
      getBillContentResult = await getBillContent(parliamentId);
      debug.steps.push({
        step: "getBillContent Function",
        result: getBillContentResult ? `Success (${getBillContentResult.length} chars)` : "Returned null",
        success: getBillContentResult !== null,
      });
    } catch (err: any) {
      getBillContentError = err.message;
      debug.steps.push({
        step: "getBillContent Function",
        success: false,
        error: getBillContentError,
      });
    }

    const success = extractedText !== null && extractedText.length > 0;

    return {
      success,
      s3Url,
      httpStatus,
      contentType,
      isPdf,
      textLength: extractedText?.length || 0,
      extractedText: extractedText?.substring(0, 5000) || null, // Limit preview to 5000 chars
      getBillContentResult: getBillContentResult ? `Success (${getBillContentResult.length} chars)` : null,
      error: fetchError || getBillContentError || (success ? null : "Failed to extract text"),
      debug,
    };
  } catch (error: any) {
    return {
      success: false,
      s3Url: constructS3Url(parliamentId),
      error: error.message || "Unknown error",
      debug,
    };
  }
}

