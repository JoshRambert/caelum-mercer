/**
 * Stylized 3D cabin — logs, desk, Caelum, live terminals.
 * Animated look (toon materials), not photoreal.
 */

import * as THREE from "three";
import { createScrollingFeed, paintWideConsole, paintSideConsole } from "./feeds.js";

function toon(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, ...extra });
}

function makeForest(day) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  const sky = day
    ? ctx.createLinearGradient(0, 0, 0, 640)
    : ctx.createLinearGradient(0, 0, 0, 640);
  if (day) {
    sky.addColorStop(0, "#f3c57a");
    sky.addColorStop(0.45, "#e8a45a");
    sky.addColorStop(1, "#3d5a3a");
  } else {
    sky.addColorStop(0, "#0b1730");
    sky.addColorStop(0.5, "#12203a");
    sky.addColorStop(1, "#071018");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 640);

  if (day) {
    ctx.fillStyle = "#ffe7a8";
    ctx.beginPath();
    ctx.arc(220, 150, 54, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#e8f2ff";
    ctx.beginPath();
    ctx.arc(240, 120, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b1730";
    ctx.beginPath();
    ctx.arc(252, 112, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 28; i += 1) {
    const x = i * 42 - 20;
    const h = 220 + ((i * 47) % 160);
    ctx.fillStyle = day ? "#1c3320" : "#0a1410";
    ctx.beginPath();
    ctx.moveTo(x, 640);
    ctx.lineTo(x + 28, 640 - h);
    ctx.lineTo(x + 56, 640);
    ctx.fill();
    ctx.fillStyle = day ? "#142418" : "#07100c";
    ctx.fillRect(x + 24, 640 - h * 0.35, 8, h * 0.35);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addLogs(parent, { axis, length, count, start, along, lift = 0.22 }) {
  const wood = [0x2a1c14, 0x241812, 0x311f16, 0x1c1410];
  for (let i = 0; i < count; i += 1) {
    const geo = new THREE.CylinderGeometry(0.14, 0.15, length, 8);
    const mesh = new THREE.Mesh(geo, toon(wood[i % wood.length]));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (axis === "z") {
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(start.x, start.y + i * lift, start.z);
    } else {
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(start.x, start.y + i * lift, start.z);
    }
    if (along) mesh.position.add(along);
    parent.add(mesh);
  }
}

function addPlant(parent, x, z, scale = 1) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.14, 8), toon(0x3a2418));
  pot.position.set(x, 0.07 * scale, z);
  pot.scale.setScalar(scale);
  parent.add(pot);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), toon(0x2f6a3c));
  leaf.position.set(x, 0.32 * scale, z);
  leaf.scale.set(1 * scale, 1.15 * scale, 0.85 * scale);
  parent.add(leaf);
}

function addChair(parent, x, z, rotY) {
  const leather = toon(0x1a120e);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), leather);
  seat.position.set(0, 0.48, 0);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.1), leather);
  back.position.set(0, 0.86, -0.26);
  group.add(seat, back);
  parent.add(group);
  group.userData.kind = "hotspot";
  group.userData.label = "the thinking chair";
  return group;
}

