import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { PAGES, TOOLS } from '../site.config.js';
import { sceneImg, url } from '../lib/url.js';

/**
 * Die sechs Bereiche als Lageplan: in der Mitte der Hof aus der Foto-Szene, ringsum die Bereiche als Glasschilder.
 * Jede Linie führt vom Schild zu der Stelle, an der der Bereich an der Anlage ansetzt.
 * Links die Arbeit an der Anlage, rechts das, was ihr Strom und ihr Schutz einbringt.
 */
const LEFT = [
  { id: 'planen', spot: [24, 46], where: 'Dachfläche' },
  { id: 'komponenten', spot: [47, 51], where: 'Module und Wechselrichter' },
  { id: 'pruefen', spot: [14, 70], where: 'Anlage im Betrieb' }
];
const RIGHT = [
  { id: 'strom', spot: [83, 42], where: 'Nachbarn und Netz' },
  { id: 'speicher', spot: [68, 80], where: 'Speicher-Container' },
  { id: 'schutz', spot: [34, 86], where: 'Gelände' }
];

// Ebenen der kleinen Szene: Lage in Prozent der Bühne und Tiefe (für die Mausbewegung)
const PIECES = [
  { id: 'park', left: 34, top: 53, w: 64, d: -0.6 },
  { id: 'haeuser', left: 46, top: 32, w: 58, d: -0.45 },
  { id: 'mast', left: 70, top: 10, w: 5.2, d: -0.3 },
  { id: 'hof', left: -4, top: 31, w: 80, d: 0, fade: true },
  { id: 'speicher', left: 52, top: 67, w: 32, d: 0.7, shadow: true }
];
const img = sceneImg;
const page = id => PAGES.find(p => p.id === id);
const tools = id => TOOLS.filter(t => t.bereich === id && t.public).map(t => t.name);

