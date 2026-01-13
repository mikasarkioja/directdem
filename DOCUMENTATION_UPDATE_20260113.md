# DirectDem Päivityshistoria - 13.1.2026

Tämän päivän aikana DirectDem-alustaa on laajennettu merkittävästi "Tutkija-tila" (Researcher Mode) ja kansanedustajien analyysityökalujen osalta.

## 1. Kansanedustajien Retoriikka ja Persoona
*   **Robustimpi puheiden haku**: Uusi XML-pohjainen logiikka hakee täysistuntopuheet suoraan Vaski-pöytäkirjoista.
*   **Massaprofilointi**: Analysoitu 166 kansanedustajan puhetapa ja luotu yksilölliset retoriikkaprofiilit Areena-väittelyitä varten.
*   **Piilomotiivit ja aluetiedot**: Lisätty tuki lobbaustapaamisille, hallituspaikoille ja alueelliselle painotukselle (vaalipiiri/kotikunta).
*   **Data-seeding**: Päivitetty tiedot kaikille 200 aktiiviselle kansanedustajalle.

## 2. Sidonnaisuus-tutka (Dependency Radar)
*   **Eturistiriitojen tunnistus**: AI-analyysi (Dependency Radar), joka vertaa lakiesityksiä edustajan kytköksiin ja antaa Conflict Score (0-100) -arvon.
*   **RadarAlert-widget**: Visuaalinen hälytys Areena-väittelyissä, jos edustajalla on merkittäviä kytköksiä käsiteltävään aiheeseen.
*   **Dependency Timeline**: Aikajana, joka korreloi taloudelliset muutokset (esim. uusi hallituspaikka) ja poliittisen toiminnan (esim. puheet samasta aiheesta).

## 3. Avoimuusrekisteri ja Vaikuttavuus
*   **Transparency Fetcher**: Integraatio aitojen lobbaustapaamisten synkronoimiseksi.
*   **Painotettu Vaikutusindeksi**: Järjestöjen vaikuttavuusalgoritmi huomioi nyt suorat tapaamiset (multiplier 1.3x-1.6x).
*   **The Meeting Timeline**: Visuaalinen näkymä lausuntojen, tapaamisten ja lakimuutosten ajallisesta järjestyksestä.

## 4. Political Fingerprint (PDF Export)
*   **PDF-generaattori**: Mahdollisuus ladata 5-10 sivuinen syväanalyysi (Political Fingerprint) mistä tahansa kansanedustajasta.
*   **AI-synteesi**: GPT-4o koostaa jäsennellyn raportin edustajan sormenjäljestä (retoriikka, kytkökset, äänestyshistoria).
*   **Pääsynhallinta**: PDF-lataus on rajattu vain 'Researcher'-tilaajille.

## 5. Tutkijan Työhuoneen Dynaamiset Mittarit
*   **Live-laskurit**: Dashboardin luvut (Corpus size, Significance spikes, Collaborative peak) haetaan nyt reaaliajassa tietokannasta aiemman staattisen tiedon sijaan.

## 6. Järjestelmän Vakautus (Auth Fix)
*   **Auth Desync -korjaus**: Päivitetty Supabase SSR -asiakas ja Middleware korjaamaan sessioiden synkronointiongelmat (Request Sync & Lax Cookie Policy).
*   **Next.js 15 Yhteensopivuus**: Varmistettu asynkroninen evästeiden hallinta ja build-prosessin vakaus.

## Väliaikaisesti poistetut/keskeytetyt toiminnot
*   **Krediittitarkistukset**: Krediittien kulutus on väliaikaisesti poistettu käytöstä testauksen helpottamiseksi (Arena Duel, MP Chat).
*   **Pääsynhallinnan tiukkuus**: Tutkija-tilan tiukka rajat on osittain avattu, jotta kehitystyötä voidaan validoida ilman täydellistä maksuprosessia.

---
*Päivitykset ajettu GitHubiin ja Verceliin 13.1.2026.*

