import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import PageHero from '../sections/PageHero.jsx';
import Vermittler from '../sections/Vermittler.jsx';
import Werkzeuge from '../sections/Werkzeuge.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { TOOLS, toolUrl } from '../site.config.js';
import { sceneImg } from '../lib/url.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Inhalte nach solarsecure.pro, in den Aussagen auf das Belegbare beschränkt
const LAYERS = [
  {
    id: 'luft',
    name: 'Luftraum',
    title: 'Drohnen früh erkennen',
    color: '#8fb3d1',
    points: [
      ['Passive Funkerkennung.', 'Ein Software Defined Radio erkennt den Steuerfunk gängiger Drohnensysteme und prüft die Remote ID. Fehlt sie, wird der Flug als unangekündigt dokumentiert.'],
      ['Nur beobachten.', 'Kein Stören, kein Übernehmen, kein Abschuss. Aktive Abwehr ist Behörden vorbehalten, wir liefern ihnen das Lagebild.']
    ]
  },
  {
    id: 'areal',
    name: 'Gelände',
    title: 'Zaun und Kabel als Sensor',
    color: '#f2b705',
    points: [
      ['Sabotage am Zaun.', 'Wird der Zaun durchtrennt, löst das System in unter 50 Millisekunden Alarm aus, auf Wunsch mit Drohne aus der Box.'],
      ['Anschlusssäulen überwacht.', 'Die Verbindung zwischen den Anschlusssäulen wird ständig geprüft. Bricht das Signal ab, gibt es sofort Alarm.'],
      ['Beweise sichern.', 'Bei Alarm wird das Funkspektrum passiv aufgezeichnet, nur Metadaten, verschlüsselt. Öffnen können den Beweiscontainer nur Ermittlungsbehörden.']
    ]
  },
  {
    id: 'steuer',
    name: 'Steuerung',
    title: 'Guardian Gateway vor der Anlage',
    color: '#5fb37f',
    points: [
      ['Hardware-Firewall.', 'Das Gateway sitzt zwischen Internet und Wechselrichter, prüft jeden Befehl und blockiert schädliche in Echtzeit.'],
      ['Zero Trust.', 'Nicht freigegebene Updates werden gestoppt, auffällige Geräte in Quarantäne genommen.'],
      ['Lückenlose Protokolle.', 'Steuerbefehle und erzeugte Kilowattstunden werden fälschungssicher protokolliert, als Nachweis für Betreiber und Prüfer.']
    ]
  }
];

const GRUENDE = [
  ['KRITIS-Dachgesetz', 'Seit 17. März 2026 in Kraft. Betreiber kritischer Anlagen müssen sich registrieren, Risiken analysieren, einen Resilienzplan vorlegen und Vorfälle melden. Physischer Schutz wird damit nachweispflichtig.'],
  ['Fernzugriff auf Wechselrichter', 'Viele Wechselrichter werden über Herstellerserver gesteuert und aktualisiert. Das BSI weist auf Sicherheitslücken in Komponenten kritischer Infrastruktur hin.'],
  ['Bestandsanlagen', 'Ältere Anlagen wurden ohne Schutzkonzept gebaut. Gerade sie sind das schwächste Glied, wenn ein Netz unter Druck gerät.']
];

const solar = TOOLS.find(t => t.id === 'solarsecure');
const areal = TOOLS.find(t => t.id === 'arealschutz');
const img = sceneImg;

