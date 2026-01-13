/**
 * Shared TypeScript type definitions for the DirectDem platform
 */

// Bill types
export type BillStatus = "draft" | "in_progress" | "voting" | "passed" | "rejected";

export interface Bill {
  id: string;
  title: string;
  summary: string;
  rawText?: string;
  parliamentId?: string;
  status: BillStatus;
  citizenPulse: {
    for: number;
    against: number;
  };
  politicalReality: {
    party: string;
    position: "for" | "against" | "abstain";
    seats: number;
  }[];
  category?: string;
  publishedDate?: string;
  processingDate?: string;
  url?: string;
}

// Municipal Case types
export type MunicipalCaseStatus = "agenda" | "decided" | "appealed" | "cancelled";

export interface MunicipalCase {
  id: string;
  municipality: string;
  externalId: string;
  title: string;
  summary: string;
  rawText?: string;
  status: MunicipalCaseStatus;
  meetingDate?: string;
  orgName?: string;
  neighborhood?: string;
  costEstimate?: number;
  category?: string;
  url?: string;
  citizenPulse: {
    for: number;
    against: number;
  };
}

// Vote types
export type VotePosition = "for" | "against" | "neutral";

export interface VoteStats {
  for_count: number;
  against_count: number;
  neutral_count: number;
  total_count: number;
  for_percent: number;
  against_percent: number;
  neutral_percent: number;
}

// User profile types
export type LensMode = "national" | "helsinki" | "espoo" | "vantaa";

export interface ArchetypePoints {
  active: number;
  fact_checker: number;
  mediator: number;
  reformer: number;
  local_hero: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  is_verified?: boolean;
  vaalipiiri?: string;
  municipality?: string;
  last_login?: string;
  gdpr_consent?: boolean;
  gdpr_consent_date?: string;
  join_report_list?: boolean;
  is_admin?: boolean;
  is_guest?: boolean;
  active_role?: 'citizen' | 'shadow_mp' | 'researcher';
  researcher_type?: 'academic' | 'journalist' | 'policy_expert' | 'strategist';
  researcher_focus?: string[];
  researcher_initialized?: boolean;
  current_archetype?: string;
  dna_level?: number;
  impact_points?: number;
  credits?: number;
  subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled';
  plan_type?: 'free' | 'premium' | 'enterprise';
  stripe_customer_id?: string;
  xp?: number;
  level?: number;
  committee_assignment?: string;
  shadow_id_number?: string;
  rank_title?: string;
  rank_level?: number;
  expertise_points?: number;
  shadow_id_url?: string;
  economic_score?: number;
  liberal_conservative_score?: number;
  environmental_score?: number;
  urban_rural_score?: number;
  international_national_score?: number;
  security_score?: number;
  initialized_from_mp?: string;
  trust_score?: number;
  organization_tag?: string;
}

// Party stance types
export type PartyStance = "PRO" | "AGAINST" | "ABSTAIN" | "UNKNOWN";

export interface PartyStanceData {
  party: string;
  stance: PartyStance;
  confidence: number; // 0-1
  source?: string;
}

// MP types
export interface SupabaseMP {
  id: number;
  first_name: string;
  last_name: string;
  party: string;
  constituency: string | null;
  hometown?: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SupabaseMPAIProfile {
  mp_id: string;
  voting_summary: any[];
  promise_data: any;
  rhetoric_style: any;
  system_prompt: string;
  conflicts: any[];
  updated_at: string;
  last_speech_sync: string | null;
  debate_instructions: string | null;
  lobbyist_meetings: any[];
  affiliations: any[];
  current_sentiment: string | null;
  regional_bias: string | null;
}

// Supabase database types (matching schema)
export interface SupabaseBill {
  id: string;
  parliament_id: string | null;
  title: string;
  summary: string | null;
  raw_text: string | null;
  status: string;
  category: string | null;
  published_date: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseVote {
  id: string;
  bill_id: string;
  user_id: string | null; // null after anonymization
  position: VotePosition;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProfile {
  id: string;
  full_name: string | null;
  is_verified: boolean;
  vaalipiiri: string | null;
  municipality: string | null;
  last_login: string | null;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  join_report_list: boolean;
  email: string | null;
  is_admin: boolean;
  economic_score: number | null;
  liberal_conservative_score: number | null;
  environmental_score: number | null;
  urban_rural_score: number | null;
  international_national_score: number | null;
  security_score: number | null;
  initialized_from_mp: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseMunicipalCase {
  id: string;
  municipality: string;
  external_id: string;
  title: string;
  summary: string | null;
  raw_text: string | null;
  status: string;
  meeting_date: string | null;
  org_name: string | null;
  neighborhood: string | null;
  cost_estimate: number | null;
  category: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

// Virtual Party types
export interface VirtualParty {
  id: string;
  name: string;
  manifesto: string | null;
  logo_url: string | null;
  created_by: string;
  total_xp: number;
  level: number;
  dna_profile_avg: ArchetypePoints;
  memberCount?: number;
  matchScore?: number;
}

export interface PartyMember {
  party_id: string;
  user_id: string;
  role: 'founder' | 'member';
  joined_at: string;
}

export interface DebateParticipant {
  party: VirtualParty;
  representativeName: string;
}

// Dashboard view types
export type DashboardView = "overview" | "bills" | "municipal" | "consensus" | "profile" | "parties" | "debate" | "ranking" | "analysis" | "workspace" | "arena" | "kuntavahti" | "researcher";

// API Test types
export interface TestResult {
  name: string;
  url: string;
  status: number;
  statusText: string;
  success: boolean;
  data?: any;
  error?: string;
  contentType?: string;
}

export interface IntegrityAlert {
  id: string;
  mp_id: number;
  event_id: string;
  category: string;
  promise_value: number;
  vote_type: string;
  deviation_score: number;
  severity: 'low' | 'medium' | 'high';
  reasoning?: string;
  created_at: string;
}

export interface BillUserSubmission {
  id: string;
  bill_id: string;
  user_id: string;
  stance: "pro" | "con" | "neutral";
  justification: string;
  focus_area: string;
  created_at: string;
}

export interface BillTask {
  id: string;
  bill_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  assigned_to?: string;
  created_at: string;
}

export interface BillSection {
  id: string;
  bill_id: string;
  section_number: string;
  title: string;
  content: string;
  current_shadow_text?: string;
  real_final_text?: string;
  order_index: number;
}

export interface BillAmendment {
  id: string;
  bill_id: string;
  section_id?: string;
  section_title: string;
  original_text?: string;
  proposed_text: string;
  justification?: string;
  author_id: string;
  votes_for: number;
  votes_against: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface UserImpactCitation {
  id: string;
  user_id: string;
  bill_id: string;
  mp_name: string;
  mp_speech_snippet: string;
  impact_explanation: string;
  matched_argument: string;
  created_at: string;
}

export interface PulseQuestion {
  id: string;
  question: string;
  municipality?: string;
  category: "Talous" | "Arvot" | "Ympäristö" | "Aluepolitiikka" | "Kansainvälisyys" | "Turvallisuus";
  context: "national" | "municipal";
  impact_vector: Record<string, number>; // e.g. { economic_score: 0.1 }
}

export interface LobbyistStats {
  organization_name: string;
  influence_index: number;
  bills_count: number;
  direct_contacts: number;
  main_committee: string;
}


