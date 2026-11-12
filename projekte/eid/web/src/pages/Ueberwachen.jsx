import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Warteliste from '../sections/Warteliste.jsx';


// Rechenbeispiel: Annahmen stehen auf der Seite. Werte nur hier ändern.
const ANNAHMEN = { kwhJeKwpTag: 5, euroJeKwh: 0.06, sanktionJeKwMonat: 10 };
const fmt = n => n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
const rechne = kwp => ({
  tag: kwp * ANNAHMEN.kwhJeKwpTag * ANNAHMEN.euroJeKwh,
  teil: kwp * ANNAHMEN.kwhJeKwpTag * ANNAHMEN.euroJeKwh * 0.1 * 28,
  sanktion: kwp * ANNAHMEN.sanktionJeKwMonat
});

const ANLAGEN = [
  {
    who: 'Dachanlage',
    title: '1.000 kWp auf dem Dach',
    kwp: 1000,
    dark: false,
    punkte: [
      ['Typischer Aufbau', 'Viele gleichartige Wechselrichter auf mehreren Dachflächen, oft mit Eigenverbrauch im Gebäude.'],
      ['Das Risiko', 'Fällt einer von zehn Wechselrichtern aus, fehlen 10 % Ertrag. Ohne Vergleich bemerkt das oft wochenlang niemand.'],
      ['Was wir auswerten', 'Wechselrichter untereinander vergleichen, Erzeugung, Verbrauch und Einspeisung über die Zähler sauber trennen.']
    ]
  },
  {
    who: 'Freifläche',
    title: '2.000 kWp auf der Freifläche',
    kwp: 2000,
    dark: true,
    punkte: [
      ['Typischer Aufbau', 'Wenige große Wechselrichter, eigene Trafostation, Anbindung meist über Mobilfunk, niemand vor Ort.'],
      ['Das Risiko', 'Jeder Ausfalltag zählt doppelt. Fällt die Verbindung aus, sieht auch der Direktvermarkter keine Werte mehr.'],
      ['Was wir auswerten', 'Strings vergleichen, Soll-Ist mit Einstrahlung, Verbindung und Trafostation überwachen.']
    ]
  }
];

const ABLAUF = [
  ['Mitlesen', 'Wir lesen die Werte Ihrer Wechselrichter, Logger und Zähler nur lesend mit. An der Steuerung Ihrer Anlage ändern wir nichts.'],
  ['Abgleichen', 'Logger gegen Zähler, Wechselrichter gegen Wechselrichter, String gegen String. Abweichungen fallen auf, auch ohne Einstrahlungssensor.'],
  ['Melden', 'Bei Ausfall oder Teilausfall bekommen Sie eine Nachricht mit Zahlen: was fehlt, seit wann, wie viel Ertrag.'],
  ['Nachweisen', 'Wir bereiten die Meldung an Direktvermarkter und Netzbetreiber vor, mit Messwerten und Zeitraum. Sie prüfen und senden.']
];

