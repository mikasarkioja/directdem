export interface FeatureFlags {
  ARENA_ENABLED: boolean;
  ECONOMY_ENABLED: boolean;
  RESEARCHER_ENABLED: boolean;
  MUNICIPAL_WATCH_ENABLED: boolean;
  PULSE_ENABLED: boolean;
  INTELLIGENCE_FEED_ENABLED: boolean;
  XP_SYSTEM_ENABLED: boolean;
}

export const FEATURES: FeatureFlags = {
  ARENA_ENABLED: true,
  ECONOMY_ENABLED: false, // Esim. poissa käytöstä tässä vaiheessa
  RESEARCHER_ENABLED: true,
  MUNICIPAL_WATCH_ENABLED: true,
  PULSE_ENABLED: true,
  INTELLIGENCE_FEED_ENABLED: true,
  XP_SYSTEM_ENABLED: true,
};

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature];
}
