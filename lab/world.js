/**
 * 3D cabin tuned to the painted lab stills:
 * window left, Caelum at the desk, monitors right, cool screens / warm moon-or-sun.
 */

import * as THREE from "three";
import { createScrollingFeed, paintWideConsole, paintSideConsole } from "./feeds.js";

const loader = new THREE.TextureLoader();

function loadMap(url, { repeat = [1, 1], wrap = true } = {}) {
  const map = loader.load(url);
  map.colorSpace = THREE.SRGBColorSpace;
  if (wrap) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeat[0], repeat[1]);
  }
  return map;
}

function woodMat(map, extra = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0.02,
    ...extra,
  });
}

function leatherMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x1a120e,
    roughness: 0.62,
    metalness: 0.04,
  });
}

function addChair(parent, x, z, rotY) {
  const leather = leatherMat();
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.7), leather);
  seat.position.set(0, 0.46, 0.04);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.78, 0.16), leather);
  back.position.set(0, 0.9, -0.28);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.62), leather);
  armL.position.set(-0.32, 0.62, 0.02);
  const armR = armL.clone();
  armR.position.x = 0.32;
  group.add(seat, back, armL, armR);
  parent.add(group);
  group.userData.kind = "hotspot";
  group.userData.label = "the thinking chair";
  return group;
}

function addPlant(parent, x, z, scale = 1) {
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.09, 0.14, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.8 })
  );
  pot.position.set(x, 0.08 * scale, z);
  pot.scale.setScalar(scale);
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a5a34, roughness: 0.75 })
  );
  leaf.position.set(x, 0.3 * scale, z);
  leaf.scale.set(scale, 1.2 * scale, 0.85 * scale);
  parent.add(pot, leaf);
}

