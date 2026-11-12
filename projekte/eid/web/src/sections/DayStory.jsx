import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { gen, price, smoothPath, fmt } from '../lib/day.js';
import { money, dynPreis, euro, ASSUME } from '../lib/money.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FROM = [5, 8.5, 11.5, 15.5, 18];
const NAMES = ['Morgens', 'Vormittags', 'Mittags', 'Nachmittags', 'Abends'];
const TEXT = {
  kaeufer: [
    'Alle stehen auf, Strom ist knapp. Wer jetzt wäscht und kocht, zahlt den vollen Preis.',
    'Die Solaranlagen kommen in Fahrt. Der Börsenpreis fällt Stunde für Stunde.',
    'Zu viel Strom im Netz, der Preis fällt unter null. Jetzt laden E-Auto, Wärmepumpe und Spülmaschine zum günstigsten Preis des Tages.',
    'Der Preis zieht wieder an. Was sich verschieben ließ, ist schon erledigt.',
    'Höchster Preis des Tages. Wer E-Auto und Spülmaschine schon mittags laufen ließ, spart jetzt mit jeder Stunde. Bis 22 Uhr ist es rund ein Viertel.'
  ],
  erzeuger: [
    'Ihre Anlage wacht auf. Der Preis ist hoch, aber die Menge noch klein.',
    'Volle Fahrt. Jede Stunde bringt mehr Strom und jede Kilowattstunde weniger Geld.',
    'Der Börsenpreis fällt unter null. Ohne Speicher verschenken Sie Strom oder regeln ab. Mit Speicher legen Sie ihn zurück.',
    'Der Speicher ist voll, die Sonne sinkt. Der Abend ist Ihr Markt.',
    'Höchster Preis des Tages. Der Speicher verkauft den Mittagsstrom, der Tageserlös verdoppelt sich.'
  ]
};
const phaseAt = h => FROM.reduce((i, f, idx) => (h >= f ? idx : i), 0);

// Zeitleiste unten: Erzeugung und Börsenpreis 4–22 Uhr
const W = 1000;
const X0 = 10;
const X1 = 990;
const x = h => X0 + ((h - 4) / 18) * (X1 - X0);
const BASE = 96;
const yGen = g => BASE - g * 80;
const yPrice = p => BASE - ((p + 4) / 26) * 86;

