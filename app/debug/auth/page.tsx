// app/debug/auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Key, ShieldCheck, Mail, AlertTriangle, RefreshCw, User, Cookie, Globe } from "lucide-react";

export default function AuthDebugPage() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [envInfo, setEnvInfo] = useState<any>({ url: "", userAgent: "", supabaseUrl: "" });
  const [cookieInfo, setCookieInfo] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  const supabase = createClient();

  async function checkAuth() {
    if (typeof window === 'undefined') return;
    setLoading(true);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    setSession(session);
    setUser(user);
    setCookieInfo(document.cookie);
    setEnvInfo({
      url: window.location.origin,
      userAgent: navigator.userAgent,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    setLoading(false);
  }

  useEffect(() => {
    setIsMounted(true);
    checkAuth();
  }, []);

  async function sendTestMagicLink() {
    const email = prompt("Anna sähköposti testausta varten:");
    if (!email) return;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) alert("Virhe: " + error.message);
    else alert("Magic Link lähetetty osoitteeseen: " + email);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono text-xs">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">Auth Diagnostic Tool</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">DirectDem Security Suite v1.0</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={checkAuth} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={sendTestMagicLink} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase tracking-widest transition-all">
              Send Test Link
            </button>
            <button onClick={signOut} className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest transition-all">
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Key size={16} />
              <span className="font-black uppercase tracking-widest">Session Status</span>
            </div>
            <div className={`p-4 rounded-2xl border ${session ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              <p className="font-black uppercase text-[10px]">{session ? 'Active Session Found' : 'No Active Session'}</p>
              {session && <p className="mt-1 opacity-70">Expires: {new Date(session.expires_at * 1000).toLocaleString()}</p>}
            </div>
            {session && (
              <pre className="p-4 bg-black/30 rounded-2xl overflow-x-auto text-[10px] text-slate-400 max-h-40">
                {JSON.stringify(session, null, 2)}
              </pre>
            )}
          </div>

          {/* User Profile */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <User size={16} />
              <span className="font-black uppercase tracking-widest">User Data (JWT)</span>
            </div>
            <div className={`p-4 rounded-2xl border ${user ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
              <p className="font-black uppercase text-[10px]">{user ? user.email : 'Not Authenticated'}</p>
              {user && <p className="mt-1 opacity-70">ID: {user.id}</p>}
            </div>
            {user && (
              <pre className="p-4 bg-black/30 rounded-2xl overflow-x-auto text-[10px] text-slate-400 max-h-40">
                {JSON.stringify(user, null, 2)}
              </pre>
            )}
          </div>

          {/* Environment */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Globe size={16} />
              <span className="font-black uppercase tracking-widest">Environment</span>
            </div>
            <div className="space-y-2">
              <p className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-500">Origin:</span>
                <span className="text-white font-bold">{envInfo.url}</span>
              </p>
              <p className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-500">Supabase URL:</span>
                <span className="text-white font-bold truncate ml-4">{envInfo.supabaseUrl}</span>
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Cookie size={16} />
              <span className="font-black uppercase tracking-widest">Local Cookies</span>
            </div>
            <div className="p-4 bg-black/30 rounded-2xl overflow-x-auto break-all text-[10px] text-slate-400 max-h-40">
              {cookieInfo ? cookieInfo : "No cookies detected via JS."}
            </div>
          </div>
        </div>

        {/* Troubleshooting Checklist */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">Common Issues</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded bg-slate-700 flex-shrink-0" />
                <p><span className="text-white font-bold">Email Client Prefetch</span>: Onko sinulla Outlook tai Gmail SafeLinks? Ne voivat käyttää linkin ennen kuin klikkaat.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded bg-slate-700 flex-shrink-0" />
                <p><span className="text-white font-bold">Redirect URL</span>: Onko <code>{envInfo.url || 'loading...'}/auth/callback</code> lisätty Supabase Dashboardin 'Redirect URLs' listaan?</p>
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded bg-slate-700 flex-shrink-0" />
                <p><span className="text-white font-bold">In-App Browser</span>: Käytätkö Instagram/Facebook-selainta? Ne estävät usein evästeiden tallennuksen.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded bg-slate-700 flex-shrink-0" />
                <p><span className="text-white font-bold">PKCE Code Verifier</span>: Jos sivu latautuu uudestaan välissä, koodin vaihto epäonnistuu.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

