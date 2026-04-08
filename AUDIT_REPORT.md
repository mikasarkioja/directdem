# DirectDem / Eduskuntavahti - Täysimittainen auditointiraportti

## 1) Yhteenveto

Projektissa on laaja ominaisuuspinta ja vahva tekninen perusta (Next.js 15, Supabase, AI-putket, cron-ajot, admin-UI), mutta kokonaisuus on tällä hetkellä **pääosin Beta-vaiheessa**.  
Suurimmat riskit ennen julkaisua liittyvät:

- ~~kahteen rinnakkaiseen viikkokatsausgeneraattoriin~~ → **korjattu:** yksi lähde `lib/bulletin/generator.ts` (+ testilähetys ja cron käyttävät `generateWeeklyReportEmailPayload`)
- feature flag -hajautumiseen (env-flagit määritelty, mutta eivät ohjaa keskitetysti näkyvyyttä)
- Espoo traceability -putken PDF/tekstitason robustiuteen (OCR/parsinta fallbackit)
- cron-ajastuksen puutteeseen (`weekly-bulletin` ei näy `vercel.json` cron-listassa)

---

## 2) Toiminnallisuuksien inventaario + valmiusaste

### 2.1 Auth & identity / Supabase SSR

- **Status: Beta**
- **Keskeiset tiedostot:** `app/auth/callback/route.ts`, `lib/supabase/middleware.ts`, `lib/supabase/server.ts`, `app/actions/auth.ts`
- **Arvio:** Session/cookie-ketju on pitkälle korjattu ja middleware-käytännöt ovat modernit, mutta kokonaisuus sisältää edelleen ghost-/guest-polkuja ja useita rinnakkaisia auth-polkuja.

### 2.2 Eduskunta-data + äänestysydin

- **Status: Beta**
- **Keskeiset tiedostot:** `app/actions/bills-supabase.ts`, `app/actions/votes.ts`, `supabase/schema.sql`
- **Arvio:** Ydinpolku (bills/votes) toimii, mutta ympärillä on paljon lisälogiikkaa, joka kasvattaa regressioriskiä.

### 2.3 Dynasty-skanneri (Espoo/Vantaa) ja kuntapäätökset

- **Status: Beta**
- **Keskeiset tiedostot:** `lib/scrapers/espoo-dynasty.ts`, `app/actions/espoo-actions.ts`, `app/actions/municipal.ts`, `app/api/cron/process-municipal/route.ts`
- **Arvio:** End-to-end-putki on olemassa (scrape -> analyysi -> DB -> UI), mutta HTML-riippuvainen scraping on hauras rakennemuutosriskeille.

### 2.4 PDF-parseri

- **Status: Beta**
- **Keskeiset tiedostot:** `lib/scrapers/pdf-utils.ts`, `lib/pdf-extractor.ts`
- **Arvio:** Toteutus sisältää virheviestit, puhdistuksen ja OCR-varoituksen. Samassa repo:ssa on kuitenkin kaksi osittain päällekkäistä parseria.

### 2.5 Lobbyist Traceability (kansallinen)

- **Status: Konsepti / Draft**
- **Keskeiset tiedostot:** `lib/ai/traceability-logic.ts`, `lib/researcher/influence-stats.ts`, `app/actions/lobbyist-stats.ts`
- **Arvio:** Arkkitehtuuri ja analyysiajatus vahva, mutta deterministinen validointi ja tuotantotason laadunvarmistus ovat rajallisia.

### 2.6 Espoo Lobby Traceability (uusi)

- **Status: Beta (varhainen)**
- **Keskeiset tiedostot:** `lib/municipal/espoo-lobby-traceability.ts`, `supabase/espoo-lobby-traces-schema.sql`
- **Arvio:** Toimiva runko (liitehaku, similarity, AI-tulkinta, high_influence-lippu, tallennus), mutta PDF-analyysi käyttää vielä kevyttä fallbackia eikä OCR-ketju ole integroituna.

### 2.7 MP DNA -analyysi

- **Status: Beta**
- **Keskeiset tiedostot:** `app/actions/dna.ts`, `scripts/analyze-mp-dna.ts`, `supabase/democratic-dna-schema.sql`
- **Arvio:** Toiminnallinen analyysiputki on laaja, mutta AI/heuristiikkariippuvuus ja osittainen script-pohjaisuus vaativat lisähardeningia.

### 2.8 Predictive Influence / Dependency Radar

- **Status: Konsepti / Draft**
- **Keskeiset tiedostot:** `lib/ai/dependency-radar.ts`, `app/actions/dependency-timeline.ts`
- **Arvio:** Hyvä suunta, mutta tuotantotason verifiointi, mittarointi ja rajapintastabiliteetti vaativat työtä.

### 2.9 Viikkokirjeautomaatio (generate + cron + resend + archive)

- **Status: Beta**
- **Keskeiset tiedostot:** `app/api/cron/weekly-bulletin/route.ts`, `components/emails/WeeklyBulletin.tsx`, `app/actions/newsletter-subscribers.ts`, `lib/bulletin/generator.ts`
- **Arvio:** Yksi generaattori; legacy JSON-polku käyttää `fallbackWeeklyReportData()` virheissä. `weekly-bulletin` voidaan lisätä `vercel.json`iin erikseen (Hobby-cronrajat).

### 2.10 Admin-hallinta (tilaajat + testilähetys)

