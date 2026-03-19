import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/** Validates that the redirect target is a local path to prevent Open Redirect. */
function getSafeNextRedirect(next: string | null, origin: string): URL {
  const fallback = "/dashboard";
  const raw = (next ?? fallback).trim();
  // Must be a path: starts with / but not // (no protocol-relative)
  const isLocalPath =
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.toLowerCase().startsWith("/http");
  const path = isLocalPath ? raw : fallback;
  return new URL(path, origin);
}

/** Build redirect to auth-error with message (no sensitive data in URL). */
function redirectToAuthError(origin: string, message: string): NextResponse {
  const url = new URL("/auth/auth-error", origin);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

/** Commit session cookies to the response to prevent desync (Next.js 15). */
async function redirectWithCookies(
  destination: URL,
  origin: string,
): Promise<NextResponse> {
  const { cookies: getCookies } = await import("next/headers");
  const cookieStore = await getCookies();
  const res = NextResponse.redirect(destination);
  cookieStore.getAll().forEach((cookie) => {
    res.cookies.set(cookie.name, cookie.value, cookie.options);
  });
  return res;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");

  // Next.js 15: explicitly await cookies before creating the server client (PKCE / @supabase/ssr).
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const supabase = await createClient();

  // Double-callback resilience: if we already have a session, skip code exchange and redirect.
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    const safeNext = getSafeNextRedirect(nextParam, origin);
    revalidatePath("/", "layout");
    console.log(
      "[Auth Callback] Session already present (double callback), redirecting.",
      {
        userId: existingUser.id,
      },
    );
    return redirectWithCookies(safeNext, origin);
  }

  // No session and no code → cannot complete PKCE; send to auth-error.
  if (!code || code.trim() === "") {
    console.warn("[Auth Callback] No code and no existing session.");
    return redirectToAuthError(origin, "missing_code");
  }

  // PKCE: finalize login with the one-time code.
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "[Auth Callback] exchangeCodeForSession failed:",
      error.message,
    );
    return redirectToAuthError(origin, "exchange_failed");
  }

  if (!data?.user) {
    console.error(
      "[Auth Callback] Exchange succeeded but no user in response.",
    );
    return redirectToAuthError(origin, "no_user_after_exchange");
  }

  // Success logging only (no email/tokens).
  console.log("[Auth Callback] Login success.", {
    userId: data.user.id,
    provider: data.user.app_metadata?.provider ?? "email",
  });

  // --- Guest DNA migration (existing behavior) ---
  const guestDna = cookieStore.get("guest_dna")?.value;
  const guestName = cookieStore.get("guest_user_name")?.value;
  const guestRole = cookieStore.get("guest_active_role")?.value;

  if (guestDna || guestName || guestRole) {
    try {
      const scores = guestDna ? JSON.parse(guestDna) : {};
      console.log("[Auth Callback] Migrating guest data to profile.");

      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminSupabase = await createAdminClient();

      const profileUpdate: Record<string, unknown> = {
        id: data.user.id,
        updated_at: new Date().toISOString(),
      };
      if (guestDna) Object.assign(profileUpdate, scores);
      if (guestName) (profileUpdate as any).full_name = guestName;

      const { error: upsertError } = await adminSupabase
        .from("profiles")
        .upsert(profileUpdate, { onConflict: "id" });

      if (upsertError) {
        console.error(
          "[Auth Callback] Profile migration failed:",
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

      cookieStore.delete("guest_user_id");
      cookieStore.delete("guest_user_name");
      cookieStore.delete("guest_dna");
      cookieStore.delete("guest_active_role");
    } catch (e) {
      console.error("[Auth Callback] Guest migration error", e);
    }
  }

  // Ensure profile row exists.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: data.user.email?.split("@")[0] || "Uusi käyttäjä",
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath("/", "layout");

  const safeNext = getSafeNextRedirect(nextParam, origin);
  return redirectWithCookies(safeNext, origin);
}
