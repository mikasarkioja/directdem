# Ominaisuuskatalogi — tuotehallinta (Eduskuntavahti / Omatase)

**Tarkoitus:** Yksi paikka, josta PM, tuote ja tekninen omistaja näkevät **mitä tuotteessa on**, **missä vaiheessa** se on, ja **mitä riippuvuuksia** tarvitaan.  
**Päivitetty:** 2026-04-08 (koodipohja: DirectDem). Päivitä tätä kun julkaiset merkittävän ominaisuuden tai muutat data-/auth-polkuja.

**Liittyvät dokkarit:** [TUOTE-FEATURE-KUVAUS-JA-MVP.md](./TUOTE-FEATURE-KUVAUS-JA-MVP.md) (MVP-priorisointi), [LOBBY_TRACEABILITY.md](./LOBBY_TRACEABILITY.md), [EDUSKUNTAVAHTI-UUTISLAHTEET-JA-MUUTOKSET.md](./EDUSKUNTAVAHTI-UUTISLAHTEET-JA-MUUTOKSET.md).

---

## 1. Valmiusasteiden määritelmät

| Taso                 | Merkitys tuotteelle                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Production-ready** | Pääpolku luotettava, pääosin oikeaa dataa; sopii julkiseen lupaukseen ilman “demo”-varoitusta.           |
| **Beta**             | Oikea data ja käyttökelpoinen, mutta kattavuus, UX tai integraatio voi pettää; dokumentoidut rajoitteet. |
| **Alpha**            | Toimii kehityksessä / sisäisesti; mockia, tyhjää dataa, kallista AI:ta tai hauras skreippaus.            |
| **Concept / demo**   | Tarkoituksellinen prototyyppi, testisivu tai legacy-polku; ei roadmappilupaus.                           |

_Huom:_ Sama moduuli voi olla **Production-ready** datan osalta mutta **Beta** laadun tai kustannuksen osalta.

---

## 2. Tiivis inventaario (kaikki pääalueet)