// Bühne im Kopf: Anlage unter einer Schutzkuppel, Zaun als leuchtender Ring, Radar und eine erkannte Drohne
function Guard() {
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 640 400" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <radialGradient id="dome" cx="50%" cy="100%" r="80%">
            <stop offset="0" stopColor="#8fb3d1" stopOpacity="0.28" />
            <stop offset="1" stopColor="#8fb3d1" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweep" x1="0" x2="1">
            <stop offset="0" stopColor="#8fb3d1" stopOpacity="0" />
            <stop offset="1" stopColor="#8fb3d1" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path d="M40,300 A280,250 0 0 1 600,300" fill="url(#dome)" stroke="#8fb3d1" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="3 8" />
        <g className="origin-[320px_300px] animate-[spin_6s_linear_infinite] motion-reduce:animate-none">
          <path d="M320,300 L600,300 A280,250 0 0 0 560,175 Z" fill="url(#sweep)" />
        </g>
        <ellipse cx="320" cy="318" rx="270" ry="58" fill="none" stroke="#f2b705" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" className="flow-dash" style={{ filter: 'drop-shadow(0 0 6px #f2b705)' }} />
        {/* erkannte Drohne mit Spur */}
        <path d="M600,60 Q500,90 470,120" fill="none" stroke="#ff9a8a" strokeWidth="2" strokeDasharray="4 7" />
        <g transform="translate(470 120)">
          <circle r="22" fill="none" stroke="#ff9a8a" strokeOpacity="0.6" className="animate-ping origin-center" />
          <path d="M-12,-4 h24 M-12,4 h24 M-8,-4 v8 M8,-4 v8" stroke="#f7f7f4" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="-14" cy="-4" r="4" fill="none" stroke="#f7f7f4" strokeWidth="1.6" />
          <circle cx="14" cy="-4" r="4" fill="none" stroke="#f7f7f4" strokeWidth="1.6" />
        </g>
      </svg>
      <img src={img('park')} alt="" className="absolute bottom-[30%] left-[4%] block h-auto w-[92%] max-w-none drop-shadow-[0_16px_18px_rgba(0,0,0,.5)]" />
      <img src={img('speicher')} alt="" className="absolute bottom-[14%] left-[50%] block h-auto w-[40%] max-w-none drop-shadow-[0_24px_20px_rgba(0,0,0,.6)]" style={{ transform: 'translateZ(60px)' }} />
      <div className="glass rim absolute right-[-4%] top-[2%] rounded-2xl px-4 py-2.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,.7)]" style={{ transform: 'translateZ(120px)' }}>
        <p className="m-0 text-[0.8rem] text-[#ff9a8a]">Drohne ohne Remote ID</p>
        <p className="m-0 font-display text-[1.2rem] font-semibold leading-tight text-papier">erkannt und dokumentiert</p>
      </div>
      <div className="glass rim absolute bottom-[-6%] left-[-2%] rounded-2xl px-4 py-2.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,.7)]" style={{ transform: 'translateZ(100px)' }}>
        <p className="m-0 font-display text-[1.6rem] font-bold leading-none text-sonne">&lt; 50 ms</p>
        <p className="m-0 mt-1 text-[0.85rem] text-papier/70">vom Schnitt am Zaun bis zum Alarm</p>
      </div>
    </div>
  );
}

