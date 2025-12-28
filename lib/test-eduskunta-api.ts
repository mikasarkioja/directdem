/**
 * Test utility to find the correct Eduskunta API endpoint
 * Run this in browser console or as a server action
 */

export async function testEduskuntaEndpoints() {
  const endpoints = [
    {
      name: "Search Documents (HE)",
      url: "https://avoindata.eduskunta.fi/api/v1/search/documents?type=HE&limit=5",
    },
    {
      name: "Documents (HE)",
      url: "https://avoindata.eduskunta.fi/api/v1/documents?type=HE&limit=5",
    },
    {
      name: "Triplestore Query",
      url: "https://avoindata.eduskunta.fi/api/v1/triplestore/query",
      method: "POST",
      body: {
        query: `
          PREFIX eduskunta: <https://www.eduskunta.fi/>
          SELECT ?doc WHERE {
            ?doc a eduskunta:Asiakirja .
            ?doc eduskunta:tyyppi "HE" .
          } LIMIT 5
        `,
      },
    },
    {
      name: "Tables API",
      url: "https://avoindata.eduskunta.fi/api/v1/tables/eduskunta_asiakirjat?limit=5",
    },
    {
      name: "API Root",
      url: "https://avoindata.eduskunta.fi/api/v1/",
    },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const options: RequestInit = {
        headers: {
          Accept: "application/json",
        },
      };

      if (endpoint.method === "POST" && endpoint.body) {
        options.method = "POST";
        options.headers = {
          ...options.headers,
          "Content-Type": "application/json",
        };
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, options);
      const data = await response.json();

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success: response.ok,
        dataType: Array.isArray(data) ? "array" : typeof data,
        dataKeys: Array.isArray(data)
          ? `Array[${data.length}]`
          : Object.keys(data).slice(0, 5),
        sample: Array.isArray(data) ? data[0] : Object.keys(data).slice(0, 3),
      });
    } catch (error: any) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

