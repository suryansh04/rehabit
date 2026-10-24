"""Make the web copies of the logo from the full-size PNGs in this folder.

Run from the repo root: python design/logo/export.py
Writes frontend/public/logo.png and frontend/public/favicon.png.
"""
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "frontend" / "public"

# The source art sits on near-white and on the app's lavender (#F3F0FA).
BACKGROUNDS = [(254, 254, 254), (243, 239, 252)]
# Colour distance below SOLID_FROM fades to clear, so the anti-aliased edges stay smooth.
CLEAR_BELOW = 12
SOLID_FROM = 60

LOGO_HEIGHT = 144  # 4x the 36 px it shows at
FAVICON_SIZE = 64
FAVICON_PAD = 2


def distance(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def unmix(pixel, bg, alpha):
    """Recover the shape colour from an edge pixel that was blended with the background."""
    return tuple(round(min(255, max(0, b + (p - b) / alpha))) for p, b in zip(pixel, bg))


def clear_background(image):
    rgb = image.convert("RGB")
    out = Image.new("RGBA", rgb.size)
    pixels = []
    for pixel in rgb.get_flattened_data():
        bg = min(BACKGROUNDS, key=lambda b: distance(pixel, b))
        alpha = (distance(pixel, bg) - CLEAR_BELOW) / (SOLID_FROM - CLEAR_BELOW)
        alpha = min(1.0, max(0.0, alpha))
        colour = unmix(pixel, bg, alpha) if alpha > 0 else (0, 0, 0)
        pixels.append((*colour, round(alpha * 255)))
    out.putdata(pixels)
    return out.crop(out.getbbox())


def fit_height(image, height):
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.LANCZOS)


def fit_square(image, size, pad):
    inner = size - 2 * pad
    image = image.copy()
    image.thumbnail((inner, inner), Image.LANCZOS)
    square = Image.new("RGBA", (size, size))
    square.paste(image, ((size - image.width) // 2, (size - image.height) // 2))
    return square


def main():
    logo = clear_background(Image.open(HERE / "rehabit-logo.png"))
    fit_height(logo, LOGO_HEIGHT).save(PUBLIC / "logo.png", optimize=True)

    # Only the hand, without the rounded tile, so it stays readable at tab size.
    icon = clear_background(Image.open(HERE / "rehabit-icon.png"))
    fit_square(icon, FAVICON_SIZE, FAVICON_PAD).save(PUBLIC / "favicon.png", optimize=True)


if __name__ == "__main__":
    main()
