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
const PAN_SLOP = 10;
const labEl = document.querySelector(".lab");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const camera = {
  vw: 0,
  vh: 0,
  sceneW: 0,
  sceneH: 0,
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  x: 0,
  y: 0,
  userPanned: false,
};

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

function axisBounds(view, scene) {
  if (scene <= view + 1) {
    const centered = (view - scene) / 2;
    return { min: centered, max: centered };
  }
  return { min: view - scene, max: 0 };
}

function applyCamera() {
  if (!scene) return;
  scene.style.setProperty("--scene-w", `${camera.sceneW}px`);
  scene.style.setProperty("--scene-x", `${Math.round(camera.x)}px`);
  scene.style.setProperty("--scene-y", `${Math.round(camera.y)}px`);
  scene.classList.add("is-fitted");
  scene.classList.toggle("is-pannable", camera.minX < camera.maxX || camera.minY < camera.maxY);

  const posX = camera.sceneW ? ((-camera.x + camera.vw / 2) / camera.sceneW) * 100 : 50;
  const posY = camera.sceneH ? ((-camera.y + camera.vh / 2) / camera.sceneH) * 100 : 50;
  labEl?.style.setProperty("--lab-pos", `${posX.toFixed(2)}% ${posY.toFixed(2)}%`);
}

function defaultCamera(stage) {
  let x;
  if (Math.abs(camera.sceneW - camera.vw) < 2) {
    x = 0;
  } else if (camera.sceneW <= camera.vw) {
    x = (camera.vw - camera.sceneW) / 2;
  } else {
    const focus = ((stage.x1 + stage.x2) / 2) * camera.sceneW;
    x = clampRange(
      camera.vw / 2 - focus,
      Math.max(camera.minX, -stage.x1 * camera.sceneW),
      Math.min(camera.maxX, camera.vw - stage.x2 * camera.sceneW)
    );
  }

  let y;
  if (Math.abs(camera.sceneH - camera.vh) < 2) {
    y = 0;
  } else if (camera.sceneH <= camera.vh) {
    y = (camera.vh - camera.sceneH) / 2;
  } else {
    const focus = ((stage.y1 + stage.y2) / 2) * camera.sceneH;
    y = clampRange(
      camera.vh / 2 - focus,
      Math.max(camera.minY, -stage.y1 * camera.sceneH),
      Math.min(camera.maxY, camera.vh - stage.y2 * camera.sceneH)
    );
  }

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Fill the webview with the 16:9 painting. Grow toward cover, then stop
 * before Troutt / Nimlo would be cropped out of the starting view. Swipe
 * or drag to look around the rest of the room.
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
  const xBound = axisBounds(vw, sceneW);
  const yBound = axisBounds(vh, sceneH);

  camera.vw = vw;
  camera.vh = vh;
  camera.sceneW = sceneW;
  camera.sceneH = sceneH;
  camera.minX = xBound.min;
  camera.maxX = xBound.max;
  camera.minY = yBound.min;
  camera.maxY = yBound.max;

  if (camera.userPanned) {
    camera.x = clampRange(camera.x, camera.minX, camera.maxX);
    camera.y = clampRange(camera.y, camera.minY, camera.maxY);
  } else {
    const home = defaultCamera(stage);
    camera.x = home.x;
    camera.y = home.y;
  }

  applyCamera();
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

let drag = null;
let suppressClick = false;
let inertiaFrame = 0;

function stopInertia() {
  if (inertiaFrame) {
    cancelAnimationFrame(inertiaFrame);
    inertiaFrame = 0;
  }
}

function coast(vx, vy) {
  if (reduceMotion) return;
  stopInertia();
  const decay = 0.92;
  const step = () => {
    vx *= decay;
    vy *= decay;
    if (camera.x <= camera.minX || camera.x >= camera.maxX) vx = 0;
    if (camera.y <= camera.minY || camera.y >= camera.maxY) vy = 0;
    if (Math.abs(vx) < 0.35 && Math.abs(vy) < 0.35) {
      inertiaFrame = 0;
      applyCamera();
      return;
    }
    camera.x = clampRange(camera.x + vx, camera.minX, camera.maxX);
    camera.y = clampRange(camera.y + vy, camera.minY, camera.maxY);
    applyCamera();
    inertiaFrame = requestAnimationFrame(step);
  };
  inertiaFrame = requestAnimationFrame(step);
}

if (labEl && scene) {
  labEl.addEventListener("pointerdown", (event) => {
    if (event.button && event.button !== 0) return;
    if (document.querySelector("dialog[open]")) return;
    if (camera.minX >= camera.maxX && camera.minY >= camera.maxY) return;

    stopInertia();
    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: performance.now(),
      origX: camera.x,
      origY: camera.y,
      vx: 0,
      vy: 0,
      moved: false,
    };
    // Capture only once the gesture is a pan. Capturing on pointerdown
    // retargets the click onto the lab, so Nimlo and Troutt never open.
  });

  labEl.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved) {
        if (dx * dx + dy * dy < PAN_SLOP * PAN_SLOP) return;
        drag.moved = true;
        suppressClick = true;
        camera.userPanned = true;
        scene.classList.add("is-panning");
        try {
          labEl.setPointerCapture(event.pointerId);
        } catch {
          // Safari can throw if the pointer is already released.
        }
      }

      const now = performance.now();
      const dt = Math.max(8, now - drag.lastT);
      drag.vx = ((event.clientX - drag.lastX) / dt) * 16;
      drag.vy = ((event.clientY - drag.lastY) / dt) * 16;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastT = now;

      camera.x = clampRange(drag.origX + dx, camera.minX, camera.maxX);
      camera.y = clampRange(drag.origY + dy, camera.minY, camera.maxY);
      applyCamera();
    },
    { passive: true }
  );

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    const vx = drag.vx;
    const vy = drag.vy;
    drag = null;
    scene.classList.remove("is-panning");
    if (moved && (Math.abs(vx) > 0.8 || Math.abs(vy) > 0.8)) {
      coast(vx, vy);
    }
    if (moved) {
      window.setTimeout(() => {
        suppressClick = false;
      }, 50);
    }
  };

  labEl.addEventListener("pointerup", endDrag);
  labEl.addEventListener("pointercancel", endDrag);

  labEl.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
}

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

if (!reduceMotion && scene && finePointer.matches) {
  window.addEventListener("pointermove", (event) => {
    if (drag || scene.classList.contains("is-panning")) return;
    const x = (event.clientX / window.innerWidth - 0.5) * -10;
    const y = (event.clientY / window.innerHeight - 0.5) * -6;
    scene.style.setProperty("--px", `${x}px`);
    scene.style.setProperty("--py", `${y}px`);
  });
}