function addCaelum(parent) {
  const group = new THREE.Group();
  group.position.set(0.55, 0, 0.15);
  group.rotation.y = -Math.PI / 2 + 0.4;
  parent.add(group);

  const skin = toon(0x3b2418);
  const robe = toon(0x16161a);
  const hair = toon(0x0c0a09);

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.7, 8), robe);
  legs.position.set(0, 0.42, 0);
  group.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.62, 10), robe);
  torso.position.set(0, 1.02, 0);
  group.add(torso);

  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.15, 10, 1, true), robe);
  cloak.position.set(0, 0.78, -0.02);
  group.add(cloak);

  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.06, 8, 14, Math.PI), robe);
  hood.position.set(0, 1.32, -0.08);
  hood.rotation.x = 0.4;
  group.add(hood);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 8), skin);
  neck.position.set(0, 1.38, 0.02);
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), skin);
  head.position.set(0, 1.54, 0.03);
  head.scale.set(0.92, 1.05, 0.95);
  group.add(head);

  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), toon(0x1a1210));
  beard.position.set(0.02, 1.46, 0.1);
  beard.scale.set(0.85, 0.55, 0.7);
  group.add(beard);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skin);
    ear.position.set(0.11 * side, 1.54, 0.02);
    ear.scale.set(0.55, 1, 0.8);
    group.add(ear);
  }

  const glass = toon(0x111216, { transparent: true, opacity: 0.35 });
  const rim = toon(0xc8c2b4);
  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.032, 12), glass);
    lens.position.set(0.038 * side, 1.545, 0.12);
    group.add(lens);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.004, 6, 12), rim);
    ring.position.copy(lens.position);
    group.add(ring);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), rim);
  bridge.position.set(0, 1.545, 0.12);
  group.add(bridge);

  const locs = new THREE.Group();
  locs.position.set(0, 1.6, 0.01);
  group.add(locs);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), hair);
  cap.position.set(0, 0.03, -0.02);
  cap.scale.set(1.05, 0.62, 1.05);
  locs.add(cap);
  for (let i = 0; i < 56; i += 1) {
    const len = 0.2 + (i % 7) * 0.026;
    const loc = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, len, 5), hair);
    const theta = (i / 56) * Math.PI * 1.7 - 0.2;
    const side = Math.sin(theta);
    loc.position.set(side * 0.08, -len * 0.18, -0.04 + Math.cos(theta) * 0.06);
    loc.rotation.z = side * 0.55;
    loc.rotation.x = 1.05;
    locs.add(loc);
  }

  const armR = new THREE.Group();
  armR.position.set(0.16, 1.16, 0.06);
  armR.rotation.set(1.05, 0.15, 0.85);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.46, 8), robe);
  sleeve.position.set(0, -0.2, 0);
  armR.add(sleeve);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), skin);
  hand.position.set(0, -0.44, 0);
  armR.add(hand);
  group.add(armR);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.42, 8), robe);
  armL.position.set(-0.2, 1.02, 0.02);
  armL.rotation.z = 0.25;
  group.add(armL);

  group.userData.breath = torso;
  return group;
}

