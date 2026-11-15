// 3D-Szene „Ein Tag im Leben des Stroms“ – realistisch: physikalischer Himmel, Spiegelungen, Texturen, weiche Schatten.
// Links der Hof des Erzeugers mit PV-Dach und Freiflächenanlage, in der Mitte der Speicher-Container,
// rechts die Häuser der Stromkäufer. setHour(h, soc) stellt Sonne, Himmel, Licht, Fenster und Stromflüsse ein.
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { gen, price } from '../lib/day.js';
import { makeMaterials, pvRow, house, storageContainer, tree, pole, glowSprite } from './assets.js';

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Sonnenstand für einen Sommertag in Mitteldeutschland: Aufgang Ost, Mittag Süd (+z), Untergang West. */
function sunDirection(h, out = new THREE.Vector3()) {
  const t = (h - 5.2) / 15.6; // 5:12 bis 20:48
  const elev = Math.sin(Math.PI * t) * 60 - 4; // Grad, leicht unter Horizont an den Rändern
  const az = 100 - t * 200; // +100° (Ost) über 0° (Süd) bis −100° (West)
  out.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(az));
  return { dir: out, elev };
}

export function createEnergyScene(canvas, { small = false, hero = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance', preserveDrawingBuffer: hero });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 2000);
  const M = makeMaterials({ cheap: small });

  // Himmel (Preetham-Modell) – Hintergrund und Quelle für Spiegelungen
  const sky = new Sky();
  sky.scale.setScalar(4000);
  Object.assign(sky.material.uniforms.turbidity, { value: 6 });
  Object.assign(sky.material.uniforms.rayleigh, { value: 1.6 });
  Object.assign(sky.material.uniforms.mieCoefficient, { value: 0.004 });
  Object.assign(sky.material.uniforms.mieDirectionalG, { value: 0.82 });
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(4000);
  envSky.material.uniforms.turbidity.value = 6;
  envSky.material.uniforms.rayleigh.value = 1.6;
  envScene.add(envSky);
  let envRT = null;
  let envHour = -1;

  // Licht
  const hemi = new THREE.HemisphereLight(0xcfe2f3, 0x4a5a3a, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 35, bottom: -35, near: 1, far: 220 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog(0xb8c6d2, 180, 600);
  scene.environmentIntensity = 0.55;

  // Gelände
  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 64), M.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 5), M.gravel);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 14);
  road.receiveShadow = true;
  scene.add(road);

  // Erzeuger: Hof mit PV-Dach + Freiflächenanlage dahinter
  const farm = house(M, { w: 10, d: 16, h: 6, roof: 'red', pv: true, windows: 3 });
  farm.position.set(-20, 0, 0);
  farm.rotation.y = -Math.PI / 2;
  scene.add(farm);
  const barn = house(M, { w: 8, d: 12, h: 4.5, roof: 'dark', pv: true, wall: 'barn', windows: 1 });
  barn.position.set(-31, 0, -6);
  barn.rotation.y = -Math.PI / 2;
  scene.add(barn);
  // Freiflächenanlage hinter dem Speicher, gut sichtbar zwischen Hof und Siedlung
  for (let r = 0; r < 4; r++) {
    const row = pvRow(M, 14);
    row.position.set(-4 + (r % 2) * 1.2, 0, -12 - r * 5.6);
    scene.add(row);
  }

  // Speicher
  const container = storageContainer(M);
  container.position.set(-5, 0, 4);
  container.rotation.y = -0.15;
  scene.add(container);
  const lamp = new THREE.PointLight(0xffc86b, 0, 18, 2);
  lamp.position.set(-5, 3.6, 6.5);
  scene.add(lamp);

  // Käufer: Siedlung rechts
  const buyerSpecs = [
    [12, -4, 0.05, { w: 8, d: 10, h: 5.6, roof: 'dark' }],
    [24, -2, -0.1, { w: 9, d: 11, h: 5.8, roof: 'red', wall: 'plaster2' }],
    [16, 8, 0.12, { w: 7, d: 9, h: 5.2, roof: 'red' }],
    [29, 9, -0.05, { w: 8, d: 10, h: 5.4, roof: 'dark', wall: 'plaster2' }]
  ];
  buyerSpecs.forEach(([x, z, ry, o]) => {
    const hs = house(M, o);
    hs.position.set(x, 0, z);
    hs.rotation.y = ry;
    scene.add(hs);
  });

  // Bäume
  [
    [-36, 8, 1.2], [-10, -12, 1], [4, -14, 1.3], [8, 15, 0.9], [34, -10, 1.2], [38, 4, 1], [-28, 14, 1.1], [20, -16, 1.4], [-40, -20, 1.3]
  ].forEach(([x, z, s]) => {
    const t = tree(M, s);
    t.position.set(x, 0, z);
    scene.add(t);
  });

  // Entfernter Waldrand als Horizont (instanziert, eine Draw-Call-Gruppe je Farbe)
  {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    M.leaf.forEach((mat, ci) => {
      const count = small ? 70 : 140;
      const inst = new THREE.InstancedMesh(geo, mat, count);
      const o = new THREE.Object3D();
      let seed = 97 + ci * 31;
      const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < count; i++) {
        const a = -Math.PI * 0.95 + r() * Math.PI * 0.9; // Halbkreis hinter der Szene
        const d = 150 + r() * 70;
        const s = 5 + r() * 6;
        o.position.set(Math.cos(a) * d, s * 0.8, Math.sin(a) * d);
        o.scale.set(s, s * (1.1 + r() * 0.6), s);
        o.updateMatrix();
        inst.setMatrixAt(i, o.matrix);
      }
      scene.add(inst);
    });
  }

  // Leitungen über Holzmasten
  const poles = [
    [-12, 7], [3, 9], [10, 3]
  ].map(([x, z]) => {
    const p = pole(M, 7);
    p.position.set(x, 0, z);
    scene.add(p);
    return new THREE.Vector3(x, 6.6, z);
  });
  const P = {
    farm: new THREE.Vector3(-17, 5.2, 4),
    store: new THREE.Vector3(-5, 2.8, 4),
    b0: new THREE.Vector3(12, 4.6, 1.2),
    b1: new THREE.Vector3(24, 4.8, 3.6),
    b2: new THREE.Vector3(16, 4.2, 12.6),
    b3: new THREE.Vector3(29, 4.4, 14)
  };
  const sag = (a, b, s = 0.9) => {
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= s;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  };
  const chain = list => {
    const cp = new THREE.CurvePath();
    for (let i = 0; i < list.length - 1; i++) cp.add(sag(list[i], list[i + 1]));
    return cp;
  };
  const routes = {
    farmStore: chain([P.farm, poles[0], P.store]),
    farmGrid: chain([P.farm, poles[0], poles[1], poles[2]]),
    homes: [P.b0, P.b1, P.b2, P.b3].map(b => chain([P.store, poles[1], poles[2], b])),
    gridHomes: [P.b0, P.b1, P.b2, P.b3].map(b => chain([poles[2], b]))
  };
  const cable = new THREE.MeshBasicMaterial({ color: 0x2a2f33 });
  [routes.farmStore, routes.farmGrid, ...routes.homes].forEach(c =>
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.035, 5), cable))
  );

  // Stromfluss als leuchtende Punkte (additiv)
  const sprite = glowSprite();
  const makeFlow = (curves, color, per) => {
    const n = curves.length * per;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.PointsMaterial({
      map: sprite,
      color,
      size: small ? 1.9 : 1.6,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    return { curves, per, geo, mat, level: 0, target: 0, offsets: Float32Array.from({ length: n }, (_, i) => (i % per) / per) };
  };
  const PER = small ? 10 : 16;
  const flows = {
    direct: makeFlow([routes.farmGrid], 0xffc21a, PER),
    charge: makeFlow([routes.farmStore], 0xffc21a, PER),
    sell: makeFlow(routes.homes, 0x6ee08f, PER),
    grid: makeFlow(routes.gridHomes, 0x8fc4ff, Math.round(PER / 2))
  };

  // ---------- Zustand je Uhrzeit ----------
  let hour = 5;
  const tmpV = new THREE.Vector3();
  const warm = new THREE.Color(0xffb36b);
  const white = new THREE.Color(0xfff4e2);
  const fogDay = new THREE.Color(0xbfcfdc);
  const fogDusk = new THREE.Color(0x7a6f78);
  const fogNight = new THREE.Color(0x141c26);

  function updateEnv(h) {
    if (Math.abs(h - envHour) < 0.5 && envRT) return;
    envHour = h;
    envSky.material.uniforms.sunPosition.value.copy(sky.material.uniforms.sunPosition.value);
    envRT?.dispose();
    envRT = pmrem.fromScene(envScene, 0, 1, 4000);
    scene.environment = envRT.texture;
  }

  function setHour(h, soc) {
    hour = h;
    const { dir, elev } = sunDirection(h, tmpV);
    sky.material.uniforms.sunPosition.value.copy(dir);
    const day = smooth(-4, 8, elev);
    const low = 1 - smooth(5, 25, elev);
    sun.position.copy(dir).multiplyScalar(120);
    sun.intensity = 2.4 * day;
    sun.color.copy(white).lerp(warm, low * 0.85);
    hemi.intensity = 0.08 + 0.32 * day;
    renderer.toneMappingExposure = 0.2 + 0.22 * smooth(-6, 10, elev);
    const fog = fogDay.clone().lerp(fogDusk, low * day).lerp(fogNight, 1 - smooth(-6, 4, elev));
    scene.fog.color.copy(fog);
    updateEnv(h);

    // Fenster und Lampe: abends an
    const dark = 1 - smooth(-2, 10, elev);
    M.glass.emissiveIntensity = dark * 3.5;
    lamp.intensity = dark * 25;
    M.pv.emissiveIntensity = 0;

    // Speicher-Display
    const charging = h >= 11 && h < 15 && price(h) < 3;
    const selling = h >= 18 && h < 21;
    M.display.emissive.set(selling ? 0x8fc4ff : charging ? 0xf2b705 : 0x5fb37f);

    // Flüsse
    const g = gen(h);
    flows.direct.target = g > 0.05 && !charging ? g : g * 0.2;
    flows.charge.target = charging ? g : 0;
    flows.sell.target = selling ? 1 : 0;
    flows.grid.target = selling ? 0.15 : dark * 0.7;
    void soc;
  }

  // ---------- Kamera ----------
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    if (hero) {
      // Standbild für die Startseite: tiefer, näher, wie ein Foto vom Feldrand
      camera.fov = 30;
      camera.aspect = w / h;
      camera.position.set(14, 9.5, 62);
      camera.lookAt(-1, 2.5, -6);
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      return;
    }
    const portrait = w / h < 1;
    const wide = w / h > 1.15;
    camera.fov = portrait ? 52 : 34;
    camera.aspect = wide ? (w * 1.24) / h : w / h;
    if (portrait) {
      camera.position.set(2, 58, 104);
      camera.lookAt(-2, -12, -6);
    } else {
      camera.position.set(4, 15, 74);
      camera.lookAt(-5, 5, -10);
    }
    if (wide) camera.setViewOffset(w * 1.24, h, w * 0.24, -h * 0.02, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  // ---------- Schleife ----------
  let raf = 0;
  let last = performance.now();
  let running = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stepFlows(now, dt) {
    const t = now / 1000;
    Object.values(flows).forEach(f => {
      f.level += (f.target - f.level) * Math.min(1, dt * 3);
      f.mat.opacity = Math.min(1, f.level * 1.4);
      const arr = f.geo.attributes.position.array;
      let k = 0;
      f.curves.forEach(c => {
        for (let i = 0; i < f.per; i++) {
          const u = (f.offsets[k] + t * 0.12) % 1;
          c.getPointAt(u, tmpV);
          arr[k * 3] = tmpV.x;
          arr[k * 3 + 1] = tmpV.y;
          arr[k * 3 + 2] = tmpV.z;
          k++;
        }
      });
      f.geo.attributes.position.needsUpdate = true;
    });
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepFlows(now, dt);
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !reduce && !hero ? start() : stop()));
  io.observe(canvas);
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) frame(performance.now());
  });
  ro.observe(canvas);

  resize();
  setHour(5, 0);

  return {
    setHour(h, soc) {
      setHour(h, soc);
      if (!running) {
        Object.values(flows).forEach(f => (f.level = f.target));
        frame(performance.now());
      }
    },
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      envRT?.dispose();
      pmrem.dispose();
      renderer.dispose();
      scene.traverse(o => {
        o.geometry?.dispose?.();
        if (o.material) [].concat(o.material).forEach(m => m.dispose());
      });
    }
  };
}
