"use server";

import { getUser } from "./auth";

/**
 * Erillinen server action debug-sivua varten, 
 * jotta vältetään monimutkaiset import-ketjut client-puolella.
 */
export async function getDebugUser() {
  try {
    return await getUser();
  } catch (error) {
    console.error("Debug User Action Error:", error);
    return null;
  }
}
