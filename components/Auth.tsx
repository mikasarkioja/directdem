"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, LogOut, Loader2 } from "lucide-react";

interface AuthProps {
  user: any;
}

export default function Auth({ user }: AuthProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage(
        "Virhe: Supabase ei ole konfiguroitu. Tarkista .env.local tiedosto ja varmista että NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_ANON_KEY on asetettu."
      );
      setLoading(false);
      console.error("Supabase configuration missing:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return;
    }

    try {
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Supabase auth error:", error);
        setMessage(`Virhe: ${error.message}`);
      } else {
        console.log("Magic link sent successfully:", data);
        setMessage("Tarkista sähköpostisi! Lähetimme sinulle kirjautumislinkin.");
      }
    } catch (err: any) {
      console.error("Unexpected error during sign in:", err);
      setMessage(`Odottamaton virhe: ${err.message || "Tarkista konsoli lisätietoja varten"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-nordic-dark">
          <span className="font-medium">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-nordic-deep text-white rounded-lg hover:bg-nordic-darker transition-colors"
        >
          <LogOut size={16} />
          <span>Kirjaudu ulos</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sähköposti@esimerkki.fi"
          required
          className="flex-1 px-4 py-2 border border-nordic-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-nordic-blue text-nordic-darker"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Mail size={16} />
          )}
          <span>Kirjaudu</span>
        </button>
      </div>
      {message && (
        <p className={`text-sm ${message.includes("Virhe") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
      <p className="text-xs text-nordic-dark">
        Lähetämme sinulle kirjautumislinkin sähköpostiin (Magic Link)
      </p>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          ⚠️ Supabase ei ole konfiguroitu. Tarkista .env.local tiedosto.
        </div>
      )}
    </form>
  );
}

