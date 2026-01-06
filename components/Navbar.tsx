"use client";

import { useState } from "react";
import { User, LogOut } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
              <h1 className="text-xl font-bold text-nordic-darker dark:text-nordic-white cursor-pointer" onClick={() => router.push('/')}>
                Eduskuntavahti
              </h1>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-nordic-light dark:bg-nordic-darker rounded-lg">
                    <User size={18} className="text-nordic-blue" />
                    <span className="text-sm font-medium text-nordic-darker dark:text-nordic-white">
                      {user.full_name || user.email}
                    </span>
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
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors text-sm font-medium touch-manipulation select-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  Kirjaudu
                </button>
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
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors text-sm font-medium touch-manipulation select-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  Kirjaudu
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 border-t border-nordic-gray dark:border-nordic-darker mt-2 pt-4">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-nordic-light dark:bg-nordic-darker rounded-lg">
                    <User size={18} className="text-nordic-blue" />
                    <span className="text-sm font-medium text-nordic-darker dark:text-nordic-white">
                      {user.full_name || user.email}
                    </span>
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
              ) : (
                <button
                  onClick={() => {
                    router.push('/login');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors text-sm font-medium"
                >
                  Kirjaudu
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
