"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export async function startGhostSession(name: string) {
  const guestId = randomUUID();
  const cookieStore = await cookies();
  
  // Tallenna evästeeseen (30 päivää)
  cookieStore.set("guest_user_id", guestId, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Tallenna nimitieto evästeeseen
  cookieStore.set("guest_user_name", name, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/");
  redirect("/dashboard");
}

export async function saveGhostDNA(scores: any) {
  const cookieStore = await cookies();
  cookieStore.set("guest_dna", JSON.stringify(scores), {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
  
  // Re-run revalidation
  revalidatePath("/dashboard");
}

export async function clearGhostSession() {
  const cookieStore = await cookies();
  cookieStore.delete("guest_user_id");
  cookieStore.delete("guest_user_name");
  cookieStore.delete("guest_dna");
  revalidatePath("/");
}
