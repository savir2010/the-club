"""Cut the flat grey ground out of each editorial product plate, keeping the framing.

Reads  public/img/products/editorial/<id>.jpg  (4:5, product on a flat #ECE7E1 ground)
Writes public/img/products/cutout/<id>.webp    (same framing, ground transparent)

The product cards then show the page colour behind the product, and the grey on hover.
Pixels close to the ground colour fade to transparent; edge pixels are un-mixed from the
ground so no grey halo is left. Needs Pillow and numpy:
    python3 -m venv /tmp/imgenv && /tmp/imgenv/bin/pip install pillow numpy
    /tmp/imgenv/bin/python scripts/cutout-plates.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public/img/products"
SRC, OUT = ROOT / "editorial", ROOT / "cutout"
GROUND = np.array([236, 231, 225], dtype=np.float32)
NEAR, FAR = 6.0, 26.0  # colour distance: fully ground at or under NEAR, fully product at or over FAR

# Plates whose photo kept its own backdrop inside the grey ground.
#   ground_at: a pixel of that inner backdrop, keyed out like the grey
#   green:     the backdrop is a sage gradient with a soft shadow, so anything green-tinted is keyed out
#              (the products themselves are black and cream)
#   crop:      (left, top, right, bottom) to keep, re-framed at the centre of the plate at `width` px wide
FIXUPS = {
    "top-001": {"green": True},
    "top-004": {"green": True},
    # a contest poster: keep only the pouch, which sits on a cream disc
    "edb-002": {"crop": (306, 424, 512, 692), "width": 360, "ground_at": (310, 430)},
}


def matte(rgb: np.ndarray, ground: np.ndarray) -> np.ndarray:
    """0 where the pixel is the ground colour, 1 where it's clearly product, smooth between."""
    t = np.clip((np.linalg.norm(rgb - ground, axis=-1) - NEAR) / (FAR - NEAR), 0, 1)
    return t * t * (3 - 2 * t)  # smoothstep


OUT.mkdir(exist_ok=True)
for src in sorted(SRC.glob("*.jpg")):
    if src.stem.endswith("-alt"):
        continue
    img = Image.open(src).convert("RGB")
    fix = FIXUPS.get(src.stem, {})
    rgb = np.asarray(img, dtype=np.float32)
    grounds = [GROUND]
    if "ground_at" in fix:
        grounds.append(rgb[fix["ground_at"][1], fix["ground_at"][0]])
    alpha = np.minimum.reduce([matte(rgb, g) for g in grounds])
    if fix.get("green"):
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        tint = np.clip((np.minimum(g - r, g - b + 4) - 2) / 6, 0, 1)  # 0 = neutral, 1 = sage
        alpha = np.minimum(alpha, 1 - tint * tint * (3 - 2 * tint))
        # drop the hairline left where the sage box met the grey (an opening: erode, then dilate)
        m = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
        alpha = np.minimum(alpha, np.asarray(m, dtype=np.float32) / 255)
    # un-mix the nearest ground from edge pixels so no halo is left
    near = np.argmin(np.stack([np.linalg.norm(rgb - g, axis=-1) for g in grounds]), axis=0)
    ground = np.stack(grounds)[near]
    a = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((rgb - (1 - a) * ground) / a, 0, 255)
    out = np.dstack([fg, alpha * 255]).round().astype(np.uint8)
    if "crop" in fix:
        part = Image.fromarray(out, "RGBA").crop(fix["crop"])
        w = fix["width"]
        part = part.resize((w, round(part.height * w / part.width)), Image.LANCZOS)
        canvas = Image.new("RGBA", img.size, (0, 0, 0, 0))
        canvas.alpha_composite(part, ((img.width - w) // 2, (img.height - part.height) // 2))
        out = np.asarray(canvas)
    Image.fromarray(out, "RGBA").save(OUT / f"{src.stem}.webp", "WEBP", quality=88, method=6)
    print(src.stem)