- **Status: Beta**
- **Keskeiset tiedostot:** `app/admin/subscribers/page.tsx`, `components/admin/SubscribersManager.tsx`, `app/actions/newsletter-subscribers.ts`, `app/actions/admin.ts`
- **Arvio:** UI + CRUD + testilähetys valmiina ja suojattu. Silti testilähetys käyttää eri generaattoria kuin cron (katso löydökset).

---

## 3) Erityistarkastukset

### 3.1 `lib/scrapers/pdf-utils.ts` ja Espoo lobby -traceability

- **Päivitys:** `espoo-lobby-traceability.ts` kutsuu `extractTextFromPdf()` PDF-liitteille (similarity + AI edelleen).
- **Huom:** Skannatut PDF:t voivat palauttaa OCR-varoituksen — similarity voi jäädä matalaksi.

### 3.2 `WeeklyBulletin.tsx` ja API-reitin yhteensopivuus

- **Havainto:** `app/api/cron/weekly-bulletin/route.ts` käyttää `generateWeeklyReport()` + `WeeklyBulletin`-props-rakennetta (`parliamentData`, `espooData`) oikein.
- **Päivitys:** `sendTestBulletin` ja cron käyttävät molemmat `generateWeeklyReportEmailPayload()` (`lib/bulletin/generator.ts`).

### 3.3 Admin-paneelin testilähetys-painikkeen suojaus

- **Havainto:** Suojaus on kaksitasoinen:
  - sivu: `requireAdmin()` (`app/admin/subscribers/page.tsx`)
  - server action: `checkAdminAccess()` (`sendTestBulletin` `app/actions/newsletter-subscribers.ts`)
- **Arvio:** **Hyvä / oikein suojattu**.

---

## 4) MVP-kontrolli (Feature Visibility)

### Löydetyt mekanismit

- Keskitetty gate löytyy: `lib/config/features.ts` (`isFeatureEnabled`)
- Käyttö dashboardissa/navissa: `app/dashboard/DashboardClient.tsx`, `components/Sidebar.tsx`, `app/dashboard/page.tsx`
- Env-flagit löytyvät: `lib/env.ts` (`NEXT_PUBLIC_*_ENABLED`)

### Ongelmakohta

- Env-flagit ovat määriteltynä, mutta `lib/config/features.ts` käyttää tällä hetkellä **hardkoodattuja booleaneja**.
- Käytännössä feature-visibility on osittain keskitetty, mutta runtime-ohjattavuus on rajallinen.

### Päätös

- Erillistä `lib/features.ts`-mallia ei tarvitse luoda, koska keskitetty malli on jo olemassa (`lib/config/features.ts`).
- **Tarvittava parannus:** kytke `FEATURES` lukemaan `env`-arvot, jotta MVP-vaiheessa voidaan togglettaa ilman koodimuutoksia.

---

## 5) Priorisointimatriisi (Value vs Complexity)

| Ominaisuus                              | Arvo liiketoiminnalle | Toteutuskompleksisuus | Suositus v1                          |
| --------------------------------------- | --------------------: | --------------------: | ------------------------------------ |
| Auth + core voting flow                 |       Erittäin korkea |             Keskitaso | **Mukana**                           |
| Admin tilaajahallinta + testilähetys    |                Korkea |      Matala-keskitaso | **Mukana**                           |
| Viikkokirje massalähetys                |                Korkea |             Keskitaso | **Mukana**                           |
| Dynasty kuntapäätösfeed                 |                Korkea |             Keskitaso | **Mukana**                           |
| Espoo lobby traceability                |           Keskikorkea |                Korkea | **Mukana rajattuna (beta-merkintä)** |
| MP DNA syväanalytiikka                  |             Keskitaso |                Korkea | Julkaise vaiheistetusti              |
| Predictive Influence / Dependency Radar |             Keskitaso |                Korkea | Siirrä v1.1/v1.2                     |
| Kehittyneet premium/researcher-polut    |             Keskitaso |           Keskikorkea | Siirrä vaiheittain                   |

---

## 6) Julkaisukelpoisuuden yhteenveto

- **Tuotantovalmis:** yksittäisiä osia (esim. admin-suojausmalli, perus-CRUD-polut)
- **Beta:** valtaosa ydinominaisuuksista (suositeltu launch-tila)
- **Konsepti/Draft:** osa edistyneistä analytiikkaominaisuuksista

**Suositus:** Julkaise v1 rajatulla feature-setillä + selkeä “beta” -merkintä analytiikkamoduleille.

---

## Next Steps (kriittisimmät ennen julkaisua)

1. **Yhdistä viikkokatsausgeneraattorit**: poista duplikaatti (`lib/bulletin/generate.ts` tai `lib/bulletin/generator.ts`) ja käytä yhtä lähdettä kaikkialla (cron + testilähetys).
2. **Kytke env feature flagit oikeasti käyttöön**: johda `FEATURES`-arvot `env`-muuttujista.
3. **Integroi `extractTextFromPdf()` Espoo traceabilityyn** PDF-liitteille; lisää fallback OCR-jono.
4. **Lisää `weekly-bulletin` cron `vercel.json`-ajastukseen**, jotta automaatio toimii tuotannossa ilman manuaaliajoa.
5. **Lisää integraatiotestit** vähintään:
   - `WeeklyBulletin props` ↔ `generateWeeklyReport` schema
   - `sendTestBulletin` ↔ sama generaattori kuin cron
   - `espoo_lobby_traces` putki (high_influence >= 70)
6. **Kiristä virhepolut observabilityyn**: lisää yhtenäinen virhekooditus + run-id cronajoihin.
