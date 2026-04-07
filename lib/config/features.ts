export interface FeatureFlags {
  ARENA_ENABLED: boolean;
  ECONOMY_ENABLED: boolean;
  RESEARCHER_ENABLED: boolean;
  MUNICIPAL_WATCH_ENABLED: boolean;
  MEDIA_WATCH_ENABLED: boolean;
  PULSE_ENABLED: boolean;
  INTELLIGENCE_FEED_ENABLED: boolean;
  XP_SYSTEM_ENABLED: boolean;
  WEEKLY_BULLETIN_ENABLED: boolean;
  ESPOO_DYNASTY_ENABLED: boolean;
  PREDICTIVE_MODELS_ENABLED: boolean;
  MP_DNA_ANALYTICS_ENABLED: boolean;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export const FEATURES: FeatureFlags = {
  ARENA_ENABLED: toBool(process.env.NEXT_PUBLIC_ARENA_ENABLED, true),
  ECONOMY_ENABLED: toBool(process.env.NEXT_PUBLIC_ECONOMY_ENABLED, false),
  RESEARCHER_ENABLED: toBool(process.env.NEXT_PUBLIC_RESEARCHER_ENABLED, true),
  MUNICIPAL_WATCH_ENABLED: toBool(
    process.env.NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED,
    true,
  ),
  MEDIA_WATCH_ENABLED: toBool(
    process.env.NEXT_PUBLIC_MEDIA_WATCH_ENABLED,
    true,
  ),
  PULSE_ENABLED: toBool(process.env.NEXT_PUBLIC_PULSE_ENABLED, true),
  INTELLIGENCE_FEED_ENABLED: toBool(
    process.env.NEXT_PUBLIC_INTELLIGENCE_FEED_ENABLED,
    true,
  ),
  XP_SYSTEM_ENABLED: toBool(process.env.NEXT_PUBLIC_XP_SYSTEM_ENABLED, true),
  WEEKLY_BULLETIN_ENABLED: toBool(
    process.env.NEXT_PUBLIC_WEEKLY_BULLETIN_ENABLED,
    true,
  ),
  ESPOO_DYNASTY_ENABLED: toBool(
    process.env.NEXT_PUBLIC_ESPOO_DYNASTY_ENABLED,
    true,
  ),
  PREDICTIVE_MODELS_ENABLED: toBool(
    process.env.NEXT_PUBLIC_PREDICTIVE_MODELS_ENABLED,
    false,
  ),
  MP_DNA_ANALYTICS_ENABLED: toBool(
    process.env.NEXT_PUBLIC_MP_DNA_ANALYTICS_ENABLED,
    false,
  ),
};

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature];
}
