import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Vermittler from '../sections/Vermittler.jsx';
import Pruefen from '../sections/Pruefen.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { site } from '../site.config.js';

export default function PruefenPage() {
  const [interest, setInterest] = useState('');
  const want = v => () => setInterest(v);
  return (
    <>
      <PageHero
        scene="pruefen"
        facts={[['40 MW', 'gewartet und geprüft in zwei Jahren'], ['53', 'Messpunkte je Protokoll']]}
        kicker="Prüfen und warten"
        title="Kein Haken ohne Messwert"
        lead="Geld verdient nur eine Anlage, die sicher läuft. Wir prüfen und warten Solaranlagen selbst, seit zwei Jahren und bisher rund 40 MW, und suchen Fehler bis zur Ursache. Unser Werkzeug dafür, PV-Monteur, gibt es auch für Elektrofachbetriebe."
      >
        <a className="btn btn-sun" href="#warteliste" onClick={want('pruefen')}>
          Prüfung anfragen
        </a>
        <a className="btn btn-line-light" href={site.pvMonteurUrl}>
          PV-Monteur testen
        </a>
      </PageHero>
      <Vermittler label="Wir prüfen selbst.">Prüfung, Messung, Fehlersuche und Wartung machen wir selbst, nach Angebot, Anfahrt 0,50 € je Kilometer. Reparaturen und Spezialmessungen vergeben wir nach Ihrer Freigabe an Fachfirmen, die direkt mit Ihnen abrechnen.</Vermittler>
      <Pruefen />
      <section className="section section-paper" id="partner" aria-labelledby="partner-h">
        <div className="wrap sides">
          <article className="side reveal-item">
            <p className="side-who">Sie betreiben eine Anlage</p>
            <h3 id="partner-h">Prüfung und Wartung beauftragen</h3>
            <ul>
              <li>
                <strong>Wir kommen selbst:</strong> Prüfung, Messung und Wartung aus einer Hand, nach Angebot. Anfahrt 0,50 €
                je Kilometer.
              </li>
              <li>
                <strong>Wiederholungsprüfung</strong> nach DIN VDE 0100 und IEC 62446-1, dokumentiert mit Prüfsumme auf jeder
                Seite.
              </li>
              <li>
                <strong>Fehlersuche bis zur Ursache</strong> bei Ertragsverlust, Isolationsfehler oder Abschaltungen. Aus der
                Praxis: Eine Anlage im Landkreis Zwickau lieferte zu wenig. Unsere Messungen zeigten auf die AC-Seite, ein
                Kabelmesswagen bestätigte es: Der Leiter L1 war komplett zerstört. Die Reparatur übernimmt eine AC-Fachfirma.
              </li>
              <li>
                <strong>Protokoll ohne Anhang:</strong> Sie rufen es mit eigener Kennung ab, jeder Abruf wird protokolliert.
              </li>
            </ul>
            <a className="btn btn-ink" href="#warteliste" onClick={want('wartung')}>
              Prüfung anfragen
            </a>
          </article>
          <article className="side side-dark reveal-item">
            <p className="side-who">Sie sind Elektrofachbetrieb</p>
            <h3>Kunden vermitteln, mitverdienen</h3>
            <ul>
              <li>
                <strong>Vermarktung und Speicher:</strong> Ihre Kunden fragen, was mit dem Strom ab 2027 passiert. Sie
                vermitteln an uns, wir kümmern uns.
              </li>
              <li>
                <strong>Aufträge:</strong> Montagen und Reparaturen aus der Region gehen an Partnerbetriebe.
              </li>
              <li>
                <strong>Werkzeug:</strong> PV-Monteur 14 Tage kostenlos, danach 39,90 € im Monat je Betrieb zzgl. USt.
              </li>
            </ul>
            <a className="btn btn-sun" href="#warteliste" onClick={want('installateur')}>
              Partner werden
            </a>
          </article>
        </div>
      </section>
      <Warteliste
        options={['wartung', 'pruefen', 'installateur']}
        interest={interest}
        setInterest={setInterest}
        source="pruefen"
        title="Prüfen, warten, Partner werden"
        lead="Ob Sie eine Prüfung brauchen oder selbst prüfen: Tragen Sie sich ein, wir melden uns innerhalb weniger Tage."
      />
    </>
  );
}
