/**
 * Caelum Mercer — immersive page runtime
 * WebGL2 aurora + reactive grid, magnetic UI, 3D tilt, scroll systems
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
if (isTouch) document.body.classList.add("has-touch");

/* ——— Smooth-ish scroll progress + CSS vars ——— */
const root = document.documentElement;
let scrollY = 0;
let targetScroll = 0;

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetScroll = max > 0 ? window.scrollY / max : 0;
  scrollY += (targetScroll - scrollY) * 0.12;
  root.style.setProperty("--scroll", scrollY.toFixed(4));
  requestAnimationFrame(updateScroll);
}
requestAnimationFrame(updateScroll);

/* ——— Reveal on view ——— */
const revealEls = document.querySelectorAll(".reveal, .reveal-up");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-in"));
}

// Hero reveals immediately
requestAnimationFrame(() => {
  document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("is-in"));
});

/* ——— Custom cursor + magnetic ——— */
const cursor = document.querySelector(".cursor");
let cx = -100, cy = -100, rx = -100, ry = -100;
let mx = 0.5, my = 0.5;

if (!isTouch && cursor) {
  window.addEventListener("pointermove", (e) => {
    cx = e.clientX;
    cy = e.clientY;
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
    root.style.setProperty("--mx", mx.toFixed(4));
    root.style.setProperty("--my", my.toFixed(4));
  });

  function tickCursor() {
    rx += (cx - rx) * 0.18;
    ry += (cy - ry) * 0.18;
    cursor.style.setProperty("--cx", `${cx}px`);
    cursor.style.setProperty("--cy", `${cy}px`);
    cursor.style.setProperty("--rx", `${rx}px`);
    cursor.style.setProperty("--ry", `${ry}px`);
    requestAnimationFrame(tickCursor);
  }
  tickCursor();

  document.querySelectorAll("a, button, .magnetic, .phone").forEach((el) => {
    el.addEventListener("pointerenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("pointerleave", () => document.body.classList.remove("cursor-hover"));
  });
}

document.querySelectorAll("[data-magnetic]").forEach((el) => {
  if (isTouch || reduceMotion) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
  });
  el.addEventListener("pointerleave", () => {
    el.style.transform = "";
  });
});

/* ——— 3D tilt on phones ——— */
document.querySelectorAll("[data-tilt]").forEach((card) => {
  if (isTouch || reduceMotion) return;
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rxT = (0.5 - py) * 14;
    const ryT = (px - 0.5) * 16;
    card.classList.add("is-tilting");
    card.style.transform = `perspective(900px) rotateX(${rxT}deg) rotateY(${ryT}deg) scale3d(1.03,1.03,1.03)`;
  });
  card.addEventListener("pointerleave", () => {
    card.classList.remove("is-tilting");
    card.style.transform = "";
  });
});

/* ——— WebGL2 Aurora Shader ——— */
function initAurora() {
  const canvas = document.getElementById("aurora");
  if (!canvas || reduceMotion) return;

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  if (!gl) {
    canvas.style.display = "none";
    return;
  }

  const vs = `#version 300 es
  layout(location=0) in vec2 a;
  void main(){ gl_Position = vec4(a,0.,1.); }`;

  const fs = `#version 300 es
  precision highp float;
  out vec4 fragColor;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;

  // Brand palette
  // navy #050810, amber #E5A85A, cyan #5CC2E0, cream #F8F4E3

  float hash(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.,0.));
    float c = hash(i + vec2(0.,1.));
    float d = hash(i + vec2(1.,1.));
    vec2 u = f*f*(3.-2.*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
  }

  float fbm(vec2 p){
    float v = 0.;
    float a = 0.5;
    mat2 m = mat2(1.6,1.2,-1.2,1.6);
    for(int i=0;i<5;i++){
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

    // Parallax mouse
    vec2 m = (uMouse - 0.5) * 0.35;
    p += m * 0.15;

    float t = uTime * 0.08;
    float scrollWarp = uScroll * 1.2;

    // Domain-warped aurora ribbons
    vec2 q = p * 1.8;
    q.y += scrollWarp * 0.25;
    float n1 = fbm(q + t);
    float n2 = fbm(q * 1.7 - t * 0.7 + n1);
    float aurora = smoothstep(0.35, 0.85, n2);

    vec3 navy = vec3(0.02, 0.031, 0.063);
    vec3 amber = vec3(0.898, 0.659, 0.353);
    vec3 cyan = vec3(0.361, 0.761, 0.878);
    vec3 cream = vec3(0.973, 0.957, 0.890);

    vec3 col = navy;
    col += amber * aurora * 0.22;
    col += cyan * smoothstep(0.55, 0.95, n1) * 0.14;
    col += cream * pow(aurora, 3.0) * 0.06;

    // Soft vertical wash
    col += amber * (1.0 - smoothstep(0.0, 1.2, length(p + vec2(0., 0.2)))) * 0.08;

    // Reactive grid
    vec2 gp = (uv + m * 0.04) * uRes / 70.0;
    vec2 gf = abs(fract(gp) - 0.5);
    float grid = 1.0 - smoothstep(0.0, 0.04, min(gf.x, gf.y));
    float glow = smoothstep(0.55, 0.0, length(uv - uMouse));
    col += mix(vec3(0.1, 0.15, 0.26), cyan, glow) * grid * (0.12 + glow * 0.35);

    // Vignette in-shader (subtle)
    float vig = smoothstep(1.35, 0.25, length(p));
    col *= mix(0.75, 1.0, vig);

    // Grain
    float g = hash(gl_FragCoord.xy + fract(uTime)) * 0.035;
    col += g;

    fragColor = vec4(col, 1.0);
  }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  const vsh = compile(gl.VERTEX_SHADER, vs);
  const fsh = compile(gl.FRAGMENT_SHADER, fs);
  if (!vsh || !fsh) return;
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");
  const uScroll = gl.getUniformLocation(prog, "uScroll");

  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let w = 0, h = 0;
  let mouse = [0.5, 0.5];
  let mouseTarget = [0.5, 0.5];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", (e) => {
    mouseTarget = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  });

  const start = performance.now();
  function frame(now) {
    mouse[0] += (mouseTarget[0] - mouse[0]) * 0.06;
    mouse[1] += (mouseTarget[1] - mouse[1]) * 0.06;
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, (now - start) * 0.001);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.uniform1f(uScroll, scrollY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

initAurora();
