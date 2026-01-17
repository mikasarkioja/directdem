"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, ShieldCheck, ShieldAlert, Key, Trash2, RefreshCw, Sparkles, Server, LayoutDashboard } from "lucide-react";
import { getDebugUser } from "@/app/actions/debug-auth";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function DebugAuthPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [cookieCount, setCookieCount] = useState(0);
  const [customEmail, setCustomEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [serverUser, setServerUser] = useState<any>(null);
  const [serverLoading, setServerLoading] = useState(false);

  const addLog = (msg: string) => {
    console.log(`[DEBUG-AUTH] ${msg}`);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const getSupabase = () => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  };

  const checkStatus = async () => {
    setLoading(true);
    addLog("Tarkistetaan istunnon tila...");
    const supabase = getSupabase();
    
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      setUser(authUser);
      addLog(authUser ? `Käyttäjä löytyi: ${authUser.email}` : "Ei voimassa olevaa istuntoa.");
      addLog(`Evästeet (document.cookie): ${document.cookie.split(';').length} kpl`);
      setCookieCount(document.cookie.split(';').length);
    } catch (e: any) {
      addLog(`Virhe tarkistuksessa: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signInTest = async () => {
    if (!customEmail) {
      addLog("Virhe: Syötä sähköposti Magic Link -testiä varten.");
      return;
    }
    setLoading(true);
    addLog(`Kutsutaan signInWithOtp sähköpostilla: ${customEmail}...`);
    const supabase = getSupabase();
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: customEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true
        }
      });

      if (error) {
        addLog(`Virhe: ${error.message}`);
      } else {
        addLog(`SUCCESS: Magic Link / OTP lähetetty osoitteeseen ${customEmail}`);
        addLog("Tarkista sähköpostisi ja syötä 6-numeroinen koodi alla olevaan kenttään (jos käytössä) tai klikkaa linkkiä.");
      }
    } catch (e: any) {
      addLog(`Kriittinen virhe: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpTest = async () => {
    if (!customEmail || !otpCode) {
      addLog("Virhe: Sähköposti ja koodi vaaditaan.");
      return;
    }
    setLoading(true);
    addLog(`Vahvistetaan koodi ${otpCode} käyttäjälle ${customEmail}...`);
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: customEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        addLog(`Virhe: ${error.message}`);
      } else {
        addLog(`SUCCESS! Kirjautuminen onnistui. Käyttäjä: ${data.user?.email}`);
        toast.success("Kirjautuminen onnistui selaimessa!");
        setUser(data.user);
        setCookieCount(document.cookie.split(';').length);
      }
    } catch (e: any) {
      addLog(`Virhe: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    addLog("Kirjaudutaan ulos...");
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    addLog("Uloskirjautuminen valmis.");
    
    // Tyhjennetään myös ghost-evästeet varmuuden vuoksi
    document.cookie = "guest_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "guest_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "guest_dna=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    addLog("Ghost-evästeet tyhjennetty.");
    
    setLoading(false);
  };

  const clearGhostCookies = () => {
    document.cookie = "guest_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "guest_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "guest_dna=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    addLog("Ghost-evästeet poistettu manuaalisesti.");
    setCookieCount(document.cookie.split(';').length);
    toast.success("Ghost-evästeet tyhjennetty");
  };

  const checkServerStatus = async () => {
    setServerLoading(true);
    addLog("Kysytään palvelimelta (RSC) käyttäjätietoa...");
    try {
      const sUser = await getDebugUser();
      setServerUser(sUser);
      if (sUser) {
        addLog(`Palvelin vahvistaa: Käyttäjä ${sUser.email} on tunnistettu.`);
        if (sUser.is_guest) addLog("HUOM: Palvelin näkee sinut vielä GHOST-käyttäjänä.");
      } else {
        addLog("Palvelin sanoo: Käyttäjää ei tunnistettu (Cookie mismatch?).");
      }
    } catch (e: any) {
      addLog(`Palvelinvirhe: ${e.message}`);
    } finally {
      setServerLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
      <Toaster position="bottom-right" />
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Key className="text-purple-500" />
            Auth Pipeline Debug
          </h1>
          <p className="text-slate-500 text-sm">Seuraa autentikaatioprosessia ja evästeiden tilaa reaaliajassa.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status & Actions */}
          <div className="space-y-6">
            <div className={`p-6 rounded-[2rem] border-2 flex flex-col items-center text-center gap-4 ${user ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
              {user ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-emerald-500 tracking-widest">Istunto Aktiivinen</p>
                    <p className="text-lg font-bold">{user.email}</p>
                    <p className="text-[10px] text-slate-500 mt-1">ID: {user.id}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
                    <ShieldAlert size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-rose-500 tracking-widest">Ei Istuntoa</p>
                    <p className="text-slate-400">Kirjaudu sisään testataksesi putkea.</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Sähköposti (Magic Link)</label>
                <input 
                  type="email" 
                  placeholder="oma@email.fi" 
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-4 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button 
                  onClick={signInTest}
                  disabled={loading}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-600/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Key size={16} />}
                  Lähetä Magic Link / Koodi
                </button>
              </div>

              <div className="pt-4 space-y-3 border-t border-white/5">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Vahvistuskoodi (6 numeroa)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="123456" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-black tracking-[0.3em] outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={verifyOtpTest}
                    disabled={loading || otpCode.length < 6}
                    className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded-xl text-[10px] font-black uppercase disabled:opacity-50 transition-all"
                  >
                    Vahvista
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button 
                  onClick={checkServerStatus}
                  disabled={serverLoading}
                  className="py-4 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-blue-500/20"
                >
                  {serverLoading ? <Loader2 className="animate-spin" /> : <Server size={14} />}
                  Testaa palvelimella
                </button>
                <Link 
                  href="/dashboard"
                  className="py-4 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-emerald-500/20 text-center"
                >
                  <LayoutDashboard size={14} />
                  Dashboardille
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={clearGhostCookies}
                  className="py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-white/5"
                >
                  <Trash2 size={14} className="text-rose-400" />
                  Tyhjennä Ghost
                </button>
                <button 
                  onClick={signOut}
                  className="py-4 bg-rose-900/30 text-rose-500 hover:bg-rose-900/50 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-rose-500/20"
                >
                  <Trash2 size={14} />
                  Kirjaudu ulos
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Evästeet ({cookieCount} kpl)</h3>
              <div className="text-[10px] text-slate-400 break-all leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                {typeof document !== 'undefined' ? document.cookie : 'Ei saatavilla'}
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-black rounded-[2rem] border border-white/10 flex flex-col h-[500px]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Log</span>
              <button onClick={() => setLogs([])} className="text-[9px] font-bold uppercase text-slate-600 hover:text-white">Tyhjennä</button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-2 text-[11px] custom-scrollbar">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={i} className="flex gap-3 border-b border-white/5 pb-2">
                  <span className="text-purple-500/50 shrink-0 select-none">→</span>
                  <span className={log.includes('Virhe') ? 'text-rose-400' : (log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-300')}>
                    {log}
                  </span>
                </div>
              )) : (
                <p className="text-slate-700 italic text-center py-20">Ei tapahtumia...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

