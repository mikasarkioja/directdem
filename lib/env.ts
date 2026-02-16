import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),

  // Feature Flags
  NEXT_PUBLIC_XP_SYSTEM_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_RESEARCHER_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_PULSE_ENABLED: z.string().optional().default("true"),
  NEXT_PUBLIC_ECONOMY_ENABLED: z.string().optional().default("true"),

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
  try {
    if (isServer) {
      return envSchema.parse(process.env);
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
      });

      return clientSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_XP_SYSTEM_ENABLED:
          process.env.NEXT_PUBLIC_XP_SYSTEM_ENABLED,
        NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED:
          process.env.NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED,
        NEXT_PUBLIC_RESEARCHER_ENABLED:
          process.env.NEXT_PUBLIC_RESEARCHER_ENABLED,
        NEXT_PUBLIC_PULSE_ENABLED: process.env.NEXT_PUBLIC_PULSE_ENABLED,
        NEXT_PUBLIC_ECONOMY_ENABLED: process.env.NEXT_PUBLIC_ECONOMY_ENABLED,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingKeys = error.errors
        .map((err) => err.path.join("."))
        .join(", ");
      console.error(`❌ Invalid environment variables: ${missingKeys}`);

      // In production, we don't want to crash the whole app if a non-critical key is missing,
      // but in development, we want to know immediately.
      if (process.env.NODE_ENV === "development") {
        throw new Error(
          `Missing or invalid environment variables: ${missingKeys}`,
        );
      }
    }
    return process.env as any;
  }
};

export const env = validateEnv();
