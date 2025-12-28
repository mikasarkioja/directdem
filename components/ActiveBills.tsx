"use client";

import { useEffect, useState } from "react";
import { fetchBillsFromSupabase, type Bill } from "@/app/actions/bills-supabase";
import { syncBillsFromEduskunta } from "@/app/actions/sync-bills";
import BillDetail from "./BillDetail";
import { Loader2, RefreshCw, Database, AlertCircle, CheckCircle } from "lucide-react";

export default function ActiveBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBillsFromSupabase();
      setBills(data);
      setLastSync(new Date());
    } catch (err: any) {
      console.error("Failed to load bills:", err);
      setError(err.message || "Failed to load bills from database");
    } finally {
      setLoading(false);
    }
  };

  const syncFromEduskunta = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);
      
      // Force sync from Eduskunta API
      const result = await syncBillsFromEduskunta();
      
      if (result.success) {
        const message = result.warning 
          ? `Synced ${result.count} bills. ${result.warning}`
          : `Successfully synced ${result.count} bills from Eduskunta API`;
        setSuccess(message);
        // Reload bills from database
        await loadBills();
      } else {
        setError(result.error || "Failed to sync from Eduskunta API");
      }
    } catch (err: any) {
      console.error("Failed to sync from Eduskunta:", err);
      setError(err.message || "Failed to sync from Eduskunta API");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-nordic-blue" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-nordic-darker">Active Bills</h2>
            {lastSync && (
              <p className="text-sm text-nordic-dark mt-1">
                Last updated: {lastSync.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadBills}
              disabled={loading || syncing}
              className="px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Refresh from database"
            >
              <Database size={18} />
              <span>Refresh</span>
            </button>
            <button
              onClick={syncFromEduskunta}
              disabled={loading || syncing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Sync from Eduskunta API"
            >
              {syncing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              <span>Sync from API</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800 mb-1">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-green-800 mb-1">Success</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}
        {bills.length === 0 ? (
          <div className="bg-nordic-light rounded-lg p-8 border-2 border-nordic-gray text-center">
            <p className="text-nordic-dark mb-4">
              Ei lakiesityksiä saatavilla tällä hetkellä.
            </p>
            <p className="text-sm text-nordic-dark">
              Eduskunta API ei ole saatavilla tai tietokannassa ei ole vielä lakia.
              <br />
              Voit lisätä lakia manuaalisesti Supabase-tietokantaan.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bills.map((bill) => (
            <div
              key={bill.id}
              onClick={() => setSelectedBill(bill)}
              className="bg-white rounded-lg p-6 shadow-sm border border-nordic-gray cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-nordic-darker mb-2">
                    {bill.title}
                  </h3>
                  <p className="text-nordic-dark mb-3">{bill.summary}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      bill.status === "voting"
                        ? "bg-blue-100 text-blue-800"
                        : bill.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : bill.status === "draft"
                        ? "bg-gray-100 text-gray-800"
                        : bill.status === "passed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {bill.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
      {selectedBill && (
        <BillDetail bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}


