/**
 * Eduskunta (Finnish Parliament) API Fetcher
 * 
 * Fetches Government Proposals (Hallituksen esitykset - HE) from the
 * Finnish Parliament's open data API.
 * 
 * API Documentation: https://avoindata.eduskunta.fi/
 */

export interface EduskuntaIssue {
  id: string;
  title: string;
  abstract: string;
  parliamentId: string; // e.g., "HE 123/2024"
  status: "pending" | "active" | "passed" | "rejected";
  category?: string;
  publishedDate?: string;
  url?: string;
}

/**
 * Maps Eduskunta API status to our internal status format
 */
function mapStatus(eduskuntaStatus: string): "pending" | "active" | "passed" | "rejected" {
  const statusLower = eduskuntaStatus?.toLowerCase() || "";
  
  if (statusLower.includes("hyväksytty") || statusLower.includes("passed")) {
    return "passed";
  }
  if (statusLower.includes("hylätty") || statusLower.includes("rejected")) {
    return "rejected";
  }
  if (statusLower.includes("käsittelyssä") || statusLower.includes("active") || statusLower.includes("pending")) {
    return "active";
  }
  
  return "pending";
}

/**
 * Fetches the latest Government Proposals (Hallituksen esitykset)
 * and maps them to our internal "Issue" schema.
 * 
 * @param limit - Number of bills to fetch (default: 10)
 * @returns Array of Eduskunta issues
 */
/**
 * Extracts text from XML-like string
 */
function extractTextFromXML(xmlString: string): string {
  if (!xmlString) return "";
  
  // Check if it looks like XML/HTML
  if (xmlString.includes("<") && xmlString.includes(">")) {
    // Robust way to remove all HTML/XML tags
    // 1. Try to find content between tags first (often most accurate for single-wrapped values)
    const textMatch = xmlString.match(/>([^<]+)</);
    if (textMatch && textMatch[1].trim()) {
      return textMatch[1].trim();
    }
    
    // 2. Fallback: Strip all tags
    return xmlString.replace(/<[^>]*>/g, '').trim();
  }
  
  return xmlString.trim();
}

/**
 * Extracts URL from XML-like string or returns the string if it's already a URL
 */
function extractUrl(urlString: string): string {
  if (!urlString) return "";
  
  // Clean string from whitespace
  const input = urlString.trim();
  
  // Check if it's already a URL
  if (input.startsWith("http")) {
    return input;
  }
  
  // Try to extract from XML href attribute
  // Handles: href="url", href='url', href=url
  const urlMatch = input.match(/href=["']?([^"'\s>]+)["']?/i);
  if (urlMatch && urlMatch[1]) {
    const extracted = urlMatch[1].trim();
    // Only return if it looks like a valid URL or path
    if (extracted && (extracted.startsWith("http") || extracted.length > 5)) {
      return extracted;
    }
  }
  
  // If it's a naked URL inside tags like <url>http://...</url>
  const tagMatch = input.match(/>(https?:\/\/[^<]+)</i);
  if (tagMatch && tagMatch[1]) {
    return tagMatch[1].trim();
  }
  
  // Return empty string if no valid URL found, rather than returning invalid HTML
  return "";
}

