"""Draw a labelled percentage grid over a scene so overlay boxes can be read off.

    python tools/grid.py images/lab-night.jpg /tmp/grid.png [step]
"""

import sys

from PIL import Image, ImageDraw

src, dest = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0

image = Image.open(src).convert("RGB")
W, H = image.size
draw = ImageDraw.Draw(image, "RGBA")

pct = 0.0
while pct <= 100.0:
    x = int(W * pct / 100)
    major = abs(pct % 10) < 0.001
    draw.line([(x, 0), (x, H)], fill=(255, 0, 128, 200 if major else 90), width=2 if major else 1)
    if major:
        draw.text((x + 4, 6), f"{pct:.0f}", fill=(255, 255, 0))
    y = int(H * pct / 100)
    draw.line([(0, y), (W, y)], fill=(0, 255, 180, 200 if major else 90), width=2 if major else 1)
    if major:
        draw.text((6, y + 4), f"{pct:.0f}", fill=(255, 255, 0))
    pct += step

image.save(dest)
print(f"{dest} {W}x{H} step {step}%")
