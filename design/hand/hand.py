import math
import sys
from pathlib import Path

# Right hand seen from above (palm down on the board), thumb on the left.
# name, base x, base y, angle deg (0 = up, + = right), length, base width, tip width, joints (fractions)
FINGERS = [
    ("thumb", 154, 350, -56, 108, 54, 44, (0.48,)),
    ("index", 178, 222, -9, 140, 45, 38, (0.42, 0.72)),
    ("middle", 220, 212, -1, 158, 47, 39, (0.42, 0.72)),
    ("ring", 260, 222, 7, 144, 44, 37, (0.42, 0.72)),
    ("little", 294, 252, 17, 108, 38, 32, (0.42, 0.70)),
]
PALM = ("M170,488 C160,452 150,424 140,392 C128,360 134,322 150,286 "
        "L162,236 Q170,214 196,210 L272,214 Q306,222 308,258 "
        "L304,352 C300,406 290,446 280,488 Z")
PALM_COIN = (224, 340)
COIN_AT = 0.80


def point(f, t, side=0.0):
    _, bx, by, ang, length, wb, wt, _ = f
    a = math.radians(ang)
    ux, uy = math.sin(a), -math.cos(a)
    px, py = math.cos(a), math.sin(a)
    w = wb + (wt - wb) * t
    return bx + ux * length * t + px * side * w / 2, by + uy * length * t + py * side * w / 2


def finger_path(f):
    _, bx, by, ang, length, wb, wt, _ = f
    x1, y1 = point(f, -0.15, -1)
    x2, y2 = point(f, 1, -1)
    x3, y3 = point(f, 1, 1)
    x4, y4 = point(f, -0.15, 1)
    r = wt / 2
    return f"M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f} A{r},{r} 0 0 1 {x3:.1f},{y3:.1f} L{x4:.1f},{y4:.1f} Z"


def creases(f):
    out = []
    for t in f[7]:
        xa, ya = point(f, t, -0.55)
        xb, yb = point(f, t, 0.55)
        out.append(f"M{xa:.1f},{ya:.1f} L{xb:.1f},{yb:.1f}")
    return " ".join(out)


def hand_svg(fill, outline, crease, coin, coin_ink, live, live_ink, glow, live_pad=3, width=320):
    shapes = [PALM] + [finger_path(f) for f in FINGERS]
    under = "".join(f"<path d='{d}'/>" for d in shapes)
    coins = []
    centers = [point(f, COIN_AT) for f in FINGERS] + [PALM_COIN]
    for pad, (cx, cy) in enumerate(centers, start=1):
        r = 30 if pad == 6 else 15
        on = pad == live_pad
        if on:
            coins.append(f"<circle cx='{cx:.1f}' cy='{cy:.1f}' r='{r + 14}' fill='{glow}' opacity='.16'/>"
                         f"<circle cx='{cx:.1f}' cy='{cy:.1f}' r='{r + 7}' fill='{glow}' opacity='.26'/>")
        coins.append(f"<circle cx='{cx:.1f}' cy='{cy:.1f}' r='{r}' fill='{live if on else coin}'/>"
                     f"<text x='{cx:.1f}' y='{cy + 5:.1f}' text-anchor='middle' font-size='15' font-weight='700' "
                     f"fill='{live_ink if on else coin_ink}'>{pad}</text>")
    return (f"<svg viewBox='20 30 350 470' width='{width}' role='img' aria-label='Hand board, pad {live_pad} glowing'>"
            f"<g fill='{outline}' stroke='{outline}' stroke-width='5' stroke-linejoin='round'>{under}</g>"
            f"<g fill='{fill}'>{under}</g>"
            f"{''.join(coins)}</svg>")


if __name__ == "__main__":
    svg = hand_svg("#EDE8FB", "#D6CDF3", "#D6CDF3", "#D9D2F0", "#5F5979", "#6B4EF6", "#FFFFFF", "#8E77FF")
    Path(sys.argv[1]).write_text(f"<!doctype html><html><body style='margin:0;background:#fff;display:grid;place-items:center;height:100vh;font-family:sans-serif'>{svg}</body></html>", encoding="utf-8")
