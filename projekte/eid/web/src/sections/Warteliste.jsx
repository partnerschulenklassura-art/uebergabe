import { useEffect, useState } from 'react';
import { site } from '../site.config.js';
import { INTERESTS } from '../lib/catalog.js';

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
  note,
  vorlage
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

  // Angaben aus einem Rechner übernehmen, z. B. für die Fehlersuche
  useEffect(() => {
    if (vorlage) setF(x => ({ ...x, kwp: x.kwp || vorlage.kwp || '', message: vorlage.message || x.message }));
  }, [vorlage]);

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
    <section className="section section-paper" id="warteliste" aria-labelledby={id('wl-h')}>
      <div className="wrap split">
        <div className="split-text">
          <h2 id={id('wl-h')}>{title}</h2>
          <p className="lead">{lead}</p>
          {note && <p>{note}</p>}
        </div>

        <form className="form reveal-item" onSubmit={submit}>
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
              Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert werden. Details in der{' '}
              <a href="/datenschutz.html">Datenschutzerklärung</a>.
            </span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.callback} onChange={set('callback')} />
            <span>Sie dürfen mich zu meiner Anfrage anrufen.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.marketing} onChange={set('marketing')} />
            <span>
              Schicken Sie mir passende Angebote aus den anderen Bereichen des Instituts per E-Mail. Abmelden geht mit einem
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
