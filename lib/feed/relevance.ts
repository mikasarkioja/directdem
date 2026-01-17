import { PoliticalVector } from "../ai/tagger";

export interface RelevanceResult {
  score: number; // 0.0 to 1.0
  alignments: string[]; // Axes where user and item are aligned
  conflicts: string[];  // Axes where user and item are in conflict
  dominantAxis?: string;
}

/**
 * Calculates a relevance score between a user's political DNA and a feed item's vector.
 * Focuses on axes where the user has strong opinions (abs values near 1.0).
 */
export function calculateFeedRelevance(userDna: any, itemVector: PoliticalVector): RelevanceResult {
  if (!userDna || !itemVector) {
    return { score: 0.5, alignments: [], conflicts: [] };
  }

  const axes = [
    { key: 'economic', label: 'Talous' },
    { key: 'values', label: 'Arvot' },
    { key: 'environment', label: 'Ympäristö' },
    { key: 'regions', label: 'Alueet' },
    { key: 'globalism', label: 'Globalismi' },
    { key: 'security', label: 'Turvallisuus' }
  ];

  let totalWeight = 0;
  let weightedScore = 0;
  const alignments: string[] = [];
  const conflicts: string[] = [];

  // Mapping DNA score names to Vector keys if they differ
  const dnaMap: Record<string, string> = {
    economic: 'economic_score',
    values: 'liberal_conservative_score',
    environment: 'environmental_score',
    regions: 'urban_rural_score',
    globalism: 'international_national_score',
    security: 'security_score'
  };

  axes.forEach(axis => {
    const userValue = userDna[dnaMap[axis.key]] || 0;
    const itemValue = itemVector[axis.key as keyof PoliticalVector] || 0;

    // Weight is the strength of user's opinion (0 to 1)
    const weight = Math.abs(userValue);
    
    if (weight > 0.1 && Math.abs(itemValue) > 0.1) {
      // If same sign, they align. If different, they conflict.
      const isAligned = (userValue > 0 && itemValue > 0) || (userValue < 0 && itemValue < 0);
      
      if (isAligned) {
        alignments.push(axis.label);
        // Add to score based on alignment strength
        weightedScore += weight * (1 - Math.abs(userValue - itemValue) / 2);
      } else {
        conflicts.push(axis.label);
        // Conflict doesn't necessarily mean zero relevance, but it's "noteworthy"
        weightedScore += weight * (Math.abs(userValue - itemValue) / 4);
      }
      
      totalWeight += weight;
    }
  });

  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0.5;

  return {
    score: Math.min(Math.max(finalScore, 0), 1),
    alignments,
    conflicts,
    dominantAxis: alignments[0] || conflicts[0]
  };
}


