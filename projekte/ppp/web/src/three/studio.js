// Render-Studio: erzeugt freigestellte Produkt-Renderings (transparenter Hintergrund) aus denselben Modellen
// wie die Tagesgeschichte. Aufruf: /render.html?obj=pv|speicher|haus  – nur für die Entwicklung, nicht im Build.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeMaterials, pvRow, storageContainer, house } from './assets.js';

const obj = new URLSearchParams(location.search).get('obj') || 'pv';
const W = 1600;
const H = 1200;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.8;

const key = new THREE.DirectionalLight(0xfff1dc, 2.6);
key.position.set(8, 14, 10);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 60 });
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9ec4ff, 1.4);
rim.position.set(-10, 6, -10);
scene.add(rim);

// Schattenfänger: nur der Schatten bleibt sichtbar
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.35 }));
catcher.rotation.x = -Math.PI / 2;
catcher.receiveShadow = true;
scene.add(catcher);

const M = makeMaterials();
let subject;
let cam;
if (obj === 'pv') {
  subject = new THREE.Group();
  for (let r = 0; r < 2; r++) {
    const row = pvRow(M, 6);
    row.position.set(r * 0.8, 0, -r * 5);
    subject.add(row);
  }
  cam = { fov: 30, pos: [9, 6.5, 11], look: [0, 0.6, -2.4] };
} else if (obj === 'speicher') {
  subject = storageContainer(M);
  M.display.emissive.set(0xf2b705);
  cam = { fov: 30, pos: [8, 5, 10], look: [0, 1.1, 0] };
} else {
  subject = house(M, { w: 8, d: 10, h: 5.4, roof: 'red', pv: true, windows: 3 });
  subject.rotation.y = -Math.PI / 2;
  cam = { fov: 30, pos: [16, 11, 20], look: [0, 3.5, 0] };
}
scene.add(subject);

const camera = new THREE.PerspectiveCamera(cam.fov, W / H, 0.1, 200);
camera.position.set(...cam.pos);
camera.lookAt(...cam.look);
renderer.render(scene, camera);
window.__rendered = true;
