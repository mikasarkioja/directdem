# Eduskuntavahti (Omatase): uutislähteet, datalähteet ja viimeaikaiset muutokset

Päivitetty: 2026-04-07. Tämä dokumentti kokoaa **mistä uutis- ja tekstisisältö tulee** sekä lyhyen **muutoslokin** ja **huomisen TODO-listan** (kopioi alas tai pidä linkki).

---

## 1. Media Watch (automaattinen uutissync → `news_articles`)

**Tiedosto:** `lib/media-watch/feeds.ts` — vakio `MEDIA_RSS_FEEDS`.

| `sourceName` (sovelluksessa) | RSS-URL                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Yle Politiikka               | `https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&categories=64-123` |
| Yle Tuoreimmat               | `https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET`                   |
| Yle RSS                      | `https://yle.fi/uutiset/rss`                                                            |
| Helsingin Sanomat            | `https://www.hs.fi/rss/tuoreimmat/uutiset.xml`                                          |
| Ilta-Sanomat                 | `https://www.is.fi/rss/uutiset.xml`                                                     |

**Huomioita:**

- Yleä on **kolme syötettä**; sisältö voi **päällekkäintyä**.
- Muita valtakunnallisia lehtiä (esim. IL päivityslista erikseen, MTV, STT) **ei** ole tässä listassa — ne pitää lisätä manuaalisesti `MEDIA_RSS_FEEDS`-taulukkoon.
- Synkki: `runMediaWatchNewsSync` (`lib/media-watch/sync-news-run.ts`), cron `GET /api/cron/sync-news` (`vercel.json`: päivittäin UTC ~8:25, Hobby-rajoituksen vuoksi), sekä admin **`syncNews`** (`app/actions/sync-news.ts`).

---

## 2. Työpöydän “uutislista” (Yle + tietokannan hälytykset)

**Tiedosto:** `app/actions/news.ts` — `getCombinedNews`.

| Lähde                    | Miten                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Yle Politiikka** (RSS) | `lib/news/news-service.ts` → sama RSS kuin Media Watchin ensimmäinen syöte (`categories=64-123`). |
| **Sidonnaisuus-tutka**   | Supabase `mp_ai_profiles.last_conflict_analysis` (ei ulkoinen uutissivu).                         |
| **Integrity alerts**     | Supabase `integrity_alerts` + `mps`.                                                              |

Ei käytä HS/IS -syötteitä, ellei koodia muuteta.

---

## 3. Kunnallinen data (ei valtakunnallinen uutismedia, mutta “feed”)

| Kohde               | Lähde                                                                                    | Tiedosto                                                 |
| ------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Espoo** (Dynasty) | `https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=rss/meetingitems&show=50`             | `lib/municipal/espoo-client.ts`                          |
| **Vantaa**          | `https://www.vantaa.fi/ajankohtaista/rss`, `https://www.vantaa.fi/fi/rss.xml` (fallback) | `lib/municipal/vantaa-client.ts`, `lib/municipal-api.ts` |

Näitä käytetään kuntavahti-/Espoovalikko-putkissa, ei suoraan Media Watch -RSS-listassa.

---

## 4. Mock / demodata (ei oikeaa skannausta)

**Tiedosto:** `lib/news-fetcher.ts` — `fetchRelevantNews`.

- Palauttaa **kiinteitä esimerkkiotsikoita** ja linkkejä (HS.fi, iltalehti.fi -polkuja) **ilman** RSS- tai API-hakua.
- Käyttö: esim. Agora / manifesto-engine -tyyppiset polut, joissa tarvitaan keksiä näytedata.

---

## 5. Viikkobulletiini (sähköposti vs. uusi editori)

| Polku                                                                | Data / AI                                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vanha generaattori** (`lib/bulletin/generator.ts`)                 | Supabase: `decisions`, `lobbyist_traces`, `espoo_decisions`, `espoo_lobby_traces` + **OpenAI GPT-4o** JSONiin.                                                                                                             |
| **Uusi dashboard-editori** (`app/actions/weekly-bulletin-editor.ts`) | Supabase: `decisions`, `media_watch_feed`, `lobbyist_interventions` (+ `legislative_projects`), `municipal_decisions` (Espoo) + **Gemini** (`gemini-3-flash-preview` / `GEMINI_BULLETIN_MODEL`) + Google Search Grounding. |

