"use server";

/**
 * Server-side test for Eduskunta API
 * This bypasses CORS restrictions
 */

export interface TestResult {
  name: string;
  url: string;
  status: number;
  statusText: string;
  success: boolean;
  data?: any;
  error?: string;
  contentType?: string;
}

export async function testEduskuntaAPI(): Promise<TestResult[]> {
  const endpoints = [
    {
      name: "✅ Government Proposals (Working Endpoint)",
      url: "https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=5&page=0&languageCode=fi&filter=Hallituksen+esitys",
    },
    {
      name: "API Root (Optional - May not exist)",
      url: "https://avoindata.eduskunta.fi/api/v1/",
    },
    {
      name: "Search Documents (HE) (Alternative - May not exist)",
      url: "https://avoindata.eduskunta.fi/api/v1/search/documents?type=HE&limit=5",
    },
    {
      name: "Documents (HE) (Alternative - May not exist)",
      url: "https://avoindata.eduskunta.fi/api/v1/documents?type=HE&limit=5",
    },
  ];

  const results: TestResult[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "DirectDem/1.0",
        },
        // Server-side fetch doesn't have CORS restrictions
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          const text = await response.text();
          data = { raw: text.substring(0, 1000) };
        }
      } else {
        const text = await response.text();
        data = { raw: text.substring(0, 1000), contentType };
      }

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        data: data,
        contentType: contentType || undefined,
      });
    } catch (error: any) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 0,
        statusText: "Network Error",
        success: false,
        error: error.message || "Unknown error",
      });
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
}

