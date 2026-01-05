import { createClient } from "@/lib/supabase/server";

export async function testLoginState() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) return { status: "error", message: "Auth error: " + userError.message };
    if (!user) return { status: "unauthenticated", message: "No user found in session" };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      status: "authenticated",
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile || null,
      profileError: profileError ? profileError.message : null
    };
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
}

