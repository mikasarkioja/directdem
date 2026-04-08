# Eduskuntavahti (Omatase) — tuote- ja ominaisuuskuvaus

**Tarkoitus:** priorisoida kehitystä, rajata MVP ja nähdä missä käytetään oikeaa dataa vs. mock-/fallback-dataa.  
**Konteksti:** koodi- ja konfiguraatiokatselmus (DirectDem-repositorio). Päivitä tämä tiedosto kun suuria polkuja muutetaan.

**Täydellinen ominaisuuskatalogi (PM):** [FEATURE-CATALOG-PRODUCT-MANAGEMENT.md](./FEATURE-CATALOG-PRODUCT-MANAGEMENT.md) — kaikki päämoduulit, valmiusasteet, flagit ja cronit.

---

## 1. Tuoteidea tiiviisti

**Eduskuntavahti** on kansalais- ja tutkijaystävällinen kerros Suomen päätöksenteon ja vaikuttamisen ympärille: lakiesitykset, äänestys- ja kansanedustajadata, kunnalliset tapahtumat, media, lobby-/avoimuusjälki ja tekoälypohjaiset tiivistelmät — **lähteinä vain julkisia tai käyttäjän suostumuksella jaettavia tietoja**, ei väitteitä ”vahvistetusta korruptiosta” ilman erillistä toimituksellista pohjaa.

**MVP-keskiö (ehdotus):** luotettava **lakiseuranta + työpöytä**, **kirjautuminen**, **yksi kunta polulla tuotantoon (Espoo)**, **Media Watch -uutisten rajaus**, ja **yksi bulletiini-/raportointipolku (Gemini-editori)**. Lobby-jälki ja kartta seuraavaksi, kun `person_interests`- ja synkki-investointi on tehty.

---

## 2. Priorisoinnin kehikko (lyhyesti)

| Kriteeri      | Mitä tarkoittaa                                                      |
| ------------- | -------------------------------------------------------------------- |
| **Arvo**      | Suora hyöty käyttäjälle (ymmärrys, ajansäästö, läpinäkyvyys).        |
| **Luottamus** | Viralliset lähteet, selkeä disclaimer, ei harhaanjohtavia otsikoita. |
| **Valmius**   | Onko polku enimmäkseen oikeaa dataa vai mockia?                      |
| **Ylläpito**  | API-/HTML-muutokset, cronit, kustannus (AI, Vercel).                 |

Priorisoi ensin ominaisuudet, joissa **valmius on korkea** ja **mock vähenee** — tai joissa mock on tarkoituksellinen demo mutta eristetty (feature flag / `/demo/*`).

---

## 3. Ominaisuusalueet: kuvaus, valmius, mock

Valmiusasteet: **Tuotanto** (pääpolku oikealla datalla) · **Beta** (oikea data, mutta hauras / osittainen) · **Alpha** (sekoitus mockia ja oikeaa) · **Konsepti** (pääosin stub/demo).

