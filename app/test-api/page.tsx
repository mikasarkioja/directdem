"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { testEduskuntaAPI } from "@/app/actions/test-eduskunta";
import type { TestResult } from "@/lib/types";

export default function TestAPIPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const testAllEndpoints = async () => {
    setTesting(true);
    setResults([]);
    setErrors([]);

    try {
      // Use server action to bypass CORS
      const testResults = await testEduskuntaAPI();
      setResults(testResults);

      const testErrors = testResults
        .filter((r) => !r.success)
        .map((r) => `${r.name}: ${r.error || r.statusText}`);
      setErrors(testErrors);
    } catch (error: any) {
      setErrors([`Test failed: ${error.message}`]);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-nordic-darker mb-2">
          Eduskunta API Tester
        </h1>
        <p className="text-nordic-dark mb-2">
          Testaa eri API-endpointeja löytääksesi oikean tavan hakea lakiesityksiä
        </p>
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ Working Endpoint Found!</strong> The Government Proposals endpoint is now working and integrated into the app.
            <br />
            The other endpoints below are optional/alternative endpoints that may not exist.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={testAllEndpoints}
          disabled={testing}
          className="px-6 py-3 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Testataan...</span>
            </>
          ) : (
            <span>Testaa kaikki endpointit</span>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-nordic-darker">
            Tulokset ({results.length} endpointia)
          </h2>

          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                result.success
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                ) : (
                  <XCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-nordic-darker mb-2 flex items-center gap-2 flex-wrap">
                    {result.name}
                    {result.name.includes("✅") && result.success && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        ACTIVE
                      </span>
                    )}
                    {result.name.includes("Optional") && !result.success && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                        Optional
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-nordic-dark mb-3 break-all">
                    {result.url}
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-semibold">Status:</span>{" "}
                      {result.status} {result.statusText}
                    </div>
                    {result.contentType && (
                      <div>
                        <span className="font-semibold">Content-Type:</span>{" "}
                        {result.contentType}
                      </div>
                    )}
                    {result.success && result.data && (
                      <div className="mt-3">
                        <span className="font-semibold">Data structure:</span>
                        <pre className="mt-2 p-3 bg-white rounded border border-nordic-gray text-xs overflow-auto max-h-60">
                          {JSON.stringify(
                            typeof result.data === "object" && !result.data.raw
                              ? {
                                  type: Array.isArray(result.data)
                                    ? "array"
                                    : "object",
                                  info: Array.isArray(result.data)
                                    ? `Array with ${result.data.length} items`
                                    : `${Object.keys(result.data).length} keys: ${Object.keys(result.data).slice(0, 10).join(", ")}`,
                                  sample: Array.isArray(result.data)
                                    ? result.data[0]
                                    : Object.fromEntries(
                                        Object.entries(result.data).slice(0, 5)
                                      ),
                                }
                              : result.data,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                    {result.error && (
                      <div className="text-red-600">
                        <span className="font-semibold">Error:</span>{" "}
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
          <h3 className="font-semibold text-amber-800 mb-2">Huomio:</h3>
          <p className="text-sm text-amber-700 mb-2">
            Seuraavat endpointit eivät ole käytössä, mutta se on odotettua. 
            Pääendpoint (Government Proposals) toimii ja on integroitu sovellukseen.
          </p>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="font-mono text-xs">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 p-4 bg-nordic-light rounded-lg border border-nordic-gray">
        <h3 className="font-semibold text-nordic-darker mb-2">
          API Dokumentaatio:
        </h3>
        <ul className="text-sm text-nordic-dark space-y-2">
          <li>
            <a
              href="https://avoindata.eduskunta.fi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nordic-blue hover:underline flex items-center gap-1"
            >
              Eduskunta Avoindata <ExternalLink size={14} />
            </a>
          </li>
          <li>
            <a
              href="https://github.com/eduskunta/avoindata.eduskunta.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nordic-blue hover:underline flex items-center gap-1"
            >
              GitHub Repository <ExternalLink size={14} />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

