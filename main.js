/**
 * Caelum Mercer — 3D cabin runtime
 */

import * as THREE from "three";
import { createWorld } from "./lab/world.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const inspector = document.getElementById("inspector");
const inspectorBody = document.getElementById("inspector-body");
const host = document.getElementById("lab-scene");
const canvas = document.getElementById("lab-canvas");
const toast = document.getElementById("lab-toast");

function isDaylight(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= 6.5 && hour < 18.5;
}

function applySkyMeta(day) {
  root.dataset.sky = day ? "day" : "night";
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    day ? "#c9b48a" : "#0A0A0B"
  );
}

applySkyMeta(isDaylight());

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
const home = new THREE.Vector3(-1.15, 1.72, 5.6);
const focus = new THREE.Vector3(0.15, 1.2, 0.1);
camera.position.copy(home);
camera.lookAt(focus);

const world = createWorld();
world.setSky(isDaylight());
setInterval(() => {
  const day = isDaylight();
  applySkyMeta(day);
  world.setSky(day);
}, 60_000);

const look = { x: 0, y: 0, tx: 0, ty: 0 };
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const labelEls = {
  notebook: document.querySelector('[data-anchor="notebook"]'),
  hologram: document.querySelector('[data-anchor="hologram"]'),
};
const ndc = new THREE.Vector3();

function resize() {
  const w = host.clientWidth;
  const h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
}

function projectAnchor(object, el) {
  if (!object || !el) return;
  object.getWorldPosition(ndc);
  ndc.project(camera);
  if (ndc.z > 1) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const x = (ndc.x * 0.5 + 0.5) * host.clientWidth;
  const y = (-ndc.y * 0.5 + 0.5) * host.clientHeight;
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -120%)`;
}

function setPointerFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(world.pickables, true);
  return hits[0]?.object;
}

function findInteractive(object) {
  let node = object;
  while (node) {
    if (node.userData?.product || node.userData?.kind === "hotspot") return node;
    node = node.parent;
  }
  return null;
}

function openProduct(name, { plain = false } = {}) {
  const template = document.getElementById(`product-${name}`);
  if (!template || !inspector) return;
  inspectorBody.replaceChildren(template.content.cloneNode(true));
  inspector.classList.toggle("sheet--plain", plain);
  inspector.showModal();
}

function launchHologram() {
  const el = labelEls.hologram;
  if (!el) return Promise.resolve();
  const from = el.getBoundingClientRect();
  const clone = document.createElement("div");
  clone.className = "hologram-fly";
  clone.style.left = `${from.left}px`;
  clone.style.top = `${from.top}px`;
  clone.style.width = `${Math.max(from.width, 72)}px`;
  clone.style.height = `${Math.max(from.height * 3.2, 160)}px`;
  const img = document.createElement("img");
  img.src = "images/nimlo-home.jpg";
  img.alt = "";
  clone.appendChild(img);
  document.body.appendChild(clone);

  const grow = Math.min(
    (window.innerHeight * 0.62) / Math.max(from.height * 3.2, 160),
    (window.innerWidth * 0.55) / Math.max(from.width, 72)
  );
  const dx = window.innerWidth / 2 - (from.left + from.width / 2);
  const dy = window.innerHeight / 2 - (from.top + from.height / 2);

  return clone
    .animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        { transform: `translate(${dx}px, ${dy}px) scale(${grow})`, opacity: 1, offset: 0.62, easing: "ease-in" },
        { transform: `translate(${dx}px, ${dy}px) scale(${grow * 1.1})`, opacity: 0 },
      ],
      { duration: 620, easing: "linear" }
    )
    .finished.catch(() => {})
    .then(() => clone.remove());
}

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.dataset.show = "1";
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.dataset.show = "0";
  }, 1600);
}

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.open)?.showModal();
  });
});

Object.values(labelEls).forEach((el) => {
  el?.addEventListener("click", () => {
    const product = el.dataset.product;
    if (product === "nimlo" && !reduceMotion) {
      const flight = launchHologram();
      setTimeout(() => openProduct("nimlo"), 400);
      flight.then(() => {});
      return;
    }
    openProduct(product, { plain: true });
  });
});

canvas.addEventListener("pointermove", (event) => {
  if (!reduceMotion) {
    look.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    look.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  }
  setPointerFromEvent(event);
  const hit = findInteractive(pick());
  canvas.style.cursor = hit ? "pointer" : "default";
});

canvas.addEventListener("click", (event) => {
  setPointerFromEvent(event);
  const hit = findInteractive(pick());
  if (!hit) return;
  if (hit.userData.product === "nimlo" && !reduceMotion) {
    const flight = launchHologram();
    setTimeout(() => openProduct("nimlo"), 400);
    flight.then(() => {});
    return;
  }
  if (hit.userData.product) {
    openProduct(hit.userData.product, { plain: Boolean(hit.userData.plain) });
    return;
  }
  if (hit.userData.label) showToast(hit.userData.label);
});

const SHEET_FADE_MS = 240;

function dismiss(dialog) {
  if (reduceMotion || dialog.classList.contains("is-closing")) {
    dialog.close();
    return;
  }
  dialog.classList.add("is-closing");
  setTimeout(() => {
    dialog.classList.remove("is-closing");
    dialog.close();
  }, SHEET_FADE_MS);
}

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dismiss(dialog);
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dismiss(dialog);
  });
  dialog.querySelector("form[method='dialog']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    dismiss(dialog);
  });
});

window.addEventListener("resize", resize);
resize();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  look.x += (look.tx - look.x) * 0.06;
  look.y += (look.ty - look.y) * 0.06;
  camera.position.set(home.x + look.x * 0.55, home.y + look.y * -0.18, home.z);
  camera.lookAt(focus.x + look.x * 0.35, focus.y + look.y * -0.12, focus.z);
  world.tick(dt, now / 1000, reduceMotion);
  projectAnchor(world.anchors.notebook, labelEls.notebook);
  projectAnchor(world.anchors.hologram, labelEls.hologram);
  renderer.render(world.scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
