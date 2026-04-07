"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Virheellinen sähköpostiosoite");

/**
 * Public signup for weekly bulletin (no login). Uses service role to insert
 * behind RLS; do not expose keys to the client.
 */
export async function subscribePublicWeeklyBulletin(
  rawEmail: string,
): Promise<{ ok: boolean; message: string }> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Virheellinen sähköposti",
    };
  }

  const email = parsed.data.toLowerCase();

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") {
        const { error: reactivateErr } = await supabase
          .from("newsletter_subscribers")
          .update({ is_active: true })
          .eq("email", email);
        if (reactivateErr) {
          console.error("[public-newsletter] reactivate:", reactivateErr);
          return {
            ok: false,
            message: "Tilaus epäonnistui. Yritä myöhemmin uudelleen.",
          };
        }
        return {
          ok: true,
          message:
            "Olet jo listalla — viikkobulletiini tulee tähän osoitteeseen.",
        };
      }
      console.error("[public-newsletter]", error);
      return {
        ok: false,
        message: "Tilaus epäonnistui. Yritä myöhemmin uudelleen.",
      };
    }

    return {
      ok: true,
      message: "Kiitos! Saat viikkobulletiinin sähköpostiisi.",
    };
  } catch (e) {
    console.error("[public-newsletter]", e);
    return { ok: false, message: "Järjestelmävirhe." };
  }
}
