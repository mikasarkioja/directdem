"use client";

import { useState, useEffect } from "react";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import type { Bill, UserProfile } from "@/lib/types";
import MinecraftFinlandMap from "./MinecraftFinlandMap";
import { getUser } from "@/app/actions/auth";

export default function ConsensusMap() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load bills
      try {
        const billsData = await fetchBillsFromSupabase();
        setBills(billsData);
        if (billsData.length > 0) {
          setSelectedBill(billsData[0]); // Select first bill by default
        }
      } catch (error) {
        console.error("Failed to load bills:", error);
      }

      // Load user profile
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-nordic-dark">Ladataan karttaa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-nordic-darker mb-6">
          Vaalipiirikartta
        </h2>

        {/* Bill Selector */}
        {bills.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-nordic-dark mb-2">
              Valitse laki:
            </label>
            <select
              value={selectedBill?.id || ""}
              onChange={(e) => {
                const bill = bills.find((b) => b.id === e.target.value);
                setSelectedBill(bill || null);
              }}
              className="w-full md:w-auto px-4 py-2 border border-nordic-gray rounded-lg bg-white text-nordic-darker focus:outline-none focus:ring-2 focus:ring-nordic-blue"
            >
              {bills.map((bill) => (
                <option key={bill.id} value={bill.id}>
                  {bill.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Minecraft Finland Map */}
        <MinecraftFinlandMap
          selectedBill={selectedBill}
          user={user}
        />
      </div>
    </div>
  );
}


