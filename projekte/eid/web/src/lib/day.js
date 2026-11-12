// Schematischer Sommertag: Erzeugung relativ (0–1), Day-Ahead-Preis vereinfacht in ct/kWh.
export const PRICE = [9, 8, 7.5, 7, 7.5, 9, 12, 15, 13, 9, 5, 2, 0.5, -1, 0, 2, 6, 11, 17, 19, 16, 13, 11, 10, 9];

export const gen = h => (h <= 6 || h >= 20 ? 0 : Math.pow(Math.sin((Math.PI * (h - 6)) / 14), 1.6));

// Preis zwischen den Stunden linear interpolieren.
export const price = h => {
  const a = Math.max(0, Math.min(23, Math.floor(h)));
  const t = h - a;
  return PRICE[a] * (1 - t) + PRICE[a + 1] * t;
};

// Speicherfüllstand: lädt 11–15 Uhr, entlädt 18–21 Uhr.
export const soc = h => {
  if (h < 11) return 0.1;
  if (h < 15) return 0.1 + ((h - 11) / 4) * 0.9;
  if (h < 18) return 1;
  if (h < 21) return 1 - ((h - 18) / 3) * 0.85;
  return 0.15;
};

// Catmull-Rom zu kubischen Béziers – glatte Kurve durch alle Punkte.
export function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export const fmt = (n, d = 1) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
