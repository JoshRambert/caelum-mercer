"""Locate the glowing monitor faces in the night artwork.

The screens are the only strongly cyan-biased regions in an otherwise brown/black
room, so a blue-minus-red mask isolates them. A max/min filter pair closes the
gaps that the text rows punch in each panel, then connected components give one
box per screen, reported as percentages of the frame for the CSS overlays.

    python tools/trace-scene.py images/lab-night.jpg [debug.png]
"""

import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = sys.argv[1]
image = Image.open(src).convert("RGB")
W, H = image.size

pixels = np.asarray(image).astype(int)
r, g, b = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]
mask = ((b - r > 18) & (b > 45)).astype(np.uint8) * 255

mask = Image.fromarray(mask).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(7))
mask = np.asarray(mask) > 128

# Flood fill each component iteratively (no scipy in the venv).
seen = np.zeros_like(mask)
boxes = []
for y0 in range(0, H, 4):
    for x0 in range(0, W, 4):
        if not mask[y0, x0] or seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        ys, xs = [], []
        while stack:
            y, x = stack.pop()
            ys.append(y)
            xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(ys) < 2500:
            continue
        boxes.append((min(xs), min(ys), max(xs), max(ys), len(ys)))

boxes.sort(key=lambda box: (round(box[1] / 60), box[0]))
for left, top, right, bottom, area in boxes:
    print(
        f"left {left / W * 100:6.2f}%  top {top / H * 100:6.2f}%  "
        f"w {(right - left) / W * 100:6.2f}%  h {(bottom - top) / H * 100:6.2f}%  "
        f"px {left},{top},{right},{bottom}  area {area}"
    )

if len(sys.argv) > 2:
    debug = image.copy()
    draw = ImageDraw.Draw(debug)
    for i, (left, top, right, bottom, _) in enumerate(boxes):
        draw.rectangle([left, top, right, bottom], outline=(255, 0, 128), width=4)
        draw.text((left + 6, top + 6), str(i), fill=(255, 255, 0))
    debug.save(sys.argv[2])