| Ominaisuus                                     | Kuvaus                                                                   | Valmius           | Mock / fallback / huomio                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Työpöytä (dashboard)**                       | Pääsisäänkäynti: linssit (valtio/kunta), kortit, uutis-/syötteitä.       | **Beta**          | Yhdistetty uutisvirta (`getCombinedNews`) painottuu Yle Politiikkaan + DB-hälytyksiin; ei kaikkia Media Watch -RSS:ejä.                                                                                                                                                                                     |
| **Lakiesitykset (`bills`)**                    | Lista ja yksityiskohtaiset näkymät Supabase/Eduskunta-polusta.           | **Beta**          | `fetchBillsFromSupabase` täydentää **kansalais-pulssin ja “poliittisen todellisuuden”** [`generateMockCitizenPulse` / `generateMockPoliticalReality`](lib/bill-helpers.ts) — ei oikeaa gallup-/ryhmääänestysdataa. Vanha [`app/actions/bills.ts`](app/actions/bills.ts) voi kaatua API:hin → mock-fallback. |
| **Kansanedustajat (`mps/[id]`)**               | Profiili, DNA-pisteet, linkit.                                           | **Beta**          | UI-viittaus “Mock Radar Chart”; osa visualisoinneista placeholder. Data riippuu `mps` / `mp_ai_profiles` -täytöstä.                                                                                                                                                                                         |
| **Äänestys / retoriikka**                      | `mp_votes`, puheenvuorot, analyysiskriptit.                              | **Beta**          | Skriptit (`fetch-eduskunta-data`, rhetoric) voivat käyttää fallback-demondataa kehityksessä.                                                                                                                                                                                                                |
| **Kuntavahti (Espoo ym.)**                     | Kunnalliset päätökset, dashboard `/dashboard/espoo`.                     | **Beta**          | Espoo: RSS/asiakaspolkuja (`espoo-client`, OnCloudos). Muilla kunnilla vaihtelee.                                                                                                                                                                                                                           |
| **Intelligence Feed**                          | Työpöydän “feed” -komponentti, feature flag.                             | **Beta**          | Riippuu `getIntelligenceFeed` ja taulujen täytöstä; ei välttämättä täyttä kattavuutta.                                                                                                                                                                                                                      |
| **Media Watch**                                | RSS → `news_articles`, embedding, `media_watch_feed`, vertailu Geminiin. | **Tuotanto–Beta** | Syötteet määritelty [`lib/media-watch/feeds.ts`](lib/media-watch/feeds.ts). **Ei mock** normaalipolulla; vaatii migraatiot + avaimet. Vertailu: valinnainen grounding. Cron: päivittäin (`vercel.json`).                                                                                                    |
| **Uutislista (legacy topic)**                  | [`lib/news-fetcher.ts`](lib/news-fetcher.ts) `fetchRelevantNews`.        | **Konsepti**      | **Kiinteät esimerkkiotsikot** aiheen mukaan — ei RSS:ää. Käytössä vanhemmissa/teemoissa (esim. manifesto/agora -tyyppiset polut).                                                                                                                                                                           |
| **Viikkobulletiini (vanha)**                   | `lib/bulletin/generator.ts`, OpenAI, sähköpostimalli.                    | **Beta**          | Riippuu Supabase-riveistä (`decisions`, `lobbyist_traces`, …).                                                                                                                                                                                                                                              |
| **Viikkobulletiini (editor)**                  | `/dashboard/bulletin`, Gemini 3 Flash + grounding, ristiinviittaukset.   | **Beta**          | Oikea data kun `GEMINI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` + taulut. `person_interests` / metadata -osiot tyhjiä ilman täyttöä.                                                                                                                                                                          |
| **Lobbyist traceability (keräys)**             | Lausuntopalvelu HTML, Avoimuusrekisteri API-yritys, LLM-stance.          | **Alpha**         | `LOBBY_TRACE_USE_MOCK=true` → **mock-dokumentit** ([`lausuntopalvelu.ts`](lib/lobby/collectors/lausuntopalvelu.ts), [`avoimuusrekisteri.ts`](lib/lobby/collectors/avoimuusrekisteri.ts)). Ilman mockia: osa rajapinnoista voi palauttaa tyhjää.                                                             |
| **Valiokunta-asiantuntijat (Vaski)**           | `committee_expert_invites`, skripti `npm run sync-committee-experts`.    | **Beta**          | **Virallinen avoin API**; ei mockia itse haussa. Täytyy ajaa synkki + migr.                                                                                                                                                                                                                                 |
| **Lobby Connection Map**                       | Voimagraafi: tapaamiset, sidonnaisuudet, lausunnot, asiantuntijat.       | **Beta**          | Ei sisäänrakennettua mockia; **tyhjä tai harva verkko** jos taulut tyhjiä.                                                                                                                                                                                                                                  |
| **Sidonnaisuudet (`person_interests`)**        | Taulu + ingest-apu; bulletiinin ristiinviittaus.                         | **Alpha**         | **Ei täyttä scrapea Espoo/Eduskunta** valmiina — data insertoitava/skriptillä virallisista lähteistä.                                                                                                                                                                                                       |
| **PDF Author -metadata (lausunnot)**           | `lobby_statement_document_metadata`, `pdf-parse`.                        | **Alpha**         | Työkalu valmis; täyttö manuaali/prosessi.                                                                                                                                                                                                                                                                   |
| **Avoimuusrekisteri / läpinäkyvyys (tutkija)** | Tapaamiset `lobbyist_meetings`, transparency-fetcher.                    | **Alpha**         | [`lib/researcher/transparency-fetcher.ts`](lib/researcher/transparency-fetcher.ts) sisältää **mockApiData**-polkuja kehitykseen — varmista tuotannossa oikea polku.                                                                                                                                         |
| **Tutkija-tila**                               | Dashboard-näkymä, fingerprint, tilastot.                                 | **Beta**          | Osa visualisoinneista riippuu mock-täytöstä ja featureista.                                                                                                                                                                                                                                                 |
| **Arena / vaittely**                           | `/arena`, vaittelyreitit, demo.                                          | **Alpha**         | UI ja API osin valmiit; jännitemittari tms. kommenteissa placeholder.                                                                                                                                                                                                                                       |
| **Taloudellinen moduuli (`ECONOMY`)**          | Feature flag oletus **pois**.                                            | **Konsepti**      | `NEXT_PUBLIC_ECONOMY_ENABLED` default false [`lib/config/features.ts`](lib/config/features.ts).                                                                                                                                                                                                             |
| **Ennusteet / ranking / vertaa**               | Ennustesivut, vertailu käyttäjiin.                                       | **Alpha–Beta**    | Riippuu malleista ja datasta; osa voi olla demo.                                                                                                                                                                                                                                                            |
| **Puolueet / manifestot**                      | Virtuaalipuolueet, analyysit.                                            | **Alpha**         | Mahdollisia mock-viittauksia osallistumisessa ([`parties.ts`](app/actions/parties.ts) DNA-check kommentti).                                                                                                                                                                                                 |
| **Sähköposti / Resend**                        | Uutiskirje, testiskriptit.                                               | **Beta**          | Testi voi käyttää fixturea; tuotanto vaatii domain/avaimet.                                                                                                                                                                                                                                                 |
| **Stripe / tilaukset**                         | Checkout, portal, webhook.                                               | **Beta**          | Oikea integraatio; vaatii avaimet ja tuotteen määritykset.                                                                                                                                                                                                                                                  |
| **Auth**                                       | Email OTP, ghost session.                                                | **Tuotanto–Beta** | **BankID** ([`lib/bankid-auth.ts`](lib/bankid-auth.ts)): placeholder + **mock callback** kehityksessä — ei täyttä FTN-tuotantoa ilman toteutusta.                                                                                                                                                           |
| **Admin**                                      | Synkki, analytics, subscribers.                                          | **Beta**          | Vaihtelee reitin ja RLS:n mukaan.                                                                                                                                                                                                                                                                           |
| **Cron**                                       | `process-bills`, `process-municipal`, `sync-news`.                       | **Tuotanto**      | `vercel.json` — ei mock; vaatii `CRON_SECRET` + ympäristön.                                                                                                                                                                                                                                                 |
| **Demosivut**                                  | `/demo/harkimo`, `/vaittely/demo`, test-sivut.                           | **Konsepti**      | Tarkoitettu demoon / QA:han.                                                                                                                                                                                                                                                                                |

