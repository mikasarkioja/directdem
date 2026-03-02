"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

/**
 * Ghost Login Actions
 * Handles temporary sessions for testing without full Supabase Auth.
 */

export async function startGhostSession(name: string) {
  const { cookies } = await import("next/headers");
  const guestId = randomUUID();
  const cookieStore = await cookies();

  const isProd = process.env.NODE_ENV === "production";

  // Tallenna evästeeseen (30 päivää)
  cookieStore.set("guest_user_id", guestId, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: isProd,
    httpOnly: true, // Turvallisempi API-kutsuille
  });

  // Tallenna nimitieto evästeeseen
  cookieStore.set("guest_user_name", name, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: isProd,
  });

  revalidatePath("/");
  redirect("/dashboard");
}

export async function saveGhostDNA(scores: any) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set("guest_dna", JSON.stringify(scores), {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: isProd,
  });

  // Re-run revalidation
  revalidatePath("/dashboard");
}

export async function clearGhostSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("guest_user_id");
  cookieStore.delete("guest_user_name");
  cookieStore.delete("guest_dna");
  revalidatePath("/");
}
