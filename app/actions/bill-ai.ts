"use server";

import { profileBill } from "@/lib/ai/bill-profiler";
import { analyzeAndEnhanceBill } from "@/lib/ai/bill-analyzer";
import { generateWeatherForecast } from "@/lib/logic/forecast-engine";
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

export async function refreshEnhancedBillProfile(billId: string) {
  try {
    // 1. Analysoi sisältö
    const analysis = await analyzeAndEnhanceBill(billId);
    
    // 2. Laske ennusteet
    const forecast = await generateWeatherForecast(billId);
    
    revalidatePath(`/bills/${billId}`);
    revalidatePath("/dashboard");
    
    return { success: true, analysis, forecast };
  } catch (error: any) {
    console.error("Failed to refresh enhanced bill profile:", error);
    return { success: false, error: error.message };
  }
}

