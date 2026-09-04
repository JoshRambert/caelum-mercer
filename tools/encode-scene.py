"""Encode a generated lab scene for the web.

The artwork is almost entirely saturated cyan detail on near-black, which is the
worst case for JPEG's default 4:2:0 chroma subsampling -- it halves the colour
resolution and smears every line of terminal text. So: LANCZOS to the target
size, a light unsharp pass to recover the edges the resample costs, and 4:4:4.

    python tools/encode-scene.py <source.png> <dest.jpg>
"""

import sys

from PIL import Image, ImageFilter

TARGET = (1920, 1080)
QUALITY = 90

src, dest = sys.argv[1], sys.argv[2]

image = Image.open(src).convert("RGB")
if image.size != TARGET:
    image = image.resize(TARGET, Image.LANCZOS)
image = image.filter(ImageFilter.UnsharpMask(radius=1.4, percent=90, threshold=2))
image.save(dest, "JPEG", quality=QUALITY, subsampling=0, optimize=True, progressive=True)

print(f"{dest}: {image.size[0]}x{image.size[1]}")
