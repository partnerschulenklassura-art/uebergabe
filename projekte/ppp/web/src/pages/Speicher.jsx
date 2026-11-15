import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Vermittler from '../sections/Vermittler.jsx';
import Speichern from '../sections/Speichern.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { money, euro } from '../lib/money.js';

const end = money(22);
const end22 = end;
const faktor = (end22.sellerStore / end22.sellerPlain).toLocaleString('de-DE', { maximumFractionDigits: 1 });

export default function Speicher() {
  const [interest, setInterest] = useState('');
  const want = v => () => setInterest(v);
  return (
    <>
      <PageHero
        scene="speicher"
        facts={[[`${faktor}×`, 'Tageserlös mit Speicher'], ['18. Mai 2027', 'Kapazitätsmarkt öffnet für Batterien']]}
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
      <Vermittler>Speicher planen und liefern unsere Partner, sie sind Ihr Vertragspartner. Zum Kapazitätsmarkt machen wir erst Zusagen, wenn die Bedingungen feststehen.</Vermittler>
      <Speichern onWant={want} />
      <section className="section section-ink" id="steuerung" aria-labelledby="steuer-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="steuer-h">Der Gewinn steckt in der Steuerung</h2>
            <p className="lead">
              Ein Speicher allein verdient nichts. Entscheidend ist, wann er lädt und wann er abgibt.
            </p>
          </div>
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {[
              ['Sommer', 'Laden, wenn der Börsenpreis unter wenige Cent fällt, abgeben in der Abendspitze.', '#f2b705'],
              ['Winter', 'Nachts günstig aus dem Netz laden und in den teuren Stunden nutzen. Das geht nur im Mischbetrieb nach MiSpeL.', '#8fb3d1'],
              ['Negative Preise', 'Anlage abregeln oder in den Speicher lenken, statt Geld fürs Einspeisen zu zahlen.', '#ff9a8a'],
              ['Netzentlastung', 'Steuerbare Verbraucher nach § 14a EnWG können reduzierte Netzentgelte nutzen.', '#5fb37f']
            ].map(([t, x, c]) => (
              <li key={t} className="glass rim rounded-[20px] px-5 py-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,.7)]">
                <span aria-hidden="true" className="block h-1.5 w-10 rounded-full" style={{ background: c, boxShadow: `0 0 14px ${c}` }} />
                <strong className="mt-3 block font-display text-[1.45rem] font-semibold leading-tight text-papier">{t}</strong>
                <span className="mt-1.5 block text-[1rem] leading-relaxed text-papier/70">{x}</span>
              </li>
            ))}
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
          <ol className="glass-strong rim relative m-0 list-none rounded-[24px] p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] sm:p-8">
            <span aria-hidden="true" className="absolute bottom-10 left-[2.15rem] top-10 w-[2px] bg-gradient-to-b from-sonne via-sonne/50 to-netz/40 sm:left-[2.65rem]" />
            {[
              ['Juli 2026', 'Gesetz beschlossen', 'Strom-Versorgungssicherheits- und Kapazitätengesetz'],
              ['18. Mai 2027', 'Erste Runde mit Batterien', '2 GW Erzeugungskapazität'],
              ['1. Dez. 2027 und 1. Okt. 2029', 'Weitere Runden', 'Volumen legt die Bundesnetzagentur fest'],
              ['2031', 'Lieferjahr', 'Vergütung für bereitgehaltene Leistung']
            ].map(([d, t, x], i) => (
              <li key={d} className="relative flex gap-4 py-3">
                <span aria-hidden="true" className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${i < 1 ? 'bg-sonne shadow-[0_0_12px_#f2b705]' : 'border-2 border-sonne bg-tinte'}`} />
                <span>
                  <span className="block font-display text-[1.25rem] font-bold leading-tight text-sonne">{d}</span>
                  <strong className="block font-display text-[1.3rem] font-semibold text-papier">{t}</strong>
                  <span className="block text-[0.98rem] text-papier/70">{x}</span>
                </span>
              </li>
            ))}
          </ol>
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
