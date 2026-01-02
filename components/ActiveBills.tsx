"use client";

import { useEffect, useState } from "react";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import type { Bill, UserProfile } from "@/lib/types";
import { syncBillsFromEduskunta } from "@/app/actions/sync-bills";
import BillDetail from "./BillDetail";
import { Loader2, RefreshCw, Database, AlertCircle, CheckCircle, Info, Sparkles } from "lucide-react";

interface ActiveBillsProps {
  user: UserProfile | null;
}

export default function ActiveBills({ user }: ActiveBillsProps) {
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

  const aiProcessedCount = bills.filter(b => b.summary && (b.summary.length > 800 || b.summary.includes("###"))).length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-nordic-darker uppercase tracking-tighter">Aktiiviset esitykset</h2>
            <div className="flex items-center gap-4 mt-2">
              {lastSync && (
                <p className="text-xs text-nordic-dark font-medium uppercase tracking-wider">
                  Päivitetty: {lastSync.toLocaleTimeString()}
                </p>
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md border border-amber-200">
                <Sparkles size={12} className="text-amber-600" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                  {aiProcessedCount} / {bills.length} AI-Analysoitu
                </span>
              </div>
            </div>
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

        {!user && (
          <div className="mb-6 p-4 bg-nordic-light border-2 border-nordic-blue rounded-xl flex items-center gap-3 shadow-sm">
            <Info className="text-nordic-blue flex-shrink-0" size={24} />
            <p className="text-nordic-darker font-medium">
              Voit selata lakiesityksiä ja nähdä tilastoja. 
              <span className="font-bold"> Kirjaudu sisään</span>, jos haluat äänestää tai osallistua keskusteluun.
            </p>
          </div>
        )}

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
            {bills.slice(0, 10).map((bill) => {
              const isAISummary = bill.summary && (bill.summary.length > 800 || bill.summary.includes("###"));
              
              return (
                <div
                  key={bill.id}
                  onClick={() => setSelectedBill(bill)}
                  className="bg-white rounded-lg p-6 shadow-sm border border-nordic-gray cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {isAISummary && (
                    <div className="absolute top-0 right-0 p-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">
                        <Sparkles size={10} />
                        <span>Selkokielinen</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-nordic-darker pr-4">
                          {bill.title}
                        </h3>
                        {bill.publishedDate && (
                          <span className="text-xs font-bold text-nordic-blue uppercase tracking-wider">
                            Annettu: {new Date(bill.publishedDate).toLocaleDateString('fi-FI')}
                          </span>
                        )}
                      </div>
                      <p className="text-nordic-dark mb-3 line-clamp-3">
                        {bill.summary && bill.summary.includes("###") 
                          ? bill.summary.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("---")).join(" ").substring(0, 200) + "..."
                          : bill.summary}
                      </p>
                      <div className="flex items-center gap-3">
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
                        {isAISummary ? (
                          <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                            <Sparkles size={12} />
                            AI-Analyysi valmis
                          </span>
                        ) : (
                          <span className="text-xs text-nordic-dark/40 font-bold flex items-center gap-1 italic uppercase tracking-tighter">
                            AI-Analyysi puuttuu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Next 30 Bills Summary List */}
        {bills.length > 10 && (
          <div className="mt-12 bg-nordic-light/30 rounded-3xl p-8 border border-nordic-gray/20 shadow-inner">
            <h3 className="text-xl font-black text-nordic-darker mb-6 uppercase tracking-tighter">
              Seuraavat 30 esitystä
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {bills.slice(10, 40).map((bill, index) => {
                const isAI = bill.summary && (bill.summary.length > 800 || bill.summary.includes("###"));
                return (
                  <div 
                    key={bill.id} 
                    onClick={() => setSelectedBill(bill)}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-nordic-gray/10 cursor-pointer hover:border-nordic-blue transition-colors group relative"
                  >
                    <span className="text-[10px] font-black text-nordic-dark/30 w-6">{(index + 11).toString().padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <p className="text-sm font-bold text-nordic-darker truncate group-hover:text-nordic-blue transition-colors">
                          {bill.title}
                        </p>
                        {isAI && <Sparkles size={10} className="text-amber-500 flex-shrink-0" />}
                      </div>
                      {bill.publishedDate && (
                        <p className="text-[10px] text-nordic-dark opacity-60 uppercase font-medium">
                          {new Date(bill.publishedDate).toLocaleDateString('fi-FI')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {selectedBill && (
        <BillDetail bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}


