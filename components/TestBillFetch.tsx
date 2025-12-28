"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, ExternalLink, FileText } from "lucide-react";
import { testBillContentFetch } from "@/app/actions/test-bill-fetch";

export default function TestBillFetch() {
  const [parliamentId, setParliamentId] = useState("HE 193/2025 vp");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      const testResult = await testBillContentFetch(parliamentId);
      setResult(testResult);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-nordic-darker mb-2">
          Test Bill Content Fetching
        </h1>
        <p className="text-nordic-dark">
          Test if bill content fetching works for a specific parliament ID
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-nordic-gray shadow-sm mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-nordic-darker mb-2">
            Parliament ID
          </label>
          <input
            type="text"
            value={parliamentId}
            onChange={(e) => setParliamentId(e.target.value)}
            placeholder="e.g., HE 193/2025 vp"
            className="w-full px-4 py-2 border border-nordic-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-nordic-blue text-nordic-darker"
          />
          <p className="text-xs text-nordic-dark mt-1">
            Enter a parliament ID like "HE 193/2025 vp" or "HE 191/2025 vp"
          </p>
        </div>

        <button
          onClick={handleTest}
          disabled={testing || !parliamentId}
          className="px-6 py-3 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <FileText size={20} />
              <span>Test Fetch</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div
            className={`p-6 rounded-2xl border-2 ${
              result.success
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={24} />
              ) : (
                <XCircle className="text-red-600 mt-1 flex-shrink-0" size={24} />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">
                  {result.success ? "Fetch Successful!" : "Fetch Failed"}
                </h2>
                <p className="text-sm">
                  {result.success
                    ? `Successfully fetched and extracted ${result.textLength || 0} characters from the document.`
                    : result.error || "Failed to fetch document content."}
                </p>
              </div>
            </div>
          </div>

          {/* S3 URL Construction */}
          <div className="bg-white rounded-2xl p-6 border border-nordic-gray shadow-sm">
            <h3 className="text-lg font-semibold text-nordic-darker mb-4">
              S3 URL Construction
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-nordic-dark">Input:</span>
                <code className="ml-2 px-2 py-1 bg-nordic-light rounded text-sm">
                  {parliamentId}
                </code>
              </div>
              <div>
                <span className="text-sm font-medium text-nordic-dark">Constructed URL:</span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-nordic-light rounded text-sm break-all">
                    {result.s3Url}
                  </code>
                  {result.s3Url && (
                    <a
                      href={result.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nordic-blue hover:text-nordic-deep transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={16} />
                      Open
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fetch Details */}
          <div className="bg-white rounded-2xl p-6 border border-nordic-gray shadow-sm">
            <h3 className="text-lg font-semibold text-nordic-darker mb-4">
              Fetch Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-nordic-dark">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      result.httpStatus === 200
                        ? "bg-green-100 text-green-800"
                        : result.httpStatus
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {result.httpStatus || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-nordic-dark">Content Type:</span>
                  <code className="ml-2 px-2 py-1 bg-nordic-light rounded text-sm">
                    {result.contentType || "N/A"}
                  </code>
                </div>
                <div>
                  <span className="text-sm font-medium text-nordic-dark">Is PDF:</span>
                  <span className="ml-2 px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    {result.isPdf ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-nordic-dark">Text Length:</span>
                  <code className="ml-2 px-2 py-1 bg-nordic-light rounded text-sm">
                    {result.textLength || 0} characters
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Text Preview */}
          {result.extractedText && (
            <div className="bg-white rounded-2xl p-6 border border-nordic-gray shadow-sm">
              <h3 className="text-lg font-semibold text-nordic-darker mb-4">
                Extracted Text Preview
              </h3>
              <div className="bg-nordic-light rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-nordic-darker whitespace-pre-wrap font-mono">
                  {result.extractedText.substring(0, 2000)}
                  {result.extractedText.length > 2000 && (
                    <span className="text-nordic-dark">
                      {"\n\n[... "}
                      {result.extractedText.length - 2000} more characters ...]
                    </span>
                  )}
                </pre>
              </div>
              <p className="text-xs text-nordic-dark mt-2">
                Showing first 2000 characters of {result.textLength} total characters
              </p>
            </div>
          )}

          {/* Error Details */}
          {result.error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                {result.error}
              </pre>
            </div>
          )}

          {/* Debug Info */}
          {result.debug && (
            <div className="bg-nordic-light rounded-2xl p-6 border border-nordic-gray">
              <h3 className="text-lg font-semibold text-nordic-darker mb-4">
                Debug Information
              </h3>
              <pre className="text-xs text-nordic-darker whitespace-pre-wrap font-mono bg-white p-4 rounded-lg overflow-auto max-h-64">
                {JSON.stringify(result.debug, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-nordic-light rounded-lg p-4 border border-nordic-gray">
        <h3 className="font-semibold text-nordic-darker mb-2">How to Use</h3>
        <ol className="list-decimal list-inside text-sm text-nordic-dark space-y-1">
          <li>Enter a parliament ID (e.g., "HE 193/2025 vp")</li>
          <li>Click "Test Fetch" to test the content fetching</li>
          <li>Check the results to see if the S3 URL was constructed correctly</li>
          <li>Verify if the PDF was fetched and text was extracted</li>
          <li>Review the extracted text preview to confirm it's working</li>
        </ol>
      </div>
    </div>
  );
}

