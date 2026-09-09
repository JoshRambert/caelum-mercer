/**
 * Caelum Mercer — lab runtime
 * Local sun/moon, desk holograms, live terminals, light parallax
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const inspector = document.getElementById("inspector");
const inspectorBody = document.getElementById("inspector-body");
const scene = document.getElementById("lab-scene");

const SCENE_RATIO = 16 / 9;

function viewportSize() {
  const vv = window.visualViewport;
  return {
    vw: Math.round(vv?.width ?? document.documentElement.clientWidth),
    vh: Math.round(vv?.height ?? document.documentElement.clientHeight),
  };
}

function stageFractions() {
  const css = getComputedStyle(root);
  return {
    x1: parseFloat(css.getPropertyValue("--stage-x1")) || 0.37,
    x2: parseFloat(css.getPropertyValue("--stage-x2")) || 0.7,
    y1: parseFloat(css.getPropertyValue("--stage-y1")) || 0.4,
    y2: parseFloat(css.getPropertyValue("--stage-y2")) || 0.9,
  };
}

function clampRange(value, lo, hi) {
  if (hi < lo) return (lo + hi) / 2;
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Fill the webview with the 16:9 painting. Grow toward cover, then stop
 * before Troutt / Nimlo would be cropped out, and pin that stage in view.
 */
function fitLabScene() {
  if (!scene) return;

  const { vw, vh } = viewportSize();
  const stage = stageFractions();
  const coverW = Math.max(vw, vh * SCENE_RATIO);
  const maxSafeW = Math.min(
    vw / (stage.x2 - stage.x1),
    (vh / (stage.y2 - stage.y1)) * SCENE_RATIO
  );
  const sceneW = Math.max(1, Math.round(Math.min(coverW, maxSafeW)));
  const sceneH = sceneW / SCENE_RATIO;

  let x;
  if (Math.abs(sceneW - vw) < 2) {
    x = 0;
  } else if (sceneW <= vw) {
    x = (vw - sceneW) / 2;
  } else {
    const focus = ((stage.x1 + stage.x2) / 2) * sceneW;
    x = clampRange(
      vw / 2 - focus,
      Math.max(vw - sceneW, -stage.x1 * sceneW),
      Math.min(0, vw - stage.x2 * sceneW)
    );
  }

  let y;
  if (Math.abs(sceneH - vh) < 2) {
    y = 0;
  } else if (sceneH <= vh) {
    y = (vh - sceneH) / 2;
  } else {
    const focus = ((stage.y1 + stage.y2) / 2) * sceneH;
    y = clampRange(
      vh / 2 - focus,
      Math.max(vh - sceneH, -stage.y1 * sceneH),
      Math.min(0, vh - stage.y2 * sceneH)
    );
  }

  x = Math.round(x);
  y = Math.round(y);

  scene.style.setProperty("--scene-w", `${sceneW}px`);
  scene.style.setProperty("--scene-x", `${x}px`);
  scene.style.setProperty("--scene-y", `${y}px`);
  scene.classList.add("is-fitted");

  const posX = sceneW ? ((-x + vw / 2) / sceneW) * 100 : 50;
  const posY = sceneH ? ((-y + vh / 2) / sceneH) * 100 : 50;
  document.querySelector(".lab")?.style.setProperty(
    "--lab-pos",
    `${posX.toFixed(2)}% ${posY.toFixed(2)}%`
  );
}

fitLabScene();
let fitFrame = 0;
function scheduleFit() {
  if (fitFrame) return;
  fitFrame = requestAnimationFrame(() => {
    fitFrame = 0;
    fitLabScene();
    seedScreens();
  });
}
window.addEventListener("resize", scheduleFit);
window.visualViewport?.addEventListener("resize", scheduleFit);
window.visualViewport?.addEventListener("scroll", scheduleFit);

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
