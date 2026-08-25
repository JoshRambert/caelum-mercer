"""Decode a CDP Page.captureScreenshot response file into a PNG.

    python tools/shot.py <cdp-response.json> <out.png>
"""

import base64
import io
import json
import sys

from PIL import Image


def find_data(node):
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "data" and isinstance(value, str) and len(value) > 1000:
                return value
            found = find_data(value)
            if found:
                return found
    if isinstance(node, list):
        for value in node:
            found = find_data(value)
            if found:
                return found
    return None


src, dest = sys.argv[1], sys.argv[2]
payload = find_data(json.load(open(src)))
image = Image.open(io.BytesIO(base64.b64decode(payload)))
image.save(dest)
print(dest, image.size)
