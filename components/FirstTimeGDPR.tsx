"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GDPRRegistration from "./GDPRRegistration";
import { createClient } from "@/lib/supabase/client";
import { upsertUserProfile } from "@/app/actions/auth";

interface FirstTimeGDPRProps {
  userId: string;
}

export default function FirstTimeGDPR({ userId }: FirstTimeGDPRProps) {
  const [showGDPR, setShowGDPR] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkGDPRAcceptance() {
      // Check if user has accepted terms
      const { data: profile } = await supabase
        .from("profiles")
        .select("accepted_terms")
        .eq("id", userId)
        .single();

      if (!profile?.accepted_terms) {
        setShowGDPR(true);
      }
    }

    checkGDPRAcceptance();
  }, [userId]);

  const handleAccept = async () => {
    try {
      await upsertUserProfile(userId, {
        accepted_terms: true,
        terms_accepted_at: new Date().toISOString(),
      });
      setShowGDPR(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to save GDPR acceptance:", error);
    }
  };

  const handleDecline = () => {
    // Sign out user if they decline
    supabase.auth.signOut();
    router.push("/");
  };

  if (!showGDPR) {
    return null;
  }

  return <GDPRRegistration onAccept={handleAccept} onDecline={handleDecline} />;
}