function addCaelum(parent, maps) {
  const aspect = 671 / 1457;
  const height = 1.82;
  const width = height * aspect;
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshBasicMaterial({
    map: maps.night,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0.42, height / 2, 0.08);
  mesh.rotation.y = 0.28;
  parent.add(mesh);
  mesh.userData.setSky = (day) => {
    mat.map = day ? maps.day : maps.night;
    mat.needsUpdate = true;
  };
  return mesh;
}

function addWorkstation(parent) {
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x2a3036,
    roughness: 0.42,
    metalness: 0.38,
  });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.1, 1.22), deskMat);
  desk.position.set(0.95, 0.76, 0.32);
  parent.add(desk);
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.12, 1.18),
    new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.7, metalness: 0.2 })
  );
  apron.position.set(0.95, 0.68, 0.32);
  parent.add(apron);
  for (const [dx, dz] of [
    [-1.05, 0.42],
    [1.05, 0.42],
    [-1.05, -0.38],
    [1.05, -0.38],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.66, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.65, metalness: 0.25 })
    );
    leg.position.set(0.95 + dx, 0.33, 0.32 + dz);
    parent.add(leg);
  }

  const book = new THREE.Group();
  book.position.set(0.12, 0.84, 0.42);
  book.rotation.y = -0.4;
  const pageL = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.018, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.85 })
  );
  pageL.position.set(-0.17, 0, 0);
  pageL.rotation.z = 0.1;
  const pageR = pageL.clone();
  pageR.position.set(0.17, 0, 0);
  pageR.rotation.z = -0.08;
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.014, 0.48),
    new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.8 })
  );
  cover.position.set(0, -0.012, 0);
  book.add(pageL, pageR, cover);
  parent.add(book);
  const bookHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.16, 0.52),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  bookHit.position.copy(book.position);
  bookHit.position.y += 0.04;
  bookHit.userData.product = "troutt";
  bookHit.userData.plain = true;
  parent.add(bookHit);

  const puck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.04, 20),
    new THREE.MeshStandardMaterial({ color: 0x0e1014, roughness: 0.35, metalness: 0.6 })
  );
  puck.position.set(1.12, 0.83, 0.38);
  parent.add(puck);

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.7, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x4ec8ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beam.position.set(1.12, 1.18, 0.38);
  beam.rotation.x = Math.PI;
  parent.add(beam);

  const holo = new THREE.Group();
  holo.position.set(1.12, 1.4, 0.38);
  parent.add(holo);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.54),
    new THREE.MeshBasicMaterial({ color: 0x04121c, transparent: true, opacity: 0.94 })
  );
  holo.add(plate);
  loader.load("images/nimlo-home.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    plate.material.map = tex;
    plate.material.needsUpdate = true;
  });
  const holoHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.6, 0.12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  holoHit.position.copy(holo.position);
  holoHit.userData.product = "nimlo";
  holoHit.userData.plain = false;
  parent.add(holoHit);

  const wallX = 3.48;
  const wallZ = -0.1;
  const bezel = new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.55, metalness: 0.3 });
  const feeds = [];
  const small = [
    [-0.62, 2.26, 0.82],
    [0.0, 2.3, 0.9],
    [0.64, 2.34, 0.98],
    [-0.62, 1.86, 0.88],
    [0.0, 1.88, 0.96],
    [0.64, 1.9, 1.05],
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

  const wide = new THREE.Mesh(
    new THREE.PlaneGeometry(1.72, 0.62),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(paintWideConsole()) })
  );
  wide.position.set(wallX, 1.4, wallZ);
  wide.rotation.y = -Math.PI / 2;
  parent.add(wide);
  const wideFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 1.82), bezel);
  wideFrame.position.set(wallX + 0.03, 1.4, wallZ);
  parent.add(wideFrame);

  const side = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.48),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(paintSideConsole()) })
  );
  side.position.set(3.1, 1.12, 1.12);
  side.rotation.y = -Math.PI / 2.5;
  parent.add(side);

  return {
    feeds,
    pickables: [bookHit, holoHit],
    anchors: { notebook: book, hologram: holo },
    holo,
  };
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0d12, 0.045);

  const wood = loadMap("images/wood.jpg?v=3", { repeat: [1.6, 2.2] });
  const floorMap = loadMap("images/floor.jpg?v=3", { repeat: [2.4, 1.8] });
  const forestDay = loadMap("images/forest-day.jpg?v=2", { wrap: false });
  const forestNight = loadMap("images/forest-night.jpg?v=2", { wrap: false });
  const caelumDay = loadMap("images/caelum-day.png?v=2", { wrap: false });
  const caelumNight = loadMap("images/caelum-night.png?v=2", { wrap: false });

  const ambient = new THREE.AmbientLight(0x6a6258, 0.45);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xc9d2dc, 0x2a2218, 0.85);
  scene.add(hemi);
  const windowLight = new THREE.DirectionalLight(0xcfe6ff, 0.85);
  windowLight.position.set(-5.5, 3.4, 0.8);
  scene.add(windowLight);
  const bounce = new THREE.DirectionalLight(0x8a7a64, 0.45);
  bounce.position.set(1.2, 2.4, 4);
  scene.add(bounce);
  const screenFill = new THREE.DirectionalLight(0x5ec8e8, 0.55);
  screenFill.position.set(4.2, 2.2, 0.2);
  scene.add(screenFill);
  const holoLight = new THREE.PointLight(0x4ec8ff, 1.2, 3.4);
  holoLight.position.set(1.12, 1.25, 0.38);
  scene.add(holoLight);
  const moonFill = new THREE.PointLight(0xd6e8ff, 1.1, 8);
  moonFill.position.set(-3.6, 2.2, 0.2);
  scene.add(moonFill);

  const root = new THREE.Group();
  scene.add(root);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.08, 8.2), woodMat(floorMap, { roughness: 0.82 }));
  floor.position.y = -0.04;
  root.add(floor);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.012, 2.35),
    new THREE.MeshBasicMaterial({ color: 0x2ad0ff })
  );
  strip.position.set(0.75, 0.008, 0.22);
  root.add(strip);
  const stripInner = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.014, 2.18), woodMat(floorMap));
  stripInner.position.set(0.75, 0.01, 0.22);
  root.add(stripInner);

  const back = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.4, 0.28), woodMat(wood, { color: 0xc4b09a }));
  back.position.set(-0.1, 1.7, -3.55);
  root.add(back);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 8.1), woodMat(wood, { color: 0xb8a488 }));
  right.position.set(3.82, 1.7, 0);
  root.add(right);

  // Left wall with a punched window opening.
  const leftMat = woodMat(wood, { color: 0xb8a488 });
  const leftBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 2.15), leftMat);
  leftBack.position.set(-4.55, 1.7, -2.55);
  const leftFront = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 2.05), leftMat);
  leftFront.position.set(-4.55, 1.7, 2.55);
  const leftSill = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 3.1), leftMat);
  leftSill.position.set(-4.55, 0.36, 0.05);
  const leftHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.7, 3.1), leftMat);
  leftHead.position.set(-4.55, 3.05, 0.05);
  root.add(leftBack, leftFront, leftSill, leftHead);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 8.2), woodMat(wood, { color: 0x9a866c }));
  ceiling.position.y = 3.38;
  root.add(ceiling);
  for (const z of [-2.15, 0.05, 2.2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.18, 0.24), woodMat(wood, { color: 0x8a7460 }));
    beam.position.set(-0.15, 3.22, z);
    root.add(beam);
  }

  const forest = new THREE.Mesh(
    new THREE.PlaneGeometry(3.05, 2.05),
    new THREE.MeshBasicMaterial({ map: forestNight })
  );
  forest.position.set(-4.85, 1.72, 0.05);
  forest.rotation.y = Math.PI / 2;
  root.add(forest);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.85 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.12), frameMat);
  top.position.set(-4.4, 2.76, 0.05);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.12), frameMat);
  bot.position.set(-4.4, 0.68, 0.05);
  const jamL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.18, 0.1), frameMat);
  jamL.position.set(-4.4, 1.72, 1.56);
  const jamR = jamL.clone();
  jamR.position.z = -1.46;
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.08, 0.06), frameMat);
  mullion.position.set(-4.4, 1.72, 0.05);
  root.add(top, bot, jamL, jamR, mullion);

  addPlant(root, -3.35, 1.55, 1.05);
  addPlant(root, -3.15, -1.35, 0.8);
  addPlant(root, 2.35, 2.15, 0.7);
  const chair = addChair(root, -2.55, 0.55, 0.55);

  const printer = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.26, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x2a3036, roughness: 0.5, metalness: 0.35 })
  );
  printer.position.set(-3.15, 0.5, -1.05);
  printer.userData.kind = "hotspot";
  printer.userData.label = "3D printer — idle";
  root.add(printer);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.34), woodMat(wood));
  stand.position.set(-3.15, 0.18, -1.05);
  root.add(stand);

  const sofa = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.4, 0.72), leatherMat());
  sofa.position.set(2.35, 0.26, 2.75);
  sofa.rotation.y = -0.38;
  root.add(sofa);

  const caelum = addCaelum(root, { day: caelumDay, night: caelumNight });
  const station = addWorkstation(root);

  const windowHot = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 2.1, 3.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  windowHot.position.set(-4.4, 1.7, 0.05);
  windowHot.userData.kind = "hotspot";
  windowHot.userData.label = "the forest keeps time";
  root.add(windowHot);

  function setSky(day) {
    scene.background = new THREE.Color(day ? 0x16120e : 0x07080c);
    scene.fog.color.set(day ? 0x16120e : 0x07080c);
    forest.material.map = day ? forestDay : forestNight;
    forest.material.needsUpdate = true;
    caelum.userData.setSky(day);
    windowLight.color.set(day ? 0xffd48a : 0xcfe6ff);
    windowLight.intensity = day ? 1.45 : 0.7;
    hemi.intensity = day ? 1.05 : 0.7;
    bounce.intensity = day ? 0.55 : 0.32;
    screenFill.intensity = day ? 0.32 : 0.62;
    holoLight.intensity = day ? 0.95 : 1.45;
    moonFill.color.set(day ? 0xffe0a8 : 0xd6e8ff);
    moonFill.intensity = day ? 1.4 : 1.0;
    ambient.intensity = day ? 0.55 : 0.4;
  }

  function tick(dt, time, reduceMotion) {
    station.feeds.forEach(({ feed, tex }) => {
      feed.tick(dt);
      tex.needsUpdate = true;
    });
    if (!reduceMotion) {
      station.holo.position.y = 1.4 + Math.sin(time * 1.4) * 0.025;
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