export default function Ueberwachen() {
  const [interest, setInterest] = useState('');
  const want = v => () => setInterest(v);
  return (
    <>
      <PageHero
        kicker="Überwachen"
        title="Fehler sehen, bevor sie Geld kosten"
        lead="Ein Monitoring-Portal ist schnell gekauft. Teuer wird die Zeit, bis jemand einen Teilausfall bemerkt, die Ursache findet und dem Direktvermarkter belegt, was passiert ist. Genau diese Arbeit nehmen wir Betreibern von Anlagen ab 100 kWp ab."
      >
        <a className="btn btn-sun" href="#warteliste" onClick={want('monitoring')}>
          Pilotanlage melden
        </a>
        <a className="btn btn-line-light" href="#rechenbeispiel">
          Rechenbeispiel ansehen
        </a>
      </PageHero>

      <section className="section section-paper" id="rechenbeispiel" aria-labelledby="rb-h">
        <div className="wrap">
          <h2 id="rb-h">Zwei Anlagen im Rechenbeispiel</h2>
          <p className="lead">
            Annahmen: {ANNAHMEN.kwhJeKwpTag} kWh je kWp an einem Sommertag, {fmt(ANNAHMEN.euroJeKwh * 100)} ct je kWh Erlös.
            Sanktion bei fehlender Fernsteuerbarkeit {ANNAHMEN.sanktionJeKwMonat} € je kW und Monat (§ 52 EEG). Keine Ertragszusage.
          </p>
          <div className="sides">
            {ANLAGEN.map(a => {
              const r = rechne(a.kwp);
              return (
                <article key={a.kwp} className={`side reveal-item${a.dark ? ' side-dark' : ''}`}>
                  <p className="side-who">{a.who}</p>
                  <h3>{a.title}</h3>
                  <ul>
                    {a.punkte.map(([t, x]) => (
                      <li key={t}>
                        <strong>{t}:</strong> {x}
                      </li>
                    ))}
                  </ul>
                  <dl className="model-rows">
                    <div>
                      <dt>Ein Tag Totalausfall</dt>
                      <dd>rund {fmt(r.tag)} € Ertrag</dd>
                    </div>
                    <div>
                      <dt>10 % Ausfall, vier Wochen unbemerkt</dt>
                      <dd>rund {fmt(r.teil)} € Ertrag</dd>
                    </div>
                    <div>
                      <dt>Sanktion je Monat nach § 52 EEG</dt>
                      <dd>{fmt(r.sanktion)} €</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-ink" id="kosten" aria-labelledby="kosten-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="kosten-h">Wo das Geld wirklich hingeht</h2>
            <p className="lead">Die Software ist selten der große Posten. Datenlogger, Lizenzen und vor allem die Betreuung sind es.</p>
            <p>
              Herstellerunabhängige Portale kosten für eine Anlage mit 1 MWp oft nur wenige hundert Euro im Jahr. Dazu kommen der
              Datenlogger, Lizenzen für die Schnittstelle zum Direktvermarkter und jemand, der Alarme bewertet, Ursachen sucht
              und mit Direktvermarkter und Netzbetreiber korrespondiert.
            </p>
          </div>
          <ul className="plain-list">
            <li className="reveal-item">
              <strong>Alarme ohne Auswertung:</strong> Ein Portal meldet einen Ausfall. Ob Messfehler oder echter Ertragsverlust,
              muss jemand klären.
            </li>
            <li className="reveal-item">
              <strong>Teilausfälle:</strong> Ein defektes Kabel oder ein ausgefallener String fällt in der Tagessumme kaum auf.
            </li>
            <li className="reveal-item">
              <strong>Abweichung Logger und Zähler:</strong> Melden sie unterschiedliche Werte, fragt der Direktvermarkter nach.
              Dann zählt, wer schnell belegen kann, was passiert ist.
            </li>
          </ul>
        </div>
      </section>

      <section className="section" id="ablauf" aria-labelledby="ablauf-h">
        <div className="wrap">
          <h2 id="ablauf-h">So arbeiten wir</h2>
          <p className="lead">Wir ersetzen nicht Ihre Technik. Wir werten aus, was sie liefert, und machen daraus Arbeit, die erledigt ist.</p>
          <ol className="steps">
            {ABLAUF.map(([t, x]) => (
              <li key={t} className="reveal-item">
                <h3>{t}</h3>
                <p>{x}</p>
              </li>
            ))}
          </ol>
          <p className="note">
            Wir starten mit Pilotanlagen. Welche Wechselrichter und Logger wir zuerst anbinden, richtet sich nach den gemeldeten
            Anlagen.
          </p>
        </div>
      </section>

      <section className="section section-ink" id="grenzen" aria-labelledby="grenzen-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="grenzen-h">Was bleibt, wie es ist</h2>
            <p className="lead">
              Steuern darf an Ihrer Anlage nur zertifizierte Technik. Daran rühren wir nicht, wir lesen nur mit.
            </p>
          </div>
          <ul className="plain-list">
            <li className="reveal-item">
              <strong>Parkregler:</strong> Anlagen am Mittelspannungsnetz brauchen einen Regler mit Komponentenzertifikat nach
              VDE-AR-N 4110.
            </li>
            <li className="reveal-item">
              <strong>Fernwirktechnik:</strong> Die Anbindung an den Netzbetreiber folgt dessen technischen Vorgaben.
            </li>
            <li className="reveal-item">
              <strong>Schnittstelle zum Direktvermarkter:</strong> Ist-Einspeisung abrufen und Leistung reduzieren, wie § 10b EEG
              es verlangt.
            </li>
            <li className="reveal-item">
              <strong>Ab 2028:</strong> Steuerung über Smart-Meter-Gateway und Steuerbox, eingebaut und betrieben vom
              Messstellenbetreiber.
            </li>
          </ul>
        </div>
      </section>

      <section className="section" id="recht" aria-labelledby="recht-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="recht-h">Rechtsrahmen</h2>
            <p className="lead">Stand 10. November 2026. Keine Rechtsberatung.</p>
            <a className="btn btn-ink" href="/pruefen/">
              Zu Prüfung und Wartung
            </a>
          </div>
          <dl className="model-rows reveal-item">
            <div>
              <dt>§ 10b EEG</dt>
              <dd>Anlagen über 25 kW in der Direktvermarktung: Ist-Einspeisung abrufbar, Leistung fernsteuerbar</dd>
            </div>
            <div>
              <dt>§ 52 EEG</dt>
              <dd>Bei Verstoß 10 € je kW und Kalendermonat</dd>
            </div>
            <div>
              <dt>Smart-Meter-Gateway</dt>
              <dd>Steuerung darüber ab 1. Januar 2028 oder früher, sobald ein intelligentes Messsystem eingebaut ist</dd>
            </div>
            <div>
              <dt>EEG 2027</dt>
              <dd>Laut Regierungsentwurf soll die 25-kW-Grenze in § 10b entfallen</dd>
            </div>
          </dl>
        </div>
      </section>

      <Warteliste
        options={['monitoring', 'wartung']}
        interest={interest}
        setInterest={setInterest}
        source="ueberwachen"
        title="Pilotanlage melden"
        lead="Nennen Sie uns Leistung, Wechselrichter und Datenlogger Ihrer Anlage. Wir melden uns innerhalb weniger Tage und sagen, ob sie in die Pilotphase passt."
      />
    </>
  );
}