| #   | Ominaisuus                                         | Käyttöliittymä / reitti                             | Valmius             | Feature flag / ehto                                                 |
| --- | -------------------------------------------------- | --------------------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| 1   | Etusivu / marketing                                | `/`                                                 | Beta                | —                                                                   |
| 2   | Kirjautuminen (OTP / session)                      | `/login`, auth callbackit                           | Beta                | —                                                                   |
| 3   | BankID                                             | callback-polku                                      | Alpha               | Mock / placeholder kehityksessä                                     |
| 4   | Käyttäjäprofiili                                   | `/profiili`, `/settings`                            | Beta                | —                                                                   |
| 5   | Työpöytä (valtio + kunta -linssit)                 | `/dashboard`                                        | Beta                | `INTELLIGENCE_FEED`, `MEDIA_WATCH`, `MUNICIPAL_WATCH`, `PULSE` jne. |
| 6   | Tutkijan työpöytä                                  | `/dashboard/researcher`                             | Beta                | `RESEARCHER_ENABLED` + `RESEARCHER_MODE` (workbench)                |
| 7   | Media Watch (uutiset vs. päätökset)                | `/dashboard/media-watch`                            | Beta → Prod datalla | `MEDIA_WATCH_ENABLED`                                               |
| 7b  | Intelligence feed (yhdistetty syöte)               | `IntelligenceFeed` työpöydällä                      | Beta                | `INTELLIGENCE_FEED_ENABLED`                                         |
| 8   | Kansalaisääni / pulse (tiivistelmät)               | työpöytä, `CitizenPulseSection`                     | Beta                | `PULSE_ENABLED`                                                     |
| 9   | Lakilista                                          | `/bills`                                            | Beta                | —                                                                   |
| 10  | Lakiyksityiskohta / lausunnot / pöytäkirjat        | `/lausunnot/[billId]`, `/poytakirjat/[billId]`      | Beta                | —                                                                   |
| 11  | Kansanedustajaprofiili (julkinen)                  | `/mps/[id]`                                         | Beta                | —                                                                   |
| 12  | Kansanedustaja (dashboard-näkymä)                  | `/dashboard/mps/[id]`                               | Beta                | —                                                                   |
| 13  | Vertailu käyttäjiin                                | `/vertaa/[userId]`                                  | Alpha–Beta          | —                                                                   |
| 14  | Ennusteet                                          | `/ennusteet/[id]`                                   | Alpha               | `PREDICTIVE_MODELS_ENABLED` oletus pois                             |
| 15  | Ranking                                            | `/ranking`                                          | Alpha–Beta          | —                                                                   |
| 16  | Puolueanalyysi / päivitys                          | `/puolueet/analyysi`, `/puolue/[id]/paivitys`       | Alpha               | —                                                                   |
| 17  | Arena (ottelu)                                     | `/arena`                                            | Alpha               | `ARENA_ENABLED`                                                     |
| 18  | Väittely                                           | `/vaittely/[id]`, `/vaittely/demo`                  | Alpha               | —                                                                   |
| 19  | Kunnallinen (Espoo)                                | `/dashboard/espoo`                                  | Beta                | `MUNICIPAL_WATCH`, `ESPOO_DYNASTY`                                  |
| 20  | Lobby-kartta (yhteysgraafi)                        | `/dashboard/lobby-map`                              | Beta                | —                                                                   |
| 21  | Viikkobulletiini (toimituksellinen editori)        | `/dashboard/bulletin`                               | Beta                | `WEEKLY_BULLETIN_ENABLED`                                           |
| 22  | **Vanha** bulletiinigeneraattori (OpenAI + feedit) | cron, `lib/bulletin/generator.ts`                   | Beta                | Eri polku kuin magazine-editori                                     |
| 23  | Admin: yleinen                                     | `/admin`                                            | Beta                | admin-rooli                                                         |
| 24  | Admin: synkronointi                                | `/admin/sync`                                       | Beta                | —                                                                   |
| 25  | Admin: analytiikka                                 | `/admin/analytics`                                  | Beta                | —                                                                   |
| 26  | Admin: tilaajat                                    | `/admin/subscribers`                                | Beta                | —                                                                   |
| 27  | Stripe: checkout / portal / webhook                | `/api/stripe/*`                                     | Beta                | avaimet + tuotteet                                                  |
| 28  | Resend / uutiskirje                                | toiminnot + email-komponentit                       | Beta                | domain / sandbox                                                    |
| 29  | XP / gamification (jos UI:ssa)                     | useat näkymät                                       | Beta                | `XP_SYSTEM_ENABLED`                                                 |
| 30  | Talousmoduuli                                      | (koodissa)                                          | Concept             | `ECONOMY_ENABLED` oletus pois                                       |
| 31  | MP DNA -analytiikka (raskas)                       | osa tutkija-/MP-polkuja                             | Alpha               | `MP_DNA_ANALYTICS_ENABLED` oletus pois                              |
| 32  | Testi-/debug-sivut                                 | `/test-api`, `/test-bill-fetch`, `/debug/auth` jne. | Concept             | ei tuotantolupaus                                                   |

---

## 3. Data, AI ja integraatiot (detalji)

### 3.1 Eduskunta ja lac

| Osa                                                         | Valmius             | Huom                                                           |
| ----------------------------------------------------------- | ------------------- | -------------------------------------------------------------- |
| Bills Supabase + Eduskunta-API                              | Beta                | API katkokset → fallback-mallit mahdollisia vanhoissa poluissa |
| AI-profiilit (bill)                                         | Beta                | Riippuu batch/cron ja avaimista                                |
| Kansalais-pulssi / “poliittinen todellisuus” bill-näkymässä | Alpha / heuristinen | `generateMockCitizenPulse` tms. — ei virallista gallup-dataa   |
| Tekstin tiivistys / process-bill                            | Beta                | `/api/process-bill`, skriptit                                  |

### 3.2 Media Watch

