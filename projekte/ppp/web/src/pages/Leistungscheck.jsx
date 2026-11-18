import { useState } from 'react';
import PageHero from '../sections/PageHero.jsx';
import { leistungscheck } from '../lib/leistungscheck.js';
import { protokoll, mitPruefsumme, alsHtml } from '../lib/protokoll.js';
import { ermittle, AUSRICHTUNG } from '../lib/leistungscheck-dienst.js';
import { site } from '../site.config.js';
import { url } from '../lib/url.js';
import Komponentenerfassung, { komponentenLeer } from '../sections/Komponentenerfassung.jsx';

const SCHRITTE = [
  ['ort', 'Standort'],
  ['sonne', 'Sonne an diesem Ort'],
  ['wetter', 'Wetter der letzten zwölf Monate'],
  ['umgebung', 'Umgebung'],
  ['rechnen', 'Rechnung und Protokoll']
];

const LEER = {
  adresse: '',
  art: 'dach',
  kwp: '',
  jahr: '',
  ausrichtung: 'sued',
  neigung: '30',
  ertrag: '',
  quelle: 'zaehler',
  wrErtrag: '',
  verlauf: '',
  meldung: '',
  reinigung: '',
  eegCt: '',
  komponenten: null
};

const kwh = v => `${Math.round(v).toLocaleString('de-DE')} kWh`;
const euro = v => `${Math.round(v).toLocaleString('de-DE')} €`;
const pz = v => `${Math.round(v * 100)} %`;

const STUFE = {
  gut: { titel: 'Ihre Anlage arbeitet, wie sie soll.', farbe: '#5fb37f' },
  auffaellig: { titel: 'Ihre Anlage liefert spürbar zu wenig.', farbe: '#f2b705' },
  schlecht: { titel: 'Ihre Anlage liefert deutlich zu wenig.', farbe: '#ff8a7a' }
};

