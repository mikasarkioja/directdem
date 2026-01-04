# DirectDem - System Blueprint v3.0

Tämä dokumentti sisältää DirectDem-alustan täydellisen arkkitehtuurikuvauksen, logiikan ja tietokantarakenteen. Tämän dokumentin avulla Cursor (tai muu AI) voi rakentaa koko sovelluksen uudelleen alusta alkaen.

---

## 1. Vision & Core Philosophy
**DirectDem** on "Civic Command Center", joka pelillistää demokratian. Se on suunnattu erityisesti 18–30-vuotiaille diginatiiveille (Cyber Nordic -teema). Se poistaa byrokratian esteet tuomalla lakiesitykset selkokielellä suoraan kansalaisille, mahdollistamalla virtuaalisten puolueiden perustamisen ja tarjoamalla tekoälyavusteisen väittelyareenan (The Agora).

---

## 2. Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Lucide React, Recharts, React Simple Maps, html-to-image.
- **Backend**: Supabase (Auth, PostgreSQL, SSR, RLS, Storage), Server Actions.
- **AI Engine**: GPT-4o-mini (AI SDK), OpenAI.
- **Data Sources**: Eduskunta Vaski API, Yle Vaalikone 2023, Espoo/Helsinki Open Data.
- **Email**: Resend.

---

## 3. Database Master Schema (Supabase)

### Profiles & Auth
- **profiles**: `id (uuid, PK)`, `full_name`, `email`, `is_verified`, `vaalipiiri`, `municipality`, `xp`, `level`, `impact_points`, `economic_score`, `liberal_conservative_score`, `environmental_score`, `urban_rural_score`, `international_national_score`, `security_score`, `initialized_from_mp`, `public_stance (bool)`.
- **user_profile_history**: `id`, `user_id`, `scores_json`, `archetype`, `timestamp`.

### Legislative Data
- **bills**: `id (uuid, PK)`, `parliament_id`, `title`, `summary`, `status`, `published_date`, `processing_date`, `url`, `category`.
- **bill_forecasts**: `bill_id`, `predicted_ayes`, `predicted_noes`, `weather_type`, `potential_rebels (jsonb)`.
- **integrity_alerts**: `mp_id`, `event_id`, `category`, `promise_value`, `vote_type`, `severity`.

### Eduskunta Mass Data
- **mps**: `id (personId)`, `first_name`, `last_name`, `party`, `is_active`.
- **mp_candidate_responses**: `mp_id`, `question_id`, `answer_value (1-5)`.
- **mp_profiles**: `mp_id`, `economic_score`, `liberal_conservative_score`, `environmental_score`, `urban_rural_score`, `international_national_score`, `security_score`, `total_votes_analyzed`.

---

## 4. Key Feature Modules

### A. Eduskuntavahti & AI Selkokieli
- **Logiikka**: Hakee Eduskunnan rajapinnasta asiat. AI muuttaa lakitekstin selkokielelle.
- **Vaalilupaus-vahti**: Vertaa MP:n vaalikonevastauksia ja todellisia ääniä. Luo `integrity_alerts`.

### B. Poliittinen DNA -Testi (/testi)
- **Logiikka**: 6 kysymystä (Likert 1-5). Muuntaa pisteet (-1.0 ... 1.0).
- **Match-algoritmi**: Laskee euklidisen etäisyyden Z-score -normalisoidussa 6D-avaruudessa kaikkiin kansanedustajiin.

### C. Poliittinen sääennuste
- **Prediction Engine**: Ennustaa äänestystuloksen MP-DNA:n ja puolueen Rice Indexin (koheesio) perusteella.
- **Weather Types**: Sunny (selvä), Stormy (tiukka), Low Pressure (hylky).

### D. Cyber Nordic UI (Visual Identity)
- **Värit**: Dark Slate (`#0f172a`), Neon Purple (`#A855F7`), Emerald (`#10B981`).
- **Style**: Cyberpunk-vivahteet, lasimaiset pinnat (Glassmorphism), Skeleton Loaders, Neon Glows.

---

## 5. Performance Strategy
- **Batching**: N+1 -ongelmien välttäminen (esim. `getBatchIntegrityAlerts`).
- **Caching**: React `cache()` server-side ja Next.js `force-dynamic` varmistaakseen reaaliaikaisuuden.
- **Indexes**: `idx_integrity_alerts_event_id` jne. suorituskyvyn takaamiseksi.

---

## 6. How to Recreate (Disaster Recovery Master Prompt)

"Rakenna DirectDem Civic Command Center -sovellus Next.js 15:llä ja Supabasella.
1.  **DB**: Aja SQL-migraatiot `supabase/` kansiosta (expand-dna, dna-evolution, pivot-index, promise-watch, weather-forecast).
2.  **Types**: Kopioi `lib/types.ts`.
3.  **Data**: Aja `scripts/fetch-eduskunta-data.ts`, `scripts/import-vaalikone-data.ts` ja `scripts/analyze-mp-dna.ts`.
4.  **UI**: Toteuta `Dashboard.tsx` Cyber Nordic -teemalla. Luo reitit `/testi`, `/demo/harkimo`, `/ranking`, `/puolueet/analyysi`.
5.  **Logic**: Implementoi Server Actionit `verifyOtpAction` (auth), `findMatchesForScores` (DNA) ja `predictVoteOutcome` (weather)."

---
