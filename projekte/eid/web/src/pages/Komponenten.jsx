import PageHero from '../sections/PageHero.jsx';
import Warteliste from '../sections/Warteliste.jsx';

const SORTIMENT = [
  ['Module', 'Glas-Glas und Glas-Folie, für Dach, Carport und Freifläche.'],
  ['Wechselrichter', 'String- und Hybrid-Wechselrichter, passend zur Anlagengröße und zum Speicher.'],
  ['Speicher', 'Für Haus, Gewerbe und Landwirtschaft, mit einem regionalen Hersteller aus Westsachsen.'],
  ['Unterkonstruktion', 'Für Ziegel-, Blech- und Flachdach sowie Freifläche.'],
  ['Messtechnik', 'Intelligente Messsysteme und Steuerboxen, Voraussetzung für Stromgemeinschaft und § 14a EnWG.'],
  ['Wallbox', 'Zum Laden mit eigenem Solarstrom und zu günstigen Börsenstunden.']
];

const ABLAUF = [
  ['Planen', 'Sie schicken uns Ihre Planung aus SolarNavi oder Dachmaße und Verbrauch.'],
  ['Angebot', 'Wir holen Angebote bei unseren Fachpartnern ein und stellen sie nebeneinander.'],
  ['Montage', 'Ein Elektrofachbetrieb aus Ihrer Region baut die Anlage auf.'],
  ['Abnahme', 'Die Erstprüfung wird mit PV-Monteur dokumentiert, Messwert für Messwert nach VDE.']
];

export default function Komponenten() {
  return (
    <>
      <PageHero
        kicker="Komponenten"
        title="Die richtigen Teile, vom passenden Fachpartner"
        lead="Wir verkaufen nicht ab Lager, sondern stellen zusammen, was zu Ihrer Anlage passt, und holen Angebote bei geprüften Fachpartnern ein. Sie kaufen direkt beim Partner, mit Gewährleistung und Montage aus Ihrer Region."
      >
        <a className="btn btn-sun" href="#warteliste">
          Komponenten anfragen
        </a>
      </PageHero>
      <section className="section" aria-labelledby="sort-h">
        <div className="wrap">
          <h2 id="sort-h">Was wir zusammenstellen</h2>
          <ul className="areas areas-static">
            {SORTIMENT.map(([t, x]) => (
              <li key={t} className="reveal-item">
                <div>
                  <strong>{t}</strong>
                  <span>{x}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section section-paper" aria-labelledby="ablauf-h">
        <div className="wrap">
          <h2 id="ablauf-h">Von der Planung bis zur Abnahme</h2>
          <ol className="steps">
            {ABLAUF.map(([t, x]) => (
              <li key={t} className="reveal-item">
                <h3>{t}</h3>
                <p>{x}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Warteliste
        options={['komponenten', 'installateur']}
        source="komponenten"
        title="Komponenten anfragen"
        lead="Nennen Sie uns Anlagengröße und Postleitzahl. Wir melden uns mit einer Zusammenstellung und den Angeboten unserer Fachpartner."
        note="Elektrobetriebe, die bei uns als Fachpartner gelistet werden möchten, wählen „Als Installateur Kunden vermitteln“."
      />
    </>
  );
}
