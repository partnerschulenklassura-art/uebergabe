import { sunPos, gen, SUNRISE, SUNSET } from '../lib/day.js';
import { sceneImg } from '../lib/url.js';

/**
 * Die Landschaft als Diorama: Himmel und Wald hinten, davor Solarpark, Häuser, Mast, Hof, Speicher und Wiese
 * als einzelne freigestellte Ebenen. Jede Ebene liegt auf eigener Tiefe (translateZ) und wird so skaliert, dass
 * das Bild in Ruhe deckungsgleich ist; kippt die Bühne, verschieben sich die Ebenen gegeneinander.
 * Sonnenbahn, Sonne und Tageslicht folgen der Uhrzeit h – dieselbe Rechnung wie die 3D-Tagesgeschichte.
 */
const W = 1800;
const H = 1005;
const HZ = H * 0.556; // Horizont (Waldkante) im Foto
const TOP = 210;
const P = 1100; // Perspektive der Bühne in px

// Lage der Ebenen in Prozent des Gesamtbilds (aus dem Freistellen) und ihre Tiefe
const LAYERS = [
  { id: 'park', x: 40.916, y: 63.491, w: 24.534, z: -70 },
  { id: 'haeuser', x: 67.314, y: 55.633, w: 30.862, z: -60 },
  { id: 'mast', x: 66.498, y: 48.122, w: 2.601, z: -48 },
  { id: 'hof', x: 0, y: 46.94, w: 42.197, z: -28, fade: 'left' },
  { id: 'speicher', x: 34.938, y: 67.385, w: 9.821, z: 6 },
  { id: 'wiese', x: 0, y: 74.409, w: 100, z: 26 }
];
const BG_Z = -120;

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const sx = t => 150 + t * (W - 300);
const sy = elev => HZ - (elev / 56) * (HZ - TOP);

const TRACK = Array.from({ length: 49 }, (_, i) => {
  const t = i / 48;
  const { elev } = sunPos(SUNRISE + t * (SUNSET - SUNRISE));
  return `${i ? 'L' : 'M'}${sx(t).toFixed(1)},${sy(elev).toFixed(1)}`;
}).join(' ');
const TICKS = [6, 9, 12, 15, 18].map(hr => {
  const { t, elev } = sunPos(hr);
  return { hr, x: sx(t), y: sy(elev) };
});
const STARS = Array.from({ length: 50 }, (_, i) => {
  const r = Math.sin(i * 91.7) * 43758.5453;
  const q = Math.sin(i * 12.9) * 15731.743;
  return { x: (r - Math.floor(r)) * W, y: (q - Math.floor(q)) * HZ * 0.9, s: 0.9 + ((i * 7) % 5) * 0.4 };
});

const img = sceneImg;
// Ebene auf Tiefe z, so skaliert, dass sie in Ruhe genau auf dem Foto liegt
const depth = z => ({ transform: `translateZ(${z}px) scale(${(P - z) / P})`, transformStyle: 'preserve-3d' });
const EDGE = 'linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)';
const EDGE_V = 'linear-gradient(to bottom, transparent 2%, #000 19%, #000 80%, transparent)';

// Stromflüsse als leuchtende Bahnen (Koordinaten im Gesamtbild 1800×1005)
const FLOWS = [
  { id: 'direkt', d: 'M450,592 Q930,420 1400,632', color: '#f2b705', label: 'Solarstrom direkt zu den Nachbarn' },
  { id: 'laden', d: 'M470,600 Q610,560 712,684', color: '#f2b705', label: 'Mittagsstrom in den Speicher' },
  { id: 'verkauf', d: 'M730,684 Q1120,540 1520,630', color: '#5fb37f', label: 'Speicher verkauft am Abend' },
  { id: 'park', d: 'M960,668 Q1090,560 1232,494', color: '#f2b705', label: 'Solarpark speist ins Netz' },
  { id: 'netz', d: 'M1236,494 Q1360,480 1460,624', color: '#8fb3d1', label: 'Strom aus dem Netz' }
];
const flowLevel = (id, h) => {
  const g = gen(h);
  if (id === 'direkt') return clamp01(g * 2.2);
  if (id === 'laden') return h >= 11 && h < 15 ? 1 : 0;
  if (id === 'verkauf') return h >= 18 && h < 21 ? 1 : 0;
  if (id === 'park') return clamp01((g - 0.35) * 2.5);
  if (id === 'netz') return h >= 18 && h < 21 ? 0 : clamp01(1 - g * 3);
  return 0;
};

