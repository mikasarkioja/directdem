"use server";

import { generateMPPersona } from "@/lib/ai/persona-generator";
import { revalidatePath } from "next/cache";

export async function refreshMPPersona(mpId: string) {
  try {
    await generateMPPersona(mpId);
    revalidatePath(`/mps/${mpId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to refresh MP persona:", error);
    return { success: false, error: error.message };
  }
}

