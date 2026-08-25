/**
 * Caelum Mercer — lab runtime
 * Local sun/moon, desk holograms, live terminals, light parallax
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const inspector = document.getElementById("inspector");
const inspectorBody = document.getElementById("inspector-body");
const scene = document.getElementById("lab-scene");

const terminalLines = [
  "sync profile · ok",
  "hydrate SwiftData cache",
  "listen auth.session",
  "compile hologram mesh",
  "route /troutt → live",
  "route /nimlo → live",
  "push store listing",
  "await next session",
  "lock workout until rest",
  "index notes · 128",
  "search completed elements",
  "ping betterapps@",
  "render nebula grain",
  "keep the desk quiet",
];

function isDaylight(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= 6.5 && hour < 18.5;
}

function applySky() {
  const sky = isDaylight() ? "day" : "night";
  root.dataset.sky = sky;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    sky === "day" ? "#c9b48a" : "#0A0A0B"
  );
}

applySky();
setInterval(() => applySky(), 60_000);

function seedTerminals() {
  document.querySelectorAll(".terminal-feed").forEach((feed, index) => {
    const rotated = [...terminalLines.slice(index), ...terminalLines.slice(0, index)];
    const block = Array.from({ length: 18 }, (_, i) => rotated[i % rotated.length]).join("\n");
    feed.textContent = `${block}\n${block}`;
    feed.dataset.offset = "0";
  });
}

function tickTerminals() {
  document.querySelectorAll(".terminal").forEach((screen) => {
    const feed = screen.querySelector(".terminal-feed");
    if (!feed) return;
    const line = 8 * Number(screen.dataset.speed || 1);
    const next = Number(feed.dataset.offset || 0) + line;
    const resetAt = feed.scrollHeight / 2;
    const offset = next >= resetAt ? 0 : next;
    feed.dataset.offset = String(offset);
    feed.style.transform = `translateY(-${offset}px)`;
  });
}

seedTerminals();
if (!reduceMotion) {
  tickTerminals();
  setInterval(tickTerminals, 2400);
}

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.open)?.showModal();
  });
});

document.querySelectorAll(".hologram").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.product;
    const template = document.getElementById(`product-${id}`);
    if (!template || !inspector) return;
    inspectorBody.replaceChildren(template.content.cloneNode(true));
    inspector.showModal();
  });
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

if (!reduceMotion && scene) {
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * -10;
    const y = (event.clientY / window.innerHeight - 0.5) * -6;
    scene.style.setProperty("--px", `${x}px`);
    scene.style.setProperty("--py", `${y}px`);
  });
}
