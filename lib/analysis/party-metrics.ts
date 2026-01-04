// lib/analysis/party-metrics.ts

export interface PartyMetrics {
  name: string;
  cohesion: number; // Rice Index: 0-100
  polarization: number; // Distance from parliament median
  topicOwnership: Record<string, number>; // Category -> Score
  pivotScore: number; // Flip-flop percentage
  mpCount: number;
}

export interface ParliamentStats {
  medianDNA: {
    economic: number;
    liberal: number;
    env: number;
    urban: number;
    global: number;
    security: number;
  };
  topDisciplined: { name: string; score: number }[];
  topFlipFlops: { name: string; score: number }[];
  categoryOwners: Record<string, { party: string; score: number }>;
}

