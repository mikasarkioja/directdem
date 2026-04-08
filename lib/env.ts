import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional().default("missing"),

  /** Google Gemini (Media Watch -analyysi); mallin nimi: GEMINI_MEDIA_WATCH_MODEL */
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MEDIA_WATCH_MODEL: z.string().optional(),
  /** Viikkobulletiinin editor (generateWeeklyBulletin); oletus koodissa gemini-3-flash-preview */
  GEMINI_BULLETIN_MODEL: z.string().optional(),
  /** Kansalaissyötteen päiväyhteenveto (dashboard); oletus gemini-3-flash-preview */
  GEMINI_CITIZEN_PULSE_MODEL: z.string().optional(),

  /** Cron-reitit (Authorization: Bearer …) */
  CRON_SECRET: z.string().optional(),

  // Feature Flags
  NEXT_PUBLIC_XP_SYSTEM_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_RESEARCHER_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_PULSE_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_ECONOMY_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_ARENA_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_INTELLIGENCE_FEED_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_WEEKLY_BULLETIN_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_ESPOO_DYNASTY_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_PREDICTIVE_MODELS_ENABLED: z.string().optional().default("false"),
  NEXT_PUBLIC_MP_DNA_ANALYTICS_ENABLED: z.string().optional().default("false"),

  // AI Configuration
  ENABLE_AUTO_AI: z.string().optional().default("false"),

  // Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

// Check if we are on the server or client
const isServer = typeof window === "undefined";

/**
 * Validates environment variables.
 * On the client, it only validates variables prefixed with NEXT_PUBLIC_.
 */
export const validateEnv = () => {
  // During build time on Vercel, some variables might be missing.
  // We want to avoid crashing the build.
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.CI === "true";

  // SANITIZE process.env to remove hidden characters like \r or \n
  const rawEnv = process.env;
  const sanitizedEnv: Record<string, string | undefined> = {};
  Object.keys(rawEnv).forEach((key) => {
    const val = rawEnv[key];
    sanitizedEnv[key] =
      typeof val === "string" ? val.trim().replace(/[\r\n]/g, "") : val;
  });

  try {
    if (isServer) {
      const parsed = envSchema.safeParse(sanitizedEnv);
      if (!parsed.success) {
        if (isBuild) {
          console.warn(
            "⚠️ Build-time environment validation failed. Providing safe fallbacks for missing keys.",
          );
          // Create result object safely to avoid duplicate key errors in literal
          const buildEnv = { ...sanitizedEnv } as any;
          buildEnv.NEXT_PUBLIC_SUPABASE_URL =
            buildEnv.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000";
          buildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY =
            buildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing";
          buildEnv.SUPABASE_SERVICE_ROLE_KEY =
            buildEnv.SUPABASE_SERVICE_ROLE_KEY || "missing";
          buildEnv.OPENAI_API_KEY = buildEnv.OPENAI_API_KEY || "missing";
          buildEnv.NODE_ENV = buildEnv.NODE_ENV || "production";
          return buildEnv;
        }
        throw parsed.error;
      }
      return parsed.data;
    } else {
      // Client-side validation for NEXT_PUBLIC_ variables only
      const clientSchema = envSchema.pick({
        NEXT_PUBLIC_SUPABASE_URL: true,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
        NEXT_PUBLIC_XP_SYSTEM_ENABLED: true,
        NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED: true,
        NEXT_PUBLIC_RESEARCHER_ENABLED: true,
        NEXT_PUBLIC_PULSE_ENABLED: true,
        NEXT_PUBLIC_ECONOMY_ENABLED: true,
        NEXT_PUBLIC_ARENA_ENABLED: true,
        NEXT_PUBLIC_INTELLIGENCE_FEED_ENABLED: true,
        NEXT_PUBLIC_WEEKLY_BULLETIN_ENABLED: true,
        NEXT_PUBLIC_ESPOO_DYNASTY_ENABLED: true,
        NEXT_PUBLIC_PREDICTIVE_MODELS_ENABLED: true,
        NEXT_PUBLIC_MP_DNA_ANALYTICS_ENABLED: true,
      });

      const parsed = clientSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: sanitizedEnv.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          sanitizedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_XP_SYSTEM_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_XP_SYSTEM_ENABLED,
        NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED,
        NEXT_PUBLIC_RESEARCHER_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_RESEARCHER_ENABLED,
        NEXT_PUBLIC_PULSE_ENABLED: sanitizedEnv.NEXT_PUBLIC_PULSE_ENABLED,
        NEXT_PUBLIC_ECONOMY_ENABLED: sanitizedEnv.NEXT_PUBLIC_ECONOMY_ENABLED,
        NEXT_PUBLIC_ARENA_ENABLED: sanitizedEnv.NEXT_PUBLIC_ARENA_ENABLED,
        NEXT_PUBLIC_INTELLIGENCE_FEED_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_INTELLIGENCE_FEED_ENABLED,
        NEXT_PUBLIC_WEEKLY_BULLETIN_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_WEEKLY_BULLETIN_ENABLED,
        NEXT_PUBLIC_ESPOO_DYNASTY_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_ESPOO_DYNASTY_ENABLED,
        NEXT_PUBLIC_PREDICTIVE_MODELS_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_PREDICTIVE_MODELS_ENABLED,
        NEXT_PUBLIC_MP_DNA_ANALYTICS_ENABLED:
          sanitizedEnv.NEXT_PUBLIC_MP_DNA_ANALYTICS_ENABLED,
      });

      if (!parsed.success) {
        console.warn("⚠️ Client-side environment validation failed.");
        return sanitizedEnv as any;
      }
      return parsed.data;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingKeys = error.errors
        .map((err) => err.path.join("."))
        .join(", ");
      console.error(`❌ Invalid environment variables: ${missingKeys}`);

      if (process.env.NODE_ENV === "development" && !isBuild) {
        throw new Error(
          `Missing or invalid environment variables: ${missingKeys}`,
        );
      }
    }
    return sanitizedEnv as any;
  }
};

export const env = validateEnv();