export default function SunScene({ h, flows = false }) {
  const { t, elev } = sunPos(h);
  const day = smooth(-5, 10, elev);
  const night = 1 - smooth(-7, 1, elev);
  const golden = smooth(-6, 1, elev) * (1 - smooth(5, 22, elev));
  const x = sx(clamp01(t));
  const y = sy(elev);
  const warm = 1 - smooth(4, 30, elev);
  const sunCore = `rgb(255,${Math.round(246 - warm * 80)},${Math.round(214 - warm * 150)})`;
  // Licht auf den Objekten: abends warm, nachts dunkel und kühl
  const light = `brightness(${0.26 + 0.74 * day + golden * 0.08}) saturate(${0.5 + 0.5 * day + golden * 0.3}) sepia(${golden * 0.38}) hue-rotate(${-golden * 12 + night * 18}deg)`;

  return (
    <div className="relative aspect-[1800/1005] w-full" style={{ transformStyle: 'preserve-3d' }}>
      {/* Hinten: Himmel, Wald, Felder – mit weichen Rändern statt Bildkante */}
      <div
        className="absolute inset-0"
        style={{ ...depth(BG_Z), maskImage: `${EDGE}, ${EDGE_V}`, WebkitMaskImage: `${EDGE}, ${EDGE_V}`, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}
      >
        <img src={img('hintergrund')} alt="" width={W} height={H} className="absolute inset-0 block h-full w-full" style={{ filter: light }} />
        <div
          aria-hidden="true"
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: golden,
            background: `radial-gradient(60% 75% at ${(x / W) * 100}% 55%, rgba(255,150,60,.95), rgba(255,110,50,.5) 45%, rgba(120,40,60,.35) 100%)`
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ opacity: night * 0.78, background: 'linear-gradient(to bottom, #040a1a 0%, #0a1830 55%, #070d18 100%)' }}
        />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="sun-glow">
              <stop offset="0" stopColor={sunCore} stopOpacity="0.9" />
              <stop offset="0.25" stopColor={sunCore} stopOpacity="0.35" />
              <stop offset="1" stopColor={sunCore} stopOpacity="0" />
            </radialGradient>
            <clipPath id="sky-clip">
              <rect x="0" y="0" width={W} height={HZ + 6} />
            </clipPath>
          </defs>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={night * (0.35 + (i % 3) * 0.2)} />
          ))}
          <path d={TRACK} fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="2 13" strokeLinecap="round" />
          {TICKS.map(k => (
            <g key={k.hr} opacity="0.8">
              <circle cx={k.x} cy={k.y} r="5" fill="#fff" fillOpacity="0.75" />
              <text x={k.x} y={k.y - 18} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="600" stroke="rgba(0,0,0,.3)" strokeWidth="4" style={{ paintOrder: 'stroke' }}>
                {k.hr} Uhr
              </text>
            </g>
          ))}
          <g clipPath="url(#sky-clip)" style={{ mixBlendMode: 'screen' }} opacity={smooth(-9, -1, elev)}>
            <circle cx={x} cy={y} r={190 + warm * 130} fill="url(#sun-glow)" />
            <circle cx={x} cy={y} r="34" fill={sunCore} />
          </g>
        </svg>
      </div>

      {/* Davor die freigestellten Objekte, jedes auf seiner Tiefe */}
      {LAYERS.map(l => (
        <div key={l.id} className="pointer-events-none absolute inset-0" style={depth(l.z)}>
          <img
            src={img(l.id)}
            alt=""
            className="absolute block h-auto"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.w}%`,
              filter: l.id === 'speicher' ? `${light} drop-shadow(0 18px 18px rgba(0,0,0,.45))` : light,
              ...(l.fade === 'left' && { maskImage: 'linear-gradient(to right, transparent, #000 8%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 8%)' }),
              ...(l.id === 'wiese' && { maskImage: `${EDGE}, linear-gradient(to bottom, #000 35%, transparent)`, WebkitMaskImage: `${EDGE}, linear-gradient(to bottom, #000 35%, transparent)`, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' })
            }}
          />
        </div>
      ))}
      {flows && (
        <div className="pointer-events-none absolute inset-0" style={depth(-20)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {FLOWS.map(f => {
              const o = flowLevel(f.id, h);
              return (
                <g key={f.id} style={{ opacity: o, transition: 'opacity .5s ease' }}>
                  <path d={f.d} fill="none" stroke={f.color} strokeOpacity="0.22" strokeWidth="10" strokeLinecap="round" />
                  <path d={f.d} fill="none" stroke={f.color} strokeWidth="5" strokeLinecap="round" strokeDasharray="3 26" className="flow-dash" style={{ filter: `drop-shadow(0 0 6px ${f.color})` }} />
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <span className="sr-only">Dorf mit Photovoltaik auf dem Hofdach, Solarpark, Speicher-Container und Wohnhäusern</span>
    </div>
  );
}
