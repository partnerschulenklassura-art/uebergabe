// Realistische Bauteile für die 3D-Szenen: prozedurale Texturen (Canvas, keine Bilddateien, keine Bildrechte)
// und Objekt-Fabriken, die Tagesgeschichte und Produkt-Renderings gemeinsam nutzen.
import * as THREE from 'three';

const rnd = (() => {
  let s = 1234567;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const noise = (g, w, h, n, alpha, light = true) => {
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${rnd() * alpha})`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
};

// ---------- Texturen ----------

/** Solarmodul: 6×10 monokristalline Zellen, silberne Busbars, Alurahmen. */
export const pvTexture = () =>
  canvasTex(384, 640, (g, w, h) => {
    g.fillStyle = '#c9ced3';
    g.fillRect(0, 0, w, h);
    const pad = 10;
    const cw = (w - pad * 2) / 6;
    const ch = (h - pad * 2) / 10;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 6; c++) {
        const x = pad + c * cw;
        const y = pad + r * ch;
        const grad = g.createLinearGradient(x, y, x + cw, y + ch);
        grad.addColorStop(0, '#16233a');
        grad.addColorStop(1, '#0b1424');
        g.fillStyle = grad;
        g.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
        // abgeschrägte Zellecken (monokristallin)
        g.fillStyle = '#c9ced3';
        const k = 5;
        [[x + 1.5, y + 1.5, 1, 1], [x + cw - 1.5, y + 1.5, -1, 1], [x + 1.5, y + ch - 1.5, 1, -1], [x + cw - 1.5, y + ch - 1.5, -1, -1]].forEach(([px, py, dx, dy]) => {
          g.beginPath();
          g.moveTo(px, py);
          g.lineTo(px + k * dx, py);
          g.lineTo(px, py + k * dy);
          g.fill();
        });
        // Busbars
        g.fillStyle = 'rgba(200,210,220,.55)';
        for (let b = 1; b <= 3; b++) g.fillRect(x + (cw * b) / 4 - 0.6, y + 2, 1.2, ch - 4);
      }
    }
    noise(g, w, h, 900, 0.05);
  });

/** Dachziegel, dunkel anthrazit oder ziegelrot. */
export const roofTexture = (base = '#3a3f45') =>
  canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const rows = 8;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 16 : 0;
      for (let x = -32; x < w + 32; x += 32) {
        const shade = 0.85 + rnd() * 0.25;
        g.fillStyle = `rgba(0,0,0,${0.18 * (1 - shade + 0.3)})`;
        g.fillRect(x + off, r * rh + rh - 6, 32, 6);
        g.fillStyle = `rgba(255,255,255,${0.05 * shade})`;
        g.fillRect(x + off + 1, r * rh + 2, 30, rh - 10);
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.fillRect(x + off, r * rh, 1.5, rh);
      }
    }
    noise(g, w, h, 1500, 0.08, false);
  }, { repeat: [2, 2] });

/** Rauputz, leicht unregelmäßig. */
export const plasterTexture = (base = '#e7e3da') =>
  canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    noise(g, w, h, 5000, 0.06, false);
    noise(g, w, h, 3000, 0.06, true);
  }, { repeat: [2, 2] });

/** Wiese mit Farbflecken. */
export const grassTexture = () =>
  canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#4f6b3a';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 20 + rnd() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const col = rnd() > 0.5 ? '96,128,62' : '58,84,44';
      gr.addColorStop(0, `rgba(${col},.35)`);
      gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '140,170,90' : '40,60,30'},${0.25 + rnd() * 0.3})`;
      g.fillRect(rnd() * w, rnd() * h, 1, 2 + rnd() * 3);
    }
  }, { repeat: [10, 10] });

/** Trapezblech für den Speicher-Container. */
export const corrugatedTexture = () =>
  canvasTex(256, 64, (g, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = 200 + Math.sin((x / w) * Math.PI * 24) * 30;
      g.fillStyle = `rgb(${v},${v + 3},${v + 6})`;
      g.fillRect(x, 0, 1, h);
    }
    noise(g, w, h, 400, 0.05, false);
  }, { repeat: [1, 1] });

