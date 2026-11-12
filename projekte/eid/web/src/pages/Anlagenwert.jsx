import { useMemo, useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { anlagenwert, VORGABEN, GROSS_KWP } from '../lib/anlagenwert.js';
import { EEG, BAUPREIS, QUELLEN } from '../lib/historie.js';
import { heute, mitEid, leistung, ursachen, MEHR, AUSRICHTUNG, NEIGUNG, VERSCHATTUNG, VERLAUF, MELDUNG } from '../lib/mehrwert.js';

const eur = n => `${Math.round(n).toLocaleString('de-DE')} €`;
const jeKwp = (v, kwp) => `${Math.round(v / kwp).toLocaleString('de-DE')} €/kWp`;
const komma = v => String(v).replace('.', ',');
const ct = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const klasseTxt = (b, unten) => (b === Infinity ? (unten ? `über ${unten.toLocaleString('de-DE')}` : 'alle') : `bis ${b.toLocaleString('de-DE')}`);
const klassenTxt = k =>
  k == null ? 'laut Abrechnung' : k.map(([b, c], i) => `${klasseTxt(b, i ? k.at(i - 1)[0] : 0)}: ${c == null ? '–' : ct(c)}`).join(' · ');
const monatJahr = ab => `${MONATE.at(Number(ab.slice(5, 7)) - 1)} ${ab.slice(0, 4)}`;
const num = v => (v === '' ? '' : Number(String(v).replace(',', '.')));

const BAUSTEINE = [
  ['eeg', 'EEG-Vergütung bis Förderende'],
  ['markt', 'Einspeisung zum Marktwert danach'],
  ['eigen', 'Eingesparter Strom (Eigenverbrauch)'],
  ['betrieb', 'Betriebskosten, Versicherung, Pacht'],
  ['ersatz', 'Wechselrichtertausch'],
  ['rueckbau', 'Rückbau am Ende']
];

// Änderbare Annahmen: [Schlüssel, Beschriftung, Einheit, Faktor zwischen Anzeige und Rechnung]
const STELLSCHRAUBEN = [
  ['zins', 'Abzinsung (Rendite, die ein Käufer erwartet)', '%', 100],
  ['marktwertCt', 'Vergütung nach Förderende je kWh', 'ct', 1],
  ['betriebKwp', 'Betriebskosten je kWp und Jahr (bis 100 kWp)', '€', 1],
  ['betriebKwpGross', 'Betriebskosten je kWp und Jahr (über 100 kWp)', '€', 1],
  ['rueckbauKwp', 'Rückbau je kWp, abzüglich Altteile', '€', 1],
  ['degradation', 'Ertragsverlust je Jahr', '%', 100],
  ['lebensdauer', 'Lebensdauer der Anlage', 'Jahre', 1]
];

export default function Anlagenwert() {
  const [e, setE] = useState({
    kwp: 10,
    baujahr: 2012,
    monat: '',
    art: 'dach',
    voll: '',
    eegCt: '',
    erloes: '',
    baukosten: '',
    ertragJahr: '',
    evAnteil: 0,
    strompreisCt: '',
    wrJahr: '',
    zustand: 'gut',
    speicherKwh: '',
    speicherJahr: '',
    pachtJahr: '',
    netzanschlussEuro: ''
  });
  const [a, setA] = useState({});
  const [interest, setInterest] = useState('');
  const [fs, setFs] = useState({ verlauf: 'unbekannt', meldung: 'unbekannt' });
  const [vorlage, setVorlage] = useState(null);
  const [m, setM] = useState({ preisCt: MEHR.preisStart, anteil: MEHR.anteilStart * 100, gewerblich: false, ausrichtung: 'sued', neigung: 'normal', verschattung: 'keine' });
  const setMw = k => ev => setM({ ...m, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value });
  const set = k => ev => setE({ ...e, [k]: ev.target.value });

  const r = useMemo(() => {
    const ein = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, ['zustand', 'art'].includes(k) ? v : k === 'voll' ? v === '1' : num(v)]));
    const ann = Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined && !Number.isNaN(v)));
    const r1 = anlagenwert({ ...ein, annahmen: ann });
    // Ist-Ertrag aus der Vergütung laut Abrechnung, wenn kein Ertrag angegeben ist
    if (!(ein.ertragJahr > 0) && ein.erloes > 0) {
      const n1 = r1.eingabe;
      const h1 = heute({ kwp: n1.kwp, foerderEnde: n1.foerderEnde, eegCt: n1.eegCt, ertragJahr: 1, evAnteil: n1.evAnteil, stichjahr: VORGABEN.stichjahr });
      if (h1.ct > 0) {
        const ertrag = ein.erloes / (h1.ct / 100) / (1 - Math.min(n1.evAnteil, 0.95));
        const r2 = anlagenwert({ ...ein, ertragJahr: ertrag, annahmen: ann });
        r2.ausErloes = true;
        return r2;
      }
    }
    return r1;
  }, [e, a]);

  const n = r.eingabe;
  const gross = n.kwp > GROSS_KWP;
  const teile = BAUSTEINE.map(([k, t]) => [k, t, r.ertrag.teile[k]]).filter(([, , v]) => Math.abs(v) >= 0.5);
  const max = Math.max(...teile.map(([, , v]) => Math.abs(v)), 1);
  const hoeher = r.ertrag.summe >= r.substanz.summe ? 'Ertragswert' : 'Substanzwert';
  const fehltSatz = n.eegCt == null && n.foerderEnde > VORGABEN.stichjahr;
  const tab = n.eegTabelle;
  const klassen = tab.zeile ? (n.art === 'frei' ? tab.zeile.frei : n.voll && tab.zeile.voll ? tab.zeile.voll : tab.zeile.dach) : null;
  const anteilig = Boolean(klassen && klassen.length > 1 && n.kwp > klassen.at(0)[0]);
  const quelle = k => QUELLEN[k];
  const h = heute({ kwp: n.kwp, foerderEnde: n.foerderEnde, eegCt: n.eegCt, ertragJahr: n.ertragJahr, evAnteil: n.evAnteil, stichjahr: VORGABEN.stichjahr });
  const plus = mitEid(h, { preisCt: Number(m.preisCt), anteil: Number(m.anteil) / 100, gewerblich: m.gewerblich, baujahr: n.baujahr });
  // Barwert des Mehrerlöses über die Restnutzung, gleiche Abzinsung und Degradation wie der Ertragswert
  const mehrWert = plus.moeglich
    ? Array.from({ length: n.restjahre }, (_, j) => (plus.extraEuro * (1 - n.a.degradation) ** (j + 1)) / (1 + n.a.zins) ** (j + 1)).reduce((x, y) => x + y, 0)
    : 0;
  const check = leistung({ kwp: n.kwp, alter: n.alter, ertragIst: num(e.ertragJahr) || (r.ausErloes ? n.ertragJahr : 0), ct: h.ct, evAnteil: n.evAnteil, ausrichtung: m.ausrichtung, neigung: m.neigung, verschattung: m.verschattung });
  const wahrscheinlich = ursachen({
    performance: check.bekannt ? check.performance : 0.85,
    verlauf: fs.verlauf,
    meldung: fs.meldung,
    alter: n.alter,
    wrAlter: VORGABEN.stichjahr - n.wrJahr,
    kwp: n.kwp,
    jahr: n.baujahr,
    neigung: m.neigung,
    verschattung: m.verschattung
  }).slice(0, 3);
  const schwach = check.bekannt && check.stufe !== 'gut';
  const fehlersucheAnfragen = art => () => {
    setInterest(art);
    setVorlage({
      zeit: Date.now(),
      kwp: String(n.kwp).replace('.', ','),
      message: [
        art === 'performance'
          ? 'Bitte rechnen Sie die Performance meiner Anlage kostenlos nach. Abrechnungen oder Werte aus dem Wechselrichter schicke ich Ihnen.'
          : 'Bitte schicken Sie mir ein Angebot für eine Untersuchung meiner Anlage vor Ort.',
        `Anlage: ${String(n.kwp).replace('.', ',')} kWp, ${n.art === 'frei' ? 'Freifläche' : 'Dach'}, in Betrieb seit ${n.baujahr}, Wechselrichter seit ${n.wrJahr}`,
        `Ausrichtung ${AUSRICHTUNG[m.ausrichtung].titel}, Neigung ${NEIGUNG[m.neigung].titel}, Verschattung ${VERSCHATTUNG[m.verschattung].titel}`,
        check.bekannt
          ? `Leistung laut Rechner: ${Math.round(check.performance * 100)} % der Erwartung (${Math.round(check.ist).toLocaleString('de-DE')} statt ${Math.round(check.soll).toLocaleString('de-DE')} kWh)${check.fehltEuro > 0 ? `, entgehen rund ${eur(check.fehltEuro)} im Jahr` : ''}`
          : 'Leistung laut Rechner: nicht berechnet',
        `Verlauf: ${VERLAUF[fs.verlauf]}. Fehlermeldung am Wechselrichter: ${MELDUNG[fs.meldung]}.`
      ].join('\n')
    });
  };
  const ART = { eeg: 'EEG-Vergütung', ue20: 'Anschlussvergütung nach Förderende', dv: 'Direktvermarktung zum Marktwert' };
  const STUFE = {
    gut: 'Ihre Anlage liefert, was sie soll.',
    auffaellig: 'Ihre Anlage liefert weniger als erwartet. Häufige Ursachen: Verschmutzung, Verschattung, ein schwacher String.',
    schlecht: 'Ihre Anlage liefert deutlich weniger als erwartet. Das deutet auf einen Defekt hin, zum Beispiel am Wechselrichter, an einem String oder an einem Kabel.'
  };

  return (
    <>
      <PageHero
        kicker="Anlagenwert"
        title="Was ist Ihre Solaranlage wert?"
        lead="Was Ihre Anlage heute wert ist, was sie für ihren Strom bekommt und was mehr ginge. Und ob sie überhaupt liefert, was sie soll. Für Verkauf, Erbe, Kauf oder einfach zum Wissen."
      >
        <a className="btn btn-sun" href="#rechner">
          Wert berechnen
        </a>
        <a className="btn btn-line-light" href="#mehr">
          Mehr für Ihren Strom
        </a>
      </PageHero>

      <section className="section" id="rechner" aria-labelledby="aw-h">
        <div className="wrap calc">
          <form className="form calc-form" onSubmit={ev => ev.preventDefault()} aria-labelledby="aw-h">
            <h2 id="aw-h" className="calc-h">Ihre Anlage</h2>
            <div className="grid2">
              <label>
                <span className="lbl">Leistung in kWp</span>
                <input inputMode="decimal" value={e.kwp} onChange={set('kwp')} required />
              </label>
              <label>
                <span className="lbl">Inbetriebnahme (Jahr)</span>
                <input inputMode="numeric" value={e.baujahr} onChange={set('baujahr')} required />
              </label>
              <label>
                <span className="lbl">
                  Monat <span className="opt">(für den genauen Satz)</span>
                </span>
                <select className="calc-select" value={e.monat} onChange={set('monat')}>
                  <option value="">nicht bekannt</option>
                  {MONATE.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="lbl">Art der Anlage</span>
                <select className="calc-select" value={e.art} onChange={set('art')}>
                  <option value="dach">Dach oder Gebäude</option>
                  <option value="frei">Freifläche</option>
                </select>
              </label>
              {Number(e.baujahr) >= 2022 && e.art === 'dach' && (
                <label>
                  <span className="lbl">
                    Einspeisung <span className="opt">(ab August 2022 eigener Satz)</span>
                  </span>
                  <select className="calc-select" value={e.voll} onChange={set('voll')}>
                    <option value="">Teileinspeisung (mit Eigenverbrauch)</option>
                    <option value="1">Volleinspeisung</option>
                  </select>
                </label>
              )}
              <label>
                <span className="lbl">
                  Baukosten in € <span className="opt">(netto, laut Rechnung)</span>
                </span>
                <input inputMode="numeric" value={e.baukosten} onChange={set('baukosten')} placeholder={`ca. ${Math.round(r.substanz.damals).toLocaleString('de-DE')}`} />
              </label>
              <label>
                <span className="lbl">
                  Vergütung in ct/kWh <span className="opt">(laut Abrechnung)</span>
                </span>
                <input inputMode="decimal" value={e.eegCt} onChange={set('eegCt')} placeholder={tab.ct != null ? `${ct(tab.ct)} (Tabelle)` : 'laut Abrechnung'} />
              </label>
              <label>
                <span className="lbl">
                  Ertrag im Jahr in kWh <span className="opt">(Abrechnung)</span>
                </span>
                <input inputMode="numeric" value={e.ertragJahr} onChange={set('ertragJahr')} placeholder={`ca. ${Math.round(n.ertragJahr).toLocaleString('de-DE')}`} />
              </label>
              <label>
                <span className="lbl">
                  oder Vergütung im Jahr in € <span className="opt">(laut Abrechnung)</span>
                </span>
                <input inputMode="decimal" value={e.erloes} onChange={set('erloes')} placeholder="z. B. 750" disabled={num(e.ertragJahr) > 0} />
              </label>
              <label>
                <span className="lbl">Davon selbst genutzt in %</span>
                <input inputMode="numeric" value={e.evAnteil} onChange={set('evAnteil')} />
              </label>
              <label>
                <span className="lbl">
                  Strompreis in ct/kWh <span className="opt">(brutto)</span>
                </span>
                <input inputMode="decimal" value={e.strompreisCt} onChange={set('strompreisCt')} placeholder={komma(n.strompreisCt)} />
              </label>
              <label>
                <span className="lbl">
                  Wechselrichter seit <span className="opt">(Jahr)</span>
                </span>
                <input inputMode="numeric" value={e.wrJahr} onChange={set('wrJahr')} placeholder={String(n.baujahr)} />
              </label>
              <label>
                <span className="lbl">Zustand</span>
                <select className="calc-select" value={e.zustand} onChange={set('zustand')}>
                  <option value="gut">Läuft ohne Befund</option>
                  <option value="maengel">Kleine Mängel</option>
                  <option value="schaeden">Schäden, Reparatur nötig</option>
                </select>
              </label>
              <label>
                <span className="lbl">
                  Speicher in kWh <span className="opt">(falls vorhanden)</span>
                </span>
                <input inputMode="decimal" value={e.speicherKwh} onChange={set('speicherKwh')} placeholder="0" />
              </label>
              <label>
                <span className="lbl">
                  Speicher seit <span className="opt">(Jahr)</span>
                </span>
                <input inputMode="numeric" value={e.speicherJahr} onChange={set('speicherJahr')} placeholder={String(n.baujahr)} />
              </label>
              <label>
                <span className="lbl">
                  Dachpacht im Jahr in € <span className="opt">(falls fremdes Dach)</span>
                </span>
                <input inputMode="numeric" value={e.pachtJahr} onChange={set('pachtJahr')} placeholder="0" />
              </label>
              {gross && (
                <label>
                  <span className="lbl">
                    Netzanschluss, Trafo in € <span className="opt">(Neupreis, falls Eigentum)</span>
                  </span>
                  <input inputMode="numeric" value={e.netzanschlussEuro} onChange={set('netzanschlussEuro')} placeholder="0" />
                </label>
              )}
            </div>
            <p className="calc-info">
              Restnutzung <strong>{n.restjahre} Jahre</strong>: Lebensdauer {n.a.lebensdauer} Jahre minus {n.alter} Jahre seit Inbetriebnahme.
              {n.alter >= n.a.lebensdauer ? ' Die übliche Lebensdauer ist erreicht, wir rechnen mit einem Jahr.' : ''} Baupreis{' '}
              {r.substanz.baupreis.ausRechnung ? 'laut Ihrer Rechnung' : `${n.baujahr} laut Preisreihe`}: rund{' '}
              {Math.round(r.substanz.baupreis.jeKwp).toLocaleString('de-DE')} € je kWp.
            </p>
            <details className="calc-more">
              <summary>Annahmen anpassen</summary>
              <div className="grid2">
                {STELLSCHRAUBEN.map(([k, t, unit, f]) => (
                  <label key={k}>
                    <span className="lbl">
                      {t} <span className="opt">({unit})</span>
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={a[k] === undefined ? '' : Math.round(a[k] * f * 1000) / 1000}
                      placeholder={komma(Math.round(VORGABEN[k] * f * 1000) / 1000)}
                      onChange={ev => setA({ ...a, [k]: ev.target.value === '' ? undefined : Number(ev.target.value) / f })}
                    />
                  </label>
                ))}
              </div>
            </details>
          </form>

          <div className="calc-out" aria-live="polite">
            <p className={`calc-kicker${fehltSatz ? ' calc-warn' : ''}`}>
              {fehltSatz
                ? tab.grund === 'groesse'
                  ? `Für eine ${n.art === 'frei' ? 'Freiflächenanlage' : 'Dachanlage'} dieser Größe gab es zu diesem Zeitpunkt keine feste Vergütung, sondern Direktvermarktung oder Ausschreibung. Bitte den anzulegenden Wert aus Ihrer Abrechnung eintragen.`
                  : `Bitte den Vergütungssatz eintragen. Für diesen Zeitraum haben wir keinen belegten Wert. Ihre Anlage bekommt bis Ende ${n.foerderEnde} EEG-Vergütung, ohne den Satz ist der Wert zu niedrig.`
                : n.eegCt == null
                ? 'Ohne Vergütungssatz rechnen wir nur mit dem Marktwert.'
                : n.eegAusTabelle && n.foerderEnde > VORGABEN.stichjahr
                ? `Vergütung ${ct(n.eegCt)} ct aus der Tabelle (ab ${monatJahr(tab.zeile.ab)}, ${n.art === 'frei' ? 'Freifläche' : 'Dach'}${anteilig ? ', anteilig nach Größenklassen' : ''}) bis 31. Dezember ${n.foerderEnde}. Steht auf Ihrer Abrechnung ein anderer Satz, tragen Sie ihn ein.`
                : n.foerderEnde > VORGABEN.stichjahr
                  ? `EEG-Vergütung bis 31. Dezember ${n.foerderEnde}, danach Marktwert.`
                  : n.foerderEnde === VORGABEN.stichjahr
                    ? `Die EEG-Vergütung endet am 31. Dezember ${n.foerderEnde}. Ab ${n.foerderEnde + 1} rechnen wir mit dem Marktwert.`
                    : `Die EEG-Vergütung ist Ende ${n.foerderEnde} ausgelaufen.`}
            </p>
            <div className="aw-pair">
              <p className="calc-value">
                <span>Ertragswert</span>
                <strong>{eur(r.marktwert)}</strong>
                <small className="aw-kwp">{jeKwp(r.marktwert, n.kwp)}</small>
              </p>
              <p className="calc-value">
                <span>Substanzwert</span>
                <strong>{eur(r.substanz.summe)}</strong>
                <small className="aw-kwp">{jeKwp(r.substanz.summe, n.kwp)}</small>
              </p>
              <p className="calc-value">
                <span>Restbuchwert</span>
                <strong>{eur(r.substanz.buchwert)}</strong>
                <small className="aw-kwp">{jeKwp(r.substanz.buchwert, n.kwp)}</small>
              </p>
            </div>
            <p className="calc-sub">
              Ein Käufer zahlt in der Regel den Ertragswert. Für Erbe und Schenkung zählt meist der höhere Wert, hier der{' '}
              {hoeher}. Der Restbuchwert ist der Baupreis abzüglich linearer Abschreibung über {n.a.afaJahre} Jahre.
              {r.ertrag.summe < 0 && !fehltSatz ? ' Die Kosten übersteigen die Erträge: Die Anlage trägt sich so nicht.' : ''}
            </p>

            <h3 className="aw-h3">Woraus sich der Ertragswert zusammensetzt</h3>
            <ul className="aw-bridge">
              {teile.map(([k, t, v]) => (
                <li key={k}>
                  <span className="aw-label">{t}</span>
                  <span className="aw-track" aria-hidden="true">
                    <span className={v < 0 ? 'neg' : 'pos'} style={{ width: `${(Math.abs(v) / max) * 100}%` }} />
                  </span>
                  <span className="aw-val">{`${v < 0 ? '−' : '+'} ${eur(Math.abs(v))}`}</span>
                </li>
              ))}
              <li className="aw-sum">
                <span className="aw-label">Ertragswert über {n.restjahre} Jahre</span>
                <span className="aw-track" aria-hidden="true" />
                <span className="aw-val">{eur(r.ertrag.summe)}</span>
              </li>
            </ul>

            <h3 className="aw-h3">Woraus sich der Substanzwert zusammensetzt</h3>
            <table className="aw-table">
              <thead>
                <tr>
                  <th scope="col">Komponente</th>
                  <th scope="col">Baupreis {n.baujahr}</th>
                  <th scope="col">Neupreis heute</th>
                  <th scope="col">Alter/Nutzung</th>
                  <th scope="col">Zeitwert</th>
                </tr>
              </thead>
              <tbody>
                {r.substanz.teile.map(t => (
                  <tr key={t.id}>
                    <th scope="row">{t.titel}</th>
                    <td>{t.damals == null ? '–' : eur(t.damals)}</td>
                    <td>{eur(t.neu)}</td>
                    <td>{`${t.alter}/${t.jahre} J.`}</td>
                    <td>{eur(t.zeitwert)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Summe</th>
                  <td>{eur(r.substanz.damals)}</td>
                  <td>{eur(r.substanz.neu)}</td>
                  <td />
                  <td>{eur(r.substanz.summe)}</td>
                </tr>
                <tr className="aw-kwp-row">
                  <th scope="row">je kWp</th>
                  <td>{jeKwp(r.substanz.damals, n.kwp)}</td>
                  <td>{jeKwp(r.substanz.neu, n.kwp)}</td>
                  <td />
                  <td>{jeKwp(r.substanz.summe, n.kwp)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="calc-info">
              Je Komponente zählt der niedrigere Wert aus Baupreis damals und Neupreis heute, gemindert nach Alter und Zustand.
            </p>
            <p className="note">
              Rechenbeispiel mit offenen Annahmen, kein Gutachten und keine Steuer- oder Rechtsberatung. Stichtag 2026,
              Abzinsung {komma(Math.round(n.a.zins * 1000) / 10)} % je Jahr.
            </p>
            <div className="actions">
              <a className="btn btn-ink" href="#warteliste" onClick={() => setInterest('anlagenwert')}>
                Wert prüfen lassen
              </a>
              <a className="btn btn-line" href="/bewerten/">
                Was nach 20 Jahren lohnt
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-ink" id="mehr" aria-labelledby="mehr-h">
        <div className="wrap">
          <h2 id="mehr-h">Was Ihre Anlage heute bekommt und was mehr ginge</h2>
          <p className="lead">
            Zwei Fragen entscheiden über den Wert: Wie viel bekommen Sie für Ihren Strom, und liefert die Anlage überhaupt, was
            sie soll?
          </p>
          <div className="mw-grid">
            <article className="mw-card">
              <p className="side-who">Heute</p>
              <h3>{ART[h.art]}</h3>
              <p className="mw-big">{h.ct == null ? 'Satz fehlt' : `${ct(h.ct)} ct/kWh`}</p>
              <dl className="mw-rows">
                <div>
                  <dt>Eingespeist im Jahr</dt>
                  <dd>{Math.round(h.einspeisung).toLocaleString('de-DE')} kWh</dd>
                </div>
                <div>
                  <dt>Vergütung im Jahr</dt>
                  <dd>{h.euroJahr == null ? 'Vergütungssatz oben eintragen' : eur(h.euroJahr)}</dd>
                </div>
                {h.euroJahr != null && (
                  <div>
                    <dt>je kWp und Jahr</dt>
                    <dd>{jeKwp(h.euroJahr, n.kwp)}</dd>
                  </div>
                )}
              </dl>
              {h.art === 'ue20' && <p className="mw-note">Anschlussvergütung 2025 ohne intelligentes Messsystem, mit iMSys 4,15 ct.</p>}
            </article>

            <article className="mw-card mw-accent">
              <p className="side-who">{plus.modell === 'liefer' ? 'Mit Liefervertrag über uns' : 'Mit Stromverkauf über uns'}</p>
              {plus.moeglich ? (
                <>
                  <h3>{`${eur(plus.extraEuro)} mehr im Jahr`}</h3>
                  <p className="mw-big">{h.euroJahr == null ? `+ ${ct(plus.extraCt)} ct je verkaufter kWh` : `${eur(plus.neuEuroJahr)} statt ${eur(h.euroJahr)}`}</p>
                  <p className="mw-wert">
                    Anlagenwert mit Stromverkauf: <strong>{eur(Math.max(0, r.ertrag.summe + mehrWert))}</strong> statt{' '}
                    {eur(r.marktwert)}
                  </p>
                  <label className="mw-range">
                    <span>
                      Verkaufspreis <strong>{`${ct(Number(m.preisCt))} ct/kWh`}</strong>
                    </span>
                    <input type="range" min={MEHR.preisMin} max={MEHR.preisMax} step="0.5" value={m.preisCt} onChange={setMw('preisCt')} />
                  </label>
                  <label className="mw-range">
                    <span>
                      Davon verkauft <strong>{`${m.anteil} %`}</strong> <span className="opt">(der Rest wie bisher)</span>
                    </span>
                    <input type="range" min="10" max="90" step="5" value={m.anteil} onChange={setMw('anteil')} />
                  </label>
                  <label className="mw-check">
                    <input type="checkbox" checked={m.gewerblich} onChange={setMw('gewerblich')} />
                    <span>Die Anlage wird gewerblich betrieben (Firma, Landwirtschaft)</span>
                  </label>
                  {plus.unterMindest && (
                    <p className="mw-note">
                      Unter etwa {MEHR.mindestKwh.toLocaleString('de-DE')} kWh Einspeisung fressen Zähler- und Abrechnungskosten den
                      Mehrerlös meist auf. Wir sagen Ihnen das im Gespräch offen.
                    </p>
                  )}
                  <p className="mw-note">
                    {plus.modell === 'liefer'
                      ? 'Für gewerblich betriebene Anlagen läuft das über einen Liefer- oder PPA-Vertrag, nicht über die Stromgemeinschaft.'
                      : 'Über eine Stromgemeinschaft nach § 42c EnWG an Abnehmer im selben Netzgebiet, nur für nicht gewerblich betriebene Anlagen.'}{' '}
                    Rechenbeispiel vor Gebühren, keine Ertragszusage.
                  </p>
                </>
              ) : (
                <>
                  <h3>Für Neuanlagen ab 2027 anders</h3>
                  <p>Laut Regierungsentwurf gibt es ab 2027 keine feste Vergütung mehr. Wir rechnen Ihre Vermarktung im Gespräch durch.</p>
                </>
              )}
            </article>

            <article className={`mw-card mw-check-card${check.bekannt ? ` is-${check.stufe}` : ''}`}>
              <p className="side-who">Performance</p>
              <h3>{check.bekannt ? `${Math.round(check.performance * 100)} % der erwarteten Leistung` : 'Liefert Ihre Anlage, was sie soll?'}</h3>
              <label className="mw-select">
                <span>Ausrichtung der Module</span>
                <select className="calc-select" value={m.ausrichtung} onChange={setMw('ausrichtung')}>
                  {Object.entries(AUSRICHTUNG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.titel}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mw-select">
                <span>Neigung</span>
                <select className="calc-select" value={m.neigung} onChange={setMw('neigung')}>
                  {Object.entries(NEIGUNG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.titel}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mw-select">
                <span>Verschattung</span>
                <select className="calc-select" value={m.verschattung} onChange={setMw('verschattung')}>
                  {Object.entries(VERSCHATTUNG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.titel}
                    </option>
                  ))}
                </select>
              </label>
              <dl className="mw-rows">
                <div>
                  <dt>Erwartet</dt>
                  <dd>{`${Math.round(check.soll).toLocaleString('de-DE')} kWh (${Math.round(check.soll / n.kwp)} je kWp)`}</dd>
                </div>
                <div>
                  <dt>Ihre Anlage</dt>
                  <dd>{check.bekannt ? `${Math.round(check.ist).toLocaleString('de-DE')} kWh (${Math.round(check.istKwhKwp)} je kWp)` : 'Ertrag oder Vergütung eintragen'}</dd>
                </div>
                {check.sollEuro != null && (
                  <div>
                    <dt>Erwartete Vergütung</dt>
                    <dd>{`${eur(check.sollEuro)} im Jahr`}</dd>
                  </div>
                )}
                {check.bekannt && check.fehltEuro > 0 && (
                  <div>
                    <dt>Entgeht Ihnen im Jahr</dt>
                    <dd>{`rund ${eur(check.fehltEuro)}`}</dd>
                  </div>
                )}
              </dl>
              {check.bekannt ? <p>{STUFE[check.stufe]}</p> : <p>Tragen Sie oben den Ertrag oder die Vergütung aus Ihrer Abrechnung ein. Wir vergleichen sie mit dem, was eine Anlage dieses Alters, dieser Ausrichtung und Neigung liefern sollte.</p>}
              {check.bekannt && check.stufe !== 'gut' && (
                <div className="actions">
                  <a className="btn btn-sun" href="#fehlersuche">
                    Woran liegt es?
                  </a>
                </div>
              )}
              <p className="mw-note">
                {r.ausErloes ? 'Ist-Ertrag aus der Vergütung laut Abrechnung zurückgerechnet (Satz und Eigenverbrauch von oben). ' : ''}Erwartung:{' '}
                {MEHR.refKwhKwp} kWh je kWp im Jahr, nach Ausrichtung, Neigung, Verschattung und Alter gemindert. Je nach Region liegt der Wert
                etwa 10 % höher oder niedriger.
              </p>
            </article>
          </div>
        </div>
      </section>


      <section className={`section fs-section${schwach ? ` is-${check.stufe}` : ''}`} id="fehlersuche" aria-labelledby="fs-h">
        <div className="wrap">
          <p className="calc-kicker">Fehlersuche</p>
          <h2 id="fs-h">
            {schwach
              ? `Ihre Anlage liefert ${Math.round(check.performance * 100)} % – woran liegt es?`
              : 'Warum liefert eine Anlage zu wenig?'}
          </h2>
          <p className="lead">
            {schwach
              ? `Rund ${Math.round(check.fehltKwh).toLocaleString('de-DE')} kWh fehlen im Jahr${check.fehltEuro > 0 ? `, das sind etwa ${eur(check.fehltEuro)} Vergütung` : ''}. Zwei Fragen grenzen die Ursache ein. Den Fehler selbst findet nur eine Messung an der Anlage.`
              : 'Tragen Sie oben den Ertrag oder die Vergütung ein, dann sehen Sie hier, ob Ihre Anlage betroffen ist. Diese Ursachen finden wir am häufigsten.'}
          </p>

          <div className="fs-fragen">
            <label className="mw-select">
              <span>Wie hat sich der Ertrag entwickelt?</span>
              <select className="calc-select" value={fs.verlauf} onChange={ev => setFs({ ...fs, verlauf: ev.target.value })}>
                {Object.entries(VERLAUF).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="mw-select">
              <span>Zeigt der Wechselrichter einen Fehler?</span>
              <select className="calc-select" value={fs.meldung} onChange={ev => setFs({ ...fs, meldung: ev.target.value })}>
                {Object.entries(MELDUNG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ol className="fs-ursachen">
            {wahrscheinlich.map((u, i) => (
              <li key={u.id}>
                <span className="fs-rang">{i === 0 ? 'Am wahrscheinlichsten' : `Möglich`}</span>
                <h3>{u.titel}</h3>
                <p>{u.text}</p>
                <p className="fs-pruefung">
                  <strong>So prüfen wir: </strong>
                  {u.pruefung}
                </p>
              </li>
            ))}
          </ol>

          <div className="fs-wege">
            <article className="fs-weg">
              <p className="fs-rang">Schritt 1 · kostenlos</p>
              <h3>Performance rechnen</h3>
              <p>
                Sie schicken uns die Abrechnungen der letzten Jahre oder Werte aus dem Wechselrichter. Wir rechnen die Leistung mit den
                Daten Ihres Standorts nach und vergleichen Jahre, Monate und, wenn vorhanden, einzelne Strings.
              </p>
              <ul>
                <li>Ergebnis: ob und wie viel Leistung fehlt</li>
                <li>welche Ursachen in Frage kommen</li>
                <li>ob sich eine Untersuchung vor Ort lohnt</li>
              </ul>
              <div className="actions">
                <a className="btn btn-sun" href="#warteliste" onClick={fehlersucheAnfragen('performance')}>
                  Kostenlos rechnen lassen
                </a>
              </div>
            </article>
            <article className="fs-weg">
              <p className="fs-rang">Schritt 2 · kostenpflichtig, mit Angebot vorab</p>
              <h3>Untersuchung vor Ort</h3>
              <p>
                Eine Elektrofachkraft prüft die Anlage mit der App PV-Monteur nach DIN VDE 0100-712 und IEC 62446-1: Strings,
                Isolation, Wechselrichter, Schutzeinrichtungen. Jeder Befund steht im Prüfbericht als PDF.
              </p>
              <ul>
                <li>
                  Anlage am Einfamilienhaus: rund 300 bis 450 € für Messung und Prüfbericht, dazu 0,50 € je gefahrenem Kilometer
                  (Hin- und Rückfahrt)
                </li>
                <li>Genauer Preis vorher im Angebot, Termin erst nach Ihrer Zustimmung</li>
                <li>Angebot für die Reparatur mit dem Ertrag, den sie zurückbringt</li>
              </ul>
              <div className="actions">
                <a className="btn btn-ink" href="#warteliste" onClick={fehlersucheAnfragen('fehlersuche')}>
                  Untersuchung anfragen
                </a>
              </div>
              <p className="note">Die App gibt Anleitung, keine Freigabe – die verantwortliche Elektrofachkraft entscheidet.</p>
            </article>
          </div>
          <p className="note">Ihre Angaben aus dem Rechner werden in die Anfrage übernommen. Sie können sie vor dem Absenden ändern.</p>
        </div>
      </section>

      <section className="section" id="historie" aria-labelledby="hist-h">
        <div className="wrap">
          <h2 id="hist-h">Vergütung und Baupreise seit Beginn des EEG</h2>
          <p className="lead">
            Der Satz gilt 20 Jahre plus das Jahr der Inbetriebnahme. Ihre Zeile ist markiert. Maßgeblich ist immer Ihre
            Einspeiseabrechnung.
          </p>
          <div className="hist-grid">
            <div className="hist-scroll">
              <table className="aw-table hist-table">
                <caption>Einspeisevergütung in ct/kWh nach Größenklasse (kWp)</caption>
                <thead>
                  <tr>
                    <th scope="col">Inbetriebnahme ab</th>
                    <th scope="col">Dach</th>
                    <th scope="col">Freifläche</th>
                    <th scope="col">Quelle</th>
                  </tr>
                </thead>
                <tbody>
                  {EEG.map(z => (
                    <tr key={z.ab} className={tab.zeile && tab.zeile.ab === z.ab ? 'is-mine' : undefined}>
                      <th scope="row">
                        {monatJahr(z.ab)}
                        {z.text ? <span className="hist-note"> · {z.text}</span> : null}
                      </th>
                      <td className="hist-klassen">
                        {klassenTxt(z.dach)}
                        {z.voll ? <span className="hist-note">{`Volleinspeisung: ${klassenTxt(z.voll)}`}</span> : null}
                      </td>
                      <td className="hist-klassen">{klassenTxt(z.frei)}</td>
                      <td>
                        <a href={quelle(z.quelle).url} rel="noopener noreferrer">
                          Quelle
                        </a>
                        {z.quelleFrei ? (
                          <>
                            {' · '}
                            <a href={quelle(z.quelleFrei).url} rel="noopener noreferrer">
                              Freifläche
                            </a>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="hist-scroll hist-preis">
              <table className="aw-table hist-table">
                <caption>Anlagenpreis je kWp, kleine Dachanlagen</caption>
                <thead>
                  <tr>
                    <th scope="col">Jahr</th>
                    <th scope="col">€/kWp</th>
                    <th scope="col">Quelle</th>
                  </tr>
                </thead>
                <tbody>
                  {BAUPREIS.map(([j, p, q]) => (
                    <tr key={j} className={j === n.baujahr ? 'is-mine' : undefined}>
                      <th scope="row">{j}</th>
                      <td>{p.toLocaleString('de-DE')}</td>
                      <td>
                        <a href={quelle(q).url} rel="noopener noreferrer">
                          Quelle
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="note">
            Größere Anlagen bekommen den Satz anteilig: die ersten Kilowatt zum Satz der kleinsten Klasse, der Rest zum Satz der
            nächsten. Ab 2016 gibt es über 100 kWp keine feste Vergütung mehr, sondern Direktvermarktung, für große
            Freiflächen Ausschreibungen. „Laut Abrechnung“ heißt: Der Satz sank monatlich, wir haben dafür keinen belegten
            Wert. Preise vor 2006 sind nicht belegt; wir setzen den Wert von 2006 an. Große Anlagen
            rechnen wir mit dem heutigen Preisverhältnis groß zu klein günstiger.
          </p>
        </div>
      </section>

      <section className="section section-paper" id="methode" aria-labelledby="methode-h">
        <div className="wrap">
          <h2 id="methode-h">So rechnen wir</h2>
          <p className="lead">Zwei Verfahren, beide offen gelegt. Jede Zahl lässt sich oben ändern.</p>
          <ol className="steps">
            <li className="reveal-item">
              <h3>Ertrag je Jahr</h3>
              <p>Ertrag aus der Abrechnung, jedes Jahr 0,5 % weniger. Bis zum Förderende mit Ihrem Vergütungssatz, danach mit dem Marktwert.</p>
            </li>
            <li className="reveal-item">
              <h3>Kosten abziehen</h3>
              <p>Betriebskosten, Pacht, ein neuer Wechselrichter nach 15 Jahren und der Rückbau am Ende.</p>
            </li>
            <li className="reveal-item">
              <h3>Abzinsen</h3>
              <p>Geld in zehn Jahren ist heute weniger wert. Wir zinsen mit der Rendite ab, die ein Käufer erwarten würde.</p>
            </li>
            <li className="reveal-item">
              <h3>Teile bewerten</h3>
              <p>Baupreis aus dem Inbetriebnahmejahr und Neupreis heute je Komponente. Der niedrigere zählt, gemindert nach Alter und Zustand.</p>
            </li>
          </ol>
          <p className="note">
            Modulpreise nach pvXchange-Index (Juli 2026), Anlagenpreise je Jahr nach gruenes.haus, Anschlussvergütung 2025 nach
            Übertragungsnetzbetreibern, Betriebskosten kleiner Anlagen nach Fraunhofer ISE. Die Aufteilung auf die Komponenten
            ist eine Annahme und änderbar.
          </p>
        </div>
      </section>

      <Warteliste
        options={['performance', 'fehlersuche', 'anlagenwert', 'teilen', 'bestand', 'wartung']}
        interest={interest}
        vorlage={vorlage}
        setInterest={setInterest}
        source="anlagenwert"
        title="Wert prüfen lassen"
        lead="Für einen belastbaren Wert prüfen wir die Anlage vor Ort und rechnen mit Ihren Abrechnungen. Schicken Sie uns die Eckdaten, wir melden uns innerhalb weniger Tage."
      />
    </>
  );
}
