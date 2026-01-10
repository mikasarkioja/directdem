"use server";

import { profileBill } from "@/lib/ai/bill-profiler";
import { revalidatePath } from "next/cache";

export async function refreshBillAiProfile(billId: string) {
  try {
    const analysis = await profileBill(billId);
    revalidatePath(`/bills/${billId}`);
    return { success: true, data: analysis };
  } catch (error: any) {
    console.error("Failed to refresh bill AI profile:", error);
    return { success: false, error: error.message };
  }
}

