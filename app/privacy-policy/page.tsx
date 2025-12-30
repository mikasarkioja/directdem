export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-nordic-white dark:bg-nordic-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-nordic-darker dark:text-nordic-white mb-8">
          Tietosuojaseloste ja käyttöehdot
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              1. Henkilötietojen käsittely
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray mb-4">
              Eduskuntavahti käsittelee henkilötietojasi EU:n yleisen tietosuoja-asetuksen
              (GDPR) mukaisesti. Keräämme seuraavia tietoja:
            </p>
            <ul className="list-disc list-inside space-y-2 text-nordic-dark dark:text-nordic-gray">
              <li>Sähköpostiosoite (kirjautumista varten)</li>
              <li>Nimi (valinnainen, profiilissa)</li>
              <li>Vaalipiiri (valinnainen, profiilissa)</li>
              <li>Äänestykset lakiesityksistä</li>
              <li>Kirjautumisaikaleimat</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              2. Tietojen käyttötarkoitus
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray mb-4">
              Henkilötietojasi käytetään seuraaviin tarkoituksiin:
            </p>
            <ul className="list-disc list-inside space-y-2 text-nordic-dark dark:text-nordic-gray">
              <li>Käyttäjätunnuksen luominen ja kirjautumisen hallinta</li>
              <li>Äänestyksesi tallentaminen ja näyttäminen</li>
              <li>Yksilöllisten tilastojen ja raporttien luominen</li>
              <li>Palvelun parantaminen ja kehittäminen</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              3. Tietojen jakaminen
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray">
              Emme jaa henkilötietojasi kolmansien osapuolien kanssa. Äänestyksesi
              näytetään vain aggregoituna muiden käyttäjien äänestysten kanssa. Yksittäisiä
              äänestyksiäsi ei näytetä muille käyttäjille.
            </p>
          </section>

          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              4. Oikeutesi
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray mb-4">
              Sinulla on oikeus:
            </p>
            <ul className="list-disc list-inside space-y-2 text-nordic-dark dark:text-nordic-gray">
              <li>Saada tietoja käsiteltävistä henkilötiedoistasi</li>
              <li>Oikaista virheellisiä henkilötietoja</li>
              <li>Poistaa henkilötietosi</li>
              <li>Vastustaa henkilötietojesi käsittelyä</li>
              <li>Siirtää henkilötietosi toiseen palveluun</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              5. Evästeet
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray">
              Käytämme evästeitä kirjautumisen ylläpitämiseen. Emme käytä
              seurantaevästeitä tai mainosevästeitä.
            </p>
          </section>

          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              6. Yhteydenotto
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray">
              Jos sinulla on kysymyksiä tietosuojasta, ota yhteyttä:
              tietosuoja@eduskuntavahti.fi
            </p>
          </section>

          <section className="bg-white dark:bg-nordic-darker rounded-lg p-6 shadow-sm border border-nordic-gray dark:border-nordic-darker">
            <h2 className="text-2xl font-semibold text-nordic-darker dark:text-nordic-white mb-4">
              7. Hyväksyntä
            </h2>
            <p className="text-nordic-dark dark:text-nordic-gray">
              Käyttämällä Eduskuntavahti-palvelua hyväksyt tämän tietosuojaselosteen ja
              käyttöehdot. Voit peruuttaa suostumuksesi milloin tahansa poistamalla
              tilisi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

