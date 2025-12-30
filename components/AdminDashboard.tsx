"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import StatCards from "./admin/StatCards";
import DeficitTable from "./admin/DeficitTable";
import ActivityChart from "./admin/ActivityChart";
import { getAdminStats, getBillsWithGap, getVotesPerDay } from "@/app/actions/admin";
import { sendTestReport } from "@/app/actions/send-report";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";

type AdminView = "overview" | "bills" | "users" | "reports";

export default function AdminDashboard() {
  const [view, setView] = useState<AdminView>("overview");
  const [stats, setStats] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [votesData, setVotesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, billsData, votesData] = await Promise.all([
        getAdminStats(),
        getBillsWithGap(),
        getVotesPerDay(),
      ]);
      setStats(statsData);
      setBills(billsData);
      setVotesData(votesData);
    } catch (error: any) {
      console.error("Failed to load admin data:", error);
      if (error.message === "Unauthorized") {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-nordic-blue" />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? "dark bg-nordic-darker" : "bg-nordic-white"}`}>
      <AdminSidebar
        activeView={view}
        setActiveView={setView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {view === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-nordic-darker dark:text-nordic-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-nordic-dark dark:text-nordic-gray">
                Overview of platform metrics and activity
              </p>
            </div>

            {/* Stat Cards */}
            <StatCards stats={stats} />

            {/* Test Report Button */}
            <div className="bg-white dark:bg-nordic-deep rounded-2xl p-6 border border-nordic-gray dark:border-nordic-darker shadow-sm">
              <h2 className="text-xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
                Viikkoraportin testaus
              </h2>
              <p className="text-sm text-nordic-dark dark:text-nordic-gray mb-4">
                Lähetä testiraportti omaan sähköpostiisi nähdäksesi, miltä viikkoraportti näyttää.
              </p>
              {testMessage && (
                <div
                  className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                    testMessage.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {testMessage.type === "success" ? (
                    <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{testMessage.text}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  setSendingTest(true);
                  setTestMessage(null);
                  try {
                    const result = await sendTestReport();
                    if (result.success) {
                      setTestMessage({
                        type: "success",
                        text: result.message || "Testiraportti lähetetty onnistuneesti!",
                      });
                    } else {
                      setTestMessage({
                        type: "error",
                        text: result.error || "Testiraportin lähetys epäonnistui",
                      });
                    }
                  } catch (error: any) {
                    setTestMessage({
                      type: "error",
                      text: error.message || "Odottamaton virhe",
                    });
                  } finally {
                    setSendingTest(false);
                  }
                }}
                disabled={sendingTest}
                className="px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingTest ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Lähetetään...</span>
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    <span>Lähetä testiraportti itselleni</span>
                  </>
                )}
              </button>
            </div>

            {/* Activity Chart */}
            <div className="bg-white dark:bg-nordic-deep rounded-2xl p-6 border border-nordic-gray dark:border-nordic-darker shadow-sm">
              <h2 className="text-xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
                Votes per Day (Last 14 Days)
              </h2>
              <ActivityChart data={votesData} />
            </div>

            {/* Deficit Table */}
            <div className="bg-white dark:bg-nordic-deep rounded-2xl p-6 border border-nordic-gray dark:border-nordic-darker shadow-sm">
              <h2 className="text-xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
                The Deficit Table
              </h2>
              <p className="text-sm text-nordic-dark dark:text-nordic-gray mb-4">
                Bills sorted by discrepancy gap between Parliament and Citizen stances
              </p>
              <DeficitTable bills={bills} />
            </div>
          </div>
        )}

        {view === "bills" && (
          <div>
            <h1 className="text-3xl font-bold text-nordic-darker dark:text-nordic-white mb-6">
              Bills Management
            </h1>
            <DeficitTable bills={bills} />
          </div>
        )}

        {view === "users" && (
          <div>
            <h1 className="text-3xl font-bold text-nordic-darker dark:text-nordic-white mb-6">
              Users Management
            </h1>
            <p className="text-nordic-dark dark:text-nordic-gray">
              User management interface coming soon...
            </p>
          </div>
        )}

        {view === "reports" && (
          <div>
            <h1 className="text-3xl font-bold text-nordic-darker dark:text-nordic-white mb-6">
              Reports
            </h1>
            <p className="text-nordic-dark dark:text-nordic-gray">
              Reports and analytics coming soon...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

