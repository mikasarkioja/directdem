import { z } from "zod";

export const weeklyBulletinEditorModelSchema = z.object({
  impactScores: z
    .array(
      z.object({
        decisionId: z.string(),
        score: z.number().min(1).max(100),
        rationale: z.string(),
      }),
    )
    .max(25)
    .default([]),
  mainStory: z.object({
    headline: z.string(),
    dek: z.string(),
    body: z.string(),
    whyItMatters: z.string(),
  }),
  lobbyistWeek: z.object({
    sectionEyebrow: z.string().optional(),
    leadOrganization: z.string(),
    targetBillLabel: z.string(),
    narrative: z.string(),
    topLobbyists: z
      .array(
        z.object({
          organization: z.string(),
          stance: z.enum(["pro", "contra", "mixed"]),
          metWith: z.string().optional(),
          targetBillOrTopic: z.string(),
          proposalAdoptedIntoBill: z.boolean(),
          summary: z.string(),
        }),
      )
      .max(10)
      .default([]),
  }),
  pulse: z.object({
    summary: z.string(),
    highlights: z
      .array(
        z.object({
          municipalTitle: z.string(),
          nationalTieIn: z.string(),
        }),
      )
      .max(8)
      .default([]),
  }),
  /** Lähteet viitteille [1], [2] tekstissä — vain https/http-URL:t */
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      }),
    )
    .max(35)
    .default([]),
});

export type WeeklyBulletinEditorModel = z.infer<
  typeof weeklyBulletinEditorModelSchema
>;
