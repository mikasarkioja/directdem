# Changelog

All notable changes to this project are documented in this file. The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Documentation:** `DOCS/FEATURE-CATALOG-PRODUCT-MANAGEMENT.md` — full feature inventory and completeness levels for product management (routes, flags, crons, mock caveats).
- **Lobbyist interventions ingestion:** Vaski committee experts (Asiantuntijalausunto) sync writes to `lobbyist_interventions` with `source_type: expert_hearing`, optional `bill_id`, `source_external_id`, and `dedupe_key` for idempotent PostgREST upserts (`lib/lobby/sync-committee-experts-db.ts`, `lib/lobby/upsert-expert-interventions.ts`, `lib/lobby/he-from-finnish-doc.ts`).
- **Lausuntopalvelu batch:** `lib/lobby/sync-lausunto-statements-to-db.ts` upserts `source_type: statement`; `scripts/sync-committee-experts-vaski.ts` sets `LOBBY_TRACE_USE_MOCK=false`, runs expert + lausunto sync, and records `sync_logs` entries including `sync-lobbyist-interventions-ingest`.
- **Migrations:** `20260415120000_lobbyist_interventions_expert_statement.sql` (columns + extended `source_type` check), `20260415130000_lobbyist_dedupe_key_postgrest.sql` (non-partial unique on `dedupe_key` for PostgREST), `20260415140000_bulletin_upsert_indexes_postgrest.sql` (full unique indexes for bulletin feed upserts).
- **Bulletin / editorial:** Gemini editorial magazine flow (`app/actions/bulletin-generator.ts`, `lib/bulletin/editorial-gemini.ts`, `EditorialBulletinMagazine.tsx`), interest cross-reference for `person_interests`, and `scripts/apply-single-migration.ts` for applying a single SQL file when `DATABASE_URL` is available.

### Changed

- **Citizen-first MVP polish:** Feed bill cards emphasize selkokielitiivistelmät (larger type), show passage probability + lobby traceability meters; secondary actions demoted; researcher tools under “Näytä lisää”. Espoo lobby scan uses `extractTextFromPdf` for PDF attachments; per-row error isolation. Weekly legacy report uses `fallbackWeeklyReportData` + softer DB errors + safe render retry. `WeeklyBulletin` email: parliament (blue) vs Espoo (green) panels. Feature flags documented for MVP defaults.
- **`supabase/bulletin-feed-sync-support.sql`:** Unique indexes for `lobbyist_traces`, `decisions`, and `municipal_decisions` are full (not partial `WHERE`) so `upsert` + `onConflict` works with PostgREST.
- **Weekly bulletin editor fetch:** `person_interests` query limit increased to 5000 so large interest tables are included in conflict hints (`lib/bulletin/editor-fetch.ts`).
- **Editorial Gemini prompt:** Explicit instruction when both `lobbyistInterventions` and `committeeExpertInvites` are empty for the period—state no reported expert hearings and empty `topLobbyists`; notes that MP interest linking only flows via `potentialInterestConflicts` when lobby rows exist (`lib/bulletin/editor-gemini.ts`).

### Operations notes

- Prefer `npx supabase db query --linked -f <migration.sql>` when linked CLI is available but `DATABASE_URL` is not in `.env.local`.
- If `npx supabase db push` fails on older migrations, apply new SQL files individually or repair remote migration history as needed.