export default function Leistungscheck() {
  const [f, setF] = useState(LEER);
  const [mehr, setMehr] = useState(false);
  const [profi, setProfi] = useState(false);
  const setK = fn => setF(x => ({ ...x, komponenten: fn(x.komponenten || komponentenLeer()) }));
  const [status, setStatus] = useState({});
  const [laeuft, setLaeuft] = useState(false);
  const [erg, setErg] = useState(null);
  const [fehler, setFehler] = useState('');
  const set = k => ev => setF(x => ({ ...x, [k]: ev.target.value }));
  const setArt = art => setF(x => ({ ...x, art, neigung: art === 'frei' ? '20' : x.neigung === '20' ? '30' : x.neigung }));

  async function start(ev) {
    ev.preventDefault();
    setFehler('');
    setErg(null);
    setLaeuft(true);
    setStatus({});
    const melde = (id, s, text) => setStatus(x => ({ ...x, [id]: { s, text } }));
    try {
      const { eingabe, luecken } = await ermittle(f, melde);
      melde('rechnen', 'laeuft', 'rechnen');
      const r = leistungscheck(eingabe);
      const nummer = `LC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const pr = await mitPruefsumme(protokoll(r, { nummer }));
      melde('rechnen', 'fertig', 'Protokoll erstellt');
      setErg({ r, pr, luecken });
      setTimeout(() => document.getElementById('ergebnis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      setFehler(`Die Rechnung ist fehlgeschlagen: ${err.message}. Bitte Angaben prüfen oder später erneut versuchen.`);
    } finally {
      setLaeuft(false);
    }
  }

  function protokollOeffnen() {
    const blob = new Blob([alsHtml(erg.pr)], { type: 'text/html' });
    const u = URL.createObjectURL(blob);
    const w = window.open(u, '_blank', 'noopener');
    if (!w) location.href = u;
  }

  function pruefungAnfragen() {
    const { r, pr } = erg;
    const z = r.zerlegung;
    const text = [
      'Guten Tag,',
      '',
      'ich möchte eine Prüfung meiner Solaranlage vor Ort anfragen.',
      '',
      `Leistungscheck ${pr.nummer}, Prüfsumme ${pr.pruefsumme.slice(0, 16)}…`,
      `Anlage: ${f.adresse}, ${r.eingabe.kwp} kWp, ${r.eingabe.art === 'frei' ? 'Freifläche' : 'Dach'}, Baujahr ${r.eingabe.jahr}`,
      z.bekannt ? `Ergebnis: ${pz(z.performance)} des Solls, ${STUFE[z.stufe].titel}` : '',
      ...r.vorOrt.gruende.map(g => `- ${g}`),
      '',
      'Bitte melden Sie sich mit einem Angebot und Terminvorschlag.',
      ''
    ].join('\n');
    location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Prüfung vor Ort, Leistungscheck ${pr.nummer}`)}&body=${encodeURIComponent(text)}`;
  }

  const jahrMax = new Date().getFullYear();

  return (
    <>
      <PageHero
        scene="pruefen"
        facts={[['5 Angaben', 'den Rest ermitteln wir'], ['kostenlos', 'mit Protokoll zum Ausdrucken']]}
        kicker="Leistungscheck"
        title="Arbeitet Ihre Solaranlage, wie sie soll?"
        lead="Sie geben Adresse, Leistung, Baujahr, Ausrichtung und den Ertrag der letzten zwölf Monate ein. Wir holen die Sonne an Ihrem Ort, das echte Wetter des Jahres und die Umgebung dazu und sagen Ihnen, wie viel Ihre Anlage liefern müsste, warum etwas fehlt und was sie wert ist."
      >
        <a className="btn btn-sun" href="#check">
          Jetzt prüfen
        </a>
      </PageHero>

      <section className="wl relative overflow-hidden bg-tinte py-20 text-papier sm:py-28" id="check" aria-labelledby="lc-h">
        <div className="wrap split relative">
          <div className="split-text lg:sticky lg:top-28">
            <h2 id="lc-h" className="m-0 font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[0.98]">
              Fünf Angaben, der Rest passiert im Hintergrund
            </h2>
            <p className="mb-0 mt-5 max-w-[46ch] text-[1.1rem] leading-relaxed text-papier/75">
              Den Ertrag finden Sie auf der Abrechnung des Netzbetreibers, am Einspeisezähler oder im Portal Ihres Wechselrichters.
            </p>
            <ol className="m-0 mt-8 grid list-none gap-2.5 p-0" aria-live="polite">
              {SCHRITTE.map(([id, titel], i) => {
                const st = status[id];
                const farbe = !st ? 'rgba(247,247,244,.25)' : st.s === 'fertig' ? '#5fb37f' : st.s === 'fehlt' ? '#f2b705' : '#8fb3d1';
                return (
                  <li key={id} className="glass rim flex items-center gap-4 rounded-2xl px-5 py-3.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[1.05rem] font-bold text-tinte ${st?.s === 'laeuft' ? 'animate-pulse' : ''}`}
                      style={{ background: farbe }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <strong className="block font-display text-[1.15rem] font-semibold leading-tight">{titel}</strong>
                      <span className="block text-[0.95rem] leading-snug text-papier/65">{st?.text || 'wartet'}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <form className="form glass-strong rim rounded-[26px] shadow-[0_2px_4px_rgba(0,0,0,.25),0_40px_80px_-30px_rgba(0,0,0,.8)]" onSubmit={start}>
            <label>
              <span className="lbl">Adresse der Anlage, mit Postleitzahl</span>
              <input
                required
                autoComplete="street-address"
                placeholder="Straße, PLZ Ort"
                pattern=".*\b[0-9]{5}\b.*"
                title="Bitte mit fünfstelliger Postleitzahl, zum Beispiel: Hauptstraße 1, 08412 Werdau"
                value={f.adresse}
                onChange={set('adresse')}
              />
            </label>
            <fieldset className="choices">
              <legend>Art der Anlage</legend>
              {[
                ['dach', 'Dachanlage'],
                ['frei', 'Freifläche']
              ].map(([k, t]) => (
                <label key={k} className={f.art === k ? 'on' : ''}>
                  <input type="radio" name="art" value={k} checked={f.art === k} onChange={() => setArt(k)} />
                  {t}
                </label>
              ))}
            </fieldset>
            <div className="grid2">
              <label>
                <span className="lbl">Leistung in kWp</span>
                <input required inputMode="decimal" pattern="[0-9]+([,.][0-9]+)?" value={f.kwp} onChange={set('kwp')} />
              </label>
              <label>
                <span className="lbl">Baujahr</span>
                <input required inputMode="numeric" pattern="(19|20)[0-9]{2}" min="1995" max={jahrMax} value={f.jahr} onChange={set('jahr')} />
              </label>
              <label>
                <span className="lbl">Ausrichtung</span>
                <select value={f.ausrichtung} onChange={set('ausrichtung')}>
                  {Object.entries(AUSRICHTUNG).map(([k, a]) => (
                    <option key={k} value={k}>
                      {a.titel}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="lbl">Neigung</span>
                <select value={f.neigung} onChange={set('neigung')}>
                  {[
                    ['5', 'flach (bis 10°)'],
                    ['15', 'leicht (um 15°)'],
                    ['20', 'um 20°'],
                    ['30', 'um 30°'],
                    ['40', 'um 40°'],
                    ['60', 'steil (über 50°)']
                  ].map(([k, t]) => (
                    <option key={k} value={k}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid2">
              <label>
                <span className="lbl">Ertrag der letzten 12 Monate in kWh</span>
                <input required inputMode="numeric" value={f.ertrag} onChange={set('ertrag')} />
              </label>
              <label>
                <span className="lbl">Abgelesen am</span>
                <select value={f.quelle} onChange={set('quelle')}>
                  <option value="zaehler">Einspeisezähler oder Abrechnung</option>
                  <option value="wechselrichter">Wechselrichter oder Portal</option>
                </select>
              </label>
            </div>

            <button type="button" className="btn btn-line-light justify-self-start" aria-expanded={mehr} onClick={() => setMehr(m => !m)}>
              {mehr ? 'Weniger Angaben' : 'Mehr angeben, genauer rechnen'}
            </button>
            {mehr && (
              <div className="grid gap-4">
                <div className="grid2">
                  <label>
                    <span className="lbl">
                      Ertrag laut Wechselrichter, gleicher Zeitraum <span className="opt">(für die AC-Seite)</span>
                    </span>
                    <input inputMode="numeric" value={f.wrErtrag} onChange={set('wrErtrag')} />
                  </label>
                  <label>
                    <span className="lbl">
                      Einspeisevergütung in ct/kWh <span className="opt">(sonst nach Baujahr)</span>
                    </span>
                    <input inputMode="decimal" value={f.eegCt} onChange={set('eegCt')} />
                  </label>
                  <label>
                    <span className="lbl">Wie hat der Ertrag nachgelassen?</span>
                    <select value={f.verlauf} onChange={set('verlauf')}>
                      <option value="">weiß ich nicht</option>
                      <option value="ploetzlich">plötzlich</option>
                      <option value="schleichend">langsam über Jahre</option>
                      <option value="immer">war schon immer niedrig</option>
                      <option value="saison">nur zu bestimmten Jahreszeiten</option>
                    </select>
                  </label>
                  <label>
                    <span className="lbl">Meldungen am Wechselrichter</span>
                    <select value={f.meldung} onChange={set('meldung')}>
                      <option value="">keine</option>
                      <option value="isolation">Isolationsfehler</option>
                      <option value="netz">Abschaltung wegen Netzspannung</option>
                      <option value="andere">andere Fehlermeldungen</option>
                    </select>
                  </label>
                  <label>
                    <span className="lbl">Zuletzt gereinigt</span>
                    <select value={f.reinigung} onChange={set('reinigung')}>
                      <option value="">nie oder weiß ich nicht</option>
                      <option value="kuerzlich">in den letzten Monaten</option>
                      <option value="jahr">vor etwa einem Jahr</option>
                    </select>
                  </label>
                </div>
                <button type="button" className="btn btn-line-light justify-self-start" aria-expanded={profi} onClick={() => { setProfi(p => !p); if (!f.komponenten) setF(x => ({ ...x, komponenten: komponentenLeer() })); }}>
                  {profi ? 'Komponenten ausblenden' : 'Module, Wechselrichter und Kabel einzeln angeben'}
                </button>
                {profi && f.komponenten && <Komponentenerfassung k={f.komponenten} setK={setK} />}
              </div>
            )}

            <button className="btn btn-sun justify-self-start" disabled={laeuft}>
              {laeuft ? 'Wird ermittelt …' : 'Anlage prüfen'}
            </button>
            {fehler && (
              <p className="form-error m-0" role="alert">
                {fehler}
              </p>
            )}
            <p className="m-0 text-[0.9rem] text-papier/55">
              Wir speichern Ihre Angaben nicht. Die Adresse wird nur in Koordinaten umgerechnet. Wetter und Umgebung werden für eine grobe Rasterzelle abgefragt, nicht für Ihr Grundstück.
            </p>
          </form>
        </div>
      </section>

      {erg && <Ergebnis erg={erg} adresse={f.adresse} onProtokoll={protokollOeffnen} onMail={pruefungAnfragen} />}
    </>
  );
}

function Ergebnis({ erg, adresse, onProtokoll, onMail }) {
  const { r, pr, luecken } = erg;
  const [anfrage, setAnfrage] = useState(false);
  const z = r.zerlegung;
  const st = STUFE[z.stufe] || { titel: 'Soll berechnet', farbe: '#8fb3d1' };
  const balken = z.bekannt
    ? [
        ['Alterung', z.alterung, '#8fb3d1'],
        ['Planung und Aufbau', z.planung, '#c9a0ff'],
        ['AC-Seite', z.ac, '#ff8a7a'],
        ['Nicht erklärt', z.rest, '#f2b705']
      ].filter(([, v]) => v > 1)
    : [];
  return (
    <section className="section section-ink" id="ergebnis" aria-labelledby="erg-h">
      <div className="wrap grid gap-8">
        <div className="glass rim rounded-[26px] p-6 sm:p-9" style={{ borderLeft: `6px solid ${st.farbe}` }}>
          <h2 id="erg-h" className="m-0 font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-tight text-papier">
            {st.titel}
          </h2>
          {z.bekannt && (
            <p className="mb-0 mt-3 text-[1.15rem] text-papier/80">
              Sie liefert {pz(z.performance)} dessen, was sie so wie gebaut heute liefern müsste: {kwh(z.ist)} statt {kwh(z.sollHeute)} im Jahr.
              {pr.ergebnis.planung && <> {pr.ergebnis.planung}</>}
            </p>
          )}
          {luecken.length > 0 && <p className="mb-0 mt-3 text-[0.95rem] text-papier/60">Hinweis: {luecken.join(' ')}</p>}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rim rounded-[22px] p-6">
            <h3 className="m-0 font-display text-[1.5rem] text-papier">Wo der Ertrag bleibt</h3>
            {balken.length ? (
              <ul className="m-0 mt-4 grid list-none gap-3 p-0">
                {balken.map(([t, v, c]) => (
                  <li key={t}>
                    <span className="flex justify-between text-papier/85">
                      <span>{t}</span>
                      <strong>{kwh(v)}</strong>
                    </span>
                    <span className="mt-1 block h-2 rounded-full bg-white/10">
                      <span className="block h-2 rounded-full" style={{ width: `${Math.min(100, (v / z.ideal) * 400)}%`, background: c }} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-papier/70">Nichts Nennenswertes.</p>
            )}
            {r.verschmutzung.quellen.length > 0 && (
              <p className="mb-0 mt-4 text-[0.95rem] text-papier/70">
                In der Nähe: {r.verschmutzung.quellen.map(q => `${q.titel} (${Math.round(q.abstand)} m)`).join(', ')}.
              </p>
            )}
          </div>

          <div className="glass rim rounded-[22px] p-6">
            <h3 className="m-0 font-display text-[1.5rem] text-papier">Wahrscheinliche Ursachen</h3>
            <ol className="mb-0 mt-4 grid gap-2 pl-5 text-papier/85">
              {pr.ursachen.map(u => (
                <li key={u.titel}>
                  <strong>{u.titel}:</strong> {u.text}
                </li>
              ))}
            </ol>
          </div>

          {pr.planung.befunde.length > 0 && (
            <div className="glass rim rounded-[22px] p-6 lg:col-span-2">
              <h3 className="m-0 font-display text-[1.5rem] text-papier">Planung, Aufbau und Kabel</h3>
              <ul className="mb-0 mt-4 grid gap-2 pl-5 text-papier/85">
                {pr.planung.befunde.map(b => (
                  <li key={b.id + b.text}>
                    {b.schwere === 'gefahr' && <strong className="text-[#ff8a7a]">Gefahr: </strong>}
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="glass rim rounded-[22px] p-6">
            <h3 className="m-0 font-display text-[1.5rem] text-papier">Das geht ohne Termin vor Ort</h3>
            <ul className="mb-0 mt-4 grid gap-2 pl-5 text-papier/85">
              {pr.massnahmen.map(m => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div className="glass rim rounded-[22px] p-6">
            <h3 className="m-0 font-display text-[1.5rem] text-papier">Wert Ihrer Anlage</h3>
            {r.wert ? (
              <dl className="m-0 mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-papier/85">
                <dt>Wert aus den Erträgen</dt>
                <dd className="m-0 text-right font-semibold">{euro(r.wert.marktwert)}</dd>
                <dt>Restwert der Komponenten</dt>
                <dd className="m-0 text-right font-semibold">{euro(r.wert.restwert)}</dd>
                <dt>Wert bei voller Leistung</dt>
                <dd className="m-0 text-right font-semibold">{euro(r.wert.marktwertBehoben)}</dd>
                <dt>Wertverlust durch Minderleistung</dt>
                <dd className="m-0 text-right font-semibold">{euro(r.wert.wertverlust)}</dd>
                <dt>Einspeisevergütung{r.wert.verguetungQuelle === 'geschaetzt' ? ' (geschätzt)' : ''}</dt>
                <dd className="m-0 text-right font-semibold">{r.wert.eegCt != null ? `${r.wert.eegCt.toLocaleString('de-DE')} ct/kWh` : '–'}</dd>
              </dl>
            ) : (
              <p className="mt-3 text-papier/70">Ohne Ertrag nicht berechnet.</p>
            )}
          </div>
        </div>

        <div className="glass-strong rim rounded-[26px] p-6 sm:p-9">
          <h3 className="m-0 font-display text-[1.8rem] text-papier">
            {r.vorOrt.noetig ? (r.vorOrt.dringend ? 'Prüfung vor Ort: dringend empfohlen' : 'Prüfung vor Ort: empfohlen') : 'Prüfung vor Ort: nach dieser Rechnung nicht nötig'}
          </h3>
          {r.vorOrt.noetig && (
            <ul className="mb-0 mt-3 grid gap-1.5 pl-5 text-papier/85">
              {r.vorOrt.gruende.map(g => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-sun" onClick={onProtokoll}>
              Protokoll öffnen und drucken
            </button>
            <button type="button" className={r.vorOrt.noetig ? 'btn btn-line-light' : 'btn btn-line-light opacity-80'} aria-expanded={anfrage} onClick={() => setAnfrage(a => !a)}>
              Prüfung vor Ort anfragen
            </button>
          </div>
          {anfrage && <Pruefanfrage erg={erg} adresse={adresse} onMail={onMail} />}
          <p className="mb-0 mt-4 text-[0.85rem] text-papier/55">
            Protokoll {pr.nummer}, Prüfsumme {pr.pruefsumme.slice(0, 16)}…. Eine Rechnung, keine Messung. Gemessen wird vor Ort mit PV-Monteur.
          </p>
        </div>
      </div>
    </section>
  );
}

const kurz = (t, n) => (t && t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

/** Prüfauftrag direkt an PV-Monteur (über ppp-api). Ist der Dienst nicht bereit, bleibt die E-Mail. */
function Pruefanfrage({ erg, adresse, onMail }) {
  const { r, pr } = erg;
  const [a, setA] = useState({ name: '', telefon: '', email: '', adresse, wunschtermin: '', einwilligung: false, website: '' });
  const [zustand, setZustand] = useState({ s: 'offen' });
  const set = k => ev => setA(x => ({ ...x, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value }));

  async function senden(ev) {
    ev.preventDefault();
    setZustand({ s: 'sendet' });
    const z = r.zerlegung;
    const rumpf = {
      fremdnummer: pr.nummer,
      website: a.website,
      eigentuemer: { name: a.name.trim(), telefon: a.telefon.trim(), email: a.email.trim() },
      anlage: {
        adresse: a.adresse.trim(),
        lat: r.eingabe.standort?.breite ?? null,
        lon: r.eingabe.standort?.laenge ?? null,
        art: r.eingabe.art,
        kwp: r.eingabe.kwp,
        inbetriebnahme_jahr: r.eingabe.jahr,
        teilflaechen: r.eingabe.felder.slice(0, 20).map(f => ({ azimut: f.azimut, neigung: f.neigung, kwp: Math.round(f.kwp * 100) / 100 }))
      },
      einschaetzung: {
        stufe: z.stufe ?? null,
        performance: z.performance != null ? Math.min(5, Math.max(0, z.performance)) : null,
        soll_kwh: Math.round(z.sollHeute),
        ist_kwh: z.ist != null ? Math.round(z.ist) : null,
        zerlegung: { alterung: Math.round(z.alterung || 0), planung: Math.round(z.planung || 0), ac: Math.round(z.ac || 0), rest: Math.round(z.rest || 0) },
        ursachen: pr.ursachen.slice(0, 10).map(u => kurz(u.titel, 80)),
        pruefpunkte: r.vorOrt.pruefpunkte.slice(0, 20).map(p => ({ ursache: kurz(p.ursache, 80), pruefung: kurz(p.pruefung, 500) })),
        protokoll_pruefsumme: pr.pruefsumme
      },
      wunschtermin: kurz(a.wunschtermin.trim(), 300),
      einwilligung: { datenschutz: a.einwilligung, zeitpunkt: new Date().toISOString(), fassung: 'ppp-datenschutz-2026-11-18' }
    };
    // Ohne Koordinaten oder Einstufung nimmt PV-Monteur den Auftrag nicht an: dann gleich per E-Mail.
    if (rumpf.anlage.lat == null || rumpf.anlage.lon == null || !rumpf.einschaetzung.stufe) return setZustand({ s: 'mail' });
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch('/api/leistungscheck/pruefauftrag', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(rumpf), signal: ctrl.signal });
      clearTimeout(t);
      const d = await res.json().catch(() => ({}));
      if (res.ok) return setZustand({ s: 'fertig', d });
      if (res.status === 503 || res.status === 404 || res.status === 409) return setZustand({ s: 'mail' });
      setZustand({ s: 'fehler', text: d.fehler || `Fehler ${res.status}`, feld: d.feld });
    } catch {
      setZustand({ s: 'mail' });
    }
  }

  if (zustand.s === 'fertig') {
    const d = zustand.d;
    return (
      <div className="mt-6 rounded-2xl border border-[#5fb37f]/50 bg-[#5fb37f]/10 p-5 text-papier" role="status">
        <p className="m-0 font-display text-[1.4rem] font-semibold">Ihr Prüfauftrag ist angelegt: {d.auftragsnummer}</p>
        <p className="mb-0 mt-2 text-papier/80">Wir melden uns mit Angebot und Terminvorschlag. Damit die Prüfung reibungslos läuft, halten Sie bitte bereit:</p>
        <ul className="mb-0 mt-2 grid gap-1 pl-5 text-papier/85">
          {(d.eigentuemer_liefert || []).map(x => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        {d.statuslink && (
          <p className="mb-0 mt-3">
            Den Stand sehen Sie jederzeit hier:{' '}
            <a className="text-sonne underline" href={d.statuslink}>
              Status Ihres Prüfauftrags
            </a>
            . Speichern Sie sich den Link, er ist Ihr Zugang.
          </p>
        )}
      </div>
    );
  }

  if (zustand.s === 'mail') {
    return (
      <div className="mt-6 rounded-2xl border border-white/15 p-5 text-papier/85">
        <p className="m-0">Die direkte Anfrage ist gerade nicht möglich. Schicken Sie uns die Anfrage per E-Mail, das Ergebnis ist schon eingetragen.</p>
        <button type="button" className="btn btn-sun mt-4" onClick={onMail}>
          Anfrage per E-Mail
        </button>
      </div>
    );
  }

  return (
    <div className="wl mt-6">
    <form className="form grid gap-4" style={{ padding: 0 }} onSubmit={senden}>
      <p className="m-0 text-papier/80">
        Wir prüfen selbst, nach Angebot, Anfahrt 0,50 € je Kilometer. Ihr Ergebnis aus dem Leistungscheck geht mit, damit wir gezielt messen.
      </p>
      <div className="grid2">
        <label>
          <span className="lbl">Name</span>
          <input required autoComplete="name" value={a.name} onChange={set('name')} />
        </label>
        <label>
          <span className="lbl">Telefon</span>
          <input required type="tel" autoComplete="tel" minLength={6} maxLength={30} value={a.telefon} onChange={set('telefon')} />
        </label>
        <label>
          <span className="lbl">E-Mail</span>
          <input required type="email" autoComplete="email" value={a.email} onChange={set('email')} />
        </label>
        <label>
          <span className="lbl">
            Wunschtermin <span className="opt">(optional)</span>
          </span>
          <input placeholder="z. B. ab 1. Dezember, vormittags" value={a.wunschtermin} onChange={set('wunschtermin')} />
        </label>
      </div>
      <label>
        <span className="lbl">Adresse der Anlage mit Straße</span>
        <input required autoComplete="street-address" value={a.adresse} onChange={set('adresse')} />
      </label>
      <label className="hidden" aria-hidden="true">
        Website <input tabIndex={-1} autoComplete="off" value={a.website} onChange={set('website')} />
      </label>
      <label className="check">
        <input type="checkbox" required checked={a.einwilligung} onChange={set('einwilligung')} />
        <span>
          Ich bin einverstanden, dass PV Performance Pro meine Angaben und das Ergebnis des Leistungschecks speichert, um mir ein Angebot zu machen und die Prüfung zu planen.{' '}
          <a href={url('/datenschutz.html')}>Datenschutz</a>
        </span>
      </label>
      <button className="btn btn-sun justify-self-start" disabled={zustand.s === 'sendet'}>
        {zustand.s === 'sendet' ? 'Wird angelegt …' : 'Prüfauftrag anlegen'}
      </button>
      {zustand.s === 'fehler' && (
        <p className="form-error m-0" role="alert">
          {zustand.text}
        </p>
      )}
    </form>
    </div>
  );
}
