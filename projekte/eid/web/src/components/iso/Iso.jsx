// Isometrische SVG-Bauteile (Schichtmodelle statt 2D-Icons). Reine Geometrie, keine Abhängigkeiten.
// Projektion: x' = (x − y)·cos30°, y' = (x + y)·sin30° − z

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;
const iso = (x, y, z = 0) => [(x - y) * C30, (x + y) * S30 - z];
const pts = arr => arr.map(p => iso(...p).map(n => n.toFixed(1)).join(',')).join(' ');

/** Quader mit drei sichtbaren Flächen. */
function Box({ x = 0, y = 0, z = 0, w, d, h, top, left, right, stroke = 'rgba(255,255,255,.18)' }) {
  return (
    <g>
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={left} stroke={stroke} strokeWidth="0.6" />
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={right} stroke={stroke} strokeWidth="0.6" />
      <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} stroke={stroke} strokeWidth="0.6" />
    </g>
  );
}

/** PV-Feld: Reihen geneigter Module auf Ständern, Zellraster auf der Oberfläche. */
export function IsoSolarField({ rows = 3, cols = 4, glow = 0.35, className }) {
  const mw = 34;
  const md = 20;
  const gap = 6;
  const tilt = 9; // Höhe der Hinterkante
  const modules = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (mw + gap);
      const y = r * (md + 18);
      const front = [[x, y + md, 6], [x + mw, y + md, 6]];
      const back = [[x + mw, y, 6 + tilt], [x, y, 6 + tilt]];
      const cells = [];
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        cells.push([[x + mw * t, y + md, 6], [x + mw * t, y, 6 + tilt]]);
      }
      const mid = [[x, y + md / 2, 6 + tilt / 2], [x + mw, y + md / 2, 6 + tilt / 2]];
      modules.push(
        <g key={`${r}-${c}`}>
          <polygon points={pts([[x + mw * 0.15, y + md, 0], [x + mw * 0.15, y + md, 6]])} stroke="rgba(255,255,255,.25)" />
          <polygon points={pts([[x + mw * 0.85, y, 0], [x + mw * 0.85, y, 6 + tilt]])} stroke="rgba(255,255,255,.25)" />
          <polygon points={pts([...front, ...back])} fill="url(#iso-pv)" stroke="rgba(170,200,230,.55)" strokeWidth="0.7" />
          {[...cells, mid].map((l, i) => (
            <polyline key={i} points={pts(l)} fill="none" stroke="rgba(170,200,230,.28)" strokeWidth="0.5" />
          ))}
        </g>
      );
    }
  }
  const W = cols * (mw + gap);
  const D = rows * (md + 18);
  return (
    <svg className={className} viewBox="-150 -40 330 200" aria-hidden="true">
      <defs>
        <linearGradient id="iso-pv" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d6a9a" />
          <stop offset="1" stopColor="#14263c" />
        </linearGradient>
        <radialGradient id="iso-sun-glow">
          <stop offset="0" stopColor="#f2b705" stopOpacity={glow} />
          <stop offset="1" stopColor="#f2b705" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="62" rx="150" ry="70" fill="url(#iso-sun-glow)" />
      <polygon points={pts([[-8, -8, 0], [W + 2, -8, 0], [W + 2, D, 0], [-8, D, 0]])} fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.12)" strokeWidth="0.6" />
      {modules}
    </svg>
  );
}

/** Batteriespeicher als Schrank mit Füllstandsbalken an der Front. */
export function IsoBattery({ level = 0.7, color = '#f2b705', className }) {
  const w = 46;
  const d = 26;
  const h = 58;
  const barH = (h - 16) * level;
  return (
    <svg className={className} viewBox="-40 -70 100 110" aria-hidden="true">
      <Box w={w} d={d} h={h} top="#e9ece8" left="#c9cfd2" right="#aab3b8" stroke="rgba(24,35,45,.35)" />
      {/* Gelbes Band oben */}
      <polygon points={pts([[0, d, h - 8], [w, d, h - 8], [w, d, h - 4], [0, d, h - 4]])} fill="#f2b705" />
      {/* Füllstand an der linken Front */}
      <polygon points={pts([[6, d, 6], [w - 6, d, 6], [w - 6, d, h - 12], [6, d, h - 12]])} fill="#1b2732" />
      <polygon points={pts([[8, d, 8], [w - 8, d, 8], [w - 8, d, 8 + barH * 0.88], [8, d, 8 + barH * 0.88]])} fill={color} />
      {/* Lüftungsschlitze rechts */}
      {[14, 22, 30, 38].map(z => (
        <polyline key={z} points={pts([[w, 6, z], [w, d - 6, z]])} stroke="rgba(24,35,45,.35)" strokeWidth="1.2" fill="none" />
      ))}
    </svg>
  );
}
