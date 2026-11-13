"""Soft-edit showcase of Nora: stitches the full site walkthrough and the iMessage clip.

Still, full-frame footage until the conversation with Nora; a chat close-up with captions while
you talk to her; on checkout the camera follows her cursor and eases out before Place order;
a floating phone for iMessage, caption bubbles, crossfades, and Nora's voice kept wherever the
footage runs at normal speed. Silent waits are sped up.

Usage:
  node scripts/edit-video/captions.mjs <caps-dir>
  python3 scripts/edit-video/build.py <source-dir> <caps-dir> <out.mp4> [--preview]
<source-dir> holds full-demo.mp4 and nora-imessage.mp4. --preview renders at half size, quickly.
"""
import math
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC, CAPS, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
PREVIEW = "--preview" in sys.argv
W, H, FPS, SR = 1920, 1080, 25, 48000
SPF = SR // FPS  # audio samples per frame
XF = 15  # crossfade frames (0.6 s)
DEMO, PHONE = SRC / "full-demo.mp4", SRC / "nora-imessage.mp4"


def ease(t: float) -> float:
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def cam_at(keys, t):
    """Eased interpolation between (time, cx, cy, zoom) keyframes."""
    if t <= keys[0][0]:
        return keys[0][1:]
    for (t0, *a), (t1, *b) in zip(keys, keys[1:]):
        if t <= t1:
            e = ease((t - t0) / max(1e-6, t1 - t0))
            return tuple(x + (y - x) * e for x, y in zip(a, b))
    return keys[-1][1:]


def crop_zoom(img: Image.Image, cx, cy, z) -> Image.Image:
    sw, sh = img.size
    cw, ch = sw / z, sh / z
    x0 = min(max(cx - cw / 2, 0), sw - cw)
    y0 = min(max(cy - ch / 2, 0), sh - ch)
    return img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))


def frames(path: Path, a: float, b: float, speed: float, size):
    """Decoded RGB frames for [a, b) of the source, played at `speed`."""
    w, h = size
    vf = f"setpts=(PTS-STARTPTS)/{speed},fps={FPS}"
    p = subprocess.Popen(
        ["ffmpeg", "-loglevel", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", str(path), "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield Image.frombuffer("RGB", (w, h), buf, "raw", "RGB", 0, 1)
    p.wait()


def audio(path: Path, a: float, b: float) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", str(path), "-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.int16).reshape(-1, 2).astype(np.float32)


def fit(x: np.ndarray, n: int) -> np.ndarray:
    return x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2), np.float32)])


# ---------- caption bubbles ----------
_caps: dict[str, Image.Image] = {}


def cap(name: str) -> Image.Image:
    if name not in _caps:
        _caps[name] = Image.open(CAPS / f"{name}.png").convert("RGBA")
    return _caps[name]


def draw_caption(base: Image.Image, name: str, alpha: float, where: str):
    if alpha <= 0.01:
        return
    im = cap(name)
    if alpha < 0.999:
        a = im.getchannel("A").point(lambda v: int(v * alpha))
        im = im.copy()
        im.putalpha(a)
    lift = int((1 - ease(alpha)) * 22)
    if where == "left":  # chat/phone layouts: left column, vertically centred
        x, y = 110, (H - im.height) // 2 + lift
    else:  # bottom-left over full-frame footage
        x, y = 50, H - im.height - 30 + lift
    base.alpha_composite(im, (x, y))


# ---------- layouts ----------
BG = Image.open(CAPS / "bg.png").convert("RGB").resize((W, H))


def rounded_mask(size, r):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255)
    return m


