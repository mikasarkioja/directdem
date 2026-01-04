# DirectDem - System Blueprint v2.0

Tämä dokumentti sisältää DirectDem-alustan täydellisen arkkitehtuurikuvauksen, logiikan ja tietokantarakenteen. Tämän dokumentin avulla Cursor (tai muu AI) voi rakentaa koko sovelluksen uudelleen alusta alkaen.

---

## 1. Vision & Core Philosophy
**DirectDem** on "Civic Command Center", joka pelillistää demokratian. Se poistaa byrokratian esteet tuomalla lakiesitykset selkokielellä suoraan kansalaisille, mahdollistamalla virtuaalisten puolueiden perustamisen ja tarjoamalla tekoälyavusteisen väittelyareenan (The Agora).

---

## 2. Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Lucide React, Recharts, React Simple Maps.
- **Backend**: Supabase (Auth, PostgreSQL, RLS, Storage), Server Actions.
- **AI Engine**: GPT-4o-mini (AI SDK), OpenAI.
- **Data Sources**: Eduskunta Vaski API, Espoo/Helsinki Open Data, Kuntalaisaloite.fi.
- **Email**: Resend.

---

## 3. Database Master Schema (Supabase)

### Profiles & Auth
- **profiles**: `id (uuid, PK)`, `full_name`, `email`, `is_verified`, `vaalipiiri`, `municipality`, `xp`, `level`, `impact_points`, `economic_score`, `liberal_conservative_score`, `environmental_score`, `initialized_from_mp`, `public_stance (bool)`.

### Legislative Data
- **bills**: `id (uuid, PK)`, `he_id (text, Unique)`, `title`, `summary`, `status`, `published_date`, `processing_date`, `original_url`.
- **municipal_cases**: `id (uuid, PK)`, `external_id`, `org_name`, `title`, `neighborhood`, `cost_estimate`, `status`, `is_live_initiative`.

### Voting & Gamification
- **votes**: `id`, `user_id`, `bill_id`, `vote_type (jaa, ei, tyhjaa)`, `created_at`.
- **municipal_votes**: `id`, `user_id`, `case_id`, `vote_type`, `is_resident (bool)`.
- **user_archetypes**: `user_id`, `active`, `fact_checker`, `mediator`, `reformer`, `local_hero` (all integer points).
- **user_badges**: `id`, `user_id`, `badge_type`.
- **predictions**: `id`, `user_id`, `bill_id`, `predicted_outcome`, `is_correct (bool)`.

### Virtual Parties (Factions)
- **virtual_parties**: `id`, `name`, `manifesto`, `logo_url`, `created_by`, `total_xp`, `dna_profile_avg (jsonb)`.
- **party_members**: `party_id`, `user_id`, `role (founder/member)`.
- **manifesto_versions**: `id`, `party_id`, `content`, `version_number`, `created_at`.

### Eduskunta Mass Data & Analysis
- **mps**: `id (personId)`, `first_name`, `last_name`, `party`, `constituency`, `image_url`.
- **voting_events**: `id (aanestysId)`, `title_fi`, `voting_date`, `he_id`, `ayes`, `noes`, `blanks`, `absent`, `category`, `summary_ai`.
- **mp_votes**: `id`, `mp_id`, `event_id`, `vote_type`.
- **mp_profiles**: `parliament_id`, `full_name`, `party`, `economic_score`, `liberal_conservative_score`, `environmental_score`, `total_votes_analyzed`.

---

## 4. Key Feature Modules

### A. Eduskuntavahti & AI Selkokieli
- **Logiikka**: Hakee Eduskunnan rajapinnasta HE-tunnuksella varustetut asiat.
- **AI-tiivistelmä**: Muuttaa lakitekstin selkokielelle (Topic -> Changes -> Impact -> Economic Impact -> Social Impact).
- **Endpointit**: `/api/cron/process-bills` (automaattinen päivitys).

### B. Kuntavahti (Espoo & Helsinki)
- **Logiikka**: Integroituu `paatokset.espoo.fi` ja Ahjo API (Helsinki) rajapintoihin.
- **Toiminnallisuus**: Näyttää asiat kaupunginosittain ja kustannusarvion kanssa.
- **Kuntalaisaloite**: Integroituu `kuntalaisaloite.fi` RSS/API-virtaan (LIVE-merkintä).

### C. Demokraattinen DNA
- **Pisteytys**:
  - `active`: +1 per ääni.
  - `fact_checker`: +2 per alkuperäisen tekstin avaus.
  - `mediator`: +2 neutraalista äänestä tai kannan muutoksesta.
  - `reformer`: +2 jos ääni poikkeaa enemmistöstä.
  - `local_hero`: +2 kunta-aktiivisuudesta.
- **Visualisointi**: Radar Chart (Recharts) profiilisivulla.

### D. Virtuaalipuolueet (Factions)
- **Perustaminen**: Vaatii 5 samanmielistä (DNA-samankaltaisuus > 50%).
- **Manifesto Engine**: AI generoi manifeston jäsenten äänestyshistorian ja uutisvirran perusteella.
- **PartyIcon**: Dynaaminen SVG-logo, joka muuttuu XP-tason noustessa.

### E. The Agora - Väittelyareena
- **Agentit**: Tekoälyedustajat (esim. Liike Nyt vs. SDP) väittelevät valitusta aiheesta.
- **Live-efektit**: Streaming text, flying emojis, real-time fact-checking banner (Judge AI).
- **Uutisintegraatio**: Syöttää tuoreimmat HS/Iltalehti-otsikot väittelyn kontekstiksi.

### F. MP-Profiler & Hjallis Demo
- **MP Profiler**: Skripti (`analyze-mp-dna.ts`) laskee jokaiselle kansanedustajalle poliittisen DNA:n (-1...1 akseleilla: Talous, Arvot, Ympäristö).
- **Hjallis Demo**: Mahdollistaa oman profiilin alustamisen Harry Harkimon datalla ja vertailun keneen tahansa kansanedustajaan (Euklidinen etäisyys).

---

## 5. Visual Identity (Simplified Nordic Design)
- **Värit**:
  - Pääväri: `#005EB8` (Suomen sininen / Nordic Blue)
  - Korostus: `#00E1FF` (Command Neon)
  - Tausta: `#F8FAFC` (Light Slate)
  - Teksti: `#1E293B` (Dark Slate)
- **UI Elementit**: Pyöristetyt kulmat (`rounded-3xl`), pehmeät varjot, hienovaraiset Framer Motion -animaatiot.

---

## 6. How to Recreate (Master Prompt Strategy)
1.  **Phase 1: Database**: Aja kaikki SQL-skriptit `supabase/` kansiosta järjestyksessä.
2.  **Phase 2: Types**: Kopioi `lib/types.ts` varmistaaksesi tyyppiturvallisuuden.
3.  **Phase 3: Core UI**: Rakenna `Dashboard.tsx` ja `Sidebar.tsx`.
4.  **Phase 4: Data Connectors**: Toteuta `eduskunta-api.ts` ja `municipal-api.ts`.
5.  **Phase 5: Logic**: Implementoi Server Actionit `app/actions/` kansiosta (DNA, Parties, Votes).
6.  **Phase 6: AI Features**: Pystytä `/api/debate/stream` ja `/api/summarize`.

---

## 7. Configuration & Environment
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
RESEND_API_KEY=...
```

**Cron Jobs**:
- `/api/cron/process-bills`: Päivittää lakiesitykset (1h välein).

