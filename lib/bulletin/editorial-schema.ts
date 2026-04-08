import { z } from "zod";

/** Yksittäisen tapahtuman AI-vaikutuspisteet (1–100). */
export const editorialEventScoreSchema = z.object({
  eventRef: z.string(),
  eventType: z.enum([
    "parliament_decision",
    "espoo_decision",
    "lobby_intervention",
    "committee_expert",
    "media_match",
  ]),
  impactScore: z.number().min(1).max(100),
  label: z.string(),
});

export const editorialLobbySpotlightEntrySchema = z.object({
  organization: z.string(),
  stance: z.enum(["pro", "contra", "mixed"]),
  alignmentWithOutcome: z.enum(["aligned", "partially", "opposed", "unclear"]),
  /** Sidonnaisuus / person_interests -signaali */
  conflictIndicator: z.boolean(),
  conflictNote: z.string().optional(),
  summary: z.string(),
});

export const editorialBulletinModelSchema = z.object({
  eventScores: z.array(editorialEventScoreSchema).max(40).default([]),
  leadStory: z.object({
    headline: z.string(),
    dek: z.string(),
    /** Narratiivinen leipäteksti; viitteet [1], [2] viittaavat sources-taulukkoon */
    body: z.string(),
    /** Johtolauseiden keskiarvo tai ylin ≥ 71 -tason tapahtuma */
    aggregateImpactScore: z.number().min(1).max(100),
  }),
  lobbySpotlight: z.object({
    headline: z.string(),
    /** Narratiivi vaikuttajista ja päätöskäänteestä */
    body: z.string(),
    topLobbyists: z
      .array(editorialLobbySpotlightEntrySchema)
      .max(12)
      .default([]),
  }),
  nutshell: z.object({
    headline: z.string(),
    /** Selkokieli: pienemmät, silti relevantit kansalliset ja paikalliset tapahtumat */
    body: z.string(),
  }),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      }),
    )
    .max(40)
    .default([]),
});

export type EditorialBulletinModel = z.infer<
  typeof editorialBulletinModelSchema
>;
export type EditorialEventScore = z.infer<typeof editorialEventScoreSchema>;
export type EditorialLobbySpotlightEntry = z.infer<
  typeof editorialLobbySpotlightEntrySchema
>;
