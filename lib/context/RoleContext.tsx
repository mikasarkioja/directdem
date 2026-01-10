"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "@/lib/types";
import { switchUserRole } from "@/app/actions/user-profiles";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export type Role = 'citizen' | 'shadow_mp' | 'researcher';

interface RoleContextType {
  role: Role;
  switchRole: (newRole: Role) => Promise<void>;
  isSwitching: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ 
  children, 
}: { 
  children: ReactNode; 
}) {
  const [role, setRole] = useState<Role>('citizen');
  const [isSwitching, setIsSwitching] = useState(false);
  const [showLensAnimation, setShowLensAnimation] = useState(false);

  // Initialize role from user profile or local storage
  useEffect(() => {
    async function initRole() {
      // Check localStorage first for speed
      const savedRole = localStorage.getItem("active_role") as Role;
      if (savedRole && ['citizen', 'shadow_mp', 'researcher'].includes(savedRole)) {
        setRole(savedRole);
      }
    }
    initRole();
  }, []);

  const switchRole = async (newRole: Role) => {
    if (newRole === role) return;
    
    setIsSwitching(true);
    setShowLensAnimation(true);
    localStorage.setItem("active_role", newRole);
    try {
      const res = await switchUserRole(newRole);
      if (res.success) {
        setRole(newRole);
        // We don't want to refresh the whole page if we can avoid it, 
        // but some components might need it. For now, let's just update local state.
        toast.success(`Näkökulma vaihdettu: ${
          newRole === 'shadow_mp' ? 'Varjoedustaja' : 
          newRole === 'researcher' ? 'Tutkija' : 'Kansalainen'
        }`);
      } else {
        toast.error(`Roolin vaihto epäonnistui: ${(res as any).error || "Tuntematon virhe"}`);
      }
    } catch (err) {
      toast.error("Virhe roolin vaihdossa.");
    } finally {
      // Delay finishing the animation for a better 'lens switch' feel
      setTimeout(() => {
        setIsSwitching(false);
        setTimeout(() => setShowLensAnimation(false), 500);
      }, 800);
    }
  };

  // Define accent colors based on role
  useEffect(() => {
    const root = document.documentElement;
    if (role === 'shadow_mp') {
      root.style.setProperty('--accent-primary', '#a855f7'); // Purple
      root.style.setProperty('--accent-glow', 'rgba(168, 85, 247, 0.4)');
    } else if (role === 'researcher') {
      root.style.setProperty('--accent-primary', '#06b6d4'); // Cyan
      root.style.setProperty('--accent-glow', 'rgba(6, 182, 212, 0.4)');
    } else {
      root.style.setProperty('--accent-primary', '#10b981'); // Emerald/Neon
      root.style.setProperty('--accent-glow', 'rgba(16, 185, 129, 0.4)');
    }
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, switchRole, isSwitching }}>
      <AnimatePresence>
        {showLensAnimation && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-slate-950/20 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-white font-black uppercase tracking-[0.5em] text-2xl italic"
            >
              Ladataan näkökulmaa...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={isSwitching ? "blur-sm transition-all duration-700" : "transition-all duration-700"}>
        {children}
      </div>
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