---

## 4. MVP-ehdotus (priorisoitu lista)

1. **Luottamus ja auth:** OTP + ghost vakaa; BankID-polku dokumentoitu tai piilotettu tuotannosta kunnes valmis.
2. **Lakidata:** yksi selkeä polku bills → yksityiskohta; **tunnista käyttäjälle** että pulssi/“poliittinen todellisuus” on heuristinen/mock.
3. **Media Watch:** vakaa synkki + yksi “vertailu” UI; embedding + migraatiot dokattu.
4. **Bulletiini (editor):** yksi generointipolku + lähteiden näkyvyys; env-varoitukset UI:ssa (tehty).
5. **Espoo (tai yksi pilottikunta):** päätöslista ja linkit virallisiin dokumentteihin.
6. **Lobby:** ensin Vaski-asiantuntijat + `lobbyist_interventions` tuotantodata; sitten Avoimuus/Lausunto ilman `LOBBY_TRACE_USE_MOCK` stagingissa; `person_interests` manuaalinen/importti.
7. **Arena / ennusteet / economy:** MVP:n ulkopuolelle tai flagit pois päältä.

---

## 5. Feature flagit (helppo kartta)

Määritelty [`lib/config/features.ts`](lib/config/features.ts) ja [`lib/env.ts`](lib/env.ts) (prefix `NEXT_PUBLIC_*`).  
Oletuksena **pois** tai varovainen: `ECONOMY_ENABLED`, `PREDICTIVE_MODELS_ENABLED`, `MP_DNA_ANALYTICS_ENABLED`.  
Muut oletuksena **päällä** (ARENAA, RESEARCHER, MUNICIPAL_WATCH, MEDIA_WATCH, PULSE, INTELLIGENCE_FEED, XP, WEEKLY_BULLETIN, ESPOO_DYNASTY).

---

## 6. Tekniset huomiot tuotehallintaan

- **Next / lockfile:** kehityksessä voidaan käyttää `NEXT_IGNORE_INCORRECT_LOCKFILE=1` (skripteissä `cross-env`).
- **AI-kustannus:** Media Watch + bulletin + arena käyttävät malleja; erillinen budjetointi.
- **Vercel Hobby:** cron- tiheys rajattu — `sync-news` päivittäinen.
- **Yhden totuuden dokumentti datalle:** [`DOCS/EDUSKUNTAVAHTI-UUTISLAHTEET-JA-MUUTOKSET.md`](EDUSKUNTAVAHTI-UUTISLAHTEET-JA-MUUTOKSET.md).

---

## 7. Seuraavat päivitykset tälle dokumentille

- [ ] Merkitse omistaja (PM) ja päivitä valmius % kvartaaleittain.
- [ ] Linkitä jokaiseen riviin GitHub-issue tai Linear ID.
- [ ] Poista/mock-kenttä: kun ominaisuus siirtyy Tuotantoon ilman mockia, päivitä taulukko.
- [ ] Julkinen tuoteroadmap (valinnainen) voi olla lyhennelmä tästä + “tulossa”.

---

_Tämä tiedosto on tarkoitettu sisäiseen tuotehallintaan; juridinen ja viestinnällinen hienosäätö erikseen._