| Osa                         | Valmius   | Huom                                   |
| --------------------------- | --------- | -------------------------------------- |
| RSS → `news_articles`       | Beta–Prod | `lib/media-watch/feeds.ts`, migraatiot |
| Embedding + matcher         | Beta      | Kustannus / laajuus                    |
| Gemini-vertailu + grounding | Beta      | Avaimet; ei aina pakollista            |
| `media_watch_feed` näkymä   | Beta      | DB-migraatiot tuotantoon               |

### 3.3 Lobby ja läpinäkyvyys

| Osa                                                                 | Valmius                   | Huom                                                                                           |
| ------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| Valiokunta-asiantuntijat (Vaski API) → `committee_expert_invites`   | Beta                      | `npm run sync-committee-experts`                                                               |
| Saman lähteen kirjoitus `lobbyist_interventions` (`expert_hearing`) | Beta                      | Migraatio + `dedupe_key`; vaatii `legislative_projects` mäppäyksen                             |
| Lausuntopalvelu → `statement`-rivit (batch)                         | Alpha–Beta                | HTML-hauraus; `LOBBY_TRACE_USE_MOCK`                                                           |
| Avoimuusrekisteri -keräin                                           | Alpha                     | Mock kun `LOBBY_TRACE_USE_MOCK=true`                                                           |
| Admin/Action: lausuntojen keräys + LLM-stance                       | Alpha–Beta                | Poistaa tietyt tyypit uudelleenajossa; ei koske `expert_hearing` / `statement` samalla tavalla |
| `person_interests` ingest / ristiinviittaus                         | Beta data; Alpha prosessi | Suora ingest skripteillä; bulletiini käyttää ristiriimitoa kun lobby-rivejä on                 |
| Lobby PDF -metadata (tekijä vs. odotettu org)                       | Alpha                     | Manuaali / osittainen automaatio                                                               |
| Connection graph (palvelin + UI)                                    | Beta                      | Verkko harva jos taulut tyhjiä                                                                 |

### 3.4 Bulletin (kaksi polkua)

