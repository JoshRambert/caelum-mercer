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
  "sync profile ok",
  "hydrate cache",
  "auth.session up",
  "build troutt",
  "build nimlo",
  "notes indexed",
  "128 items",
  "plan generated",
  "rest timer set",
  "store listing ok",
  "diff clean",
  "tests 42/42",
  "deploy staged",
  "ship it",
  "listening...",
  "commit signed",
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

const feeds = [...document.querySelectorAll(".screen-feed")];

function seedScreens() {
  feeds.forEach((feed, index) => {
    const rotated = [...terminalLines.slice(index), ...terminalLines.slice(0, index)];
    const block = Array.from({ length: 24 }, (_, i) => rotated[i % rotated.length]).join("\n");
    // Duplicated so the scroll can loop back without a visible seam.
    feed.textContent = `${block}\n${block}`;
    feed.dataset.offset = "0";
  });
}

function tickScreens() {
  feeds.forEach((feed) => {
    const lineHeight = feed.scrollHeight / (2 * 24);
    const step = lineHeight * Number(feed.dataset.speed || 1);
    const next = Number(feed.dataset.offset || 0) + step;
    const loopAt = feed.scrollHeight / 2;

    if (next >= loopAt) {
      feed.style.transition = "none";
      feed.style.transform = "translateY(0)";
      feed.dataset.offset = "0";
      requestAnimationFrame(() => {
        feed.style.transition = "";
      });
      return;
    }

    feed.dataset.offset = String(next);
    feed.style.transform = `translateY(-${next}px)`;
  });
}

seedScreens();
if (!reduceMotion) {
  setInterval(tickScreens, 1800);
}
window.addEventListener("resize", seedScreens);

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