/** Weiches Leuchtpunkt-Sprite für Stromflüsse. */
export const glowSprite = () =>
  canvasTex(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,.65)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
  });

// ---------- Materialien (einmal je Szene) ----------

export function makeMaterials({ cheap = false } = {}) {
  const pv = cheap
    ? new THREE.MeshStandardMaterial({ map: pvTexture(), roughness: 0.25, metalness: 0.3 })
    : new THREE.MeshPhysicalMaterial({
        map: pvTexture(),
        roughness: 0.22,
        metalness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.3
      });
  return {
    pv,
    alu: new THREE.MeshStandardMaterial({ color: 0xb9c0c7, metalness: 0.85, roughness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8a9299, metalness: 0.7, roughness: 0.45 }),
    roofDark: new THREE.MeshStandardMaterial({ map: roofTexture('#353a40'), roughness: 0.8 }),
    roofRed: new THREE.MeshStandardMaterial({ map: roofTexture('#8a3f2c'), roughness: 0.8 }),
    plaster: new THREE.MeshStandardMaterial({ map: plasterTexture('#ebe6dc'), roughness: 0.95 }),
    plaster2: new THREE.MeshStandardMaterial({ map: plasterTexture('#d9dcd6'), roughness: 0.95 }),
    barn: new THREE.MeshStandardMaterial({ color: 0x6e4b33, roughness: 0.9 }),
    grass: new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 }),
    gravel: new THREE.MeshStandardMaterial({ color: 0x8d8a83, roughness: 1 }),
    container: new THREE.MeshStandardMaterial({ map: corrugatedTexture(), metalness: 0.4, roughness: 0.45, color: 0xf4f5f2 }),
    sun: new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.5, emissive: 0xf2b705, emissiveIntensity: 0.15 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1b2632, roughness: 0.08, metalness: 0.6, emissive: 0xffc35a, emissiveIntensity: 0 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xf3f3f0, roughness: 0.6 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 0.9 }),
    leaf: [0x3f6b34, 0x4d7a3a, 0x35592c].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })),
    display: new THREE.MeshStandardMaterial({ color: 0x0f1a24, emissive: 0x5fb37f, emissiveIntensity: 0.8 })
  };
}

const shadow = o => {
  o.traverse(m => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return o;
};

// ---------- Objekte ----------

/** Ein Modul (1,1 × 1,8 m) mit Rahmen. */
export function pvModule(M) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 1.7), [M.alu, M.alu, M.pv, M.alu, M.alu, M.alu]);
  g.add(glass);
  return g;
}

/** Freiflächen-Reihe: Module zweireihig auf Gestell, 20° geneigt. */
export function pvRow(M, n = 8) {
  const row = new THREE.Group();
  const tilt = THREE.MathUtils.degToRad(22);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 2; j++) {
      const m = pvModule(M);
      m.rotation.y = Math.PI / 2;
      m.position.set(i * 1.06 - (n * 1.06) / 2 + 0.53, 0, j * 1.75 - 0.87);
      row.add(m);
    }
  }
  const tiltGroup = new THREE.Group();
  tiltGroup.add(row);
  row.rotation.x = 0;
  tiltGroup.rotation.x = tilt; // Hinterkante (−z) hoch, Module schauen nach Süden (+z)
  tiltGroup.position.y = 1.35;
  const frame = new THREE.Group();
  frame.add(tiltGroup);
  for (let i = 0; i <= n; i += 2) {
    const x = i * 1.06 - (n * 1.06) / 2;
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), M.steel);
    front.position.set(x, 0.45, 1.3);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 0.06), M.steel);
    back.position.set(x, 1.05, -1.3);
    frame.add(front, back);
  }
  return shadow(frame);
}

