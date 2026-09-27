"""Flood-punch magenta / frames and export game sprites."""
from pathlib import Path
from collections import deque
from PIL import Image
import math

SRC = Path(r"C:\Users\User\.cursor\projects\f-GameProject\assets")
DST = Path(r"F:\GameProject\assets\sprites")
DST.mkdir(parents=True, exist_ok=True)


def is_magenta(r, g, b, a=255):
    if a < 10:
        return True
    if r >= 170 and b >= 90 and g <= 145 and (r - g) >= 40:
        return True
    if r >= 200 and g <= 170 and b >= 150 and r + b > g * 2 + 40:
        return True
    if r > 210 and b > 130 and g < 110:
        return True
    return False


def is_paper(r, g, b, a=255):
    if a < 12:
        return True
    mx, mn = max(r, g, b), min(r, g, b)
    if mn > 226 and (mx - mn) < 32:
        return True
    if r > 228 and g > 214 and b > 218 and (mx - mn) < 42:
        return True
    if mn > 188 and (mx - mn) < 22:
        return True
    return False


def defringe(im):
    w, h = im.size
    px = im.load()
    src = [(px[x, y]) for y in range(h) for x in range(w)]

    def at(x, y):
        return src[y * w + x]

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            near_clear = False
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and at(nx, ny)[3] < 12:
                    near_clear = True
                    break
            if not near_clear:
                continue
            if is_magenta(r, g, b, a) or (r > 180 and b > 100 and g < 160 and r > g):
                px[x, y] = (0, 0, 0, 0)
            elif g + 30 < r and g + 20 < b:
                # pull pink fringe toward neighbor color
                px[x, y] = (min(255, r), min(255, g + 40), min(255, b), int(a * 0.35))
    return im


def punch(im):
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    # 1) kill every magenta-like pixel
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b, a):
                px[x, y] = (0, 0, 0, 0)
    # 2) flood from edges through leftover dark frames
    vis = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or vis[y][x]:
            continue
        vis[y][x] = True
        r, g, b, a = px[x, y]
        dark = r + g + b < 48
        if a > 12 and not dark and not is_magenta(r, g, b, a) and not is_paper(r, g, b, a):
            continue
        px[x, y] = (0, 0, 0, 0)
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))
    return defringe(im)


def bbox(im, a_min=20):
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    n = 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > a_min:
                n += 1
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    return n, minx, miny, maxx, maxy


def circle_mask_ball(im):
    n, minx, miny, maxx, maxy = bbox(im)
    if n < 200:
        return im
    cx = (minx + maxx) / 2.0
    cy = (miny + maxy) / 2.0
    # radius from opaque samples (ignore sparse outliers)
    rads = []
    w, h = im.size
    px = im.load()
    for y in range(miny, maxy + 1, 2):
        for x in range(minx, maxx + 1, 2):
            if px[x, y][3] > 40:
                rads.append(math.hypot(x - cx, y - cy))
    rads.sort()
    rad = rads[int(len(rads) * 0.92)] if rads else max(maxx - minx, maxy - miny) / 2.0
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy)
            r, g, b, a = px[x, y]
            if d > rad:
                px[x, y] = (0, 0, 0, 0)
            elif d > rad - 2:
                t = 1.0 - (d - (rad - 2)) / 2.0
                px[x, y] = (r, g, b, int(a * max(0.0, min(1.0, t))))
            elif is_magenta(r, g, b, a):
                px[x, y] = (0, 0, 0, 0)
    return im


def fit_square(im, size=256, pad_frac=0.06):
    n, minx, miny, maxx, maxy = bbox(im)
    if n < 80:
        return im.resize((size, size), Image.Resampling.LANCZOS)
    bw, bh = maxx - minx + 1, maxy - miny + 1
    side = int(max(bw, bh) * (1 + pad_frac * 2))
    pad = (side - bw) // 2
    pady = (side - bh) // 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    crop = im.crop((minx, miny, maxx + 1, maxy + 1))
    canvas.paste(crop, (pad, pady), crop)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def process(name, ball=False):
    im = punch(Image.open(SRC / name))
    if ball:
        im = circle_mask_ball(im)
        im = defringe(im)
    out = fit_square(im, 256, 0.02 if ball else 0.08)
    dest = DST / name
    out.save(dest, "PNG")
    print("wrote", dest)


if __name__ == "__main__":
    import sys
    names = sys.argv[1:]
    if not names:
        names = [
            "terra.png", "terra-left.png", "terra-right.png",
            "ignis.png", "ignis-left.png", "ignis-right.png",
            "volt.png", "volt-left.png", "volt-right.png",
            "ball.png",
        ]
    for f in names:
        process(f, ball=(f == "ball.png"))
    print("done")
