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

/**
 * Lifts a copy of the tapped hologram off the desk, flies it to the middle of
 * the screen and grows it, so the detail sheet reads as that same panel opening
 * up rather than an unrelated modal.
 */
function launchHologram(button) {
  const plate = button.querySelector(".hologram-plate");
  if (!plate) return Promise.resolve();

  const from = plate.getBoundingClientRect();
  const clone = plate.cloneNode(true);
  clone.className = "hologram-fly";
  clone.style.left = `${from.left}px`;
  clone.style.top = `${from.top}px`;
  clone.style.width = `${from.width}px`;
  clone.style.height = `${from.height}px`;
  document.body.appendChild(clone);
  button.classList.add("is-launching");

  const grow = Math.min(
    (window.innerHeight * 0.62) / from.height,
    (window.innerWidth * 0.55) / from.width
  );
  const dx = window.innerWidth / 2 - (from.left + from.width / 2);
  const dy = window.innerHeight / 2 - (from.top + from.height / 2);

  // Timing is linear so the keyframe offsets stay in step with the wall clock:
  // the flight owns the first 62%, then it dissolves as the sheet expands.
  return clone
    .animate(
      [
        {
          transform: "translate(0, 0) scale(1)",
          opacity: 1,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${grow})`,
          opacity: 1,
          offset: 0.62,
          easing: "ease-in",
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${grow * 1.1})`,
          opacity: 0,
        },
      ],
      { duration: 620, easing: "linear" }
    )
    .finished.catch(() => {})
    .then(() => clone.remove());
}

function openProduct(button, { plain = false } = {}) {
  const template = document.getElementById(`product-${button.dataset.product}`);
  if (!template || !inspector) return;
  inspectorBody.replaceChildren(template.content.cloneNode(true));
  inspector.classList.toggle("sheet--plain", plain);
  inspector.showModal();
}

// The sketchbook is a physical object on the desk, so there is nothing to fly —
// its sheet just fades up.
document.querySelectorAll(".notebook").forEach((btn) => {
  btn.addEventListener("click", () => openProduct(btn, { plain: true }));
});

document.querySelectorAll(".hologram").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (reduceMotion) {
      openProduct(btn);
      return;
    }
    const flight = launchHologram(btn);
    // Open just before the clone lands so the two motions read as one.
    setTimeout(() => openProduct(btn), 400);
    flight.then(() => btn.classList.remove("is-launching"));
  });
});

// Matches the .sheet.is-closing animation in site.css.
const SHEET_FADE_MS = 240;

/** Fades a sheet out before closing it, since <dialog> closes instantly. */
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

if (!reduceMotion && scene) {
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * -10;
    const y = (event.clientY / window.innerHeight - 0.5) * -6;
    scene.style.setProperty("--px", `${x}px`);
    scene.style.setProperty("--py", `${y}px`);
  });
}
