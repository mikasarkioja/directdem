"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches all user profile data and votes for export
 */
export async function getUserDataForExport(): Promise<{
  success: boolean;
  data?: {
    profile: any;
    votes: any[];
  };
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sinun täytyy olla kirjautunut ladataksesi tietosi",
    };
  }

  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[getUserDataForExport] Profile error:", profileError);
      return {
        success: false,
        error: `Profiilin haku epäonnistui: ${profileError.message}`,
      };
    }

    // Fetch all votes with bill information
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select(`
        id,
        position,
        created_at,
        updated_at,
        bills!inner (
          id,
          title,
          parliament_id,
          summary,
          status,
          category,
          published_date
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (votesError) {
      console.error("[getUserDataForExport] Votes error:", votesError);
      return {
        success: false,
        error: `Äänestysten haku epäonnistui: ${votesError.message}`,
      };
    }

    return {
      success: true,
      data: {
        profile: {
          id: profile.id,
          email: user.email,
          full_name: profile.full_name,
          is_verified: profile.is_verified,
          vaalipiiri: profile.vaalipiiri,
          last_login: profile.last_login,
          gdpr_consent: profile.gdpr_consent,
          gdpr_consent_date: profile.gdpr_consent_date,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        votes: (votes || []).map((vote: any) => {
          const bill = Array.isArray(vote.bills) ? vote.bills[0] : vote.bills;
          return {
            id: vote.id,
            position: vote.position,
            created_at: vote.created_at,
            updated_at: vote.updated_at,
            bill: {
              id: bill?.id,
              title: bill?.title,
              parliament_id: bill?.parliament_id,
              summary: bill?.summary,
              status: bill?.status,
              category: bill?.category,
              published_date: bill?.published_date,
            },
          };
        }),
      },
    };
  } catch (error: any) {
    console.error("[getUserDataForExport] Error:", error);
    return {
      success: false,
      error: error.message || "Tuntematon virhe tietojen haussa",
    };
  }
}

/**
 * Updates user's report list participation status
 */
export async function updateReportListParticipation(joinReportList: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sinun täytyy olla kirjautunut päivittääksesi raportointiasetuksia",
    };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ join_report_list: joinReportList })
      .eq("id", user.id);

    if (error) {
      console.error("[updateReportListParticipation] Error:", error);
      return {
        success: false,
        error: `Raportointiasetuksen päivitys epäonnistui: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[updateReportListParticipation] Error:", error);
    return {
      success: false,
      error: error.message || "Tuntematon virhe",
    };
  }
}

/**
 * Updates user's electoral district (vaalipiiri)
 */
export async function updateVaalipiiri(vaalipiiri: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sinun täytyy olla kirjautunut päivittääksesi vaalipiiriä",
    };
  }

  // Validate vaalipiiri (must be one of the 13 districts)
  const validDistricts = [
    "Helsinki",
    "Uusimaa",
    "Varsinais-Suomi",
    "Satakunta",
    "Ahvenanmaa",
    "Häme",
    "Pirkanmaa",
    "Kaakkois-Suomi",
    "Savo-Karjala",
    "Vaasa",
    "Keski-Suomi",
    "Oulu",
    "Lappi",
  ];

  if (!validDistricts.includes(vaalipiiri)) {
    return {
      success: false,
      error: "Virheellinen vaalipiiri",
    };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ vaalipiiri })
      .eq("id", user.id);

    if (error) {
      console.error("[updateVaalipiiri] Error:", error);
      return {
        success: false,
        error: `Vaalipiirin päivitys epäonnistui: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[updateVaalipiiri] Error:", error);
    return {
      success: false,
      error: error.message || "Tuntematon virhe",
    };
  }
}

