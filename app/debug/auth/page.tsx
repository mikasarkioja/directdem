"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, ShieldCheck, ShieldAlert, Key, Cookie, Globe, Server, User, AlertCircle } from "lucide-react";

export default function DebugAuthPage() {
  const [clientSession, setClientSession] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [browserCookies, setBrowserCookies] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [envInfo, setEnvInfo] = useState<any>({});
  const [mounted, setMounted] = useState(false);

  // We only want to initialize the browser client on the client side
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setSupabase(createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ));
  }, []);

  useEffect(() => {
    if (!mounted || !supabase) return;

    async function checkAuth() {
      setLoading(true);
      try {
        // 1. Check Client-side Supabase Session
        const { data: { session } } = await supabase.auth.getSession();
        setClientSession(session);

        // 2. Check Browser Cookies
        setBrowserCookies(document.cookie);

        // 3. Fetch Server-side status
        const res = await fetch("/api/debug/auth-status");
        const serverData = await res.json();
        setServerStatus(serverData);

        // 4. Env info
        setEnvInfo({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
          origin: window.location.origin,
          userAgent: navigator.userAgent,
        });
      } catch (err) {
        console.error("Debug fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [mounted, supabase]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-purple-500" size={48} />
        <p className="text-white font-black uppercase tracking-widest text-xs">Valmistellaan diagnostiikkaa...</p>
      </div>
    );
  }

  const isAuthSynced = !!clientSession && !!serverStatus?.user;
  const authCookies = browserCookies.split('; ').filter(c => c.includes('auth-token') || c.includes('token'));
  const hasAuthCookies = authCookies.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 font-mono text-[10px] md:text-xs">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">System Diagnostics</h1>
            <p className="text-slate-500 uppercase tracking-widest font-bold">Authentication & Session Persistence Tracker</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isAuthSynced ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              {isAuthSynced ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              <span className="font-black uppercase tracking-widest">{isAuthSynced ? "Synced" : "Out of Sync"}</span>
            </div>
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${hasAuthCookies ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <Cookie size={16} />
              <span className="font-black uppercase tracking-widest">{hasAuthCookies ? "Auth Cookies Present" : "No Auth Cookies"}</span>
            </div>
          </div>
        </div>

        {/* HMR Info */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] text-slate-500 uppercase tracking-widest">
          Huom: <strong>__next_hmr_refresh_hash__</strong> on Next.js:n kehitystyökalu, ei kirjautumiseväste.
        </div>

        {/* Sync Warning */}
        {!isAuthSynced && hasAuthCookies && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-amber-500 shrink-0" size={24} />
            <div className="space-y-1">
              <p className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Session Sync Error detected</p>
              <p className="text-slate-400 font-medium">
                Cookies are present in the browser, but the Server-side Supabase client cannot find the session. 
                This usually means the cookies are incorrectly formatted (wrong Path, SameSite, or Domain) or the Secure flag is preventing access on http://localhost.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Client Side Diagnostics */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-purple-400 uppercase font-black tracking-widest">
              <Globe size={14} /> Browser Client (supabase-js)
            </h3>
            <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-slate-500 uppercase font-black text-[9px] tracking-widest">Session Object:</p>
                <div className="bg-black/40 rounded-xl p-4 overflow-auto max-h-40">
                  <pre className={clientSession ? "text-emerald-400" : "text-rose-400"}>
                    {clientSession ? JSON.stringify({
                      user: { id: clientSession.user.id, email: clientSession.user.email },
                      expires_at: new Date(clientSession.expires_at * 1000).toISOString()
                    }, null, 2) : "NULL"}
                  </pre>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-500 uppercase font-black text-[9px] tracking-widest">Document.cookie (Raw):</p>
                <div className="bg-black/40 rounded-xl p-4 overflow-auto max-h-40 break-all text-slate-400">
                  {browserCookies || "EMPTY"}
                </div>
              </div>
            </div>
          </div>

          {/* Server Side Diagnostics */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-blue-400 uppercase font-black tracking-widest">
              <Server size={14} /> Server Client (Supabase SSR)
            </h3>
            <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-slate-500 uppercase font-black text-[9px] tracking-widest">getUser() Result:</p>
                <div className="bg-black/40 rounded-xl p-4 overflow-auto max-h-40">
                  <pre className={serverStatus?.user ? "text-emerald-400" : "text-rose-400"}>
                    {serverStatus?.user ? JSON.stringify(serverStatus.user, null, 2) : "NULL"}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-slate-500 uppercase font-black text-[9px] tracking-widest">Cookies recognized by Server:</p>
                <div className="bg-black/40 rounded-xl p-4 overflow-auto max-h-40">
                  {serverStatus?.cookies?.length > 0 ? (
                    <ul className="space-y-2">
                      {serverStatus.cookies.map((c: any, i: number) => (
                        <li key={i} className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-blue-400 font-bold">{c.name}</span>
                          <span className="text-slate-500">present</span>
                        </li>
                      ))}
                    </ul>
                  ) : "NO COOKIES RECOGNIZED"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-2 text-slate-500">
               <Key size={14} />
               <h4 className="font-black uppercase tracking-widest text-[9px]">Environment & Keys</h4>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between">
                 <span className="text-slate-600">Client URL Prefix:</span>
                 <span className="text-purple-400 font-mono">{process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15)}...</span>
               </div>
               <div className="flex justify-between border-b border-white/5 pb-2">
                 <span className="text-slate-600">Server URL Prefix:</span>
                 <span className="text-blue-400 font-mono">{serverStatus?.env?.URL_PREFIX}...</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-600">Client Key Prefix:</span>
                 <span className="text-purple-400 font-mono">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)}...</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-600">Server Key Prefix:</span>
                 <span className="text-blue-400 font-mono">{serverStatus?.env?.KEY_PREFIX}...</span>
               </div>
             </div>
             {serverStatus?.error && (
               <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-[10px]">
                 SERVER ERROR: {serverStatus.error}
               </div>
             )}
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-2 text-slate-500">
               <User size={14} />
               <h4 className="font-black uppercase tracking-widest text-[9px]">User Agent & Origin</h4>
             </div>
             <p className="text-slate-400">{envInfo.userAgent}</p>
             <p className="text-purple-400 font-bold">{envInfo.origin}</p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tight">Manual Session Reset</h3>
            <p className="text-slate-500 max-w-sm">Use these to clear broken states or force a clean login attempt.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              className="flex-1 md:flex-none px-8 py-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500/20 transition-all"
            >
              Sign Out
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
            >
              Refresh
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="flex-1 md:flex-none px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
