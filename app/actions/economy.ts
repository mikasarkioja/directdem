"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "./auth";

export interface Transaction {
  id: string;
  amount: number;
  points_type: 'CREDIT' | 'IMPACT';
  action_type: 'EARN' | 'SPEND';
  description: string;
  created_at: string;
  metadata?: any;
}

/**
 * Fetches the most recent transactions for the current user.
 */
export async function getUserTransactions(limit: number = 10): Promise<Transaction[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data as Transaction[];
}

