import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Pruefen from '../sections/Pruefen.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { site } from '../site.config.js';

export default function PruefenPage() {
  const [interest, setInterest] = useState('');
  const want = v => () => setInterest(v);
  return (
    <>
      <PageHero
        kicker="Prüfen und warten"
        title="Kein Haken ohne Messwert"
        lead="Geld verdient nur eine Anlage, die sicher läuft. Für Elektrofachbetriebe gibt es PV-Monteur, die App für Prüfprotokolle nach VDE. Für Anlagenbetreiber vermitteln wir Prüfung und Wartung durch Betriebe, die damit arbeiten."
      >
        <a className="btn btn-sun" href={site.pvMonteurUrl}>
          PV-Monteur testen
        </a>
        <a className="btn btn-line-light" href="#warteliste" onClick={want('wartung')}>
          Wartung beauftragen
        </a>
      </PageHero>
      <Pruefen />
      <section className="section section-paper" id="partner" aria-labelledby="partner-h">
        <div className="wrap sides">
          <article className="side reveal-item">
            <p className="side-who">Sie betreiben eine Anlage</p>
            <h3 id="partner-h">Prüfung und Wartung beauftragen</h3>
            <ul>
              <li>
                <strong>Wiederholungsprüfung</strong> nach DIN VDE 0100 und IEC 62446-1, dokumentiert mit Prüfsumme auf jeder
                Seite.
              </li>
              <li>
                <strong>Fehlersuche</strong> bei Ertragsverlust, Isolationsfehler oder Abschaltungen.
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
                <strong>Aufträge:</strong> Prüfungen und Montagen aus der Region gehen an Partnerbetriebe.
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
