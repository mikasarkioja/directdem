# Lobbyist traceability (Eduskuntavahti / Omatase)

## Folder structure

| Path                                                 | Role                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `supabase/lobbyist-interventions-schema.sql`         | `legislative_projects`, `lobbyist_interventions`, RLS, indexes |
| `lib/lobby/types.ts`                                 | Zod schema for LLM output, shared TS types                     |
| `lib/lobby/collect-sources.ts`                       | Orchestrates lausunto + avoimuus collectors                    |
| `lib/lobby/collectors/lausuntopalvelu.ts`            | Lausuntopalvelu.fi HTML discovery (extend with official API)   |
| `lib/lobby/collectors/avoimuusrekisteri.ts`          | Avoimuusrekisteri API attempts (paths from Swagger)            |
| `lib/lobby/llm-stance.ts`                            | OpenAI structured JSON → validated stance object               |
| `app/actions/lobbyist-traceability.ts`               | `fetchAndAnalyzeLobbyists`, reads, admin gate                  |
| `components/lobby/LobbyistBattleground.tsx`          | Citizen UI: pro vs con columns                                 |
| `components/ui/card.tsx`, `components/ui/button.tsx` | Lightweight shadcn-style primitives                            |
| `lib/utils/cn.ts`                                    | `className` helper                                             |

## Environment

- `LOBBY_TRACE_USE_MOCK=true` – injects opposing mock sources (EK vs SAK style) when live scraping/API returns nothing.
- `LOBBY_TRACE_AVOIMUUS_OFF=true` – suppresses “no rows” info log noise.
- `AVOIMUUSREKISTERI_API_BASE` – override API host (default `https://public.api.avoimuusrekisteri.fi`).
- `AVOIMUUSREKISTERI_API_TOKEN` – optional bearer token if required by deployment.

## Applying the migration

Run `supabase/lobbyist-interventions-schema.sql` in the Supabase SQL editor (or your migration pipeline) before relying on the server action.