export async function getLatestBills(limit: number = 10): Promise<EduskuntaIssue[]> {
  try {
    // Correct Eduskunta API endpoint for Government Proposals
    // Reference: https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi
    const apiUrl = `https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=${limit}&page=0&languageCode=fi&filter=Hallituksen+esitys`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Eduskunta API unreachable: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // The API returns data in a table format with columnNames and rowData
    // Column order: Id, EduskuntaTunnus, Päivämäärä, NimekeTeksti, AsiakirjatyyppiNimi, Url, Data, Kielikoodi
    const columnNames = data.columnNames || [];
    const rowData = data.rowData || [];

    if (!Array.isArray(rowData) || rowData.length === 0) {
      console.warn("Eduskunta API returned no data");
      return [];
    }

    // Find column indices
    const idIndex = columnNames.indexOf("Id");
    const tunnusIndex = columnNames.indexOf("EduskuntaTunnus");
    const dateIndex = columnNames.indexOf("Päivämäärä");
    const titleIndex = columnNames.indexOf("NimekeTeksti");
    const urlIndex = columnNames.indexOf("Url");

    // Map rows to our structure
    const issues: EduskuntaIssue[] = [];

    for (const row of rowData) {
      if (!Array.isArray(row) || row.length === 0) continue;

      const id = row[idIndex] || "";
      const parliamentIdRaw = row[tunnusIndex] || "";
      const date = row[dateIndex] || "";
      const titleXml = row[titleIndex] || "";
      const urlXml = row[urlIndex] || "";

      // Extract clean text from XML
      const title = extractTextFromXML(titleXml);
      const url = extractUrl(urlXml);
      const cleanParliamentIdRaw = extractTextFromXML(parliamentIdRaw);

      // Skip if we don't have essential data
      if (!title && !cleanParliamentIdRaw) continue;

      // Parse parliament ID (e.g., "HE 196/2025 vp" -> "HE 196/2025")
      const cleanParliamentId = cleanParliamentIdRaw.split(",")[0].trim();

      issues.push({
        id: id || cleanParliamentId || `he-${Date.now()}-${Math.random()}`,
        parliamentId: cleanParliamentId,
        title: title || "Nimetön esitys",
        abstract: title, // Use title as abstract for now (can be enhanced later)
        status: "active", // Default to active, can be enhanced with status detection
        category: "Hallituksen esitys",
        publishedDate: date,
        url: url,
      });
    }

    return issues;
  } catch (error) {
    console.warn("Failed to fetch Eduskunta data:", error);
    console.warn("Falling back to empty array.");
    
    // Return empty array on error to prevent app crashes
    return [];
  }
}

/**
 * Constructs S3 URL for Eduskunta documents
 * Pattern: https://s3-eu-west-1.amazonaws.com/eduskunta-avoindata-documents-prod/vaski%2F{parliament-id}.pdf
 * Example: "HE 193/2025 vp" -> "HE-193%2B2025-vp"
 * 
 * Based on actual URL: https://s3-eu-west-1.amazonaws.com/eduskunta-avoindata-documents-prod/vaski%2FHE-193%2B2025-vp.pdf
 */
