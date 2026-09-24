"""Generate the lab app icons (192 / 512 / 1024 any, 1024 maskable).

WebSpatial's minimal-PWA doc asks for a 1024x1024 icon with an opaque background and
no rounded corners (PICO OS 6 and visionOS mask it themselves). One design, four sizes:
a black field (--pico-bg), a violet glow (--pico-accent-fill #4200ff), and two offset
panels, the second one "lifted" the way enable-xr + --xr-back lifts an element.
Run once: python make-icons.py  (Pillow). Output is committed, so attendees never run it.
"""
from PIL import Image, ImageDraw, ImageFilter

BG, VIOLET, GLOW, INK = (0, 0, 0), (66, 0, 255), (163, 147, 255), (255, 255, 255)


def icon(size: int, safe: float) -> Image.Image:
    s = size
    img = Image.new("RGB", (s, s), BG)
    glow = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(glow)
    r = int(s * 0.42)
    d.ellipse((s // 2 - r, s // 2 - r, s // 2 + r, s // 2 + r), fill=VIOLET)
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(s * 0.12)), 0.85)
    d = ImageDraw.Draw(img)
    inset = s * (1 - safe) / 2
    w = (s - 2 * inset)
    # back panel (the page)
    x0, y0 = inset + w * 0.12, inset + w * 0.22
    d.rounded_rectangle((x0, y0, x0 + w * 0.56, y0 + w * 0.46), radius=w * 0.05,
                        outline=GLOW, width=max(2, int(s * 0.012)))
    # front panel (the lifted card)
    x1, y1 = inset + w * 0.32, inset + w * 0.38
    d.rounded_rectangle((x1, y1, x1 + w * 0.56, y1 + w * 0.46), radius=w * 0.05, fill=INK)
    d.rounded_rectangle((x1 + w * 0.07, y1 + w * 0.09, x1 + w * 0.36, y1 + w * 0.14),
                        radius=w * 0.02, fill=VIOLET)
    d.rounded_rectangle((x1 + w * 0.07, y1 + w * 0.2, x1 + w * 0.46, y1 + w * 0.24),
                        radius=w * 0.02, fill=(200, 200, 210))
    return img


if __name__ == "__main__":
    for size, name, safe in [(192, "icon-192.png", 0.9), (512, "icon-512.png", 0.9),
                             (1024, "icon-1024.png", 0.9), (1024, "icon-1024-maskable.png", 0.7)]:
        icon(size, safe).save(f"icons/{name}", optimize=True)
        print("wrote", name)
