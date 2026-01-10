import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  const allCookies = cookieStore.getAll().map(c => ({
    name: c.name,
    value: c.name.includes("token") ? `[REDACTED, length: ${c.value.length}]` : c.value,
  }));

  return NextResponse.json({
    user: user ? {
      id: user.id,
      email: user.email,
    } : null,
    error: error?.message || null,
    cookies: allCookies,
    env: {
      URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15),
      KEY_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10),
    },
    timestamp: new Date().toISOString(),
  });
}
