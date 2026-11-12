import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Speichern from '../sections/Speichern.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { money, euro } from '../lib/money.js';

const end = money(22);

export default function Speicher() {
  const [interest, setInterest] = useState('');
  const want = v => () => setInterest(v);
  return (
    <>
      <PageHero
        kicker="Speicher grün und grau"
        title="Mittagsstrom abends verkaufen"
        lead={`Ein Speicher legt den Strom zurück, den mittags niemand bezahlt, und verkauft ihn abends zum höchsten Preis des Tages. Im Rechenbeispiel einer 30-kWp-Anlage mit 60-kWh-Speicher steigt der Börsenerlös an einem Sommertag von ${euro(end.sellerPlain)} auf ${euro(end.sellerStore)}.`}
      >
        <a className="btn btn-sun" href="#warteliste" onClick={want('speicher')}>
          Speicher planen lassen
        </a>
        <a className="btn btn-line-light" href="#pool">
          Pool für den Kapazitätsmarkt
        </a>
      </PageHero>
      <Speichern onWant={want} />
      <section className="section section-ink" id="steuerung" aria-labelledby="steuer-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="steuer-h">Der Gewinn steckt in der Steuerung</h2>
            <p className="lead">
              Ein Speicher allein verdient nichts. Entscheidend ist, wann er lädt und wann er abgibt.
            </p>
          </div>
          <ul className="plain-list">
            <li className="reveal-item">
              <strong>Sommer:</strong> laden, wenn der Börsenpreis unter wenigen Cent fällt, abgeben in der Abendspitze.
            </li>
            <li className="reveal-item">
              <strong>Winter:</strong> nachts günstig aus dem Netz laden und in den teuren Stunden nutzen. Das geht nur im
              Mischbetrieb nach MiSpeL.
            </li>
            <li className="reveal-item">
              <strong>Negative Preise:</strong> Anlage abregeln oder in den Speicher lenken statt Geld fürs Einspeisen zu
              zahlen.
            </li>
            <li className="reveal-item">
              <strong>Netzentlastung:</strong> Steuerbare Verbraucher nach § 14a EnWG können reduzierte Netzentgelte nutzen.
            </li>
          </ul>
        </div>
      </section>
      <section className="section" id="pool" aria-labelledby="pool-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="pool-h">Speicherleistung bündeln</h2>
            <p className="lead">
              Ab dem Lieferjahr 2031 vergütet Deutschland bereitgehaltene Leistung. Batterien können erstmals in der
              Ausschreibung am 18. Mai 2027 bieten.
            </p>
            <p>
              Einzelne Speicher sind dafür zu klein. Wir bauen einen Pool auf, der über einen bietenden Partner teilnimmt.
              Erlöse sagen wir erst zu, wenn die Bedingungen feststehen. Gezählt wird die anrechenbare, nicht die installierte
              Leistung.
            </p>
            <a className="btn btn-ink" href="#warteliste" onClick={want('flex')}>
              Speicher für den Pool melden
            </a>
          </div>
          <dl className="model-rows reveal-item">
            <div>
              <dt>Gesetz</dt>
              <dd>Strom-Versorgungssicherheits- und Kapazitätengesetz, beschlossen im Juli 2026</dd>
            </div>
            <div>
              <dt>Erste Runde mit Batterien</dt>
              <dd>18. Mai 2027, 2 GW Erzeugungskapazität</dd>
            </div>
            <div>
              <dt>Weitere Runden</dt>
              <dd>1. Dezember 2027 und 1. Oktober 2029</dd>
            </div>
            <div>
              <dt>Lieferjahr</dt>
              <dd>2031</dd>
            </div>
          </dl>
        </div>
      </section>
      <Warteliste
        options={['speicher', 'flex']}
        interest={interest}
        setInterest={setInterest}
        source="speicher"
        title="Speicher anfragen"
        lead="Sagen Sie uns, welche Anlage Sie haben. Wir rechnen durch, ob sich ein Speicher lohnt und welche Betriebsart passt."
      />
    </>
  );
}
