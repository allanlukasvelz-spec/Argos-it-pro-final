#!/usr/bin/env python3
"""Compare two PNGs; print diff pixel count and bounding box (requires Pillow)."""
import sys

try:
    from PIL import Image, ImageChops
except ImportError:
    print("Pillow not installed; pip install Pillow for bbox analysis", file=sys.stderr)
    sys.exit(2)

if len(sys.argv) != 3:
    print(f"usage: {sys.argv[0]} a.png b.png", file=sys.stderr)
    sys.exit(1)

a = Image.open(sys.argv[1]).convert("RGBA")
b = Image.open(sys.argv[2]).convert("RGBA")
if a.size != b.size:
    print(f"size mismatch: {a.size} vs {b.size}")
    sys.exit(0)

diff = ImageChops.difference(a, b)
bbox = diff.getbbox()
pixels = sum(1 for px in diff.getdata() if px[3] > 0 or px[:3] != (0, 0, 0))
w, h = a.size
ratio = pixels / (w * h) if w * h else 0
print(f"diff_pixels={pixels} ratio={ratio:.6f} bbox={bbox}")
