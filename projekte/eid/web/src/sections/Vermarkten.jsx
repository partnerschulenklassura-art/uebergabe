import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

const MODELS = [
  {
    id: 'bestand',
    tab: 'Bestandsanlage',
    title: 'Ihre Anlage läuft schon und ist in der Marktprämie',
    who: 'Betreiber ab etwa 100 kWp, Gewerbe und Landwirtschaft',
    what:
      'Ihre Förderzusage bleibt. Was sich verbessern lässt, ist die Vermarktung: der passende Direktvermarkter, saubere Abregelung bei negativen Preisen und, wo Platz ist, ein Speicher für den Abend.',
    law: 'EEG, Marktprämienmodell. Bestandsanlagen behalten ihre Zusage, auch nach der EEG-Novelle.',
    we: 'Wir vergleichen Ihren Vermarktungsvertrag, bündeln Anlagen für bessere Konditionen und prüfen den Speicher-Nachrüstfall.',
    cta: 'Vermarktung prüfen lassen',
    interest: 'bestand'
  },
  {
    id: 'neu',
    tab: 'Neuanlage ab 2027',
    title: 'Neue Anlagen brauchen ab 2027 einen Vermarkter',
    who: 'Bauherren, Betriebe und Installateure, die 2027 Anlagen in Betrieb nehmen',
    what:
      'Laut Regierungsentwurf der EEG-Novelle 2027 entfällt die feste Einspeisevergütung für neue Anlagen, zunächst unter 25 kW. Die Direktvermarktung wird der Regelfall.',
    law: 'Kabinettsentwurf vom 29. Juli 2026. Das Gesetzgebungsverfahren läuft noch.',
    we: 'Wir vermitteln Neuanlagen gebündelt an Direktvermarkter und planen Eigenverbrauch und Speicher so, dass möglichst wenig Strom zum Mittagspreis ins Netz geht.',
    cta: 'Auf die Liste für 2027',
    interest: 'neu2027'
  },
  {
    id: 'teilen',
    tab: 'Strom teilen',
    title: 'Solarstrom mit Nachbarn im selben Netzgebiet teilen',
    who: 'Private Erzeuger, Haushalte, kleine Betriebe, Vereine und Kommunen',
    what:
      'Seit dem 1. Juni 2026 dürfen Letztverbraucher Strom aus erneuerbaren Anlagen über das öffentliche Netz gemeinsam nutzen, zunächst innerhalb des Bilanzierungsgebiets ihres Verteilnetzbetreibers, ab Juni 2028 auch im angrenzenden Gebiet.',
    law: '§ 42c EnWG. Die Anlage darf nicht gewerblich betrieben werden. Netzentgelte fallen an, ein intelligentes Messsystem ist nötig.',
    we: 'Wir bauen eine Stromgemeinschaft auf, die Erzeuger und Abnehmer zusammenbringt und die Abrechnung übernimmt. Für Gewerbeanlagen prüfen wir ein Liefer- oder PPA-Modell.',
    cta: 'Interesse an der Stromgemeinschaft',
    interest: 'teilen'
  },
  {
    id: 'flex',
    tab: 'Flexibilität',
    title: 'Speicherleistung bündeln für den Kapazitätsmarkt',
    who: 'Betreiber von Speichern ab mittlerer Größe und Investoren',
    what:
      'Mit dem Strom-Versorgungssicherheits- und Kapazitätengesetz bekommt Deutschland einen Kapazitätsmarkt für das Lieferjahr 2031. Batterien können erstmals in der Ausschreibung am 18. Mai 2027 bieten. Gezählt wird die anrechenbare, nicht die installierte Leistung.',
    law: 'StromVKG, beschlossen im Juli 2026. Ein Gesetz für den dauerhaften Markt ab 2032 ist für 2027 geplant.',
    we: 'Einzelne Anlagen sind zu klein zum Bieten. Wir bereiten einen Pool vor, der über einen bietenden Partner teilnimmt. Zusagen zu Erlösen machen wir erst, wenn die Bedingungen feststehen.',
    cta: 'Speicher für den Pool melden',
    interest: 'flex'
  }
];

export default function Vermarkten({ onWant }) {
  const [active, setActive] = useState(MODELS[0].id);
  const panel = useRef(null);
  const tabs = useRef([]);
  const m = MODELS.find(x => x.id === active);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from(panel.current.children, { opacity: 0, y: 10, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
    },
    { dependencies: [active], scope: panel }
  );

  const onKey = (e, i) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    const next = (i + dir + MODELS.length) % MODELS.length;
    setActive(MODELS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <section className="section section-paper" id="vermarkten" aria-labelledby="vermarkten-h">
      <div className="wrap">
        <h2 id="vermarkten-h">Vermarkten</h2>
        <p className="lead narrow">
          Stromvermarktung ist kein einzelnes Produkt. Welcher Weg passt, hängt davon ab, wann Ihre Anlage in Betrieb ging,
          wer sie betreibt und wohin der Strom soll.
        </p>

        <div className="tabs" role="tablist" aria-label="Vermarktungswege">
          {MODELS.map((x, i) => (
            <button
              key={x.id}
              ref={el => (tabs.current[i] = el)}
              role="tab"
              id={`tab-${x.id}`}
              aria-selected={active === x.id}
              aria-controls="vermarkten-panel"
              tabIndex={active === x.id ? 0 : -1}
              onClick={() => setActive(x.id)}
              onKeyDown={e => onKey(e, i)}
            >
              {x.tab}
            </button>
          ))}
        </div>

        <div className="model reveal-item" id="vermarkten-panel" role="tabpanel" aria-labelledby={`tab-${m.id}`} ref={panel}>
          <h3>{m.title}</h3>
          <dl className="model-rows">
            <div>
              <dt>Für wen</dt>
              <dd>{m.who}</dd>
            </div>
            <div>
              <dt>Worum es geht</dt>
              <dd>{m.what}</dd>
            </div>
            <div>
              <dt>Rechtsgrundlage</dt>
              <dd>{m.law}</dd>
            </div>
            <div>
              <dt>Was wir tun</dt>
              <dd>{m.we}</dd>
            </div>
          </dl>
          <a className="btn btn-ink" href="#warteliste" onClick={onWant(m.interest)}>
            {m.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
