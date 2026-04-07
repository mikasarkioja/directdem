/**
 * Grant profiles.is_admin = true for a user by email.
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npx tsx scripts/grant-admin-by-email.ts you@example.com
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function printIsAdminHint(message: string): void {
  console.error("profiles write failed:", message);
  if (/is_admin/i.test(message)) {
    console.error(
      "\nThe profiles table is missing column is_admin. In Supabase Dashboard → SQL Editor, run:\n" +
        "  supabase/add-profiles-is-admin.sql\n" +
        "Then run this script again.\n",
    );
  }
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/grant-admin-by-email.ts <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId: string | null = null;
  let page = 1;
  const perPage = 1000;

  while (!userId && page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("listUsers failed:", error.message);
      process.exit(1);
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      userId = found.id;
      break;
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  if (!userId) {
    console.error(
      `No auth user with email "${email}". Log in once via /login to create the user, then run this script again.`,
    );
    process.exit(1);
  }

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);
    if (error) {
      printIsAdminHint(error.message);
      process.exit(1);
    }
  } else {
    const { error } = await admin.from("profiles").insert({
      id: userId,
      email,
      is_admin: true,
      full_name: email.split("@")[0] || "Admin",
    });
    if (error) {
      printIsAdminHint(error.message);
      process.exit(1);
    }
  }

  console.log("OK: is_admin = true for", email, "user id", userId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
