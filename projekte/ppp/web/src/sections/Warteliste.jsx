import { useEffect, useState } from 'react';
import { site } from '../site.config.js';
import { INTERESTS } from '../lib/catalog.js';
import { sceneImg, url } from '../lib/url.js';

const empty = {
  name: '',
  email: '',
  phone: '',
  plz: '',
  kwp: '',
  message: '',
  privacy: false,
  callback: false,
  marketing: false,
  website: ''
};

const utm = () => {
  const q = new URLSearchParams(location.search);
  const o = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => q.get(k) && (o[k] = q.get(k)));
  return Object.keys(o).length ? o : undefined;
};

/**
 * Formular für die gemeinsame Lead-Datenbank. Jede Seite zeigt nur die Interessen, die zu ihr passen.
 * options: Interessen-IDs dieser Seite; interest/setInterest optional von außen (Knöpfe auf der Seite wählen vor).
 */
export default function Warteliste({
  options,
  interest: outer,
  setInterest: setOuter,
  source,
  title = 'Warteliste',
  lead = 'Wir starten die Bereiche nacheinander und melden uns in der Reihenfolge der Eintragungen. Ein Eintrag kostet nichts und verpflichtet zu nichts.',
  note
}) {
  const [inner, setInner] = useState(options.length === 1 ? options[0] : '');
  const interest = outer ?? inner;
  const setInterest = setOuter ?? setInner;
  const [f, setF] = useState(empty);
  const [state, setState] = useState({ status: 'idle', msg: '' });

  // Vorauswahl aus der Adresse, z. B. /strom/?interesse=kaufen#warteliste
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('interesse');
    if (q && options.includes(q)) setInterest(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const label = INTERESTS[interest] || '';

  const mailto = () => {
    const body = [
      `Interesse: ${label}`,
      `Name: ${f.name}`,
      `E-Mail: ${f.email}`,
      `Telefon: ${f.phone || '-'}`,
      `PLZ: ${f.plz}`,
      `Anlagenleistung: ${f.kwp ? `${f.kwp} kWp` : '-'}`,
      `Rückruf erwünscht: ${f.callback ? 'ja' : 'nein'}`,
      `Passende Angebote per E-Mail: ${f.marketing ? 'ja' : 'nein'}`,
      `Seite: ${source}`,
      '',
      f.message
    ].join('\n');
    return `mailto:${site.email}?subject=${encodeURIComponent(`Warteliste: ${label}`)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async e => {
    e.preventDefault();
    if (f.website) return; // Honeypot
    if (!interest) {
      setState({ status: 'error', msg: 'Bitte wählen Sie aus, wofür Sie sich eintragen.' });
      document.getElementById(`interest-${source}-0`)?.focus();
      return;
    }
    if (!site.leadEndpoint) {
      window.location.href = mailto();
      setState({ status: 'mail', msg: 'Ihr E-Mail-Programm öffnet sich mit Ihren Angaben. Senden Sie die Nachricht ab, dann sind Sie eingetragen.' });
      return;
    }
    setState({ status: 'sending', msg: '' });
    try {
      const res = await fetch(site.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, interest, source, utm: utm() })
      });
      if (res.status === 422) {
        const j = await res.json();
        const first = Object.values(j.errors || {})[0];
        setState({ status: 'error', msg: first || 'Bitte prüfen Sie Ihre Angaben.' });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setState({ status: 'done', msg: 'Eingetragen. Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie darin Ihre Adresse.' });
      setF(empty);
    } catch {
      setState({
        status: 'error',
        msg: 'Die Eintragung hat nicht geklappt. Senden Sie Ihre Angaben stattdessen per E-Mail.',
        fallback: true
      });
    }
  };

  const id = s => `${source}-${s}`;

  return (
    <section className="wl relative overflow-hidden bg-tinte py-24 text-papier sm:py-32" id="warteliste" aria-labelledby={id('wl-h')}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-drift-c absolute left-[-8%] top-[15%] h-[520px] w-[520px] rounded-full bg-[#1d4f7a] opacity-35 blur-[130px]" />
        <div className="animate-drift-a absolute right-[0%] bottom-[-10%] h-[520px] w-[620px] rounded-full bg-[#6b4f10] opacity-30 blur-[140px]" />
      </div>
      <div className="wrap split relative">
        <div className="split-text lg:sticky lg:top-28">
          <h2 id={id('wl-h')} className="m-0 font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[0.98]">
            {title}
          </h2>
          <p className="mb-0 mt-5 max-w-[46ch] text-[1.15rem] leading-relaxed text-papier/75">{lead}</p>
          {note && <p className="mt-4 text-papier/70">{note}</p>}

          {/* Was nach dem Eintragen passiert – echte Reihenfolge */}
          <ol className="m-0 mt-10 grid list-none gap-3 p-0">
            {[
              ['Eintragen', 'Ein Formular, zwei Minuten. Nur Name, E-Mail und Postleitzahl sind Pflicht.'],
              ['Adresse bestätigen', 'Sie bekommen eine E-Mail mit einem Link. Erst danach sind Sie auf der Liste.'],
              ['Wir melden uns', 'Sobald Ihr Bereich startet, in der Reihenfolge der Eintragungen.']
            ].map(([t, x], i) => (
              <li key={t} className="glass rim flex gap-4 rounded-2xl px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sonne font-display text-[1.15rem] font-bold text-tinte">
                  {i + 1}
                </span>
                <span>
                  <strong className="block font-display text-[1.25rem] font-semibold leading-tight">{t}</strong>
                  <span className="mt-0.5 block text-[0.98rem] leading-snug text-papier/70">{x}</span>
                </span>
              </li>
            ))}
          </ol>
          <img
            src={sceneImg('speicher')}
            alt=""
            width="177"
            height="78"
            loading="lazy"
            className="mt-12 hidden h-auto w-[62%] max-w-[340px] -rotate-2 drop-shadow-[0_30px_26px_rgba(0,0,0,.6)] lg:block"
          />
        </div>

        <form className="form glass-strong rim rounded-[26px] shadow-[0_2px_4px_rgba(0,0,0,.25),0_40px_80px_-30px_rgba(0,0,0,.8)]" onSubmit={submit}>
          {options.length > 1 && (
            <fieldset className="choices">
              <legend>Wofür tragen Sie sich ein?</legend>
              {options.map((k, i) => (
                <label key={k} className={interest === k ? 'on' : ''}>
                  <input
                    id={`interest-${source}-${i}`}
                    type="radio"
                    name="interest"
                    value={k}
                    checked={interest === k}
                    onChange={() => setInterest(k)}
                  />
                  {INTERESTS[k]}
                </label>
              ))}
            </fieldset>
          )}

          <div className="grid2">
            <label>
              <span className="lbl">Name</span>
              <input required autoComplete="name" value={f.name} onChange={set('name')} />
            </label>
            <label>
              <span className="lbl">E-Mail</span>
              <input required type="email" autoComplete="email" value={f.email} onChange={set('email')} />
            </label>
            <label>
              <span className="lbl">
                Telefon <span className="opt">(freiwillig)</span>
              </span>
              <input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
            </label>
            <label>
              <span className="lbl">Postleitzahl</span>
              <input required inputMode="numeric" pattern="[0-9]{5}" autoComplete="postal-code" value={f.plz} onChange={set('plz')} />
            </label>
            <label>
              <span className="lbl">
                Anlagenleistung in kWp <span className="opt">(falls vorhanden)</span>
              </span>
              <input inputMode="decimal" value={f.kwp} onChange={set('kwp')} />
            </label>
          </div>
          <label>
            <span className="lbl">
              Nachricht <span className="opt">(freiwillig)</span>
            </span>
            <textarea rows="3" value={f.message} onChange={set('message')} />
          </label>
          <label className="hp" aria-hidden="true">
            Website
            <input tabIndex="-1" autoComplete="off" value={f.website} onChange={set('website')} />
          </label>

          <label className="check">
            <input type="checkbox" required checked={f.privacy} onChange={set('privacy')} />
            <span>
              Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert und an einen passenden Partner weitergegeben werden. Die Vermittlung ist kostenlos und unverbindlich. Details in der{' '}
              <a href={url('/datenschutz.html')}>Datenschutzerklärung</a>.
            </span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.callback} onChange={set('callback')} />
            <span>Sie dürfen mich zu meiner Anfrage anrufen.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.marketing} onChange={set('marketing')} />
            <span>
              Schicken Sie mir passende Angebote aus den anderen Bereichen von PV Performance Pro per E-Mail. Abmelden geht mit einem
              Klick in jeder E-Mail.
            </span>
          </label>

          <button className="btn btn-sun" type="submit" disabled={state.status === 'sending'}>
            {state.status === 'sending' ? 'Wird eingetragen' : 'Eintragen'}
          </button>
          {state.msg && (
            <p className={`form-msg form-${state.status}`} role="status">
              {state.msg} {state.fallback && <a href={mailto()}>E-Mail öffnen</a>}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
