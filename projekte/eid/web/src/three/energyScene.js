// 3D-Szene „Ein Tag im Leben des Stroms“ – plain three.js, wird lazy geladen.
// Links der Hof des Erzeugers mit PV-Dach, in der Mitte der Speicher, rechts die Häuser der Stromkäufer.
// setHour(h) stellt Sonne, Himmel, Fenster und Stromflüsse auf die Uhrzeit ein.
import * as THREE from 'three';
import { gen, price } from '../lib/day.js';

const C = {
  ground: 0x26333d,
  ground2: 0x2c3a45,
  wall: 0xe4e6e1,
  wallBuyer: 0xd5d9d3,
  roof: 0x3b4954,
  pv: 0x1d3557,
  pvLine: 0x5d7ea8,
  sun: 0xf2b705,
  net: 0x8fb3d1,
  green: 0x5fb37f,
  ink: 0x18232d,
  window: 0xffc94a
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function house(w, d, h, wallColor, roofColor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 })
  );
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  // Satteldach als Prisma
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - 0.15, 0);
  shape.lineTo(0, h * 0.55);
  shape.lineTo(w / 2 + 0.15, 0);
  shape.lineTo(-w / 2 - 0.15, 0);
  const roof = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: d + 0.3, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8, flatShading: true })
  );
  roof.position.set(0, h, -d / 2 - 0.15);
  roof.castShadow = true;
  g.add(roof);
  g.userData = { w, d, h };
  return g;
}

function windowsFor(group, color, cols = 3) {
  const { w, d, h } = group.userData;
  const mat = new THREE.MeshStandardMaterial({ color: 0x223040, emissive: color, emissiveIntensity: 0 });
  const geo = new THREE.PlaneGeometry(w / (cols * 2.4), h / 4.2);
  for (let i = 0; i < cols; i++) {
    for (let r = 0; r < 2; r++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(-w / 2 + (w / cols) * (i + 0.5), h * (0.32 + r * 0.38), d / 2 + 0.01);
      group.add(m);
    }
  }
  return mat;
}

function pvRoof(group) {
  const { w, d, h } = group.userData;
  const mat = new THREE.MeshStandardMaterial({
    color: C.pv,
    metalness: 0.35,
    roughness: 0.25,
    emissive: C.pvLine,
    emissiveIntensity: 0
  });
  const run = w / 2 + 0.15;
  const rise = h * 0.55;
  const angle = Math.atan2(rise, run);
  const slopeLen = Math.hypot(run, rise);
  // Dachfläche auf der +x-Seite: lokales x läuft den Hang hinauf, lokales z entlang des Firsts
  const slope = new THREE.Group();
  slope.position.set(run / 2, h + rise / 2, 0);
  slope.rotation.z = -angle;
  const rows = 3;
  const cols = 7;
  const pw = (slopeLen - 0.3) / rows;
  const pd = (d - 0.3) / cols;
  const geo = new THREE.BoxGeometry(pw * 0.92, 0.06, pd * 0.92);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const panel = new THREE.Mesh(geo, mat);
      panel.position.set(-slopeLen / 2 + 0.15 + pw * (r + 0.5), 0.06, -d / 2 + 0.15 + pd * (c + 0.5));
      panel.castShadow = true;
      slope.add(panel);
    }
  }
  group.add(slope);
  return mat;
}

function cableCurve(a, b, sag = 0.9, lift = 2.6) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y = Math.max(a.y, b.y) + lift - sag;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

