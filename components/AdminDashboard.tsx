"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import StatCards from "./admin/StatCards";
import DeficitTable from "./admin/DeficitTable";
import ActivityChart from "./admin/ActivityChart";
import { getAdminStats, getBillsWithGap, getVotesPerDay } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";

type AdminView = "overview" | "bills" | "users" | "reports";

export default function AdminDashboard() {
  const [view, setView] = useState<AdminView>("overview");
  const [stats, setStats] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [votesData, setVotesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
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

