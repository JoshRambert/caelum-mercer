/**
 * Canvas textures for the cabin monitors.
 * Six small black terminals scroll. The wide and side panels are painted
 * workstation art and stay still.
 */

const LINES = [
  "> sync profile …… ok",
  "> hydrate cache … 128kb",
  "> auth.session …… up",
  "> build troutt …… done",
  "> build nimlo ……… done",
  "> notes indexed … 128",
  "> plan generated … ok",
  "> rest timer ……… set",
  "> store listing … ok",
  "> git diff ……… clean",
  "> tests ………… 42/42",
  "> deploy staged … ok",
  "> commit signed … ok",
  "> listening …………",
  "> ship it",
];

const LINE_COUNT = 28;
const PX_PER_SEC = 26;

export function createScrollingFeed(index, speed = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  const rotated = [...LINES.slice(index), ...LINES.slice(0, index)];
  const rows = Array.from({ length: LINE_COUNT }, (_, i) => rotated[i % rotated.length]);
  const block = [...rows, ...rows];
  const lineH = 18;
  let offset = (index * 11) % (LINE_COUNT * lineH);

  function paint() {
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#9fffd4";
    ctx.shadowColor = "#3dba84";
    ctx.shadowBlur = 6;
    ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    const loop = LINE_COUNT * lineH;
    const y0 = -(offset % loop);
    for (let i = 0; i < block.length; i += 1) {
      ctx.fillText(block[i], 10, 16 + y0 + i * lineH);
    }
  }

  paint();

  return {
    canvas,
    tick(dt) {
      offset += PX_PER_SEC * speed * dt;
      paint();
    },
  };
}

export function paintWideConsole() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070b10";
  ctx.fillRect(0, 0, 768, 320);

  ctx.strokeStyle = "#143044";
  ctx.lineWidth = 1;
  for (let x = 40; x < 768; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 320);
    ctx.stroke();
  }
  for (let y = 24; y < 320; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(768, y);
    ctx.stroke();
  }

  const cx = 384;
  const cy = 160;
  ctx.strokeStyle = "#3ec8e8";
  ctx.lineWidth = 2;
  for (const r of [36, 64, 92, 120]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 140, cy);
  ctx.lineTo(cx + 140, cy);
  ctx.moveTo(cx, cy - 140);
  ctx.lineTo(cx, cy + 140);
  ctx.stroke();

  ctx.fillStyle = "#7ee9ff";
  ctx.font = "600 14px ui-monospace, Menlo, monospace";
  ctx.fillText("CORE  ·  LINK OK", 28, 28);
  ctx.fillText("PLAN 04", 28, 48);
  ctx.fillStyle = "#5aa8b8";
  ctx.fillText("nimlo   rest  36:12", 580, 28);
  ctx.fillText("troutt  128 notes", 580, 48);
  ctx.fillText("ship queue idle", 580, 292);

  return canvas;
}

export function paintSideConsole() {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070b10";
  ctx.fillRect(0, 0, 220, 360);

  ctx.strokeStyle = "#2ec4d6";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 20; i += 1) {
    const y = 40 + i * 15;
    const w = 30 + ((i * 17) % 70);
    if (i === 0) ctx.moveTo(30, y);
    else ctx.lineTo(30 + w, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#7ee9ff";
  ctx.font = "600 12px ui-monospace, Menlo, monospace";
  ctx.fillText("SCOPE", 16, 22);
  ctx.fillStyle = "#5aa8b8";
  ctx.fillText("wave 03", 16, 344);

  return canvas;
}