export default function DayStory() {
  const root = useRef(null);
  const canvas = useRef(null);
  const sceneRef = useRef(null);
  const hourRef = useRef(5);
  const [view, setView] = useState('erzeuger');

  const paths = useMemo(() => {
    const g = [];
    for (let h = 5.5; h <= 20.5; h += 0.25) g.push([x(h), yGen(gen(h))]);
    const gl = smoothPath(g);
    const p = [];
    for (let h = 4; h <= 22; h += 1) p.push([x(h), yPrice(price(h))]);
    return { genArea: `${gl} L${x(20.5)},${BASE} L${x(5.5)},${BASE} Z`, priceLine: smoothPath(p) };
  }, []);

  // 3D-Szene erst laden, wenn jemand die Seite benutzt (Scrollen, Maus, Touch, Taste) und der Abschnitt in die Nähe kommt.
  useEffect(() => {
    let disposed = false;
    let io;
    const load = async () => {
      if (sceneRef.current || disposed) return;
      const { createEnergyScene } = await import('../three/energyScene.js');
      if (disposed || sceneRef.current) return;
      sceneRef.current = createEnergyScene(canvas.current, { small: window.innerWidth < 760 });
      const h = hourRef.current;
      sceneRef.current.setHour(h, money(h).soc);
      root.current.classList.add('scene-ready');
    };
    const events = ['scroll', 'pointermove', 'touchstart', 'keydown'];
    const arm = () => {
      events.forEach(e => window.removeEventListener(e, arm));
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          load();
        },
        { rootMargin: '0px 0px 400px 0px' }
      );
      io.observe(root.current);
    };
    events.forEach(e => window.addEventListener(e, arm, { passive: true }));
    // Bei reduzierter Bewegung oder direktem Sprung per Anker trotzdem laden
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash) arm();
    return () => {
      disposed = true;
      events.forEach(e => window.removeEventListener(e, arm));
      io?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const one = s => q(s)[0];
      const els = {
        clock: one('.st-clock'),
        price: one('.st-price'),
        priceBox: one('.st-price-box'),
        dyn: one('.st-dyn'),
        fix: one('.st-fix'),
        flex: one('.st-flex'),
        save: one('.st-save'),
        sell: one('.st-sell'),
        plain: one('.st-plain'),
        store: one('.st-store'),
        gain: one('.st-gain'),
        soc: one('.st-soc'),
        fill: one('.st-batt-fill'),
        batt: one('.st-batt'),
        clip: one('.st-clip'),
        cursor: one('.st-cursor'),
        phases: q('.st-phase'),
        dots: q('.st-dot')
      };
      let current = -1;
      let sparked = false;

      const render = h => {
        hourRef.current = h;
        const hh = Math.floor(h);
        const mm = Math.floor(((h - hh) * 60) / 15) * 15;
        els.clock.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        const p = price(h);
        els.price.textContent = `${fmt(p)} ct`;
        els.priceBox.classList.toggle('neg', p < 0);
        const m = money(h);
        // Käufer
        els.dyn.textContent = `${fmt(dynPreis(h))} ct`;
        els.fix.textContent = euro(m.buyerFix);
        els.flex.textContent = euro(m.buyerFlex);
        const d = m.buyerFix - m.buyerFlex;
        els.save.textContent = d > 0.005 ? `${euro(d)} gespart` : 'noch kein Unterschied';
        // Erzeuger
        els.sell.textContent = `${fmt(Math.max(p, 0))} ct`;
        els.plain.textContent = euro(m.sellerPlain);
        els.store.textContent = euro(m.sellerStore);
        const g = m.sellerStore - m.sellerPlain;
        els.gain.textContent = g > 0.005 ? `${euro(g)} mehr` : g < -0.005 ? 'Speicher lädt noch' : 'noch kein Unterschied';
        els.soc.textContent = `${Math.round(m.soc * 100)} %`;
        els.fill.style.transform = `scaleY(${Math.max(0.04, m.soc)})`;
        els.batt.classList.toggle('charging', h >= 11 && h < 15);
        els.batt.classList.toggle('selling', h >= 18 && h < 21);
        // Zeitleiste
        els.clip.setAttribute('width', Math.max(0, x(h) - X0));
        els.cursor.setAttribute('transform', `translate(${x(h).toFixed(1)} 0)`);
        const ph = phaseAt(h);
        if (ph !== current) {
          current = ph;
          els.phases.forEach(n => n.classList.toggle('on', Number(n.dataset.i) === ph));
          els.dots.forEach((n, i) => n.classList.toggle('on', i <= ph));
        }
        sceneRef.current?.setHour(h, m.soc);
      };

      const sparks = () => {
        const host = els.batt;
        for (let i = 0; i < 16; i++) {
          const s = document.createElement('i');
          s.className = 'st-spark';
          host.appendChild(s);
          const a = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 60;
          gsap.fromTo(
            s,
            { x: 0, y: 0, opacity: 1, scale: 1 },
            {
              x: Math.cos(a) * dist,
              y: Math.sin(a) * dist - 20,
              opacity: 0,
              scale: 0.3,
              duration: 0.7 + Math.random() * 0.4,
              ease: 'power2.out',
              onComplete: () => s.remove()
            }
          );
        }
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        render(13);
        root.current.classList.add('static');
        return;
      }

      const state = { h: 5 };
      render(5);
      gsap.to(state, {
        h: 21.5,
        ease: 'none',
        onUpdate: () => {
          render(state.h);
          if (!sparked && state.h >= 12.9) {
            sparked = true;
            sparks();
          }
          if (state.h < 12) sparked = false;
        },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3.5}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    },
    { scope: root }
  );

  return (
    <section className="story" data-view={view} ref={root} aria-labelledby="story-h">
      <canvas className="st-canvas" ref={canvas} aria-hidden="true" />

      <div className="st-top wrap">
        <h2 id="story-h">Ein Tag im Leben Ihres Stroms</h2>
        <div className="st-switch" role="group" aria-label="Blickwinkel wählen">
          <button type="button" aria-pressed={view === 'erzeuger'} onClick={() => setView('erzeuger')}>
            Ich habe eine PV-Anlage
          </button>
          <button type="button" aria-pressed={view === 'kaeufer'} onClick={() => setView('kaeufer')}>
            Ich kaufe Strom
          </button>
        </div>
      </div>

      <aside className="st-panel" aria-live="off">
        <ol className="st-dots" aria-hidden="true">
          {NAMES.map(n => (
            <li key={n} className="st-dot">
              {n}
            </li>
          ))}
        </ol>
        <p className="st-clock" aria-hidden="true">
          05:00
        </p>
        <dl className="st-values">
          <div className="st-price-box">
            <dt>Börsenpreis je kWh</dt>
            <dd className="st-price">12,0 ct</dd>
          </div>
          <div className="only-kaeufer">
            <dt>Ihr Preis im dynamischen Tarif</dt>
            <dd className="st-dyn">35,5 ct</dd>
          </div>
          <div className="only-erzeuger">
            <dt>Ihre Kilowattstunde bringt jetzt</dt>
            <dd className="st-sell">12,0 ct</dd>
          </div>
          <div className="only-erzeuger">
            <dt>Speicher</dt>
            <dd className="st-batt-row">
              <span className="st-batt" aria-hidden="true">
                <span className="st-batt-fill" />
              </span>
              <span className="st-soc">0 %</span>
            </dd>
          </div>
        </dl>

        <div className="st-money only-kaeufer">
          <p className="st-money-h">Heute bezahlt</p>
          <div className="st-bars">
            <span>Festpreis 37,3 ct</span>
            <strong className="st-fix">0,00 €</strong>
            <span>Flexibel, dynamischer Tarif</span>
            <strong className="st-flex hi">0,00 €</strong>
          </div>
          <p className="st-delta st-save">noch kein Unterschied</p>
        </div>
        <div className="st-money only-erzeuger">
          <p className="st-money-h">Heute verdient</p>
          <div className="st-bars">
            <span>Ohne Speicher</span>
            <strong className="st-plain">0,00 €</strong>
            <span>Mit Speicher</span>
            <strong className="st-store hi">0,00 €</strong>
          </div>
          <p className="st-delta st-gain">noch kein Unterschied</p>
        </div>

        <div className="st-phases">
          {['erzeuger', 'kaeufer'].map(v =>
            TEXT[v].map((t, i) => (
              <p key={v + i} className={`st-phase only-${v}`} data-i={i}>
                <strong>{NAMES[i]}.</strong> {t}
              </p>
            ))
          )}
        </div>
      </aside>

      <div className="st-strip">
        <svg viewBox={`0 0 ${W} 120`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <clipPath id="st-clip">
              <rect className="st-clip" x={X0} y="0" width="0" height="120" />
            </clipPath>
          </defs>
          <line x1={X0} x2={X1} y1={yPrice(0)} y2={yPrice(0)} className="st-zero" />
          <path d={paths.priceLine} className="st-price-ghost" />
          <g clipPath="url(#st-clip)">
            <path d={paths.genArea} className="st-gen-area" />
            <path d={paths.priceLine} className="st-price-line" />
          </g>
          <line className="st-cursor" x1="0" x2="0" y1="6" y2={BASE} />
        </svg>
        <div className="st-strip-axis" aria-hidden="true">
          <span>4 Uhr</span>
          <span>Solarerzeugung und Börsenpreis</span>
          <span>22 Uhr</span>
        </div>
      </div>

      <p className="st-note">
        Rechenbeispiel Sommertag, Börsenpreise vereinfacht.{' '}
        <span className="only-kaeufer">
          12 kWh am Tag, davon {fmt(ASSUME.flexKwh)} kWh verschiebbar. Dynamischer Tarif = Börsenpreis plus Netzentgelt,
          Steuern, Umlagen und Vertrieb, darauf 19 % USt. Festpreis: Ø Haushalt 2026 laut BDEW.
        </span>
        <span className="only-erzeuger">
          {ASSUME.kwp} kWp, {ASSUME.speicherKwh}-kWh-Speicher, reiner Börsenerlös ohne Marktprämie und Vermarktungskosten,
          keine Vergütung bei negativen Preisen, 8 % Speicherverluste.
        </span>
      </p>
    </section>
  );
}
