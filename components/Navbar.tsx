"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import CreditDisplay from "./CreditDisplay";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { clearGhostSession } from "@/lib/auth/ghost-actions";
import type { UserProfile } from "@/lib/types";

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    if (user?.is_guest) {
      await clearGhostSession();
    } else {
      await supabase.auth.signOut();
    }
    router.refresh();
    router.push("/");
  };

  return (
    <>
      <nav className="bg-white dark:bg-nordic-deep border-b border-nordic-gray shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand - Always visible */}
            <div className="flex items-center">
              <h1
                className="text-xl font-bold text-nordic-darker dark:text-nordic-white cursor-pointer"
                onClick={() => router.push("/")}
              >
                Eduskuntavahti
              </h1>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <div className="flex items-center gap-6">
                  <CreditDisplay
                    credits={user.credits || 0}
                    impactPoints={user.impact_points || 0}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-nordic-light dark:bg-nordic-darker rounded-lg border border-nordic-blue/20">
                      <User size={18} className="text-nordic-blue" />
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight text-nordic-darker dark:text-nordic-white leading-none">
                          {user.full_name ||
                            user.email?.split("@")[0] ||
                            "Käyttäjä"}
                        </span>
                        {user.email && (
                          <span className="text-[9px] font-bold text-slate-500 lowercase leading-tight">
                            {user.email}
                          </span>
                        )}
                      </div>
                      {user.is_verified && <VerifiedBadge />}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-nordic-dark dark:text-nordic-gray hover:text-nordic-darker dark:hover:text-nordic-white transition-colors touch-manipulation select-none"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                    >
                      <LogOut size={16} />
                      <span>Kirjaudu ulos</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-nordic-dark dark:text-nordic-gray hover:text-nordic-blue dark:hover:text-nordic-white transition-colors py-2 px-2 touch-manipulation"
                >
                  Kirjaudu
                </Link>
              )}
            </div>

            {/* Mobile: Profile icon or login button only */}
            <div className="md:hidden">
              {user ? (
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-nordic-dark dark:text-nordic-gray hover:text-nordic-darker dark:hover:text-nordic-white touch-manipulation select-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                  aria-label="Profiili"
                >
                  <User size={24} />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-nordic-blue hover:underline py-2 px-2 touch-manipulation"
                >
                  Kirjaudu
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 border-t border-nordic-gray dark:border-nordic-darker mt-2 pt-4">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="px-3">
                    <CreditDisplay
                      credits={user.credits || 0}
                      impactPoints={user.impact_points || 0}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-nordic-light dark:bg-nordic-darker rounded-lg border border-nordic-blue/20">
                      <User size={18} className="text-nordic-blue" />
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight text-nordic-darker dark:text-nordic-white leading-none">
                          {user.full_name ||
                            user.email?.split("@")[0] ||
                            "Käyttäjä"}
                        </span>
                        {user.email && (
                          <span className="text-[9px] font-bold text-slate-500 lowercase leading-tight">
                            {user.email}
                          </span>
                        )}
                      </div>
                      {user.is_verified && <VerifiedBadge />}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-nordic-dark dark:text-nordic-gray hover:text-nordic-darker dark:hover:text-nordic-white transition-colors touch-manipulation select-none"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                    >
                      <LogOut size={16} />
                      <span>Kirjaudu ulos</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-nordic-blue border border-nordic-blue/30 rounded-lg hover:bg-nordic-blue/5"
                >
                  Kirjaudu
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