def shadow(size, r, blur=36, opacity=0.38, pad=80):
    s = Image.new("RGBA", (size[0] + pad * 2, size[1] + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(s).rounded_rectangle((pad, pad + 24, pad + size[0], pad + size[1] + 24), r, fill=(60, 44, 20, int(255 * opacity)))
    return s.filter(ImageFilter.GaussianBlur(blur)), pad


# chat panel: source box and where it sits on screen
CHAT_BOX = (1462, 272, 1920, 1080)
CHAT_H = 960
CHAT_SIZE = (round((CHAT_BOX[2] - CHAT_BOX[0]) * CHAT_H / (CHAT_BOX[3] - CHAT_BOX[1])), CHAT_H)
CHAT_POS = (W - CHAT_SIZE[0] - 190, (H - CHAT_H) // 2)
CHAT_MASK = rounded_mask(CHAT_SIZE, 26)
CHAT_SHADOW, CHAT_PAD = shadow(CHAT_SIZE, 26)

# phone: the clip renders the iPhone at 2x inside an 876x1784 frame with 48 px margins
PHONE_SIZE_SRC = (876, 1784)
PHONE_BOX = (48, 48, 828, 1736)
PHONE_H = 980
PHONE_SIZE = (round(780 * PHONE_H / 1688), PHONE_H)
PHONE_POS = (W - PHONE_SIZE[0] - 300, (H - PHONE_H) // 2)
PHONE_MASK = rounded_mask(PHONE_SIZE, round(116 * PHONE_H / 1688))
PHONE_SHADOW, PHONE_PAD = shadow(PHONE_SIZE, round(116 * PHONE_H / 1688), blur=44, opacity=0.42)


def layout_full(src, t, seg):
    cx, cy, z = cam_at(seg["cam"], t)
    if z <= 1.0005:  # no move: the frame as recorded
        return src.convert("RGBA")
    return crop_zoom(src, cx, cy, z).convert("RGBA")


def layout_chat(src, t, seg):
    small = src.resize((480, 270), Image.BILINEAR).filter(ImageFilter.GaussianBlur(5))
    bg = small.resize((W, H), Image.BILINEAR)
    bg = Image.blend(bg, Image.new("RGB", (W, H), (239, 230, 216)), 0.45).convert("RGBA")
    panel = src.crop(CHAT_BOX).resize(CHAT_SIZE, Image.BICUBIC)
    bg.alpha_composite(CHAT_SHADOW, (CHAT_POS[0] - CHAT_PAD, CHAT_POS[1] - CHAT_PAD))
    bg.paste(panel, CHAT_POS, CHAT_MASK)
    return bg


def layout_phone(src, t, seg):
    base = BG.convert("RGBA")
    phone = src.crop(PHONE_BOX).resize(PHONE_SIZE, Image.BICUBIC)
    base.alpha_composite(PHONE_SHADOW, (PHONE_POS[0] - PHONE_PAD, PHONE_POS[1] - PHONE_PAD))
    base.paste(phone, PHONE_POS, PHONE_MASK)
    return base


def layout_card(src, t, seg):
    return src.resize((W, H)).convert("RGBA")


LAYOUTS = {"full": layout_full, "chat": layout_chat, "phone": layout_phone, "card": layout_card}

# ---------- the edit ----------
STILL = [(0, 960, 540, 1.0)]  # no camera move

# After "pay now": full frame while Nora confirms and opens the cart, then on checkout the camera
# follows her cursor (Home, 8-9 PM, Pay with) and eases back out before she clicks Place order.
CHECKOUT_CAM = [
    (154.7, 960, 540, 1.0), (181.8, 960, 540, 1.0),
    (183.0, 905, 400, 1.6), (184.3, 920, 380, 1.6),   # Home
    (185.2, 990, 600, 1.6), (186.3, 990, 612, 1.6),   # 8-9 PM
    (186.9, 760, 780, 1.5),                           # Pay with
    (187.9, 960, 540, 1.0), (194.2, 960, 540, 1.0),   # fully out ~1.5 s before Place order
]

SEGMENTS = [
    {"layout": "card", "image": "title", "len": 4.6},
    {"layout": "full", "file": DEMO, "pieces": [(0.0, 12.6, 1)], "audio": False, "cam": STILL},
    {"layout": "full", "file": DEMO, "pieces": [(14.8, 39.0, 1.6)], "audio": False, "cam": STILL},
    {"layout": "full", "file": DEMO, "pieces": [(39.0, 44.5, 1)], "audio": False, "cam": STILL},
    {"layout": "full", "file": DEMO, "pieces": [(44.5, 55.6, 1.25)], "audio": False, "cam": STILL},
    {"layout": "chat", "file": DEMO, "audio": True,
     "pieces": [(56.0, 64.7, 1), (64.7, 71.1, 3), (71.1, 89.6, 1), (89.6, 92.7, 2.5), (92.7, 111.0, 1), (111.0, 114.9, 2.5),
                (114.9, 131.1, 1), (131.1, 140.7, 3), (140.7, 154.7, 1)],
     "caps": [("c_voice", 56.4, 62.0, "left"), ("c_ask1", 62.4, 70.6, "left"), ("c_picks", 71.6, 88.4, "left"),
              ("c_ask2", 88.8, 104.0, "left"), ("c_add", 109.6, 126.5, "left"), ("c_tidy", 129.6, 150.4, "left"),
              ("c_pay", 150.8, 154.6, "left")]},
    {"layout": "full", "file": DEMO, "audio": True, "pieces": [(154.7, 165.5, 3), (165.5, 194.2, 1)], "cam": CHECKOUT_CAM},
    {"layout": "full", "file": DEMO, "pieces": [(194.2, 218.6, 2)], "audio": False, "cam": STILL},
    {"layout": "phone", "file": PHONE, "size": PHONE_SIZE_SRC, "audio": False,
     "pieces": [(1.0, 9.5, 1), (9.5, 16.6, 2.5), (16.6, 22.6, 1), (22.6, 27.3, 2.2), (27.3, 30.9, 1)],
     "caps": [("c_text", 1.3, 9.4, "left"), ("c_text2", 9.7, 21.6, "left"), ("c_text3", 21.9, 30.8, "left")]},
    {"layout": "card", "image": "end", "len": 6.0},
]


def plan(seg):
    """Source time of every output frame, and the caption spans in output frames."""
    if seg["layout"] == "card":
        seg["n"] = round(seg["len"] * FPS)
        seg["caps_f"] = []
        return
    stamps = []
    for a, b, sp in seg["pieces"]:
        stamps += [a + i * sp / FPS for i in range(int(round((b - a) / sp * FPS)))]
    seg["stamps"], seg["n"], seg["len"] = stamps, len(stamps), len(stamps) / FPS
    seg["caps_f"] = []
    for name, c0, c1, where in seg.get("caps", []):
        idx = [i for i, st in enumerate(stamps) if c0 <= st <= c1]
        if idx:
            seg["caps_f"].append((name, idx[0], idx[-1], where))


def seg_audio(seg) -> np.ndarray:
    if seg["layout"] == "card":
        return np.zeros((seg["n"] * SPF, 2), np.float32)
    parts = []
    for a, b, sp in seg["pieces"]:
        n = int(round((b - a) / sp * FPS))
        parts.append(fit(audio(seg["file"], a, b), n * SPF) if seg["audio"] and sp == 1 else np.zeros((n * SPF, 2), np.float32))
    return np.vstack(parts)


def seg_frames(seg):
    """Yields the segment's finished RGB frames, one at a time."""
    layout = LAYOUTS[seg["layout"]]
    if seg["layout"] == "card":
        img = Image.open(CAPS / f"{seg['image']}.png").convert("RGB")
        for i in range(seg["n"]):
            yield layout(img, i / FPS, seg).convert("RGB")
        return
    size = seg.get("size", (W, H))
    k = 0
    for a, b, sp in seg["pieces"]:
        n = int(round((b - a) / sp * FPS))
        got, prev = 0, None
        for img in frames(seg["file"], a, b, sp, size):
            if got >= n:
                break
            t = seg["stamps"][k] if seg["layout"] == "full" else k / FPS
            fr = layout(img, t, seg)
            for name, f0, f1, where in seg["caps_f"]:
                if f0 <= k <= f1:
                    draw_caption(fr, name, max(0.0, min(1.0, (k - f0) / 11, (f1 - k) / 11)), where)
            prev = fr.convert("RGB")
            yield prev
            got += 1
            k += 1
        while got < n and prev is not None:  # pad a short decode with its last frame
            yield prev
            got += 1
            k += 1


def main():
    enc_size = (960, 540) if PREVIEW else (W, H)
    tmp_video = OUT.with_suffix(".video.mp4")
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{enc_size[0]}x{enc_size[1]}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "veryfast" if PREVIEW else "slow", "-crf", "24" if PREVIEW else "17", "-pix_fmt", "yuv420p", str(tmp_video)],
        stdin=subprocess.PIPE,
    )

    def emit(img):
        if PREVIEW:
            img = img.resize(enc_size, Image.BILINEAR)
        enc.stdin.write(img.tobytes())

    from collections import deque
    tail: deque = deque()
    mix = np.zeros((0, 2), np.float32)
    for i, seg in enumerate(SEGMENTS):
        plan(seg)
        au = seg_audio(seg)
        last_seg = i == len(SEGMENTS) - 1
        gen = seg_frames(seg)
        if tail:  # crossfade the first frames with the end of the previous segment
            for j in range(XF):
                emit(Image.blend(tail.popleft(), next(gen), ease((j + 1) / (XF + 1))))
            ov = XF * SPF
            ramp = np.linspace(0, 1, ov, dtype=np.float32)[:, None]
            mix[-ov:] = mix[-ov:] * (1 - ramp) + au[:ov] * ramp
            au = au[ov:]
        for img in gen:
            tail.append(img)
            if len(tail) > XF:
                emit(tail.popleft())
        if last_seg:
            while tail:
                emit(tail.popleft())
        mix = np.vstack([mix, au])
        print(f"segment {i + 1}/{len(SEGMENTS)} {seg['layout']:5s} {seg['n'] / FPS:6.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()

    n = len(mix)
    f = min(n, SR)
    mix[:f] *= np.linspace(0, 1, f)[:, None]
    mix[-f:] *= np.linspace(1, 0, f)[:, None]
    wav = OUT.with_suffix(".wav")
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.clip(mix, -32768, 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp_video), "-i", str(wav), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-shortest", "-movflags", "+faststart", str(OUT)], check=True)
    tmp_video.unlink()
    wav.unlink()
    print("wrote", OUT, f"{n / SR:.1f}s")


if __name__ == "__main__":
    main()
