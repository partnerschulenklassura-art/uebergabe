import { useMemo, useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { bewerte, DEFAULTS, GROSS_KWP } from '../lib/bewertung.js';

const eur = n => `${Math.round(n).toLocaleString('de-DE')} €`;
const num = v => (v === '' ? '' : Number(String(v).replace(',', '.')));

// Annahmen, die man auf der Seite ändern kann: [Schlüssel, Beschriftung, Einheit, Schritt]
const STELLSCHRAUBEN = [
  ['ue20Ct', 'Vergütung je eingespeister kWh (Marktwert Solar)', 'ct', 0.1],
  ['umruestEuro', 'Umbau auf Eigenverbrauch, einmalig', '€', 50],
  ['speicherEuroKwh', 'Speicher je kWh', '€', 10],
  ['neuEuroKwp', 'Neuanlage je kWp (bis 100 kWp)', '€', 10],
  ['neuEuroKwpGross', 'Neuanlage je kWp (über 100 kWp)', '€', 10],
  ['zins', 'Abzinsung je Jahr', '%', 0.5]
];

export default function Bewerten() {
  const [e, setE] = useState({ kwp: 6, baujahr: 2006, ertragJahr: '', verbrauch: 4000, strompreisCt: '', wrOriginal: true, speicherKwh: '' });
  const [a, setA] = useState({});
  const [interest, setInterest] = useState('');
  const set = k => ev => setE({ ...e, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value });

  const r = useMemo(
    () =>
      bewerte({
        kwp: num(e.kwp),
        ertragJahr: num(e.ertragJahr),
        verbrauch: num(e.verbrauch),
        strompreisCt: num(e.strompreisCt),
        wrOriginal: e.wrOriginal,
        speicherKwh: e.speicherKwh === '' ? null : num(e.speicherKwh),
        annahmen: Object.fromEntries(Object.entries(a).filter(([, v]) => v !== '' && !Number.isNaN(v)))
      }),
    [e, a]
  );
  const ende = Number(e.baujahr) + 20;
  const gross = r.eingabe.kwp > GROSS_KWP;
  const max = Math.max(...r.optionen.map(o => Math.abs(o.wert)), 1);

  return (
    <>
      <PageHero
        kicker="Bewerten"
        title="Was ist Ihre Solaranlage nach 20 Jahren wert?"
        lead="Ende 2026 endet für rund 62.000 Anlagen die feste Vergütung, bis Ende 2027 sind es rund 300.000. Weiterlaufen dürfen sie alle. Die Frage ist nur, welcher Weg sich für Ihre Anlage rechnet."
      >
        <a className="btn btn-sun" href="#rechner">
          Anlage bewerten
        </a>
        <a className="btn btn-line-light" href="#regeln">
          Was ab 2027 gilt
        </a>
      </PageHero>

      <section className="section" id="rechner" aria-labelledby="rechner-h">
        <div className="wrap calc">
          <form className="form calc-form" onSubmit={ev => ev.preventDefault()} aria-labelledby="rechner-h">
            <h2 id="rechner-h" className="calc-h">Ihre Anlage</h2>
            <div className="grid2">
              <label>
                <span className="lbl">Leistung in kWp</span>
                <input inputMode="decimal" value={e.kwp} onChange={set('kwp')} required />
              </label>
              <label>
                <span className="lbl">Baujahr</span>
                <input inputMode="numeric" value={e.baujahr} onChange={set('baujahr')} />
              </label>
              <label>
                <span className="lbl">
                  Ertrag im Jahr in kWh <span className="opt">(falls bekannt)</span>
                </span>
                <input inputMode="numeric" value={e.ertragJahr} onChange={set('ertragJahr')} placeholder={`ca. ${Math.round(r.eingabe.ertragJahr).toLocaleString('de-DE')}`} />
              </label>
              <label>
                <span className="lbl">Stromverbrauch im Jahr in kWh</span>
                <input inputMode="numeric" value={e.verbrauch} onChange={set('verbrauch')} />
              </label>
              <label>
                <span className="lbl">
                  Ihr Strompreis in ct/kWh <span className="opt">(brutto)</span>
                </span>
                <input inputMode="decimal" value={e.strompreisCt} onChange={set('strompreisCt')} placeholder={String(r.eingabe.strompreisCt).replace('.', ',')} />
              </label>
              <label>
                <span className="lbl">
                  Speicher in kWh <span className="opt">(leer = Vorschlag)</span>
                </span>
                <input inputMode="decimal" value={e.speicherKwh} onChange={set('speicherKwh')} placeholder={String(r.optionen.find(o => o.id === 'speicher')?.speicherKwh ?? 0)} />
              </label>
            </div>
            <label className="calc-check">
              <input type="checkbox" checked={e.wrOriginal} onChange={set('wrOriginal')} />
              <span>Der Wechselrichter ist noch der erste. Dann rechnen wir einen Tausch ein.</span>
            </label>
            <details className="calc-more">
              <summary>Annahmen anpassen</summary>
              <div className="grid2">
                {STELLSCHRAUBEN.map(([k, t, unit, step]) => {
                  const def = k === 'zins' ? DEFAULTS[k] * 100 : DEFAULTS[k];
                  const val = a[k] === undefined ? '' : k === 'zins' ? a[k] * 100 : a[k];
                  return (
                    <label key={k}>
                      <span className="lbl">
                        {t} <span className="opt">({unit})</span>
                      </span>
                      <input
                        type="number"
                        step={step}
                        value={val}
                        placeholder={String(def).replace('.', ',')}
                        onChange={ev => {
                          const v = ev.target.value === '' ? undefined : Number(ev.target.value);
                          setA({ ...a, [k]: v === undefined ? undefined : k === 'zins' ? v / 100 : v });
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </details>
          </form>

          <div className="calc-out" aria-live="polite">
            <p className="calc-kicker">
              {Number(e.baujahr) >= 2000 && Number(e.baujahr) <= 2030
                ? ende <= 2026
                  ? `Die feste Vergütung endet am 31. Dezember ${ende}.`
                  : `Die feste Vergütung läuft bis 31. Dezember ${ende}.`
                : 'Geben Sie das Baujahr an, dann zeigen wir das Förderende.'}
            </p>
            <p className="calc-value">
              <span>Ertragswert bei Weiterbetrieb</span>
              <strong>{eur(r.anlagenwert)}</strong>
            </p>
            <p className="calc-sub">
              Abgezinste Einnahmen der nächsten {DEFAULTS.jahre} Jahre, wenn Sie nichts ändern
              {gross ? ' und den Strom über einen Direktvermarkter verkaufen' : ''}.
            </p>
            <ol className="calc-list">
              {r.optionen.map(o => (
                <li key={o.id} className={o.id === r.besteId ? 'is-best' : undefined}>
                  <div className="calc-row">
                    <h3>{o.titel}</h3>
                    {o.id === r.besteId && <span className="calc-badge">rechnet sich am besten</span>}
                  </div>
                  <div className="calc-bar" aria-hidden="true">
                    <span className={o.wert < 0 ? 'neg' : undefined} style={{ width: `${(Math.abs(o.wert) / max) * 100}%` }} />
                  </div>
                  <dl>
                    <div>
                      <dt>Wert über {o.jahre} Jahre</dt>
                      <dd>{eur(o.wert)}</dd>
                    </div>
                    <div>
                      <dt>Im ersten Jahr</dt>
                      <dd>{eur(o.jahr1)}</dd>
                    </div>
                    <div>
                      <dt>Investition</dt>
                      <dd>{eur(o.investition)}</dd>
                    </div>
                    <div>
                      <dt>Zurück nach</dt>
                      <dd>{o.amortisation === 0 ? 'sofort' : o.amortisation ? `${o.amortisation} Jahren` : 'nicht im Zeitraum'}</dd>
                    </div>
                  </dl>
                  <p>{o.text}</p>
                </li>
              ))}
            </ol>
            <p className="note">
              Rechenbeispiel mit den genannten Annahmen, keine Ertragszusage und keine Steuer- oder Rechtsberatung. Wert =
              Einnahmen und eingesparter Strom, abgezinst, abzüglich Investition. Ertragsverlust{' '}
              {String(DEFAULTS.degradation * 100).replace('.', ',')} % je Jahr.
            </p>
            <div className="actions">
              <a className="btn btn-ink" href="#warteliste" onClick={() => setInterest('ue20')}>
                Rechnung prüfen lassen
              </a>
              <a className="btn btn-line" href="/anlagenwert/">
                Anlagenwert berechnen
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-ink" id="regeln" aria-labelledby="regeln-h">
        <div className="wrap split">
          <div className="split-text">
            <h2 id="regeln-h">Was nach 20 Jahren gilt</h2>
            <p className="lead">Abschalten müssen Sie nichts. Aber ohne Entscheidung bekommen Sie nur noch den Marktwert.</p>
            <p className="calc-stand">Stand 10. November 2026. Das EEG 2027 ist noch nicht beschlossen.</p>
          </div>
          <ul className="plain-list">
            <li className="reveal-item">
              <strong>Bis 100 kWp:</strong> Der Netzbetreiber nimmt den Strom weiter ab und zahlt den Jahresmarktwert Solar
              abzüglich Vermarktungskosten, höchstens 10 ct/kWh. 2025 waren das 3,79 ct, mit intelligentem Messsystem 4,15 ct. Die Regel gilt bis Ende 2032.
            </li>
            <li className="reveal-item">
              <strong>Über 100 kWp:</strong> Der Strom muss über einen Direktvermarkter verkauft werden (sonstige
              Direktvermarktung).
            </li>
            <li className="reveal-item">
              <strong>Eigenverbrauch:</strong> Umstellen ist erlaubt. Für den Überschuss gibt es weiter den Marktwert.
            </li>
            <li className="reveal-item">
              <strong>Neue Anlage ab 2027:</strong> Laut Regierungsentwurf zum EEG 2027 gibt es statt 20 Jahren fester
              Vergütung eine Übergangszahlung von 5,2 ct/kWh für höchstens 36 Monate.
            </li>
          </ul>
        </div>
      </section>

      <section className="section section-paper" id="pruefen" aria-labelledby="check-h">
        <div className="wrap">
          <h2 id="check-h">Vor der Entscheidung: die Anlage prüfen</h2>
          <p className="lead">Ein Wert stimmt nur, wenn die Anlage sicher und vollständig läuft.</p>
          <ol className="steps">
            <li className="reveal-item">
              <h3>Ertrag ablesen</h3>
              <p>Die Einspeiseabrechnungen der letzten Jahre zeigen, ob die Anlage noch liefert, was sie soll.</p>
            </li>
            <li className="reveal-item">
              <h3>Sicherheit prüfen</h3>
              <p>Nach 20 Jahren lohnt eine Wiederholungsprüfung nach VDE: Isolation, Steckverbinder, Befestigung.</p>
            </li>
            <li className="reveal-item">
              <h3>Weg wählen</h3>
              <p>Weiter einspeisen, Eigenverbrauch, Speicher oder neu bauen. Wir rechnen das mit Ihren echten Zahlen.</p>
            </li>
            <li className="reveal-item">
              <h3>Umsetzen</h3>
              <p>Prüfung, Umbau und Vermarktung über unsere Partnerbetriebe aus einer Hand.</p>
            </li>
          </ol>
        </div>
      </section>

      <Warteliste
        options={['ue20', 'bestand', 'speicher', 'wartung']}
        interest={interest}
        setInterest={setInterest}
        source="bewerten"
        title="Rechnung prüfen lassen"
        lead="Schicken Sie uns Leistung, Baujahr und die letzte Einspeiseabrechnung. Wir rechnen Ihre Anlage mit echten Zahlen und melden uns innerhalb weniger Tage."
      />
    </>
  );
}
