import PageHero from '../sections/PageHero.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import Werkzeuge from '../sections/Werkzeuge.jsx';
import { TOOLS, toolUrl } from '../site.config.js';

const check = TOOLS.find(t => t.id === 'check');

const FUNKTIONEN = [
  ['Dach einzeichnen', 'Auf der Karte die Dachfläche umfahren, Dachneigung und Ausrichtung angeben, Gauben und Fenster aussparen.'],
  ['Ertrag berechnen', 'Der Jahresertrag kommt aus den Strahlungsdaten der EU-Datenbank PVGIS für Ihren Standort.'],
  ['Ergebnis mitnehmen', 'Belegung, Leistung und Ertrag als PDF, als Grundlage für Angebote und Gespräche mit dem Installateur.']
];

export default function Planen() {
  return (
    <>
      <PageHero
        kicker="Planen"
        title="Wissen, was aufs Dach passt, bevor jemand kommt"
        lead="Der ECONEnergie-Check zeigt in fünf Minuten, was Ihr Dach kann: Leistung, Eigenverbrauch, Speicher und Ersparnis, ohne Anmeldung. Für die genaue Planung kommt SolarNavi."
      >
        <a className="btn btn-sun" href={toolUrl(check, 'planen')} rel="noopener">
          Solar-Check starten
        </a>
        <a className="btn btn-line-light" href="#warteliste">
          Planung anfragen
        </a>
      </PageHero>
      <Werkzeuge bereich="planen" title="Zwei Werkzeuge, ein Ziel" />
      <section className="section section-paper" aria-labelledby="fn-h">
        <div className="wrap">
          <h2 id="fn-h">So plant SolarNavi</h2>
          <ol className="steps">
            {FUNKTIONEN.map(([t, x]) => (
              <li key={t} className="reveal-item">
                <h3>{t}</h3>
                <p>{x}</p>
              </li>
            ))}
          </ol>
          <p className="note">
            SolarNavi ist in der Entwicklung. Wer sich einträgt, bekommt als Erster Zugang oder eine Planung von uns.
          </p>
        </div>
      </section>
      <Warteliste
        options={['planen']}
        source="planen"
        title="Planung anfragen"
        lead="Tragen Sie sich ein. Wir melden uns, sobald SolarNavi für Sie freigeschaltet ist, oder planen Ihre Anlage vorab mit Ihnen."
      />
    </>
  );
}