function constructS3Url(parliamentId: string): string {
  // Clean the parliament ID: "HE 193/2025 vp" -> "HE-193%2B2025-vp"
  let cleanId = parliamentId.trim();
  
  // Replace spaces with dashes
  cleanId = cleanId.replace(/\s+/g, "-");
  
  // URL encode the forward slash in the date part as %2B (not %2F)
  // Example: "HE-193/2025-vp" -> "HE-193%2B2025-vp"
  cleanId = cleanId.replace(/\//g, "%2B");
  
  // Construct the S3 URL
  // Note: vaski%2F is URL-encoded "vaski/"
  const s3Url = `https://s3-eu-west-1.amazonaws.com/eduskunta-avoindata-documents-prod/vaski%2F${cleanId}.pdf`;
  
  return s3Url;
}

/**
 * Fetches the full content/document of a bill by its document ID or URL
 * 
 * @param documentIdOrUrlRaw - The document ID from Eduskunta API (e.g., "HE 193/2025 vp") or a direct URL
 * @returns The full HTML/XML/PDF content of the bill or null if not found
 */
export async function getBillContent(documentIdOrUrlRaw: string): Promise<string | null> {
  if (!documentIdOrUrlRaw) return null;

  // Clean input - if it's HTML, try to get a URL first, then fall back to text content
  let documentIdOrUrl = documentIdOrUrlRaw.trim();
  if (documentIdOrUrl.includes("<") && documentIdOrUrl.includes(">")) {
    const extractedUrl = extractUrl(documentIdOrUrl);
    if (extractedUrl) {
      documentIdOrUrl = extractedUrl;
    } else {
      documentIdOrUrl = extractTextFromXML(documentIdOrUrl);
    }
  }
  
  if (!documentIdOrUrl) {
    console.warn(`[getBillContent] Could not extract valid ID or URL from: ${documentIdOrUrlRaw}`);
    return null;
  }

  console.log(`[getBillContent] Starting fetch for: ${documentIdOrUrl}`);
  
  try {
    // If it's already a URL, try fetching it directly first
    if (documentIdOrUrl.startsWith("http")) {
      try {
        console.log(`[getBillContent] Attempting direct URL fetch: ${documentIdOrUrl}`);
        const response = await fetch(documentIdOrUrl, {
          cache: 'no-store', // Don't cache large files
          headers: {
            "Accept": "text/html, application/xml, application/pdf, text/plain",
            "User-Agent": "DirectDem/1.0",
          },
        });

        console.log(`[getBillContent] Direct fetch response: ${response.status} ${response.statusText}, OK: ${response.ok}`);

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          console.log(`[getBillContent] Content-Type: ${contentType}`);
          
          if (contentType?.includes("text") || contentType?.includes("xml") || contentType?.includes("html")) {
            const text = await response.text();
            console.log(`[getBillContent] Got text content: ${text.length} characters`);
            if (text && text.length > 100) {
              return text;
            }
          }
          
          // For PDFs, use PDF extractor
          if (contentType?.includes("pdf") || documentIdOrUrl.endsWith(".pdf")) {
            console.log(`[getBillContent] Document is a PDF, extracting text: ${documentIdOrUrl}`);
            console.log(`[getBillContent] This may take 30-60 seconds for large PDFs...`);
            try {
              const { fetchAndExtractPDF } = await import("./pdf-extractor");
              const text = await fetchAndExtractPDF(documentIdOrUrl);
              console.log(`[getBillContent] Successfully extracted ${text.length} characters from PDF`);
              if (text && text.length > 100) {
                return text;
              } else {
                console.warn(`[getBillContent] Extracted text is too short: ${text?.length || 0} characters`);
              }
            } catch (pdfError: any) {
              console.error(`[getBillContent] Failed to extract PDF text: ${pdfError.message}`, pdfError);
              console.error(`[getBillContent] PDF extraction error details:`, {
                message: pdfError.message,
                stack: pdfError.stack,
                name: pdfError.name
              });
              // Return null so caller knows extraction failed
              return null;
            }
          }
        } else {
          console.warn(`[getBillContent] Direct URL fetch failed: ${response.status} ${response.statusText}`);
        }
      } catch (err: any) {
        console.error(`[getBillContent] Exception during direct URL fetch: ${err.message}`, err);
        // Continue to try other methods
      }
    }

    // Try S3 URL pattern (most reliable for Eduskunta documents)
    // Extract parliament ID from URL if it's an S3 URL, or use it directly if it's already an ID
    let parliamentId: string | null = null;
    
    if (!documentIdOrUrl.startsWith("http")) {
      // It's already a parliament ID
      parliamentId = documentIdOrUrl;
    } else if (documentIdOrUrl.includes("vaski%2F")) {
      // It's an S3 URL, extract the parliament ID
      const s3Match = documentIdOrUrl.match(/vaski%2F([^/]+)\.pdf/);
      if (s3Match) {
        // Decode: HE-187%2B2025-vp -> HE-187/2025-vp -> HE 187/2025 vp
        parliamentId = s3Match[1].replace(/%2B/g, "/").replace(/-/g, " ");
        console.log(`[getBillContent] Extracted parliament ID from S3 URL: ${parliamentId}`);
      }
    }
    
    // If we have a parliament ID, try constructing and fetching the S3 URL
    // (This will be the same URL if it was already an S3 URL, but we'll try with better error handling)
    if (parliamentId) {
      const s3Url = constructS3Url(parliamentId);
      console.log(`[getBillContent] Trying S3 URL: ${s3Url}`);
      
      try {
        // Disable caching for PDFs (they're often > 2MB and Next.js can't cache them)
        // Use cache: 'no-store' to prevent Next.js from trying to cache large files
        console.log(`[getBillContent] Attempting S3 fetch for: ${s3Url}`);
        const response = await fetch(s3Url, {
          cache: 'no-store', // Don't cache large PDFs
          headers: {
            "Accept": "application/pdf, text/html, application/xml",
            "User-Agent": "DirectDem/1.0",
          },
        });

        console.log(`[getBillContent] S3 fetch completed. Status: ${response.status} ${response.statusText}, OK: ${response.ok}`);

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          const contentLength = response.headers.get("content-length");
          console.log(`[getBillContent] Response OK. Content-Type: ${contentType}, Content-Length: ${contentLength}`);
          
          // For PDFs, we should use fetchAndExtractPDF directly instead of reading the arrayBuffer here
          // This avoids loading the entire PDF into memory twice
          if (contentType?.includes("pdf") || s3Url.endsWith(".pdf")) {
            console.log(`[getBillContent] Detected PDF, using fetchAndExtractPDF for ${s3Url}`);
            try {
              const { fetchAndExtractPDF } = await import("./pdf-extractor");
              const text = await fetchAndExtractPDF(s3Url);
              console.log(`[getBillContent] Successfully extracted ${text.length} characters from PDF`);
              
              if (!text || text.length < 100) {
                console.warn(`[getBillContent] Extracted text is too short: ${text?.length || 0} characters`);
                return null;
              }
              
              return text;
            } catch (pdfError: any) {
              console.error(`[getBillContent] Failed to extract PDF text: ${pdfError.message}`, pdfError);
              console.error(`[getBillContent] PDF error stack:`, pdfError.stack);
              return null;
            }
          }
          
          // For non-PDF content, read the response
          // Always check magic bytes to be sure (content-type can be misleading)
          const arrayBuffer = await response.arrayBuffer();
          const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
          const pdfMagic = [0x25, 0x50, 0x44, 0x46]; // %PDF
          const isPdfByMagicBytes = firstBytes[0] === pdfMagic[0] && 
                                   firstBytes[1] === pdfMagic[1] && 
                                   firstBytes[2] === pdfMagic[2] && 
                                   firstBytes[3] === pdfMagic[3];
          
          const isPdfByContentType = contentType?.includes("pdf") || false;
          const isPdf = isPdfByContentType || isPdfByMagicBytes;
          
          console.log(`[getBillContent] PDF detection - Content-Type: ${isPdfByContentType}, Magic Bytes: ${isPdfByMagicBytes}, Final: ${isPdf}`);
          
          // If it's actually a PDF (detected by magic bytes), use PDF extractor
          if (isPdf) {
            console.log(`[getBillContent] Found PDF by magic bytes at S3 URL: ${s3Url}`);
            try {
              const { fetchAndExtractPDF } = await import("./pdf-extractor");
              const text = await fetchAndExtractPDF(s3Url);
              console.log(`[getBillContent] Successfully extracted ${text.length} characters from PDF`);
              
              if (!text || text.length < 100) {
                console.warn(`[getBillContent] Extracted text is too short: ${text?.length || 0} characters`);
                return null;
              }
              
              return text;
            } catch (pdfError: any) {
              console.error(`[getBillContent] Failed to extract PDF text: ${pdfError.message}`, pdfError);
              return null;
            }
          }
          
          // If it's text/HTML/XML, return it
          if (contentType?.includes("text") || contentType?.includes("xml") || contentType?.includes("html")) {
            const text = Buffer.from(arrayBuffer).toString("utf-8");
            console.log(`[getBillContent] Returning text content: ${text.length} characters`);
            return text;
          }
          
          // If we got here and it's not a PDF, log a warning
          console.warn(`[getBillContent] Unexpected content type: ${contentType} for URL: ${s3Url}. First bytes: ${Array.from(firstBytes).map(b => `0x${b.toString(16)}`).join(" ")}`);
        } else {
          console.warn(`[getBillContent] Response not OK: ${response.status} ${response.statusText} for URL: ${s3Url}`);
          const errorText = await response.text().catch(() => "Could not read error response");
          console.warn(`[getBillContent] Error response body (first 500 chars): ${errorText.substring(0, 500)}`);
        }
      } catch (err: any) {
        console.error(`[getBillContent] Exception fetching from S3 URL ${s3Url}:`, err);
        console.error(`[getBillContent] Error message: ${err.message}`);
        console.error(`[getBillContent] Error stack:`, err.stack);
      }
    }

    // Try to get the bill data first to extract the URL
    const billData = await getLatestBills(50); // Fetch more to find our bill
    const matchingBill = billData.find(
      (bill) => bill.parliamentId === documentIdOrUrl || bill.parliamentId.includes(documentIdOrUrl.split(" ")[0])
    );

    if (matchingBill?.url) {
      try {
        console.log(`[getBillContent] Trying to fetch from bill URL: ${matchingBill.url}`);
        const response = await fetch(matchingBill.url, {
          cache: 'no-store', // Don't cache large files
          headers: {
            "Accept": "text/html, application/xml, application/pdf, text/plain",
            "User-Agent": "DirectDem/1.0",
          },
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("text") || contentType?.includes("xml") || contentType?.includes("html")) {
            return await response.text();
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch from bill URL ${matchingBill.url}:`, err);
      }
    }

    // Try multiple possible endpoints for fetching document content
    const endpoints = [
      // Try using parliament ID format in VaskiData table
      `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?columnName=EduskuntaTunnus&columnValue=${encodeURIComponent(documentIdOrUrl)}`,
      // Try with cleaned parliament ID (remove "vp" suffix)
      `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?columnName=EduskuntaTunnus&columnValue=${encodeURIComponent(documentIdOrUrl.replace(/\s+vp$/i, ""))}`,
      // Try using the document ID directly
      `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?columnName=Id&columnValue=${encodeURIComponent(documentIdOrUrl)}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          cache: 'no-store', // Don't cache to avoid issues with large responses
          headers: {
            "Accept": "application/json, text/html, application/xml",
            "User-Agent": "DirectDem/1.0",
          },
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          
          // If it's HTML/XML, return as text
          if (contentType?.includes("text/html") || contentType?.includes("application/xml") || contentType?.includes("text/xml")) {
            return await response.text();
          }

          // If it's JSON, try to extract content
          if (contentType?.includes("application/json")) {
            const data = await response.json();
            
            // Try to find content in various possible structures
            const content = 
              data.content || 
              data.html || 
              data.xml || 
              data.text || 
              data.body ||
              (data.Data && (Array.isArray(data.Data) ? data.Data[0] : data.Data)) ||
              (data.rowData && data.rowData[0] && data.rowData[0][data.columnNames?.indexOf("Data")]) ||
              null;

            if (content) {
              return typeof content === "string" ? content : JSON.stringify(content);
            }

            // If we have a URL to the document, try fetching it
            const docUrl = data.url || data.Url || (data.rowData && data.rowData[0] && data.rowData[0][data.columnNames?.indexOf("Url")]);
            if (docUrl && typeof docUrl === "string" && docUrl.startsWith("http")) {
              const urlResponse = await fetch(docUrl, {
                cache: 'no-store', // Don't cache large files
                headers: { 
                  "Accept": "text/html, application/xml, application/pdf, text/plain",
                  "User-Agent": "DirectDem/1.0",
                },
              });
              if (urlResponse.ok) {
                const urlContentType = urlResponse.headers.get("content-type");
                if (urlContentType?.includes("text") || urlContentType?.includes("xml") || urlContentType?.includes("html")) {
                  return await urlResponse.text();
                }
              }
            }
          }
        }
      } catch (err) {
        // Try next endpoint
        continue;
      }
    }

    console.warn(`[getBillContent] Could not fetch content for ${documentIdOrUrl} from any endpoint`);
    return null;
  } catch (error) {
    console.error(`Failed to fetch bill content for ${documentIdOrUrl}:`, error);
    return null;
  }
}