/** Satteldachhaus mit Fenstern; optional PV auf der Südseite. */
export function house(M, { w = 8, d = 10, h = 5.5, roof = 'dark', pv = false, wall = 'plaster', windows = 3 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M[wall]);
  body.position.y = h / 2;
  g.add(body);
  const rise = w * 0.42;
  const run = w / 2 + 0.4;
  const slope = Math.hypot(run, rise);
  const ang = Math.atan2(rise, run);
  const roofMat = roof === 'red' ? M.roofRed : M.roofDark;
  [-1, 1].forEach(side => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.18, d + 0.8), roofMat);
    plate.position.set((side * run) / 2, h + rise / 2, 0);
    plate.rotation.z = -side * ang;
    g.add(plate);
    if (pv && side === 1) {
      const cols = Math.floor((d - 1) / 1.06);
      const rows = Math.floor((slope - 0.8) / 1.75);
      const holder = new THREE.Group();
      holder.position.copy(plate.position);
      holder.rotation.z = plate.rotation.z;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const m = pvModule(M);
          m.position.set(-slope / 2 + 0.5 + 0.88 + r * 1.75, 0.14, -((cols - 1) * 1.06) / 2 + c * 1.06);
          m.rotation.y = Math.PI / 2;
          holder.add(m);
        }
      }
      g.add(holder);
    }
  });
  // Giebel
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(0, rise);
  shape.lineTo(w / 2, 0);
  const gableGeo = new THREE.ShapeGeometry(shape);
  [-1, 1].forEach(s => {
    const gable = new THREE.Mesh(gableGeo, M[wall]);
    gable.position.set(0, h, (s * d) / 2);
    if (s < 0) gable.rotation.y = Math.PI;
    g.add(gable);
  });
  // Fenster auf Vorder- und Rückseite (±z)
  const winGeo = new THREE.BoxGeometry(1.1, 1.35, 0.12);
  const frameGeo = new THREE.BoxGeometry(1.3, 1.55, 0.08);
  [-1, 1].forEach(s => {
    for (let i = 0; i < windows; i++) {
      for (let f = 0; f < (h > 5 ? 2 : 1); f++) {
        const x = -w / 2 + (w / windows) * (i + 0.5);
        const y = 1.6 + f * 2.6;
        const fr = new THREE.Mesh(frameGeo, M.frame);
        fr.position.set(x, y, (s * d) / 2 + s * 0.02);
        const gl = new THREE.Mesh(winGeo, M.glass);
        gl.position.set(x, y, (s * d) / 2 + s * 0.05);
        g.add(fr, gl);
      }
    }
  });
  return shadow(g);
}

/** Batteriespeicher als 20-Fuß-Container mit EID-Band und Display. */
export function storageContainer(M) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(6.1, 2.6, 2.44), M.container);
  body.position.y = 1.4;
  g.add(body);
  const band = new THREE.Mesh(new THREE.BoxGeometry(6.12, 0.22, 2.46), M.sun);
  band.position.y = 2.35;
  g.add(band);
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.12, 2.6), M.steel);
  base.position.y = 0.06;
  g.add(base);
  // Türen und Lüftungsgitter
  for (let i = 0; i < 3; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.04), M.steel);
    vent.position.set(-2 + i * 2, 1.9, 1.24);
    g.add(vent);
  }
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), M.display);
  display.position.set(2.2, 1.3, 1.235);
  g.add(display);
  g.userData.display = display;
  return shadow(g);
}

/** Laubbaum aus mehreren Kugeln, leicht zufällig. */
export function tree(M, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 2.4 * s, 7), M.wood);
  trunk.position.y = 1.2 * s;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((1.2 + rnd() * 0.6) * s, 1), M.leaf[i % 3]);
    leaf.position.set((rnd() - 0.5) * 1.4 * s, (2.8 + rnd() * 1.2) * s, (rnd() - 0.5) * 1.4 * s);
    g.add(leaf);
  }
  return shadow(g);
}

/** Holzmast für die Leitung. */
export function pole(M, h = 7) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, h, 8), M.wood);
  p.position.y = h / 2;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), M.wood);
  arm.position.y = h - 0.4;
  g.add(p, arm);
  return shadow(g);
}
