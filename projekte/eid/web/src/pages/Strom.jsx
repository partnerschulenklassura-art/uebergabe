import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import ZweiSeiten from '../sections/ZweiSeiten.jsx';
import Vermarkten from '../sections/Vermarkten.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import Werkzeuge from '../sections/Werkzeuge.jsx';

const ABLAUF = [
  ['Eintragen', 'Erzeuger und Abnehmer tragen sich mit Postleitzahl ein. So sehen wir, wo im selben Netzgebiet beide Seiten zusammenkommen.'],
  ['Messkonzept prüfen', 'Für Strom aus der Nachbarschaft braucht jede Seite ein intelligentes Messsystem. Wir klären mit dem Messstellenbetreiber, was fehlt.'],
  ['Preis festlegen', 'Der Gemeinschaftspreis liegt zwischen dem, was der Erzeuger an der Börse bekäme, und dem, was der Abnehmer sonst für Energie zahlt. Beide gewinnen.'],
  ['Abrechnen', 'Wir übernehmen Zuordnung und Abrechnung der geteilten Mengen. Reststrom kommt wie bisher vom Lieferanten.']
];

export default function Strom() {
  const [interest, setInterest] = useState('');
  const want = v => () => setInterest(v);
  return (
    <>
      <PageHero
        kicker="Strom kaufen und verkaufen"
        title="Der eine zahlt weniger, der andere bekommt mehr"
        lead="Mittags ist Solarstrom an der Börse fast nichts wert, abends zahlen Haushalte den vollen Preis. Wir bringen Erzeuger und Abnehmer zusammen: über die Stromgemeinschaft, die passende Direktvermarktung und den dynamischen Tarif."
      >
        <a className="btn btn-sun" href="#warteliste" onClick={want('kaufen')}>
          Strom günstiger kaufen
        </a>
        <a className="btn btn-line-light" href="#warteliste" onClick={want('teilen')}>
          Strom verkaufen
        </a>
      </PageHero>
      <ZweiSeiten onWant={want} />
      <section className="section" id="gemeinschaft" aria-labelledby="gem-h">
        <div className="wrap">
          <h2 id="gem-h">So funktioniert die Stromgemeinschaft</h2>
          <p className="lead narrow">
            Seit 1. Juni 2026 dürfen Letztverbraucher Strom aus erneuerbaren Anlagen im selben Netzgebiet gemeinsam nutzen
            (§ 42c EnWG). Die Anlage darf dafür nicht gewerblich betrieben werden. Für Gewerbeanlagen bieten wir einen
            Liefervertrag an.
          </p>
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
      <Werkzeuge bereich="strom" title="Nachbarwatt" lead="Unsere Stromgemeinschaft startet bald. Wer sich jetzt einträgt, ist bei der Eröffnung im eigenen Netzgebiet dabei." />
      <Vermarkten onWant={want} />
      <Warteliste
        options={['kaufen', 'teilen', 'bestand', 'neu2027']}
        interest={interest}
        setInterest={setInterest}
        source="strom"
        title="Für die Stromgemeinschaft eintragen"
        lead="Wir bringen zuerst Erzeuger und Abnehmer aus demselben Netzgebiet zusammen. Ein Eintrag kostet nichts und verpflichtet zu nichts."
      />
    </>
  );
}
