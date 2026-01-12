import { createAdminClient } from "@/lib/supabase/server";

/**
 * lib/researcher/influence-stats.ts
 * Logic for aggregating lobbyist influence data.
 */

export interface LobbyistStats {
  organization_name: string;
  influence_index: number;
  bills_count: number;
  direct_contacts: number;
  main_committee: string;
}

export async function calculateInfluenceStats() {
  const supabase = await createAdminClient();

  // 1. Fetch impact analyses
  const { data: analyses } = await supabase
    .from("lobbyist_impact_analysis")
    .select(`
      organization_name,
      impact_score,
      bill_id,
      bills (
        id,
        category,
        title
      )
    `);

  // 2. Fetch meeting data for weighting
  const { data: meetings } = await supabase
    .from("lobbyist_meetings")
    .select("organization_name, bill_id, is_committee_lead");

  if (!analyses) return [];

  // 3. Aggregate
  const statsMap: Record<string, {
    total_score: number;
    bills: Set<string>;
    categories: Record<string, number>;
    direct_contacts: number;
  }> = {};

  analyses.forEach((item) => {
    const org = item.organization_name;
    const impact = (item.impact_score || 0) / 100;
    const bill = item.bills as any;
    
    // Calculate Meeting Multiplier (M)
    const orgMeetings = meetings?.filter(m => m.organization_name === org && m.bill_id === item.bill_id) || [];
    let multiplier = 1.0;
    
    if (orgMeetings.length > 0) {
      multiplier = 1.2; // Base contact bonus
      if (orgMeetings.some(m => m.is_committee_lead)) {
        multiplier = 1.5; // Lead contact bonus
      }
    }

    const complexity = bill?.category === 'Talous' ? 10 : 5;

    if (!statsMap[org]) {
      statsMap[org] = { total_score: 0, bills: new Set(), categories: {}, direct_contacts: 0 };
    }

    statsMap[org].total_score += (impact * complexity * multiplier);
    statsMap[org].bills.add(bill?.id || 'unknown');
    statsMap[org].direct_contacts += orgMeetings.length;
    
    const cat = bill?.category || 'Yleinen';
    statsMap[org].categories[cat] = (statsMap[org].categories[cat] || 0) + 1;
  });

  return Object.entries(statsMap).map(([org, data]) => ({
    organization_name: org,
    influence_index: parseFloat(data.total_score.toFixed(2)),
    bills_count: data.bills.size,
    direct_contacts: data.direct_contacts,
    main_committee: Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ei tiedossa'
  })).sort((a, b) => b.influence_index - a.influence_index);
}

