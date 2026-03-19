# Auth & Identity Audit — The Sentinel

**Date:** 2025-03-17  
**Scope:** Next.js 15 + Supabase authentication and authorization.

---

## 1. Middleware sync

**File:** `lib/supabase/middleware.ts` (used by root `middleware.ts`)

**Findings:**

- Session refresh is done via `await supabase.auth.getUser()`, which triggers Supabase to refresh the session and call `setAll()` when the token is expired. **Correct.**
- Response headers/cookies are passed back correctly:
  - On normal continuation, `supabaseResponse` is the same object that was updated inside `setAll()` (recreated with `NextResponse.next({ request })` and all cookies merged). **Good.**
  - On redirect to `/dashboard` or `/login`, cookies are explicitly copied from `supabaseResponse` to the redirect response. **Good.**

**Desync risk:** **Low.** Middleware cookie handling is consistent. The main desync risk was in the auth callback (see below), not in middleware.

**Optional hardening:** Ensure `request.cookies.set()` in `setAll` is not overwritten by later middleware; currently it only runs when Supabase refreshes, and the response is built from the same flow.

---

## 2. Client / server client creation

**Files:** `lib/supabase/server.ts`, `lib/supabase/client.ts`

**Findings:**

- **Server (`server.ts`):** Uses `createServerClient` from `@supabase/ssr` and `await cookies()` from `next/headers`. **Next.js 15–correct.** No use of deprecated `@supabase/auth-helpers-nextjs`.
- **Client (`client.ts`):** Uses `createBrowserClient` from `@supabase/ssr`. **Correct.** No auth-helpers.
- Cookie options are aligned: `sameSite: "lax"`, `path: "/"`, `secure` in production.

**Desync risk:** **None** from client creation. Both use the current Supabase SSR package and Next.js 15 cookies API.

---

## 3. Server action security

**Rule:** Every server action that touches user-specific data must call `await supabase.auth.getUser()` at the start and use that identity. Any action that takes `userId` from the client is a **data leakage / privilege escalation risk** unless it only uses it for non-sensitive, RLS-protected reads.

**Fixed (critical):**

- **`app/actions/auth.ts`**
  - `syncProfile(userId: string)` — **was:** trusted client-passed `userId`. **Now:** `syncProfile()` with no args; uses `supabase.auth.getUser()` and `user.id` only.
  - `upsertUserProfile(userId: string, data)` — **was:** same. **Now:** `upsertUserProfile(data)`; uses `getUser()` and `user.id` only.
  - Call sites updated: `components/FirstTimeGDPR.tsx`, `app/dashboard/DashboardClient.tsx`.

**Flagged (review / harden):**

- **`app/actions/match-alignment.ts`:** `getPartyAlignment(userId: string)` takes `userId` from the client. **Mitigation:** RLS on `votes` restricts SELECT to `auth.uid() = user_id`, so the DB only returns the current user’s votes. **Recommendation:** Still resolve `userId` server-side with `getUser()` and pass `user.id` internally (or make the action take no args and use `getUser()` inside) to avoid relying on client input.
- **`app/actions/daily-municipal.ts`** and **`app/actions/votes.ts`:** Use `guest_user_id` from cookies when `getUser()` is null. For `municipal_votes` and `votes`, RLS uses `auth.uid() = user_id`, so unauthenticated guests will not satisfy RLS for INSERT. Confirm whether guest voting is intended and, if so, whether a separate table or policy is needed for guest votes.

**Actions that correctly use `getUser()` at the start (sample):**  
`profile-data.ts`, `user-management.ts`, `research-notes.ts` (for `addResearchNote`), `dna.ts`, `economy.ts`, `parties.ts`, `weather.ts`, `pulse.ts`, `admin.ts`, `fingerprint.ts`, `manifesto-engine.ts`, `municipal.ts`, `send-report.ts`, `user-profiles.ts`, etc.

**Actions that do not call `getUser()` (rely on RLS or public data):**  
`getResearchNotes` in `research-notes.ts` — runs a SELECT; RLS on `research_notes` is currently **permissive** (see RLS section). Prefer adding an explicit `getUser()` and/or tightening RLS if notes are user-private.

---

## 4. RLS policy scan