| Polku                                                                        | Valmius | Huom                                                                                                                              |
| ---------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Editor-magazine** (`generateEditorialBulletin`, Gemini 3 Flash, grounding) | Beta    | Vaatii `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; ei listaa kaikkia HE-hankkeita, vaan päätösikkuna + lobbari + asiantuntijat |
| **Legacy generator** (OpenAI, strukturoitu JSON sähköposteille)              | Beta    | `lib/bulletin/generator.ts`, riippuu `lobbyist_traces` jne.                                                                       |
| Feed-synkki (`sync-bulletin-feed`)                                           | Beta    | Vaatii uniikki-indeksit PostgREST-upserteille (migraatiot dokattu CHANGELOGissa)                                                  |

### 3.5 Kunnat

| Osa                         | Valmius | Huom                           |
| --------------------------- | ------- | ------------------------------ |
| Espoo päätökset / tapaukset | Beta    | Parserit / kunta-API           |
| Muut kunnat                 | Alpha   | Ei yhtenäistä tuotantolupausta |

### 3.6 Kansalaisreaktiot / pulse-cache

| Osa                  | Valmius | Huom                                             |
| -------------------- | ------- | ------------------------------------------------ |
| Citizen pulse -cron  | Beta    | Verc Hobby: **päivittäinen** ajo (`vercel.json`) |
| Gemini-cache refresh | Beta    | Kustannusvalvonta                                |

### 3.7 Kaupallinen

| Osa            | Valmius | Huom                   |
| -------------- | ------- | ---------------------- |
| Stripe         | Beta    | Test vs. live -avaimet |
| Tilausportaali | Beta    | —                      |

### 3.8 Tutkija / vienti

| Osa                                                        | Valmius | Huom                      |
| ---------------------------------------------------------- | ------- | ------------------------- |
| Researcher workbench + linssit (lobby DNA, verkko, vienti) | Beta    | Raskas; `RESEARCHER_MODE` |
| Export hub (datasetit)                                     | Beta    | RLS / admin               |

---

## 4. Tausta-automaatio (Vercel cron)

| Polku                         | Aikataulu (UTC)                          | Valmius                                  |
| ----------------------------- | ---------------------------------------- | ---------------------------------------- |
| `/api/cron/process-bills`     | `0 6 * * *` (päivittäin)                 | Beta                                     |
| `/api/cron/process-municipal` | `0 7 * * *`                              | Beta                                     |
| `/api/cron/sync-news`         | `25 8 * * *`                             | Tuotanto-tasoinen aikomus; Beta ylläpito |
| `/api/cron/citizen-pulse`     | `30 9 * * *` (päivittäin; Hobby-rajoite) | Beta                                     |

_Erilliset:_ `weekly-bulletin`, `weekly-report` jne. voivat olla konfiguroitu erikseen tai manuaalisesti — tarkista `app/api/cron/`.

---

## 5. Feature flagit (lue kun otat moduulin myyntiin)

Lähde: `lib/config/features.ts`.

| Muuttuja                                | Oletus (ellei env) | Tyypillinen merkitys  |
| --------------------------------------- | ------------------ | --------------------- |
| `NEXT_PUBLIC_ARENA_ENABLED`             | päällä             | Arena                 |
| `NEXT_PUBLIC_ECONOMY_ENABLED`           | **pois**           | Talous — ei MVP       |
| `NEXT_PUBLIC_RESEARCHER_ENABLED`        | päällä             | Tutkija               |
| `NEXT_PUBLIC_RESEARCHER_MODE`           | **pois**           | Raskas workbench      |
| `NEXT_PUBLIC_MUNICIPAL_WATCH_ENABLED`   | päällä             | Kunnat                |
| `NEXT_PUBLIC_MEDIA_WATCH_ENABLED`       | päällä             | Media                 |
| `NEXT_PUBLIC_PULSE_ENABLED`             | päällä             | Pulse                 |
| `NEXT_PUBLIC_INTELLIGENCE_FEED_ENABLED` | päällä             | Feed                  |
| `NEXT_PUBLIC_XP_SYSTEM_ENABLED`         | päällä             | XP                    |
| `NEXT_PUBLIC_WEEKLY_BULLETIN_ENABLED`   | päällä             | Bulletin UI           |
| `NEXT_PUBLIC_ESPOO_DYNASTY_ENABLED`     | päällä             | Espoo-kartta / suku   |
| `NEXT_PUBLIC_PREDICTIVE_MODELS_ENABLED` | **pois**           | Ennusteet             |
| `NEXT_PUBLIC_MP_DNA_ANALYTICS_ENABLED`  | **pois**           | Raskaat DNA-analyysit |

---

## 6. Tunnisteet “missä mockia vielä on”

- **Lakikortti:** kansalais-/todellisuuspulssi voi käyttää heuristista sisältöä (`lib/bill-helpers.ts`).
- **Lobby:** `LOBBY_TRACE_USE_MOCK=true` → lausunto- ja avoimuuskerääjissä mock-dokumentit (`lib/lobby/collectors/*`).
- **Vanha uutislista:** `lib/news-fetcher.ts` voi palauttaa esimerkkiotsikoita (ei RSS).
- **Transparency researcher:** kehityspolkuissa mock-viittauksia — vahvista tuotantopolku ennen julkilupauksia.
- **BankID:** ei täyttä tuotantointegraatiota ilman erillistä toteutusta.

---

## 7. PM:n ylläpitolistat (copy-paste)

**Neljännesvuosittain päivitäminen**

1. Varmista että **jokaisella Beta+ -rivillä** on omistaja ja mittari (esim. päivittäiset aktiivit, virheet, AI-kustannus / 1k sessiota).
2. Merkitse kun ominaisuus nousee **Production-ready**: poista mock, dokumentoi SLA ja tuki.
3. Linkitä kriittiset ticketit (GitHub/Linear) taulukkoon — tämä tiedosto voi sisältää sarakkeen `issue:` kun prosessi kypsyy.

**Julkinen roadmappi (valinnainen)**

- Lyhennös: ota tästä vain `Production-ready` + `seuraavaksi Beta`.

---

_Dokumentti on sisäiseen käyttöön. Oikeudellinen disclaimer ja viestintä erikseen PR:stä._