export function createEnergyScene(canvas, { small = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.5));
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const sky = new THREE.Color();
  scene.background = sky;
  scene.fog = new THREE.Fog(0x18232d, 30, 70);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);

  // Licht
  const hemi = new THREE.HemisphereLight(0xdbe7f2, 0x2a2f33, 0.9);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xfff1c9, 2.2);
  sunLight.castShadow = !small;
  sunLight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunLight.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 60 });
  sunLight.shadow.bias = -0.0008;
  scene.add(sunLight, sunLight.target);

  // Boden: eine leicht gewölbte Insel
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(17, 18, 1, 64),
    new THREE.MeshStandardMaterial({ color: C.ground, roughness: 1 })
  );
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);
  const field = new THREE.Mesh(
    new THREE.CircleGeometry(16.6, 64),
    new THREE.MeshStandardMaterial({ color: C.ground2, roughness: 1 })
  );
  field.rotation.x = -Math.PI / 2;
  field.position.y = 0.01;
  field.receiveShadow = true;
  scene.add(field);

  // Erzeuger: Hof mit großem PV-Dach
  const farm = house(5.2, 7, 2.6, C.wall, C.roof);
  farm.position.set(-8, 0, -1);
  farm.rotation.y = -1.05;
  scene.add(farm);
  const pvMat = pvRoof(farm);
  const farmWin = windowsFor(farm, C.window, 2);

  // Speicher: Container mit Füllstand
  const store = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.8, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.6 })
  );
  box.position.y = 0.9;
  box.castShadow = box.receiveShadow = true;
  store.add(box);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.22, 0.18, 1.62),
    new THREE.MeshStandardMaterial({ color: C.sun, emissive: C.sun, emissiveIntensity: 0.25 })
  );
  stripe.position.y = 1.55;
  store.add(stripe);
  const gaugeBg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshBasicMaterial({ color: 0x223040 }));
  gaugeBg.position.set(0, 0.85, 0.81);
  store.add(gaugeBg);
  const gaugeMat = new THREE.MeshStandardMaterial({ color: C.green, emissive: C.green, emissiveIntensity: 0.8 });
  const gauge = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.4), gaugeMat);
  gauge.position.set(0, 0.85, 0.815);
  store.add(gauge);
  store.position.set(-1.5, 0, 2.2);
  store.rotation.y = 0.1;
  scene.add(store);

  // Käufer: drei Häuser
  const buyers = [];
  const buyerWins = [];
  [
    [6.5, -2.5, 3.2, 4.2, 2.2, -0.2],
    [9.5, 1.5, 3, 3.6, 2.6, -0.35],
    [5.5, 4.2, 2.8, 3.4, 2, 0.15]
  ].forEach(([x, z, w, d, h, ry]) => {
    const hs = house(w, d, h, C.wallBuyer, 0x4a5a66);
    hs.position.set(x, 0, z);
    hs.rotation.y = ry;
    scene.add(hs);
    buyers.push(hs);
    buyerWins.push(windowsFor(hs, C.window, 3));
  });

  // Mast in der Mitte (Netzanschluss)
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a949c })
  );
  pole.position.set(2.2, 2.1, -0.3);
  pole.castShadow = true;
  scene.add(pole);
  const top = new THREE.Vector3(2.2, 4.1, -0.3);

  // Leitungen
  const P = {
    farm: new THREE.Vector3(-6.2, 2.4, 0.2),
    store: new THREE.Vector3(-1.5, 1.8, 2.2),
    pole: top,
    b0: new THREE.Vector3(6.3, 2.2, -1.2),
    b1: new THREE.Vector3(9.2, 2.6, 2.6),
    b2: new THREE.Vector3(5.6, 2, 5.4)
  };
  const routes = {
    farmStore: cableCurve(P.farm, P.store, 1.2, 1.6),
    storePole: cableCurve(P.store, P.pole, 0.8, 1.4),
    farmPole: cableCurve(P.farm, P.pole, 1.4, 2.4),
    pole0: cableCurve(P.pole, P.b0, 0.9, 1.2),
    pole1: cableCurve(P.pole, P.b1, 0.9, 1.2),
    pole2: cableCurve(P.pole, P.b2, 0.9, 1.2)
  };
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x55636e });
  Object.values(routes).forEach(c => scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.025, 6), cableMat)));

  // Stromfluss als leuchtende Punkte (Instanced)
  const PER = small ? 10 : 18;
  const flows = [
    { name: 'farmPole', path: [routes.farmPole], color: C.sun },
    { name: 'farmStore', path: [routes.farmStore], color: C.sun },
    { name: 'storeHomes', path: [routes.storePole], color: C.green, then: [routes.pole0, routes.pole1, routes.pole2] },
    { name: 'gridHomes', path: [], color: C.net, then: [routes.pole0, routes.pole1, routes.pole2] }
  ];
  const dotGeo = new THREE.SphereGeometry(0.11, 10, 8);
  flows.forEach(f => {
    const mat = new THREE.MeshBasicMaterial({ color: f.color, transparent: true, opacity: 0 });
    const mesh = new THREE.InstancedMesh(dotGeo, mat, PER * 3);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    f.mesh = mesh;
    f.mat = mat;
    f.level = 0;
    f.offsets = Array.from({ length: PER * 3 }, (_, i) => (i % PER) / PER + Math.random() * 0.02);
    scene.add(mesh);
  });

  // Sonne
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), new THREE.MeshBasicMaterial({ color: C.sun }));
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 24, 16),
    new THREE.MeshBasicMaterial({ color: C.sun, transparent: true, opacity: 0.18, depthWrite: false })
  );
  sunMesh.add(halo);
  scene.add(sunMesh);

  // Himmel je Uhrzeit
  const skyNight = new THREE.Color(0x101a24);
  const skyDawn = new THREE.Color(0x3a3340);
  const skyDay = new THREE.Color(0x2b4a63);
  const skyDusk = new THREE.Color(0x4a3030);

  let hour = 5;
  const tmp = new THREE.Object3D();
  const v = new THREE.Vector3();

  function setHour(h) {
    hour = h;
    const t = clamp01((h - 6) / 14);
    const a = Math.PI * t;
    const sx = lerp(-20, 20, t);
    const sy = Math.sin(a) * 10 - 1;
    sunMesh.position.set(sx, sy + 1, -20);
    // Licht kommt schräg von vorn, damit die Fassaden zur Kamera hell sind
    sunLight.position.set(sx * 0.8, Math.max(sy, 0.6) + 4, 12);
    sunLight.target.position.set(0, 0, 0);
    const day = smooth(5.5, 8.5, h) * (1 - smooth(18.5, 21, h));
    sunLight.intensity = 0.1 + 2.6 * day;
    hemi.intensity = 0.45 + 0.75 * day;
    // Himmel mischen
    if (h < 8) sky.copy(skyNight).lerp(skyDawn, smooth(5, 7, h)).lerp(skyDay, smooth(7, 8.5, h));
    else if (h < 17.5) sky.copy(skyDay);
    else sky.copy(skyDay).lerp(skyDusk, smooth(17.5, 19.5, h)).lerp(skyNight, smooth(19.5, 21.5, h));
    scene.fog.color.copy(sky);
    // PV glimmt bei Erzeugung
    const g = gen(h);
    pvMat.emissiveIntensity = g * 0.35;
    // Fenster abends und morgens hell
    const dark = 1 - day;
    buyerWins.forEach(m => (m.emissiveIntensity = dark * 1.4));
    farmWin.emissiveIntensity = dark * 0.9;
    // Flüsse
    const p = price(h);
    const charging = h >= 11 && h < 15 && p < 3 ? 1 : 0;
    const selling = h >= 18 && h < 21 ? 1 : 0;
    flows[0].target = g > 0.05 && !charging ? g : g * 0.25;
    flows[1].target = charging * g;
    flows[2].target = selling;
    flows[3].target = (1 - selling) * dark * 0.8;
  }

  // Füllstand vom Rechenmodell
  function setSoc(s) {
    gauge.scale.x = Math.max(0.02, s);
    gauge.position.x = -1.15 + 1.15 * Math.max(0.02, s);
    gaugeMat.color.set(selling() ? C.net : hour > 10.5 && hour < 15.5 ? C.sun : C.green);
    gaugeMat.emissive.copy(gaugeMat.color);
  }
  const selling = () => hour >= 18 && hour < 21;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const wide = w / h > 1.15;
    camera.aspect = wide ? (w * 1.24) / h : w / h;
    // Hochformat: Kamera weiter weg
    const portrait = w / h < 1;
    camera.fov = portrait ? 64 : 36;
    camera.position.set(-0.5, portrait ? 30 : 14, portrait ? 40 : 39);
    camera.lookAt(-0.5, portrait ? -7 : 2, 0);
    // Szene neben das Infofeld schieben: breit nach links, hochkant nach oben
    if (wide) camera.setViewOffset(w * 1.24, h, w * 0.24, -h * 0.03, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  let raf = 0;
  let last = performance.now();
  let running = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    flows.forEach(f => {
      f.level += ((f.target || 0) - f.level) * Math.min(1, dt * 4);
      f.mat.opacity = Math.min(1, f.level * 1.3);
      const segs = f.then ? [...f.path, null] : f.path;
      let i = 0;
      const speed = 0.28;
      for (let k = 0; k < PER * 3; k++) {
        const o = f.offsets[k];
        let pos = null;
        if (f.then) {
          // erst gemeinsamer Abschnitt, dann auf drei Häuser verteilt
          const branch = f.then[k % 3];
          const u = (o + (now / 1000) * speed) % 1;
          if (f.path.length && u < 0.5) pos = f.path[0].getPoint(u * 2);
          else pos = branch.getPoint(f.path.length ? (u - 0.5) * 2 : u);
        } else {
          if (k >= PER) {
            tmp.scale.setScalar(0);
            tmp.updateMatrix();
            f.mesh.setMatrixAt(k, tmp.matrix);
            continue;
          }
          const u = (o + (now / 1000) * speed) % 1;
          pos = f.path[0].getPoint(u);
        }
        tmp.position.copy(pos);
        tmp.scale.setScalar(f.level > 0.02 ? 0.6 + f.level * 0.6 : 0);
        tmp.updateMatrix();
        f.mesh.setMatrixAt(k, tmp.matrix);
        i++;
      }
      f.mesh.instanceMatrix.needsUpdate = true;
    });
    // ruhige Kameradrift
    v.set(Math.sin(hour * 0.25) * 0.6, 0, 0);
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !reduce ? start() : stop()));
  io.observe(canvas);
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) frame(performance.now());
  });
  ro.observe(canvas);

  resize();
  setHour(5);
  setSoc(0);

  return {
    setHour: (h, soc) => {
      setHour(h);
      setSoc(soc);
      if (!running) {
        flows.forEach(f => (f.level = f.target || 0));
        frame(performance.now());
      }
    },
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
      scene.traverse(o => {
        o.geometry?.dispose?.();
        if (o.material) [].concat(o.material).forEach(m => m.dispose());
      });
    }
  };
}
