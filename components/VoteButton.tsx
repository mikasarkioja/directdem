"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Minus, Loader2 } from "lucide-react";
import { submitVote, getUserVote, getVoteStats } from "@/app/actions/votes";
import { createClient } from "@/lib/supabase/client";

interface VoteButtonProps {
  billId: string;
  onVoteChange?: () => void;
}

export default function VoteButton({ billId, onVoteChange }: VoteButtonProps) {
  const [userVote, setUserVote] = useState<"for" | "against" | "neutral" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPressed, setIsPressed] = useState<"for" | "against" | "neutral" | null>(null);

  useEffect(() => {
    async function loadUserAndVote() {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const vote = await getUserVote(billId);
        setUserVote(vote);
      }
      setLoading(false);
    }
    loadUserAndVote();
  }, [billId]);

  const handleVote = async (position: "for" | "against" | "neutral") => {
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-nordic-dark">
        <Loader2 size={16} className="animate-spin" />
        <span>Ladataan...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-nordic-light rounded-lg border border-nordic-gray">
        <p className="text-sm text-nordic-dark">
          Kirjaudu sisään äänestääksesi tästä lakiesityksestä
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-nordic-darker">Sinun äänesi:</p>
      <div className="flex gap-3">
        <button
          onClick={() => handleVote("for")}
          disabled={submitting}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
            userVote === "for"
              ? "bg-green-500 text-white"
              : "bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-300 active:scale-95"
          } ${
            isPressed === "for" ? "scale-95" : ""
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {submitting && userVote !== "for" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ThumbsUp size={18} />
          )}
          <span>Puolesta</span>
        </button>

        <button
          onClick={() => handleVote("neutral")}
          disabled={submitting}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
            userVote === "neutral"
              ? "bg-gray-500 text-white"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-300 active:scale-95"
          } ${
            isPressed === "neutral" ? "scale-95" : ""
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {submitting && userVote !== "neutral" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Minus size={18} />
          )}
          <span>Neutraali</span>
        </button>

        <button
          onClick={() => handleVote("against")}
          disabled={submitting}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
            userVote === "against"
              ? "bg-red-500 text-white"
              : "bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-300 active:scale-95"
          } ${
            isPressed === "against" ? "scale-95" : ""
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {submitting && userVote !== "against" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ThumbsDown size={18} />
          )}
          <span>Vastaan</span>
        </button>
      </div>
      {userVote && (
        <p className="text-xs text-nordic-dark text-center">
          Äänesi on tallennettu. Voit muuttaa sitä milloin tahansa.
        </p>
      )}
    </div>
  );
}

