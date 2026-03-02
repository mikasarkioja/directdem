import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      console.log(
        "[Auth Callback] Session established for user:",
        data.user.id,
      );

      // --- DNA MIGRATION LOGIC ---
      // Check if there are guest DNA results in cookies to migrate
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const guestDna = cookieStore.get("guest_dna")?.value;
      const guestName = cookieStore.get("guest_user_name")?.value;
      const guestRole = cookieStore.get("guest_active_role")?.value;

      if (guestDna || guestName || guestRole) {
        try {
          const scores = guestDna ? JSON.parse(guestDna) : {};
          console.log(
            "[Auth Callback] Migrating Guest data to user profile...",
          );

          // Use Admin Client to ensure we can write to the profile even if RLS is tight
          const { createAdminClient } = await import("@/lib/supabase/server");
          const adminSupabase = await createAdminClient();

          const profileUpdate: any = {
            id: data.user.id,
            updated_at: new Date().toISOString(),
          };

          if (guestDna) Object.assign(profileUpdate, scores);
          if (guestName) profileUpdate.full_name = guestName;

          const { error: upsertError } = await adminSupabase
            .from("profiles")
            .upsert(profileUpdate, { onConflict: "id" });

          if (upsertError) {
            console.error(
              "[Auth Callback] Profile Migration failed:",
              upsertError.message,
            );
          }

          if (guestRole) {
            await adminSupabase.from("user_profiles").upsert(
              {
                id: data.user.id,
                active_role: guestRole,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );
          }

          console.log(
            "[Auth Callback] Migration successful. Clearing guest cookies.",
          );
          // Clear guest cookies after migration
          cookieStore.delete("guest_user_id");
          cookieStore.delete("guest_user_name");
          cookieStore.delete("guest_dna");
          cookieStore.delete("guest_active_role");
        } catch (e) {
          console.error("[Auth Callback] Failed to migrate guest data", e);
        }
      }

      // Ensure user has a profile record
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        console.log("[Auth Callback] Creating missing profile for user...");
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: data.user.email?.split("@")[0] || "Uusi käyttäjä",
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