// Drei Schutzschichten als gestapelte Glasebenen, die beim Scrollen auseinanderfahren
function Schichten() {
  const root = useRef(null);
  const [on, setOn] = useState('areal');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.sch-plane',
          { z: (i) => [-20, 0, 20][i] },
          {
            z: (i) => [-170, 0, 170][i],
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'center 45%', scrub: 0.8 }
          }
        );
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-tinte py-24 text-papier sm:py-32" aria-labelledby="sch-h">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-drift-b absolute left-[10%] top-[30%] h-[560px] w-[560px] rounded-full bg-[#1d4f7a] opacity-35 blur-[130px]" />
      </div>
      <div className="wrap relative grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative mx-auto aspect-square w-full max-w-[520px]" style={{ perspective: '1400px' }} aria-hidden="true">
          <div className="absolute inset-[12%]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(58deg) rotateZ(-38deg)' }}>
            {[...LAYERS].reverse().map(l => (
              <button
                type="button"
                tabIndex={-1}
                key={l.id}
                onPointerEnter={() => setOn(l.id)}
                className="sch-plane absolute inset-0 cursor-default rounded-[28px] border-0 p-0 transition-[box-shadow,background] duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  background: on === l.id ? `linear-gradient(135deg, ${l.color}55, ${l.color}14)` : 'linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.03))',
                  boxShadow: on === l.id ? `0 0 0 1.5px ${l.color}, 0 0 60px -10px ${l.color}` : '0 0 0 1px rgba(255,255,255,.18), 0 40px 60px -30px rgba(0,0,0,.8)',
                  backdropFilter: 'blur(6px)'
                }}
              >
                <span className="absolute bottom-4 left-5 font-display text-[1.5rem] font-bold text-papier" style={{ transform: 'translateZ(1px)' }}>
                  {l.name}
                </span>
                {l.id === 'steuer' && (
                  <span className="absolute inset-[30%] rounded-2xl bg-gruen/25 shadow-[0_0_30px_rgba(95,179,127,.5)]" />
                )}
                {l.id === 'areal' && <span className="absolute inset-[10%] rounded-[20px] border-2 border-dashed border-sonne/80" />}
                {l.id === 'luft' && <span className="absolute inset-[18%] rounded-full border border-netz/70" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 id="sch-h" className="m-0 font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[0.98]">
            Drei Schichten Schutz
          </h2>
          <p className="mb-0 mt-5 max-w-[52ch] text-[1.15rem] leading-relaxed text-papier/75">
            Von oben nach unten: was über der Anlage fliegt, was am Zaun passiert und wer auf die Steuerung zugreift.
          </p>
          <div className="mt-10 grid gap-4">
            {LAYERS.map(l => (
              <article
                key={l.id}
                onPointerEnter={() => setOn(l.id)}
                className={`glass-strong rim rounded-[22px] px-6 py-5 transition-shadow duration-500 ${on === l.id ? '' : 'opacity-90'}`}
                style={{ boxShadow: on === l.id ? `0 0 0 1px ${l.color}88, 0 30px 60px -30px rgba(0,0,0,.8), 0 0 50px -20px ${l.color}` : '0 24px 48px -24px rgba(0,0,0,.7)' }}
              >
                <p className="m-0 font-display text-[1rem] font-semibold" style={{ color: l.color }}>
                  {l.name}
                </p>
                <h3 className="m-0 mt-0.5 font-display text-[1.6rem] font-semibold leading-tight">{l.title}</h3>
                <ul className="m-0 mt-3 grid list-none gap-2 p-0">
                  {l.points.map(([t, x]) => (
                    <li key={t} className="text-[1rem] leading-relaxed text-papier/75">
                      <strong className="font-semibold text-papier">{t}</strong> {x}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Schutz() {
  return (
    <>
      <PageHero
        visual={<Guard />}
        kicker="Schützen mit SolarSecure"
        title="Ausfälle verhindern, Angriffe abwehren"
        lead="SolarSecure schützt Solar- und Energieanlagen gegen Angriffe auf die Steuerung, Sabotage am Zaun und Aufklärung aus der Luft. Für Betreiber von Bestandsanlagen, Netzbetreiber und Anlagen mit KRITIS-Pflichten."
      >
        <a className="btn btn-sun" href="#warteliste">
          Sicherheits-Audit anfragen
        </a>
        <a className="btn btn-line-light" href={toolUrl(areal, 'schutz')} rel="noopener">
          Live-Demo Arealschutz
        </a>
      </PageHero>
      <Vermittler>SolarSecure ist ein Angebot von André Häupl. Hardware und Montage kommen von Partnern; Software, Server, Updates und die Koordination von Einführung und Anbindung übernimmt SolarSecure selbst.</Vermittler>

      <Schichten />

      <section className="section" aria-labelledby="risk-h">
        <div className="wrap">
          <h2 id="risk-h">Warum jetzt</h2>
          <ul className="m-0 mt-10 grid list-none gap-5 p-0 lg:grid-cols-3">
            {GRUENDE.map(([t, x], i) => (
              <li
                key={t}
                className="glass rim rounded-[22px] px-6 py-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,.7)] lg:[transform:rotateY(var(--ry))]"
                style={{ '--ry': `${[6, 0, -6][i]}deg` }}
              >
                <h3 className="m-0 font-display text-[1.6rem] font-semibold leading-tight text-papier">{t}</h3>
                <p className="m-0 mt-3 text-[1.02rem] leading-relaxed">{x}</p>
              </li>
            ))}
          </ul>
          <p className="note mt-10">
            Ob Ihre Anlage unter das KRITIS-Dachgesetz fällt, hängt von Sektor und Größe ab. Die meisten Solaranlagen sind
            keine kritischen Anlagen, profitieren aber vom selben Schutz. Wir klären das im Gespräch.
          </p>
        </div>
      </section>

      <Werkzeuge bereich="schutz" title="SolarSecure im Einsatz" lead="Die Lösungen im Detail, mit Spezifikation für Betreiber kritischer Infrastruktur." />
      <Warteliste
        options={['schutz']}
        source="schutz"
        title="Sicherheits-Audit anfragen"
        lead="Nennen Sie uns Standort und Anlagengröße. Wir melden uns für eine erste Einschätzung: ob Sie Pflichten aus dem KRITIS-Dachgesetz haben und welcher Schutz passt, vom Pilotprojekt bis zur Absicherung ganzer Areale."
      />
      <p className="sr-only">
        Mehr unter <a href={toolUrl(solar, 'schutz')}>solarsecure.pro</a>
      </p>
    </>
  );
}