function addWorkstation(parent) {
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 1.15), toon(0x2c3138));
  desk.position.set(0.85, 0.78, 0.35);
  desk.castShadow = true;
  desk.receiveShadow = true;
  parent.add(desk);
  for (const x of [-0.85, 0.85]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.08), toon(0x1b1e22));
    leg.position.set(0.85 + x, 0.37, 0.7);
    parent.add(leg);
    const legB = leg.clone();
    legB.position.z = 0.0;
    parent.add(legB);
  }

  const book = new THREE.Group();
  book.position.set(0.15, 0.84, 0.45);
  book.rotation.y = -0.35;
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.42), toon(0xd8c9a8));
  pageL.position.set(-0.16, 0, 0);
  pageL.rotation.z = 0.12;
  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.42), toon(0xe4d6b4));
  pageR.position.set(0.16, 0, 0);
  pageR.rotation.z = -0.1;
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.015, 0.46), toon(0x3a2214));
  cover.position.set(0, -0.012, 0);
  book.add(pageL, pageR, cover);
  parent.add(book);
  const bookHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.16, 0.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  bookHit.position.copy(book.position);
  bookHit.position.y += 0.04;
  bookHit.userData.product = "troutt";
  bookHit.userData.plain = true;
  bookHit.userData.anchor = "notebook";
  parent.add(bookHit);

  const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.04, 16), toon(0x111318));
  puck.position.set(1.05, 0.84, 0.4);
  parent.add(puck);

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.72, 10, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x4ec8ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beam.position.set(1.05, 1.2, 0.4);
  beam.rotation.x = Math.PI;
  parent.add(beam);

  const holo = new THREE.Group();
  holo.position.set(1.05, 1.42, 0.4);
  parent.add(holo);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.58),
    new THREE.MeshBasicMaterial({ color: 0x04121c, transparent: true, opacity: 0.92 })
  );
  holo.add(plate);
  const loader = new THREE.TextureLoader();
  loader.load("images/nimlo-home.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    plate.material.map = tex;
    plate.material.needsUpdate = true;
  });
  const holoHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.64, 0.12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  holoHit.position.copy(holo.position);
  holoHit.userData.product = "nimlo";
  holoHit.userData.plain = false;
  holoHit.userData.anchor = "hologram";
  parent.add(holoHit);

  const wallX = 3.55;
  const wallZ = -0.15;
  const bezel = toon(0x12151a);
  const feeds = [];

  const small = [
    [-0.62, 2.28, 0.82],
    [0.0, 2.32, 0.9],
    [0.64, 2.36, 0.98],
    [-0.62, 1.88, 0.88],
    [0.0, 1.9, 0.96],
    [0.64, 1.92, 1.05],
  ];
  small.forEach(([sx, sy, speed], i) => {
    const feed = createScrollingFeed(i, speed);
    const tex = new THREE.CanvasTexture(feed.canvas);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.34),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    screen.position.set(wallX, sy, wallZ + sx);
    screen.rotation.y = -Math.PI / 2;
    parent.add(screen);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.5), bezel);
    frame.position.set(wallX + 0.03, sy, wallZ + sx);
    parent.add(frame);
    feeds.push({ feed, tex });
  });

  const wideCanvas = paintWideConsole();
  const wideTex = new THREE.CanvasTexture(wideCanvas);
  const wide = new THREE.Mesh(
    new THREE.PlaneGeometry(1.72, 0.62),
    new THREE.MeshBasicMaterial({ map: wideTex })
  );
  wide.position.set(wallX, 1.42, wallZ);
  wide.rotation.y = -Math.PI / 2;
  parent.add(wide);
  const wideFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 1.82), bezel);
  wideFrame.position.set(wallX + 0.03, 1.42, wallZ);
  parent.add(wideFrame);

  const sideCanvas = paintSideConsole();
  const sideTex = new THREE.CanvasTexture(sideCanvas);
  const side = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.48),
    new THREE.MeshBasicMaterial({ map: sideTex })
  );
  side.position.set(3.15, 1.15, 1.15);
  side.rotation.y = -Math.PI / 2.6;
  parent.add(side);

  return {
    feeds,
    pickables: [bookHit, holoHit],
    anchors: {
      notebook: book,
      hologram: holo,
    },
    holo,
  };
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0c10, 9, 16);

  const hemi = new THREE.HemisphereLight(0xc9d6e8, 0x1a120c, 0.75);
  scene.add(hemi);
  const windowLight = new THREE.DirectionalLight(0xffe0a8, 1.55);
  windowLight.position.set(-6, 4.2, 1.2);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(1024, 1024);
  scene.add(windowLight);
  const fill = new THREE.DirectionalLight(0x7ec8ff, 0.35);
  fill.position.set(4, 3, 2);
  scene.add(fill);
  const holoLight = new THREE.PointLight(0x4ec8ff, 1.4, 3.2);
  holoLight.position.set(1.05, 1.3, 0.4);
  scene.add(holoLight);

  const root = new THREE.Group();
  scene.add(root);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.08, 8), toon(0x1a1410));
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  root.add(floor);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.015, 2.2),
    new THREE.MeshBasicMaterial({ color: 0x2ad0ff })
  );
  strip.position.set(0.7, 0.01, 0.2);
  root.add(strip);
  const stripInner = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.016, 2.0), toon(0x1a1410));
  stripInner.position.set(0.7, 0.012, 0.2);
  root.add(stripInner);

  addLogs(root, { axis: "z", length: 2.0, count: 14, start: { x: -4.6, y: 0.2, z: 2.7 } });
  addLogs(root, { axis: "z", length: 2.0, count: 14, start: { x: -4.6, y: 0.2, z: -2.4 } });
  addLogs(root, { axis: "z", length: 7.4, count: 3, start: { x: -4.6, y: 0.2, z: 0 } });
  addLogs(root, { axis: "z", length: 7.4, count: 3, start: { x: -4.6, y: 2.85, z: 0 } });
  addLogs(root, { axis: "z", length: 7.4, count: 14, start: { x: 3.85, y: 0.2, z: 0 } });
  addLogs(root, { axis: "x", length: 8.6, count: 14, start: { x: -0.3, y: 0.2, z: -3.5 } });

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(10, 0.08, 8), toon(0x201610));
  ceiling.position.y = 3.35;
  root.add(ceiling);
  for (const z of [-2.2, 0, 2.2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.16, 0.22), toon(0x2a1c14));
    beam.position.set(-0.2, 3.2, z);
    root.add(beam);
  }

  const forestDay = makeForest(true);
  const forestNight = makeForest(false);
  const forest = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4.2),
    new THREE.MeshBasicMaterial({ map: forestDay })
  );
  forest.position.set(-6.2, 1.7, 0.2);
  forest.rotation.y = Math.PI / 2;
  root.add(forest);

  const frameMat = toon(0x1c1410);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 3.5), frameMat);
  top.position.set(-4.48, 2.92, 0.15);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 3.5), frameMat);
  bot.position.set(-4.48, 0.48, 0.15);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.56, 0.12), frameMat);
  left.position.set(-4.48, 1.7, 1.84);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.56, 0.12), frameMat);
  right.position.set(-4.48, 1.7, -1.54);
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.44, 0.06), frameMat);
  mullion.position.set(-4.48, 1.7, 0.15);
  root.add(top, bot, left, right, mullion);

  addPlant(root, -3.4, 1.6, 1.1);
  addPlant(root, -3.1, -1.4, 0.85);
  addPlant(root, 2.4, 2.2, 0.7);
  const chair = addChair(root, -2.6, 0.6, 0.6);
  const printer = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.28), toon(0x2a3036));
  printer.position.set(-3.2, 0.5, -1.1);
  printer.userData.kind = "hotspot";
  printer.userData.label = "3D printer — idle";
  root.add(printer);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.36, 0.36), toon(0x2a1c14));
  stand.position.set(-3.2, 0.18, -1.1);
  root.add(stand);

  const sofa = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.42, 0.7), toon(0x1a120e));
  sofa.position.set(2.4, 0.28, 2.8);
  sofa.rotation.y = -0.4;
  root.add(sofa);

  const caelum = addCaelum(root);
  const station = addWorkstation(root);

  const windowHot = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 2.2, 3.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  windowHot.position.set(-4.4, 1.7, 0.15);
  windowHot.userData.kind = "hotspot";
  windowHot.userData.label = "the forest keeps time";
  root.add(windowHot);

  function setSky(day) {
    scene.background = new THREE.Color(day ? 0x1c1610 : 0x07080c);
    scene.fog.color.set(day ? 0x1c1610 : 0x07080c);
    forest.material.map = day ? forestDay : forestNight;
    forest.material.needsUpdate = true;
    windowLight.color.set(day ? 0xffe0a8 : 0xcfe6ff);
    windowLight.intensity = day ? 1.2 : 0.45;
    hemi.intensity = day ? 0.7 : 0.32;
    fill.intensity = day ? 0.22 : 0.55;
    holoLight.intensity = day ? 1.1 : 1.8;
  }

  function tick(dt, time, reduceMotion) {
    station.feeds.forEach(({ feed, tex }) => {
      feed.tick(dt);
      tex.needsUpdate = true;
    });
    if (!reduceMotion) {
      station.holo.position.y = 1.42 + Math.sin(time * 1.4) * 0.03;
      caelum.userData.breath.scale.y = 1 + Math.sin(time * 1.6) * 0.015;
    }
  }

  return {
    scene,
    setSky,
    tick,
    pickables: [...station.pickables, chair, printer, windowHot],
    anchors: station.anchors,
  };
}