**Convention checked:** Tables that store user-specific data should have RLS with `auth.uid() = user_id` (or `auth.uid() = id` where the primary key is the user id).

**Tables with correct RLS (auth.uid() = user_id or id):**  
`votes`, `profiles`, `user_profiles`, `municipal_votes`, `user_pulse_votes`, `user_archetypes`, `user_badges`, `user_actions_log`, `transactions`, `predictions`, `user_achievements`, `research_notes` (INSERT only), `manifesto_update_votes`, `party_members`, `virtual_parties` (INSERT/UPDATE), `user_profile_history`, `dna-evolution`.

**Data leakage / missing or over-permissive RLS:**

- **`research_notes`:** Policy “Researchers can read all notes” uses `USING (true)` for SELECT, so **any authenticated user can read all notes**. If notes are meant to be per-user or per-researcher, change to `USING (auth.uid() = user_id)` (and add UPDATE/DELETE as needed).
- **`user_profiles`:** Has both “Users can view/edit own” and “Kaikki voivat nähdä julkiset profiilit” with `USING (true)`. So everyone can read all user_profiles. Confirm if intentional (e.g. public profiles).
- **`promise-watch-schema.sql`:** Tables `user_follows` and `user_notifications` have **no RLS policies** in the schema file. **Action:** Add RLS and policies so that access is restricted by `auth.uid() = user_id`.
- **`meeting_votes`:** Table has `user_id` but **no RLS** in `meeting-votes-schema.sql`. **Action:** Enable RLS and add policies `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE as appropriate.

**Note:** The codebase does **not** contain tables named `practice_sessions` or `dance_library`. If they are added later, ensure they have RLS with `auth.uid() = user_id` (or equivalent).

---

## 5. Redirect loops and auth callback (PKCE)

**File:** `app/auth/callback/route.ts`

**Findings:**

- Uses `exchangeCodeForSession(code)` (PKCE flow). **Correct.**
- **Critical fix applied:** Session cookies set by `exchangeCodeForSession` (via `cookieStore.set` in `createClient()`’s `setAll`) were not guaranteed to be sent back when returning `NextResponse.redirect()`. In Next.js 15, cookie store mutations are not always merged into a manually constructed redirect response. **Fix:** After successful exchange, get the cookie store again and copy all cookies onto the redirect response before returning it. This prevents “logged in but next request has no session” (cookie/session desync).
- Error handling: On `exchangeCodeForSession` error, the route now redirects to `/login?error=...` instead of falling through to a success redirect.
- No redirect loop identified: callback runs only when the provider redirects with `?code=...`; middleware does not redirect back to the callback.

**Redirect loop risk:** **Low.** Logic is linear; no loop introduced by the change.

---

## 6. Summary: desync risks and fixes

| Risk                                                     | Severity           | Status                                                               |
| -------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| Auth callback redirect not carrying session cookies      | **High**           | **Fixed** — cookies copied onto redirect response                    |
| Server actions trusting client-passed `userId` (auth.ts) | **High**           | **Fixed** — `syncProfile` / `upsertUserProfile` use `getUser()` only |
| research_notes SELECT policy too permissive              | Medium             | Flagged — consider `auth.uid() = user_id`                            |
| user_follows / user_notifications missing RLS            | Medium             | Flagged — add RLS and policies                                       |
| meeting_votes missing RLS                                | Medium             | Flagged — add RLS and policies                                       |
| getPartyAlignment(userId) from client                    | Low (RLS protects) | Recommended to use server-side `getUser()`                           |

---

## 7. Immediate follow-ups (recommended)

1. **RLS:** Add RLS and `auth.uid() = user_id` policies for `user_follows`, `user_notifications`, and `meeting_votes`.
2. **research_notes:** If notes are private, change SELECT policy to `USING (auth.uid() = user_id)`.
3. **match-alignment:** Refactor `getPartyAlignment` to resolve user server-side with `getUser()` and pass `user.id` internally (or take no args).
4. **Guest voting:** Confirm design for `votes` / `municipal_votes` when `auth.uid()` is null (e.g. guest cookie); adjust RLS or use a dedicated guest path if needed.

---

_Audit performed as The Sentinel: Auth & Identity Specialist._
