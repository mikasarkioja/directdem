"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { submitVote, getUserVote } from "@/app/actions/votes";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface StickyVotingBarProps {
  billId: string;
  onVoteChange?: () => void;
}

export default function StickyVotingBar({ billId, onVoteChange }: StickyVotingBarProps) {
  const [userVote, setUserVote] = useState<"for" | "against" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPressed, setIsPressed] = useState<"for" | "against" | null>(null);

  useEffect(() => {
    async function loadUserAndVote() {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const vote = await getUserVote(billId);
        // Only show for/against in sticky bar, ignore neutral
        if (vote === "for" || vote === "against") {
          setUserVote(vote);
        }
      }
      setLoading(false);
    }
    loadUserAndVote();
  }, [billId]);

  const handleVote = async (position: "for" | "against") => {
    if (!user) {
      alert("Sinun täytyy olla kirjautunut äänestääksesi");
      return;
    }

    setSubmitting(true);
    setIsPressed(position);
    
    // Haptic feedback simulation - scale down animation
    setTimeout(() => {
      setIsPressed(null);
    }, 150);

    try {
      await submitVote(billId, position);
      setUserVote(position);
      if (onVoteChange) {
        onVoteChange();
      }
    } catch (error: any) {
      alert(error.message || "Äänestys epäonnistui");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return null; // Don't show sticky bar if not logged in or loading
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t-2 border-nordic-gray shadow-lg">
        <div className="flex gap-2 p-4">
          <button
            onClick={() => handleVote("for")}
            disabled={submitting}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-base transition-all duration-150 min-h-[48px] ${
              userVote === "for"
                ? "bg-green-500 text-white shadow-md"
                : "bg-green-50 text-green-700 border-2 border-green-300 active:scale-95"
            } ${
              isPressed === "for" ? "scale-95" : ""
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting && userVote !== "for" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ThumbsUp size={20} />
            )}
            <span>Puolesta</span>
          </button>

          <button
            onClick={() => handleVote("against")}
            disabled={submitting}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-base transition-all duration-150 min-h-[48px] ${
              userVote === "against"
                ? "bg-red-500 text-white shadow-md"
                : "bg-red-50 text-red-700 border-2 border-red-300 active:scale-95"
            } ${
              isPressed === "against" ? "scale-95" : ""
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting && userVote !== "against" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ThumbsDown size={20} />
            )}
            <span>Vastaan</span>
          </button>
        </div>
      </div>
    </div>
  );
}