Testilähetys Resendiin: `scripts/send-test-weekly-bulletin.ts` (fixture tai täysi generaatio).

---

## 6. Dynaamiset “lähteet” (ei kiinteää uutislistaa)

| Ominaisuus                                   | Lähde                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Media Watch vertailu (`matchNewsToDecision`) | **Gemini** + valinnainen **Google Search Grounding**; URL:t tallentuvat `ai_analysis_json` / näkyvät UI:ssa. |
| Viikkobulletiini (editor)                    | Sama idea: mallin `sources` + erillinen grounding-listaus.                                                   |

---

## 7. Viimeaikaiset tuote- ja inframuutokset (tiivistelmä)

Tallenna omaan päiväkirjaan; tässä karkea jäljitelmä tästä kehityskierroksesta:

| Aihe                     | Mitä tehtiin                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Media Watch vertailu** | `/dashboard/media-watch`, `ComparisonCard`, `matchNewsToDecision`, grounding → `ai_analysis_json`.                                                    |
| **Supabase**             | Migraatio `ai_analysis_json` + `media_watch_feed` -näkymä (uusi sarake **viimeisenä** SELECTissä, jotta `CREATE OR REPLACE VIEW` ei riko Postgresia). |
| **Viikkobulletiini**     | `/dashboard/bulletin`, `generateWeeklyBulletin`, `lib/bulletin/editor-*`.                                                                             |
| **Ympäristö**            | `GEMINI_BULLETIN_MODEL` (valinnainen), `GEMINI_API_KEY`; bulletin-editor käyttää Geminiä.                                                             |
| **Vercel Hobby**         | `sync-news` cron **2 h → päivittäin** (`25 8 * * *`), muut crons päivittäiset.                                                                        |
| **Testisähköposti**      | `scripts/send-test-weekly-bulletin.ts` → Resend, oletusvastaanotin `ADMIN_EMAIL` tai skriptin oletus.                                                 |

---

## 8. TODO huomiselle (kopioi checklist)

- [ ] **Supabase:** Varmista että migraatiot ajettu: `20260408120000_news_media_watch.sql` ennen `20260409120000_media_watch_ai_analysis_json.sql` (tai vastaava järjestys).
- [ ] **Ympäristömuuttujat (Vercel):** `GEMINI_API_KEY`, `CRON_SECRET`, tarvittaessa `GEMINI_MEDIA_WATCH_MODEL` / `GEMINI_BULLETIN_MODEL`, Media Watchille `OPENAI`-embedding jos käytössä, Resend testituotantoon.
- [ ] **RSS-laajennus (valinnainen):** Päätä haluatko lisätä muita uutislähteitä → päivitä vain `MEDIA_RSS_FEEDS` ja harkitse Yle-duplikaattien vähentämistä.
- [ ] **Cron:** Jos tarvitset tiheämpää uutissynkkiä kuin 1×/pv, joko Vercel Pro tai ulkoinen cron (`Authorization: Bearer CRON_SECRET`).
- [ ] **Bulletiini:** Kokeile `/dashboard/bulletin` tuotannossa; vertaile vanhaan sähköpostigeneraattoriin (`generator.ts`) ja päätä yksi “canonical” putki tai selkeä roolitus.
- [ ] **`.vercel`:** Repo sisältää jo `.vercel` `.gitignore`-listassa; älä commitoi projektitunnisteita vahingossa.
- [ ] **Dokumentin ylläpito:** Kun lisäät RSS:n tai uuden API-lähteen, päivitä tämän tiedoston taulukko ja päivämäärä.

---

_Tiedosto polussa: `DOCS/EDUSKUNTAVAHTI-UUTISLAHTEET-JA-MUUTOKSET.md`._