/**
 * Fetches a single bill by its Parliament ID (e.g., "HE 123/2024")
 * 
 * @param parliamentId - The Parliament document ID
 * @returns The bill issue or null if not found
 */
export async function getBillById(parliamentId: string): Promise<EduskuntaIssue | null> {
  try {
    const response = await fetch(
      `https://avoindata.eduskunta.fi/api/v1/documents/${encodeURIComponent(parliamentId)}`,
      {
        next: { revalidate: 3600 },
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch bill: ${response.status}`);
    }

    const item = await response.json();

    return {
      id: extractTextFromXML(item.id || parliamentId),
      parliamentId: extractTextFromXML(item.documentId || parliamentId),
      title: extractTextFromXML(item.titleFi || item.title || "Nimetön esitys"),
      abstract: extractTextFromXML(item.abstractFi || item.abstract || "Tiivistelmä ei saatavilla."),
      status: mapStatus(extractTextFromXML(item.stage || item.status || "")),
      category: extractTextFromXML(item.subjectArea || "Yleinen"),
      publishedDate: extractTextFromXML(item.publishedDate || ""),
      url: extractUrl(item.url || ""),
    };
  } catch (error) {
    console.error(`Failed to fetch bill ${parliamentId}:`, error);
    return null;
  }
}