function Card({ item, side, active, onHover, refFn }) {
  const p = page(item.id);
  const t = tools(item.id);
  return (
    <li ref={refFn} className="list-none">
      <a
        href={p.live ? url(p.href) : '#warteliste'}
        onPointerEnter={() => onHover(item.id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(item.id)}
        onBlur={() => onHover(null)}
        className={`glass-strong rim group relative block rounded-[20px] px-5 py-4 text-papier no-underline transition-[transform,box-shadow] duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sonne ${
          active
            ? 'shadow-[0_0_0_1px_rgba(242,183,5,.5),0_30px_60px_-20px_rgba(0,0,0,.7),0_0_50px_-10px_rgba(242,183,5,.35)]'
            : 'shadow-[0_2px_4px_rgba(0,0,0,.25),0_24px_48px_-20px_rgba(0,0,0,.6)]'
        } ${side === 'left' ? 'lg:hover:-translate-x-1' : 'lg:hover:translate-x-1'} hover:-translate-y-1`}
      >
        <span className="block text-[0.82rem] text-papier/55">
          {item.where}
          {!p.live && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[0.75rem] text-papier/70">bald</span>}
        </span>
        <strong className="mt-0.5 block font-display text-[1.45rem] font-semibold leading-tight">{p.title}</strong>
        <span className="mt-1.5 block text-[0.96rem] leading-snug text-papier/70">{p.text}</span>
        {t.length > 0 && (
          <span className="mt-3 flex flex-wrap gap-1.5">
            {t.map(n => (
              <em key={n} className="rounded-full bg-sonne/15 px-2.5 py-1 text-[0.8rem] font-medium not-italic text-sonne">
                {n}
              </em>
            ))}
          </span>
        )}
      </a>
    </li>
  );
}

export default function Bereiche() {
  const reduce = useReducedMotion();
  const stage = useRef(null);
  const scene = useRef(null);
  const cards = useRef({});
  const [lines, setLines] = useState([]);
  const [active, setActive] = useState(null);
  const [hover, setHover] = useState(null);
  const shown = hover ?? active;

  // Ohne Maus zeigt der Lageplan nacheinander, wo jeder Bereich ansetzt
  useEffect(() => {
    if (reduce) return;
    const order = [...LEFT, ...RIGHT].map(i => i.id);
    let i = 0;
    let t;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (!e.isIntersecting) return setActive(null);
      setActive(order[i]);
      t = setInterval(() => {
        i = (i + 1) % order.length;
        setActive(order[i]);
      }, 2600);
    });
    io.observe(stage.current);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [reduce]);

  // Mausbewegung verschiebt die Ebenen der Szene gegeneinander
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 18 });
  const sy = useSpring(my, { stiffness: 70, damping: 18 });
  const move = e => {
    if (reduce || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  // Linien vom Schild zum Punkt an der Anlage; neu messen, wenn sich die Größe ändert
  useLayoutEffect(() => {
    const measure = () => {
      if (!stage.current || !scene.current || window.innerWidth < 1024) return setLines([]);
      const s = stage.current.getBoundingClientRect();
      const b = scene.current.getBoundingClientRect();
      const out = [];
      for (const [list, side] of [
        [LEFT, 'left'],
        [RIGHT, 'right']
      ]) {
        for (const it of list) {
          const c = cards.current[it.id]?.getBoundingClientRect();
          if (!c) continue;
          const x1 = (side === 'left' ? c.right : c.left) - s.left;
          const y1 = c.top + c.height / 2 - s.top;
          const x2 = b.left - s.left + (it.spot[0] / 100) * b.width;
          const y2 = b.top - s.top + (it.spot[1] / 100) * b.height;
          out.push({ id: it.id, x1, y1, x2, y2, side });
        }
      }
      setLines(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  const card = side => it => (
    <Card key={it.id} item={it} side={side} active={shown === it.id} onHover={setHover} refFn={el => (cards.current[it.id] = el)} />
  );

  return (
    <section className="relative overflow-hidden bg-tinte pb-16 pt-24 text-papier sm:pb-20 sm:pt-32" id="bereiche" aria-labelledby="bereiche-h" onPointerMove={move}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-drift-b absolute left-[25%] top-[30%] h-[600px] w-[700px] rounded-full bg-[#1f4a6e] opacity-35 blur-[140px]" />
        <div className="animate-drift-a absolute right-[10%] top-[60%] h-[420px] w-[420px] rounded-full bg-[#6b4f10] opacity-25 blur-[120px]" />
      </div>

      <div className="wrap relative">
        <h2 id="bereiche-h" className="m-0 max-w-[18ch] font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[0.98]">
          Alles, was eine Solaranlage im Leben braucht
        </h2>
        <p className="mb-0 mt-5 max-w-[56ch] text-[1.15rem] leading-relaxed text-papier/75">
          Planen, ausstatten, prüfen, schützen, Strom verkaufen, speichern. Jeder Bereich steht für sich, zusammen begleiten
          sie eine Anlage über ihr ganzes Leben.
        </p>

        <div ref={stage} className="relative mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-[minmax(250px,300px)_1fr_minmax(250px,300px)] lg:gap-8">
          {/* Verbindungslinien (nur breite Bildschirme) */}
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible lg:block">
            {lines.map(l => {
              const on = shown === l.id;
              const mid = (l.x1 + l.x2) / 2;
              return (
                <g key={l.id} style={{ opacity: shown && !on ? 0.35 : 1, transition: 'opacity .4s' }}>
                  <path
                    d={`M${l.x1},${l.y1} C${mid},${l.y1} ${mid},${l.y2} ${l.x2},${l.y2}`}
                    fill="none"
                    stroke={on ? '#f2b705' : 'rgba(247,247,244,.5)'}
                    strokeWidth={on ? 2.2 : 1.5}
                    strokeDasharray={on ? '3 9' : '2 6'}
                    className={on ? 'flow-dash' : undefined}
                  />
                  <circle cx={l.x2} cy={l.y2} r={on ? 16 : 11} fill="rgba(242,183,5,.18)" className="transition-all duration-300" />
                  <circle cx={l.x2} cy={l.y2} r="5" fill={on ? '#f2b705' : '#f7f7f4'} />
                </g>
              );
            })}
          </svg>

          <ul className="relative z-20 order-2 m-0 grid gap-4 p-0 lg:order-1">{LEFT.map(card('left'))}</ul>

          {/* Kleine Szene auf einer Glasplatte */}
          <div className="order-1 lg:order-2">
            <div ref={scene} className="relative mx-auto aspect-[5/4] w-full max-w-[640px] lg:-mx-[7%] lg:w-[114%] lg:max-w-none">
              <div
                aria-hidden="true"
                className="rim absolute inset-x-[0%] top-[56%] h-[38%] rounded-[50%] bg-gradient-to-b from-white/[0.07] to-white/[0.01] shadow-[0_40px_80px_-20px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.12)]"
              />
              {PIECES.map(pc => (
                <Piece key={pc.id} pc={pc} sx={sx} sy={sy} />
              ))}
              <span className="sr-only">Hof mit Photovoltaik, Speicher-Container, Solarpark und Nachbarhäuser</span>
            </div>
          </div>

          <ul className="relative z-20 order-3 m-0 grid gap-4 p-0">{RIGHT.map(card('right'))}</ul>
        </div>
      </div>
    </section>
  );
}

function Piece({ pc, sx, sy }) {
  const x = useTransform(sx, v => v * pc.d * 40);
  const y = useTransform(sy, v => v * pc.d * 16);
  return (
    <motion.img
      src={img(pc.id)}
      alt=""
      loading="lazy"
      className={`absolute block h-auto max-w-none ${pc.shadow ? 'drop-shadow-[0_22px_18px_rgba(0,0,0,.6)]' : 'drop-shadow-[0_14px_16px_rgba(0,0,0,.45)]'}`}
      style={{
        left: `${pc.left}%`,
        top: `${pc.top}%`,
        width: `${pc.w}%`,
        x,
        y,
        ...(pc.fade && { maskImage: 'linear-gradient(to right, transparent, #000 10%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 10%)' })
      }}
    />
  );
}
