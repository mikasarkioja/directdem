// lib/actions/promise-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { IntegrityAlert } from "@/lib/types";

export async function getIntegrityAlertsForEvent(eventId: string): Promise<IntegrityAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('integrity_alerts')
    .select('*')
    .eq('event_id', eventId);

  if (error || !data) return [];
  return data as IntegrityAlert[];
}

export async function getUserFollowedAlerts(userId: string): Promise<any[]> {
  const supabase = await createClient();
  
  // 1. Get followed MPs
  const { data: follows } = await supabase
    .from('user_follows')
    .select('mp_id')
    .eq('user_id', userId);

  if (!follows || follows.length === 0) return [];
  const mpIds = follows.map(f => f.mp_id);

  // 2. Get alerts for these MPs
  const { data: alerts } = await supabase
    .from('integrity_alerts')
    .select(`
      *,
      mps ( first_name, last_name, party ),
      voting_events ( title_fi )
    `)
    .in('mp_id', mpIds)
    .order('created_at', { ascending: false });

  return alerts || [];
}

export async function followMP(userId: string, mpId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_follows')
    .upsert({ user_id: userId, mp_id: mpId }, { onConflict: 'user_id,mp_id' });
  return { success: !error };
}

export async function unfollowMP(userId: string, mpId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('user_id', userId)
    .eq('mp_id', mpId);
  return { success: !error };
}

